import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../../../shared/schemas/entities/payment.entity';
import { Order } from '../../../shared/schemas/entities/order.entity';
import { HttpService } from '@nestjs/axios';
import { OrderStatus } from '../../../common/enums/order-status.enum';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { lookup } from 'dns/promises';

@Injectable()
export class MomoService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  private getBool(env?: string) {
    return env === 'true' || env === '1';
  }

  async createMomoPayment(orderId: string, amount: number, orderInfo = 'Payment', extraData = ''): Promise<{ payUrl: string | null; momoResponse: any }> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    const partnerCode = this.configService.get<string>('MOMO_PARTNER_CODE');
    const accessKey = this.configService.get<string>('MOMO_ACCESS_KEY');
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
    const requestEndpoint = this.configService.get<string>('MOMO_API_ENDPOINT');

    const returnUrl =
      this.configService.get<string>('MOMO_RETURN_URL') ||
      this.configService.get<string>('MOMO_REDIRECT_URL') ||
      (this.configService.get<string>('APP_URL') ? `${this.configService.get<string>('APP_URL')}/payments/success` : undefined);
    const notifyUrl =
      this.configService.get<string>('MOMO_NOTIFY_URL') ||
      this.configService.get<string>('MOMO_IPN_URL') ||
      (this.configService.get<string>('APP_URL') ? `${this.configService.get<string>('APP_URL')}/payments/momo/notify` : undefined);

    if (!partnerCode || !accessKey || !secretKey || !requestEndpoint) {
      throw new BadRequestException('Momo configuration missing in environment variables');
    }

    const requestType = this.configService.get<string>('MOMO_REQUEST_TYPE') || 'payWithMethod';
    const lang = this.configService.get<string>('MOMO_LANG') || 'vi';
    const autoCapture = this.getBool(this.configService.get<string>('MOMO_AUTO_CAPTURE'));
    const partnerName = this.configService.get<string>('MOMO_PARTNER_NAME') || 'Partner';
    const storeId = this.configService.get<string>('MOMO_STORE_ID') || 'Store';
    const orderGroupId = this.configService.get<string>('MOMO_ORDER_GROUP_ID') || '';

    const requestId = `${partnerCode}-${Date.now()}`;
    const orderIdForMomo = orderId;
    const amountStr = String(Math.round(amount));

  // signature format required by Momo sandbox (observed):
  // accessKey={accessKey}&amount={amount}&extraData={extraData}&ipnUrl={ipnUrl}&orderId={orderId}&orderInfo={orderInfo}&partnerCode={partnerCode}&redirectUrl={redirectUrl}&requestId={requestId}&requestType={requestType}
  const rawSignature = `accessKey=${accessKey}&amount=${amountStr}&extraData=${extraData}&ipnUrl=${notifyUrl}&orderId=${orderIdForMomo}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', secretKey).update(rawSignature).digest('hex');

    const body = {
      partnerCode,
      partnerName,
      storeId,
      requestId,
      amount: amountStr,
      orderId: orderIdForMomo,
      orderInfo,
      returnUrl,
      notifyUrl,
      // aliases (some samples expect these)
      redirectUrl: returnUrl,
      ipnUrl: notifyUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      orderGroupId,
      signature,
    } as any;

    const debug = this.configService.get<string>('MOMO_DEBUG') === 'true' || process.env.NODE_ENV !== 'production';

    try {
      const url = new URL(requestEndpoint);
      await lookup(url.hostname);
    } catch (err) {
      throw new BadRequestException(`Unable to resolve Momo host for endpoint ${requestEndpoint}. Check your network/DNS or MOMO_API_ENDPOINT value.`);
    }

    let resp: any;
    try {
      if (debug) console.log('[MomoService] Request body:', JSON.stringify({ ...body, signature: '***' }));
      resp = await this.httpService.axiosRef.post(requestEndpoint, body, { headers: { 'Content-Type': 'application/json' }, timeout: 10000 });
      if (debug) console.log('[MomoService] Response status:', resp.status, 'data:', resp.data);
    } catch (err: any) {
      const status = err?.response?.status;
      const respData = err?.response?.data;
      const msg = err?.message || 'Unknown network error when calling Momo';
      if (debug) console.error('[MomoService] Error calling Momo API:', msg, 'status:', status, 'response:', respData);
      if (respData) {
        throw new BadRequestException(`Failed to call Momo API: Request failed with status code ${status}. Response: ${JSON.stringify(respData)}`);
      }
      throw new BadRequestException(`Failed to call Momo API: ${msg}`);
    }

    if (!resp || !resp.data) throw new BadRequestException('Invalid response from Momo');

    const payUrl = resp.data.payUrl || resp.data.payUrl || null;

    // Create payment record
    const payment = this.paymentRepo.create({
      orderId,
      paymentMethod: 'MOMO',
      status: 'PENDING',
      paymentTime: new Date(),
    } as Partial<Payment>);
    await this.paymentRepo.save(payment);

    return { payUrl, momoResponse: resp.data };
  }

  verifyMomoSignature(payload: any): boolean {
    const secretKey = this.configService.get<string>('MOMO_SECRET_KEY');
    if (!secretKey) return false;

    const {
      partnerCode,
      accessKey,
      requestId,
      orderId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      extraData,
      signature,
    } = payload;

    const raw = Object.entries({ partnerCode, accessKey, requestId, orderId, amount, orderInfo, orderType, transId, resultCode, message, payType, extraData })
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${k}=${v}`)
      .join('&');

    const expected = crypto.createHmac('sha256', secretKey).update(raw).digest('hex');
    return expected === signature;
  }

  async handleMomoNotify(payload: any, skipVerify = false): Promise<{ success: boolean }> {
    try {
      const debug = this.configService.get<string>('MOMO_DEBUG') === 'true';
      
      if (debug) {
        console.log('=== MOMO IPN RECEIVED ===');
        console.log('Payload:', JSON.stringify(payload, null, 2));
        console.log('SkipVerify:', skipVerify);
      }
      
      // Only allow skipVerify in debug mode
      if (!skipVerify || !debug) {
        const ok = this.verifyMomoSignature(payload);
        if (!ok) {
          if (debug) console.log('[MomoService] Signature verification failed');
          return { success: false };
        }
      } else if (debug) {
        console.log('[MomoService] Skipping signature verification (debug mode)');
      }

      const orderId = payload.orderId;
      const resultCode = Number(payload.resultCode);

      if (!orderId) {
        if (debug) console.log('[MomoService] Missing orderId in payload');
        return { success: false };
      }

      const payments = await this.paymentRepo.find({ where: { orderId } });
      
      if (debug) console.log(`[MomoService] Found ${payments.length} payment(s) for orderId: ${orderId}`);
      
      const status = resultCode === 0 ? 'COMPLETED' : 'FAILED';
      for (const p of payments) {
        if (debug) console.log(`[MomoService] Updating payment ${p.id}: ${p.status} -> ${status}`);
        p.status = status;
        p.paymentTime = new Date();
        await this.paymentRepo.save(p);
        if (debug) console.log(`[MomoService] Payment ${p.id} updated successfully`);
      }

      if (resultCode === 0) {
        const order = await this.orderRepo.findOne({ where: { id: orderId } });
        if (order) {
          if (debug) console.log(`[MomoService] Updating order ${order.id}: ${order.status} -> ${OrderStatus.PAID}`);
          order.status = OrderStatus.PAID;
          await this.orderRepo.save(order);
          if (debug) console.log(`[MomoService] Order ${order.id} updated successfully`);
        } else {
          if (debug) console.log(`[MomoService] Order not found: ${orderId}`);
        }
      }

      if (debug) console.log('[MomoService] IPN processed successfully:', { orderId, resultCode, status });
      return { success: true };
    } catch (err) {
      const debug = this.configService.get<string>('MOMO_DEBUG') === 'true';
      if (debug) console.error('[MomoService] Error handling IPN:', err);
      return { success: false };
    }
  }
}

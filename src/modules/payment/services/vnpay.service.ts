import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { firstValueFrom } from 'rxjs';
@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);

  private vnp_TmnCode: string;
  private vnp_HashSecret: string;
  private vnp_Url: string;
  private vnp_ReturnUrl: string;

  constructor(private configService: ConfigService, private http: HttpService) {
    this.vnp_TmnCode = this.requireConfig('vnp_TmnCode', 'VNP_TMN_CODE');
    this.vnp_HashSecret = this.requireConfig('vnp_HashSecret', 'VNP_HASH_SECRET');
    this.vnp_Url = this.requireConfig('vnp_Url', 'VNP_URL');
    this.vnp_ReturnUrl = this.requireConfig('vnp_ReturnUrl', 'VNP_RETURN_URL');
  }

  private requireConfig(key1: string, alt?: string): string {
    const v = this.configService.get<string>(key1) ?? (alt ? this.configService.get<string>(alt) : undefined);
    if (!v) throw new Error(`Missing environment variable: ${key1}${alt ? ` or ${alt}` : ''}`);
    return v;
  }

  private formatDate(date: Date = new Date()): string {
    const pad = (n: number) => (n < 10 ? '0' + n : '' + n);
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    );
  }

  private sortObject(obj: Record<string, any>): Record<string, string> {
    const sorted: Record<string, string> = {};
    const str: string[] = [];
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let i = 0; i < str.length; i++) {
      const k = str[i];
      const originalKey = decodeURIComponent(k);
      let rawVal = obj[originalKey];
      if (rawVal === undefined || rawVal === null) rawVal = '';
      const encodedVal = encodeURIComponent(String(rawVal)).replace(/%20/g, '+');
      sorted[k] = encodedVal;
    }
    return sorted;
  }

  async createPaymentUrl(paramsIn: { amount: number; orderId: string; ipAddr?: string; bankCode?: string; locale?: string; }): Promise<string> {
    const date = new Date();
    const createDate = this.formatDate(date);
    const ipAddr = paramsIn.ipAddr || '127.0.0.1';
    const locale = paramsIn.locale || 'vn';

    const vnp_Params: Record<string, any> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: locale,
      vnp_CurrCode: 'VND',
      vnp_TxnRef: paramsIn.orderId,
      vnp_OrderInfo: `Thanh toan cho ma GD:${paramsIn.orderId}`,
      vnp_OrderType: 'other',
      vnp_Amount: paramsIn.amount * 100,
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: createDate
    };
    if (paramsIn.bankCode) vnp_Params['vnp_BankCode'] = paramsIn.bankCode;

    const vnpSorted = this.sortObject(vnp_Params);
    const signData = qs.stringify(vnpSorted, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');
    vnpSorted['vnp_SecureHash'] = signed;
    const query = qs.stringify(vnpSorted, { encode: false });

    return `${this.vnp_Url}?${query}`;
  }

  async handleReturn(query: Record<string, any>) {
    const secureHash = query['vnp_SecureHash'];
    if (!secureHash) throw new BadRequestException('Không có vnp_SecureHash');

    const data: Record<string, any> = {};
    Object.keys(query).forEach((k) => {
      if (k !== 'vnp_SecureHash' && k !== 'vnp_SecureHashType') data[k] = query[k];
    });

    const toSign = this.sortObject(data);
    const signData = qs.stringify(toSign, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    if (signed !== secureHash) throw new BadRequestException('Sai chữ ký VNPAY');

    return {
      orderId: data['vnp_TxnRef'],
      amount: data['vnp_Amount'] ? Number(data['vnp_Amount']) / 100 : undefined,
      responseCode: data['vnp_ResponseCode'],
      transactionNo: data['vnp_TransactionNo'],
      raw: data,
    };
  }

  async handleIpn(query: Record<string, any>) {
    try {
      const r = await this.handleReturn(query);
      return { RspCode: '00', Message: 'Success', data: r };
    } catch (err) {
      this.logger.warn('IPN invalid signature', err);
      return { RspCode: '97', Message: 'Checksum failed' };
    }
  }

  /** QueryDR - return payload only, no external API call */
  querydr(payload: { orderId: string; transDate: string; }) {
    const date = new Date();
    const vnp_RequestId = this.formatDate(date).slice(8); // HHmmss
    const vnp_Version = '2.1.0';
    const vnp_Command = 'querydr';
    const vnp_OrderInfo = `Truy van GD ma:${payload.orderId}`;
    const vnp_IpAddr = '127.0.0.1';
    const vnp_CreateDate = this.formatDate(date);

    const data = [
      vnp_RequestId,
      vnp_Version,
      vnp_Command,
      this.vnp_TmnCode,
      payload.orderId,
      payload.transDate,
      vnp_CreateDate,
      vnp_IpAddr,
      vnp_OrderInfo,
    ].join('|');

    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

    return {
      vnp_RequestId,
      vnp_Version,
      vnp_Command,
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_TxnRef: payload.orderId,
      vnp_OrderInfo,
      vnp_TransactionDate: payload.transDate,
      vnp_CreateDate,
      vnp_IpAddr,
      vnp_SecureHash,
    };
  }

  /** Refund - return payload only, no external API call */
  refund(payload: { orderId: string; transDate: string; amount: number; transType: string; user: string; }) {
    const date = new Date();
    const vnp_RequestId = this.formatDate(date).slice(8); // HHmmss
    const vnp_Version = '2.1.0';
    const vnp_Command = 'refund';
    const vnp_OrderInfo = `Hoan tien GD ma:${payload.orderId}`;
    const vnp_IpAddr = '127.0.0.1';
    const vnp_CreateDate = this.formatDate(date);
    const vnp_TransactionNo = '0';
    const vnp_Amount = payload.amount * 100;

    const data = [
      vnp_RequestId,
      vnp_Version,
      vnp_Command,
      this.vnp_TmnCode,
      payload.transType,
      payload.orderId,
      vnp_Amount,
      vnp_TransactionNo,
      payload.transDate,
      payload.user,
      vnp_CreateDate,
      vnp_IpAddr,
      vnp_OrderInfo,
    ].join('|');

    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const vnp_SecureHash = hmac.update(Buffer.from(data, 'utf-8')).digest('hex');

    return {
      vnp_RequestId,
      vnp_Version,
      vnp_Command,
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_TransactionType: payload.transType,
      vnp_TxnRef: payload.orderId,
      vnp_Amount,
      vnp_TransactionNo,
      vnp_CreateBy: payload.user,
      vnp_OrderInfo,
      vnp_TransactionDate: payload.transDate,
      vnp_CreateDate,
      vnp_IpAddr,
      vnp_SecureHash,
    };
  }
}

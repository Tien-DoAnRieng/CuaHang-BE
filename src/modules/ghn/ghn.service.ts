import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { CalculateGhnFeeByNameDto, CalculateGhnFeeDto } from './dto/calculate-fee.dto';

@Injectable()
export class GhnService {
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly shopId: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.baseUrl = (this.configService.get<string>('GHN_BASE_URL') ||
      'https://online-gateway.ghn.vn/shiip/public-api').replace(/\/$/, '');
    this.token = this.configService.getOrThrow<string>('GHN_TOKEN');
    this.shopId = Number(this.configService.getOrThrow<string>('GHN_SHOP_ID'));
  }

  async getProvinces() {
    return this.request('/master-data/province', 'get');
  }

  async getDistricts(provinceId: number) {
    return this.request('/master-data/district', 'post', { province_id: provinceId });
  }

  async getWards(districtId: number) {
    return this.request('/master-data/ward', 'post', { district_id: districtId });
  }

  async calculateFee(dto: CalculateGhnFeeDto) {
    const fromDistrictId = Number(this.configService.get<string>('GHN_FROM_DISTRICT_ID'));
    const fromWardCode = this.configService.get<string>('GHN_FROM_WARD_CODE');

    if (!fromDistrictId || !fromWardCode) {
      throw new BadGatewayException('GHN shop address is not configured');
    }

    return this.request('/v2/shipping-order/fee', 'post', {
      shop_id: this.shopId,
      from_district_id: fromDistrictId,
      from_ward_code: fromWardCode,
      service_type_id: 2,
      to_district_id: dto.toDistrictId,
      to_ward_code: dto.toWardCode,
      weight: dto.weight,
      length: dto.length,
      width: dto.width,
      height: dto.height,
      insurance_value: dto.insuranceValue,
    });
  }

  async calculateFeeByName(dto: CalculateGhnFeeByNameDto) {
    const provinces: any[] = await this.getProvinces();
    const province = this.findByName(provinces, dto.province);
    if (!province) throw new BadGatewayException(`GHN province not found: ${dto.province}`);

    const districts: any[] = await this.getDistricts(province.ProvinceID);
    const district = this.findByName(districts, dto.district);
    if (!district) throw new BadGatewayException(`GHN district not found: ${dto.district}`);

    const wards: any[] = await this.getWards(district.DistrictID);
    const ward = this.findByName(wards, dto.ward);
    if (!ward) throw new BadGatewayException(`GHN ward not found: ${dto.ward}`);

    const fee = await this.calculateFee({
      toDistrictId: district.DistrictID,
      toWardCode: ward.WardCode,
      weight: dto.weight,
    });
    return { ...fee, toDistrictId: district.DistrictID, toWardCode: ward.WardCode };
  }

  async createOrder(payload: Record<string, unknown>) {
    return this.request('/v2/shipping-order/create', 'post', payload);
  }

  private findByName(items: any[], value: string) {
    const wanted = this.normalizeName(value);
    return items.find((item) => this.normalizeName(item.ProvinceName || item.DistrictName || item.WardName) === wanted)
      || items.find((item) => this.normalizeName(item.ProvinceName || item.DistrictName || item.WardName).includes(wanted));
  }

  private normalizeName(value: string) {
    const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
      .replace(/(tinh|thanh pho|tp\.?|quan|huyen|thi xa|phuong|xa|thi tran)\s+/g, '')
      .replace(/[^a-z0-9]/g, '');
    if (['tphcm', 'hcm', 'hochiminh', 'thanhphohochiminh'].includes(normalized)) return 'hochiminh';
    return normalized;
  }

  private async request(path: string, method: 'get' | 'post', data?: unknown) {
    try {
      const response = method === 'get'
        ? await this.httpService.axiosRef.get(`${this.baseUrl}${path}`, {
            headers: { Token: this.token, ShopId: String(this.shopId) },
          })
        : await this.httpService.axiosRef.post(`${this.baseUrl}${path}`, data, {
            headers: { Token: this.token, ShopId: String(this.shopId), 'Content-Type': 'application/json' },
          });

      if (response.data?.code !== 200) {
        throw new Error(response.data?.message || 'GHN request failed');
      }

      return response.data.data;
    } catch (error: any) {
      throw new BadGatewayException(`GHN request failed: ${error?.message || 'unknown error'}`);
    }
  }
}
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Cart } from '../../shared/schemas/entities/cart.entity';
import { CartItem } from '../../shared/schemas/entities/cart-item.entity';
import { ProductVariant } from '../../shared/schemas/entities/product-variant.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly itemRepo: Repository<CartItem>,
    @InjectRepository(ProductVariant) private readonly variantRepo: Repository<ProductVariant>,
  ) {}

  async getUserCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.variant', 'items.variant.product', 'items.variant.product.images', 'items.variant.color', 'items.variant.size'],
    });
    if (!cart) {
      cart = this.cartRepo.create({ userId });
      await this.cartRepo.save(cart);
    }

    return cart;
  }
  async checkAvailability(userId: string) {
    const cart = await this.getUserCart(userId);
    const items = cart.items || [];

    if (items.length === 0) return { ok: true, items: [] };

    const variantIds = items.map(i => i.variantId);
    const variants = await this.variantRepo.find({ where: { id: In(variantIds) }, relations: ['product'] });
    const variantMap = new Map(variants.map(v => [v.id, v]));

    const results = items.map(it => {
      const v = variantMap.get(it.variantId);
      if (!v) {
        return { variantId: it.variantId, requested: it.quantity, available: 0, ok: false, message: 'Variant not found' };
      }
      const available = v.stockQuantity ?? 0;
      const ok = available >= it.quantity && (v.product ? v.product.status === 'ACTIVE' : true);
      const message = ok ? 'OK' : (available <= 0 ? 'Out of stock' : `Only ${available} available`);
      return {
        variantId: it.variantId,
        requested: it.quantity,
        available,
        ok,
        productId: v.productId || (v.product ? v.product.id : null),
        productName: v.product ? v.product.name : null,
        message,
      };
    });

    const overallOk = results.every(r => r.ok);
    return { ok: overallOk, items: results };
  }

  async addItem(userId: string, variantId: string, quantity: number) {
    const cart = await this.getUserCart(userId);

    let item = await this.itemRepo.findOne({
      where: { cartId: cart.id, variantId },
    });

    if (item) {
      item.quantity += quantity;
    } else {
      item = this.itemRepo.create({
        cartId: cart.id,
        variantId,
        quantity,
      });
    }

    return this.itemRepo.save(item);
  }

  async updateItem(userId: string, variantId: string, quantity: number) {
    const cart = await this.getUserCart(userId);

    const item = await this.itemRepo.findOne({
      where: { cartId: cart.id, variantId },
    });

    if (!item) throw new NotFoundException('Item not found in cart');

    item.quantity = quantity;
    return this.itemRepo.save(item);
  }

  async removeItem(userId: string, variantId: string) {
    const cart = await this.getUserCart(userId);
    await this.itemRepo.delete({ cartId: cart.id, variantId });
    return { message: 'Item removed successfully' };
  }

  async clearCart(userId: string) {
    const cart = await this.getUserCart(userId);
    await this.itemRepo.delete({ cartId: cart.id });
    return { message: 'Cart cleared successfully' };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../../shared/schemas/entities/cart.entity';
import { CartItem } from '../../shared/schemas/entities/cart-item.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart) private readonly cartRepo: Repository<Cart>,
    @InjectRepository(CartItem) private readonly itemRepo: Repository<CartItem>,
  ) {}

  async getUserCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId },
      relations: ['items', 'items.variant'],
    });

    // Nếu chưa có giỏ hàng thì tạo mới
    if (!cart) {
      cart = this.cartRepo.create({ userId });
      await this.cartRepo.save(cart);
    }

    return cart;
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

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatMessage } from '../../shared/schemas/chat-message.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { Product } from '../../shared/schemas/entities/product.entity';
import { OrderItem } from '../../shared/schemas/entities/order-item.entity';
import { FlashSale } from '../../shared/schemas/entities/flash-sale.entity';
import { FlashSaleItem } from '../../shared/schemas/entities/flash-sale-item.entity';
import { Faq } from '../../shared/schemas/entities/faq.entity';
import { AiConfig } from '../../shared/schemas/entities/ai-config.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, User, Product, OrderItem, FlashSale, FlashSaleItem, Faq, AiConfig])],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService],
})
export class ChatModule {}

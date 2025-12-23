import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage } from '../../shared/schemas/chat-message.entity';
import { User } from '../../shared/schemas/entities/user.entity';
import { v2 as cloudinary } from 'cloudinary';
const streamifier = require('streamifier');

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepo: Repository<ChatMessage>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // User gửi tin nhắn
  async sendMessage(userId: string, message: string, imageUrl?: string) {
    console.log('sendMessage called with userId:', userId, 'message:', message, 'imageUrl:', imageUrl);
    
    const chatMessage = this.chatMessageRepo.create({
      userId,
      message,
      imageUrl,
      sender: 'user',
      isRead: false,
    });

    console.log('Created chat message:', chatMessage);
    const saved = await this.chatMessageRepo.save(chatMessage);
    console.log('Saved chat message:', saved);
    return { message: 'Tin nhắn đã được gửi', data: saved };
  }

  // Admin reply tin nhắn
  async adminReply(userId: string, message: string, imageUrl?: string) {
    const chatMessage = this.chatMessageRepo.create({
      userId,
      message,
      imageUrl,
      sender: 'admin',
      isRead: false,
    });

    await this.chatMessageRepo.save(chatMessage);
    return { message: 'Phản hồi đã được gửi', data: chatMessage };
  }

  // Lấy lịch sử chat của 1 user
  async getChatHistory(userId: string) {
    const messages = await this.chatMessageRepo.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return messages;
  }

  // Admin: Lấy danh sách tất cả conversations (grouped by user)
  async getAllConversations() {
    const rawMessages = await this.chatMessageRepo
      .createQueryBuilder('msg')
      .leftJoin('msg.user', 'user')
      .select('msg.userId', 'userId')
      .addSelect('user.name', 'userName')
      .addSelect('user.email', 'userEmail')
      .addSelect('MAX(msg.createdAt)', 'lastMessageAt')
      .addSelect('COUNT(CASE WHEN msg.sender = \'user\' AND msg.isRead = false THEN 1 END)', 'unreadCount')
      .groupBy('msg.userId')
      .addGroupBy('user.name')
      .addGroupBy('user.email')
      .orderBy('lastMessageAt', 'DESC')
      .getRawMany();

    return rawMessages;
  }

  // Đánh dấu tin nhắn đã đọc
  async markAsRead(userId: string) {
    await this.chatMessageRepo.update(
      { userId, sender: 'user', isRead: false },
      { isRead: true },
    );
    return { message: 'Đã đánh dấu tin nhắn là đã đọc' };
  }

  // Lấy số lượng tin nhắn chưa đọc (cho admin)
  async getUnreadCount() {
    const count = await this.chatMessageRepo.count({
      where: { sender: 'user', isRead: false },
    });
    return { count };
  }

  // Upload ảnh chat lên Cloudinary
  async uploadChatImage(file: Express.Multer.File): Promise<{ imageUrl: string }> {
    if (!file) {
      throw new Error('No file provided');
    }

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'chat-images',
          resource_type: 'auto',
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else if (result) {
            resolve({ imageUrl: result.secure_url });
          } else {
            reject(new Error('Upload failed'));
          }
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  
}
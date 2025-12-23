import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AdminReplyDto } from './dto/admin-reply.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // User gửi tin nhắn
  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User gửi tin nhắn' })
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    console.log('Chat send - req.user:', req.user);
    console.log('Chat send - userId:', req.user?.id);
    return this.chatService.sendMessage(req.user.id, dto.message, dto.imageUrl);
  }

  // Upload ảnh cho chat (user)
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload ảnh cho chat' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.uploadChatImage(file);
  }

  // User lấy lịch sử chat của mình
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy lịch sử chat của user' })
  async getHistory(@Request() req) {
    return this.chatService.getChatHistory(req.user.id);
  }

  // Admin/Seller: Reply tin nhắn
  @Post('admin/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller phản hồi tin nhắn' })
  async adminReply(@Body() dto: AdminReplyDto) {
    return this.chatService.adminReply(dto.userId, dto.message, dto.imageUrl);
  }

  // Admin/Seller: Lấy danh sách conversations
  @Get('admin/conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller lấy danh sách cuộc trò chuyện' })
  async getConversations() {
    return this.chatService.getAllConversations();
  }

  // Admin/Seller: Lấy lịch sử chat với 1 user cụ thể
  @Get('admin/history/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller lấy lịch sử chat với user' })
  async getAdminHistory(@Param('userId') userId: string) {
    return this.chatService.getChatHistory(userId);
  }

  // Admin/Seller: Đánh dấu đã đọc
  @Post('admin/mark-read/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đánh dấu tin nhắn đã đọc' })
  async markAsRead(@Param('userId') userId: string) {
    return this.chatService.markAsRead(userId);
  }

  // Admin/Seller: Số tin nhắn chưa đọc
  @Get('admin/unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy số tin nhắn chưa đọc' })
  async getUnreadCount() {
    return this.chatService.getUnreadCount();
  }

  // Upload ảnh cho chat (admin/seller)
  @Post('admin/upload-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller upload ảnh cho chat' })
  async adminUploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.uploadChatImage(file);
  }

}

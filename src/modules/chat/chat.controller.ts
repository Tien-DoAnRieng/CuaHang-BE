import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
    return this.chatService.sendMessage(req.user.id, dto.message);
  }

  // User lấy lịch sử chat của mình
  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy lịch sử chat của user' })
  async getHistory(@Request() req) {
    return this.chatService.getChatHistory(req.user.id);
  }

  // Admin: Reply tin nhắn
  @Post('admin/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin phản hồi tin nhắn' })
  async adminReply(@Body() dto: AdminReplyDto) {
    return this.chatService.adminReply(dto.userId, dto.message);
  }

  // Admin: Lấy danh sách conversations
  @Get('admin/conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin lấy danh sách cuộc trò chuyện' })
  async getConversations() {
    return this.chatService.getAllConversations();
  }

  // Admin: Lấy lịch sử chat với 1 user cụ thể
  @Get('admin/history/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin lấy lịch sử chat với user' })
  async getAdminHistory(@Param('userId') userId: string) {
    return this.chatService.getChatHistory(userId);
  }

  // Admin: Đánh dấu đã đọc
  @Post('admin/mark-read/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đánh dấu tin nhắn đã đọc' })
  async markAsRead(@Param('userId') userId: string) {
    return this.chatService.markAsRead(userId);
  }

  // Admin: Số tin nhắn chưa đọc
  @Get('admin/unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy số tin nhắn chưa đọc' })
  async getUnreadCount() {
    return this.chatService.getUnreadCount();
  }

}

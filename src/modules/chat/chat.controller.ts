import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiQuery } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { AdminReplyDto } from './dto/admin-reply.dto';
import { AskAiDto } from './dto/ask-ai.dto';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { UpdateAiConfigDto } from './dto/update-ai-config.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RoleEnum } from '../../common/enums/role.enum';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // ==========================================
  // USER CHAT & AI ENDPOINTS
  // ==========================================
  @Post('send')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User gửi tin nhắn' })
  async sendMessage(@Request() req, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(req.user.id, dto.message, dto.imageUrl);
  }

  @Post('ask-ai')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'User hỏi AI trợ lý về sản phẩm và chính sách' })
  async askAi(@Request() req, @Body() dto: AskAiDto) {
    return this.chatService.askAiAboutProducts(req.user.id, dto.message, dto.productId);
  }

  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload ảnh cho chat' })
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    return this.chatService.uploadChatImage(file);
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy lịch sử chat của user' })
  async getHistory(@Request() req) {
    return this.chatService.getChatHistory(req.user.id);
  }

  // ==========================================
  // ADMIN CONVERSATIONS & HITL
  // ==========================================
  @Post('admin/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller phản hồi tin nhắn' })
  async adminReply(@Body() dto: AdminReplyDto) {
    return this.chatService.adminReply(dto.userId, dto.message, dto.imageUrl);
  }

  @Get('admin/conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller lấy danh sách cuộc trò chuyện' })
  async getConversations() {
    return this.chatService.getAllConversations();
  }

  @Get('admin/ai-conversations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller lấy danh sách hội thoại AI kèm trạng thái Takeover' })
  async getAiConversations() {
    return this.chatService.getAiConversations();
  }

  @Post('admin/takeover/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin bật/tắt tiếp quản (Human-In-The-Loop) cho 1 user' })
  async toggleTakeover(
    @Param('userId') userId: string,
    @Body('isBotMuted') isBotMuted: boolean,
  ) {
    return this.chatService.toggleTakeover(userId, isBotMuted);
  }

  @Get('admin/history/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin/Seller lấy lịch sử chat với user' })
  async getAdminHistory(@Param('userId') userId: string) {
    return this.chatService.getChatHistory(userId);
  }

  @Post('admin/mark-read/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Đánh dấu tin nhắn đã đọc' })
  async markAsRead(@Param('userId') userId: string) {
    return this.chatService.markAsRead(userId);
  }

  @Get('admin/unread-count')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy số tin nhắn chưa đọc' })
  async getUnreadCount() {
    return this.chatService.getUnreadCount();
  }

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

  // ==========================================
  // ADMIN FAQ KNOWLEDGE BASE MANAGEMENT
  // ==========================================
  @Get('admin/faq')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy danh sách FAQ (tri thức shop)' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'search', required: false })
  async getFaqs(@Query('category') category?: string, @Query('search') search?: string) {
    return this.chatService.getAllFaqs(category, search);
  }

  @Post('admin/faq')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Thêm mới FAQ Knowledge Base' })
  async createFaq(@Body() dto: CreateFaqDto) {
    return this.chatService.createFaq(dto);
  }

  @Put('admin/faq/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật FAQ' })
  async updateFaq(@Param('id') id: string, @Body() dto: UpdateFaqDto) {
    return this.chatService.updateFaq(id, dto);
  }

  @Delete('admin/faq/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xóa FAQ' })
  async deleteFaq(@Param('id') id: string) {
    return this.chatService.deleteFaq(id);
  }

  // ==========================================
  // ADMIN AI CONFIG & BUSINESS RULES MANAGEMENT
  // ==========================================
  @Get('admin/ai-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lấy cấu hình AI & Business Rules hiện tại' })
  async getAiConfig() {
    return this.chatService.getAiConfig();
  }

  @Put('admin/ai-config')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RoleEnum.ADMIN, RoleEnum.SELLER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cập nhật cấu hình AI & Business Rules' })
  async updateAiConfig(@Body() dto: UpdateAiConfigDto) {
    return this.chatService.updateAiConfig(dto);
  }
}

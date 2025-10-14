import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MailService } from './mail.service';

@ApiTags('mail')
@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('send')
  @ApiOperation({ summary: 'Send email' })
  @ApiResponse({ status: 200, description: 'Email sent successfully' })
  async sendMail(
    @Body() body: { to: string; subject: string; template: string; context: any }
  ) {
    await this.mailService.sendEmail(body.to, body.subject, body.template, body.context);
    return { message: 'Email sent successfully' };
  }
}

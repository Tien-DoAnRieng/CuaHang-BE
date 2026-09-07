const { Resend } = require('resend');

const resend = new Resend('re_dU5iRR85_6GxesucVzhPde85z46pnLqrN');

async function test() {
  try {
    console.log('Sending test email via Resend API...');
    const data = await resend.emails.send({
      from: 'E-Commerce <onboarding@resend.dev>',
      to: 'bao23910@gmail.com',
      subject: 'Test Email từ Resend API',
      html: '<h2>Chúc mừng!</h2><p>Hệ thống gửi email Resend đã hoạt động thành công 100% qua HTTPS.</p>',
    });
    console.log('✅ Resend success:', data);
  } catch (error) {
    console.error('❌ Resend error:', error);
  }
}

test();

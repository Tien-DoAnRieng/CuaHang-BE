const nodemailer = require('nodemailer');

async function testMail() {
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: 'bao23910@gmail.com',
      pass: 'fkzplffnghqjnjaf'
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  try {
    console.log('🔗 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified!');
    
    const info = await transporter.sendMail({
      from: '"E-Commerce Shop" <bao23910@gmail.com>',
      to: 'bao23910@gmail.com',
      subject: 'Test Email từ Backend',
      html: '<h2>Test thành công!</h2><p>Email gửi qua SMTP Gmail hoạt động bình thường.</p>',
    });
    console.log('✅ Email sent! MessageID:', info.messageId);
    console.log('Response:', info.response);
  } catch (err) {
    console.error('❌ Error:', err.message);
    if (err.responseCode) console.error('Response code:', err.responseCode);
    if (err.response) console.error('SMTP response:', err.response);
    if (err.code) console.error('Error code:', err.code);
  }
}

testMail();

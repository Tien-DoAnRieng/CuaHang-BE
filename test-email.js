// Script test email configuration
require('dotenv').config();
const nodemailer = require('nodemailer');

const port = Number(process.env.MAIL_PORT) || 465;
const secure = process.env.MAIL_SECURE === 'true' || port === 465;

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST || 'smtp.gmail.com',
  port,
  secure,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASSWORD,
  },
  connectionTimeout: 10000,
});

async function testEmail() {
  try {
    console.log('📧 Testing email configuration...');
    console.log('MAIL_HOST:', process.env.MAIL_HOST || 'smtp.gmail.com');
    console.log('MAIL_PORT:', process.env.MAIL_PORT || 587);
    console.log('MAIL_USER:', process.env.MAIL_USER ? '✅ Set' : '❌ Not set');
    console.log('MAIL_PASSWORD:', process.env.MAIL_PASSWORD ? '✅ Set' : '❌ Not set');

    if (!process.env.MAIL_USER || !process.env.MAIL_PASSWORD) {
      console.error('❌ MAIL_USER or MAIL_PASSWORD is not set in .env file');
      return;
    }

    // Verify connection
    await transporter.verify();
    console.log('✅ SMTP connection verified');

    // Send test email
    const info = await transporter.sendMail({
      from: `"E-Commerce Admin" <${process.env.MAIL_USER}>`,
      to: process.env.MAIL_USER, // Send to yourself for testing
      subject: 'Test Email - Order Status Update',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email to verify email configuration.</p>
        <p>If you receive this, your email setup is working correctly.</p>
      `,
    });

    console.log('✅ Test email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error('Message:', error.message);
    console.error('Code:', error.code);
    if (error.response) {
      console.error('SMTP Response:', error.response);
    }
  }
}

testEmail();


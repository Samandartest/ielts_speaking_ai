const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

const sendVerificationCode = async (toEmail, code) => {
  await transporter.sendMail({
    from: `"IELTS Speaking AI" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Email tasdiqlash kodi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #1d4ed8; margin-bottom: 8px;">🎤 IELTS Speaking AI</h2>
        <p style="color: #374151;">Ro'yxatdan o'tish uchun tasdiqlash kodingiz:</p>
        <div style="background: #fff; border: 2px solid #1d4ed8; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1d4ed8;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Kod 10 daqiqa davomida amal qiladi.</p>
        <p style="color: #6b7280; font-size: 14px;">Agar siz ro'yxatdan o'tmagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
      </div>
    `,
  });
};

const sendPasswordResetCode = async (toEmail, code) => {
  await transporter.sendMail({
    from: `"IELTS Speaking AI" <${process.env.GMAIL_USER}>`,
    to: toEmail,
    subject: 'Parolni tiklash kodi',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9fafb; border-radius: 12px;">
        <h2 style="color: #1d4ed8; margin-bottom: 8px;">🎤 IELTS Speaking AI</h2>
        <p style="color: #374151;">Parolni tiklash uchun kodingiz:</p>
        <div style="background: #fff; border: 2px solid #ef4444; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ef4444;">${code}</span>
        </div>
        <p style="color: #6b7280; font-size: 14px;">Kod 10 daqiqa davomida amal qiladi.</p>
        <p style="color: #6b7280; font-size: 14px;">Agar siz parol tiklashni so'ramagan bo'lsangiz, bu xabarni e'tiborsiz qoldiring.</p>
      </div>
    `,
  });
};

module.exports = { sendVerificationCode, sendPasswordResetCode };
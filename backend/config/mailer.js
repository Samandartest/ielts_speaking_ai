const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const sendVerificationCode = async (toEmail, code) => {
  await resend.emails.send({
    from: 'no-reply@speakingai.me',
    to: toEmail,
    subject: 'Email tasdiqlash kodi',
    html: `<h1>${code}</h1>`,
  });
};

const sendPasswordResetCode = async (toEmail, code) => {
  await resend.emails.send({
    from: 'no-reply@speakingai.me',
    to: toEmail,
    subject: 'Parolni tiklash kodi',
    html: `<h1>${code}</h1>`,
  });
};

module.exports = { sendVerificationCode, sendPasswordResetCode };

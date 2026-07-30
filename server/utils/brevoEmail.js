const axios = require('axios');

const sendResetPasswordEmail = async (toEmail, toName, resetLink) => {
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: {
          name: 'kezar',
          email: process.env.BREVO_SENDER_EMAIL
        },
        to: [{ email: toEmail, name: toName || toEmail }],
        subject: 'Reset your RentEase password',
        htmlContent: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 24px; color: #2C2420;">
            <h2 style="color: #5D4037;">Reset your password</h2>
            <p>Hi ${toName || 'there'},</p>
            <p>We received a request to reset your RentEase account password. Click the button below to set a new password. This link is valid for 1 hour.</p>
            <a href="${resetLink}" style="display:inline-block; background-color:#5D4037; color:#fff; padding:12px 24px; border-radius:8px; text-decoration:none; font-weight:600; margin: 16px 0;">
              Reset Password
            </a>
            <p style="font-size: 0.85rem; color: #8D7B6F;">If you didn't request this, you can safely ignore this email.</p>
            <p style="font-size: 0.8rem; color: #8D7B6F; word-break: break-all;">Or copy this link: ${resetLink}</p>
          </div>
        `
      },
      {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }
    );
    return true;
  } catch (err) {
    console.error('Brevo email error:', err.response?.data || err.message);
    throw new Error('Failed to send reset email');
  }
};

module.exports = { sendResetPasswordEmail };
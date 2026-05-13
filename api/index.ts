import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Generate an HMAC hash of the OTP and expiration to verify statelessly
function generateHash(email: string, otp: string, expires: number) {
  const secret = process.env.OTP_SECRET || 'exza_default_secret_key_123';
  return crypto.createHmac('sha256', secret).update(`${email}:${otp}:${expires}`).digest('hex');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
  const hash = generateHash(email.toLowerCase(), otp, expires);

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Gmail credentials not configured. OTP generated but not sent.');
      // Still return hash so UI can proceed in dev, but warn the user.
    } else {
      await transporter.sendMail({
        from: `"Exza Security" <${process.env.GMAIL_USER}>`,
        to: email,
        subject: 'Exza Network - Verification Code',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0a0a0a; color: #ffffff;">
            <h2 style="color: #d4af37;">Exza Network Verification</h2>
            <p>Your institutional access code is:</p>
            <h1 style="font-size: 32px; letter-spacing: 4px; color: #d4af37; background: #1a1a1a; padding: 10px; text-align: center; border-radius: 8px;">${otp}</h1>
            <p style="color: #888888; font-size: 12px;">This code expires in 10 minutes. Do not share this code with anyone.</p>
          </div>
        `
      });
    }
    res.json({ success: true, message: 'OTP sent successfully', hash, expires });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp, hash, expires } = req.body;
  
  if (!email || !otp || !hash || !expires) {
    return res.status(400).json({ error: 'Missing verification data or session expired' });
  }

  if (Date.now() > expires) {
    return res.status(400).json({ error: 'OTP has expired' });
  }

  const expectedHash = generateHash(email.toLowerCase(), otp, expires);

  if (expectedHash !== hash) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  res.json({ success: true, message: 'Email verified successfully' });
});

export default app;

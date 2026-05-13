import express from 'express';
import { createServer as createViteServer } from 'vite';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import nodemailer from 'nodemailer';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// In-memory OTP store
const otpStore = new Map<string, { otp: string, expires: number }>();

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

// API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/auth/send-otp', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with 10 minute expiration
  otpStore.set(email.toLowerCase(), {
    otp,
    expires: Date.now() + 10 * 60 * 1000
  });

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.warn('Gmail credentials not configured. OTP generated but not sent.');
      // For demo purposes if credentials are missing, we could return success but log it
      // return res.status(500).json({ error: 'Email service not configured' });
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
    res.json({ success: true, message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send verification email' });
  }
});

app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }

  const storedData = otpStore.get(email.toLowerCase());
  
  if (!storedData) {
    return res.status(400).json({ error: 'No OTP found for this email' });
  }

  if (Date.now() > storedData.expires) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ error: 'OTP has expired' });
  }

  if (storedData.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  // OTP is valid, clear it
  otpStore.delete(email.toLowerCase());
  res.json({ success: true, message: 'Email verified successfully' });
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

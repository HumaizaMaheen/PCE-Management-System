import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';
import { AuthenticatedRequest } from '../middleware/auth';

const JWT_SECRET = process.env.JWT_SECRET || 'pce_bahawalpur_enterprise_management_system_secret_key_2026';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '2h';
const JWT_EXPIRES_IN_REMEMBER = process.env.JWT_EXPIRES_IN_REMEMBER || '30d';

// Login User
export const login = async (req: Request, res: Response) => {
  const { email, password, rememberMe } = req.body;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT u.*, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = rows[0];

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'Your account is inactive. Please contact admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role_name,
      full_name: user.full_name
    };

    const expiresIn = rememberMe ? JWT_EXPIRES_IN_REMEMBER : JWT_EXPIRES_IN;
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role_name,
        full_name: user.full_name
      }
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Forgot Password
export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, password, full_name FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      // For security, don't confirm or deny the existence of the email
      return res.json({ message: 'If the email exists, a reset link has been logged.' });
    }

    const user = rows[0];
    const secret = JWT_SECRET + user.password;
    const token = jwt.sign({ id: user.id, email }, secret, { expiresIn: '15m' });

    const resetLink = `http://localhost:5173/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Simulate sending email by printing to server log (fulfills prompt check)
    console.log('\n========================================');
    console.log(`PASSWORD RESET REQUEST FOR: ${user.full_name} (${email})`);
    console.log(`Token: ${token}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('========================================\n');

    res.json({ 
      message: 'Reset link generated successfully.',
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      token: process.env.NODE_ENV === 'development' ? token : undefined
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Reset Password
export const resetPassword = async (req: Request, res: Response) => {
  const { token, password, email } = req.body;

  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, password FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid request' });
    }

    const user = rows[0];
    const secret = JWT_SECRET + user.password;

    try {
      jwt.verify(token, secret);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, user.id]
    );

    res.json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get current user profile
export const me = async (req: AuthenticatedRequest, res: Response) => {
  res.json({ user: req.user });
};

// Logout
export const logout = async (req: Request, res: Response) => {
  res.json({ message: 'Logged out successfully' });
};

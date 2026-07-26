import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import publicRoutes from './routes/publicRoutes';
import applicationRoutes from './routes/applicationRoutes';
import challanRoutes from './routes/challanRoutes';
import paymentRoutes from './routes/paymentRoutes';
import memberRoutes from './routes/memberRoutes';
import accountingRoutes from './routes/accountingRoutes';
import systemRoutes from './routes/systemRoutes';

import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================================
// Security & Static File Middlewares
// ==========================================
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: true, // Allow frontend origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Serve static uploaded files (CNIC cards, Degree Certificates, WhatsApp Receipts)
const UPLOADS_DIR1 = path.resolve(__dirname, '../../uploads');
const UPLOADS_DIR2 = path.resolve(__dirname, '../uploads');
const UPLOADS_DIR3 = path.resolve(process.cwd(), '../uploads');
const UPLOADS_DIR4 = path.resolve(process.cwd(), './uploads');

app.use('/uploads', express.static(UPLOADS_DIR1));
app.use('/uploads', express.static(UPLOADS_DIR2));
app.use('/uploads', express.static(UPLOADS_DIR3));
app.use('/uploads', express.static(UPLOADS_DIR4));

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate Limiting (Specifically on auth routes to prevent brute-force attacks)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth-related requests per window
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// Route Registration
// ==========================================
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/system', systemRoutes);




// Placeholder Public Home page endpoint
app.get('/', (req: Request, res: Response) => {
  res.json({ 
    message: 'Welcome to Pakistan Chamber of Education (Division Bahawalpur) Management API',
    status: 'Running'
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'An internal server error occurred',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});

// ==========================================
// Server Start
// ==========================================
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});

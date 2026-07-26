import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    full_name: string;
  };
}

const JWT_SECRET = process.env.JWT_SECRET || 'pce_bahawalpur_enterprise_management_system_secret_key_2026';

// 1. Authenticate JWT Middleware
export const authenticateJWT = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization token missing or invalid format' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
      role: string;
      full_name: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token is invalid or expired' });
  }
};

// 2. Authorize Roles (RBAC) Middleware
export const authorizeRoles = (...allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Access denied. Role '${req.user.role}' does not have permission to access this resource.` 
      });
    }

    next();
  };
};

// Permissions Matrix Helper
export const permissions = {
  SUPER_ADMIN: 'Super Admin',
  FINANCE_OFFICER: 'Finance Officer',
  MEMBERSHIP_OFFICER: 'Membership Officer',
  VIEWER: 'Viewer'
};

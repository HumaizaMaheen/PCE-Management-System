import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Middleware to handle validation errors
export const handleValidationErrors = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const loginValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

export const forgotPasswordValidator = [
  body('email')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  handleValidationErrors
];

export const resetPasswordValidator = [
  body('token')
    .notEmpty().withMessage('Reset token is required'),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

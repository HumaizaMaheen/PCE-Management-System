import { body } from 'express-validator';

export const validateApplication = [
  body('full_name')
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters'),

  body('father_husband_name')
    .trim()
    .notEmpty()
    .withMessage('Father or Husband name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Father or Husband name must be between 2 and 100 characters'),

  body('cnic')
    .trim()
    .notEmpty()
    .withMessage('CNIC is required')
    .matches(/^\d{5}-\d{7}-\d{1}$/)
    .withMessage('CNIC must follow the format XXXXX-XXXXXXX-X'),

  body('dob')
    .trim()
    .notEmpty()
    .withMessage('Date of birth is required')
    .isISO8601()
    .withMessage('Date of birth must be a valid date (YYYY-MM-DD)'),

  body('gender')
    .trim()
    .notEmpty()
    .withMessage('Gender is required')
    .isIn(['Male', 'Female', 'Other'])
    .withMessage('Gender must be Male, Female, or Other'),

  body('mobile_no')
    .trim()
    .notEmpty()
    .withMessage('Mobile number is required')
    .matches(/^((\+92)|(0092)|(0))?3\d{9}$/)
    .withMessage('Mobile number must be a valid Pakistani mobile number (e.g., 03001234567)'),

  body('whatsapp_no')
    .trim()
    .notEmpty()
    .withMessage('WhatsApp number is required')
    .matches(/^((\+92)|(0092)|(0))?3\d{9}$/)
    .withMessage('WhatsApp number must be a valid Pakistani mobile number (e.g., 03001234567)'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email address is required')
    .isEmail()
    .withMessage('Must be a valid email address')
    .isLength({ max: 100 })
    .withMessage('Email must not exceed 100 characters'),

  body('qualification')
    .trim()
    .notEmpty()
    .withMessage('Qualification is required')
    .isLength({ max: 100 }),

  body('institute')
    .trim()
    .notEmpty()
    .withMessage('Passing Institute is required')
    .isLength({ max: 150 }),

  body('passing_year')
    .notEmpty()
    .withMessage('Passing year is required')
    .isInt({ min: 1950, max: new Date().getFullYear() + 1 })
    .withMessage('Passing year must be a valid year'),

  body('occupation_designation')
    .trim()
    .notEmpty()
    .withMessage('Occupation / Designation is required')
    .isLength({ max: 100 }),

  body('organization_school_name')
    .trim()
    .notEmpty()
    .withMessage('Organization / School name is required')
    .isLength({ max: 150 }),

  body('office_address')
    .trim()
    .notEmpty()
    .withMessage('Office address is required'),

  body('residential_address')
    .trim()
    .notEmpty()
    .withMessage('Residential address is required'),

  body('district')
    .trim()
    .notEmpty()
    .withMessage('District is required')
    .isIn(['Bahawalpur', 'Bahawalnagar', 'Rahim Yar Khan'])
    .withMessage('District must be Bahawalpur, Bahawalnagar, or Rahim Yar Khan'),

  body('tehsil')
    .trim()
    .notEmpty()
    .withMessage('Tehsil is required')
    .isLength({ max: 50 }),

  body('terms_accepted')
    .custom((value) => {
      // It can be passed as string 'true' or boolean true from FormData
      if (value === true || value === 'true' || value === 1 || value === '1') {
        return true;
      }
      throw new Error('You must accept the terms and conditions');
    })
];

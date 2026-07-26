import { Request, Response } from 'express';
import pool from '../config/db';
import { RowDataPacket } from 'mysql2';

// Get public organization configurations and stats
export const getPublicSettings = async (req: Request, res: Response) => {
  try {
    const keys = [
      'org_name',
      'division_name',
      'org_logo_path',
      'org_email',
      'org_phone',
      'org_address',
      'stat_total_members',
      'stat_provinces_covered',
      'stat_institutions',
      'stat_years_of_service'
    ];

    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT setting_key, setting_value FROM settings WHERE setting_key IN (?)',
      [keys]
    );

    const settings: Record<string, string> = {
      org_name: 'Pakistan Chamber of Education',
      division_name: 'Bahawalpur Division',
      org_logo_path: '/uploads/settings/pce_logo.png',
      org_email: 'info@pce.org.pk',
      org_phone: '+92 62 1234567',
      org_address: 'PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan',
      stat_total_members: '1,200+',
      stat_provinces_covered: '4',
      stat_institutions: '350+',
      stat_years_of_service: '10+'
    };

    rows.forEach((row) => {
      settings[row.setting_key] = row.setting_value;
    });

    res.json({ settings });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Internal server error while fetching public settings', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

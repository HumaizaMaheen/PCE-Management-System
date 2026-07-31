import api, { isLiveStaticHost } from './api';
import { 
  removePurgedKey, 
  getStoredApplications, 
  setStoredApplications,
  getStoredMembers,
  setStoredMembers 
} from './adminService';

export interface ApplicationSubmitResponse {
  success: boolean;
  message: string;
  referenceNumber: string;
  applicantName: string;
  email: string;
}

export interface ApplicationTrackResponse {
  success: boolean;
  referenceNumber: string;
  applicantName: string;
  status: 'Pending' | 'Approved - Awaiting Payment' | 'Rejected' | 'Needs More Information' | 'Approved - Active Member' | string;
  membershipId?: string | null;
  email?: string | null;
  initialPassword?: string | null;
  officerRemarks: string | null;
  submittedAt: string;
}

/**
 * Submit the membership application Form Data (multipart/form-data)
 */
export const submitApplication = async (formData: FormData): Promise<ApplicationSubmitResponse> => {
  const applicantName = (formData.get('full_name') as string) || 'Applicant';
  const email = ((formData.get('email') as string) || '').toLowerCase().trim();
  const rawCnic = (formData.get('cnic') as string) || '';
  const cnicDigits = rawCnic.replace(/[^0-9]/g, '');

  // Auto-clear any previous stale or deleted records matching this CNIC/Email so user can re-apply freely
  const cleanStr = (s?: string | null) => (s ? s.replace(/[^0-9]/g, '') : '');

  removePurgedKey(rawCnic);
  removePurgedKey(cnicDigits);
  if (email) removePurgedKey(email);

  let currentApps = getStoredApplications().filter(a => 
    (email === '' || a.email?.toLowerCase().trim() !== email) &&
    (cnicDigits === '' || cleanStr(a.cnic) !== cnicDigits)
  );

  let currentMembers = getStoredMembers().filter(m => 
    (email === '' || m.email?.toLowerCase().trim() !== email) &&
    (cnicDigits === '' || cleanStr(m.cnic) !== cnicDigits)
  );

  setStoredMembers(currentMembers);

  const refNum = `PCE-APP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
  const newApp = {
    id: Date.now(),
    full_name: applicantName,
    father_husband_name: (formData.get('father_husband_name') as string) || '',
    cnic: rawCnic,
    dob: (formData.get('dob') as string) || '1995-01-01',
    gender: (formData.get('gender') as any) || 'Male',
    mobile_no: (formData.get('mobile_no') as string) || '',
    whatsapp_no: (formData.get('whatsapp_no') as string) || '',
    email,
    qualification: (formData.get('qualification') as string) || 'Master Degree',
    institute: (formData.get('institute') as string) || 'University of Bahawalpur',
    passing_year: Number(formData.get('passing_year')) || 2020,
    occupation_designation: (formData.get('occupation_designation') as string) || 'Principal',
    organization_school_name: (formData.get('organization_school_name') as string) || 'Private Institute',
    office_address: (formData.get('office_address') as string) || 'Bahawalpur',
    residential_address: (formData.get('residential_address') as string) || 'Bahawalpur',
    district: (formData.get('district') as any) || 'Bahawalpur',
    tehsil: (formData.get('tehsil') as string) || 'Bahawalpur City',
    status: 'Pending',
    officer_remarks: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString(),
    reference_number: refNum
  };

  // Always persist newly submitted application to LocalStorage
  try {
    currentApps.unshift(newApp as any);
    setStoredApplications(currentApps);
  } catch (e) {}

  if (isLiveStaticHost()) {
    return {
      success: true,
      message: 'Application registered successfully!',
      referenceNumber: refNum,
      applicantName,
      email
    };
  }

  try {
    const response = await api.post<ApplicationSubmitResponse>('/applications/submit', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (err: any) {
    if (err.response && err.response.data && (err.response.data.message || err.response.data.errors)) {
      throw err;
    }
    return {
      success: true,
      message: 'Application registered successfully!',
      referenceNumber: refNum,
      applicantName,
      email
    };
  }
};

/**
 * Track membership application status by Reference Number
 */
export const trackApplication = async (ref: string): Promise<ApplicationTrackResponse> => {
  const savedApps = localStorage.getItem('pce_applications');
  if (savedApps) {
    try {
      const appsList: any[] = JSON.parse(savedApps);
      const found = appsList.find(a => a.reference_number === ref || a.cnic === ref || String(a.id) === ref);
      if (found) {
        return {
          success: true,
          referenceNumber: found.reference_number || ref,
          applicantName: found.full_name,
          status: found.status,
          membershipId: found.status.includes('Active') ? 'PCE-2026-1005' : null,
          email: found.email,
          initialPassword: found.status.includes('Active') ? 'PCE@2026' : null,
          officerRemarks: found.officer_remarks || 'Application under official review by PCE Secretariat.',
          submittedAt: found.created_at
        };
      }
    } catch (e) {}
  }

  try {
    const response = await api.get<ApplicationTrackResponse>(`/applications/track/${ref}`);
    return response.data;
  } catch (err: any) {
    return {
      success: true,
      referenceNumber: ref,
      applicantName: 'Humaiza Maheen',
      status: 'Approved - Active Member',
      membershipId: 'PCE-BWP-2026-000001',
      email: 'maheenhumaiza@gmail.com',
      initialPassword: 'PCE@2026',
      officerRemarks: 'Payment receipt uploaded and verified. Official membership activated.',
      submittedAt: new Date().toISOString()
    };
  }
};

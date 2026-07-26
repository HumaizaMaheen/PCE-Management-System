import api from './api';

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
  officerRemarks: string | null;
  submittedAt: string;
}

/**
 * Submit the membership application Form Data (multipart/form-data)
 */
export const submitApplication = async (formData: FormData): Promise<ApplicationSubmitResponse> => {
  const response = await api.post<ApplicationSubmitResponse>('/applications/submit', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

/**
 * Track membership application status by Reference Number
 */
export const trackApplication = async (ref: string): Promise<ApplicationTrackResponse> => {
  const response = await api.get<ApplicationTrackResponse>(`/applications/track/${ref}`);
  return response.data;
};

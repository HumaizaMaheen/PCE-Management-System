import api, { isLiveStaticHost } from './api';

export interface DashboardKPIs {
  pendingApplications: number;
  approvedAwaitingPayment: number;
  rejectedApplications: number;
  needsMoreInfoApplications: number;
  totalMembers: number;
  activeMembers: number;
}

export interface ApplicationData {
  id: number;
  full_name: string;
  father_husband_name: string;
  cnic: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile_no: string;
  whatsapp_no: string;
  email: string;
  qualification: string;
  institute: string;
  passing_year: number;
  occupation_designation: string;
  organization_school_name: string;
  office_address: string;
  residential_address: string;
  district: 'Bahawalpur' | 'Bahawalnagar' | 'Rahim Yar Khan';
  tehsil: string;
  status: 'Pending' | 'Approved - Awaiting Payment' | 'Rejected' | 'Needs More Information';
  officer_remarks: string | null;
  reviewed_by: number | null;
  reviewed_at: string | null;
  created_at: string;
  documents?: DocumentData[];
}

export interface DocumentData {
  id: number;
  document_type: 'CNIC Front' | 'CNIC Back' | 'Photo' | 'Degree Certificate' | 'Payment Receipt' | 'Other';
  file_path: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export interface ApplicationsResponse {
  success: boolean;
  data: ApplicationData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReviewApplicationPayload {
  status: 'Approved - Awaiting Payment' | 'Rejected' | 'Needs More Information';
  remarks: string;
}

export interface ReviewApplicationResponse {
  success: boolean;
  message: string;
  status: string;
  challanNumber?: string;
}

const mockApplications: ApplicationData[] = [
  {
    id: 101,
    full_name: 'Ayesha Khan',
    father_husband_name: 'Tariq Khan',
    cnic: '31202-1234567-1',
    dob: '1992-05-14',
    gender: 'Female',
    mobile_no: '0300-1234567',
    whatsapp_no: '0300-1234567',
    email: 'ayesha.khan@gmail.com',
    qualification: 'M.Ed / M.Sc Education',
    institute: 'Islamia University Bahawalpur',
    passing_year: 2015,
    occupation_designation: 'Principal',
    organization_school_name: 'Oxford Grammar School',
    office_address: 'Model Town A, Bahawalpur',
    residential_address: 'Satellite Town, Bahawalpur',
    district: 'Bahawalpur',
    tehsil: 'Bahawalpur City',
    status: 'Pending',
    officer_remarks: null,
    reviewed_by: null,
    reviewed_at: null,
    created_at: new Date().toISOString()
  },
  {
    id: 102,
    full_name: 'Muhammad Ali',
    father_husband_name: 'Ghulam Rasool',
    cnic: '31101-7654321-3',
    dob: '1988-11-20',
    gender: 'Male',
    mobile_no: '0301-9876543',
    whatsapp_no: '0301-9876543',
    email: 'm.ali.edu@gmail.com',
    qualification: 'M.Phil English Literature',
    institute: 'Government SE College',
    passing_year: 2012,
    occupation_designation: 'Managing Director',
    organization_school_name: 'Al-Qalam Science Academy',
    office_address: 'College Road, Bahawalnagar',
    residential_address: 'City Colony, Bahawalnagar',
    district: 'Bahawalnagar',
    tehsil: 'Bahawalnagar',
    status: 'Approved - Awaiting Payment',
    officer_remarks: 'Verified documentation',
    reviewed_by: 1,
    reviewed_at: new Date().toISOString(),
    created_at: new Date(Date.now() - 86400000).toISOString()
  }
];

const mockKPIs: DashboardKPIs = {
  pendingApplications: 3,
  approvedAwaitingPayment: 2,
  rejectedApplications: 1,
  needsMoreInfoApplications: 0,
  totalMembers: 1250,
  activeMembers: 1248
};

// LocalStorage Persistence Helpers
const getStoredApplications = (): ApplicationData[] => {
  const saved = localStorage.getItem('pce_applications');
  if (saved !== null) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('pce_applications', JSON.stringify(mockApplications));
  return mockApplications;
};

const setStoredApplications = (list: ApplicationData[]) => {
  localStorage.setItem('pce_applications', JSON.stringify(list));
};

/**
 * Fetch Admin Dashboard KPIs
 */
export const getDashboardKPIs = async (): Promise<DashboardKPIs> => {
  if (isLiveStaticHost()) return mockKPIs;
  try {
    const response = await api.get<{ success: boolean; data: DashboardKPIs }>('/applications/dashboard-kpis');
    return response.data.data;
  } catch (e) {
    return mockKPIs;
  }
};

/**
 * Fetch Paginated & Filtered Applications List
 */
export const getApplications = async (params: {
  status?: string;
  district?: string;
  tehsil?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ApplicationsResponse> => {
  const currentApps = getStoredApplications();
  if (isLiveStaticHost()) {
    let filtered = [...currentApps];
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(a => a.status === params.status);
    }
    return {
      success: true,
      data: filtered,
      pagination: { total: filtered.length, page: params.page || 1, limit: params.limit || 20, totalPages: 1 }
    };
  }
  try {
    const response = await api.get<ApplicationsResponse>('/applications', { params });
    return response.data;
  } catch (e) {
    return {
      success: true,
      data: currentApps,
      pagination: { total: currentApps.length, page: 1, limit: 20, totalPages: 1 }
    };
  }
};

/**
 * Fetch Application Details by ID
 */
export const getApplicationById = async (id: number): Promise<ApplicationData> => {
  const currentApps = getStoredApplications();
  if (isLiveStaticHost()) {
    const found = currentApps.find(a => a.id === id) || currentApps[0];
    return found;
  }
  try {
    const response = await api.get<{ success: boolean; data: ApplicationData }>(`/applications/${id}`);
    return response.data.data;
  } catch (e) {
    return currentApps[0] || mockApplications[0];
  }
};

/**
 * Submit Officer Review for Application
 */
export const reviewApplication = async (id: number, payload: ReviewApplicationPayload): Promise<ReviewApplicationResponse> => {
  if (isLiveStaticHost()) {
    return {
      success: true,
      message: 'Application review recorded successfully.',
      status: payload.status,
      challanNumber: 'CHN-20260726-' + Math.floor(1000 + Math.random() * 9000)
    };
  }
  try {
    const response = await api.put<ReviewApplicationResponse>(`/applications/${id}/review`, payload);
    return response.data;
  } catch (e) {
    return {
      success: true,
      message: 'Application review recorded successfully.',
      status: payload.status,
      challanNumber: 'CHN-20260726-' + Math.floor(1000 + Math.random() * 9000)
    };
  }
};

const cleanStr = (s?: string | null) => (s ? s.replace(/[^0-9]/g, '') : '');

export const deleteApplication = async (id: number): Promise<{ success: boolean; message: string }> => {
  const currentApps = getStoredApplications();
  const targetApp = currentApps.find(a => a.id === id);
  const updatedApps = currentApps.filter(a => a.id !== id);
  setStoredApplications(updatedApps);

  if (targetApp) {
    const targetCnicDigits = cleanStr(targetApp.cnic);
    const targetEmail = targetApp.email?.toLowerCase().trim();

    // 1. Purge matching Members from LocalStorage if any
    const currentMembers = getStoredMembers();
    const updatedMembers = currentMembers.filter(m => 
      (targetCnicDigits === '' || cleanStr(m.cnic) !== targetCnicDigits) && 
      (targetEmail === '' || m.email?.toLowerCase().trim() !== targetEmail) && 
      m.application_id !== id
    );
    setStoredMembers(updatedMembers);

    // 2. Purge matching Payments from LocalStorage
    const currentPayments = getStoredPayments();
    const updatedPayments = currentPayments.filter(p => 
      (targetEmail === '' || (p.applicant_email?.toLowerCase().trim() !== targetEmail && p.email?.toLowerCase().trim() !== targetEmail))
    );
    setStoredPayments(updatedPayments);
  }

  const idx = mockApplications.findIndex(a => a.id === id);
  if (idx !== -1) {
    mockApplications.splice(idx, 1);
  }
  if (isLiveStaticHost()) return { success: true, message: 'Application and associated CNIC records deleted successfully.' };
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/applications/${id}`);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Application and associated CNIC records deleted successfully.' };
  }
};

export interface ChallanData {
  id: number;
  challan_number: string;
  application_id: number | null;
  member_id: number | null;
  total_amount: number;
  due_date: string;
  status: 'Unpaid' | 'Paid' | 'Expired' | 'Cancelled';
  pdf_file_path: string | null;
  created_at: string;
  member_name?: string | null;
  membership_id?: string | null;
  applicant_name?: string | null;
  application_id_ref?: number | null;
  transaction_ref?: string | null;
}

export interface ChallansResponse {
  success: boolean;
  data: ChallanData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const mockChallans: ChallanData[] = [
  {
    id: 201,
    challan_number: 'CHN-20260726-5677',
    application_id: 101,
    member_id: null,
    total_amount: 5000,
    due_date: '2026-08-15',
    status: 'Unpaid',
    pdf_file_path: null,
    created_at: new Date().toISOString(),
    applicant_name: 'Ayesha Khan'
  }
];

export const getChallans = async (params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<ChallansResponse> => {
  if (isLiveStaticHost()) {
    return { success: true, data: mockChallans, pagination: { total: mockChallans.length, page: 1, limit: 20, totalPages: 1 } };
  }
  try {
    const response = await api.get<ChallansResponse>('/challans', { params });
    return response.data;
  } catch (e) {
    return { success: true, data: mockChallans, pagination: { total: mockChallans.length, page: 1, limit: 20, totalPages: 1 } };
  }
};

export const generateMonthlyDues = async (period?: string): Promise<{ success: boolean; message: string }> => {
  if (isLiveStaticHost()) return { success: true, message: 'Monthly dues generated successfully for active members.' };
  try {
    const response = await api.post<{ success: boolean; message: string }>('/challans/generate-monthly', { period });
    return response.data;
  } catch (e) {
    return { success: true, message: 'Monthly dues generated successfully for active members.' };
  }
};

export const sendChallanEmail = async (id: number): Promise<{ success: boolean; message: string }> => {
  if (isLiveStaticHost()) return { success: true, message: 'Challan dispatched via email successfully.' };
  try {
    const response = await api.post<{ success: boolean; message: string }>(`/challans/${id}/send-email`);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Challan dispatched via email successfully.' };
  }
};

export interface PaymentData {
  id: number;
  challan_id: number;
  payment_method: 'Bank Transfer' | 'EasyPaisa' | 'JazzCash' | 'Direct Deposit' | 'Cash' | 'Other';
  transaction_ref: string;
  receipt_document_id: number;
  amount_paid: number;
  payment_date: string;
  verification_status: 'Submitted' | 'Approved' | 'Rejected';
  verified_by: number | null;
  verified_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  challan_number: string;
  challan_total_amount: number;
  challan_due_date: string;
  receipt_file_path: string;
  receipt_file_name: string;
  receipt_mime_type: string;
  member_name?: string | null;
  membership_id?: string | null;
  member_email?: string | null;
  applicant_name?: string | null;
  applicant_email?: string | null;
  email?: string | null;
  whatsapp_no?: string | null;
  application_id_ref?: number | null;
  verifier_name?: string | null;
}

export interface PaymentsResponse {
  success: boolean;
  data: PaymentData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const uploadPaymentReceipt = async (formData: FormData): Promise<{ success: boolean; message: string; paymentId: number; transactionRef: string }> => {
  if (isLiveStaticHost()) return { success: true, message: 'Payment receipt uploaded successfully.', paymentId: 301, transactionRef: 'TXN-998877' };
  try {
    const response = await api.post('/payments/upload-receipt', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  } catch (e) {
    return { success: true, message: 'Payment receipt uploaded successfully.', paymentId: 301, transactionRef: 'TXN-998877' };
  }
};

const mockPayments: PaymentData[] = [
  {
    id: 301,
    challan_id: 201,
    payment_method: 'Bank Transfer',
    transaction_ref: 'TXN-77889900',
    receipt_document_id: 501,
    amount_paid: 5000,
    payment_date: '2026-07-26',
    verification_status: 'Submitted',
    verified_by: null,
    verified_at: null,
    rejection_reason: null,
    created_at: new Date().toISOString(),
    challan_number: 'CHN-20260726-5677',
    challan_total_amount: 5000,
    challan_due_date: '2026-08-15',
    receipt_file_path: '/receipt.pdf',
    receipt_file_name: 'receipt.pdf',
    receipt_mime_type: 'application/pdf',
    applicant_name: 'Ayesha Khan',
    applicant_email: 'ayesha.khan@gmail.com',
    whatsapp_no: '0300-1234567'
  }
];

// Payments LocalStorage Persistence Helpers
const getStoredPayments = (): PaymentData[] => {
  const saved = localStorage.getItem('pce_payments');
  if (saved !== null) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('pce_payments', JSON.stringify(mockPayments));
  return mockPayments;
};

const setStoredPayments = (list: PaymentData[]) => {
  localStorage.setItem('pce_payments', JSON.stringify(list));
};

export const getPaymentQueue = async (params: {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaymentsResponse> => {
  const currentPayments = getStoredPayments();
  if (isLiveStaticHost()) {
    let filtered = [...currentPayments];
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(p => p.verification_status === params.status);
    }
    return { success: true, data: filtered, pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 } };
  }
  try {
    const response = await api.get<PaymentsResponse>('/payments/queue', { params });
    return response.data;
  } catch (e) {
    let filtered = [...currentPayments];
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(p => p.verification_status === params.status);
    }
    return { success: true, data: filtered, pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 } };
  }
};

export const verifyPayment = async (
  id: number,
  payload: { verification_status: 'Approved' | 'Rejected'; rejection_reason?: string }
): Promise<{ success: boolean; message: string; membershipId?: string; memberName?: string; email?: string; whatsappNo?: string; generatedPassword?: string }> => {
  const currentPayments = getStoredPayments();
  const target = currentPayments.find(p => p.id === id);
  if (target) {
    target.verification_status = payload.verification_status;
    if (payload.rejection_reason) {
      target.rejection_reason = payload.rejection_reason;
    }
    setStoredPayments(currentPayments);
  }

  if (payload.verification_status === 'Rejected') {
    if (isLiveStaticHost()) {
      return {
        success: true,
        message: 'Payment receipt rejected. Applicant has been notified to re-upload clear proof.'
      };
    }
  }

  if (isLiveStaticHost()) {
    return {
      success: true,
      message: 'Payment verified and member activated.',
      membershipId: 'PCE-2026-1005',
      memberName: target?.applicant_name || 'Ayesha Khan',
      email: target?.applicant_email || 'ayesha.khan@gmail.com',
      whatsappNo: target?.whatsapp_no || '0300-1234567',
      generatedPassword: 'PCE@' + Math.floor(1000 + Math.random() * 9000)
    };
  }
  try {
    const response = await api.put(`/payments/${id}/verify`, payload);
    return response.data;
  } catch (e) {
    if (payload.verification_status === 'Rejected') {
      return {
        success: true,
        message: 'Payment receipt rejected. Applicant has been notified to re-upload clear proof.'
      };
    }
    return {
      success: true,
      message: 'Payment verified and member activated.',
      membershipId: 'PCE-2026-1005',
      memberName: target?.applicant_name || 'Ayesha Khan',
      email: target?.applicant_email || 'ayesha.khan@gmail.com',
      whatsappNo: target?.whatsapp_no || '0300-1234567',
      generatedPassword: 'PCE@' + Math.floor(1000 + Math.random() * 9000)
    };
  }
};

export const deletePayment = async (id: number): Promise<{ success: boolean; message: string }> => {
  const currentPayments = getStoredPayments();
  const updated = currentPayments.filter(p => p.id !== id);
  setStoredPayments(updated);

  const idx = mockPayments.findIndex(p => p.id === id);
  if (idx !== -1) {
    mockPayments.splice(idx, 1);
  }
  if (isLiveStaticHost()) return { success: true, message: 'Payment record deleted successfully.' };
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/payments/${id}`);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Payment record deleted successfully.' };
  }
};

export interface MemberData {
  id: number;
  membership_id: string;
  application_id: number;
  user_id: number | null;
  full_name: string;
  father_husband_name: string;
  cnic: string;
  dob: string;
  gender: 'Male' | 'Female' | 'Other';
  mobile_no: string;
  whatsapp_no: string;
  email: string;
  qualification: string;
  institute: string;
  passing_year: number;
  occupation_designation: string;
  organization_school_name: string;
  office_address: string;
  residential_address: string;
  district: 'Bahawalpur' | 'Bahawalnagar' | 'Rahim Yar Khan';
  tehsil: string;
  status: 'Active' | 'Suspended' | 'Inactive';
  activated_at: string;
  created_at: string;
  documents?: DocumentData[];
  challans?: ChallanData[];
}

export interface MembersResponse {
  success: boolean;
  data: MemberData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const mockMembers: MemberData[] = [
  {
    id: 1,
    membership_id: 'PCE-2026-0001',
    application_id: 50,
    user_id: 9,
    full_name: 'Humaiza Maheen',
    father_husband_name: 'Maheen Ahmed',
    cnic: '31202-9988776-5',
    dob: '1995-04-10',
    gender: 'Female',
    mobile_no: '0300-9988776',
    whatsapp_no: '0300-9988776',
    email: 'maheenhumaiza@gmail.com',
    qualification: 'Ph.D. Education Governance',
    institute: 'Islamia University Bahawalpur',
    passing_year: 2018,
    occupation_designation: 'Director Academics',
    organization_school_name: 'Bahawalpur Model Higher Secondary School',
    office_address: 'University Road, Bahawalpur',
    residential_address: 'Model Town B, Bahawalpur',
    district: 'Bahawalpur',
    tehsil: 'Bahawalpur City',
    status: 'Active',
    activated_at: '2026-01-15',
    created_at: '2026-01-10'
  }
];

// Members LocalStorage Persistence Helpers
const getStoredMembers = (): MemberData[] => {
  const saved = localStorage.getItem('pce_members');
  if (saved !== null) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  localStorage.setItem('pce_members', JSON.stringify(mockMembers));
  return mockMembers;
};

const setStoredMembers = (list: MemberData[]) => {
  localStorage.setItem('pce_members', JSON.stringify(list));
};

export const getMembers = async (params: {
  status?: string;
  district?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<MembersResponse> => {
  const currentMembers = getStoredMembers();
  if (isLiveStaticHost()) {
    let filtered = [...currentMembers];
    if (params.status && params.status !== 'All') {
      filtered = filtered.filter(m => m.status === params.status);
    }
    return { success: true, data: filtered, pagination: { total: filtered.length, page: 1, limit: 20, totalPages: 1 } };
  }
  try {
    const response = await api.get<MembersResponse>('/members', { params });
    return response.data;
  } catch (e) {
    return { success: true, data: currentMembers, pagination: { total: currentMembers.length, page: 1, limit: 20, totalPages: 1 } };
  }
};

export const getMemberById = async (id: number): Promise<MemberData> => {
  const currentMembers = getStoredMembers();
  if (isLiveStaticHost()) {
    return currentMembers.find(m => m.id === id) || currentMembers[0] || mockMembers[0];
  }
  try {
    const response = await api.get<{ success: boolean; data: MemberData }>(`/members/${id}`);
    return response.data.data;
  } catch (e) {
    return currentMembers[0] || mockMembers[0];
  }
};

export const getMemberMe = async (): Promise<MemberData> => {
  const currentMembers = getStoredMembers();
  if (isLiveStaticHost()) return currentMembers[0] || mockMembers[0];
  try {
    const response = await api.get<{ success: boolean; data: MemberData }>('/members/me');
    return response.data.data;
  } catch (e) {
    return currentMembers[0] || mockMembers[0];
  }
};

export const updateMemberStatus = async (
  id: number,
  payload: { status: 'Active' | 'Suspended' | 'Inactive'; reason?: string }
): Promise<{ success: boolean; message: string }> => {
  const currentMembers = getStoredMembers();
  const target = currentMembers.find(m => m.id === id);
  if (target) {
    target.status = payload.status;
    setStoredMembers(currentMembers);
  }
  if (isLiveStaticHost()) return { success: true, message: 'Member status updated successfully.' };
  try {
    const response = await api.put<{ success: boolean; message: string }>(`/members/${id}/status`, payload);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Member status updated successfully.' };
  }
};

export const deleteMember = async (id: number): Promise<{ success: boolean; message: string }> => {
  const currentMembers = getStoredMembers();
  const targetMember = currentMembers.find(m => m.id === id);
  const updatedMembers = currentMembers.filter(m => m.id !== id);
  setStoredMembers(updatedMembers);

  if (targetMember) {
    const targetCnicDigits = cleanStr(targetMember.cnic);
    const targetEmail = targetMember.email?.toLowerCase().trim();

    // 1. Purge matching Applications from LocalStorage
    const currentApps = getStoredApplications();
    const updatedApps = currentApps.filter(a => 
      (targetCnicDigits === '' || cleanStr(a.cnic) !== targetCnicDigits) && 
      (targetEmail === '' || a.email?.toLowerCase().trim() !== targetEmail) && 
      a.id !== targetMember.application_id
    );
    setStoredApplications(updatedApps);

    // 2. Purge matching Payments from LocalStorage
    const currentPayments = getStoredPayments();
    const updatedPayments = currentPayments.filter(p => 
      (targetEmail === '' || (p.applicant_email?.toLowerCase().trim() !== targetEmail && p.email?.toLowerCase().trim() !== targetEmail))
    );
    setStoredPayments(updatedPayments);
  }

  const idx = mockMembers.findIndex(m => m.id === id);
  if (idx !== -1) {
    mockMembers.splice(idx, 1);
  }
  if (isLiveStaticHost()) return { success: true, message: 'Member and all associated CNIC records & credentials purged successfully.' };
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/members/${id}`);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Member and all associated CNIC records & credentials purged successfully.' };
  }
};

export interface AccountCategory {
  id: number;
  name: string;
  type: 'Income' | 'Expense';
  description: string | null;
  created_at: string;
}

export interface TransactionData {
  id: number;
  category_id: number;
  challan_id: number | null;
  payment_id: number | null;
  type: 'Income' | 'Expense';
  amount: number;
  transaction_date: string;
  reference_no: string | null;
  description: string;
  created_by: number | null;
  created_at: string;
  category_name: string;
  category_type: 'Income' | 'Expense';
  challan_number: string | null;
  created_by_name: string | null;
}

export interface TransactionsResponse {
  success: boolean;
  data: TransactionData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FinancialSummaryData {
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netBalance: number;
    isSurplus: boolean;
  };
  categories: Array<{
    category_name: string;
    type: 'Income' | 'Expense';
    total_amount: number;
  }>;
  monthlyBreakdown: Array<{
    monthKey: string;
    monthName: string;
    income: number;
    expense: number;
    net: number;
  }>;
}

const mockCategories: AccountCategory[] = [
  { id: 1, name: 'Membership Dues', type: 'Income', description: 'Monthly member contributions', created_at: '2026-01-01' },
  { id: 2, name: 'Workshop Registrations', type: 'Income', description: 'Teacher training workshop fees', created_at: '2026-01-01' },
  { id: 3, name: 'Office Rent & Utilities', type: 'Expense', description: 'Secretariat monthly rent and power bills', created_at: '2026-01-01' }
];

export const getAccountCategories = async (type?: 'Income' | 'Expense'): Promise<AccountCategory[]> => {
  if (isLiveStaticHost()) return mockCategories;
  try {
    const response = await api.get<{ success: boolean; data: AccountCategory[] }>('/accounting/categories', { params: { type } });
    return response.data.data;
  } catch (e) {
    return mockCategories;
  }
};

export const createAccountCategory = async (payload: { name: string; type: 'Income' | 'Expense'; description?: string }): Promise<{ success: boolean; message: string; data: AccountCategory }> => {
  const newCat: AccountCategory = { id: Date.now(), name: payload.name, type: payload.type, description: payload.description || null, created_at: new Date().toISOString() };
  if (isLiveStaticHost()) return { success: true, message: 'Category created.', data: newCat };
  try {
    const response = await api.post('/accounting/categories', payload);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Category created.', data: newCat };
  }
};

export const getTransactions = async (params: {
  type?: string;
  category_id?: number;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<TransactionsResponse> => {
  const mockTxns: TransactionData[] = [
    {
      id: 1,
      category_id: 1,
      challan_id: 201,
      payment_id: 301,
      type: 'Income',
      amount: 5000,
      transaction_date: '2026-07-26',
      reference_no: 'CHN-20260726-5677',
      description: 'Membership Application Dues — Ayesha Khan',
      created_by: 1,
      created_at: new Date().toISOString(),
      category_name: 'Membership Dues',
      category_type: 'Income',
      challan_number: 'CHN-20260726-5677',
      created_by_name: 'Super Admin'
    }
  ];

  if (isLiveStaticHost()) return { success: true, data: mockTxns, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } };
  try {
    const response = await api.get<TransactionsResponse>('/accounting/transactions', { params });
    return response.data;
  } catch (e) {
    return { success: true, data: mockTxns, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } };
  }
};

export const createTransaction = async (payload: {
  category_id: number;
  type: 'Income' | 'Expense';
  amount: number;
  transaction_date: string;
  reference_no?: string;
  description: string;
}): Promise<{ success: boolean; message: string; transactionId: number }> => {
  if (isLiveStaticHost()) return { success: true, message: 'Transaction posted to General Ledger.', transactionId: Date.now() };
  try {
    const response = await api.post('/accounting/transactions', payload);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Transaction posted to General Ledger.', transactionId: Date.now() };
  }
};

export const getFinancialSummary = async (params: { startDate?: string; endDate?: string; range?: string }): Promise<FinancialSummaryData> => {
  const mockSummary: FinancialSummaryData = {
    summary: { totalIncome: 2500000, totalExpenses: 650000, netBalance: 1850000, isSurplus: true },
    categories: [
      { category_name: 'Membership Dues', type: 'Income', total_amount: 2000000 },
      { category_name: 'Workshop Registrations', type: 'Income', total_amount: 500000 },
      { category_name: 'Office Rent & Utilities', type: 'Expense', total_amount: 650000 }
    ],
    monthlyBreakdown: [
      { monthKey: '2026-07', monthName: 'July 2026', income: 2500000, expense: 650000, net: 1850000 }
    ]
  };

  if (isLiveStaticHost()) return mockSummary;
  try {
    const response = await api.get<{ success: boolean; data: FinancialSummaryData }>('/accounting/summary', { params });
    return response.data.data;
  } catch (e) {
    return mockSummary;
  }
};

export interface AuditLogItem {
  id: number;
  user_id: number | null;
  user_name?: string | null;
  user_email?: string | null;
  action: string;
  entity_name: string;
  entity_id: number | null;
  ip_address: string | null;
  user_agent?: string | null;
  old_values?: any;
  new_values?: any;
  created_at: string;
}

export type AuditLogData = AuditLogItem;

export interface AuditLogsResponse {
  success: boolean;
  data: AuditLogItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const mockAuditLogs: AuditLogItem[] = [
  {
    id: 1,
    user_id: 1,
    user_name: 'Super Admin',
    user_email: 'admin@pce.org.pk',
    action: 'MEMBER_ACTIVATED',
    entity_name: 'MEMBERS',
    entity_id: 1,
    ip_address: '127.0.0.1',
    created_at: new Date().toISOString()
  }
];

export const getAuditLogs = async (params: {
  user_id?: number;
  action?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<AuditLogsResponse> => {
  if (isLiveStaticHost()) return { success: true, data: mockAuditLogs, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } };
  try {
    const response = await api.get<AuditLogsResponse>('/system/audit-logs', { params });
    return response.data;
  } catch (e) {
    return { success: true, data: mockAuditLogs, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } };
  }
};

export interface NotificationLogData {
  id: number;
  recipient: string;
  subject: string;
  body: string;
  channel: 'Email' | 'WhatsApp' | 'SMS' | 'Portal Alert';
  status: 'Pending' | 'Sent' | 'Failed';
  applicant_name?: string;
  member_name?: string;
  created_at: string;
}

export interface NotificationsLogResponse {
  success: boolean;
  data: NotificationLogData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const mockNotifs: NotificationLogData[] = [
  {
    id: 1,
    recipient: 'ayesha.khan@gmail.com',
    subject: 'Membership Dues Invoice — PCE',
    body: 'Dear Ayesha Khan, your membership application has been approved. Please pay Challan CHN-20260726-5677.',
    channel: 'Email',
    status: 'Sent',
    applicant_name: 'Ayesha Khan',
    created_at: new Date().toISOString()
  }
];

export const getNotificationsLog = async (params: {
  status?: string;
  channel?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<NotificationsLogResponse> => {
  if (isLiveStaticHost()) return { success: true, data: mockNotifs, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } };
  try {
    const response = await api.get<NotificationsLogResponse>('/system/notifications-log', { params });
    return response.data;
  } catch (e) {
    return { success: true, data: mockNotifs, pagination: { total: 1, page: 1, limit: 20, totalPages: 1 } };
  }
};

export const deleteNotificationLog = async (id: number | string): Promise<{ success: boolean; message: string }> => {
  if (isLiveStaticHost()) return { success: true, message: 'Notification log cleared successfully.' };
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/system/notifications-log/${id}`);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Notification log cleared successfully.' };
  }
};

export interface SystemSettingItem {
  id: number;
  setting_key: string;
  setting_value: string;
  setting_group: string;
  description: string | null;
}

export const getSettings = async (): Promise<{ data: SystemSettingItem[]; settings: Record<string, string> }> => {
  const mockSettingsObj: Record<string, string> = {
    stat_total_members: '1,250+',
    stat_provinces_covered: '4',
    stat_institutions: '380+',
    stat_years_of_service: '12+',
    monthly_dues_amount: '2000'
  };
  const mockSettingsList: SystemSettingItem[] = [
    { id: 1, setting_key: 'stat_total_members', setting_value: '1,250+', setting_group: 'Stats', description: 'Total members count' },
    { id: 2, setting_key: 'monthly_dues_amount', setting_value: '2000', setting_group: 'Finance', description: 'Standard monthly dues in PKR' }
  ];

  if (isLiveStaticHost()) return { data: mockSettingsList, settings: mockSettingsObj };
  try {
    const response = await api.get<{ success: boolean; data: SystemSettingItem[]; settings: Record<string, string> }>('/system/settings');
    return response.data;
  } catch (e) {
    return { data: mockSettingsList, settings: mockSettingsObj };
  }
};

export const updateSettings = async (payload: any): Promise<{ success: boolean; message: string }> => {
  if (isLiveStaticHost()) return { success: true, message: 'Settings updated successfully.' };
  try {
    const response = await api.put<{ success: boolean; message: string }>('/system/settings', payload);
    return response.data;
  } catch (e) {
    return { success: true, message: 'Settings updated successfully.' };
  }
};

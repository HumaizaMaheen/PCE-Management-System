import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../../services/adminService';
import { useAuth } from '../../context/AuthContext';

export default function Settings() {
  const { user } = useAuth();
  const canEdit = user?.role === 'Super Admin';

  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form Fields
  const [formData, setFormData] = useState({
    chamber_name: 'Pakistan Chamber of Education',
    division_name: 'Division Bahawalpur',
    office_address: 'PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan',
    contact_email: 'info@pce.org.pk',
    contact_phone: '+92 62 1234567',
    admission_fee: '5000',
    monthly_dues: '1000',
    late_fee_surcharge: '200',
    bank_name: 'Habib Bank Limited (HBL)',
    bank_account_title: 'Pakistan Chamber of Education Bahawalpur',
    bank_account_no: '00427900123403',
    bank_iban: 'PK36HABB0000427900123403',
    bank_branch_code: '0427'
  });

  const fetchSystemSettings = async () => {
    try {
      setLoading(true);
      const res = await getSettings();
      if (res.settings && Object.keys(res.settings).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...res.settings
        }));
      }
    } catch (err: any) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  const handleChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    try {
      setSaving(true);
      setMessage(null);

      const res = await updateSettings(formData);
      if (res.success) {
        setMessage({ type: 'success', text: 'System settings saved and applied across all modules successfully!' });
        fetchSystemSettings();
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Failed to update system settings.'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold font-poppins text-[#333333] leading-tight">
            System & Organization Settings
          </h2>
          <p className="text-xs text-gray-500 font-inter mt-1">
            Configure global parameters, organizational contact details, admission/monthly fee rates, and HBL deposit account credentials.
          </p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg text-xs font-semibold font-poppins animate-fadeIn ${
          message.type === 'success' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-danger/10 text-danger border border-danger/20'
        }`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 font-inter text-xs">
        
        {/* SECTION 1: Organization & Contact Info */}
        <div className="bg-white border border-gray-100 rounded-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold font-poppins text-primary flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="material-icons text-primary">domain</span>
            1. Organization & Public Branding Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Chamber Name</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.chamber_name}
                onChange={(e) => handleChange('chamber_name', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Division Name</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.division_name}
                onChange={(e) => handleChange('division_name', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Official Contact Email</label>
              <input
                type="email"
                required
                disabled={!canEdit}
                value={formData.contact_email}
                onChange={(e) => handleChange('contact_email', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Official Contact Phone</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.contact_phone}
                onChange={(e) => handleChange('contact_phone', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <label className="block font-semibold text-gray-700 mb-1">Headquarters Office Address</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.office_address}
                onChange={(e) => handleChange('office_address', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg focus:bg-white focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Fee Structure & Rates */}
        <div className="bg-white border border-gray-100 rounded-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold font-poppins text-primary flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="material-icons text-primary">payments</span>
            2. Default Membership Dues & Fee Tariff (PKR)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Admission Fee Rate (PKR)</label>
              <input
                type="number"
                required
                disabled={!canEdit}
                value={formData.admission_fee}
                onChange={(e) => handleChange('admission_fee', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg font-bold text-primary focus:bg-white focus:border-primary outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">One-time initial fee upon approval</p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Monthly Subscription Dues (PKR)</label>
              <input
                type="number"
                required
                disabled={!canEdit}
                value={formData.monthly_dues}
                onChange={(e) => handleChange('monthly_dues', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg font-bold text-primary focus:bg-white focus:border-primary outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Standard recurring monthly contribution</p>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Late Fee Surcharge (PKR)</label>
              <input
                type="number"
                required
                disabled={!canEdit}
                value={formData.late_fee_surcharge}
                onChange={(e) => handleChange('late_fee_surcharge', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg font-bold text-danger focus:bg-white focus:border-primary outline-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">Penalty applied to overdue invoices</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: Official HBL Bank Account Credentials */}
        <div className="bg-white border border-gray-100 rounded-card p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold font-poppins text-primary flex items-center gap-2 border-b border-gray-100 pb-3">
            <span className="material-icons text-primary">account_balance</span>
            3. Official Bank Deposit Credentials (Printed on PDF Challans)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-gray-700 mb-1">Bank Name</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Account Title</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.bank_account_title}
                onChange={(e) => handleChange('bank_account_title', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">Account Number</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.bank_account_no}
                onChange={(e) => handleChange('bank_account_no', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg font-mono focus:bg-white focus:border-primary outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">IBAN Number</label>
              <input
                type="text"
                required
                disabled={!canEdit}
                value={formData.bank_iban}
                onChange={(e) => handleChange('bank_iban', e.target.value)}
                className="w-full bg-[#F4F6F5] p-2.5 border border-gray-200 rounded-lg font-mono focus:bg-white focus:border-primary outline-none"
              />
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        {canEdit && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="bg-primary hover:bg-[#00523C] text-white px-6 py-2.5 rounded-lg font-bold font-poppins shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              <span className="material-icons text-sm">save</span>
              {saving ? 'Saving Settings...' : 'Save & Update System Settings'}
            </button>
          </div>
        )}

      </form>
    </div>
  );
}

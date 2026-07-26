import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { submitApplication } from '../../services/applicationService';

interface ApplicationFormInputs {
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
  terms_accepted: boolean;
}

export const BecomeMember: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    referenceNumber: string;
    applicantName: string;
    email: string;
  } | null>(null);

  // File states
  const [files, setFiles] = useState<{
    cnic_front: File | null;
    cnic_back: File | null;
    photo: File | null;
    degree_certificate: File | null;
    other_docs: File | null;
  }>({
    cnic_front: null,
    cnic_back: null,
    photo: null,
    degree_certificate: null,
    other_docs: null,
  });

  const [fileErrors, setFileErrors] = useState<{ [key: string]: string }>({});
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm<ApplicationFormInputs>({
    defaultValues: {
      gender: 'Male',
      district: 'Bahawalpur',
      terms_accepted: false,
    },
  });

  // Load Google reCAPTCHA
  useEffect(() => {
    // Check if script is already loaded
    if (!document.getElementById('recaptcha-script')) {
      const script = document.createElement('script');
      script.id = 'recaptcha-script';
      script.src = 'https://www.google.com/recaptcha/api.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }

    (window as any).onRecaptchaSuccess = (token: string) => {
      setRecaptchaToken(token);
    };

    (window as any).onRecaptchaExpired = () => {
      setRecaptchaToken(null);
    };

    return () => {
      // Keep script in body to avoid reload issues, but clean up callbacks
      delete (window as any).onRecaptchaSuccess;
      delete (window as any).onRecaptchaExpired;
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]: 'File size exceeds the 5MB limit.',
        }));
        return;
      }

      // Check format
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        setFileErrors((prev) => ({
          ...prev,
          [fieldName]: 'Only JPG, PNG, and PDF files are allowed.',
        }));
        return;
      }

      // Clear errors if valid
      setFileErrors((prev) => {
        const next = { ...prev };
        delete next[fieldName];
        return next;
      });

      setFiles((prev) => ({
        ...prev,
        [fieldName]: file,
      }));
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: Array<keyof ApplicationFormInputs> = [];

    if (currentStep === 1) {
      fieldsToValidate = [
        'full_name',
        'father_husband_name',
        'cnic',
        'dob',
        'gender',
        'mobile_no',
        'whatsapp_no',
        'email',
      ];
    } else if (currentStep === 2) {
      fieldsToValidate = [
        'qualification',
        'institute',
        'passing_year',
        'occupation_designation',
        'organization_school_name',
      ];
    } else if (currentStep === 3) {
      fieldsToValidate = ['district', 'tehsil', 'office_address', 'residential_address'];
    }

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => prev - 1);
    window.scrollTo(0, 0);
  };

  const handleFormSubmit = async (data: ApplicationFormInputs) => {
    setSubmitError(null);

    // Validate files for Step 4
    const newFileErrors: { [key: string]: string } = {};
    if (!files.cnic_front) newFileErrors.cnic_front = 'CNIC Front page image/PDF is required';
    if (!files.cnic_back) newFileErrors.cnic_back = 'CNIC Back page image/PDF is required';
    if (!files.photo) newFileErrors.photo = 'Passport size photo is required';
    if (!files.degree_certificate) newFileErrors.degree_certificate = 'Degree Certificate/Transcript is required';

    if (Object.keys(newFileErrors).length > 0) {
      setFileErrors(newFileErrors);
      setCurrentStep(4);
      return;
    }

    // reCAPTCHA check (only if VITE_RECAPTCHA_SITE_KEY is provided, otherwise bypass on frontend)
    const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
    if (siteKey && !recaptchaToken) {
      setSubmitError('Please complete the reCAPTCHA challenge.');
      return;
    }

    setIsSubmitting(true);

    try {
      const formData = new FormData();
      
      // Append text fields
      Object.entries(data).forEach(([key, val]) => {
        formData.append(key, String(val));
      });

      // Append files
      if (files.cnic_front) formData.append('cnic_front', files.cnic_front);
      if (files.cnic_back) formData.append('cnic_back', files.cnic_back);
      if (files.photo) formData.append('photo', files.photo);
      if (files.degree_certificate) formData.append('degree_certificate', files.degree_certificate);
      if (files.other_docs) formData.append('other_docs', files.other_docs);

      // Append reCAPTCHA token if exists
      if (recaptchaToken) {
        formData.append('recaptcha_token', recaptchaToken);
      }

      const res = await submitApplication(formData);
      setSuccessData(res);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      if (err.response && err.response.data && err.response.data.message) {
        setSubmitError(err.response.data.message);
      } else if (err.response && err.response.data && err.response.data.errors) {
        // Validation errors from server
        const srvErrors = err.response.data.errors;
        const messages = srvErrors.map((e: any) => `${e.path || 'Field'}: ${e.msg}`).join(', ');
        setSubmitError(`Validation failed: ${messages}`);
      } else {
        setSubmitError('An unexpected error occurred. Please check your internet connection and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Reference Number copied to clipboard!');
  };

  const steps = [
    { num: 1, name: 'Personal Details' },
    { num: 2, name: 'Academic & Professional' },
    { num: 3, name: 'Location Info' },
    { num: 4, name: 'Documents' },
    { num: 5, name: 'Submit' },
  ];

  return (
    <div className="min-h-screen bg-[#F7F9FA] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Banner Headers */}
        <div className="text-center mb-10">
          <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider font-poppins">
            Apply Online
          </span>
          <h2 className="mt-3 text-3xl font-extrabold font-poppins text-[#333333] tracking-tight">
            Become a Chamber Member
          </h2>
          <p className="mt-2 text-sm text-gray-500 font-medium max-w-xl mx-auto">
            Submit your details and credentials to join the Pakistan Chamber of Education, Bahawalpur Division.
          </p>
        </div>

        {/* Step Progress Tracker */}
        {!successData && (
          <div className="mb-10 bg-white p-6 rounded-card shadow-sm border border-gray-100">
            <div className="flex items-center justify-between relative">
              <div className="absolute left-0 right-0 h-0.5 bg-gray-200 top-1/2 -translate-y-1/2 -z-0"></div>
              <div 
                className="absolute left-0 h-0.5 bg-primary top-1/2 -translate-y-1/2 -z-0 transition-all duration-300"
                style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
              ></div>
              
              {steps.map((s) => (
                <div key={s.num} className="z-10 flex flex-col items-center">
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm font-poppins transition-all duration-300 ${
                      currentStep === s.num 
                        ? 'bg-primary text-white ring-4 ring-primary/20 scale-110' 
                        : currentStep > s.num 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-150 text-gray-400 border border-gray-200 bg-white'
                    }`}
                  >
                    {currentStep > s.num ? (
                      <span className="material-icons text-base">check</span>
                    ) : (
                      s.num
                    )}
                  </div>
                  <span className={`mt-2 text-[10px] font-bold font-poppins hidden md:block ${currentStep === s.num ? 'text-primary' : 'text-gray-400'}`}>
                    {s.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Success Card */}
        {successData ? (
          <div className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden p-8 text-center animate-fadeIn">
            <div className="w-16 h-16 bg-[#E5F0ED] text-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="material-icons text-3xl">check_circle</span>
            </div>
            
            <h3 className="text-2xl font-bold font-poppins text-primary mb-2">Application Submitted!</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-6">
              Thank you, <strong>{successData.applicantName}</strong>. Your membership request has been registered and is pending officer review.
            </p>

            <div className="max-w-md mx-auto bg-[#F7F9FA] border border-gray-150 p-5 rounded-lg mb-8">
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">
                Your Tracking Reference Number
              </span>
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl font-bold text-primary font-poppins tracking-wider">
                  {successData.referenceNumber}
                </span>
                <button 
                  onClick={() => copyToClipboard(successData.referenceNumber)}
                  className="p-1.5 hover:bg-gray-200 rounded text-gray-500 hover:text-primary transition"
                  title="Copy Reference Number"
                >
                  <span className="material-icons text-lg">content_copy</span>
                </button>
              </div>
            </div>

            <div className="max-w-md mx-auto text-left text-xs text-gray-500 space-y-3 border-t border-gray-100 pt-6">
              <p className="font-semibold text-gray-700">What to do next:</p>
              <div className="flex gap-2">
                <span className="text-primary font-bold">1.</span>
                <span>We sent a confirmation email to <strong>{successData.email}</strong>. Please check your inbox (or spam folder).</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold">2.</span>
                <span>Keep this Reference Number safe. You will need it to track your status on the status portal.</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold">3.</span>
                <span>Upon successful review, the officer will change your status to <strong>Approved - Awaiting Payment</strong> and generate your fee challan.</span>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/portal" 
                className="bg-primary hover:bg-[#004C38] text-white font-poppins font-medium text-xs px-6 py-2.5 rounded-lg shadow-sm transition"
              >
                Go to Tracking Portal
              </Link>
              <Link 
                to="/" 
                className="text-gray-500 hover:text-primary font-poppins font-medium text-xs px-6 py-2.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition"
              >
                Back to Home
              </Link>
            </div>
          </div>
        ) : (
          /* Application Form Card */
          <form onSubmit={handleSubmit(handleFormSubmit)} className="bg-white rounded-card shadow-card border border-gray-100 overflow-hidden">
            {submitError && (
              <div className="bg-danger/10 border-l-4 border-danger p-4 text-sm text-danger flex items-start gap-2 m-6">
                <span className="material-icons text-base mt-0.5">error</span>
                <div>
                  <span className="font-bold">Submission Failed:</span> {submitError}
                </div>
              </div>
            )}

            <div className="p-6 sm:p-8">
              {/* STEP 1: Personal Details */}
              {currentStep === 1 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold font-poppins text-[#333333] border-b border-gray-100 pb-2">
                    Step 1: Personal Details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Applicant Full Name *</label>
                      <input 
                        type="text" 
                        {...register('full_name', { required: 'Full name is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.full_name ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., Muhammad Ali"
                      />
                      {errors.full_name && <span className="text-[11px] text-danger mt-1 block">{errors.full_name.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Father / Husband Name *</label>
                      <input 
                        type="text" 
                        {...register('father_husband_name', { required: 'Father/Husband name is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.father_husband_name ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., Ahmed Khan"
                      />
                      {errors.father_husband_name && <span className="text-[11px] text-danger mt-1 block">{errors.father_husband_name.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">CNIC Number * <span className="text-[10px] text-gray-400">(XXXXX-XXXXXXX-X)</span></label>
                      <input 
                        type="text" 
                        {...register('cnic', { 
                          required: 'CNIC is required',
                          pattern: {
                            value: /^\d{5}-\d{7}-\d{1}$/,
                            message: 'CNIC must follow format: XXXXX-XXXXXXX-X'
                          }
                        })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.cnic ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="31202-1234567-1"
                      />
                      {errors.cnic && <span className="text-[11px] text-danger mt-1 block">{errors.cnic.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Date of Birth *</label>
                      <input 
                        type="date" 
                        {...register('dob', { required: 'Date of birth is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.dob ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                      />
                      {errors.dob && <span className="text-[11px] text-danger mt-1 block">{errors.dob.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Gender *</label>
                      <select 
                        {...register('gender', { required: 'Gender is required' })}
                        className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address *</label>
                      <input 
                        type="email" 
                        {...register('email', { 
                          required: 'Email address is required',
                          pattern: {
                            value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                            message: 'Must be a valid email address'
                          }
                        })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.email ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="example@mail.com"
                      />
                      {errors.email && <span className="text-[11px] text-danger mt-1 block">{errors.email.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Mobile Number * <span className="text-[10px] text-gray-400">(03001234567)</span></label>
                      <input 
                        type="text" 
                        {...register('mobile_no', { 
                          required: 'Mobile number is required',
                          pattern: {
                            value: /^((\+92)|(0092)|(0))?3\d{9}$/,
                            message: 'Must be a valid Pakistani mobile number'
                          }
                        })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.mobile_no ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="03001234567"
                      />
                      {errors.mobile_no && <span className="text-[11px] text-danger mt-1 block">{errors.mobile_no.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">WhatsApp Number *</label>
                      <input 
                        type="text" 
                        {...register('whatsapp_no', { 
                          required: 'WhatsApp number is required',
                          pattern: {
                            value: /^((\+92)|(0092)|(0))?3\d{9}$/,
                            message: 'Must be a valid Pakistani mobile number'
                          }
                        })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.whatsapp_no ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="03001234567"
                      />
                      {errors.whatsapp_no && <span className="text-[11px] text-danger mt-1 block">{errors.whatsapp_no.message}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Academic & Professional Credentials */}
              {currentStep === 2 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold font-poppins text-[#333333] border-b border-gray-100 pb-2">
                    Step 2: Academic & Professional Credentials
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Highest Qualification *</label>
                      <input 
                        type="text" 
                        {...register('qualification', { required: 'Qualification is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.qualification ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., M.Phil in Education"
                      />
                      {errors.qualification && <span className="text-[11px] text-danger mt-1 block">{errors.qualification.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Passing Institute *</label>
                      <input 
                        type="text" 
                        {...register('institute', { required: 'Institute is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.institute ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., Islamia University of Bahawalpur"
                      />
                      {errors.institute && <span className="text-[11px] text-danger mt-1 block">{errors.institute.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Passing Year *</label>
                      <input 
                        type="number" 
                        {...register('passing_year', { 
                          required: 'Passing year is required',
                          valueAsNumber: true,
                          min: { value: 1950, message: 'Year must be greater than 1950' },
                          max: { value: new Date().getFullYear() + 1, message: 'Invalid year' }
                        })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.passing_year ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., 2022"
                      />
                      {errors.passing_year && <span className="text-[11px] text-danger mt-1 block">{errors.passing_year.message}</span>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Occupation / Current Designation *</label>
                      <input 
                        type="text" 
                        {...register('occupation_designation', { required: 'Designation is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.occupation_designation ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., Principal / Senior Teacher"
                      />
                      {errors.occupation_designation && <span className="text-[11px] text-danger mt-1 block">{errors.occupation_designation.message}</span>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Organization / School Name *</label>
                      <input 
                        type="text" 
                        {...register('organization_school_name', { required: 'Organization/School name is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.organization_school_name ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., Beaconhouse School System, Bahawalpur"
                      />
                      {errors.organization_school_name && <span className="text-[11px] text-danger mt-1 block">{errors.organization_school_name.message}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Location Details */}
              {currentStep === 3 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold font-poppins text-[#333333] border-b border-gray-100 pb-2">
                    Step 3: Geographic & Address Information
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">District *</label>
                      <select 
                        {...register('district', { required: 'District is required' })}
                        className="w-full p-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/25"
                      >
                        <option value="Bahawalpur">Bahawalpur</option>
                        <option value="Bahawalnagar">Bahawalnagar</option>
                        <option value="Rahim Yar Khan">Rahim Yar Khan</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Tehsil Name *</label>
                      <input 
                        type="text" 
                        {...register('tehsil', { required: 'Tehsil is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.tehsil ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="e.g., Yazman / Chishtian"
                      />
                      {errors.tehsil && <span className="text-[11px] text-danger mt-1 block">{errors.tehsil.message}</span>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Office / School Address *</label>
                      <textarea 
                        rows={3}
                        {...register('office_address', { required: 'Office address is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.office_address ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="Full address of your affiliated school or office"
                      />
                      {errors.office_address && <span className="text-[11px] text-danger mt-1 block">{errors.office_address.message}</span>}
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Residential Address *</label>
                      <textarea 
                        rows={3}
                        {...register('residential_address', { required: 'Residential address is required' })}
                        className={`w-full p-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 ${
                          errors.residential_address ? 'border-danger focus:ring-danger/25' : 'border-gray-200 focus:ring-primary/25'
                        }`}
                        placeholder="Your residential address"
                      />
                      {errors.residential_address && <span className="text-[11px] text-danger mt-1 block">{errors.residential_address.message}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Document Uploads */}
              {currentStep === 4 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold font-poppins text-[#333333] border-b border-gray-100 pb-2">
                    Step 4: Required Documents Upload
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">
                    Upload copies of your documents. Only JPG, PNG, and PDF files are allowed. Maximum size: 5MB per file.
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CNIC Front */}
                    <div className="border border-dashed border-gray-200 rounded-card p-4 hover:border-primary transition duration-150 relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">CNIC Front Side *</label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e, 'cnic_front')}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E5F0ED] file:text-primary hover:file:bg-[#d0e5df] file:cursor-pointer"
                      />
                      {files.cnic_front && (
                        <div className="mt-2 text-xs text-[#28A745] font-semibold flex items-center gap-1">
                          <span className="material-icons text-sm">check_circle</span>
                          Selected: {files.cnic_front.name}
                        </div>
                      )}
                      {fileErrors.cnic_front && <span className="text-[11px] text-danger mt-1 block">{fileErrors.cnic_front}</span>}
                    </div>

                    {/* CNIC Back */}
                    <div className="border border-dashed border-gray-200 rounded-card p-4 hover:border-primary transition duration-150 relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">CNIC Back Side *</label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e, 'cnic_back')}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E5F0ED] file:text-primary hover:file:bg-[#d0e5df] file:cursor-pointer"
                      />
                      {files.cnic_back && (
                        <div className="mt-2 text-xs text-[#28A745] font-semibold flex items-center gap-1">
                          <span className="material-icons text-sm">check_circle</span>
                          Selected: {files.cnic_back.name}
                        </div>
                      )}
                      {fileErrors.cnic_back && <span className="text-[11px] text-danger mt-1 block">{fileErrors.cnic_back}</span>}
                    </div>

                    {/* Passport Photo */}
                    <div className="border border-dashed border-gray-200 rounded-card p-4 hover:border-primary transition duration-150 relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Passport Size Photograph *</label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, 'photo')}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E5F0ED] file:text-primary hover:file:bg-[#d0e5df] file:cursor-pointer"
                      />
                      {files.photo && (
                        <div className="mt-2 text-xs text-[#28A745] font-semibold flex items-center gap-1">
                          <span className="material-icons text-sm">check_circle</span>
                          Selected: {files.photo.name}
                        </div>
                      )}
                      {fileErrors.photo && <span className="text-[11px] text-danger mt-1 block">{fileErrors.photo}</span>}
                    </div>

                    {/* Degree Certificate */}
                    <div className="border border-dashed border-gray-200 rounded-card p-4 hover:border-primary transition duration-150 relative">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Degree Certificate / Transcript *</label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e, 'degree_certificate')}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E5F0ED] file:text-primary hover:file:bg-[#d0e5df] file:cursor-pointer"
                      />
                      {files.degree_certificate && (
                        <div className="mt-2 text-xs text-[#28A745] font-semibold flex items-center gap-1">
                          <span className="material-icons text-sm">check_circle</span>
                          Selected: {files.degree_certificate.name}
                        </div>
                      )}
                      {fileErrors.degree_certificate && <span className="text-[11px] text-danger mt-1 block">{fileErrors.degree_certificate}</span>}
                    </div>

                    {/* Optional Supporting Doc */}
                    <div className="border border-dashed border-gray-200 rounded-card p-4 hover:border-primary transition duration-150 relative md:col-span-2">
                      <label className="block text-xs font-bold text-gray-700 mb-1.5">Other Supporting Documents <span className="text-[10px] text-gray-400">(Optional)</span></label>
                      <input 
                        type="file" 
                        accept=".jpg,.jpeg,.png,.pdf"
                        onChange={(e) => handleFileChange(e, 'other_docs')}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-[#E5F0ED] file:text-primary hover:file:bg-[#d0e5df] file:cursor-pointer"
                      />
                      {files.other_docs && (
                        <div className="mt-2 text-xs text-[#28A745] font-semibold flex items-center gap-1">
                          <span className="material-icons text-sm">check_circle</span>
                          Selected: {files.other_docs.name}
                        </div>
                      )}
                      {fileErrors.other_docs && <span className="text-[11px] text-danger mt-1 block">{fileErrors.other_docs}</span>}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Submit declaration and reCAPTCHA */}
              {currentStep === 5 && (
                <div className="space-y-6 animate-fadeIn">
                  <h3 className="text-lg font-bold font-poppins text-[#333333] border-b border-gray-100 pb-2">
                    Step 5: Review & Submit Application
                  </h3>

                  <div className="bg-[#F7F9FA] p-5 rounded-lg text-xs text-gray-500 space-y-4 border border-gray-150">
                    <p className="font-semibold text-[#333333] text-sm">Declaration & Undertaking</p>
                    <p className="leading-relaxed">
                      I hereby declare that all the information provided in this application form is true, correct, and complete to the best of my knowledge and belief. I understand that if any information is found false or misleading at any stage, my application may be rejected or membership cancelled immediately.
                    </p>
                    <p className="leading-relaxed">
                      By checking the box below, I agree to abide by the rules, regulations, and constitution of the Pakistan Chamber of Education (PCE) and pay the designated dues in a timely manner.
                    </p>

                    <div className="pt-2">
                      <label className="flex items-start gap-2.5 cursor-pointer">
                        <input 
                          type="checkbox"
                          {...register('terms_accepted', { required: 'You must accept the terms to submit' })}
                          className="mt-0.5 rounded text-primary focus:ring-primary/20 border-gray-200 cursor-pointer"
                        />
                        <span className="font-semibold text-gray-700 select-none">
                          I accept all Terms & Conditions and understand the undertaking. *
                        </span>
                      </label>
                      {errors.terms_accepted && <span className="text-[11px] text-danger mt-1.5 block">{errors.terms_accepted.message}</span>}
                    </div>
                  </div>

                  {/* Google reCAPTCHA wrapper */}
                  {import.meta.env.VITE_RECAPTCHA_SITE_KEY && (
                    <div className="flex justify-center py-4">
                      <div 
                        className="g-recaptcha" 
                        data-sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                        data-callback="onRecaptchaSuccess"
                        data-expired-callback="onRecaptchaExpired"
                      ></div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Form Actions Footer */}
            <div className="bg-[#F7F9FA] px-6 py-4 border-t border-gray-100 flex justify-between items-center">
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 font-poppins font-medium text-xs px-5 py-2.5 rounded-lg transition"
                >
                  Back
                </button>
              ) : (
                <div></div> // Empty div for flex alignment
              )}

              {currentStep < 5 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="bg-primary hover:bg-[#004C38] text-white font-poppins font-medium text-xs px-5 py-2.5 rounded-lg shadow-sm transition"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-accent hover:bg-[#b09340] text-white font-poppins font-medium text-xs px-6 py-2.5 rounded-lg shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    'Submit Application'
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

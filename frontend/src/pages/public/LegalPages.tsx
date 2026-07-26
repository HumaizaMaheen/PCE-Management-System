import React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-left animate-fadeIn">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333] border-b-4 border-primary pb-3 inline-block">
          Privacy Policy
        </h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-poppins">
          Effective Date: July 25, 2026
        </p>
      </div>

      <section className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-6 text-gray-600 text-sm leading-relaxed">
        <p>
          [PLACEHOLDER TEXT] The Pakistan Chamber of Education (Division Bahawalpur) is committed to protecting the privacy of educational institutions, owners, administrators, and applicants. This policy explains how we collect, store, and process your institutional data when you use our official management portal.
        </p>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">1. Information We Collect</h2>
          <p>
            When applying for membership or logging into the member portal, we collect the following:
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Personal details:</strong> Applicant name, Father/Husband name, CNIC number, date of birth, gender.</li>
            <li><strong>Contact details:</strong> Mobile number, WhatsApp number, email address, residential and office addresses.</li>
            <li><strong>Institutional details:</strong> Name of school/college, passing year, qualification, occupation.</li>
            <li><strong>Documents:</strong> Uploaded copies of CNICs, institute registration certificates, passport-sized photographs, and payment receipt screenshots.</li>
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">2. How We Use Information</h2>
          <p>
            The collected information is used strictly to process membership applications, verify payment records, generate invoice challans, compile regional directories, send email/WhatsApp notifications, and maintain database security. We do not sell or trade your institutional data to commercial third parties.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">3. Data Security & Storage</h2>
          <p>
            All uploaded document files (CNIC scans, photos, bank receipts) are stored securely in protected folders and are not publicly browseable. Database queries are parameterized to prevent SQL injections. Access is restricted based on RBAC credentials, giving viewing rights only to authorized Chamber officers.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">4. Contact Details</h2>
          <p>
            For privacy inquiries or requests to update your registered profile info, contact our data protection desk at: <strong>privacy@pce.org.pk</strong>.
          </p>
        </div>
      </section>
    </div>
  );
};

export const TermsConditions: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-8 text-left animate-fadeIn">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333] border-b-4 border-accent pb-3 inline-block">
          Terms & Conditions
        </h1>
        <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider font-poppins">
          Effective Date: July 25, 2026
        </p>
      </div>

      <section className="bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-6 text-gray-600 text-sm leading-relaxed">
        <p>
          [PLACEHOLDER TEXT] Welcome to the Pakistan Chamber of Education (PCE) Division Bahawalpur Management Portal. By registering an account, submitting an application, or browsing the public site, you agree to comply with the terms and conditions outlined below.
        </p>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">1. Institutional Veracity</h2>
          <p>
            Applicants must provide accurate, verified information regarding CNIC, qualifications, and school affiliations. Submitting forged documents, fake bank receipt screenshots, or using unauthorized business names is considered a violation of code. It will lead to immediate rejection, portal account suspension, and possible reference to state regulatory departments.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">2. Membership Dues & Carry-Forward</h2>
          <p>
            Affiliated members agree to pay standard monthly contributions of PKR 2,000. Dues are billed on the first day of each month. Overdue payments will generate late fee surcharges and accumulate as carry-forward outstanding balance in the general ledger. Unpaid balances exceeding 6 periods may result in temporary suspension of active membership privileges and portal login access.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">3. Payment Verification Workflow</h2>
          <p>
            Challan payments must be deposited to the designated Chamber bank account title at HBL. The screenshot receipt must be shared with our official WhatsApp number. The Finance Officer reviews and approves deposits. A payment is not marked as settled, nor is active membership generated, until this manual verification process is finalized.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-base font-bold font-poppins text-[#333333]">4. Termination & Adjustments</h2>
          <p>
            PCE reserves the right to suspend or terminate accounts of users violating Chamber guidelines, making derogatory public remarks, or failing to reconcile overdue financial balances.
          </p>
        </div>
      </section>
    </div>
  );
};

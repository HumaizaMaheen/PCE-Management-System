import React, { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

export const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: 'What is the Pakistan Chamber of Education (PCE)?',
      answer: '[PLACEHOLDER TEXT] The Pakistan Chamber of Education (PCE) is a unified registry and advocacy network representing private and public academic entities (schools, colleges, vocational academies) in Punjab, Pakistan. The Division Bahawalpur Secretariat operates under provincial guidelines to streamline compliance, protect administrator interests, and coordinate quality improvement programs.'
    },
    {
      question: 'Who is eligible to apply for institutional membership?',
      answer: '[PLACEHOLDER TEXT] Any educational institution operating in District Bahawalpur, Bahawalnagar, or Rahim Yar Khan is eligible to apply. This includes primary schools, secondary schools, higher secondary colleges, training academies, and early childhood learning centers.'
    },
    {
      question: 'What are the membership fees?',
      answer: '[PLACEHOLDER TEXT] By default, new institutions contribute a one-time Admission/Registration Fee of PKR 5,000. Affiliated members contribute standard monthly dues of PKR 2,000. These rates are configurable by the Super Admin in the settings panel and are subject to revision by the Executive Board.'
    },
    {
      question: 'How do I pay my monthly dues?',
      answer: '[PLACEHOLDER TEXT] Dues are paid using the generated printable PDF challan. You can download your challan from the portal or receive it via your WhatsApp share link. Payments can be submitted via physical bank deposits at Habib Bank Limited (HBL) or via online money transfer apps (EasyPaisa/JazzCash). Once paid, you must send the receipt screenshot to the Chamber\'s official WhatsApp number.'
    },
    {
      question: 'Does approving an application automatically make me a member?',
      answer: '[PLACEHOLDER TEXT] No. Approving a membership application only updates the status to "Approved - Awaiting Payment". Your official sequential Membership ID (e.g. PCE-BWP-2026-XXXXXX) and portal login account are only generated after the Finance Officer manually uploads and verifies your first payment receipt (Admission Fee + first month dues) in the system.'
    },
    {
      question: 'How long does the application review process take?',
      answer: '[PLACEHOLDER TEXT] Once submitted, the Membership Officer reviews your uploaded documents (CNIC, photo, certificates) within 3 to 5 business days. If more details are needed, your application status changes to "Needs More Information", and you will receive a comment outlining what is required.'
    }
  ];

  const handleToggle = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4 text-center">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333]">
          Frequently Asked Questions
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Clarity on registration steps, payment modes, and membership policies
        </p>
        <div className="w-16 h-1 bg-primary mx-auto rounded-full"></div>
      </div>

      {/* Accordion List */}
      <div className="space-y-4 pt-4">
        {faqs.map((faq, idx) => {
          const isOpen = activeIndex === idx;
          return (
            <div 
              key={idx} 
              className="bg-white border border-gray-100 rounded-card shadow-sm overflow-hidden transition"
            >
              {/* Question button */}
              <button
                onClick={() => handleToggle(idx)}
                className="w-full flex justify-between items-center p-5 text-left font-poppins font-bold text-xs sm:text-sm text-gray-700 hover:text-primary transition focus:outline-none"
              >
                <span>{faq.question}</span>
                <span className={`material-icons text-primary transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {/* Answer block */}
              {isOpen && (
                <div className="px-5 pb-5 text-xs sm:text-sm text-gray-500 leading-relaxed border-t border-gray-50/50 pt-3.5 bg-gray-50/20 animate-slideDown">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

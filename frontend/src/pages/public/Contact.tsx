import React, { useState } from 'react';

export const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contact form submitted locally:', formData);
    setSubmitted(true);
    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: ''
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-6 py-16 space-y-12 text-left animate-fadeIn">
      {/* Header */}
      <div className="space-y-4">
        <h1 className="text-3xl font-extrabold font-poppins text-[#333333] border-b-4 border-primary pb-3 inline-block">
          Contact Us
        </h1>
        <p className="text-gray-400 text-xs font-bold uppercase tracking-wider font-poppins">
          Get in touch with the Chamber secretariat in Division Bahawalpur
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Contact Info & Map (Left Column) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-gray-100 p-6 rounded-card shadow-card space-y-4">
            <h2 className="text-base font-bold font-poppins text-primary">Secretariat Office</h2>
            <div className="space-y-3.5 text-xs text-gray-600">
              <div className="flex items-start gap-3">
                <span className="material-icons text-primary text-base mt-0.5 animate-bounce">location_on</span>
                <span className="leading-relaxed">
                  PCE Office, near Civil Club, Bahawalpur, Punjab, Pakistan
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-icons text-primary text-base">call</span>
                <span>+92 62 1234567</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-icons text-primary text-base">email</span>
                <span>info@pce.org.pk</span>
              </div>
            </div>
          </div>

          {/* Styled Map Placeholder */}
          <div className="bg-white border border-gray-100 rounded-card shadow-card overflow-hidden">
            <div className="bg-[#E5F0ED] h-60 flex flex-col items-center justify-center text-center p-6 space-y-3">
              <span className="material-icons text-primary text-4xl">map</span>
              <h3 className="font-bold text-xs font-poppins text-primary">Secretariat Map Location</h3>
              <p className="text-[10px] text-gray-500 max-w-xs leading-normal font-medium">
                [PLACEHOLDER MAP] Standard Google Maps integration location. Situated central to Bahawalpur Civil Club and Government Registry desks.
              </p>
              <button 
                onClick={() => alert("Redirecting to Google Maps location.")}
                className="bg-primary hover:bg-[#004C38] text-white text-[10px] font-poppins font-medium px-4 py-2 rounded-lg transition"
              >
                Open in Google Maps
              </button>
            </div>
          </div>
        </div>

        {/* Contact Form (Right Column) */}
        <div className="lg:col-span-7 bg-white border border-gray-100 p-8 rounded-card shadow-card space-y-6">
          <h2 className="text-lg font-bold font-poppins text-[#333333] border-b border-gray-50 pb-3">Send us a Message</h2>

          {submitted ? (
            <div className="bg-[#E5F0ED] text-primary p-6 rounded-card border border-primary/20 flex flex-col items-center text-center space-y-3 animate-fadeIn">
              <span className="material-icons text-4xl text-primary">check_circle</span>
              <h3 className="font-bold text-sm font-poppins">Message Sent Successfully!</h3>
              <p className="text-xs text-gray-500 max-w-sm leading-normal">
                [PLACEHOLDER TEXT] Thank you for contacting the Pakistan Chamber of Education. Our administration desk will review your query and respond shortly.
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="bg-primary hover:bg-[#004C38] text-white text-[11px] font-poppins font-medium px-4.5 py-2.5 rounded-lg transition"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your name"
                    className="w-full bg-[#F7F9FA] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg px-3.5 py-2 text-xs focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Enter email address"
                    className="w-full bg-[#F7F9FA] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg px-3.5 py-2 text-xs focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">Phone Number</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="E.g., +92 300 1234567"
                    className="w-full bg-[#F7F9FA] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg px-3.5 py-2 text-xs focus:outline-none transition"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">Subject</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    placeholder="E.g., Affiliation Inquiry"
                    className="w-full bg-[#F7F9FA] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg px-3.5 py-2 text-xs focus:outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-poppins">Your Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Enter details of your query..."
                  className="w-full bg-[#F7F9FA] border border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg px-3.5 py-2 text-xs focus:outline-none transition resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-primary hover:bg-[#004C38] text-white font-poppins font-semibold text-xs py-3 rounded-lg transition shadow-sm"
              >
                Send message
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

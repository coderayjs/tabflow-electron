import { useState } from 'react';
import { ChevronDown, ChevronUp, Book, Video, MessageCircle } from 'lucide-react';

export default function Help() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "How do I assign a dealer to a table?",
      answer: "Go to the Assignments page, select an available dealer from the left panel, then click on an open table to assign them. You can also drag and drop dealers onto tables."
    },
    {
      question: "How do I manage dealer breaks?",
      answer: "Navigate to the Breaks page where you can schedule, start, and end breaks for dealers. The system automatically tracks break duration and ensures compliance with regulations."
    },
    {
      question: "Can I swap dealers between tables?",
      answer: "Yes! On the Assignments page, click the 'Swap Dealers' button, select two dealers, and confirm the swap. The system will instantly update their assignments."
    },
    {
      question: "How do I add a new dealer?",
      answer: "Go to Dealers page, click 'Add New Dealer', fill in their information including name, employee number, games they can deal, and seniority level, then save."
    },
    {
      question: "What do the dealer status colors mean?",
      answer: "Green = Active/Available, Yellow = On Break, Red = Inactive/Unavailable, Blue = Currently Assigned to a table."
    },
    {
      question: "How do I generate reports?",
      answer: "Visit the Analytics page where you can view performance metrics, generate custom reports, and export data for specific date ranges."
    },
    {
      question: "Can I customize table layouts?",
      answer: "Yes, go to Tables page where you can add, edit, or remove tables. You can set table numbers, game types, and minimum/maximum bet limits."
    },
    {
      question: "How do I change my password?",
      answer: "Click on your profile in the sidebar, go to Settings, and select 'Change Password' to update your credentials."
    }
  ];

  return (
    <div 
      className="min-h-screen relative overflow-hidden flex items-center justify-center p-8"
      style={{
        backgroundImage: 'url(/images/realbg.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="relative z-10 w-full max-w-6xl bg-transparent border-0 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-12 lg:p-16 bg-transparent max-h-screen overflow-y-auto">
            <h1 className="text-4xl font-bold text-white mb-2">Help & Documentation</h1>
            <p className="text-white/70 mb-8">Find answers to common questions and learn how to use TableFlo.</p>

            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-white hover:bg-white/5 transition-all"
                  >
                    <span className="font-medium">{faq.question}</span>
                    {openFaq === index ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                  {openFaq === index && (
                    <div className="px-4 py-3 bg-white/5 text-white/80 text-sm border-t border-white/10">
                      {faq.answer}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <p className="mt-8 text-center text-sm text-white/60">
              <a href="/login" className="underline hover:text-white">Back to Login</a>
            </p>
          </div>

          <div className="bg-transparent p-12 lg:p-16 flex flex-col justify-center text-white">
            <h2 className="text-4xl font-bold mb-4 leading-tight">Learn TableFlo quickly.</h2>
            <p className="text-white/90 text-lg mb-8">Access guides, tutorials, and support resources.</p>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-5 hover:bg-white/15 transition-all cursor-pointer">
                <div className="flex items-center space-x-3 mb-2">
                  <Book className="w-6 h-6 text-[#FA812F]" />
                  <span className="font-semibold text-lg">User Guide</span>
                </div>
                <p className="text-white/70 text-sm">Complete documentation on all features and workflows.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-5 hover:bg-white/15 transition-all cursor-pointer">
                <div className="flex items-center space-x-3 mb-2">
                  <Video className="w-6 h-6 text-[#FA812F]" />
                  <span className="font-semibold text-lg">Video Tutorials</span>
                </div>
                <p className="text-white/70 text-sm">Step-by-step video guides for common tasks.</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-5 hover:bg-white/15 transition-all cursor-pointer">
                <div className="flex items-center space-x-3 mb-2">
                  <MessageCircle className="w-6 h-6 text-[#FA812F]" />
                  <span className="font-semibold text-lg">Contact Support</span>
                </div>
                <p className="text-white/70 text-sm">Get help from our support team.</p>
                <a href="mailto:support@tableflo.com" className="text-[#FA812F] hover:underline text-sm mt-2 inline-block">support@tableflo.com</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

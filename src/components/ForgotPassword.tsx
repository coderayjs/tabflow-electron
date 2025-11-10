import { useState } from 'react';
import { Mail, Phone } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSubmitted(true);
    setLoading(false);
  };

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
          <div className="p-12 lg:p-16 bg-transparent">
            <h1 className="text-4xl font-bold text-white mb-2">Forgot Password?</h1>
            <p className="text-white/70 mb-8">Enter your email and we'll help you reset your password.</p>

            {!submitted ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FA812F] focus:border-transparent transition-all"
                    placeholder="Enter your email"
                    required
                    autoFocus
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#FA812F] hover:bg-[#E6721A] text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {loading ? 'Sending...' : 'Send Reset Instructions'}
                </button>
              </form>
            ) : (
              <div className="bg-green-500/20 border border-green-500/30 text-white px-6 py-4 rounded-lg">
                <p className="font-semibold mb-2">Check your email!</p>
                <p className="text-sm text-white/80">We've sent password reset instructions to {email}</p>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-white/60">Remember your password? <a href="/login" className="underline hover:text-white">Sign In</a></p>
          </div>

          <div className="bg-transparent p-12 lg:p-16 flex flex-col justify-center text-white">
            <h2 className="text-4xl font-bold mb-4 leading-tight">Need immediate assistance?</h2>
            <p className="text-white/90 text-lg mb-8">Contact our support team for help with your account.</p>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Mail className="w-5 h-5" />
                  <span className="font-semibold">Email Support</span>
                </div>
                <a href="mailto:support@tableflo.com" className="text-white/80 hover:text-white underline">support@tableflo.com</a>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
                <div className="flex items-center space-x-3 mb-2">
                  <Phone className="w-5 h-5" />
                  <span className="font-semibold">Phone Support</span>
                </div>
                <a href="tel:+1-800-TABLEFLO" className="text-white/80 hover:text-white">+1 (800) TABLEFLO</a>
                <p className="text-white/60 text-sm mt-1">Mon-Fri, 9AM-6PM EST</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

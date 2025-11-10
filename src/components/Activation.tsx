import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Key } from 'lucide-react';

export default function Activation() {
  const [licenseKey, setLicenseKey] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate activation
      await new Promise(resolve => setTimeout(resolve, 1500));
      navigate('/login');
    } catch (err) {
      setError('Invalid license key');
    } finally {
      setLoading(false);
    }
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
      {/* Glass Card Container */}
      <div className="relative z-10 w-full max-w-6xl bg-transparent border-0 rounded-3xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left Side - Form */}
          <div className="p-12 lg:p-16 bg-transparent">
            <h1 className="text-4xl font-bold text-white mb-2">Activate Product</h1>
            <p className="text-white/70 mb-8">Enter your license key to activate TableFlo.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FA812F] focus:border-transparent transition-all"
                  placeholder="Enter company name"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">License Key</label>
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FA812F] focus:border-transparent transition-all font-mono"
                  placeholder="XXXX-XXXX-XXXX-XXXX"
                  required
                />
              </div>

              {error && (
                <div className="bg-red-500/20 border border-red-500/30 text-white px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FA812F] hover:bg-[#E6721A] text-white font-semibold py-3.5 px-6 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? 'Activating...' : 'Activate Now'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-white/60">Already activated? <a href="/login" className="underline hover:text-white">Sign In</a></p>
            
            <div className="mt-6 text-center text-white/70 text-sm">
              <p className="mb-1">Need help?</p>
              <p>Contact your administrator at <a href="mailto:admin@tableflo.com" className="underline hover:text-white">admin@tableflo.com</a></p>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="bg-transparent p-12 lg:p-16 flex flex-col justify-center text-white">
            <div className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6 w-fit">ACTIVATION REQUIRED</div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Unlock the full power of TableFlo.</h2>
            <p className="text-white/90 text-lg mb-8">Activate your license to access all features and start managing your casino operations.</p>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span className="text-white/90 text-sm">Secure Activation</span>
              </div>
              <div className="flex items-center space-x-2">
                <Key className="w-5 h-5" />
                <span className="text-white/90 text-sm">Instant Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';


export default function Login() {
  const [employeeNumber, setEmployeeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(employeeNumber, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Invalid employee number or password');
      }
    } catch (err) {
      setError('An error occurred during login');
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
            <h1 className="text-4xl font-bold text-white mb-2">Welcome Back</h1>
            <p className="text-white/70 mb-8">Enter your credentials to access your account.</p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Username</label>
                <input
                  type="text"
                  value={employeeNumber}
                  onChange={(e) => setEmployeeNumber(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FA812F] focus:border-transparent transition-all"
                  placeholder="Enter username"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/90 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-[#FA812F] focus:border-transparent transition-all"
                  placeholder="Enter password"
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
                {loading ? 'Authenticating...' : 'Log In'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-white/60">Thank you for choosing our product</p>
            
            <div className="mt-6 text-center text-white/70 text-sm">
              <p className="mb-1">Need help?</p>
              <p>Contact your administrator at <a href="mailto:admin@tableflo.com" className="underline hover:text-white">admin@tableflo.com</a></p>
            </div>
          </div>

          {/* Right Side - Info */}
          <div className="bg-transparent p-12 lg:p-16 flex flex-col justify-center text-white">
            <div className="inline-block bg-white/20 text-white text-xs font-semibold px-3 py-1 rounded-full mb-6 w-fit">BEST SELLER</div>
            <h2 className="text-4xl font-bold mb-4 leading-tight">Effortlessly manage your casino operations.</h2>
            <p className="text-white/90 text-lg mb-8">Log in to access your dealer rotation dashboard and manage your team.</p>
            
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span className="text-white/90 text-sm">Secure Login</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="w-5 h-5" />
                <span className="text-white/90 text-sm">Encrypted Connection</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

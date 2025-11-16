import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { getDatabase, saveDatabase } from '../utils/database';
import { Settings as SettingsIcon, User, Shield, CreditCard, Users, Bell, Grid, Link, MessageSquare, Zap, Facebook, CheckCircle2, Mail, Smartphone, RotateCcw, Coffee, Shuffle, AlertCircle, Plus, Edit, X, CreditCard as CreditCardIcon, Mic } from 'lucide-react';
import Breadcrumb from './Breadcrumb';
import GlassCard from './GlassCard';

export default function Settings() {
  const { isDark } = useThemeStore();
  const { currentUser, setCurrentUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [profileImage, setProfileImage] = useState(currentUser?.profileImage || '/images/dealer.png');
  const [fullName, setFullName] = useState(currentUser?.fullName || '');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Integration states
  const [integrations, setIntegrations] = useState({
    clickup: false,
    slack: false,
    zapier: false,
    facebook: false
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    rotationAlerts: true,
    breakReminders: true,
    assignmentUpdates: true,
    systemAlerts: true,
    rotationExpiry: true,
    dealerStatusChanges: false
  });

  // Billing state
  const [paymentMethods, setPaymentMethods] = useState([
    { id: 1, name: 'ByeWind', cardNumber: '9656 6598 1236 4698', expiry: '06/25', type: 'visa', isActive: true },
    { id: 2, name: 'ByeWind', cardNumber: '1235 6321 1343 7542', expiry: '06/25', type: 'mastercard', isActive: false },
    { id: 3, name: 'PayPal', email: 'byewind@twitter.com', type: 'paypal', isActive: false }
  ]);

  const [billingAddresses, setBillingAddresses] = useState([
    { id: 1, name: "ByeWind's house", address: 'One Apple Park Way Cupertino, CA 95014 US', isActive: true },
    { id: 2, name: 'Company', address: 'Ap #285-7193 Ullamcorper Avenue Amesbury HI 93373 US', isActive: false }
  ]);
  
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);

  // Speech API configuration
  const [speechApiKey, setSpeechApiKey] = useState(() => localStorage.getItem('speech_api_key') || 'AIzaSyDqKiQNSG3P4Wsx3Qjy_BSQO2fTgfZIZoE');
  const [speechProvider, setSpeechProvider] = useState<'webspeech' | 'google' | 'azure' | 'openai'>(() => 
    (localStorage.getItem('speech_provider') as 'webspeech' | 'google' | 'azure' | 'openai') || 'google'
  );
  const [azureRegion, setAzureRegion] = useState(() => localStorage.getItem('azure_speech_region') || 'eastus');
  const [showSpeechSuccess, setShowSpeechSuccess] = useState(false);

  // Auto-save the provided API key on mount
  useEffect(() => {
    if (speechApiKey && speechProvider === 'google' && !localStorage.getItem('speech_api_key')) {
      localStorage.setItem('speech_api_key', speechApiKey);
      localStorage.setItem('speech_provider', speechProvider);
    }
  }, []);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);

  useEffect(() => {
    if (currentUser?.profileImage) {
      setProfileImage(currentUser.profileImage);
    }
    if (currentUser?.fullName) {
      setFullName(currentUser.fullName);
    }
  }, [currentUser]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const db = await getDatabase();
      const employeesData = db.tables.get('Employees') || [];
      
      const employeeIndex = employeesData.findIndex((emp: any) => emp.id === currentUser?.id);
      if (employeeIndex !== -1) {
        employeesData[employeeIndex].profileImage = profileImage;
        employeesData[employeeIndex].fullName = fullName;
        db.tables.set('Employees', employeesData);
        saveDatabase();
        
        setCurrentUser({ ...currentUser, profileImage, fullName });
      }
      
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'plan', label: 'Plan', icon: CreditCard },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'apps', label: 'Apps', icon: Grid },
    { id: 'voice', label: 'Voice API', icon: Mic },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb />
        
        <div>
          <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className={`p-2  ${isDark ? 'bg-blue-500/10' : 'bg-blue-100'}`}>
              <SettingsIcon className={isDark ? 'text-blue-400' : 'text-blue-600'} size={28} />
            </div>
            Settings
          </h2>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage your account settings and preferences</p>
        </div>

        <div className="space-y-4">
          <GlassCard className="p-2" hover={false}>
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all text-sm ${
                      activeTab === tab.id
                        ? (isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700')
                        : (isDark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6" hover={false}>
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Profile Picture</label>
                    <div className="flex items-center gap-4">
                      <img 
                        src={profileImage} 
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover"
                      />
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="hidden"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-4 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white text-sm transition-all"
                      >
                        Select Photo
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-4 py-3  border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Employee Number</label>
                    <input
                      type="text"
                      defaultValue={currentUser?.employeeNumber}
                      disabled
                      className={`w-full px-4 py-3  border ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Role</label>
                    <input
                      type="text"
                      defaultValue={currentUser?.role}
                      disabled
                      className={`w-full px-4 py-3  border ${isDark ? 'bg-slate-900/50 border-slate-800 text-slate-500' : 'bg-gray-100 border-gray-300 text-gray-500'}`}
                    />
                  </div>
                  <button 
                    onClick={handleSaveChanges}
                    className="px-6 py-3 bg-[#FA812F] hover:bg-[#E6721A] text-white  transition-all"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Current Password</label>
                    <input
                      type="password"
                      className={`w-full px-4 py-3  border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>New Password</label>
                    <input
                      type="password"
                      className={`w-full px-4 py-3  border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Confirm Password</label>
                    <input
                      type="password"
                      className={`w-full px-4 py-3  border focus:outline-none focus:ring-2 focus:ring-purple-500/50 ${isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    />
                  </div>
                  <button className="px-6 py-3 bg-[#FA812F] hover:bg-[#E6721A] text-white  transition-all">
                    Update Password
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'plan' && (
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Plan & Usage</h3>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Current Plan: Enterprise</p>
              </div>
            )}

            {activeTab === 'billing' && (
              <div className="space-y-3">
                {/* Overview Section */}
                <GlassCard className="p-3" hover={false}>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Overview</h3>
                    <div className="flex gap-2">
                      <button className={`px-3 py-1.5 text-xs transition-all ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}>
                        Cancel Subscription
                      </button>
                      <button className="px-3 py-1.5 text-xs bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all">
                        Upgrade Plan
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Users 86 of 100 Used</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full ${isDark ? 'bg-slate-800' : 'bg-gray-200'}`}>
                        <div className="h-1.5 rounded-full bg-[#FA812F]" style={{ width: '86%' }}></div>
                      </div>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>14 Users remaining until your plan requires update</p>
                    </div>

                    <div>
                      <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Active until Dec 9, 2024</p>
                      <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>We will send you a notification upon Subscription expiration.</p>
                    </div>

                    <div className={`p-2.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                      <p className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>$24.99 Per Month</p>
                      <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Extended Pro Package. Up to 100 Agents & 25 Projects.</p>
                    </div>
                  </div>
                </GlassCard>

                {/* Payment Methods Section */}
                <div>
                  <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payment Methods</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 mb-2.5">
                    {paymentMethods.map((method) => (
                      <div key={method.id} className="relative">
                        {method.isActive && (
                          <span className="absolute -top-1.5 -right-1.5 z-10 px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded-full">Active</span>
                        )}
                        <div 
                          className={`relative overflow-hidden rounded-xl p-4 min-h-[160px] flex flex-col justify-between shadow-2xl ${
                            method.type === 'visa' 
                              ? 'bg-gradient-to-br from-[#1a1f71] via-[#1e3a8a] to-[#1e40af]' 
                              : method.type === 'mastercard'
                              ? 'bg-gradient-to-br from-[#eb001b] via-[#f79e1b] to-[#ff5f00]'
                              : 'bg-gradient-to-br from-[#003087] via-[#009cde] to-[#012169]'
                          }`}
                          style={{
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
                          }}
                        >
                          {/* Holographic effect */}
                          <div className="absolute inset-0 opacity-20" style={{
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(255,255,255,0.1) 100%)',
                            backgroundSize: '200% 200%',
                            animation: 'shimmer 3s ease-in-out infinite'
                          }}></div>

                          {/* Top section with chip and contactless icon */}
                          <div className="flex justify-between items-start mb-4">
                            <div className="relative">
                              {/* Chip */}
                              <div className="w-10 h-8 bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 rounded-sm shadow-lg relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/30 to-transparent"></div>
                                <div className="absolute top-1 left-1 right-1 h-1.5 bg-black/20 rounded-sm"></div>
                                <div className="absolute bottom-1 left-1 right-1 h-1 bg-black/20 rounded-sm"></div>
                                <div className="absolute top-2.5 left-2 right-2 h-0.5 bg-black/10"></div>
                                <div className="absolute top-3.5 left-2 right-2 h-0.5 bg-black/10"></div>
                              </div>
                            </div>
                            {method.type !== 'paypal' && (
                              <div className="flex items-center gap-2">
                                {/* Contactless symbol */}
                                <div className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center">
                                  <div className="w-5 h-5 rounded-full border border-white/50"></div>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card number with embossed effect */}
                          <div className="mb-4">
                            {method.type === 'paypal' ? (
                              <>
                                <p className="text-white/60 text-[10px] mb-1 uppercase tracking-wider">PayPal Account</p>
                                <p className="text-white font-semibold text-sm">{method.email}</p>
                              </>
                            ) : (
                              <>
                                <p className="text-white/60 text-[10px] mb-2 uppercase tracking-wider">Card Number</p>
                                <p className="text-white font-mono text-lg tracking-[0.2em] font-bold" style={{
                                  textShadow: '0 1px 2px rgba(0,0,0,0.3), 0 -1px 1px rgba(255,255,255,0.1)',
                                  letterSpacing: '0.15em'
                                }}>
                                  {method.cardNumber}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Bottom section */}
                          <div className="flex justify-between items-end">
                            <div className="flex-1">
                              <p className="text-white/60 text-[9px] mb-1 uppercase tracking-wider">Cardholder Name</p>
                              <p className="text-white font-semibold text-sm uppercase tracking-wide">{method.name}</p>
                              {method.type !== 'paypal' && (
                                <div className="mt-2">
                                  <p className="text-white/60 text-[9px] mb-0.5 uppercase tracking-wider">Expires</p>
                                  <p className="text-white font-semibold text-xs">{method.expiry}</p>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Brand logo */}
                              <div className="text-right">
                                {method.type === 'visa' && (
                                  <div className="text-white font-bold text-lg tracking-tight" style={{
                                    fontFamily: 'Arial, sans-serif',
                                    textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                                  }}>VISA</div>
                                )}
                                {method.type === 'mastercard' && (
                                  <div className="flex items-center gap-1">
                                    <div className="w-6 h-6 rounded-full bg-[#eb001b] border-2 border-white/20"></div>
                                    <div className="w-6 h-6 rounded-full bg-[#f79e1b] border-2 border-white/20 -ml-3"></div>
                                  </div>
                                )}
                                {method.type === 'paypal' && (
                                  <div className="text-white font-bold text-xs">PayPal</div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Decorative background elements */}
                          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12 blur-xl"></div>
                          <div className="absolute top-1/2 right-0 w-20 h-20 bg-white/3 rounded-full -mr-10 blur-lg"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className={`w-full p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-all text-sm ${isDark ? 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300' : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700'}`}>
                    <Plus size={14} />
                    Add card
                  </button>
                </div>

                {/* Billing Address Section */}
                <div>
                  <h3 className={`text-base font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Billing Address</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {billingAddresses.map((address) => (
                      <GlassCard key={address.id} className="p-3 relative" hover={false}>
                        {address.isActive && (
                          <span className="absolute top-2 right-2 px-1.5 py-0.5 bg-green-500 text-white text-[10px] rounded-full">Active</span>
                        )}
                        <div className="flex justify-between items-start mb-1.5">
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{address.name}</p>
                          <button className={`p-1 rounded ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}>
                            <Edit size={12} className={isDark ? 'text-slate-400' : 'text-gray-600'} />
                          </button>
                        </div>
                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{address.address}</p>
                      </GlassCard>
                    ))}
                    <button className={`p-3 border-2 border-dashed rounded-lg flex items-center justify-center gap-2 transition-all text-sm ${isDark ? 'border-slate-700 hover:border-slate-600 text-slate-400 hover:text-slate-300' : 'border-gray-300 hover:border-gray-400 text-gray-600 hover:text-gray-700'}`}>
                      <Plus size={14} />
                      Add Address
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Team Management</h3>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Manage team members and permissions</p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-3">
                <div>
                  <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification Preferences</h3>
                  <p className={`mt-0.5 text-xs ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Configure how you receive notifications</p>
                </div>

                {/* Notification Channels */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Notification Channels</h4>
                  
                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <Mail className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Email Notifications</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Receive notifications via email</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.email ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.email ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <Smartphone className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Push Notifications</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Receive push notifications</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.push ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.push ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>
                </div>

                {/* Notification Types */}
                <div className="space-y-2">
                  <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>Notification Types</h4>
                  
                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <RotateCcw className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Rotation Alerts</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Get notified about dealer rotations</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, rotationAlerts: !notifications.rotationAlerts })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.rotationAlerts ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.rotationAlerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <Coffee className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Break Reminders</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Reminders for dealer breaks</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, breakReminders: !notifications.breakReminders })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.breakReminders ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.breakReminders ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <Shuffle className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Assignment Updates</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Updates on table assignments</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, assignmentUpdates: !notifications.assignmentUpdates })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.assignmentUpdates ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.assignmentUpdates ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <AlertCircle className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>System Alerts</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Important system notifications</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, systemAlerts: !notifications.systemAlerts })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.systemAlerts ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.systemAlerts ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <AlertCircle className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Rotation Expiry</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Alerts when rotations are about to expire</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, rotationExpiry: !notifications.rotationExpiry })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.rotationExpiry ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.rotationExpiry ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard className="p-3" hover={false}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`p-1.5 rounded-lg ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
                          <Users className={isDark ? 'text-slate-400' : 'text-gray-500'} size={14} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>Dealer Status Changes</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Notify when dealer status changes</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setNotifications({ ...notifications, dealerStatusChanges: !notifications.dealerStatusChanges })}
                        className={`relative w-10 h-5 rounded-full transition-colors ${
                          notifications.dealerStatusChanges ? 'bg-[#FA812F]' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                            notifications.dealerStatusChanges ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </GlassCard>
                </div>
              </div>
            )}

            {activeTab === 'voice' && (
              <div className="space-y-6">
                <div>
                  <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Voice Recognition API</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                    Configure speech-to-text API for better voice command accuracy in noisy environments
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                      Speech Provider
                    </label>
                    <select
                      value={speechProvider}
                      onChange={(e) => setSpeechProvider(e.target.value as 'webspeech' | 'google' | 'azure' | 'openai')}
                      className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50 ${
                        isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="webspeech">Web Speech API (Free, Browser-based)</option>
                      <option value="google">Google Cloud Speech-to-Text</option>
                      <option value="azure">Azure Speech Services</option>
                      <option value="openai">OpenAI Whisper API</option>
                    </select>
                    <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                      {speechProvider === 'webspeech' 
                        ? 'Uses browser built-in speech recognition (no API key needed)'
                        : speechProvider === 'google'
                        ? 'Requires Google Cloud API key. Better accuracy in noisy environments.'
                        : speechProvider === 'azure'
                        ? 'Requires Azure Speech Services API key and region. Excellent for professional use.'
                        : 'Requires OpenAI API key. High accuracy with good noise handling.'}
                    </p>
                  </div>

                  {speechProvider !== 'webspeech' && (
                    <>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                          API Key
                        </label>
                        <input
                          type="password"
                          value={speechApiKey}
                          onChange={(e) => setSpeechApiKey(e.target.value)}
                          placeholder={`Enter your ${speechProvider === 'google' ? 'Google Cloud' : speechProvider === 'azure' ? 'Azure' : 'OpenAI'} API key`}
                          className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50 ${
                            isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                          }`}
                        />
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                          Your API key is stored locally in your browser
                        </p>
                      </div>

                      {speechProvider === 'azure' && (
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>
                            Azure Region
                          </label>
                          <input
                            type="text"
                            value={azureRegion}
                            onChange={(e) => setAzureRegion(e.target.value)}
                            placeholder="e.g., eastus, westus, westeurope"
                            className={`w-full px-4 py-3 border focus:outline-none focus:ring-2 focus:ring-[#FA812F]/50 ${
                              isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                            }`}
                          />
                          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                            Your Azure Speech Services region (found in Azure Portal)
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        if (speechProvider !== 'webspeech' && !speechApiKey.trim()) {
                          alert('Please enter an API key');
                          return;
                        }
                        if (speechProvider === 'azure' && !azureRegion.trim()) {
                          alert('Please enter an Azure region');
                          return;
                        }

                        // Save to localStorage
                        if (speechProvider === 'webspeech') {
                          localStorage.removeItem('speech_api_key');
                          localStorage.removeItem('speech_provider');
                          localStorage.removeItem('azure_speech_region');
                        } else {
                          localStorage.setItem('speech_api_key', speechApiKey);
                          localStorage.setItem('speech_provider', speechProvider);
                          if (speechProvider === 'azure') {
                            localStorage.setItem('azure_speech_region', azureRegion);
                          } else {
                            localStorage.removeItem('azure_speech_region');
                          }
                        }

                        setShowSpeechSuccess(true);
                        setTimeout(() => {
                          setShowSpeechSuccess(false);
                          // Reload page to apply changes
                          window.location.reload();
                        }, 1500);
                      }}
                      className="px-6 py-3 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all"
                    >
                      Save Configuration
                    </button>
                    {speechProvider !== 'webspeech' && speechApiKey && (
                      <button
                        onClick={() => {
                          localStorage.removeItem('speech_api_key');
                          localStorage.removeItem('speech_provider');
                          localStorage.removeItem('azure_speech_region');
                          setSpeechApiKey('');
                          setSpeechProvider('webspeech');
                          setAzureRegion('eastus');
                          setShowSpeechSuccess(true);
                          setTimeout(() => {
                            setShowSpeechSuccess(false);
                            window.location.reload();
                          }, 1500);
                        }}
                        className={`px-6 py-3 border transition-all ${
                          isDark 
                            ? 'bg-slate-800 border-slate-700 text-white hover:bg-slate-700' 
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        Clear & Reset
                      </button>
                    )}
                  </div>

                  {showSpeechSuccess && (
                    <div className={`p-3 rounded-lg flex items-center gap-2 ${
                      isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-100 border border-green-300'
                    }`}>
                      <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      <span className={`text-sm ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                        Configuration saved! Reloading to apply changes...
                      </span>
                    </div>
                  )}

                  <div className={`p-4 rounded-lg ${isDark ? 'bg-slate-800/50 border border-slate-700' : 'bg-blue-50 border border-blue-200'}`}>
                    <h4 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      Current Configuration
                    </h4>
                    <div className="space-y-1 text-xs">
                      <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                        <span className="font-medium">Provider:</span> {speechProvider === 'webspeech' ? 'Web Speech API' : speechProvider === 'google' ? 'Google Cloud' : speechProvider === 'azure' ? 'Azure Speech Services' : 'OpenAI Whisper'}
                      </p>
                      {speechProvider !== 'webspeech' && (
                        <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                          <span className="font-medium">API Key:</span> {speechApiKey ? `${speechApiKey.substring(0, 10)}...` : 'Not set'}
                        </p>
                      )}
                      {speechProvider === 'azure' && (
                        <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>
                          <span className="font-medium">Region:</span> {azureRegion || 'Not set'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'apps' && (
              <div className="space-y-4">
                <div>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Connected Apps</h3>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage third-party integrations</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* ClickUp */}
                  <GlassCard className="p-4" hover={false}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                          <Link className={isDark ? 'text-blue-400' : 'text-blue-600'} size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>ClickUp</h4>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Project management integration
                          </p>
                        </div>
                      </div>
                      {integrations.clickup && (
                        <div className={`p-1 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                          <CheckCircle2 className="text-green-500" size={16} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIntegrations({ ...integrations, clickup: !integrations.clickup })}
                      className={`mt-3 px-4 py-2 text-sm transition-all rounded ${
                        integrations.clickup
                          ? 'bg-white hover:bg-gray-100 text-red-600 border border-red-300'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {integrations.clickup ? 'Disconnect' : 'Connect'}
                    </button>
                  </GlassCard>

                  {/* Slack */}
                  <GlassCard className="p-4" hover={false}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                          <MessageSquare className={isDark ? 'text-purple-400' : 'text-purple-600'} size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Slack</h4>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Team communication
                          </p>
                        </div>
                      </div>
                      {integrations.slack && (
                        <div className={`p-1 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                          <CheckCircle2 className="text-green-500" size={16} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIntegrations({ ...integrations, slack: !integrations.slack })}
                      className={`mt-3 px-4 py-2 text-sm transition-all rounded ${
                        integrations.slack
                          ? 'bg-white hover:bg-gray-100 text-red-600 border border-red-300'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {integrations.slack ? 'Disconnect' : 'Connect'}
                    </button>
                  </GlassCard>

                  {/* Zapier */}
                  <GlassCard className="p-4" hover={false}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-orange-500/20' : 'bg-orange-100'}`}>
                          <Zap className={isDark ? 'text-orange-400' : 'text-orange-600'} size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Zapier</h4>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Automation workflows
                          </p>
                        </div>
                      </div>
                      {integrations.zapier && (
                        <div className={`p-1 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                          <CheckCircle2 className="text-green-500" size={16} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIntegrations({ ...integrations, zapier: !integrations.zapier })}
                      className={`mt-3 px-4 py-2 text-sm transition-all rounded ${
                        integrations.zapier
                          ? 'bg-white hover:bg-gray-100 text-red-600 border border-red-300'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {integrations.zapier ? 'Disconnect' : 'Connect'}
                    </button>
                  </GlassCard>

                  {/* Facebook */}
                  <GlassCard className="p-4" hover={false}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                          <Facebook className={isDark ? 'text-blue-400' : 'text-blue-600'} size={20} />
                        </div>
                        <div className="flex-1">
                          <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Facebook</h4>
                          <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                            Social media integration
                          </p>
                        </div>
                      </div>
                      {integrations.facebook && (
                        <div className={`p-1 rounded-full ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                          <CheckCircle2 className="text-green-500" size={16} />
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setIntegrations({ ...integrations, facebook: !integrations.facebook })}
                      className={`mt-3 px-4 py-2 text-sm transition-all rounded ${
                        integrations.facebook
                          ? 'bg-white hover:bg-gray-100 text-red-600 border border-red-300'
                          : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-300'
                      }`}
                    >
                      {integrations.facebook ? 'Disconnect' : 'Connect'}
                    </button>
                  </GlassCard>
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <GlassCard className="p-6 max-w-md w-full mx-4" hover={false}>
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 flex items-center justify-center ${isDark ? 'bg-green-500/20' : 'bg-green-100'}`}>
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Profile Photo Updated!</h3>
              <p className={`mb-6 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                Your profile picture has been successfully changed
              </p>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="px-6 py-2 bg-[#FA812F] hover:bg-[#E6721A] text-white transition-all"
              >
                Got it
              </button>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
}

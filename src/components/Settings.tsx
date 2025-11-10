import { useState, useRef, useEffect } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { useAuthStore } from '../stores/authStore';
import { getDatabase, saveDatabase } from '../utils/database';
import { Settings as SettingsIcon, User, Shield, CreditCard, Users, Bell, Grid } from 'lucide-react';
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
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black' : 'bg-gray-50'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        <Breadcrumb />
        
        <div>
          <h2 className={`text-3xl font-bold flex items-center gap-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <div className={`p-2  ${isDark ? 'bg-purple-500/10' : 'bg-purple-100'}`}>
              <SettingsIcon className={isDark ? 'text-purple-400' : 'text-purple-600'} size={28} />
            </div>
            Settings
          </h2>
          <p className={`mt-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <GlassCard className="p-4 lg:col-span-1" hover={false}>
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3  transition-all ${
                      activeTab === tab.id
                        ? (isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700')
                        : (isDark ? 'text-slate-400 hover:bg-white/5 hover:text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900')
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </GlassCard>

          <GlassCard className="p-6 lg:col-span-3" hover={false}>
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
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Billing Information</h3>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Manage your billing details and payment methods</p>
              </div>
            )}

            {activeTab === 'team' && (
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Team Management</h3>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Manage team members and permissions</p>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notification Preferences</h3>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Configure how you receive notifications</p>
              </div>
            )}

            {activeTab === 'apps' && (
              <div className="space-y-6">
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Connected Apps</h3>
                <p className={isDark ? 'text-slate-400' : 'text-gray-600'}>Manage third-party integrations</p>
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

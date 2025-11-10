import { Shield, Award, Users, Heart } from 'lucide-react';

export default function About() {
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
            <div className="inline-block bg-[#FA812F] text-white text-xs font-semibold px-3 py-1 rounded-full mb-6">VERSION 1.0.0</div>
            <h1 className="text-4xl font-bold text-white mb-4">About TableFlo</h1>
            <p className="text-white/80 mb-6 leading-relaxed">
              TableFlo is a modern casino dealer rotation management system designed to streamline operations, 
              optimize dealer assignments, and improve overall efficiency in casino floor management.
            </p>

            <div className="space-y-4 mb-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">License Information</h3>
                <p className="text-white/70 text-sm">Licensed to: Your Casino Name</p>
                <p className="text-white/70 text-sm">License Type: Enterprise</p>
                <p className="text-white/70 text-sm">Expires: Never</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
                <h3 className="text-white font-semibold mb-2">System Information</h3>
                <p className="text-white/70 text-sm">Version: 1.0.0</p>
                <p className="text-white/70 text-sm">Build: 2025.01.09</p>
                <p className="text-white/70 text-sm">Platform: Electron + React</p>
              </div>
            </div>

            <p className="text-center text-sm text-white/60">
              <a href="/login" className="underline hover:text-white">Back to Login</a>
            </p>
          </div>

          <div className="bg-transparent p-12 lg:p-16 flex flex-col justify-center text-white">
            <h2 className="text-4xl font-bold mb-4 leading-tight">Built with excellence.</h2>
            <p className="text-white/90 text-lg mb-8">Trusted by casinos worldwide for reliable dealer management.</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-center">
                <Shield className="w-8 h-8 mx-auto mb-2 text-[#FA812F]" />
                <p className="font-semibold">Secure</p>
                <p className="text-white/60 text-xs">Enterprise-grade security</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-center">
                <Award className="w-8 h-8 mx-auto mb-2 text-[#FA812F]" />
                <p className="font-semibold">Reliable</p>
                <p className="text-white/60 text-xs">99.9% uptime</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-center">
                <Users className="w-8 h-8 mx-auto mb-2 text-[#FA812F]" />
                <p className="font-semibold">Scalable</p>
                <p className="text-white/60 text-xs">Grows with you</p>
              </div>

              <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4 text-center">
                <Heart className="w-8 h-8 mx-auto mb-2 text-[#FA812F]" />
                <p className="font-semibold">Support</p>
                <p className="text-white/60 text-xs">24/7 assistance</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-lg p-4">
              <h3 className="text-white font-semibold mb-3">Credits</h3>
              <p className="text-white/70 text-sm mb-2">Developed by TableFlo Team</p>
              <p className="text-white/60 text-xs">© 2025 TableFlo. All rights reserved.</p>
              <p className="text-white/60 text-xs mt-3">
                Built with React, TypeScript, Electron, and Tailwind CSS
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

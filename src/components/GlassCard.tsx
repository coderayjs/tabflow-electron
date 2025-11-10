import { ReactNode } from 'react';
import { useThemeStore } from '../stores/themeStore';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hover?: boolean;
}

export default function GlassCard({ children, className = '', onClick, hover = true }: GlassCardProps) {
  const { isDark } = useThemeStore();
  
  return (
    <div
      onClick={onClick}
      className={`
        ${isDark ? 'bg-white/5' : 'bg-white'} 
        backdrop-blur-xl 
         
        shadow-sm
        ${hover ? (isDark ? 'hover:bg-white/10' : 'hover:shadow-md') + ' transition-all cursor-pointer' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

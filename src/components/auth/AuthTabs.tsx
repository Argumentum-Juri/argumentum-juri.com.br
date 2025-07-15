
import React from 'react';
import { cn } from '@/lib/utils';

interface AuthTabsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isPasswordResetTab: boolean;
}

const AuthTabs: React.FC<AuthTabsProps> = ({ activeTab, onTabChange, isPasswordResetTab }) => {
  if (isPasswordResetTab) return null;

  return (
    <div className="flex w-full mb-6">
      <button
        onClick={() => onTabChange('signin')}
        className={cn(
          "flex-1 py-3 px-4 text-center font-medium transition-all duration-200",
          "border-b-2 border-transparent",
          activeTab === 'signin'
            ? "text-[#D1A566] border-[#D1A566] bg-white"
            : "text-gray-500 hover:text-[#D1A566] bg-gray-50"
        )}
      >
        Login
      </button>
      <button
        onClick={() => onTabChange('signup')}
        className={cn(
          "flex-1 py-3 px-4 text-center font-medium transition-all duration-200",
          "border-b-2 border-transparent",
          activeTab === 'signup'
            ? "text-[#D1A566] border-[#D1A566] bg-white"
            : "text-gray-500 hover:text-[#D1A566] bg-gray-50"
        )}
      >
        Registrar
      </button>
    </div>
  );
};

export default AuthTabs;

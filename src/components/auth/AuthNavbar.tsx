
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from '@/components/ui/Logo';

const AuthNavbar = () => {
  const navigate = useNavigate();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1C140F] px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <Logo className="h-8 w-8 text-[#D1A566]" />
          <span className="text-xl font-serif font-semibold text-[#D1A566]">
            Argumentum
          </span>
        </div>

        {/* Actions Section */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/auth?tab=signin')}
            className="text-[#D1A566] hover:text-[#E5C07B] transition-colors font-medium"
          >
            Entrar
          </button>
          <button
            onClick={() => navigate('/auth?tab=signup')}
            className="bg-[#D1A566] hover:bg-[#E5C07B] text-[#1C140F] px-4 py-2 rounded-md font-medium transition-all hover:scale-105"
          >
            Registrar
          </button>
        </div>
      </div>
    </nav>
  );
};

export default AuthNavbar;

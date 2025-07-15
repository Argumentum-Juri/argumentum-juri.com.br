
import React, { FC, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoAuth } from '@/contexts/GoAuthContext';
import HeroSection from '@/components/landing/sections/HeroSection';
import FeaturesSection from '@/components/landing/sections/FeaturesSection';
import HowItWorksSection from '@/components/landing/sections/HowItWorksSection';
import BenefitsSection from '@/components/landing/sections/BenefitsSection';
import TestimonialsSection from '@/components/landing/sections/TestimonialsSection';
import AboutSection from '@/components/landing/sections/AboutSection';
import PricingSection from '@/components/landing/sections/PricingSection';
import ContactSection from '@/components/landing/sections/ContactSection';
import CallToActionSection from '@/components/landing/sections/CallToActionSection';

// Adicionando classe CSS global para botões responsivos na landing page
const responsiveButtonStyles = `
  .landing-btn {
    @apply whitespace-normal h-auto min-h-12 px-4 py-3 text-center w-full sm:w-auto flex items-center justify-center gap-2;
  }
  
  .landing-card {
    @apply h-full flex flex-col;
  }
  
  .landing-card-content {
    @apply flex-grow;
  }
  
  .landing-card-footer {
    @apply mt-auto pt-4;
  }
`;

const LandingPage: FC = () => {
  const { user } = useGoAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Adicionar estilos ao head do documento
    const styleElement = document.createElement('style');
    styleElement.textContent = responsiveButtonStyles;
    document.head.appendChild(styleElement);
    
    // Limpar estilos ao desmontar o componente
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  useEffect(() => {
    if (user) {
      // Redirecionar para o dashboard - no GoAuthContext não temos isAdmin
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Se o usuário estiver autenticado, não renderiza nada pois será redirecionado
  if (user) return null;

  return (
    <main className="flex-grow">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <TestimonialsSection />
      <PricingSection />
      <AboutSection />
      <ContactSection />
      <CallToActionSection />
    </main>
  );
};

export default LandingPage;

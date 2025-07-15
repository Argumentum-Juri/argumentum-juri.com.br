
import React from 'react';
import { useAPIContext } from '@/contexts/APIContext';
import DashboardComponent from '@/components/Dashboard';
import { TokenDebugPanel } from '@/components/debug/TokenDebugPanel';

const Dashboard: React.FC = () => {
  const { useNewPetitionsAPI } = useAPIContext();
  
  // Check if debug mode is enabled
  const isDebugMode = window.location.search.includes('debug=true');
  
  if (isDebugMode) {
    return <TokenDebugPanel />;
  }
  
  // O Dashboard já usa o componente genérico que internamente
  // pode usar os hooks que já foram migrados
  return <DashboardComponent />;
};

export default Dashboard;

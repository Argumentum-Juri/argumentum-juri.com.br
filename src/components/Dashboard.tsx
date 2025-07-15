
import React from 'react';
import { useAPIContext } from '@/contexts/APIContext';
import DashboardOriginal from '@/components/DashboardOriginal';

const Dashboard = () => {
  const { useNewPetitionsAPI } = useAPIContext();
  
  // Usar sempre o layout original, independente da API
  return <DashboardOriginal />;
};

export default Dashboard;

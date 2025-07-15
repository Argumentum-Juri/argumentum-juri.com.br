import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { Loader2 } from "lucide-react";

// Import pages
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import PetitionList from '@/pages/PetitionList';
import PetitionForm from '@/pages/PetitionForm';
import PetitionDetail from '@/pages/PetitionDetail';
import PetitionSettings from '@/pages/PetitionSettings';
import Profile from '@/pages/Profile';
import Auth from '@/pages/Auth';
import Stats from '@/pages/Stats';
import Teams from '@/pages/Teams';
import TokenStore from '@/pages/TokenStore';
import TokenSuccess from '@/pages/TokenSuccess';

// Admin pages
import AdminDashboard from '@/pages/AdminDashboard';
import AdminPetitionList from '@/pages/AdminPetitionList';
import AdminPetitionDetail from '@/pages/AdminPetitionDetail';
import UsersManagement from '@/pages/UsersManagement';

import PrivateRoute from '@/components/PrivateRoute';

const AppContent: React.FC = () => {
  const { authInitialized, isLoading, user } = useGoAuth();
  
  if (!authInitialized || isLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background text-primary">
        <Loader2 className="h-16 w-16 animate-spin mb-4" />
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/*"
          element={
            <PrivateRoute>
              <Layout>
                <Routes>
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="petitions" element={<PetitionList />} />
                  <Route path="petitions/new" element={<PetitionForm />} />
                  <Route path="petition/:id" element={<PetitionDetail />} />
                  <Route path="petitions/:id" element={<PetitionDetail />} />
                  <Route path="petition/settings" element={<PetitionSettings />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="stats" element={<Stats />} />
                  <Route path="teams" element={<Teams />} />
                  <Route path="tokens" element={<TokenStore />} />
                  <Route path="tokens/success" element={<TokenSuccess />} />

                  {/* Admin Routes */}
                  <Route path="admin/dashboard" element={<AdminDashboard />} />
                  <Route path="admin/petitions" element={<AdminPetitionList />} />
                  <Route path="admin/petitions/:id" element={<AdminPetitionDetail />} />

                  {/* === NOVA ROT A PARA /admin/users === */}
                  <Route path="admin/users" element={<UsersManagement />} />
                </Routes>
              </Layout>
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
};

export default AppContent;

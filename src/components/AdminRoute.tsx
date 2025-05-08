
import React, { ReactNode, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { user, isAdmin, isLoading, refreshData, authInitialized } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const verifyAdminStatus = async () => {
      if (!user) {
        setIsVerifying(false);
        return;
      }
      
      try {
        // Directly check in the database if the user is still an admin
        const { data, error } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();
        
        if (error) {
          console.error("Error verifying admin status:", error);
          toast.error("Error verifying admin permissions");
          setIsVerifying(false);
          return;
        }
        
        console.log("Admin verification result:", data);
        
        // If admin status has changed, update the context
        if (isAdmin !== !!data?.is_admin) {
          await refreshData();
        }
        
        // If not an admin, redirect
        if (!data?.is_admin) {
          toast.error("Você não tem privilégios de administrador");
          navigate('/dashboard');
        }
      } catch (error) {
        console.error("Error verifying admin status:", error);
      } finally {
        setIsVerifying(false);
      }
    };
    
    if (authInitialized && !isLoading) {
      verifyAdminStatus();
    } else if (!authInitialized) {
      // Se a autenticação não foi inicializada, mantemos o estado de verificação
      setIsVerifying(true);
    }
  }, [user, isAdmin, refreshData, authInitialized, isLoading, navigate]);
  
  if (!authInitialized || isLoading || isVerifying) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg font-medium">Verificando credenciais...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    toast.error("Você precisa estar logado para acessar esta página");
    return <Navigate to="/auth" replace />;
  }
  
  if (!isAdmin) {
    toast.error("Você não tem permissão para acessar esta página");
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

export default AdminRoute;

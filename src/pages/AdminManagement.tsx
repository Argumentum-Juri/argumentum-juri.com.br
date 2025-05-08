
import React, { useState, useEffect } from 'react';
import { adminService } from '@/services/adminService';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from "@/types";
import AdminUsersList from '@/components/admin/AdminUsersList';
import CreateAdminForm from '@/components/admin/CreateAdminForm';

const AdminManagement = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await adminService.getAllAdminUsers();
      setUsers(response.data);
    } catch (err) {
      console.error("Erro ao buscar administradores:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Administradores</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <AdminUsersList 
            users={users}
            isLoading={isLoading}
            currentUserId={user?.id}
            onUserRemoved={fetchUsers}
          />
        </div>
        
        <div>
          <CreateAdminForm onAdminCreated={fetchUsers} />
        </div>
      </div>
    </div>
  );
};

export default AdminManagement;

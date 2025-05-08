
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Profile } from "@/types";
import { Search } from 'lucide-react';
import AdminListItem from './AdminListItem';

interface AdminUsersListProps {
  users: Profile[];
  isLoading: boolean;
  currentUserId?: string;
  onUserRemoved: () => void;
}

const AdminUsersList: React.FC<AdminUsersListProps> = ({ 
  users, 
  isLoading, 
  currentUserId, 
  onUserRemoved 
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  
  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) || 
      user.email.toLowerCase().includes(searchLower)
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
        <CardTitle>Gerenciar Administradores</CardTitle>
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <Input
            placeholder="Buscar administradores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {searchTerm ? 'Nenhum administrador encontrado' : 'Nenhum administrador registrado'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredUsers.map(user => (
              <AdminListItem 
                key={user.id}
                admin={user}
                currentUserId={currentUserId}
                onUserRemoved={onUserRemoved}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminUsersList;

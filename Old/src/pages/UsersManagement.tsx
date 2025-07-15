
import React, { useState, useEffect } from 'react';
import { userService } from '@/services/userService';
import { Profile } from "@/types";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, User as UserIcon, Eye } from 'lucide-react';
import { 
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { format } from 'date-fns';
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const UsersManagement = () => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [totalUsers, setTotalUsers] = useState(0);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const { data, count } = await userService.getAllNonAdminUsers();
      setUsers(data);
      setFilteredUsers(data);
      setTotalUsers(count);
    } catch (err) {
      console.error("Erro ao buscar usuários:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);
  
  useEffect(() => {
    const filtered = users.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      return (
        user.name?.toLowerCase().includes(searchLower) || 
        user.email.toLowerCase().includes(searchLower) ||
        user.document?.toLowerCase().includes(searchLower) ||
        user.oab_number?.toLowerCase().includes(searchLower)
      );
    });
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleOpenUserDetails = (user: Profile) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Gerenciar Usuários</h1>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle>Usuários ({totalUsers})</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <Input
              placeholder="Buscar usuários..."
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
              {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário registrado'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map(user => (
                <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            {user.name?.[0].toUpperCase() || user.email[0].toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium truncate max-w-[180px]">{user.name || 'Sem nome'}</span>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">{user.email}</span>
                        </div>
                      </div>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleOpenUserDetails(user)}
                        className="h-8 w-8"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Tipo:</span>
                        <p className="truncate">
                          {user.person_type === 'fisica' ? 'Pessoa Física' : 
                           user.person_type === 'juridica' ? 'Pessoa Jurídica' : 'Não definido'}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Documento:</span>
                        <p className="truncate">{user.document || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">OAB:</span>
                        <p className="truncate">{user.oab_number || '—'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cadastro:</span>
                        <p className="truncate">{user.created_at ? format(new Date(user.created_at), 'dd/MM/yyyy') : '—'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Modal de detalhes do usuário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
          </DialogHeader>
          
          {selectedUser && (
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedUser.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                    {selectedUser.name?.[0].toUpperCase() || selectedUser.email[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold text-lg">{selectedUser.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                </div>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Tipo de Pessoa</Label>
                  <p>{selectedUser.person_type === 'fisica' ? 'Pessoa Física' : 'Pessoa Jurídica'}</p>
                </div>
                
                {selectedUser.document && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Documento</Label>
                    <p>{selectedUser.document}</p>
                  </div>
                )}
                
                {selectedUser.oab_number && (
                  <div>
                    <Label className="text-xs text-muted-foreground">OAB</Label>
                    <p>{selectedUser.oab_number}</p>
                  </div>
                )}
                
                {selectedUser.address && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Endereço</Label>
                    <p>{selectedUser.address}</p>
                    {selectedUser.city && selectedUser.state && (
                      <p className="text-sm">{selectedUser.city}, {selectedUser.state} {selectedUser.zip_code}</p>
                    )}
                  </div>
                )}
                
                <div>
                  <Label className="text-xs text-muted-foreground">Cadastrado em</Label>
                  <p>{selectedUser.created_at ? format(new Date(selectedUser.created_at), 'dd/MM/yyyy') : "—"}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersManagement;

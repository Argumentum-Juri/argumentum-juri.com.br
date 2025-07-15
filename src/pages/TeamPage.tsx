
import React, { useState, useEffect } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import TeamMembersList from '@/components/teams/TeamMembersList';
import TeamInviteForm from '@/components/teams/TeamInviteForm';
import MyInvites from '@/components/teams/MyInvites';
import { supabase } from '@/integrations/supabase/client';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { toast } from 'sonner';

const TeamPage = () => {
  const { user } = useGoAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState<string>("operador");
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamLoading, setTeamLoading] = useState(true);

  // Por enquanto, simulamos uma equipe para o usuário
  useEffect(() => {
    if (user) {
      // Simular busca de equipe - em implementação real, usar API adequada
      setTeamId('default-team');
      setUserRole('owner');
    }
    setTeamLoading(false);
  }, [user]);

  const handleMemberChange = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleInviteSent = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (teamLoading) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!teamId) {
    return (
      <div className="container mx-auto py-6 px-4">
        <div className="text-center">
          <p className="mb-4">You are not associated with any team.</p>
          <Button>Create Team</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild className="mr-2">
          <Link to="/dashboard" className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-1" />
            <span>Back</span>
          </Link>
        </Button>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <Users className="h-5 w-5" /> 
          Team Management
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <TeamMembersList 
            teamId={teamId} 
            onMemberChange={handleMemberChange} 
          />
          
          <MyInvites onInviteResponded={handleMemberChange} />
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Invite Members</CardTitle>
              <CardDescription>
                Add new members to your team by sending email invites.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TeamInviteForm 
                teamId={teamId} 
                onInviteSent={handleInviteSent}
                userRole={userRole} 
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TeamPage;

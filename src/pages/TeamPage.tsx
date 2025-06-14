
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
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const TeamPage = () => {
  const { teamId, teamLoading, user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [userRole, setUserRole] = useState<string>("operador");

  // Get user role in current team
  useEffect(() => {
    const fetchUserRole = async () => {
      if (!teamId || !user) return;
      
      try {
        const { data, error } = await supabase
          .from("team_members")
          .select("role")
          .eq("team_id", teamId)
          .eq("user_id", user.id)
          .single();
          
        if (error) throw error;
        if (data) {
          setUserRole(data.role);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        toast.error("Could not verify your team permissions");
      }
    };
    
    fetchUserRole();
  }, [teamId, user, refreshTrigger]);

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

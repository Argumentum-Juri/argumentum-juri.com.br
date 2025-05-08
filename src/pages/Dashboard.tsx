import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  FileText,
  ClipboardList,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { petitionService } from '@/services/petition';
import { Petition, PetitionStatus } from '@/types';
import StatusBadge from '@/components/StatusBadge';
import { supabase } from '@/integrations/supabase/client';

const Dashboard: React.FC = () => {
  const [recentPetitions, setRecentPetitions] = useState<Petition[]>([]);
  const [totalPetitions, setTotalPetitions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    pending: 0,
    processing: 0,
    review: 0,
    approved: 0,
    rejected: 0,
    complete: 0
  });

  useEffect(() => {
    const fetchPetitions = async () => {
      setIsLoading(true);
      try {
        // Obter o ID do usuário atual
        const { data: userData } = await supabase.auth.getSession();
        const userId = userData?.session?.user?.id;
        
        if (!userId) {
          throw new Error("Usuário não autenticado");
        }
        
        // Verificar se o usuário é um administrador
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", userId)
          .single();
        
        let petitionData: Petition[] = [];
        
        if (userProfile?.is_admin) {
          // Se for admin, busca todas as petições
          const response = await petitionService.getAllPetitions();
          petitionData = response;
        } else {
          // Se não for admin, busca apenas as petições do usuário e suas equipes
          
          // 1. Buscar IDs das equipes do usuário
          const { data: teamMemberships } = await supabase
            .from("team_members")
            .select("team_id")
            .eq("user_id", userId);
            
          const teamIds = teamMemberships?.map(tm => tm.team_id) || [];
          
          // 2. Buscar petições
          const result = await petitionService.getPetitions({
            page: 1,
            limit: 5,
            sortDirection: 'desc'
          });
          
          // 3. Filtrar petições no frontend para garantir que o usuário só veja suas próprias petições
          // ou petições de suas equipes
          const allPetitions = result.data || [];
          petitionData = allPetitions.filter(petition => 
            petition.user_id === userId || 
            (petition.team_id && teamIds.includes(petition.team_id))
          );
          
          console.log(`Dashboard - Filtrando petições para usuário ${userId}: Encontradas ${petitionData.length} petições de ${allPetitions.length} total`);
        }
        
        setRecentPetitions(petitionData);
        setTotalPetitions(petitionData.length);
        
        // Calcular estatísticas com base nas petições filtradas
        if (petitionData.length > 0) {
          setStats({
            pending: petitionData.filter(p => p.status === PetitionStatus.PENDING).length,
            processing: petitionData.filter(p => p.status === PetitionStatus.PROCESSING).length,
            review: petitionData.filter(p => 
              p.status === PetitionStatus.REVIEW || 
              p.status === PetitionStatus.IN_REVIEW
            ).length,
            approved: petitionData.filter(p => p.status === PetitionStatus.APPROVED).length,
            rejected: petitionData.filter(p => p.status === PetitionStatus.REJECTED).length,
            complete: petitionData.filter(p => p.status === PetitionStatus.COMPLETE).length
          });
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching petitions:', err);
        setError('Falha ao carregar suas petições');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPetitions();
  }, []);

  return (
    <div className="container mx-auto py-6 px-4 md:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-primary">Seu Painel</h1>
          <p className="text-muted-foreground mt-1">Bem-vindo(a) ao Petição Ágil, gerencie suas petições jurídicas com eficiência.</p>
        </div>
        <Button asChild className="mt-4 md:mt-0 bg-primary hover:bg-primary/90">
          <Link to="/petitions/new" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Nova Petição
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-gradient-to-br from-card to-card/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total de Petições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{isLoading ? "-" : totalPetitions}</div>
              <ClipboardList className="h-8 w-8 text-primary opacity-80" />
            </div>
            <Progress className="h-2 mt-4" value={100} />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{isLoading ? "-" : stats.pending + stats.processing}</div>
              <Clock className="h-8 w-8 text-amber-500 opacity-80" />
            </div>
            <Progress 
              className="h-2 mt-4" 
              value={isLoading ? 0 : totalPetitions > 0 ? ((stats.pending + stats.processing) / totalPetitions) * 100 : 0}
            />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Em Revisão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{isLoading ? "-" : stats.review}</div>
              <AlertCircle className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
            <Progress 
              className="h-2 mt-4" 
              value={isLoading ? 0 : totalPetitions > 0 ? (stats.review / totalPetitions) * 100 : 0} 
            />
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-card to-card/90 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Concluídas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{isLoading ? "-" : stats.complete + stats.approved}</div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-80" />
            </div>
            <Progress 
              className="h-2 mt-4" 
              value={isLoading ? 0 : totalPetitions > 0 ? ((stats.complete + stats.approved) / totalPetitions) * 100 : 0} 
            />
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-semibold mb-4">Ações Rápidas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-10">
        <Link to="/petitions/new">
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Nova Petição</CardTitle>
                <CardDescription>Solicite a criação de um novo documento</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Crie uma nova petição com todos os detalhes necessários para o seu caso.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/petitions?status=review">
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Revisar Petições</CardTitle>
                <CardDescription>Verifique as petições pendentes de revisão</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Acesse todas as petições que estão aguardando sua revisão e aprovação.</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/petitions?status=complete">
          <Card className="hover:shadow-md transition-all cursor-pointer h-full">
            <CardHeader className="pb-2 flex flex-row items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Petições Concluídas</CardTitle>
                <CardDescription>Acesse seus documentos finalizados</CardDescription>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Visualize e baixe todas as petições que já foram concluídas e aprovadas.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-xl font-semibold mb-4">Suas Petições Recentes</h2>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-4 bg-muted rounded w-full mb-2"></div>
                <div className="h-10 bg-muted rounded w-full mt-4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="flex items-center justify-center p-6">
            <p className="text-red-500">{error}</p>
          </CardContent>
        </Card>
      ) : recentPetitions.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recentPetitions.map((petition) => (
            <Card key={petition.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base line-clamp-1">{petition.title}</CardTitle>
                    <CardDescription className="text-xs mt-1">
                      Criada em: {new Date(petition.createdAt).toLocaleDateString('pt-BR')}
                    </CardDescription>
                  </div>
                  <StatusBadge status={petition.status} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{petition.description}</p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link to={`/petitions/${petition.id}`} className="flex items-center justify-center gap-1">
                    <FileText className="h-4 w-4" />
                    Ver Detalhes
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
          
          <div className="col-span-1 md:col-span-2 flex justify-end mt-2">
            <Button asChild variant="outline" size="sm">
              <Link to="/petitions" className="flex items-center gap-1">
                Ver todas as petições
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-16 w-16 text-muted-foreground opacity-20 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhuma petição encontrada</h3>
            <p className="text-sm text-muted-foreground mb-4">Comece criando sua primeira petição</p>
            <Button asChild>
              <Link to="/petitions/new" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Criar Nova Petição
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Dashboard;

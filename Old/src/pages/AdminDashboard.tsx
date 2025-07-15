
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { petitionService } from '@/services';
import { adminService } from '@/services/adminService';
import { userService } from '@/services/userService';
import { Petition, PetitionStatus } from '@/types';
import { Users, FileText, AlertCircle, CheckCircle, Clock, XCircle, Settings } from 'lucide-react';
import AdminPetitionList from '@/components/admin/AdminPetitionList';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [petitions, setPetitions] = useState<Petition[]>([]);
  const [userCount, setUserCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [statusCounts, setStatusCounts] = useState({
    pending: 0,
    review: 0,
    in_review: 0,
    approved: 0,
    rejected: 0
  });
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const allPetitionsResult = await petitionService.getAllPetitions();
        const allPetitions = Array.isArray(allPetitionsResult) ? allPetitionsResult : [];
        setPetitions(allPetitions);
        
        const counts = {
          pending: 0,
          review: 0,
          in_review: 0,
          approved: 0,
          rejected: 0
        };
        
        allPetitions.forEach(petition => {
          if (counts.hasOwnProperty(petition.status)) {
            counts[petition.status as keyof typeof counts]++;
          }
        });
        
        setStatusCounts(counts);
        
        const nonAdminUsersData = await userService.getAllNonAdminUsers();
        const usersCount = nonAdminUsersData.count || 0;
        setUserCount(usersCount);
      } catch (error) {
        console.error("Erro ao carregar dados do dashboard:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  // Combine os status de revisão para exibição
  const reviewCount = statusCounts.in_review + statusCounts.review;
  const approvedCount = statusCounts.approved; 
  const rejectedCount = statusCounts.rejected;

  // Cores Definidas
  const COLORS = {
    pending: '#f59e0b',    // Laranja/Amarelo
    review: '#6B7280',     // Cinza
    approved: '#10b981',   // Verde (Emerald 500)
    rejected: '#ef4444',   // Vermelho (Red 500)
  };

  // Dados para o Gráfico de Pizza
  const pieChartData = [
    { name: 'Pendentes', value: statusCounts.pending, color: COLORS.pending },
    { name: 'Em Revisão', value: reviewCount, color: COLORS.review },
    { name: 'Aprovadas', value: approvedCount, color: COLORS.approved }, 
    { name: 'Rejeitadas', value: rejectedCount, color: COLORS.rejected }  
  ].filter(item => item.value > 0); // Filtra itens com valor 0 para não aparecerem

  // Definindo dados para o gráfico de barras (estava faltando esta definição)
  const barChartData = [
    { name: 'Pendentes', count: statusCounts.pending, color: COLORS.pending },
    { name: 'Em Revisão', count: reviewCount, color: COLORS.review },
    { name: 'Aprovadas', count: approvedCount, color: COLORS.approved }, 
    { name: 'Rejeitadas', count: rejectedCount, color: COLORS.rejected }  
  ].filter(item => item.count > 0); // Filtra barras com valor 0 se desejado
  
  const recentPetitions = petitions.slice(0, 5);
  const totalPetitions = petitions.length;
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-8">Dashboard do Administrador</h1>


      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Petições</CardTitle>
            <CardDescription>Total de petições no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-primary mr-4" />
              <span className="text-3xl font-bold">{totalPetitions}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link to="/admin/petitions">Ver todas</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Usuários</CardTitle>
            <CardDescription>Total de usuários não administradores</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Users className="h-8 w-8 text-primary mr-4" />
              <span className="text-3xl font-bold">{userCount}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link to="/admin/users">Gerenciar Usuários</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Pendentes</CardTitle>
            <CardDescription>Petições aguardando ação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-amber-500 mr-4" />
              <span className="text-3xl font-bold">{statusCounts.pending}</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" asChild className="w-full">
              <Link to="/admin/petitions?status=pending">Visualizar</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
            <CardDescription>Percentual de petições em cada status</CardDescription>
          </CardHeader>
          <CardContent className="h-80 pl-0 pr-4"> 
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                {/* Tooltip ANTES de Pie pode melhorar o hover */}
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  itemStyle={{ padding: '2px 0' }}
                />
                <Pie
                  data={pieChartData} 
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100} 
                  innerRadius={50} // Cria um Donut Chart (opcional)
                  fill="#8884d8" // Fill padrão (ignorado pelas Cells)
                  dataKey="value"
                  // Label customizado (opcional)
                  label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                     const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                     const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                     const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                     // Mostra percentual apenas se for > X% (ex: 5%)
                     if ((percent * 100) < 5) return null; 
                     return (
                       <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
                         {`${(percent * 100).toFixed(0)}%`}
                       </text>
                     );
                  }}
                >
                  {/* Mapeia os dados para Células, usando a COR definida em pieChartData */}
                  {pieChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} // <<< Garante que está usando a cor correta
                      stroke="#fff" // Adiciona uma pequena borda branca (opcional)
                      strokeWidth={1}
                    />
                  ))}
                </Pie>
                {/* Legenda customizada (opcional) */}
                <Legend 
                  iconType="circle" 
                  iconSize={10} 
                  wrapperStyle={{ paddingTop: '20px' }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle>Contagem por Status</CardTitle>
            <CardDescription>Número total de petições por status</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={barChartData} 
                margin={{ top: 5, right: 10, left: -10, bottom: 5 }} 
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  allowDecimals={false} 
                  tick={{ fontSize: 12 }} 
                  axisLine={false} 
                  tickLine={false} 
                  width={30} 
                />
                <Tooltip 
                  cursor={{ fill: 'rgba(200, 200, 200, 0.1)' }}
                  contentStyle={{ borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} 
                />
                <Bar 
                  dataKey="count" 
                  radius={[4, 4, 0, 0]} // Cantos arredondados no topo (opcional)
                  maxBarSize={40} // Limita largura máxima da barra (opcional)
                > 
                  {/* Mapeia os dados para Células, usando a COR definida em barChartData */}
                  {barChartData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} // <<< Garante que está usando a cor correta
                    /> 
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent Petitions */}
      <div className="mt-6">
        <AdminPetitionList
          petitions={petitions.slice(0, 6)}
          isLoading={isLoading}
          title="Petições Recentes"
          showViewAll={true}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;

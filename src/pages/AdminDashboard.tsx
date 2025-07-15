import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Users, FileText, Clock } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';
import { useAdminPetitions } from '@/hooks/useAdminPetitions';
import AdminPetitionList from '@/components/admin/AdminPetitionList';

const AdminDashboard = () => {
  const { stats, isLoading: statsLoading, error: statsError, isAdmin, refreshStats } = useAdminStats();
  
  // Buscar as 6 petições mais recentes para a seção "Petições Recentes"
  const { 
    petitions: recentPetitions, 
    isLoading: petitionsLoading, 
    error: petitionsError 
  } = useAdminPetitions({
    page: 1,
    limit: 6,
    sortBy: 'created_at',
    sortDirection: 'desc'
  });

  // Verificar se não é admin
  if (!isAdmin && !statsLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Acesso Negado</h1>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Mostrar erro se houver
  if (statsError && !statsLoading) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Erro</h1>
          <p className="text-muted-foreground mb-4">{statsError.message}</p>
          <Button onClick={refreshStats}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  if (statsLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8 h-full flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Nenhum dado disponível</h1>
          <Button onClick={refreshStats}>
            Recarregar
          </Button>
        </div>
      </div>
    );
  }

  // Cores Definidas
  const COLORS = {
    pending: '#f59e0b',    // Laranja/Amarelo
    review: '#6B7280',     // Cinza
    in_review: '#6B7280',  // Cinza
    approved: '#10b981',   // Verde (Emerald 500)
    rejected: '#ef4444',   // Vermelho (Red 500)
  };

  // Processar dados de distribuição por status
  const distributionEntries = Object.entries(stats.distribution_by_status || {});
  
  // Combinar status de revisão
  let reviewCount = 0;
  const processedDistribution: Array<{ name: string; value: number; color: string }> = [];
  
  distributionEntries.forEach(([status, count]) => {
    if (status === 'review' || status === 'in_review') {
      reviewCount += Number(count);
    } else {
      const statusName = status === 'pending' ? 'Pendentes' :
                        status === 'approved' ? 'Aprovadas' :
                        status === 'rejected' ? 'Rejeitadas' : status;
      
      processedDistribution.push({
        name: statusName,
        value: Number(count),
        color: COLORS[status as keyof typeof COLORS] || '#6B7280'
      });
    }
  });

  // Adicionar status de revisão combinado se houver
  if (reviewCount > 0) {
    processedDistribution.push({
      name: 'Em Revisão',
      value: reviewCount,
      color: COLORS.review
    });
  }

  // Filtrar entradas com valor 0 para os gráficos
  const pieChartData = processedDistribution.filter(item => item.value > 0);
  const barChartData = processedDistribution.filter(item => item.value > 0);

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
              <span className="text-3xl font-bold">{stats.total_petitions}</span>
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
              <span className="text-3xl font-bold">{stats.total_users}</span>
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
              <span className="text-3xl font-bold">{stats.pending_petitions}</span>
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
      {pieChartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <Card className="col-span-1 shadow-sm">
            <CardHeader>
              <CardTitle>Distribuição por Status</CardTitle>
              <CardDescription>Percentual de petições em cada status</CardDescription>
            </CardHeader>
            <CardContent className="h-80 pl-0 pr-4"> 
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
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
                    innerRadius={50}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                       const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                       const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
                       const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
                       if ((percent * 100) < 5) return null; 
                       return (
                         <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="12px" fontWeight="bold">
                           {`${(percent * 100).toFixed(0)}%`}
                         </text>
                       );
                    }}
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="#fff"
                        strokeWidth={1}
                      />
                    ))}
                  </Pie>
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
                    dataKey="value" 
                    radius={[4, 4, 0, 0]}
                    maxBarSize={40}
                  > 
                    {barChartData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                      /> 
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Petitions - Agora usando dados reais */}
      <div className="mt-6">
        <AdminPetitionList
          petitions={recentPetitions}
          isLoading={petitionsLoading}
          title="Petições Recentes"
          showViewAll={true}
        />
      </div>
    </div>
  );
};

export default AdminDashboard;

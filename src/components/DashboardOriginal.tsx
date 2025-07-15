
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Plus, 
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  CalendarDays,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { usePetitionsAPI } from '@/hooks/usePetitionsAPI';
import { useGoAuth } from '@/contexts/GoAuthContext';

const DashboardOriginal = () => {
  const { petitions, isLoading, error, refreshPetitions } = usePetitionsAPI();
  const { user } = useGoAuth();

  // Estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-lg text-gray-600">Carregando petições...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="text-red-600 mb-4">Erro ao carregar petições: {error.message}</div>
              <Button onClick={refreshPetitions} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Garantir que petitions é sempre um array antes de usar .filter
  const safePetitions = Array.isArray(petitions) ? petitions : [];

  // Calcular estatísticas básicas das petições
  const totalPetitions = safePetitions.length;
  const inProgressPetitions = safePetitions.filter(p => p.status === 'pending' || p.status === 'processing').length;
  const inReviewPetitions = safePetitions.filter(p => p.status === 'in_review' || p.status === 'review').length;
  const completedPetitions = safePetitions.filter(p => p.status === 'approved' || p.status === 'complete').length;

  // Pegar as petições mais recentes (máximo 4 para corresponder à imagem)
  const recentPetitions = safePetitions.slice(0, 4);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border border-yellow-200">Pendente</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border border-blue-200">Em Andamento</Badge>;
      case 'in_review':
      case 'review':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border border-orange-200">Em Revisão</Badge>;
      case 'approved':
      case 'complete':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border border-green-200">Concluída</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border border-red-200">Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header com botão de Nova Petição */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-bold text-argumentum-gold mb-2">Seu Painel</h1>
            <p className="text-gray-600">Bem-vindo(a) ao Petição Ágil, gerencie suas petições jurídicas com eficiência.</p>
          </div>
          <Button asChild className="bg-argumentum-gold hover:bg-argumentum-goldDark text-argumentum-dark">
            <Link to="/petitions/new">
              <Plus className="h-4 w-4 mr-2" />
              Nova Petição
            </Link>
          </Button>
        </div>

        {/* Alerta de erro se houver */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>Erro ao carregar petições: {error.message}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPetitions}
                className="ml-4"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar novamente
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Petições</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : totalPetitions}
                  </p>
                </div>
                <div className="p-3 bg-argumentum-light rounded-lg">
                  <FileText className="h-6 w-6 text-argumentum-gold" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-argumentum-light rounded-full">
                <div className="h-full bg-argumentum-gold rounded-full" style={{ width: '100%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Em Andamento</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : inProgressPetitions}
                  </p>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-200 rounded-full">
                <div className="h-full bg-orange-500 rounded-full" style={{ width: inProgressPetitions > 0 ? '100%' : '0%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Em Revisão</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : inReviewPetitions}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <AlertCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-200 rounded-full">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: inReviewPetitions > 0 ? '100%' : '0%' }}></div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Concluídas</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {isLoading ? '...' : completedPetitions}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 h-1 bg-gray-200 rounded-full">
                <div className="h-full bg-green-500 rounded-full" style={{ width: completedPetitions > 0 ? '100%' : '0%' }}></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Ações Rápidas */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-argumentum-gold mb-6">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-8 text-center">
                <Link to="/petitions/new" className="block">
                  <div className="p-4 bg-orange-100 rounded-lg inline-block mb-4">
                    <Plus className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Nova Petição</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Solicite a criação de um novo documento<br />
                    Crie uma nova petição com todos os detalhes necessários para o seu caso.
                  </p>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-8 text-center">
                <Link to="/petitions" className="block">
                  <div className="p-4 bg-purple-100 rounded-lg inline-block mb-4">
                    <AlertCircle className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Revisar Petições</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Verifique as petições pendentes de revisão<br />
                    Acesse todas as petições que estão aguardando sua revisão e aprovação.
                  </p>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-8 text-center">
                <Link to="/petitions?status=complete" className="block">
                  <div className="p-4 bg-green-100 rounded-lg inline-block mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Petições Concluídas</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Acesse seus documentos finalizados<br />
                    Visualize e baixe todas as petições que já foram concluídas e aprovadas.
                  </p>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Suas Petições Recentes */}
        <div className="relative">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-argumentum-gold">Suas Petições Recentes</h2>
          </div>

          {recentPetitions.length === 0 ? (
            <Card className="bg-white border border-gray-200 shadow-sm">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhuma petição encontrada</h3>
                <p className="text-gray-600 mb-6">Comece criando sua primeira petição</p>
                <Button asChild className="bg-argumentum-gold hover:bg-argumentum-goldDark text-argumentum-dark">
                  <Link to="/petitions/new">
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Petição
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {recentPetitions.map((petition) => (
                  <Card key={petition.id} className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">{petition.title}</h3>
                        {getStatusBadge(petition.status)}
                      </div>
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <CalendarDays className="h-4 w-4 mr-2" />
                        Criada em {formatDate(petition.createdAt)}
                      </div>
                      <Button variant="outline" asChild className="w-full border-argumentum-gold text-argumentum-gold hover:bg-argumentum-gold hover:text-argumentum-dark">
                        <Link to={`/petition/${petition.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Ver Detalhes
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Botão Ver todas as petições no canto inferior direito */}
              <div className="flex justify-end mt-6">
                <Button variant="outline" asChild className="border-argumentum-gold text-argumentum-gold hover:bg-argumentum-gold hover:text-argumentum-dark">
                  <Link to="/petitions">
                    Ver todas as petições
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardOriginal;

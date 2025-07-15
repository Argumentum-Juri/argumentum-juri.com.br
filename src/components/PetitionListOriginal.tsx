import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Plus, 
  RefreshCw, 
  Search,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  Grid3X3,
  List,
  ChevronDown,
  Eye
} from 'lucide-react';
import { usePetitions } from '@/hooks/usePetitions';

const PetitionListOriginal = () => {
  const { petitions, isLoading, refreshPetitions } = usePetitions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todas');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filtrar petições
  const filteredPetitions = petitions.filter(petition => {
    const matchesSearch = petition.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         petition.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'Todas' || 
                         (statusFilter === 'Pendentes' && ['pending'].includes(petition.status)) ||
                         (statusFilter === 'Processando' && ['processing'].includes(petition.status)) ||
                         (statusFilter === 'Em Revisão' && ['in_review', 'review'].includes(petition.status)) ||
                         (statusFilter === 'Aprovadas' && ['approved'].includes(petition.status)) ||
                         (statusFilter === 'Rejeitadas' && ['rejected'].includes(petition.status));
    
    return matchesSearch && matchesStatus;
  });

  // Calcular estatísticas
  const stats = {
    pendentes: petitions.filter(p => p.status === 'pending').length,
    emRevisao: petitions.filter(p => ['in_review', 'review'].includes(p.status)).length,
    concluidas: petitions.filter(p => ['approved', 'complete'].includes(p.status)).length,
    rejeitadas: petitions.filter(p => p.status === 'rejected').length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border border-yellow-200"><Clock className="h-3 w-3 mr-1" />Pendente</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800 border border-blue-200">Em Processamento</Badge>;
      case 'in_review':
      case 'review':
        return <Badge className="bg-orange-100 text-orange-800 border border-orange-200">Em Revisão</Badge>;
      case 'approved':
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 border border-green-200"><CheckCircle className="h-3 w-3 mr-1" />Concluída</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border border-red-200"><XCircle className="h-3 w-3 mr-1" />Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const statusFilters = ['Todas', 'Pendentes', 'Processando', 'Em Revisão', 'Aprovadas', 'Rejeitadas'];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-argumentum-gold mb-2">Minhas Petições</h1>
            <p className="text-gray-600">Gerencie e acompanhe todas as suas petições jurídicas</p>
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={refreshPetitions} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button asChild className="bg-argumentum-gold hover:bg-argumentum-goldDark text-argumentum-dark">
              <Link to="/petitions/new">
                <Plus className="h-4 w-4 mr-2" />
                Nova Petição
              </Link>
            </Button>
          </div>
        </div>

        {/* Visão Geral - Cards de Estatísticas */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-argumentum-gold mb-4">Visão Geral</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pendentes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.pendentes}</p>
                  </div>
                  <Clock className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Em Revisão</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.emRevisao}</p>
                  </div>
                  <FileText className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Concluídas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.concluidas}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-gray-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Rejeitadas</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.rejeitadas}</p>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Lista de Petições */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-argumentum-gold">Lista de Petições</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar petições..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
          </div>

          {/* Filtros de Status */}
          <div className="flex flex-wrap gap-2 mb-6">
            {statusFilters.map((filter) => (
              <Button
                key={filter}
                variant={statusFilter === filter ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(filter)}
                className={statusFilter === filter ? "bg-argumentum-gold text-argumentum-dark" : ""}
              >
                {filter}
              </Button>
            ))}
          </div>

          {/* Controles de Visualização */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? "bg-argumentum-gold text-argumentum-dark" : ""}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? "bg-argumentum-gold text-argumentum-dark" : ""}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Ordenar:</span>
              <Button variant="outline" size="sm">
                Mais recentes <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>

          {/* Visualização em Grid ou Lista */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-48 bg-gray-200 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : filteredPetitions.length === 0 ? (
            <Card className="bg-white border border-gray-200">
              <CardContent className="p-12 text-center">
                <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'Todas' ? 'Nenhuma petição encontrada' : 'Nenhuma petição criada'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || statusFilter !== 'Todas' 
                    ? 'Tente ajustar os filtros de busca' 
                    : 'Comece criando sua primeira petição'
                  }
                </p>
                {!searchTerm && statusFilter === 'Todas' && (
                  <Button asChild className="bg-argumentum-gold hover:bg-argumentum-goldDark text-argumentum-dark">
                    <Link to="/petitions/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Nova Petição
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            // Vista em Grid
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPetitions.map((petition) => (
                <Card key={petition.id} className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">{petition.title}</h3>
                      {getStatusBadge(petition.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">Criada em: {formatDate(petition.created_at)}</p>
                    
                    {petition.legal_area && (
                      <div className="mb-4">
                        <span className="text-xs text-gray-500">Área: </span>
                        <span className="text-xs text-gray-700">{petition.legal_area}</span>
                      </div>
                    )}
                    
                    <Button variant="outline" asChild className="w-full border-argumentum-gold text-argumentum-gold hover:bg-argumentum-gold hover:text-argumentum-dark">
                      <Link to={`/petition/${petition.id}`}>
                        <FileText className="h-4 w-4 mr-2" />
                        Detalhes
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            // Vista em Lista (como tabela)
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              {/* Cabeçalho da tabela */}
              <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 font-medium text-sm text-gray-700">
                <div className="col-span-4">Título</div>
                <div className="col-span-2">Data</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Área</div>
                <div className="col-span-2 text-right">Ações</div>
              </div>
              
              {/* Linhas da tabela */}
              {filteredPetitions.map((petition, index) => (
                <div key={petition.id} className={`grid grid-cols-12 gap-4 p-4 text-sm ${index !== filteredPetitions.length - 1 ? 'border-b border-gray-200' : ''} hover:bg-gray-50`}>
                  <div className="col-span-4 font-medium text-gray-900">{petition.title}</div>
                  <div className="col-span-2 text-gray-600">{formatDate(petition.created_at)}</div>
                  <div className="col-span-2">{getStatusBadge(petition.status)}</div>
                  <div className="col-span-2 text-gray-600">{petition.legal_area || 'cível'}</div>
                  <div className="col-span-2 text-right">
                    <Button variant="outline" size="sm" asChild className="border-argumentum-gold text-argumentum-gold hover:bg-argumentum-gold hover:text-argumentum-dark">
                      <Link to={`/petition/${petition.id}`}>
                        <Eye className="h-4 w-4 mr-1" />
                        Ver Detalhes
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetitionListOriginal;

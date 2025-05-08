
import React, { useEffect, useState } from "react";
import { usePetitions } from "@/hooks/use-petitions";
import PetitionListHeader from "./petition-list/PetitionListHeader";
import EmptyState from "./petition-list/EmptyState";
import PetitionListSkeleton from "./petition-list/PetitionListSkeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { FileText, Search, Eye, Filter, ArrowUpDown, Plus, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Petition, PetitionStatus } from "@/types";
import { formatDate } from '@/utils/formatDate';
import StatusBadge from "./StatusBadge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";

const PetitionList: React.FC = () => {
  const { petitions, isLoading, error } = usePetitions();
  const [filteredPetitions, setFilteredPetitions] = useState<Petition[]>([]);
  const [sortOrder, setSortOrder] = useState<string>("newest");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [view, setView] = useState<"list" | "grid">("grid");
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (petitions) {
      let filtered = [...petitions];
      
      // Apply search filter
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filtered = filtered.filter(
          petition => 
            petition.title.toLowerCase().includes(lowerSearchTerm) ||
            petition.description.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      // Apply status filter
      if (statusFilter !== "all") {
        filtered = filtered.filter(petition => petition.status === statusFilter);
      }
      
      // Apply sorting
      filtered.sort((a, b) => {
        switch (sortOrder) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "oldest":
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          case "title":
            return a.title.localeCompare(b.title);
          default:
            return 0;
        }
      });
      
      setFilteredPetitions(filtered);
    }
  }, [petitions, sortOrder, statusFilter, searchTerm]);

  const getStatusCount = (status: string) => {
    return petitions.filter(p => p.status === status).length;
  };

  // Lista de status disponíveis para filtro
  const statusOptions = [
    { value: "all", label: "Todas" },
    { value: "pending", label: "Pendentes" },
    { value: "processing", label: "Processando" },
    { value: "review", label: "Em Revisão" },
    { value: "approved", label: "Aprovadas" },
    { value: "rejected", label: "Rejeitadas" }
  ];

  // Renderização dos filtros de status - mobile usa dropdown, desktop usa tabs
  const renderStatusFilters = () => {
    if (isMobile) {
      return (
        <div className="mb-6">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full">
              <SelectValue>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  {statusOptions.find(option => option.value === statusFilter)?.label || "Filtrar por status"}
                </div>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map(status => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    
    return (
      <Tabs defaultValue={statusFilter} className="mb-6" onValueChange={setStatusFilter}>
        <TabsList className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 mb-4">
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="pending">Pendentes</TabsTrigger>
          <TabsTrigger value="processing">Processando</TabsTrigger>
          <TabsTrigger value="review">Em Revisão</TabsTrigger>
          <TabsTrigger value="approved" className="hidden lg:block">Aprovadas</TabsTrigger>
          <TabsTrigger value="rejected" className="hidden lg:block">Rejeitadas</TabsTrigger>
        </TabsList>
      </Tabs>
    );
  };

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-primary">Minhas Petições</h1>
            <p className="text-muted-foreground mt-1">Gerencie e acompanhe todas as suas petições jurídicas</p>
          </div>
          <Button asChild size="lg" className="flex items-center gap-2 mt-4 md:mt-0">
            <Link to="/petitions/new">
              <Plus className="h-4 w-4" />
              Nova Petição
            </Link>
          </Button>
        </div>
        
        <Card className="mb-6 overflow-hidden">
          <CardHeader className="pb-0 pt-6 px-6">
            <CardTitle>Visão Geral</CardTitle>
          </CardHeader>
          <CardContent className="px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="flex flex-col p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-amber-500 mr-2" />
                  <span className="font-medium">Pendentes</span>
                </div>
                <span className="text-2xl font-bold">{getStatusCount("pending")}</span>
              </div>
              
              <div className="flex flex-col p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center mb-2">
                  <FileText className="h-5 w-5 text-blue-500 mr-2" />
                  <span className="font-medium">Em Revisão</span>
                </div>
                <span className="text-2xl font-bold">{getStatusCount("review") + getStatusCount("in_review")}</span>
              </div>
              
              <div className="flex flex-col p-4 bg-green-50 border border-green-100 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">Concluídas</span>
                </div>
                <span className="text-2xl font-bold">{getStatusCount("complete") + getStatusCount("approved")}</span>
              </div>
              
              <div className="flex flex-col p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center mb-2">
                  <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="font-medium">Rejeitadas</span>
                </div>
                <span className="text-2xl font-bold">{getStatusCount("rejected")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-0 flex flex-col space-y-2">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <CardTitle className="text-xl">Lista de Petições</CardTitle>
              <div className="flex items-center gap-2 w-full md:w-auto">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <Input
                    placeholder="Buscar petições..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-full"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            {renderStatusFilters()}
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
              <div className="flex items-center gap-2">
                <button 
                  className={`p-2 rounded-md transition-colors ${view === "grid" ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                  onClick={() => setView("grid")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                  </svg>
                </button>
                <button 
                  className={`p-2 rounded-md transition-colors ${view === "list" ? "bg-primary/10 text-primary" : "hover:bg-gray-100"}`}
                  onClick={() => setView("list")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                {!isMobile && (
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <span className="text-sm font-medium">Ordenar:</span>
                  </div>
                )}
                <Select value={sortOrder} onValueChange={setSortOrder}>
                  <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'}`}>
                    <SelectValue placeholder="Ordenar por">
                      {isMobile && <ArrowUpDown className="h-4 w-4 mr-2" />}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="oldest">Mais antigas</SelectItem>
                    <SelectItem value="title">Por título</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {isLoading ? (
              <PetitionListSkeleton />
            ) : filteredPetitions.length === 0 ? (
              <EmptyState />
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPetitions.map((petition) => (
                  <Card key={petition.id} className="overflow-hidden transition-all duration-200 hover:shadow-md">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-2">
                          <CardTitle className="text-base line-clamp-1">{petition.title}</CardTitle>
                          <div className="text-xs text-muted-foreground mt-1">
                            Criada em: {formatDate(petition.created_at)}
                          </div>
                        </div>
                        <StatusBadge status={petition.status as PetitionStatus} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4 min-h-[40px]">{petition.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Área:</span> {petition.legal_area || 'N/A'}
                        </div>
                        <Button variant="outline" size="sm" asChild className="ml-auto">
                          <Link to={`/petitions/${petition.id}`}>
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead className="hidden md:table-cell">Data</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden md:table-cell">Área</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPetitions.map((petition) => (
                      <TableRow key={petition.id}>
                        <TableCell className="font-medium">{petition.title}</TableCell>
                        <TableCell className="hidden md:table-cell">{formatDate(petition.created_at)}</TableCell>
                        <TableCell><StatusBadge status={petition.status as PetitionStatus} /></TableCell>
                        <TableCell className="hidden md:table-cell">{petition.legal_area || 'N/A'}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/petitions/${petition.id}`}>
                              <Eye className="h-4 w-4 mr-1" />
                              {isMobile ? "Ver" : "Ver Detalhes"}
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-600">
                <p>Erro ao carregar petições: {error.message}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PetitionList;

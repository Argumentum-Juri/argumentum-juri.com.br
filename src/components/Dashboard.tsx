
import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilePlus2, Settings, UserCog, ChevronRight, FileX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePetitions } from "@/hooks/usePetitions";
import { PetitionCard } from "@/components/PetitionCard";

const Dashboard: React.FC = () => {
  const { petitions, isLoading, error } = usePetitions();

  return (
    <div className="container">
      <h1 className="text-3xl font-bold mb-8 text-center md:text-left">Dashboard</h1>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <Link to="/petition/new" className="group h-40">
          <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <FilePlus2 className="mr-2 h-5 w-5" />
                Nova Petição
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Solicite a criação de uma nova petição jurídica.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/petition/settings" className="group h-40">
          <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Configurações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Configure as opções de formatação das suas petições.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link to="/profile" className="group h-40">
          <Card className="h-full transition-all group-hover:border-primary group-hover:shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <UserCog className="mr-2 h-5 w-5" />
                Meu Perfil
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Gerencie seus dados pessoais e configurações da conta.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Suas Petições Recentes - Added more margin top */}
      <div className="mt-20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">Suas Petições Recentes</h2>
          <Link
            to="/petitions"
            className="text-sm text-primary hover:text-primary/80 flex items-center"
          >
            Ver todas
            <ChevronRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Skeleton className="h-[220px] w-full" />
            <Skeleton className="h-[220px] w-full" />
            <Skeleton className="h-[220px] w-full" />
          </div>
        ) : petitions.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <FileX className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Nenhuma petição encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Você ainda não criou nenhuma petição. Comece criando sua primeira petição agora.
            </p>
            <Button asChild className="mt-6">
              <Link to="/petition/new">
                <FilePlus2 className="mr-2 h-4 w-4" />
                Criar Petição
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {petitions.slice(0, 6).map((petition) => (
              <PetitionCard key={petition.id} petition={petition} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;

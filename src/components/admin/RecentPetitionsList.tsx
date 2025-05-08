
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Petition } from '@/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PetitionStatus } from '@/types/enums';
import { formatDate } from '@/utils/formatDate';
import StatusBadge from '@/components/StatusBadge';
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';

interface RecentPetitionsListProps {
  petitions: Petition[];
  isLoading: boolean;
}

const RecentPetitionsList: React.FC<RecentPetitionsListProps> = ({
  petitions,
  isLoading
}) => {
  const navigate = useNavigate();

  const handleViewPetition = (id: string) => {
    navigate(`/admin/petitions/${id}`);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Petições Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="animate-pulse flex justify-between items-center p-3 rounded-md bg-muted/50">
                <div className="space-y-2">
                  <div className="h-4 w-48 bg-muted-foreground/20 rounded"></div>
                  <div className="h-3 w-32 bg-muted-foreground/20 rounded"></div>
                </div>
                <div className="h-6 w-24 bg-muted-foreground/20 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Petições Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {petitions.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhuma petição encontrada.
            </p>
          ) : (
            petitions.map((petition) => (
              <div
                key={petition.id}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 rounded-md border border-border hover:bg-muted/30 transition-colors"
              >
                <div className="space-y-1">
                  <h4 className="font-medium truncate max-w-[220px]">
                    {petition.title}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(petition.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2 sm:mt-0 w-full sm:w-auto">
                  <StatusBadge status={petition.status as PetitionStatus} />
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    className="ml-2"
                    onClick={() => handleViewPetition(petition.id)}
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentPetitionsList;


import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PetitionCard } from "@/components/PetitionCard";
import { Button } from "@/components/ui/button";
import { Petition } from '@/types';

interface AdminPetitionListProps {
  petitions: Petition[];
  isLoading: boolean;
  title?: string;
  showViewAll?: boolean;
}

const AdminPetitionList: React.FC<AdminPetitionListProps> = ({
  petitions,
  isLoading,
  title = "Petições Recentes",
  showViewAll = true
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="w-full h-[200px] animate-pulse bg-muted" />
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-bold">{title}</CardTitle>
        {showViewAll && (
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/petitions">Ver todas</Link>
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {petitions.map((petition) => (
            <PetitionCard
              key={petition.id}
              petition={petition}
              adminView={true}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminPetitionList;

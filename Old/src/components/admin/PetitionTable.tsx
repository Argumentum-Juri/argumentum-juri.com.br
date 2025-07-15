
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { Link } from 'react-router-dom';
import { Petition } from '@/types';
import { formatDate } from '@/utils/formatDate';
import PetitionStatusBadge from './PetitionStatusBadge';

interface PetitionTableProps {
  petitions: Petition[];
  isLoading: boolean;
  error: Error | null;
}

const PetitionTable: React.FC<PetitionTableProps> = ({ petitions, isLoading, error }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-500">
        <p>Erro ao carregar petições: {error.message}</p>
      </div>
    );
  }

  if (petitions.length === 0) {
    return (
      <div className="text-center py-10">
        <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-3" />
        <p className="text-muted-foreground">Nenhuma petição encontrada</p>
        <p className="text-sm text-muted-foreground mt-1">
          As petições aparecerão aqui quando os usuários solicitarem análise
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead className="hidden md:table-cell">Data</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Ações</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {petitions.map((petition) => (
          <TableRow key={petition.id}>
            <TableCell className="font-medium">{petition.title}</TableCell>
            <TableCell className="hidden md:table-cell">{formatDate(petition.createdAt)}</TableCell>
            <TableCell><PetitionStatusBadge status={petition.status} /></TableCell>
            <TableCell className="text-right">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/admin/petitions/${petition.id}`}>
                  {petition.status === 'pending' ? 'Elaborar' : 'Visualizar'}
                </Link>
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default PetitionTable;

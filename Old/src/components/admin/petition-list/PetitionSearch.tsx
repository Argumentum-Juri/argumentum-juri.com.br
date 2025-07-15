
import React from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface PetitionSearchProps {
  searchQuery: string;
  onSearchChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const PetitionSearch: React.FC<PetitionSearchProps> = ({ searchQuery, onSearchChange }) => {
  return (
    <div className="relative flex-1 sm:w-64">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Buscar petições..."
        className="pl-8 w-full"
        value={searchQuery}
        onChange={onSearchChange}
      />
    </div>
  );
};

export default PetitionSearch;

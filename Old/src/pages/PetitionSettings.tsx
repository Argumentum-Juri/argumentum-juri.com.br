
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import PetitionSettingsComponent from "@/components/PetitionSettings";

const PetitionSettings = () => {
  return (
    <div className="py-6">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" asChild className="mr-4">
            <Link to="/petitions">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold text-legal-text">Personalização de Petição</h1>
        </div>

        <PetitionSettingsComponent />
      </div>
    </div>
  );
};

export default PetitionSettings;

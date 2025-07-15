
// src/components/AddPartyModal.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ProcessPart } from '@/types/petition-form';

interface AddPartyModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onAddPart: (part: ProcessPart) => void;
}

export const AddPartyModal: React.FC<AddPartyModalProps> = ({ isOpen, onOpenChange, onAddPart }) => {
    const [partyType, setPartyType] = useState<'Autor' | 'Réu' | string>('Autor');
    const [fullName, setFullName] = useState('');
    const [represented, setRepresented] = useState<boolean | undefined>(undefined);
    const [error, setError] = useState('');

    const handleAddClick = () => {
        setError(''); // Limpa erros anteriores
        if (!fullName.trim()) {
            setError('O nome completo é obrigatório.');
            return;
        }
        if (represented === undefined) {
            setError('Selecione se você representa esta parte.');
            return;
        }

        const newPart: ProcessPart = {
            id: crypto.randomUUID(),
            type: partyType,
            fullName: fullName.trim(),
            represented: represented,
        };
        onAddPart(newPart);
        resetFormAndClose();
    };

    const resetFormAndClose = () => {
        setPartyType('Autor');
        setFullName('');
        setRepresented(undefined);
        setError('');
        onOpenChange(false);
    };

    if (!isOpen) {
        return null;
    }

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-[500px] flex flex-col gap-4 py-4" onEscapeKeyDown={resetFormAndClose} onPointerDownOutside={resetFormAndClose}>
              <DialogHeader>
                  <DialogTitle>Adicionar Parte ao Processo</DialogTitle>
                  <DialogDescription>
                      Preencha os detalhes da parte que deseja incluir.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4"> {/* Removi o py-4 daqui para aplicar no DialogContent */}
                  {/* Tipo da Parte */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right col-span-1">Tipo</Label>
                      <RadioGroup
                          value={partyType}
                          onValueChange={(value) => setPartyType(value)}
                          className="col-span-3 flex items-center space-x-4"
                      >
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Autor" id="r1" />
                              <Label htmlFor="r1">Autor</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="Réu" id="r2" />
                              <Label htmlFor="r2">Réu</Label>
                          </div>
                      </RadioGroup>
                  </div>
          
                  {/* Nome Completo */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right col-span-1">
                          Nome Completo*
                      </Label>
                      <Input
                          id="name"
                          value={fullName}
                          onChange={(e) => setFullName(e.target.value)}
                          className="col-span-3"
                          placeholder="Nome completo da parte"
                      />
                  </div>
          
                  {/* Representa a Parte? */}
                  <div className="grid grid-cols-4 items-center gap-4">
                      <Label className="text-right col-span-1">Você representa?*</Label>
                      <RadioGroup
                          value={represented === undefined ? '' : String(represented)}
                          onValueChange={(value) => setRepresented(value === 'true')}
                          className="col-span-3 flex flex-wrap items-center gap-4"
                      >
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="true" id="rep-yes" />
                              <Label htmlFor="rep-yes">Sim</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                              <RadioGroupItem value="false" id="rep-no" />
                              <Label htmlFor="rep-no">Não</Label>
                          </div>
                      </RadioGroup>
                  </div>
              </div>
          
              {/* Mensagem de erro - Agora fora do grid para ocupar a largura total abaixo */}
              {error && (
                  <div className="mt-4">
                      <p className="text-sm text-red-600 text-center p-2 bg-red-50 rounded border border-red-100">{error}</p>
                  </div>
              )}
          
              <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2 sm:gap-0"> {/* Adicionei mt-4 para separar da mensagem de erro */}
                  <DialogClose asChild>
                      <Button type="button" variant="outline" className="w-full sm:w-auto">Cancelar</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleAddClick} className="w-full sm:w-auto">Adicionar Parte</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>
    );
};

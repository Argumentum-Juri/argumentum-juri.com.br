
import React from 'react';
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { PetitionSettings } from '@/types';

interface LayoutSettingsProps {
  settings: Partial<PetitionSettings>;
  onChange: (settings: Partial<PetitionSettings>) => void;
}

const LayoutSettings: React.FC<LayoutSettingsProps> = ({ settings, onChange }) => {
  const handleMarginChange = (value: 'small' | 'normal' | 'large') => {
    onChange({
      ...settings,
      margin_size: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Label>Tamanho das margens</Label>
        <RadioGroup 
          value={settings.margin_size} 
          onValueChange={(value) => handleMarginChange(value as 'small' | 'normal' | 'large')}
          className="flex flex-col space-y-1"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="small" id="margin-small" />
            <Label htmlFor="margin-small">Pequena (2cm)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="normal" id="margin-normal" />
            <Label htmlFor="margin-normal">Normal (3cm)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="large" id="margin-large" />
            <Label htmlFor="margin-large">Grande (4cm)</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
};

export default LayoutSettings;

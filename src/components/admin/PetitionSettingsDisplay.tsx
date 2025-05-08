
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PetitionSettings } from '@/types';
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface PetitionSettingsDisplayProps {
  settings?: Partial<PetitionSettings>;
  isLoading: boolean;
}

const PetitionSettingsDisplay: React.FC<PetitionSettingsDisplayProps> = ({
  settings,
  isLoading
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Sem configurações</h3>
            <p className="text-muted-foreground">
              O usuário ainda não definiu configurações de petição.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-6">
          {/* Layout */}
          <div>
            <h3 className="text-lg font-medium mb-3">Layout</h3>
            <div className="grid grid-cols-2 gap-y-3">
              <div className="text-muted-foreground">Margens:</div>
              <div>{renderMarginSize(settings.margin_size)}</div>
              
              <div className="text-muted-foreground">Cor primária:</div>
              <div className="flex items-center gap-2">
                {settings.primary_color && (
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: settings.primary_color }}
                  ></div>
                )}
                {settings.primary_color || 'Não definida'}
              </div>
              
              <div className="text-muted-foreground">Cor secundária:</div>
              <div className="flex items-center gap-2">
                {settings.accent_color && (
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: settings.accent_color }}
                  ></div>
                )}
                {settings.accent_color || 'Não definida'}
              </div>
            </div>
          </div>

          <Separator />

          {/* Fontes */}
          <div>
            <h3 className="text-lg font-medium mb-3">Fontes</h3>
            <div className="grid grid-cols-2 gap-y-3">
              <div className="text-muted-foreground">Família da fonte:</div>
              <div>{settings.font_family || 'Padrão'}</div>
              
              <div className="text-muted-foreground">Tamanho da fonte:</div>
              <div>{settings.font_size || 'Padrão'}</div>
              
              <div className="text-muted-foreground">Espaçamento entre linhas:</div>
              <div>{settings.line_spacing || 'Padrão'}</div>
              
              <div className="text-muted-foreground">Recuo de parágrafo:</div>
              <div>{settings.paragraph_indent || 'Padrão'}</div>
            </div>
          </div>

          <Separator />

          {/* Papel timbrado */}
          <div>
            <h3 className="text-lg font-medium mb-3">Papel timbrado</h3>
            <div className="grid grid-cols-2 gap-y-3">
              <div className="text-muted-foreground">Usar papel timbrado:</div>
              <div className="flex items-center">
                {settings.use_letterhead ? (
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500 mr-2" />
                )}
                {settings.use_letterhead ? 'Sim' : 'Não'}
              </div>
              
              <div className="text-muted-foreground">Logo:</div>
              <div>
                {settings.logo_url ? (
                  <img 
                    src={settings.logo_url} 
                    alt="Logo" 
                    className="h-10 object-contain"
                  />
                ) : (
                  'Não definido'
                )}
              </div>
              
              <div className="text-muted-foreground">Modelo de papel timbrado:</div>
              <div>
                {settings.letterhead_template_url ? (
                  <a 
                    href={settings.letterhead_template_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Ver arquivo
                  </a>
                ) : (
                  'Não definido'
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

function renderMarginSize(size?: string) {
  switch (size) {
    case 'narrow':
      return 'Estreito';
    case 'normal':
      return 'Normal';
    case 'wide':
      return 'Largo';
    default:
      return 'Padrão';
  }
}

export default PetitionSettingsDisplay;

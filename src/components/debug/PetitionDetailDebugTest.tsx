
import React from 'react';
import { usePetitionDetailDebug } from '@/hooks/use-petition-detail-debug';
import { usePetitionDetailFetcher } from '@/hooks/use-petition-detail-fetcher';
import { usePetitionDetailRest } from '@/hooks/use-petition-detail-rest';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export const PetitionDetailDebugTest = () => {
  const debugHook = usePetitionDetailDebug();
  const fetcherHook = usePetitionDetailFetcher();
  const restHook = usePetitionDetailRest();

  return (
    <div className="min-h-screen p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Debug Petition Detail Hooks</h1>
          <p className="text-muted-foreground">
            Comparação entre hooks de debug para identificar problemas de fetch
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Debug Hook - Fetch Direto */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Debug Hook (Fetch Direto)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Loading:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    debugHook.loading 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {debugHook.loading ? 'true' : 'false'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Error:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    debugHook.error 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {debugHook.error || 'null'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Data:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    debugHook.data 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {debugHook.data ? 'loaded' : 'null'}
                  </div>
                </div>
              </div>

              {debugHook.data && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Dados da Petição:</h4>
                  <div className="bg-muted p-3 rounded text-xs">
                    <div><strong>ID:</strong> {debugHook.data.id}</div>
                    <div><strong>Título:</strong> {debugHook.data.title}</div>
                    <div><strong>Status:</strong> {debugHook.data.status}</div>
                    <div><strong>Criado em:</strong> {debugHook.data.created_at}</div>
                  </div>
                </div>
              )}

              {debugHook.error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <h4 className="font-medium text-sm text-red-800 mb-1">Erro:</h4>
                  <p className="text-xs text-red-600">{debugHook.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Fetcher Hook - Com Instrumentação */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Fetcher Hook (Instrumentado)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Loading:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    fetcherHook.loading 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {fetcherHook.loading ? 'true' : 'false'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Error:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    fetcherHook.error 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {fetcherHook.error || 'null'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Data:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    fetcherHook.data 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {fetcherHook.data ? 'loaded' : 'null'}
                  </div>
                </div>
              </div>

              {fetcherHook.data && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Dados da Petição:</h4>
                  <div className="bg-muted p-3 rounded text-xs">
                    <div><strong>ID:</strong> {fetcherHook.data.id}</div>
                    <div><strong>Título:</strong> {fetcherHook.data.title}</div>
                    <div><strong>Status:</strong> {fetcherHook.data.status}</div>
                    <div><strong>Criado em:</strong> {fetcherHook.data.created_at}</div>
                  </div>
                </div>
              )}

              {fetcherHook.error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <h4 className="font-medium text-sm text-red-800 mb-1">Erro:</h4>
                  <p className="text-xs text-red-600">{fetcherHook.error}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* REST Hook - API REST do Supabase */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">REST Hook (API Supabase)</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="font-medium">Loading:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    restHook.loading 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {restHook.loading ? 'true' : 'false'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Error:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    restHook.error 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {restHook.error || 'null'}
                  </div>
                </div>
                <div>
                  <span className="font-medium">Data:</span>
                  <div className={`mt-1 px-2 py-1 rounded text-xs ${
                    restHook.data 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {restHook.data ? 'loaded' : 'null'}
                  </div>
                </div>
              </div>

              {restHook.data && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Dados da Petição:</h4>
                  <div className="bg-muted p-3 rounded text-xs">
                    <div><strong>ID:</strong> {restHook.data.id}</div>
                    <div><strong>Título:</strong> {restHook.data.title}</div>
                    <div><strong>Status:</strong> {restHook.data.status}</div>
                    <div><strong>Criado em:</strong> {restHook.data.created_at}</div>
                  </div>
                </div>
              )}

              {restHook.error && (
                <div className="bg-red-50 border border-red-200 p-3 rounded">
                  <h4 className="font-medium text-sm text-red-800 mb-1">Erro:</h4>
                  <p className="text-xs text-red-600">{restHook.error}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Console Logs Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Instruções para Debug</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="space-y-2">
              <p><strong>1. Abra o Console do Navegador</strong> (F12 → Console)</p>
              <p><strong>2. Navegue para uma URL de petição</strong> (ex: /petitions/123e4567-e89b-12d3-a456-426614174000)</p>
              <p><strong>3. Observe os logs:</strong></p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                <li><code>[usePetitionDetailDebug]</code> - Logs do hook de debug (fetch direto)</li>
                <li><code>[usePetitionDetailFetcher]</code> - Logs do hook com fetcher instrumentado</li>
                <li><code>[usePetitionDetailRest]</code> - Logs do hook REST direto ao Supabase</li>
                <li><code>[fetcher]</code> - Logs das requisições HTTP</li>
                <li><code>[instrumentedFetch]</code> - Logs das requisições Supabase</li>
              </ul>
              <p><strong>4. Compare os comportamentos</strong> entre os três hooks</p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
              <p className="text-yellow-800 text-xs">
                <strong>Nota:</strong> O novo hook REST usa a API REST do Supabase diretamente, 
                sem passar pelo cliente JavaScript. Isso deve resolver o problema do JSON inválido.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

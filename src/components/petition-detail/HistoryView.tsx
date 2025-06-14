
import React, { useEffect, useState } from 'react';
import { Petition, PetitionReview, Profile } from '@/types';
import { formatDate } from '@/utils/formatDate';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { petitionService } from '@/services';
import { PetitionStatus } from '@/types/enums';
import { cn } from '@/lib/utils';
import {
  Loader2,
  History,
  FilePlus,
  CheckCircle,
  XCircle,
  UserCircle,
  RefreshCw
} from "lucide-react";

interface HistoryViewProps {
  petition: Petition;
}

interface TimelineItem {
  id: string;
  type: 'review' | 'status_change' | 'creation' | 'rejection';
  content: string;
  date: string;
  user?: Partial<Profile> | null;
  status?: PetitionStatus;
  isApproved?: boolean | null;
}

const HistoryView: React.FC<HistoryViewProps> = ({ petition }) => {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistoryData = async () => {
      if (!petition?.id) {
         setError("ID da Petição inválido.");
         setLoading(false);
         return;
      }
      setLoading(true);
      setError(null);
      try {
        const [reviews] = await Promise.all([
            petitionService.getReviews(petition.id).catch(err => { console.error("Erro ao buscar reviews:", err); return []; }),
        ]);

        const historyItems: TimelineItem[] = [];

        // Evento de Criação
        historyItems.push({
          id: `creation-${petition.id}`,
          type: 'creation',
          content: 'Petição criada',
          date: petition.created_at || petition.createdAt || new Date().toISOString(), // Fallback to either field
          user: petition.user
        });

        // Adiciona Reviews
        reviews?.forEach((review: PetitionReview) => {
            historyItems.push({
                id: `review-${review.id}`,
                type: 'review',
                content: review.content || "Revisão realizada.",
                date: review.created_at || new Date().toISOString(), // Using the correct field
                isApproved: review.is_approved,
                user: {
                    id: review.reviewer_id || undefined,
                    name: "Revisor"
                }
            });
        });

         // Adiciona mudança de status final
         if ((petition.updated_at || petition.updatedAt) !== (petition.created_at || petition.createdAt) && petition.status !== PetitionStatus.REJECTED) {
             historyItems.push({
                 id: `status-update-${petition.id}`,
                 type: 'status_change',
                 content: `Status alterado para: ${petition.status}`,
                 date: petition.updated_at || petition.updatedAt || new Date().toISOString(), // Fallback to either field
                 status: petition.status
             });
         }

        // Ordena por data
        historyItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setTimelineItems(historyItems);
      } catch (error) {
        console.error('Erro ao carregar histórico:', error);
        setError("Falha ao carregar o histórico da petição.");
        setTimelineItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHistoryData();
  }, [petition]);

  // Mapeamento de tipo de evento para ícone e cor (Tailwind classes)
  const getTimelineIcon = (item: TimelineItem) => {
      switch (item.type) {
          case 'creation': return <FilePlus className="h-4 w-4 text-blue-600" />;
          case 'review': return item.isApproved ? <CheckCircle className="h-4 w-4 text-green-600" /> : <UserCircle className="h-4 w-4 text-gray-500" />;
          case 'status_change': return <RefreshCw className="h-4 w-4 text-purple-600" />;
          case 'rejection': return <XCircle className="h-4 w-4 text-destructive" />;
          default: return <History className="h-4 w-4 text-gray-500" />;
      }
  };
  const getTimelineColor = (item: TimelineItem): string => {
     switch (item.type) {
          case 'creation': return 'bg-blue-600';
          case 'review': return item.isApproved ? 'bg-green-600' : 'bg-gray-500';
          case 'status_change': return 'bg-purple-600';
          case 'rejection': return 'bg-destructive';
          default: return 'bg-gray-500';
      }
  }

  // --- JSX ---
  if (loading) {
    return (
        <div className="py-6 flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Carregando histórico...
        </div>
    );
  }
   if (error) {
    return (
        <div className="py-6 text-center text-destructive">
            <p>{error}</p>
        </div>
    );
  }


  if (timelineItems.length === 0) {
    return (
        <div className="py-10 text-center border rounded-md bg-secondary/5">
            <History className="mx-auto h-10 w-10 text-muted-foreground opacity-40" />
            <h3 className="mt-2 text-base font-medium text-foreground">Nenhum histórico registrado</h3>
            <p className="mt-1 text-sm text-muted-foreground">
                As ações importantes aparecerão aqui.
            </p>
        </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-0 overflow-hidden">
        <ScrollArea className="h-[60vh] md:h-[70vh] max-h-[700px]">
          <div className="p-4 md:p-6 space-y-6">
            {timelineItems.map((item, index) => (
              <div key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                      <div className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-full border",
                          item.type === 'rejection' ? 'border-destructive/30 bg-destructive/10' : 'border-gray-200 bg-background'
                      )}>
                         {getTimelineIcon(item)}
                      </div>
                      {index < timelineItems.length - 1 && (
                          <div className="w-px h-full bg-border mt-1"></div>
                      )}
                  </div>

                  <div className="flex-1 pb-6">
                      <Card className="shadow-sm">
                          <CardHeader className="py-2 px-4 border-b flex flex-row items-center justify-between space-y-0">
                              <div>
                                  <CardTitle className="text-sm font-medium">
                                      { item.type === 'creation' && 'Petição Criada' }
                                      { item.type === 'review' && (item.isApproved ? 'Revisão (Aprovada)' : 'Revisão') }
                                      { item.type === 'status_change' && 'Mudança de Status' }
                                      { item.type === 'rejection' && 'Petição Rejeitada' }
                                  </CardTitle>
                                  <CardDescription className="text-xs">
                                      {formatDate(item.date)}
                                  </CardDescription>
                              </div>
                              {item.user && (
                                  <div className="flex items-center gap-2" title={item.user.name || item.user.email || 'ID: '+item.user.id}>
                                      <span className="text-xs text-muted-foreground hidden md:inline">{item.user.name || item.user.email}</span>
                                      <Avatar className="h-6 w-6 border">
                                          <AvatarImage src={item.user.avatar_url || undefined} />
                                          <AvatarFallback className="text-xs">{getInitials(item.user.name || item.user.email)}</AvatarFallback>
                                      </Avatar>
                                  </div>
                              )}
                          </CardHeader>
                          <CardContent className="p-4 text-sm">
                               { item.type === 'review' && <p>{item.content}</p> }
                               { item.type === 'rejection' && <p>Motivo: {item.content}</p> }
                               { (item.type === 'creation' || item.type === 'status_change') && <p>{item.content}</p> }
                          </CardContent>
                      </Card>
                  </div>
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </Card>
    </div>
  );
};

// GetInitials helper
const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase();
};


export default HistoryView;

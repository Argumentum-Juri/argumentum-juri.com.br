
import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, MessageCircle } from "lucide-react";
import { Petition, PetitionStatus } from "@/types";
import StatusBadge from "../StatusBadge";
import { formatDate } from '@/utils/formatDate';
import { supabase } from '@/integrations/supabase/client';

interface PetitionCardProps {
  petition: Petition;
}

const PetitionCard: React.FC<PetitionCardProps> = ({ petition }) => {
  const [hasNewMessage, setHasNewMessage] = useState(false);

  useEffect(() => {
    // Subscribe to real-time updates for new comments
    const channel = supabase
      .channel(`petition-${petition.id}-messages`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'petition_comments',
          filter: `petition_id=eq.${petition.id}`
        },
        () => {
          setHasNewMessage(true);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petition.id]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex-1 pr-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base line-clamp-1">
                {petition.title}
              </CardTitle>
              {hasNewMessage && (
                <div className="relative">
                  <MessageCircle className="h-4 w-4 text-primary animate-pulse" />
                  <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full" />
                </div>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Criada em: {formatDate(petition.created_at)}
            </div>
          </div>
          <StatusBadge status={petition.status as PetitionStatus} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-700 line-clamp-2 mb-4">{petition.description}</p>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to={`/petitions/${petition.id}`}>
            <FileText className="h-4 w-4 mr-2" />
            Ver Detalhes
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
};

export default PetitionCard;

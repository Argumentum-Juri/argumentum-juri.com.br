
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Send, MessageCircle, User, Loader2 } from "lucide-react";
import { useGoAuth } from "@/contexts/GoAuthContext";
import { formatDate } from "@/utils/formatDate";
import { toast } from "sonner";
import { petitionService } from "@/services";
import { PetitionComment } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface MessagesViewProps {
  petitionId: string;
  isAdmin?: boolean;
}

const MessagesView: React.FC<MessagesViewProps> = ({ petitionId, isAdmin = false }) => {
  const { user } = useGoAuth();
  const [messages, setMessages] = useState<PetitionComment[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [hasNewMessage, setHasNewMessage] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Função para buscar mensagens
  const fetchMessages = useCallback(async () => {
    try {
      const messagesData = await petitionService.petitionComments.getComments(petitionId);
      setMessages(messagesData.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      ));
      setHasNewMessage(false);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Não foi possível carregar as mensagens");
    } finally {
      if (isLoading) setIsLoading(false);
    }
  }, [petitionId, isLoading]);

  // Efeito para buscar mensagens e inscrever em atualizações
  useEffect(() => {
    setIsLoading(true);
    fetchMessages();

    const channel = supabase
      .channel(`petition-messages-${petitionId}`)
      .on<PetitionComment>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'petition_comments',
          filter: `petition_id=eq.${petitionId}`
        },
        (payload) => {
          console.log('Nova mensagem recebida via realtime:', payload.new);
          setMessages(prev => {
             if (prev.some(msg => msg.id === payload.new.id)) {
                 return prev;
             }
             const messageWithPotentialAuthor = {
                 ...payload.new,
             };
             return [...prev, messageWithPotentialAuthor as PetitionComment];
          });

          if (payload.new.author_id !== user?.id) {
            setHasNewMessage(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [petitionId, user?.id]);

  // Efeito para rolar para o fim
  useEffect(() => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector<HTMLDivElement>('[data-radix-scroll-area-viewport]');
      if (viewport) {
        setTimeout(() => {
           viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
        }, 100);
      }
    }
  }, [messages]);

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: PetitionComment = {
        id: tempId,
        content: newMessage,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        author_id: user.id,
        petition_id: petitionId,
        author: {
            id: user.id,
            name: user.name || user.email || "Você",
            email: user.email || "",
            avatar_url: undefined,
        }
    };

    setMessages(prev => [...prev, optimisticMessage]);
    const messageToSend = newMessage;
    setNewMessage("");
    setIsSending(true);

    try {
      const addedComment = await petitionService.petitionComments.addComment(petitionId, messageToSend);

      if (addedComment) {
        setMessages(prev => prev.map(msg => msg.id === tempId ? addedComment : msg));
      } else {
          throw new Error("Falha ao receber confirmação do servidor.");
      }
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Não foi possível enviar a mensagem");
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      setNewMessage(messageToSend);
    } finally {
      setIsSending(false);
    }
  };

  // Obter iniciais do nome
  const getInitials = (name?: string): string => {
    if (!name) return "?";
    return name
      .split(' ')
      .map(part => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <Card className="flex flex-col h-[60vh] md:h-[70vh] max-h-[700px] overflow-hidden border-t pt-0 shadow-none">
       {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                 <Loader2 className="h-6 w-6 animate-spin mr-2" /> Carregando mensagens...
            </div>
       ) : (
          <ScrollArea className="flex-1 p-4 md:p-6" ref={scrollAreaRef}>
              {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                     <MessageCircle className="h-12 w-12 mb-4 text-gray-400" />
                     <p className="text-lg font-medium">Nenhuma mensagem ainda.</p>
                     <p className="text-sm">Seja o primeiro a iniciar a conversa!</p>
                  </div>
              ) : (
                  <div className="space-y-5 pb-4">
                      {messages.map(message => {
                          const isCurrentUser = message.author_id === user?.id;
                          return (
                              <div
                                  key={message.id}
                                  className={cn(
                                      "flex items-start gap-3",
                                      isCurrentUser ? "justify-end" : "justify-start"
                                  )}
                              >
                                  {!isCurrentUser && (
                                      <Avatar className="h-9 w-9 border">
                                          <AvatarImage src={message.author?.avatar_url || undefined} />
                                          <AvatarFallback className="text-xs bg-muted">
                                              {getInitials(message.author?.name)}
                                          </AvatarFallback>
                                      </Avatar>
                                  )}

                                  <div className={cn(
                                      "flex flex-col max-w-[75%] md:max-w-[65%]",
                                      isCurrentUser ? "items-end" : "items-start"
                                  )}>
                                      <div className={cn(
                                          "px-4 py-2.5 rounded-xl shadow-sm",
                                          isCurrentUser
                                              ? "bg-argumentum-gold text-white rounded-br-none"
                                              : "bg-gray-100 text-gray-900 rounded-bl-none"
                                      )}>
                                          <p className="text-sm whitespace-pre-wrap break-words">
                                              {message.content}
                                          </p>
                                      </div>
                                      <p className="text-xs text-muted-foreground mt-1 px-1">
                                          {message.author?.name?.split(' ')[0] || message.author?.email || 'Usuário'}
                                          {' • '}
                                          {formatDate(message.created_at)}
                                      </p>
                                  </div>

                                  {isCurrentUser && (
                                      <Avatar className="h-9 w-9 border">
                                          <AvatarImage src={message.author?.avatar_url || undefined} />
                                          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                                              {getInitials(message.author?.name)}
                                          </AvatarFallback>
                                      </Avatar>
                                  )}
                              </div>
                          );
                      })}
                  </div>
              )}
             <ScrollBar orientation="vertical" />
          </ScrollArea>
       )}

      <CardFooter className="p-4 border-t bg-background">
          <div className="flex w-full items-center gap-2">
              <Textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 resize-none border rounded-lg focus-visible:ring-1 focus-visible:ring-primary"
                  rows={1}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          if (!isSending) handleSendMessage();
                      }
                  }}
              />
              <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || isSending}
                  size="icon"
                  className="bg-argumentum-gold hover:bg-argumentum-goldLight text-white"
              >
                  {isSending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                      <Send className="h-5 w-5" />
                  )}
                  <span className="sr-only">Enviar Mensagem</span>
              </Button>
          </div>
      </CardFooter>
    </Card>
  );
};

export default MessagesView;

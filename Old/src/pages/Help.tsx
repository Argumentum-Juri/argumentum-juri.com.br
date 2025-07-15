
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";

const Help = () => {
  return (
    <div className="py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold mb-4">Central de Ajuda</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Encontre respostas para suas dúvidas e aprenda a utilizar todos os recursos da nossa plataforma
          </p>
          
          <div className="relative max-w-xl mx-auto mt-8">
            <Search className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por assunto ou palavra-chave..." 
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Primeiros Passos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Como criar uma conta</a></li>
                <li><a href="#" className="text-primary hover:underline">Configurando seu perfil</a></li>
                <li><a href="#" className="text-primary hover:underline">Guia de navegação</a></li>
                <li><a href="#" className="text-primary hover:underline">Criando sua primeira petição</a></li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Petições</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Como solicitar uma petição</a></li>
                <li><a href="#" className="text-primary hover:underline">Enviando anexos e documentos</a></li>
                <li><a href="#" className="text-primary hover:underline">Processo de revisão</a></li>
                <li><a href="#" className="text-primary hover:underline">Aprovação e entrega final</a></li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Planos e Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Visão geral dos planos</a></li>
                <li><a href="#" className="text-primary hover:underline">Como comprar tokens</a></li>
                <li><a href="#" className="text-primary hover:underline">Métodos de pagamento</a></li>
                <li><a href="#" className="text-primary hover:underline">Faturas e recibos</a></li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Equipe</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Criando uma equipe</a></li>
                <li><a href="#" className="text-primary hover:underline">Convidando membros</a></li>
                <li><a href="#" className="text-primary hover:underline">Gerenciando permissões</a></li>
                <li><a href="#" className="text-primary hover:underline">Colaboração em documentos</a></li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Configurações</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Personalizando modelos</a></li>
                <li><a href="#" className="text-primary hover:underline">Integrações disponíveis</a></li>
                <li><a href="#" className="text-primary hover:underline">Segurança da conta</a></li>
                <li><a href="#" className="text-primary hover:underline">Gerenciar notificações</a></li>
              </ul>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Suporte Técnico</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                <li><a href="#" className="text-primary hover:underline">Problemas comuns</a></li>
                <li><a href="#" className="text-primary hover:underline">Requisitos do sistema</a></li>
                <li><a href="#" className="text-primary hover:underline">Contatar suporte</a></li>
                <li><a href="#" className="text-primary hover:underline">Atualizações da plataforma</a></li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Help;


import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  FileText,
  Home,
  Settings,
  Users,
  Coins,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTeamOwnership } from '@/hooks/useTeamOwnership';
import { Logo } from "@/components/ui/Logo";

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items?: {
    href: string;
    title: string;
    icon: React.ReactNode;
    shown?: boolean;
  }[];
  className?: string;
}

const SidebarNav = ({ className, items: propItems, ...props }: SidebarNavProps) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, signOut, teamId } = useAuth();
  const { isOwner: isTeamOwner } = useTeamOwnership(teamId);
  
  const defaultItems = [
    {
      href: "/dashboard",
      title: "Dashboard",
      icon: <Home className="h-5 w-5 mr-2" />,
      shown: true,
    },
    {
      href: "/petitions",
      title: "Petições",
      icon: <FileText className="h-5 w-5 mr-2" />,
      shown: true,
    },
    {
      href: "/teams",
      title: "Equipe",
      icon: <Users className="h-5 w-5 mr-2" />,
      shown: true,
    },
    {
      href: "/tokens",
      title: "Loja de Tokens",
      icon: <Coins className="h-5 w-5 mr-2" />,
      shown: isTeamOwner, // Mostrar apenas para proprietários de equipes
    },
    {
      href: "/stats",
      title: "Estatísticas",
      icon: <BarChart3 className="h-5 w-5 mr-2" />,
      shown: true,
    },
    {
      href: "/petition-settings",
      title: "Personalização",
      icon: <Settings className="h-5 w-5 mr-2" />,
      shown: true,
    },
  ];

  const items = propItems || defaultItems;
  const visibleItems = items.filter(item => item.shown !== false);
  
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <nav
      className={cn(
        "flex flex-col lg:space-y-1 px-3 lg:px-0",
        className
      )}
      {...props}
    >
      <div className="hidden lg:flex items-center h-14 px-3 mb-2">
        <Link to="/" className="flex items-center text-xl font-semibold">
          <Logo className="h-8 w-8 mr-2" />
          <span>EscribaAI</span>
        </Link>
      </div>
      
      {visibleItems.map((item) => (
        <Button
          key={item.href}
          variant={pathname === item.href ? "secondary" : "ghost"}
          className={cn(
            "justify-start font-normal",
            pathname === item.href ? "bg-accent" : ""
          )}
          asChild
        >
          <Link to={item.href}>
            {item.icon}
            {item.title}
            {pathname === item.href && (
              <ChevronRight className="ml-auto h-4 w-4" />
            )}
          </Link>
        </Button>
      ))}
      
      <div className="h-px bg-border my-4" />
      
      <Button
        variant="ghost"
        className="justify-start font-normal text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10"
        onClick={handleLogout}
      >
        <LogOut className="h-5 w-5 mr-2" />
        Sair
      </Button>
    </nav>
  );
};

export default SidebarNav;

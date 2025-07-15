import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGoAuth } from '@/contexts/GoAuthContext';
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Feather, LogOut, User, Shield, Menu, BarChart2, 
  Users, Scroll, Wrench, Coins, FilePlus 
} from "lucide-react";
import { useIsMobile } from '@/hooks/use-mobile';
import { Badge } from '@/components/ui/badge';
import { useUserTokens } from '@/hooks/useUserTokens';

export const TokenContext = React.createContext<{
  tokenCount: number | null;
  loadingTokens: boolean;
  refreshTokens: (forceRefresh?: boolean) => Promise<void>;
}>({
  tokenCount: null,
  loadingTokens: true,
  refreshTokens: async () => {}
});

export const useTokenBalance = () => React.useContext(TokenContext);

const Header = () => {
  const { user, signOut } = useGoAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Usar o hook correto para buscar tokens
  const { tokens: userTokens, isLoading: loadingUserTokens, refreshTokens } = useUserTokens();

  const handleLogout = async () => {
    try {
      console.log('[Header] Fazendo logout');
      await signOut();
      navigate('/');
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };
  
  const handleLogoClick = () => {
    if (user) {
      navigate(user.isAdmin ? '/admin/dashboard' : '/dashboard');
    } else {
      navigate('/');
    }
  };
  
  const navLinks = user && !user.isAdmin ? [
    { to: "/petitions/new", label: "Nova Petição", icon: <FilePlus className="h-4 w-4 mr-1" /> },
    { to: "/petitions", label: "Petições", icon: <Scroll className="h-4 w-4 mr-1" /> }, 
    { to: "/teams", label: "Equipe", icon: <Users className="h-4 w-4 mr-1" /> }, 
    { to: "/petition/settings", label: "Personalização", icon: <Wrench className="h-4 w-4 mr-1" /> },
    { to: "/tokens", label: "Loja de Tokens", icon: <Coins className="h-4 w-4 mr-1" /> },
    { to: "/stats", label: "Estatísticas", icon: <BarChart2 className="h-4 w-4 mr-1" /> }
  ] : user && user.isAdmin ? [
    { to: "/admin/petitions", label: "Petições", icon: <Scroll className="h-4 w-4 mr-1" /> }, 
    { to: "/admin/users", label: "Usuários", icon: <Users className="h-4 w-4 mr-1" /> }
  ] : [];
  
  const renderNavLinks = () => (
    <nav className="flex flex-col md:flex-row md:space-x-4 space-y-2 md:space-y-0">
      {navLinks.map(link => (
        <Link 
          key={link.to} 
          to={link.to} 
          className="text-argumentum-gold hover:text-argumentum-goldLight px-3 py-2 rounded-md text-sm font-medium flex items-center" 
          onClick={() => setMobileMenuOpen(false)}
        >
          {link.icon && link.icon}
          {link.label}
        </Link>
      ))}
    </nav>
  );
  
  const renderUserDropdown = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 md:h-10 md:w-10 rounded-full">
          <Avatar className="h-8 w-8 md:h-10 md:w-10 cursor-pointer">
            <AvatarFallback className={`${user?.isAdmin ? 'bg-argumentum-goldDark' : 'bg-argumentum-gold'} text-argumentum-dark text-xs md:text-sm`}>
              {user?.email ? user.email[0].toUpperCase() : 'U'}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="border-argumentum-light bg-white">
        <DropdownMenuLabel className="flex items-center text-argumentum-text">
          <span className="truncate max-w-[180px]">{user?.email}</span>
          {user?.isAdmin && <Shield className="ml-2 h-4 w-4 text-argumentum-gold flex-shrink-0" />}
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-argumentum-light" />
        {user?.isAdmin ? (
            <DropdownMenuItem asChild className="text-argumentum-text hover:bg-argumentum-light hover:text-argumentum-gold">
              <Link to="/admin/admins" className="flex items-center w-full cursor-pointer">
                <Shield className="mr-2 h-4 w-4" />
                <span>Gerenciar Administradores</span>
              </Link>
            </DropdownMenuItem>
        ) : (
            <DropdownMenuItem asChild className="text-argumentum-text hover:bg-argumentum-light hover:text-argumentum-gold">
              <Link to="/profile" className="flex items-center w-full cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Perfil</span>
              </Link>
            </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-argumentum-light" />
        <DropdownMenuItem onClick={handleLogout} className="text-argumentum-text hover:bg-argumentum-light hover:text-argumentum-gold cursor-pointer">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
  
  const renderMobileMenu = () => (
    <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden text-argumentum-gold hover:text-argumentum-goldLight hover:bg-argumentum-light">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Abrir menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[250px] bg-argumentum-dark border-argumentum-light">
        <div className="flex flex-col h-full">
          <div className="py-4">
            <Link to={user && user.isAdmin ? "/admin/dashboard" : user ? "/dashboard" : "/"} className="flex items-center space-x-2 text-xl font-serif font-bold text-argumentum-gold" onClick={() => {setMobileMenuOpen(false); handleLogoClick();}}>
              <Feather className="h-5 w-5 text-argumentum-gold animate-feather-float" />
              <span>Argumentum</span>
            </Link>
          </div>
          <div className="flex flex-col py-4">
            {user ? renderNavLinks() : (
              <>
                <Link to="/auth?tab=signin" className="text-argumentum-gold hover:text-argumentum-goldLight px-3 py-2 rounded-md text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Entrar
                </Link>
                <Link to="/auth?tab=signup" className="text-argumentum-gold hover:text-argumentum-goldLight px-3 py-2 rounded-md text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                  Registrar
                </Link>
              </>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
  
  const renderAuthButtons = () => (
    <div className="flex items-center space-x-2">
      <Button variant="ghost" asChild className="text-argumentum-gold hover:text-argumentum-goldLight hover:bg-argumentum-light px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm">
        <Link to="/auth?tab=signin">Entrar</Link>
      </Button>
      <Button asChild className="bg-argumentum-gold hover:bg-argumentum-goldLight text-argumentum-dark px-2 md:px-4 py-1 md:py-2 text-xs md:text-sm">
        <Link to="/auth?tab=signup">Registrar</Link>
      </Button>
    </div>
  );
  
  const renderTokenBalance = () => {
    if (!user || user.isAdmin) return null; 
    return (
      <Link to="/tokens" className="flex items-center mr-2 md:mr-4 cursor-pointer">
        <Badge variant="outline" className="bg-argumentum-goldLight text-argumentum-dark border-argumentum-gold flex items-center px-2 md:px-3 py-0.5 md:py-1">
          <Coins className="h-3 w-3 md:h-3.5 md:w-3.5 mr-1 md:mr-1.5" />
          {loadingUserTokens ? (
            <span className="text-xs">...</span>
          ) : (
            <span className="text-xs font-medium whitespace-nowrap">{userTokens ?? 0} Tokens</span>
          )}
        </Badge>
      </Link>
    );
  };
  
  const tokenContextValue = {
    tokenCount: userTokens,
    loadingTokens: loadingUserTokens,
    refreshTokens
  };
  
  return (
    <TokenContext.Provider value={tokenContextValue}>
      <header className="bg-argumentum-dark border-b border-argumentum-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-16">
            <div className="flex items-center">
              {isMobile && renderMobileMenu()}
              <div onClick={handleLogoClick} className="flex items-center space-x-1 md:space-x-2 cursor-pointer">
                <Feather className="h-5 w-5 md:h-6 md:w-6 text-argumentum-gold animate-feather-float" />
                <span className="text-lg md:text-xl font-serif font-bold text-argumentum-gold truncate">Argumentum</span>
              </div>
              <div className="hidden md:ml-8 md:flex">
                {user && renderNavLinks()}
              </div>
            </div>
            <div className="flex items-center">
              {renderTokenBalance()}
              {user ? renderUserDropdown() : renderAuthButtons()}
            </div>
          </div>
        </div>
      </header>
    </TokenContext.Provider>
  );
};

export default Header;

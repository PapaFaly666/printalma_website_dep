import React, { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { 
  Package, LayoutDashboard, ShoppingCart,
  Trash2, LogOut,
  Menu, X,
  Palette, Store,
  Printer
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '../components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { useAuth } from '../contexts/AuthContext';

const VendorDashboard: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const location = useLocation();
  
  // 🆕 Utilisation de l'AuthContext pour les données utilisateur réelles
  const { user, logout, getVendorTypeIcon, getVendorTypeLabel } = useAuth();

  // Données utilisateur réelles ou fallback
  const vendorUser = user ? {
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    avatar: undefined, // Peut être ajouté plus tard
    initials: `${user.firstName[0]}${user.lastName[0]}`,
    role: user.role,
    vendorType: user.vendeur_type,
    vendorTypeIcon: getVendorTypeIcon(),
    vendorTypeLabel: getVendorTypeLabel()
  } : {
    name: "Vendeur",
    email: "vendeur@printalma.com",
    avatar: undefined,
    initials: "V",
    role: "VENDEUR",
    vendorType: null,
    vendorTypeIcon: '👤',
    vendorTypeLabel: ''
  };

  // Navigation items specifically for vendors
  const navItems = [
    {
      title: "Tableau de bord",
      href: "/vendeur/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />
    },
    {
      title: "Mes Produits",
      href: "/vendeur/products",
      icon: <Package className="h-5 w-5" />
    },
    {
      title: "Corbeille",
      href: "/vendeur/deleted-products",
      icon: <Trash2 className="h-5 w-5" />
    },
    {
      title: "Mes Ventes",
      href: "/vendeur/sales",
      icon: <ShoppingCart className="h-5 w-5" />
    },
    {
      title: "Vendre",
      href: "/vendeur/sell-design",
      icon: <Printer className="h-5 w-5" />
    }
  ];

  // 🆕 Fonction pour ouvrir le modal de confirmation
  const handleLogoutClick = () => {
    setShowLogoutModal(true);
  };

  // 🆕 Fonction de déconnexion complète avec modal
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    setShowLogoutModal(false);
    
    try {
      // Appeler la méthode logout du context qui :
      // 1. Fait l'appel API vers /auth/logout
      // 2. Nettoie l'état local
      // 3. Redirige automatiquement vers /login
      await logout();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      // Même en cas d'erreur, la redirection se fait automatiquement
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Toggle dark mode function
  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* Sidebar pour mobile avec overlay */}
      <div
        className={`${
          sidebarOpen ? 'fixed inset-0 z-50 lg:hidden' : 'hidden'
        }`}
        onClick={() => setSidebarOpen(false)}
      >
        <div className="fixed inset-0 bg-gray-800/60" aria-hidden="true" />
        
        {/* Sidebar mobile */}
        <div
          className="fixed inset-y-0 left-0 flex w-72 flex-col bg-white dark:bg-gray-800 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <Store className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-semibold dark:text-white">PrintAlma Vendeur</span>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto pt-5 pb-4">
            <nav className="px-3 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                    )
                  }
                >
                  {item.icon}
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* 🆕 Section utilisateur avec informations réelles et déconnexion */}
          <div className="border-t dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="relative">
                <AvatarImage src={vendorUser.avatar} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {vendorUser.initials}
                </AvatarFallback>
                {/* Icône du type de vendeur */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-gray-800">
                  {vendorUser.vendorTypeIcon}
                </div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">{vendorUser.name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{vendorUser.email}</p>
                </div>
                {vendorUser.vendorTypeLabel && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {vendorUser.vendorTypeLabel}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Sidebar desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 bg-white dark:bg-gray-800 border-r dark:border-gray-700">
          <div className="flex items-center h-16 px-4 border-b dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Store className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
              <span className="text-xl font-semibold dark:text-white">PrintAlma Vendeur</span>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col overflow-y-auto pt-5 pb-4">
            <nav className="flex-1 px-4 space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-x-3 px-3 py-2 text-sm rounded-md transition-colors",
                      isActive
                        ? "bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                    )
                  }
                >
                  {item.icon}
                  {item.title}
                </NavLink>
              ))}
            </nav>
          </div>
          
          {/* 🆕 Section utilisateur avec informations réelles et déconnexion */}
          <div className="border-t dark:border-gray-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="relative">
                <AvatarImage src={vendorUser.avatar} />
                <AvatarFallback className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300">
                  {vendorUser.initials}
                </AvatarFallback>
                {/* Icône du type de vendeur */}
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-gray-800">
                  {vendorUser.vendorTypeIcon}
                </div>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium dark:text-white truncate">{vendorUser.name}</p>
                <div className="flex items-center gap-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{vendorUser.email}</p>
                </div>
                {vendorUser.vendorTypeLabel && (
                  <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                    {vendorUser.vendorTypeLabel}
                  </p>
                )}
              </div>
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
              onClick={handleLogoutClick}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              {isLoggingOut ? 'Déconnexion...' : 'Déconnexion'}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b dark:border-gray-700 px-4 py-2 sm:py-3 sm:px-6 flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <nav className="flex items-center text-sm">
            <span className="hidden sm:inline text-gray-500 dark:text-gray-400">
              {navItems.find(item => location.pathname.startsWith(item.href))?.title || 'Tableau de bord'}
            </span>
            <span className="text-gray-900 dark:text-white font-medium">
              {location.pathname === '/vendeur' || location.pathname === '/vendeur/dashboard' 
                ? 'Vue d\'ensemble'
                : location.pathname.includes('/products/') 
                  ? 'Détails du produit'
                  : location.pathname.includes('/product-form') 
                    ? 'Ajouter un produit'
                    : location.pathname.includes('/products') 
                      ? 'Liste des produits'
                      : location.pathname.includes('/deleted-products')
                        ? 'Produits supprimés'
                        : location.pathname.includes('/sales')
                          ? 'Historique des ventes'
                          : location.pathname.includes('/sell-design')
                            ? 'Vendre'
                          : 'Tableau de bord'}
            </span>
          </nav>
          
          {/* Actions simplifiées - déconnexion disponible dans le sidebar */}
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={toggleDarkMode} 
              className="relative"
            >
              <Palette className="h-5 w-5" />
              <span className="sr-only">Mode sombre</span>
            </Button>
          </div>
        </div>
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <Outlet context={{ isDarkMode }} />
        </main>
      </div>

      {/* 🆕 Modal de confirmation de déconnexion */}
      <AlertDialog open={showLogoutModal} onOpenChange={setShowLogoutModal}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <LogOut className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <AlertDialogTitle className="text-left">Confirmation de déconnexion</AlertDialogTitle>
              </div>
            </div>
            <AlertDialogDescription className="text-left">
              <div className="space-y-2">
                <p>
                  <strong>{vendorUser.name}</strong>, vous êtes sur le point de vous déconnecter de votre compte PrintAlma.
                </p>
                {vendorUser.vendorTypeLabel && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>{vendorUser.vendorTypeIcon}</span>
                    <span>{vendorUser.vendorTypeLabel}</span>
                  </div>
                )}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Vous devrez vous reconnecter pour accéder à votre espace vendeur.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoggingOut}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogoutConfirm}
              disabled={isLoggingOut}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600 dark:bg-red-600 dark:hover:bg-red-700"
            >
              {isLoggingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Déconnexion...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Se déconnecter
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VendorDashboard; 
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { LoadingSpinner } from '../components/ui/loading';
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
import {
    Package,
    BarChart3,
    CreditCard,
    ChevronRight,
    ChevronLeft,
    Settings,
    LogOut,
    Users,
    ShoppingCart,
    Home,
    Moon,
    Sun,
    Menu,
    X,
    User,
    Bell,
    Tag,
    Trash2,
    ShoppingBag,
    Palette,
    CheckCircle,
    Camera,
    Store,
    FileText,
    Wallet,
    Banknote,
    PackageSearch
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { cn } from '../lib/utils';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import passwordResetService from '../services/passwordResetService';

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    collapsed: boolean;
    active?: boolean;
    badge?: string;
    badgeColor?: string;
    onClick: () => void;
    textColor?: string;
}

interface NavGroupProps {
    title: string;
    children: React.ReactNode;
    collapsed: boolean;
}

type AdminUser = {
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
}

export default function Sidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeItem, setActiveItem] = useState('dashboard');
    const [cleanupLoading, setCleanupLoading] = useState(false);
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const sidebarRef = useRef<HTMLElement | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isAdmin, isSuperAdmin, isVendeur } = useAuth();

    // Utiliser les vraies données utilisateur ou des données par défaut
    const adminUser = user ? {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.role === 'SUPERADMIN' ? 'Super Administrateur' : 'Administrateur',
        avatarUrl: undefined // Peut être ajouté plus tard
    } : {
        name: "Admin User",
        email: "admin@example.com",
        role: "Administrateur",
        avatarUrl: undefined
    };

    // Fonction pour nettoyer les tokens expirés (admin uniquement)
    const handleCleanupTokens = async () => {
        if (!isAdmin() && !isSuperAdmin()) return;
        
        setCleanupLoading(true);
        try {
            const result = await passwordResetService.cleanupExpiredTokens();
            if (result) {
                alert(`✅ Nettoyage terminé!\n${result.deletedCount} token(s) supprimé(s)`);
            }
        } catch (error: any) {
            alert(`❌ Erreur lors du nettoyage: ${error.message || 'Erreur inconnue'}`);
        } finally {
            setCleanupLoading(false);
        }
    };

    // Fonction pour ouvrir le modal de déconnexion
    const handleLogoutClick = () => {
        setIsLogoutDialogOpen(true);
    };

    // Fonction de déconnexion confirmée
    const handleLogoutConfirm = async () => {
        try {
            await logout();
            setIsLogoutDialogOpen(false);
            navigate('/login');
        } catch (error) {
            console.error('Erreur lors de la déconnexion:', error);
        }
    };

    // Fonction pour annuler la déconnexion
    const handleLogoutCancel = () => {
        setIsLogoutDialogOpen(false);
    };

    // Handle responsive behavior
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) {
                setCollapsed(true);
                setIsMenuOpen(false);
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Sync active item with current route
    useEffect(() => {
        // Admin routes
        if (location.pathname.includes('/admin/vendor-products-admin')) {
            setActiveItem('vendor-products-admin');
        } else if (location.pathname.includes('/admin/products')) {
            setActiveItem('products');
        } else if (location.pathname.includes('/admin/categories')) {
            setActiveItem('categories');
        } else if (location.pathname.includes('/admin/orders')) {
            setActiveItem('orders');
        } else if (location.pathname.includes('/admin/dashboard')) {
            setActiveItem('dashboard');
        } else if (location.pathname.includes('/admin/sales')) {
            setActiveItem('sales');
        } else if (location.pathname.includes('/admin/clients')) {
            setActiveItem('clients');
        } else if (location.pathname.includes('/admin/product-validation')) {
            setActiveItem('product-validation');
        } else if (location.pathname.includes('/admin/payment-requests')) {
            setActiveItem('payment-requests');
        } else if (location.pathname.includes('/admin/payment-history')) {
            setActiveItem('payment-history');
        } else if (location.pathname.includes('/admin/settings')) {
            setActiveItem('settings');
        } else if (location.pathname.includes('/admin/trash')) {
            setActiveItem('trash');
        } else if (location.pathname.includes('/admin/users/create')) {
            setActiveItem('users-create');
        } else if (location.pathname.includes('/admin/users')) {
            setActiveItem('users');
        }
        // Vendor routes
        else if (location.pathname.includes('/vendeur/dashboard')) {
            setActiveItem('vendor-dashboard');
        } else if (location.pathname.includes('/vendeur/products')) {
            setActiveItem('vendor-products');
        } else if (location.pathname.includes('/vendeur/orders')) {
            setActiveItem('vendor-orders');
        } else if (location.pathname.includes('/vendeur/profile')) {
            setActiveItem('vendor-profile');
        } else if (location.pathname.includes('/vendeur/photo-profile')) {
            setActiveItem('vendor-photo');
        } else if (location.pathname.includes('/vendeur/shop-settings')) {
            setActiveItem('vendor-shop');
        } else if (location.pathname.includes('/vendeur/earnings')) {
            setActiveItem('vendor-earnings');
        } else if (location.pathname.includes('/vendeur/analytics')) {
            setActiveItem('vendor-analytics');
        } else if (location.pathname.includes('/vendeur/appel-de-fonds')) {
            setActiveItem('vendor-appel-de-fonds');
        }
    }, [location.pathname]);

    // Close sidebar when clicking outside on mobile
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                isMobile &&
                isMenuOpen &&
                sidebarRef.current &&
                !(sidebarRef.current as HTMLElement).contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isMobile, isMenuOpen]);

    const toggleSidebar = () => {
        if (isMobile) {
            setIsMenuOpen(!isMenuOpen);
        } else {
            setCollapsed(!collapsed);
        }
    };

    const toggleDarkMode = () => {
        setIsDarkMode(!isDarkMode);
    };

    // Classes to apply based on dark mode
    const appClasses = cn(
        isDarkMode ? 'dark' : '',
    );

    // Handle navigation for both admin and vendor
    const handleNavigation = (path: string) => {
        setActiveItem(path);
        if (path === 'vendor-products-admin') {
            navigate(`/admin/${path}`);
        } else if (path.startsWith('vendor-')) {
            const vendorPath = path.replace('vendor-', '');
            navigate(`/vendeur/${vendorPath}`);
        } else {
            navigate(`/admin/${path}`);
        }
        if (isMobile) setIsMenuOpen(false);
    };

    return (
        <div className={cn("flex h-screen overflow-hidden", appClasses)}>
            {/* Mobile header bar */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-14 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 z-20 flex items-center px-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="mr-3 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                    <div className="flex items-center space-x-2">
                        <img
                            src="/printalma_logo.svg"
                            alt="Printalma Logo"
                            className="h-7 w-7 object-contain"
                        />
                        <h2 className="text-lg font-semibold text-black dark:text-white">
                            {isVendeur() ? 'Espace Vendeur' : 'Printalma'}
                        </h2>
                    </div>
                    <div className="ml-auto flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-8 h-8 text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            <Bell size={18} />
                        </Button>
                        
                        <Avatar className="h-8 w-8 ml-1">
                            <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
                            <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs">
                                {adminUser.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={cn(
                    "bg-white dark:bg-black h-full border-r border-gray-200 dark:border-gray-800 flex flex-col transition-all duration-300 ease-in-out z-30",
                    collapsed && !isMobile ? "w-16" : "w-64",
                    isMobile && "fixed left-0 top-0 bottom-0 shadow-xl",
                    isMobile && !isMenuOpen && "transform -translate-x-full"
                )}
                style={isMobile ? { paddingTop: '56px' } : {}}
            >
                {/* Logo - Only visible on desktop */}
                {!isMobile && (
                    <div className="p-4 flex items-center justify-between">
                        {!collapsed && (
                            <div className="flex items-center space-x-3">
                                <img
                                    src="/printalma_logo.svg"
                                    alt="Printalma Logo"
                                    className="h-32 w-32 object-contain"
                                />
                                
                            </div>
                        )}
                        {collapsed && (
                            <div className="flex justify-center w-full">
                                <img
                                    src="/printalma_logo.svg"
                                    alt="Printalma Logo"
                                    className="h-8 w-8 object-contain"
                                />
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSidebar}
                            className={cn("hover:bg-gray-100 dark:hover:bg-gray-800 p-1", collapsed && "ml-auto")}
                        >
                            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </Button>
                    </div>
                )}

                {/* Admin Profile */}
                {(!collapsed || isMobile) && (
                    <div className="px-4 py-4 mb-1">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12 border-2 border-gray-200 dark:border-gray-700">
                                <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
                                <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                    {adminUser.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm text-black dark:text-white">{adminUser.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{adminUser.role}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Collapsed avatar */}
                {collapsed && !isMobile && (
                    <div className="p-3 flex justify-center">
                        <TooltipProvider>
                            <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-10 w-10 border-2 border-gray-200 dark:border-gray-700">
                                        <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
                                        <AvatarFallback className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                                            {adminUser.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-medium py-1 px-3 text-sm">
                                    {adminUser.name}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}

                <div className="px-3 py-2">
                    <Separator className="dark:bg-gray-800" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
                    {/* Admin Navigation */}
                    {(isAdmin() || isSuperAdmin()) && (
                        <>
                    <NavGroup
                        title="Produits"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<BarChart3 size={18} />}
                            label="Tableau de bord"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'dashboard'}
                            onClick={() => handleNavigation('dashboard')}
                            badge=""
                            textColor=""
                        />

                        <NavItem
                            icon={<Package size={18} />}
                                    label="Mockups"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'products'}
                            onClick={() => handleNavigation('products')}
                            badge="24"
                            textColor=""
                        />



                        <NavItem
                            icon={<Tag size={18} />}
                            label="Catégories"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'categories'}
                            onClick={() => handleNavigation('categories')}
                            badge=""
                            textColor=""
                        />
                        <NavItem
                            icon={<Palette size={18} />}
                            label="Thèmes"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'design-categories'}
                            onClick={() => handleNavigation('design-categories')}
                            badge=""
                            textColor=""
                        />
                        <NavItem
                            icon={<PackageSearch size={18} />}
                            label="Stock"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'stock'}
                            onClick={() => handleNavigation('stock')}
                            badge=""
                            textColor=""
                        />

                        <NavItem
                            icon={<Users size={18} />}
                            label="Vendeurs"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'clients'}
                            onClick={() => handleNavigation('clients')}
                            badge=""
                            textColor=""
                        />
                        <NavItem
                            icon={<Trash2 size={18} />}
                            label="Corbeille"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'trash'}
                            onClick={() => handleNavigation('trash')}
                            badge=""
                            textColor=""
                        />
                    </NavGroup>

                    <NavGroup
                        title="Validation"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<CheckCircle size={18} />}
                                    label="Design"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'design-validation'}
                            onClick={() => handleNavigation('design-validation')}
                            badge="5"
                            badgeColor="yellow"
                            textColor=""
                        />

                        <NavItem
                            icon={<Package size={18} />}
                            label="Produits"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'product-validation'}
                            onClick={() => handleNavigation('product-validation')}
                            badge=""
                            textColor=""
                        />

                        <NavItem
                            icon={<span className="text-base">🤖</span>}
                            label="Auto-validation"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'auto-validation'}
                            onClick={() => handleNavigation('auto-validation')}
                            badge=""
                            textColor=""
                        />
                    </NavGroup>

                    <NavGroup
                        title="Commandes"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<ShoppingBag size={18} />}
                            label="Gestion des commandes"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'orders'}
                            onClick={() => handleNavigation('orders')}
                            badge=""
                            textColor=""
                        />
                    </NavGroup>

                    {/* Utilisateurs (Admins & Superadmins) */}
                    <NavGroup
                        title="Utilisateurs"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<Users size={18} />}
                            label="Admins & Superadmins"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'users'}
                            onClick={() => handleNavigation('users')}
                            badge=""
                            textColor=""
                        />

                        {isSuperAdmin() && (
                            <NavItem
                                icon={<User size={18} />}
                                label="Créer utilisateur"
                                collapsed={collapsed && !isMobile}
                                active={activeItem === 'users-create'}
                                onClick={() => handleNavigation('users/create')}
                                badge=""
                                textColor=""
                            />
                        )}
                    </NavGroup>

                    <NavGroup
                        title="Statistiques"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<BarChart3 size={18} />}
                            label="Analytiques"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'analytics'}
                            onClick={() => handleNavigation('analytics')}
                            badge=""
                            textColor=""
                        />

                    </NavGroup>

                    <NavGroup
                        title="Paiements"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<CreditCard size={18} />}
                            label="Demandes"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'payment-requests'}
                            onClick={() => handleNavigation('payment-requests')}
                            badge="3"
                            badgeColor="red"
                            textColor=""
                        />

                    </NavGroup>
                        </>
                    )}

                    {/* Vendor Navigation */}
                    {isVendeur() && (
                        <>
                            <NavGroup
                                title="Vue d'ensemble"
                                collapsed={collapsed && !isMobile}
                            >
                                <NavItem
                                    icon={<BarChart3 size={18} />}
                                    label="Tableau de bord"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-dashboard'}
                                    onClick={() => handleNavigation('vendor-dashboard')}
                                    badge=""
                                    textColor=""
                                />

                                <NavItem
                                    icon={<BarChart3 size={18} />}
                                    label="Analytiques"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-analytics'}
                                    onClick={() => handleNavigation('vendor-analytics')}
                                    badge=""
                                    textColor=""
                                />
                            </NavGroup>

                            <NavGroup
                                title="Mes Produits"
                                collapsed={collapsed && !isMobile}
                            >
                                <NavItem
                                    icon={<Package size={18} />}
                                    label="Mes Produits"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-products'}
                                    onClick={() => handleNavigation('vendor-products')}
                                    badge=""
                                    textColor=""
                                />

                                <NavItem
                                    icon={<Palette size={18} />}
                                    label="Créer Design"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-sell-design'}
                                    onClick={() => handleNavigation('vendor-sell-design')}
                                    badge=""
                                    textColor=""
                                />
                            </NavGroup>

                            <NavGroup
                                title="Commandes"
                                collapsed={collapsed && !isMobile}
                            >
                                <NavItem
                                    icon={<ShoppingBag size={18} />}
                                    label="Mes Commandes"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-orders'}
                                    onClick={() => handleNavigation('vendor-orders')}
                                    badge=""
                                    textColor=""
                                />
                            </NavGroup>

                            <NavGroup
                                title="Profil & Boutique"
                                collapsed={collapsed && !isMobile}
                            >
                                <NavItem
                                    icon={<User size={18} />}
                                    label="Mon Profil"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-profile'}
                                    onClick={() => handleNavigation('vendor-profile')}
                                    badge=""
                                    textColor=""
                                />

                                <NavItem
                                    icon={<Camera size={18} />}
                                    label="Photo de Profil"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-photo'}
                                    onClick={() => handleNavigation('vendor-photo-profile')}
                                    badge=""
                                    textColor=""
                                />

                                <NavItem
                                    icon={<Store size={18} />}
                                    label="Ma Boutique"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-shop'}
                                    onClick={() => handleNavigation('vendor-shop-settings')}
                                    badge=""
                                    textColor=""
                                />
                            </NavGroup>

                            <NavGroup
                                title="Finances"
                                collapsed={collapsed && !isMobile}
                            >
                                <NavItem
                                    icon={<Wallet size={18} />}
                                    label="Mes Gains"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-earnings'}
                                    onClick={() => handleNavigation('vendor-earnings')}
                                    badge=""
                                    textColor=""
                                />

                                <NavItem
                                    icon={<FileText size={18} />}
                                    label="Demandes de Paiement"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-payment-requests'}
                                    onClick={() => handleNavigation('vendor-payment-requests')}
                                    badge=""
                                    textColor=""
                                />

                                <NavItem
                                    icon={<Banknote size={18} />}
                                    label="Appel de Fonds"
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === 'vendor-appel-de-fonds'}
                                    onClick={() => handleNavigation('vendor-appel-de-fonds')}
                                    badge=""
                                    textColor=""
                                />
                            </NavGroup>
                        </>
                    )}
                </nav>

                <div className="px-3 py-2">
                    <Separator className="dark:bg-gray-800" />
                </div>

                {/* Footer */}
                <div className="p-3 space-y-1">
                    {/* Paramètres - seulement pour les admins */}
                    {(isAdmin() || isSuperAdmin()) && (
                        <NavItem
                            icon={<Settings size={18} />}
                            label="Paramètres"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'settings'}
                            onClick={() => handleNavigation('settings')}
                            badge=""
                            textColor=""
                        />
                    )}

                    {/* Bouton de nettoyage des tokens (admin uniquement) */}
                    {(isAdmin() || isSuperAdmin()) && (
                        <>
                            {collapsed && !isMobile ? (
                                <TooltipProvider>
                                    <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={handleCleanupTokens}
                                                disabled={cleanupLoading}
                                                className="w-full justify-center hover:bg-gray-100 dark:hover:bg-gray-800 my-1 py-2 text-gray-600 dark:text-gray-400"
                                            >
                                                {cleanupLoading ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium py-1 px-3 text-sm">
                                            {cleanupLoading ? 'Nettoyage en cours...' : 'Nettoyer les tokens expirés'}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCleanupTokens}
                                    disabled={cleanupLoading}
                                    className="w-full justify-start hover:bg-gray-100 dark:hover:bg-gray-800 my-1 py-2 text-gray-600 dark:text-gray-400"
                                >
                                    {cleanupLoading ? (
                                        <LoadingSpinner size="sm" />
                                    ) : (
                                        <Trash2 size={18} />
                                    )}
                                    <span className="ml-3 text-sm">
                                        {cleanupLoading ? 'Nettoyage...' : 'Nettoyer tokens'}
                                    </span>
                                </Button>
                            )}
                        </>
                    )}

                    

                    <NavItem
                        icon={<LogOut size={18} className="text-gray-500 dark:text-gray-400" />}
                        label="Déconnexion"
                        collapsed={collapsed && !isMobile}
                        onClick={handleLogoutClick}
                        textColor="text-gray-500 dark:text-gray-400"
                        badge=""
                    />
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobile && isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/30 backdrop-blur-sm z-20 transition-opacity duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className={cn(
                "flex-1 bg-gray-50 dark:bg-black flex flex-col overflow-y-auto",
                isMobile && "pt-14"
            )}>
                <Outlet context={{ isDarkMode }} />
            </div>

            {/* Modal de confirmation de déconnexion */}
            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 dark:text-white flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-red-600" />
                            Confirmer la déconnexion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
                            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à nouveau au tableau de bord.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel 
                            onClick={handleLogoutCancel}
                            className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleLogoutConfirm}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Se déconnecter
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}

// NavGroup Component
const NavGroup = ({ title, children, collapsed }: NavGroupProps) => {
    if (collapsed) {
        return <div className="mt-4">{children}</div>;
    }

    return (
        <div className="mt-2">
            {!collapsed && (
                <h3 className="px-3 text-xs font-medium text-gray-400 uppercase tracking-wider mb-2">
                    {title}
                </h3>
            )}
            <div className="space-y-1">
                {children}
            </div>
        </div>
    );
};

// NavItem Component with tooltip for collapsed state
const NavItem = ({
    icon,
    label,
    collapsed,
    active = false,
    badge = "",
    badgeColor = "blue",
    onClick,
    textColor = ""
}: NavItemProps) => {
    const iconColor = active ? "text-[#049BE5]" : textColor || "text-gray-600 dark:text-gray-400 group-hover:text-[#049BE5]";

    const navButton = (
        <Button
            variant="ghost"
            className={cn(
                "w-full justify-start gap-3 px-3 py-2 h-auto group",
                active && "bg-[#049BE5]/10",
                collapsed ? "px-3" : "pl-3 pr-2",
                "hover:bg-[#049BE5]/20"
            )}
            onClick={onClick}
        >
            <span className={cn(iconColor)}>
                {icon}
            </span>

            {!collapsed && (
                <span className={cn(
                    "flex-1 text-left text-sm font-medium",
                    active ? "text-[#049BE5]" : textColor || "text-gray-700 dark:text-gray-300 group-hover:text-[#049BE5]"
                )}>
                    {label}
                </span>
            )}

            {!collapsed && badge && (
                <Badge
                    variant="outline"
                    className={cn(
                        "ml-auto text-xs h-5 min-w-5 flex items-center justify-center px-1.5",
                        badgeColor === "red"
                            ? "bg-gray-100 text-gray-600 border-gray-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800/30"
                            : "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-800"
                    )}
                >
                    {badge}
                </Badge>
            )}
        </Button>
    );

    return (
        <>
            {collapsed ? (
                <TooltipProvider>
                    <Tooltip delayDuration={100}>
                        <TooltipTrigger asChild>
                            <div className="relative">
                                {navButton}
                                {badge && (
                                    <span className={cn(
                                        "absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-xs font-medium",
                                        badgeColor === "red" ? "bg-red-500" : "bg-black dark:bg-white",
                                        badgeColor === "red" ? "text-white" : "text-white dark:text-black"
                                    )}>
                                        {badge}
                                    </span>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="font-medium py-1 px-3 text-sm">
                            {label}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            ) : (
                navButton
            )}
        </>
    );
};
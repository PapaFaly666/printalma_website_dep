import React, { useState, useEffect, useRef } from 'react';
import Button from '../components/ui/Button';
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
    PackageSearch,
    Truck,
    Sticker,
    Image,
    Landmark,
    Shield
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { cn } from '../lib/utils';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import passwordResetService from '../services/passwordResetService';
import { useSidebarCounts } from '../hooks/useSidebarCounts';
import usePermissions from '../hooks/usePermissions';
import useNavigation from '../hooks/useNavigation';
import { NavItem as NavItemType } from '../types/navigation';

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
    // Mode clair uniquement - désactivation du mode sombre
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
    const { counts, loading: countsLoading } = useSidebarCounts();
    const { hasPermission, hasAnyPermission } = usePermissions();
    const { currentNavigation, footerNavigation } = useNavigation();

    // Utiliser les vraies données utilisateur ou des données par défaut
    const adminUser = user ? {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        // Utiliser roleDisplay si disponible, sinon fallback vers l'ancien système
        role: user.roleDisplay || (user.role === 'SUPERADMIN' ? 'Super Administrateur' : 'Administrateur'),
        avatarUrl: user.profile_photo_url || undefined
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
        } else if (location.pathname.includes('/admin/design-categories')) {
            setActiveItem('design-categories');
        } else if (location.pathname.includes('/admin/orders')) {
            setActiveItem('orders');
        } else if (location.pathname.includes('/admin/livraison')) {
            setActiveItem('livraison');
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
        } else if (location.pathname.includes('/admin/payment-methods')) {
            setActiveItem('payment-methods');
        } else if (location.pathname.includes('/admin/settings')) {
            setActiveItem('settings');
        } else if (location.pathname.includes('/admin/trash')) {
            setActiveItem('trash');
        } else if (location.pathname.includes('/admin/users/create')) {
            setActiveItem('users-create');
        } else if (location.pathname.includes('/admin/users')) {
            setActiveItem('users');
        } else if (location.pathname.includes('/admin/roles')) {
            setActiveItem('roles');
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
        } else if (location.pathname.includes('/vendeur/stickers')) {
            setActiveItem('vendor-stickers');
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
    const handleNavigation = (item: NavItemType) => {
        setActiveItem(item.id);

        // Gestion spéciale pour la déconnexion
        if (item.id === 'logout') {
            handleLogoutClick();
            return;
        }

        // Gestion spéciale pour le retour au site
        if (item.path === '/') {
            navigate('/');
            if (isMobile) setIsMenuOpen(false);
            return;
        }

        // Navigation normale
        if (isVendeur()) {
            navigate(`/vendeur/${item.path}`);
        } else {
            navigate(`/admin/${item.path}`);
        }

        if (isMobile) setIsMenuOpen(false);
    };

    return (
        <div className={cn("flex h-screen overflow-hidden", appClasses)}>
            {/* Mobile header bar */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-14 bg-white border-b border-gray-200 z-20 flex items-center px-3">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="mr-3 text-black hover:bg-gray-100"
                    >
                        {isMenuOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                    <div className="flex items-center space-x-2">
                        <img
                            src="/printalma_logo.svg"
                            alt="Printalma Logo"
                            className="h-7 w-7 object-contain"
                        />
                        <h2 className="text-lg font-semibold text-black">
                            {isVendeur() ? 'Espace Vendeur' : 'Printalma'}
                        </h2>
                    </div>
                    <div className="ml-auto flex items-center space-x-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full w-8 h-8 text-black hover:bg-gray-100"
                        >
                            <Bell size={18} />
                        </Button>

                        <Avatar className="h-8 w-8 ml-1">
                            <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
                            <AvatarFallback className="bg-gray-100 text-gray-700 text-xs">
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
                    "bg-white h-full border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out z-30",
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
                            className={cn("hover:bg-gray-100 p-1", collapsed && "ml-auto")}
                        >
                            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                        </Button>
                    </div>
                )}

                {/* Admin Profile */}
                {(!collapsed || isMobile) && (
                    <div className="px-4 py-4 mb-1">
                        <div className="flex items-center space-x-3">
                            <Avatar className="h-12 w-12 border-2 border-gray-200">
                                <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
                                <AvatarFallback className="bg-gray-100 text-gray-700">
                                    {adminUser.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-medium text-sm text-black">{adminUser.name}</span>
                                <span className="text-xs text-gray-500">{adminUser.role}</span>
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
                                    <Avatar className="h-10 w-10 border-2 border-gray-200">
                                        <AvatarImage src={adminUser.avatarUrl} alt={adminUser.name} />
                                        <AvatarFallback className="bg-gray-100 text-gray-700">
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
                    <Separator />
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 overflow-y-auto">
                    {currentNavigation.map((group) => (
                        <NavGroup
                            key={group.id}
                            title={group.title}
                            collapsed={collapsed && !isMobile}
                        >
                            {group.items.map((item) => (
                                <NavItem
                                    key={item.id}
                                    icon={<item.icon size={18} />}
                                    label={item.label}
                                    collapsed={collapsed && !isMobile}
                                    active={activeItem === item.id}
                                    onClick={() => handleNavigation(item)}
                                    badge={item.badge || ''}
                                    badgeColor={item.badgeColor}
                                    textColor={item.textColor || ''}
                                />
                            ))}
                        </NavGroup>
                    ))}
                </nav>

                <div className="px-3 py-2">
                    <Separator />
                </div>

                {/* Footer */}
                <div className="p-3 space-y-1">
                    {/* Navigation du footer (filtrée par permissions) */}
                    {footerNavigation.map((item) => (
                        <NavItem
                            key={item.id}
                            icon={<item.icon size={18} className={item.textColor || ''} />}
                            label={item.label}
                            collapsed={collapsed && !isMobile}
                            active={activeItem === item.id}
                            onClick={() => handleNavigation(item)}
                            badge={item.badge || ''}
                            textColor={item.textColor || ''}
                        />
                    ))}

                    {/* Bouton de nettoyage des tokens (admin uniquement) */}
                    {(isAdmin() || isSuperAdmin()) && (
                        <>
                            {collapsed && !isMobile ? (
                                <TooltipProvider>
                                    <Tooltip delayDuration={100}>
                                        <TooltipTrigger asChild>
                                            <button
                                                onClick={handleCleanupTokens}
                                                disabled={cleanupLoading}
                                                className="w-full flex items-center justify-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-[rgb(20,104,154)] hover:text-white disabled:opacity-50"
                                            >
                                                {cleanupLoading ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <Trash2 size={18} />
                                                )}
                                            </button>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium py-1 px-3 text-sm">
                                            {cleanupLoading ? 'Nettoyage en cours...' : 'Nettoyer les tokens expirés'}
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            ) : (
                                <button
                                    onClick={handleCleanupTokens}
                                    disabled={cleanupLoading}
                                    className="w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 text-gray-600 hover:bg-[rgb(20,104,154)] hover:text-white disabled:opacity-50"
                                >
                                    <span className="flex items-center justify-center w-5 h-5">
                                        {cleanupLoading ? (
                                            <LoadingSpinner size="sm" />
                                        ) : (
                                            <Trash2 size={18} />
                                        )}
                                    </span>
                                    <span className="ml-3 text-sm">
                                        {cleanupLoading ? 'Nettoyage...' : 'Nettoyer tokens'}
                                    </span>
                                </button>
                            )}
                        </>
                    )}
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
                "flex-1 bg-gray-50 flex flex-col overflow-y-auto",
                isMobile && "pt-14"
            )}>
                <Outlet context={{ isDarkMode }} />
            </div>

            {/* Modal de confirmation de déconnexion */}
            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogContent className="bg-white border border-gray-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-red-600" />
                            Confirmer la déconnexion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à nouveau au tableau de bord.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel
                            onClick={handleLogoutCancel}
                            className="border-gray-300 text-gray-700 hover:bg-gray-50"
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
        return <div className="mt-3">{children}</div>;
    }

    return (
        <div className="mt-6 first:mt-0">
            <h3 className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wide">
                {title}
            </h3>
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
    const navButton = (
        <button
            onClick={onClick}
            className={cn(
                "w-full flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 group",
                active
                    ? "bg-[rgb(20,104,154)] text-white"
                    : "text-gray-700 hover:bg-[rgb(20,104,154)] hover:text-white",
                collapsed && "justify-center"
            )}
        >
            <span className={cn("flex items-center justify-center w-5 h-5", collapsed && "w-auto")}>
                {icon}
            </span>

            {!collapsed && (
                <>
                    <span className="ml-3 text-sm font-medium flex-1 text-left">
                        {label}
                    </span>
                    {badge && (
                        <Badge
                            variant="outline"
                            className={cn(
                                "text-xs h-5 min-w-5 px-1.5",
                                active
                                    ? "bg-white/20 text-white border-white/30"
                                    : "bg-gray-100 text-gray-600 border-gray-200 group-hover:bg-white/20 group-hover:text-white group-hover:border-white/30"
                            )}
                        >
                            {badge}
                        </Badge>
                    )}
                </>
            )}
        </button>
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
                                        badgeColor === "red" ? "bg-red-500" : "bg-black",
                                        badgeColor === "red" ? "text-white" : "text-white"
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
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Badge } from '../components/ui/badge';
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
import {
    Package,
    BarChart3,
    ShoppingCart,
    ChevronRight,
    ChevronLeft,
    Settings,
    LogOut,
    Home,
    Menu,
    X,
    Palette,
    Store,
    TrendingUp,
    Image,
    User,
    Banknote
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../components/ui/tooltip';
import { cn } from '../lib/utils';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/auth.service';
import { ExtendedVendorProfile } from '../types/auth.types';

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

type VendorUser = {
    name: string;
    email: string;
    role: string;
    vendorType?: string;
    avatarUrl?: string;
    shopName?: string;
    phone?: string;
}

export default function VendorSidebar() {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeItem, setActiveItem] = useState('dashboard');
    const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
    const sidebarRef = useRef<HTMLElement | null>(null);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout, isVendeur } = useAuth();

    // Profil étendu (photo Cloudinary, shop_name, etc.)
    const [extendedProfile, setExtendedProfile] = useState<ExtendedVendorProfile | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                if (user && isVendeur()) {
                    const data = await authService.getExtendedVendorProfile();
                    if (data.success) {
                        setExtendedProfile(data.vendor);
                    }
                }
            } catch (err) {
                console.error('Erreur récupération profil étendu:', err);
            }
        };

        fetchProfile();
    }, [user]);

    // Utiliser les vraies données utilisateur ou des données par défaut
    const vendorUser: VendorUser = user ? {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: 'Vendeur',
        vendorType: user.vendeur_type || 'Designer',
        avatarUrl: extendedProfile?.profile_photo_url || user.profile_photo_url || undefined,
        shopName: extendedProfile?.shop_name ?? undefined,
        phone: extendedProfile?.phone ?? undefined
    } : {
        name: "Vendeur User",
        email: "vendeur@example.com",
        role: "Vendeur",
        vendorType: "Designer",
        avatarUrl: undefined,
        shopName: undefined,
        phone: undefined
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
            const mobile = window.innerWidth < 1024;
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
        if (location.pathname.includes('/vendeur/products')) {
            setActiveItem('products');
        } else if (location.pathname.includes('/vendeur/designs')) {
            setActiveItem('designs');
        } else if (location.pathname.includes('/vendeur/deleted-products')) {
            setActiveItem('deleted-products');
        } else if (location.pathname.includes('/vendeur/sales')) {
            setActiveItem('sales');
        } else if (location.pathname.includes('/vendeur/sell-design')) {
            setActiveItem('sell-design');
        } else if (location.pathname.includes('/vendeur/account')) {
            setActiveItem('account');
        } else if (location.pathname.includes('/vendeur/appel-de-fonds')) {
            setActiveItem('appel-de-fonds');
        } else if (location.pathname.includes('/vendeur/dashboard') || location.pathname === '/vendeur') {
            setActiveItem('dashboard');
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



    // Handle navigation
    const handleNavigation = (path: string) => {
        setActiveItem(path);
        navigate(`/vendeur/${path}`);
        if (isMobile) setIsMenuOpen(false);
    };

    // Get vendor type icon
    const getVendorTypeIcon = (type?: string) => {
        switch (type) {
            case 'DESIGNER': return '🎨';
            case 'ARTISTE': return '🎭';
            case 'INFLUENCEUR': return '📱';
            default: return '👤';
        }
    };

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Mobile header bar */}
            {isMobile && (
                <div className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50 flex items-center px-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleSidebar}
                        className="mr-4 text-black hover:bg-gray-100"
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </Button>
                    <div className="flex items-center space-x-3 flex-1">
                        <div className="h-8 w-8 rounded-md bg-black flex items-center justify-center">
                            <Store size={16} className="text-white" />
                        </div>
                        <div className="flex flex-col">
                            <h2 className="text-lg font-semibold text-black">{vendorUser.shopName || 'Espace Vendeur'}</h2>
                            {vendorUser.shopName && (
                                <span className="text-xs text-gray-500 truncate max-w-[120px]">{vendorUser.email}</span>
                            )}
                            {vendorUser.phone && (
                                <span className="text-xs text-gray-500 truncate max-w-[120px]">{vendorUser.phone}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Avatar className="h-10 w-10 relative border-2 border-gray-200">
                            <AvatarImage src={vendorUser.avatarUrl || undefined} alt={vendorUser.name} />
                            <AvatarFallback className="bg-gray-100 text-black text-sm font-medium">
                                {vendorUser.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs border-2 border-white">
                                {getVendorTypeIcon(vendorUser.vendorType)}
                            </div>
                        </Avatar>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside
                ref={sidebarRef}
                className={cn(
                    "bg-white h-full border-r border-gray-200 flex flex-col transition-all duration-300 ease-in-out",
                    collapsed && !isMobile ? "w-20" : "w-72",
                    isMobile && "fixed left-0 top-0 bottom-0 shadow-2xl z-40",
                    isMobile && !isMenuOpen && "transform -translate-x-full"
                )}
                style={isMobile ? { paddingTop: '64px' } : {}}
            >
                {/* Logo - Only visible on desktop */}
                {!isMobile && (
                    <div className="p-6 flex items-center justify-between border-b border-gray-200">
                        {!collapsed && (
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-md bg-black flex items-center justify-center">
                                    <Store size={20} className="text-white" />
                                </div>
                                <h2 className="text-xl font-bold text-black">Espace Vendeur</h2>
                            </div>
                        )}
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleSidebar}
                            className={cn("hover:bg-gray-100 p-2", collapsed && "ml-auto")}
                        >
                            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </Button>
                    </div>
                )}

                {/* Vendor Profile */}
                {(!collapsed || isMobile) && (
                    <div className="p-6">
                        <div className="flex items-center space-x-4">
                            <Avatar className="h-14 w-14 border-2 border-gray-200 relative">
                                <AvatarImage src={vendorUser.avatarUrl || undefined} alt={vendorUser.name} />
                                <AvatarFallback className="bg-gray-100 text-black font-semibold">
                                    {vendorUser.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                                <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center text-sm border-2 border-white">
                                    {getVendorTypeIcon(vendorUser.vendorType)}
                                </div>
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0">
                                <span className="font-semibold text-base text-black truncate">{vendorUser.name}</span>
                                <span className="text-sm text-gray-600 truncate">{vendorUser.vendorType}</span>
                                {vendorUser.shopName && (
                                    <span className="text-xs text-gray-500 truncate">🏪 {vendorUser.shopName}</span>
                                )}
                                {vendorUser.phone && (
                                    <span className="text-xs text-gray-500 truncate">📞 {vendorUser.phone}</span>
                                )}
                                <span className="text-xs text-gray-500 truncate">{vendorUser.email}</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Collapsed avatar */}
                {collapsed && !isMobile && (
                    <div className="p-4 flex justify-center border-b border-gray-200">
                        <TooltipProvider>
                            <Tooltip delayDuration={100}>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-12 w-12 border-2 border-gray-200 relative">
                                        <AvatarImage src={vendorUser.avatarUrl || undefined} alt={vendorUser.name} />
                                        <AvatarFallback className="bg-gray-100 text-black font-semibold">
                                            {vendorUser.name.split(' ').map(n => n[0]).join('')}
                                        </AvatarFallback>
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-xs border-2 border-white">
                                            {getVendorTypeIcon(vendorUser.vendorType)}
                                        </div>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="font-medium py-2 px-3 text-sm">
                                    <div className="font-semibold">{vendorUser.name}</div>
                                    {vendorUser.shopName && (
                                        <div className="text-xs text-gray-500 truncate max-w-[140px]">🏪 {vendorUser.shopName}</div>
                                    )}
                                    {vendorUser.phone && (
                                        <div className="text-xs text-gray-500">📞 {vendorUser.phone}</div>
                                    )}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                )}

                {/* Navigation */}
                <nav className="flex-1 py-4 px-3 space-y-2 overflow-y-auto">
                    {/* Main navigation */}
                    <NavGroup
                        title="Activité"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<BarChart3 size={20} />}
                            label="Tableau de bord"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'dashboard'}
                            onClick={() => handleNavigation('dashboard')}
                            badge=""
                            textColor=""
                        />

                        <NavItem
                            icon={<Package size={20} />}
                            label="Mes Produits"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'products'}
                            onClick={() => handleNavigation('products')}
                            badge=""
                            textColor=""
                        />

                        <NavItem
                            icon={<Image size={20} />}
                            label="Mes Designs"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'designs'}
                            onClick={() => handleNavigation('designs')}
                            badge=""
                            textColor=""
                        />

                    </NavGroup>

                    <NavGroup
                        title="Ventes"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<TrendingUp size={20} />}
                            label="Mes Commandes"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'sales'}
                            onClick={() => handleNavigation('sales')}
                            badge=""
                            textColor=""
                        />

                        <NavItem
                            icon={<Palette size={20} />}
                            label="Vendre"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'sell-design'}
                            onClick={() => handleNavigation('sell-design')}
                            badge=""
                            textColor=""
                        />
                    </NavGroup>

                    <NavGroup
                        title="Finances"
                        collapsed={collapsed && !isMobile}
                    >
                        <NavItem
                            icon={<Banknote size={20} />}
                            label="Appel de Fonds"
                            collapsed={collapsed && !isMobile}
                            active={activeItem === 'appel-de-fonds'}
                            onClick={() => handleNavigation('appel-de-fonds')}
                            badge=""
                            textColor=""
                        />
                    </NavGroup>
                </nav>

                {/* Footer */}
                <div className="p-4 space-y-2 border-t border-gray-200">
                    <NavItem
                        icon={<User size={20} />}
                        label="Compte"
                        collapsed={collapsed && !isMobile}
                        active={activeItem === 'account'}
                        onClick={() => handleNavigation('account')}
                        badge=""
                        textColor=""
                    />

                    <NavItem
                        icon={<LogOut size={20} className="text-gray-500" />}
                        label="Déconnexion"
                        collapsed={collapsed && !isMobile}
                        onClick={handleLogoutClick}
                        textColor="text-gray-500"
                        badge=""
                    />
                </div>
            </aside>

            {/* Mobile overlay */}
            {isMobile && isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 transition-opacity duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Main Content */}
            <div className={cn(
                "flex-1 bg-gray-50 flex flex-col overflow-y-auto",
                isMobile && "pt-16"
            )}>
                <Outlet />
            </div>

            {/* Modal de confirmation de déconnexion */}
            <AlertDialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
                <AlertDialogContent className="bg-white border border-gray-200">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900 flex items-center gap-2">
                            <LogOut className="h-5 w-5 text-gray-600" />
                            Confirmer la déconnexion
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                            Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à nouveau à votre espace vendeur.
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
                            className="bg-black hover:bg-gray-800 text-white border-black"
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

// Navigation Group Component
const NavGroup = ({ title, children, collapsed }: NavGroupProps) => {
    if (collapsed) {
        return <div className="space-y-1">{children}</div>;
    }

    return (
        <div className="space-y-1 mb-4">
            <div className="space-y-1">{children}</div>
        </div>
    );
};

// Navigation Item Component
const NavItem = ({
    icon,
    label,
    collapsed,
    active = false,
    badge = "",
    badgeColor = "gray",
    onClick,
    textColor = ""
}: NavItemProps) => {
    const baseClasses = "group flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 w-full";
    const activeClasses = active
        ? "bg-black text-white"
        : "text-gray-700 hover:bg-gray-100 hover:text-black";
    
    const textColorClasses = textColor || (active ? "text-white" : "text-gray-700");

    if (collapsed) {
        return (
            <TooltipProvider>
                <Tooltip delayDuration={100}>
                    <TooltipTrigger asChild>
                        <button
                            onClick={onClick}
                            className={cn(baseClasses, activeClasses, "justify-center relative px-3")}
                        >
                            <span className={textColorClasses}>{icon}</span>
                            {badge && (
                                <Badge 
                                    variant="secondary" 
                                    className={cn(
                                        "absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-gray-500 text-white"
                                    )}
                                >
                                    {badge}
                                </Badge>
                            )}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-medium py-2 px-3 text-sm">
                        {label}
                        {badge && <span className="ml-2 text-xs opacity-75">({badge})</span>}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        );
    }

    return (
        <button
            onClick={onClick}
            className={cn(baseClasses, activeClasses, "justify-start")}
        >
            <span className={cn("flex-shrink-0", textColorClasses)}>{icon}</span>
            <span className={cn("ml-4 truncate", textColorClasses)}>{label}</span>
            {badge && (
                <Badge 
                    variant="secondary" 
                    className={cn(
                        "ml-auto h-5 px-2 text-xs bg-gray-500 text-white"
                    )}
                >
                    {badge}
                </Badge>
            )}
        </button>
    );
}; 
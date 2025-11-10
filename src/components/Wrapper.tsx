import React from "react";
import NavBar from "./NavBar";
import { useLocation, useNavigate } from "react-router-dom";
import { Toaster as SonnerToaster } from "../components/ui/sonner";
import { useAuth } from "../contexts/AuthContext";
import CartSidebar from "./CartSidebar";
import { useCart } from "../contexts/CartContext";

type WrapperProps = {
  children: React.ReactNode;
};

const Wrapper = ({ children }: WrapperProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isSuperAdmin } = useAuth();
  const {
    items,
    isOpen,
    removeFromCart,
    updateQuantity,
    closeCart,
    clearCart
  } = useCart();

  // Vérifier si on est sur une route admin (toute route commençant par /admin)
  const isAdminRoute = location.pathname.startsWith('/admin');

  // Vérifier si on est sur une route vendeur
  const isVendorRoute = location.pathname.startsWith('/vendeur');

  // Vérifier si on est sur des routes spéciales où la navbar ne doit pas apparaître
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/forgot-password';

  // La NavBar s'affiche UNIQUEMENT sur les routes publiques
  // Elle est cachée sur : /admin/*, /vendeur/*, /login, /forgot-password
  const shouldHideNavbar = isAdminRoute || isVendorRoute || isAuthRoute;

  const handleCheckout = () => {
    // Fermer le panier
    closeCart();
    // Rediriger vers la page de commande
    navigate('/order-form');
  };

  return (
    <div>
      {!shouldHideNavbar && <NavBar />}
      <div>{children}</div>
      <CartSidebar
        isOpen={isOpen}
        onClose={closeCart}
        items={items}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onCheckout={handleCheckout}
      />
      <SonnerToaster
        position="bottom-right"
        theme="system" // s'adapte automatiquement au mode sombre
        richColors={false} // pour un style plus simple en noir et blanc
        closeButton
      />
    </div>
  );
};

export default Wrapper;
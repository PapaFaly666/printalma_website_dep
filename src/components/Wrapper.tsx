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
    closeCart
  } = useCart();

  // Liste des routes où le NavBar ne doit PAS apparaître
  const hideNavbarRoutes = ["/admin/products","/admin/dashboard","/admin/payment-requests","/login","/admin/product-form","/admin/categories","/admin/clients","/forgot-password","admin/orders","/admin/orders","/admin/add-product","/admin/design-validation","/admin/product-validation","/admin/vendor-products-admin","/admin/vendor-products/create","/admin/vendor-products","/admin/trash","/admin/design-categories","/admin/users"];

  // Vérifier si on est sur une route de détail produit (/products/:id ou /admin/products/:id)
  const isProductDetailPage = /^\/(products|admin\/products)\/\d+$/.test(location.pathname);
  // Vérifier si on est sur la page d'édition produit admin (/admin/products/:id/edit)
  const isAdminProductEditPage = /^\/admin\/products\/\d+\/edit$/.test(location.pathname);
  // Vérifier si on est sur une page de détail de commande admin (/admin/orders/:orderId)
  const isAdminOrderDetailPage = /^\/admin\/orders\/\d+$/.test(location.pathname);
  
  // Vérifier si on est sur une route vendeur
  const isVendorRoute = location.pathname.startsWith('/vendeur');

  // Vérifier si on est sur une route de gestion des thèmes
  const isThemeManagementRoute = location.pathname.startsWith('/admin/themes/') && location.pathname.includes('/products');
  
  // Cacher la navbar si la route est dans la liste, si c'est une page de détail produit, si c'est une route vendeur, ou si c'est une route de gestion des thèmes
  const shouldHideNavbar = hideNavbarRoutes.includes(location.pathname) || isProductDetailPage || isAdminProductEditPage || isAdminOrderDetailPage || isVendorRoute || isThemeManagementRoute;

  const handleCheckout = () => {
    // Rediriger vers la page de commande
    navigate('/order-form');
  };

  return (
    <div>
      {!shouldHideNavbar && !isSuperAdmin() && <NavBar />}
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
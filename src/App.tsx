import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './App.css';

// 🔧 Utilitaires de debug globaux pour l'isolation des positions
import './utils/globalDebugHelpers';

import Wrapper from './components/Wrapper';
import Landing from './pages/Landing';
import FilteredProducts from './pages/FilteredProducts';
import DetailsProduct from './pages/DetailsProduct';
import FilteredArticlesPage from './pages/FilteredArticlesPage';
import CartPage from './components/CartPage';
import AllMarques from './components/AllMarques';
import MarqueDetails from './components/MarqueDetails';
import AdminDashboard from './pages/AdminDashboard';
import ProductList from './pages/ProductList';
import Dashboard from './pages/Dashboard';
import PaiementRequest from './pages/PaiementRequest';
import Sale from './pages/Sale';
import CategoryManagement from './pages/CategoryManagement';
import ProductAnalytics from './pages/ProductAnalytics';
import DeletedProducts from './pages/DeletedProducts';
import ClientManagement from './pages/ClientManagement';
import { CategoryProvider } from './contexts/CategoryContext';
import VendorDashboard from './pages/VendorDashboard';
// import VendorProductList from './pages/vendor/VendorProductList'; // unused
import { VendorProductsPage } from './pages/vendor/VendorProductsPage';
import VendorDeletedProducts from './pages/vendor/VendorDeletedProducts';
import VendorSales from './pages/vendor/VendorSales';
import ModernProductDetail from './pages/ModernProductDetail';
import { VendorLayout } from './layouts/VendorLayout';
import { VendorProductDetailPage } from './pages/vendor/VendorProductDetailPage';
import { EditVendorProductPage } from './pages/vendor/EditVendorProductPage';
import { VendorDesignsPage } from './pages/vendor/VendorDesignsPage';
import VendorDashboardPage from './pages/vendor/VendorDashboardPage';

// Nouveaux composants d'authentification
import { AuthProvider } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ProtectedRoute, { AdminRoute, VendeurRoute, PublicRoute } from './components/auth/ProtectedRoute';
import VendorLoginPage from './pages/auth/VendorLoginPage';
import VendorRegisterPage from './pages/auth/VendorRegisterPage';
import VendorPendingPage from './pages/auth/VendorPendingPage';

// Nouveaux composants de réinitialisation de mot de passe
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Composants de gestion des commandes
import OrdersManagement from './pages/admin/OrdersManagement';
import { MyOrders } from './pages/MyOrders';
import NotificationsPage from './pages/NotificationsPage';
import OrderDetailPage from './pages/admin/OrderDetailPage';

// 🔌 Interface de test d'intégration backend
import BackendIntegrationDemo from './components/BackendIntegrationDemo';

// 🐛 Débogueur de déconnexion temporaire
import { LogoutDebugger } from './components/debug/LogoutDebugger';

// Import du CSS pour les commandes et WebSocket
import './styles/orders.css';
import './styles/websocket.css';

// Nouveau composant principal pour l'ajout de produits
import AddProductPage from './pages/AddProductPage';

// Page de compte vendeur
import VendorAccountPage from './pages/vendor/VendorAccountPage';

// Page de détail des commandes vendeur
import VendorOrderDetailPage from './pages/vendor/VendorOrderDetailPage';

// Page d'appel de fonds
import AppelDeFondsPage from './pages/AppelDeFondsPage';

// Nouvelles pages de gestion des fonds vendeur
import VendorFundsRequestPage from './pages/vendor/VendorFundsRequestPage';
import AdminPaymentRequestsPage from './pages/admin/AdminPaymentRequestsPage';

// Page de gestion des mockups
import ProductMockupsPage from './pages/admin/ProductMockupsPage';

// 🎨 Exemple de délimitation interactive
import { DelimitationExample } from './components/examples/DelimitationExample';

// Page d'upload de design pour les vendeurs
import SellDesignPage from './pages/SellDesignPage';

// 🚀 Interface moderne des produits
import { ProductListModernPage } from './pages/admin/ProductListModernPage';

// 🎨 Création de produits avec designs
// import { ProductListModern } from './components/admin/ProductListModern'; // unused

// Admin Design Validation
import { AdminDesignValidation } from './pages/admin/AdminDesignValidation';
import { AdminProductValidation } from './pages/admin/AdminProductValidation';
import AutoValidationDashboard from './pages/admin/AutoValidationDashboard';

// 🎯 Démonstration du système de workflow moderne
import WorkflowDemo from './pages/WorkflowDemo';

import { AdminVendorProductsPage } from './pages/admin/AdminVendorProductsPage';

// 🎯 Création de produits vendeur par l'admin
import { AdminCreateVendorProductPage } from './pages/admin/AdminCreateVendorProductPage';

// 🧪 Page de test du service intelligent de produits
import { ProductTestPage } from './pages/ProductTestPage';

// 🎯 Démonstration du système de validation vendeur
import { VendorValidationDemo } from './pages/vendor/VendorValidationDemo';

// 🆕 Page de détails des produits vendeurs
import VendorProductDetails from './pages/VendorProductDetails';

// Page publique pour afficher les produits d'un thème
import PublicThemeProductsPage from './pages/ThemeProductsPage';

// 🌊 Démonstration du système de validation en cascade
import { CascadeValidationDemo } from './pages/vendor/CascadeValidationDemo';

// 🌊 Page des produits vendeur avec cascade validation
import { VendorProductsWithCascadePage } from './pages/vendor/VendorProductsWithCascadePage';

// 🌊 Nouvelle page de cascade validation
import { VendorProductsCascadePage } from './pages/vendor/VendorProductsCascadePage';

// 🌊 Page de démonstration complète
import { CascadeValidationDemoPage } from './pages/vendor/CascadeValidationDemoPage';

// 🎯 Démonstration du positionnement adaptatif
import { AdaptivePositioningDemo } from './pages/AdaptivePositioningDemo';

// 🗑️ Page de corbeille admin
import AdminTrashPage from './pages/admin/AdminTrashPage';

// 📝 Page d'édition de produit admin
import AdminEditProductPage from './pages/admin/AdminEditProductPage';

// 🎯 Produits prêts - Admin
import ReadyProductsPage from './pages/admin/ReadyProductsPage';
import CreateReadyProductPage from './pages/admin/CreateReadyProductPage';
import ReadyProductDetailPage from './pages/admin/ReadyProductDetailPage';
import EditReadyProductPage from './pages/admin/EditReadyProductPage';
import DesignPositioningPage from './pages/admin/DesignPositioningPage';
import AdminDesignCategories from './pages/admin/AdminDesignCategories';

// 🎨 Gestion des thèmes - Admin
import ThemesPage from './pages/admin/ThemesPage';
import ThemeProductsPage from './pages/admin/ThemeProductsPage';
import ThemesPageTest from './pages/admin/ThemesPageTest';

// 🏆 Best Sellers
import BestSellersPage from './pages/BestSellersPage';

// Créer une instance globale de QueryClient
const queryClient = new QueryClient();

import ConfirmEmailChange from './pages/ConfirmEmailChange';
import ProductsPage from './pages/ProductsPage';
import { useAuthPersistence } from './hooks/useAuthPersistence';

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AuthPersistenceWrapper>
            <CategoryProvider>
            <Wrapper>
              <Routes>
                {/* Routes publiques */}
                <Route path='/login' element={
                  <PublicRoute>
                    <LoginForm />
                  </PublicRoute>
                } />
                
                <Route path='/forgot-password' element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                } />
                
                <Route path='/reset-password' element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                } />
                
                <Route path='/change-password' element={<ChangePasswordPage />} />
                
                {/* Routes publiques du site */}
                <Route path="/" element={<Landing />} />
                <Route path='/products-catalog' element={< ProductsPage/>} />
                <Route path='/filtered-products' element={<FilteredProducts />} />
                <Route path="/product-details" element={<DetailsProduct />} />
                <Route path="/product/:id" element={<ModernProductDetail />} />
                <Route path="/vendor-product/:id" element={<VendorProductDetails />} />
                <Route path='/filtered-articles' element={<FilteredArticlesPage />} />
                <Route path='/best-sellers' element={<BestSellersPage />} />
                <Route path='/vendez-vos-oeuvres' element={<SellDesignPage />} />
                <Route path='/cart' element={<CartPage />} />
                <Route path="/all-marques" element={<AllMarques />} />
                <Route path="/marque-details" element={<MarqueDetails />} />
                <Route path='/products' element={<ProductList />} />
                <Route path='/products/:id' element={<ModernProductDetail />} />
                <Route path='/themes' element={<PublicThemeProductsPage />} />
                <Route path='/themes/:themeId' element={<PublicThemeProductsPage />} />
                
                {/* 🔌 Interface de test d'intégration backend */}
                <Route path='/integration-test' element={<BackendIntegrationDemo />} />
                
                {/* 🐛 Débogueur de déconnexion temporaire */}
                <Route path='/debug-logout' element={<LogoutDebugger />} />
                
                {/* 🎨 Exemple de délimitation interactive */}
                <Route path='/delimitation-demo' element={<DelimitationExample />} />
                
                {/* 🚀 Test interface moderne des produits */}
                <Route path='/products-modern' element={<ProductListModernPage />} />
                
                {/* Route client protégée pour les commandes */}
                <Route path='/my-orders' element={
                  <ProtectedRoute>
                    <MyOrders />
                  </ProtectedRoute>
                } />
                
                {/* Routes admin protégées */}
                <Route path='/admin' element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }>
                  <Route path="products" element={<ProductListModernPage />} />
                  <Route path="deleted-products" element={<DeletedProducts />} />
                  <Route path="categories" element={<CategoryManagement />} />
                  <Route path="clients" element={<ClientManagement />} />
                  <Route path="design-validation" element={<AdminDesignValidation />} />
                  <Route path="product-validation" element={<AdminProductValidation />} />
                  <Route path="auto-validation" element={<AutoValidationDashboard />} />
                  <Route path="design-categories" element={<AdminDesignCategories />} />
                  <Route path="vendor-products-admin" element={<AdminVendorProductsPage />} />
                  <Route path="vendor-products" element={<AdminVendorProductsPage />} />
                  <Route path="vendor-products/create" element={<AdminCreateVendorProductPage />} />
                  <Route path="ready-products" element={<ReadyProductsPage />} />
                  <Route path="ready-products/create" element={<CreateReadyProductPage />} />
                  <Route path="ready-products/:id" element={<ReadyProductDetailPage />} />
                  <Route path="ready-products/:id/edit" element={<EditReadyProductPage />} />
                  <Route path="design-positioning" element={<DesignPositioningPage />} />
                  <Route path="orders" element={<OrdersManagement />} />
                  <Route path="orders/:orderId" element={<OrderDetailPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="analytics" element={<ProductAnalytics />} />
                  <Route path='payment-requests' element={<AdminPaymentRequestsPage />} />
                  <Route path='sales' element={<Sale />} />
                  <Route path='add-product' element={<AddProductPage />} />
                  <Route path='product-form' element={<AddProductPage />} />
                  <Route path='products/:id/edit' element={<AdminEditProductPage />} />
                  <Route path='products/:id/mockups' element={<ProductMockupsPage />} />
                  <Route path='products/:id' element={<VendorProductDetailPage />} />
                  <Route path="trash" element={<AdminTrashPage />} />
                  <Route path="themes" element={<ThemesPage />} />
                  <Route path="themes/:themeId/products" element={<ThemeProductsPage />} />
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
                
                {/* Routes vendeur protégées */}
                <Route path='/vendeur' element={
                  <VendeurRoute>
                    <VendorLayout />
                  </VendeurRoute>
                }>
                  <Route path="dashboard" element={<VendorDashboardPage />} />
                  <Route path="products" element={<VendorProductsPage />} />
                  <Route path="products/:id" element={<VendorProductDetailPage />} />
                  <Route path="products/:id/edit" element={<EditVendorProductPage />} />
                  <Route path="designs" element={<VendorDesignsPage />} />
                  <Route path="deleted-products" element={<VendorDeletedProducts />} />
                  <Route path="add-product" element={<AddProductPage />} />
                  <Route path="product-form" element={<AddProductPage />} />
                  <Route path="sales" element={<VendorSales />} />
                  <Route path="sales/:orderId" element={<VendorOrderDetailPage />} />
                  <Route path="sell-design" element={<SellDesignPage />} />
                  <Route path="account" element={<VendorAccountPage />} />
                  <Route path="appel-de-fonds" element={<VendorFundsRequestPage />} />
                  <Route index element={<Navigate to="/vendeur/dashboard" replace />} />
                </Route>

                {/* Route par défaut - redirection intelligente */}
                <Route path='/dashboard' element={
                  <ProtectedRoute>
                    <Navigate to="/admin/dashboard" replace />
                  </ProtectedRoute>
                } />

                {/* Login vendeur dédié */}
                <Route path='/vendeur/login' element={
                  <PublicRoute>
                    <VendorLoginPage />
                  </PublicRoute>
                } />

                {/* Inscription vendeur */}
                <Route path='/vendeur/register' element={
                  <PublicRoute>
                    <VendorRegisterPage />
                  </PublicRoute>
                } />

                {/* Inscription en attente */}
                <Route path='/vendeur/pending' element={<VendorPendingPage />} />

                {/* 🎯 Démonstration du système de workflow moderne */}
                <Route path='/workflow-demo' element={<WorkflowDemo />} />

                {/* 🧪 Page de test du service intelligent de produits */}
                <Route path='/product-test' element={<ProductTestPage />} />

                {/* 🎯 Démonstration du système de validation vendeur */}
                <Route path='/vendor-validation-demo' element={<VendorValidationDemo />} />

                {/* 🌊 Démonstration du système de validation en cascade */}
                <Route path='/cascade-validation-demo' element={<CascadeValidationDemo />} />

                {/* 🌊 Page des produits vendeur avec cascade validation */}
                <Route path='/vendor-products-cascade' element={<VendorProductsWithCascadePage />} />

                {/* 🌊 Nouvelle page de cascade validation */}
                <Route path='/vendor-products-cascade-new' element={<VendorProductsCascadePage />} />

                {/* 🌊 Page de démonstration complète */}
                <Route path='/cascade-validation-demo-page' element={<CascadeValidationDemoPage />} />

                {/* 🎯 Démonstration du positionnement adaptatif */}
                <Route path='/adaptive-positioning-demo' element={<AdaptivePositioningDemo />} />

                {/* 🎯 Produits prêts - Admin */}
                <Route path='/ready-products' element={<ReadyProductsPage />} />
                <Route path='/create-ready-product' element={<CreateReadyProductPage />} />
                <Route path='/ready-products/:id' element={<ReadyProductDetailPage />} />
                <Route path='/ready-products/:id/edit' element={<EditReadyProductPage />} />

                {/* 🎨 Gestion des thèmes - Admin */}
                <Route path='/themes' element={<ThemesPage />} />
                <Route path='/themes-test' element={<ThemesPageTest />} />

                {/* Test de la page de positionnement */}
                <Route path='/test-design-positioning' element={<DesignPositioningPage />} />

                {/* Confirmation de changement d'email */}
                <Route path='/confirm-email-change' element={<ConfirmEmailChange />} />
              </Routes>
            </Wrapper>
            </CategoryProvider>
          </AuthPersistenceWrapper>
        </AuthProvider>
      </QueryClientProvider>
    </Router>
  );
}

// Composant wrapper pour utiliser le hook à l'intérieur de l'AuthProvider
function AuthPersistenceWrapper({ children }: { children: React.ReactNode }) {
  useAuthPersistence();
  return <>{children}</>;
}

export default App;
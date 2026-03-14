import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/react-query/queryClient';
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
import CartProvider from './contexts/CartContext';
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
import VendorDesignRevenuesPage from './pages/vendor/VendorDesignRevenuesPage';
import { VendorProfileSetupPage } from './pages/vendor/VendorProfileSetupPage';
import VendorOnboardingPage from './pages/vendor/VendorOnboardingPage';

// Nouveaux composants d'authentification
import { AuthProvider } from './contexts/AuthContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import FavoritesDrawer from './components/FavoritesDrawer';
import LoginForm from './components/auth/LoginForm';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ProtectedRoute, { AdminRoute, SuperAdminRoute, VendeurRoute, PublicRoute } from './components/auth/ProtectedRoute';
import VendorLoginPage from './pages/auth/VendorLoginPage';
import VendorRegisterPage from './pages/auth/VendorRegisterPage';
import VendorPendingPage from './pages/auth/VendorPendingPage';
import VendorLoginMethodsPage from './pages/auth/VendorLoginMethodsPage';
import VendorLoginClassicPage from './pages/auth/VendorLoginClassicPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import SecretAdminLoginPage from './pages/auth/SecretAdminLoginPage';
import OtpVerificationPage from './pages/auth/OtpVerificationPage';

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

// Pages de gestion des galeries vendeur
import VendorGalleryPage from './pages/vendor/VendorGalleryPage';

// Page de création de produits avec wizard
import CreateProductWizardPage from './pages/vendor/CreateProductWizardPage';

// Page de gestion des posters/tableaux
import { VendorPostersPage } from './pages/vendor/VendorPostersPage';

// Page d'appel de fonds
import AppelDeFondsPage from './pages/AppelDeFondsPage';

// Page paramètres admin
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AdminUsersPageModern from './pages/admin/AdminUsersPageModern';
import RolesManagementPage from './pages/admin/RolesManagementPage';

// Page de gestion du contenu
import { ContentManagementPage } from './pages/admin/ContentManagementPage';
import { ContentInitializationPage } from './pages/admin/ContentInitializationPage';

// Nouvelles pages de gestion des fonds vendeur
import VendorFundsRequestPage from './pages/vendor/VendorFundsRequestPage';
import VendorWithdrawalsPage from './pages/vendor/VendorWithdrawalsPage';
import AdminPaymentRequestsPage from './pages/admin/AdminPaymentRequestsPage';
import PaymentMethodsPage from './pages/admin/PaymentMethodsPageSimple';

// Page de gestion des mockups
import ProductMockupsPage from './pages/admin/ProductMockupsPage';

// 🎨 Exemple de délimitation interactive
import { DelimitationExample } from './components/examples/DelimitationExample';

// Page d'upload de design pour les vendeurs
import SellDesignPage from './pages/SellDesignPage';
import VendorStickerSimplePage from './pages/vendor/VendorStickerSimplePage';

// 🚀 Interface moderne des produits
import { ProductListModernPage } from './pages/admin/ProductListModernPage';

// 🎨 Création de produits avec designs
// import { ProductListModern } from './components/admin/ProductListModern'; // unused

// Admin Design Validation
import AdminDesignValidation from './pages/admin/AdminDesignValidation';
import AdminProductValidation from './pages/admin/AdminProductValidation';
import AutoValidationDashboard from './pages/admin/AutoValidationDashboard';
import DeliveryManagementPage from './pages/admin/DeliveryManagementPage';
import AdminWizardValidation from './pages/admin/AdminWizardValidation';
import ZonesLivraisonPage from './pages/admin/ZonesLivraisonPage';

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
import AdminMockupsPage from './pages/AdminMockupsPage';
import CustomerProductCustomizationPage from './pages/CustomerProductCustomizationPage';
import CustomerProductCustomizationPageV2 from './pages/CustomerProductCustomizationPageV2';
import CustomerProductCustomizationPageV3 from './pages/CustomerProductCustomizationPageV3';
import PublicVendorProductDetailPage from './pages/PublicVendorProductDetailPage';

// Page de formulaire de commande
import ModernOrderFormPage from './pages/ModernOrderFormPage';
import OrderConfirmationPage from './pages/OrderConfirmationPage';

// Pages de paiement PayDunya
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';
// Pages de paiement PayTech (compatibilité)
import PaymentReturnPage from './pages/PaymentReturnPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelPage from './pages/PaymentCancelPage';

// 🆕 Nouvelles pages de paiement PayDunya avec gestion complète des statuts
import PaymentSuccessPageNew from './pages/payment/PaymentSuccessPage';
import PaymentFailedPageNew from './pages/payment/PaymentFailedPage';
import PaymentStatusHandler from './components/payment/PaymentStatusHandler';

// 🍊 Page de paiement Orange Money avec polling
import OrangeMoneyPaymentPage from './pages/payment/OrangeMoneyPaymentPage';

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
import FeaturedThemesManager from './pages/admin/FeaturedThemesManager';
import FeaturedDesignersManager from './pages/admin/FeaturedDesignersManager';

// 🎨 Gestion des thèmes - Admin
import ThemesPage from './pages/admin/ThemesPage';
import ThemeProductsPage from './pages/admin/ThemeProductsPage';
import ThemesPageTest from './pages/admin/ThemesPageTest';

// 📦 Gestion du stock - Admin
import AdminStockManagement from './pages/admin/AdminStockManagement';

// 🧪 Test de connexion admin
import AdminLoginTest from './pages/test/AdminLoginTest';

// 💳 Test PayDunya
import TestPaydunyaPage from './pages/TestPaydunyaPage';
import TestPaydunyaFixPage from './pages/TestPaydunyaFixPage';

// 🧪 Page de test stickers
import StickerTestPage from './pages/StickerTestPage';

// 🏆 Best Sellers
import BestSellersPage from './pages/BestSellersPage';

// 🎤 Artistes
import ArtistesPage from './pages/ArtistesPage';

// 🎬 Influenceurs
import InfluenceursPage from './pages/InfluenceursPage';

// 🎨 Designers
import DesignersPage from './pages/DesignersPage';

// 👤 Page de profil
import ProfilePage from './pages/ProfilePage';

// 🎯 Devenir Vendeur
import BecomeVendorPage from './pages/BecomeVendorPage';

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
              <CartProvider>
                <FavoritesProvider>
                  <Wrapper>
                    <FavoritesDrawer />
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
                <Route path="/vendor-product-detail/:id" element={<PublicVendorProductDetailPage />} />
                <Route path="/public-sticker/:id" element={<PublicVendorProductDetailPage />} />
                <Route path='/filtered-articles' element={<FilteredArticlesPage />} />
                <Route path='/customize-product' element={<AdminMockupsPage />} />
                <Route path='/product/:id/customize' element={<CustomerProductCustomizationPageV3 />} />
                <Route path='/product/:id/customize-v2' element={<CustomerProductCustomizationPageV2 />} />
                <Route path='/product/:id/customize-v1' element={<CustomerProductCustomizationPage />} />
                <Route path='/best-sellers' element={<BestSellersPage />} />
                <Route path='/artistes' element={<ArtistesPage />} />
                <Route path='/influenceurs' element={<InfluenceursPage />} />
                <Route path='/designers' element={<DesignersPage />} />
                <Route path='/profile/:type/:shopName' element={<ProfilePage />} />
                <Route path='/vendez-vos-oeuvres' element={<SellDesignPage />} />
                <Route path='/devenir-vendeur' element={<BecomeVendorPage />} />
                <Route path='/cart' element={<CartPage />} />
                <Route path='/order-form' element={<ModernOrderFormPage />} />
                <Route path='/order-confirmation' element={<OrderConfirmationPage />} />

                {/* Routes de paiement PayDunya - Nouvelles pages avec gestion complète des statuts */}
                <Route path='/payment/success' element={<PaymentSuccessPageNew />} />
                <Route path='/payment/failed' element={<PaymentFailedPageNew />} />
                <Route path='/payment/cancel' element={<PaymentFailedPageNew />} />
                <Route path='/payment/status' element={<PaymentStatusHandler />} />

                {/* Route de paiement Orange Money avec polling automatique */}
                <Route path='/payment/orange-money' element={<OrangeMoneyPaymentPage />} />

                {/* Routes de paiement PayTech (compatibilité - anciennes pages) */}
                <Route path='/paytech/success' element={<PaymentSuccessPage />} />
                <Route path='/paytech/cancel' element={<PaymentCancelPage />} />
                <Route path='/payment/return' element={<PaymentReturnPage />} />
                <Route path='/payment/notify' element={<PaymentReturnPage />} />
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

                {/* 🧪 Test de connexion admin */}
                <Route path='/admin-login-test' element={<AdminLoginTest />} />
                
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
                  <Route path="wizard-validation" element={<AdminWizardValidation />} />
                  <Route path="auto-validation" element={<AutoValidationDashboard />} />
                  <Route path="design-categories" element={<AdminDesignCategories />} />
                  <Route path="featured-themes" element={<FeaturedThemesManager />} />
                  <Route path="featured-designers" element={<FeaturedDesignersManager />} />
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
                  <Route path="users" element={<SuperAdminRoute><AdminUsersPageModern /></SuperAdminRoute>} />
                  <Route path="roles" element={<SuperAdminRoute><RolesManagementPage /></SuperAdminRoute>} />
                  <Route path="content-init" element={<ContentInitializationPage />} />
                  <Route path="content-management" element={<ContentManagementPage />} />
                  <Route path='payment-requests' element={<AdminPaymentRequestsPage />} />
                  <Route path='payment-methods' element={<PaymentMethodsPage />} />
                  <Route path='sales' element={<Sale />} />
                  <Route path='add-product' element={<AddProductPage />} />
                  <Route path='product-form' element={<AddProductPage />} />
                  <Route path='products/:id/edit' element={<AdminEditProductPage />} />
                  <Route path='products/:id/mockups' element={<ProductMockupsPage />} />
                  <Route path='products/:id' element={<VendorProductDetailPage />} />
                  <Route path="trash" element={<AdminTrashPage />} />
                  <Route path="themes" element={<ThemesPage />} />
                  <Route path="themes/:themeId/products" element={<ThemeProductsPage />} />
                  <Route path="stock" element={<AdminStockManagement />} />
                  <Route path="delivery" element={<DeliveryManagementPage />} />
                  <Route path="livraison" element={<ZonesLivraisonPage />} />
                  <Route path="settings" element={<AdminSettingsPage />} />
                  <Route index element={<Navigate to="/admin/dashboard" replace />} />
                </Route>
                
                {/* Route d'onboarding vendeur - hors du layout */}
                <Route path='/vendeur/onboarding' element={
                  <VendeurRoute skipOnboardingCheck={true}>
                    <VendorOnboardingPage />
                  </VendeurRoute>
                } />

                {/* Routes vendeur protégées */}
                <Route path='/vendeur' element={
                  <VendeurRoute>
                    <VendorLayout />
                  </VendeurRoute>
                }>
                  <Route path="dashboard" element={<VendorDashboardPage />} />
                  <Route path="profile-setup" element={<VendorProfileSetupPage />} />
                  <Route path="products" element={<VendorProductsPage />} />
                  <Route path="products/:id" element={<VendorProductDetailPage />} />
                  <Route path="products/:id/edit" element={<EditVendorProductPage />} />
                  <Route path="designs" element={<VendorDesignsPage />} />
                  <Route path="design-revenues" element={<VendorDesignRevenuesPage />} />
                  <Route path="galleries" element={<VendorGalleryPage />} />
                  <Route path="gallery" element={<Navigate to="/vendeur/galleries" replace />} />
                  <Route path="deleted-products" element={<VendorDeletedProducts />} />
                  <Route path="add-product" element={<AddProductPage />} />
                  <Route path="product-form" element={<AddProductPage />} />
                  <Route path="sales" element={<VendorSales />} />
                  <Route path="sales/:orderId" element={<VendorOrderDetailPage />} />
                  <Route path="sell-design" element={<SellDesignPage />} />
                  <Route path="create-product" element={<CreateProductWizardPage />} />
                  <Route path="stickers" element={<VendorStickerSimplePage />} />
                  <Route path="posters" element={<VendorPostersPage />} />
                  <Route path="account" element={<VendorAccountPage />} />
                  <Route path="appel-de-fonds" element={<VendorFundsRequestPage />} />
                  <Route path="retraits" element={<VendorWithdrawalsPage />} />
                  <Route index element={<Navigate to="/vendeur/dashboard" replace />} />
                </Route>

                {/* Connexion Admin - Route secrète */}
                <Route path='/secure-admin-access-2024' element={
                  <SecretAdminLoginPage />
                } />

                {/* Connexion Admin - Route publique (redirection) */}
                <Route path='/admin/login' element={
                  <PublicRoute>
                    <VendorLoginMethodsPage />
                  </PublicRoute>
                } />

                {/* Vérification OTP Admin */}
                <Route path='/admin/verify-otp' element={
                  <OtpVerificationPage />
                } />

                {/* Route par défaut - redirection intelligente */}
                <Route path='/dashboard' element={
                  <ProtectedRoute>
                    <Navigate to="/admin/dashboard" replace />
                  </ProtectedRoute>
                } />

                {/* Login vendeur - Page de méthodes */}
                <Route path='/vendeur/login' element={
                  <PublicRoute>
                    <VendorLoginMethodsPage />
                  </PublicRoute>
                } />

                {/* Login vendeur - Formulaire classique */}
                <Route path='/vendeur/login-classic' element={
                  <PublicRoute>
                    <VendorLoginClassicPage />
                  </PublicRoute>
                } />

                {/* Login vendeur - Ancienne page (pour compatibilité) */}
                <Route path='/vendeur/login-legacy' element={
                  <PublicRoute>
                    <VendorLoginPage />
                  </PublicRoute>
                } />

                {/* Vérification OTP Vendeur */}
                <Route path='/vendeur/verify-otp' element={
                  <OtpVerificationPage />
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

                {/* 💳 Test PayDunya */}
                <Route path='/test-paydunya' element={<TestPaydunyaPage />} />
                <Route path='/test-paydunya-fix' element={<TestPaydunyaFixPage />} />


                {/* Confirmation de changement d'email */}
                <Route path='/confirm-email-change' element={<ConfirmEmailChange />} />
              </Routes>
                </Wrapper>
                </FavoritesProvider>
              </CartProvider>
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
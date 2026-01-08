import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import Button from '../ui/Button';
import { Badge } from '../ui/badge';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  Image as ImageIcon,
  Globe,
  Database,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface VendorProductImageDebuggerProps {
  className?: string;
}

interface EndpointResult {
  name: string;
  url: string;
  status: number | string;
  success: boolean;
  data?: any;
  error?: string;
  analysis: {
    type: string;
    message: string;
    products?: number;
    hasImages?: boolean;
    hasWorkflow?: boolean;
  };
}

export const VendorProductImageDebugger: React.FC<VendorProductImageDebuggerProps> = ({
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'products' | 'images'>('endpoints');
  const [diagnosticResults, setDiagnosticResults] = useState<EndpointResult[]>([]);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // 🔍 Configuration API avec credentials include
  const API_BASE = process.env.NODE_ENV === 'development' ? 'http://localhost:3001/api' : '/api';

  // 🧪 Diagnostic des endpoints
  const diagnoseEndpoints = async () => {
    setLoading(true);
    console.log('🔍 === DIAGNOSTIC ENDPOINTS CREDENTIALS INCLUDE ===');
    
    const endpoints = [
      { name: 'Produits Admin', url: '/api/products' },
      { name: 'Produits Vendeur V2', url: '/api/vendor/products' },
      { name: 'Health Check Vendeur', url: '/api/vendor/health' },
      { name: 'User Profile', url: '/api/auth/profile' }
    ];

    const results: EndpointResult[] = [];

    for (const endpoint of endpoints) {
      try {
        console.log(`\n🧪 Test: ${endpoint.name} (${endpoint.url})`);
        
        const response = await fetch(`${API_BASE}${endpoint.url}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        const data = await response.json();
        
        const result: EndpointResult = {
          name: endpoint.name,
          url: endpoint.url,
          status: response.status,
          success: response.ok,
          data: data,
          analysis: analyzeEndpointResponse(data)
        };
        
        results.push(result);
        console.log(`✅ ${endpoint.name}:`, result);
        
      } catch (error: any) {
        const result: EndpointResult = {
          name: endpoint.name,
          url: endpoint.url,
          status: 'ERROR',
          success: false,
          error: error.message,
          analysis: { type: 'error', message: error.message }
        };
        
        results.push(result);
        console.error(`❌ ${endpoint.name}:`, error);
      }
    }

    setDiagnosticResults(results);
    setLoading(false);

    // Si on trouve des produits V2, les charger
    const v2Endpoint = results.find(r => r.analysis.type === 'v2_vendor');
    if (v2Endpoint && v2Endpoint.success) {
      setVendorProducts(v2Endpoint.data?.data?.products || []);
      toast.success(`Architecture V2 détectée ! ${v2Endpoint.analysis.products} produits trouvés`);
    } else {
      toast.error('Aucune architecture V2 détectée. Vérifiez votre configuration.');
    }
  };

  // 🔍 Analyser la réponse d'un endpoint
  const analyzeEndpointResponse = (data: any) => {
    if (!data) return { type: 'empty', message: 'Réponse vide' };
    
    // Architecture V2 Vendeur
    if (data.architecture === 'v2_preserved_admin') {
      return {
        type: 'v2_vendor',
        message: 'Architecture V2 Vendeur détectée ✅',
        products: data.data?.products?.length || 0,
        hasImages: data.data?.products?.some((p: any) => p.images?.primaryImageUrl) || false
      };
    }
    
    // Produits Admin
    if (data.products && Array.isArray(data.products)) {
      const firstProduct = data.products[0];
      if (firstProduct && (firstProduct.workflow || firstProduct.pendingAutoPublish !== undefined)) {
        return {
          type: 'admin_products',
          message: 'Produits Admin détectés ⚠️',
          products: data.products.length,
          hasWorkflow: !!firstProduct.workflow
        };
      }
      return {
        type: 'unknown_products',
        message: 'Produits de type inconnu',
        products: data.products.length
      };
    }
    
    // User profile
    if (data.user || data.id) {
      return {
        type: 'user_profile',
        message: 'Profil utilisateur',
        userId: data.id || data.user?.id
      };
    }
    
    // Health check
    if (data.status || data.health) {
      return {
        type: 'health',
        message: 'Health check',
        status: data.status || 'unknown'
      };
    }
    
    return { type: 'unknown', message: 'Type de données inconnu' };
  };

  // 🎯 Extraire l'URL d'image d'un produit
  const getProductImageUrl = (product: any, selectedColorIndex: number = 0): string => {
    // Architecture V2 - même logique que ModernVendorProductCard
    if (product.adminProduct?.colorVariations?.length > 0) {
      const colorVariation = product.adminProduct.colorVariations[selectedColorIndex] || product.adminProduct.colorVariations[0];
      if (colorVariation?.images?.length > 0) {
        return colorVariation.images[0].url;
      }
    }

    if (product.images?.primaryImageUrl) {
      return product.images.primaryImageUrl;
    }

    if (product.images?.adminReferences?.length > 0) {
      return product.images.adminReferences[0].adminImageUrl;
    }

    if (product.colorVariations?.length > 0) {
      const variation = product.colorVariations[selectedColorIndex] || product.colorVariations[0];
      if (variation?.images?.length > 0) {
        return variation.images[0].url;
      }
    }

    if (product.imageUrl && product.imageUrl.trim() && product.imageUrl !== '') {
      return product.imageUrl;
    }

    if (product.designApplication?.designBase64) {
      return product.designApplication.designBase64;
    }

    return '/placeholder-image.jpg';
  };

  // 🔍 Analyser les images d'un produit
  const analyzeProductImages = (product: any) => {
    const analysis = {
      hasBasicInfo: !!(product.id && (product.vendorName || product.name)),
      hasImageUrl: !!(product.imageUrl && product.imageUrl.trim()),
      hasColorVariations: !!(product.colorVariations?.length > 0),
      hasAdminProduct: !!(product.adminProduct),
      hasDesignApplication: !!(product.designApplication),
      hasImagesStructure: !!(product.images),
      hasDesign: false,
      imageCount: 0,
      validImageCount: 0,
      imageUrls: [] as string[]
    };

    // Vérifier si le produit a un design
    analysis.hasDesign = !!(
      product.designApplication?.hasDesign ||
      product.designApplication?.designBase64 ||
      product.designUrl ||
      product.design
    );

    // Compter les images
    if (product.adminProduct?.colorVariations) {
      product.adminProduct.colorVariations.forEach((cv: any) => {
        if (cv.images?.length > 0) {
          cv.images.forEach((img: any) => {
            analysis.imageCount++;
            if (img.url && img.url.trim()) {
              analysis.validImageCount++;
              analysis.imageUrls.push(img.url);
            }
          });
        }
      });
    }

    if (product.colorVariations) {
      product.colorVariations.forEach((cv: any) => {
        if (cv.images?.length > 0) {
          cv.images.forEach((img: any) => {
            analysis.imageCount++;
            if (img.url && img.url.trim()) {
              analysis.validImageCount++;
              analysis.imageUrls.push(img.url);
            }
          });
        }
      });
    }

    if (product.images?.primaryImageUrl) {
      analysis.imageCount++;
      if (product.images.primaryImageUrl.trim()) {
        analysis.validImageCount++;
        analysis.imageUrls.push(product.images.primaryImageUrl);
      }
    }

    if (product.imageUrl) {
      analysis.imageCount++;
      if (product.imageUrl.trim()) {
        analysis.validImageCount++;
        analysis.imageUrls.push(product.imageUrl);
      }
    }

    return analysis;
  };

  // 📊 Rendu du diagnostic des endpoints
  const renderEndpointDiagnostic = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium">Diagnostic des endpoints (credentials: include)</h4>
        <Button onClick={diagnoseEndpoints} disabled={loading} size="sm">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Test en cours...' : 'Tester'}
        </Button>
      </div>

      {diagnosticResults.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Cliquez sur "Tester" pour diagnostiquer les endpoints
        </div>
      ) : (
        <div className="space-y-3">
          {diagnosticResults.map((result, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <strong className="text-sm">{result.name}</strong>
                <Badge variant={result.success ? 'default' : 'destructive'}>
                  {result.success ? `${result.status} ✅` : `${result.status} ❌`}
                </Badge>
              </div>
              
              <div className="text-xs bg-blue-50 p-2 rounded mb-2">
                <strong>URL:</strong> {result.url}<br />
                <strong>Method:</strong> GET with credentials: 'include'
              </div>
              
              <div className={`p-2 rounded text-xs ${
                result.analysis.type === 'v2_vendor' ? 'bg-green-50 border-l-4 border-green-400' :
                result.analysis.type === 'admin_products' ? 'bg-yellow-50 border-l-4 border-yellow-400' :
                'bg-gray-50 border-l-4 border-gray-400'
              }`}>
                <strong>Analyse:</strong> {result.analysis.message}<br />
                {result.analysis.products && <><strong>Produits:</strong> {result.analysis.products}<br /></>}
                {result.analysis.hasImages && <><strong>Images:</strong> ✅ Présentes<br /></>}
                {result.analysis.hasWorkflow && <><strong>Workflow:</strong> ✅ Détecté<br /></>}
              </div>

              {result.error && (
                <div className="text-red-600 text-xs mt-2">
                  <strong>Erreur:</strong> {result.error}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 📦 Rendu des produits
  const renderProducts = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Produits vendeur trouvés ({vendorProducts.length})</h4>
      
      {vendorProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun produit vendeur trouvé. Lancez d'abord le diagnostic des endpoints.
        </div>
      ) : (
        <div className="space-y-3">
          {vendorProducts.map((product, index) => {
            const analysis = analyzeProductImages(product);
            const imageUrl = getProductImageUrl(product);
            
            return (
              <div key={product.id || index} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <strong className="text-sm">{product.vendorName || product.name || `Produit ${index + 1}`}</strong>
                    {product.originalAdminName && (
                      <div className="text-xs text-gray-500">Base: {product.originalAdminName}</div>
                    )}
                  </div>
                  <Badge variant={analysis.validImageCount > 0 ? 'default' : 'destructive'}>
                    {analysis.validImageCount} images
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs space-y-1">
                      <div>Prix: {product.price?.toLocaleString()} FCFA</div>
                      <div>Statut: {product.status}</div>
                      <div>Admin V2: {analysis.hasAdminProduct ? '✅' : '❌'}</div>
                      <div>Design: {analysis.hasDesign ? '✅' : '❌'}</div>
                      <div>Images structure: {analysis.hasImagesStructure ? '✅' : '❌'}</div>
                    </div>
                  </div>
                  
                  <div>
                    {imageUrl && imageUrl !== '/placeholder-image.jpg' ? (
                      <div className="relative">
                        <img 
                          src={imageUrl} 
                          alt={product.vendorName || product.name}
                          className="w-full h-24 object-cover rounded border"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              parent.innerHTML = '<div class="w-full h-24 bg-red-50 border border-red-200 rounded flex items-center justify-center text-red-600 text-xs">❌ Erreur chargement</div>';
                            }
                          }}
                        />
                        <div className="absolute top-1 right-1">
                          <Badge variant="secondary" className="text-xs">
                            {imageUrl.startsWith('data:') ? 'Base64' : 
                             imageUrl.startsWith('http') ? 'URL' : 'Relatif'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-24 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-gray-500 text-xs">
                        🚫 Aucune image
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // 🖼️ Rendu analyse des images
  const renderImageAnalysis = () => (
    <div className="space-y-4">
      <h4 className="text-sm font-medium">Analyse détaillée des images</h4>
      
      {vendorProducts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          Aucun produit à analyser. Lancez d'abord le diagnostic.
        </div>
      ) : (
        <div className="space-y-4">
          {vendorProducts.map((product, index) => {
            const analysis = analyzeProductImages(product);
            
            return (
              <div key={product.id || index} className="border rounded-lg p-4">
                <h5 className="font-medium mb-2">{product.vendorName || product.name}</h5>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {analysis.validImageCount > 0 ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span className="text-sm">Images valides ({analysis.validImageCount}/{analysis.imageCount})</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {analysis.hasAdminProduct ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span className="text-sm">Structure Admin V2</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {analysis.hasDesignApplication ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span className="text-sm">Application Design</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {analysis.hasImagesStructure ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span className="text-sm">Structure images</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {analysis.hasColorVariations ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span className="text-sm">Variations couleur</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {analysis.hasDesign ? 
                        <CheckCircle className="h-4 w-4 text-green-500" /> : 
                        <XCircle className="h-4 w-4 text-red-500" />
                      }
                      <span className="text-sm">Design présent</span>
                    </div>
                  </div>
                </div>

                {analysis.imageUrls.length > 0 && (
                  <div>
                    <h6 className="text-sm font-medium mb-2">URLs d'images trouvées:</h6>
                    <div className="space-y-1">
                      {analysis.imageUrls.map((url, urlIndex) => (
                        <div key={urlIndex} className="text-xs font-mono bg-gray-50 p-2 rounded border break-all">
                          {url.substring(0, 100)}{url.length > 100 ? '...' : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // Auto-diagnostic au montage
  useEffect(() => {
    if (isExpanded && diagnosticResults.length === 0) {
      diagnoseEndpoints();
    }
  }, [isExpanded]);

  if (!isExpanded) {
    return (
      <div className={`border rounded p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Debug Images V2 (Credentials)</span>
            {diagnosticResults.length > 0 && (
              <Badge variant={diagnosticResults.some(r => r.analysis.type === 'v2_vendor') ? 'default' : 'destructive'}>
                {diagnosticResults.filter(r => r.success).length}/{diagnosticResults.length} endpoints
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(true)}
          >
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <CardTitle className="text-sm">Debug Images Architecture V2 (Credentials Include)</CardTitle>
            {diagnosticResults.length > 0 && (
              <Badge variant={diagnosticResults.some(r => r.analysis.type === 'v2_vendor') ? 'default' : 'destructive'}>
                {diagnosticResults.filter(r => r.success).length}/{diagnosticResults.length} OK
              </Badge>
            )}
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setIsExpanded(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex gap-2">
          {(['endpoints', 'products', 'images'] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab)}
              className="text-xs"
            >
              {tab === 'endpoints' && <Globe className="h-3 w-3 mr-1" />}
              {tab === 'products' && <Database className="h-3 w-3 mr-1" />}
              {tab === 'images' && <ImageIcon className="h-3 w-3 mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'endpoints' && renderEndpointDiagnostic()}
        {activeTab === 'products' && renderProducts()}
        {activeTab === 'images' && renderImageAnalysis()}
      </CardContent>
    </Card>
  );
};

export default VendorProductImageDebugger; 
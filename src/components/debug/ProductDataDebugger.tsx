import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { 
  Eye, 
  EyeOff, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Search,
  Image as ImageIcon,
  Palette,
  Database
} from 'lucide-react';

interface ProductDataDebuggerProps {
  product: any;
  className?: string;
}

export const ProductDataDebugger: React.FC<ProductDataDebuggerProps> = ({
  product,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'images' | 'structure' | 'raw'>('overview');

  // 🔍 Analyser la structure du produit
  const analyzeProduct = () => {
    const analysis = {
      hasBasicInfo: !!(product.id && product.name),
      hasImageUrl: !!(product.imageUrl && product.imageUrl.trim()),
      hasColorVariations: !!(product.colorVariations?.length > 0),
      hasAdminProduct: !!(product.adminProduct),
      hasDesignApplication: !!(product.designApplication),
      hasImagesStructure: !!(product.images),
      imageCount: 0,
      validImageCount: 0,
      imageUrls: [] as string[],
      issues: [] as string[]
    };

    // Compter les images disponibles
    if (product.adminProduct?.colorVariations) {
      product.adminProduct.colorVariations.forEach((cv: any) => {
        if (cv.images?.length > 0) {
          cv.images.forEach((img: any) => {
            analysis.imageCount++;
            if (img.url && img.url.trim() && img.url !== '') {
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
            if (img.url && img.url.trim() && img.url !== '') {
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

    // Identifier les problèmes
    if (!analysis.hasBasicInfo) {
      analysis.issues.push('❌ Informations de base manquantes (id, name)');
    }

    if (analysis.imageCount === 0) {
      analysis.issues.push('❌ Aucune image trouvée dans la structure');
    } else if (analysis.validImageCount === 0) {
      analysis.issues.push('❌ Images trouvées mais toutes les URLs sont vides');
    } else if (analysis.validImageCount < analysis.imageCount) {
      analysis.issues.push(`⚠️ ${analysis.imageCount - analysis.validImageCount} image(s) avec URL vide`);
    }

    if (!analysis.hasAdminProduct && !analysis.hasColorVariations) {
      analysis.issues.push('❌ Pas de structure d\'images (ni adminProduct ni colorVariations)');
    }

    return analysis;
  };

  const analysis = analyzeProduct();

  const renderOverview = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {analysis.hasBasicInfo ? 
              <CheckCircle className="h-4 w-4 text-green-500" /> : 
              <XCircle className="h-4 w-4 text-red-500" />
            }
            <span className="text-sm">Informations de base</span>
          </div>
          
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
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            {analysis.hasDesignApplication ? 
              <CheckCircle className="h-4 w-4 text-green-500" /> : 
              <XCircle className="h-4 w-4 text-red-500" />
            }
            <span className="text-sm">Application Design</span>
          </div>
          
          <div className="flex items-center gap-2">
            {analysis.hasColorVariations ? 
              <CheckCircle className="h-4 w-4 text-green-500" /> : 
              <XCircle className="h-4 w-4 text-red-500" />
            }
            <span className="text-sm">Variations couleur</span>
          </div>
          
          <div className="flex items-center gap-2">
            {analysis.hasImagesStructure ? 
              <CheckCircle className="h-4 w-4 text-green-500" /> : 
              <XCircle className="h-4 w-4 text-red-500" />
            }
            <span className="text-sm">Structure images</span>
          </div>
        </div>
      </div>

      {analysis.issues.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium mb-2 text-red-600">Problèmes détectés :</h4>
          <div className="space-y-1">
            {analysis.issues.map((issue, index) => (
              <div key={index} className="text-xs text-red-600 bg-red-50 p-2 rounded">
                {issue}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderImages = () => (
    <div className="space-y-4">
      <div className="text-sm">
        <strong>URLs d'images trouvées :</strong>
      </div>
      
      {analysis.imageUrls.length === 0 ? (
        <div className="text-red-600 text-sm">Aucune URL d'image valide trouvée</div>
      ) : (
        <div className="space-y-2">
          {analysis.imageUrls.map((url, index) => (
            <div key={index} className="border rounded p-2">
              <div className="text-xs text-gray-500 mb-1">Image {index + 1}:</div>
              <div className="text-xs break-all font-mono bg-gray-50 p-1 rounded">
                {url}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <img 
                  src={url} 
                  alt={`Test ${index}`}
                  className="w-16 h-16 object-cover rounded border"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
                <div className="text-xs">
                  <Badge variant={url.startsWith('http') ? 'default' : 'secondary'}>
                    {url.startsWith('data:') ? 'Base64' : 
                     url.startsWith('http') ? 'URL' : 'Relatif'}
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderStructure = () => (
    <div className="space-y-4">
      {/* Structure adminProduct */}
      {product.adminProduct && (
        <div className="border rounded p-3">
          <h4 className="font-medium text-sm mb-2">📋 adminProduct</h4>
          <div className="text-xs space-y-1">
            <div>ID: {product.adminProduct.id}</div>
            <div>Name: {product.adminProduct.name}</div>
            <div>Color Variations: {product.adminProduct.colorVariations?.length || 0}</div>
            {product.adminProduct.colorVariations?.map((cv: any, index: number) => (
              <div key={index} className="ml-4 border-l-2 border-gray-200 pl-2">
                <div className="font-medium">{cv.name} ({cv.colorCode})</div>
                <div>Images: {cv.images?.length || 0}</div>
                {cv.images?.map((img: any, imgIndex: number) => (
                  <div key={imgIndex} className="ml-2 text-gray-600">
                    {img.viewType}: {img.url ? '✅' : '❌'}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structure colorVariations */}
      {product.colorVariations && (
        <div className="border rounded p-3">
          <h4 className="font-medium text-sm mb-2">🎨 colorVariations</h4>
          <div className="text-xs space-y-1">
            <div>Count: {product.colorVariations.length}</div>
            {product.colorVariations.map((cv: any, index: number) => (
              <div key={index} className="ml-4 border-l-2 border-gray-200 pl-2">
                <div className="font-medium">{cv.name}</div>
                <div>Images: {cv.images?.length || 0}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Structure images */}
      {product.images && (
        <div className="border rounded p-3">
          <h4 className="font-medium text-sm mb-2">🖼️ images</h4>
          <div className="text-xs space-y-1">
            <div>Primary: {product.images.primaryImageUrl ? '✅' : '❌'}</div>
            <div>Admin References: {product.images.adminReferences?.length || 0}</div>
          </div>
        </div>
      )}

      {/* Design Application */}
      {product.designApplication && (
        <div className="border rounded p-3">
          <h4 className="font-medium text-sm mb-2">🎨 designApplication</h4>
          <div className="text-xs space-y-1">
            <div>Has Design: {product.designApplication.hasDesign ? '✅' : '❌'}</div>
            <div>Design Base64: {product.designApplication.designBase64 ? '✅' : '❌'}</div>
            <div>Positioning: {product.designApplication.positioning || 'N/A'}</div>
            <div>Scale: {product.designApplication.scale || 'N/A'}</div>
          </div>
        </div>
      )}
    </div>
  );

  const renderRaw = () => (
    <div className="space-y-2">
      <div className="text-sm font-medium">Données brutes :</div>
      <pre className="text-xs bg-gray-50 p-3 rounded overflow-auto max-h-96">
        {JSON.stringify(product, null, 2)}
      </pre>
    </div>
  );

  if (!isExpanded) {
    return (
      <div className={`border rounded p-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            <span className="text-sm font-medium">Debug: {product.name}</span>
            <Badge variant={analysis.validImageCount > 0 ? 'default' : 'destructive'}>
              {analysis.validImageCount} images
            </Badge>
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
            <CardTitle className="text-sm">Debug Produit: {product.name}</CardTitle>
            <Badge variant={analysis.validImageCount > 0 ? 'default' : 'destructive'}>
              {analysis.validImageCount}/{analysis.imageCount} images
            </Badge>
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
          {['overview', 'images', 'structure', 'raw'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab(tab as any)}
              className="text-xs"
            >
              {tab === 'overview' && <Search className="h-3 w-3 mr-1" />}
              {tab === 'images' && <ImageIcon className="h-3 w-3 mr-1" />}
              {tab === 'structure' && <Database className="h-3 w-3 mr-1" />}
              {tab === 'raw' && <Palette className="h-3 w-3 mr-1" />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'images' && renderImages()}
        {activeTab === 'structure' && renderStructure()}
        {activeTab === 'raw' && renderRaw()}
      </CardContent>
    </Card>
  );
};

export default ProductDataDebugger; 
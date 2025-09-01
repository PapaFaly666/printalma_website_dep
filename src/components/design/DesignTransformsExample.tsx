import React, { useState, useEffect } from 'react';
import { useDesignTransforms } from '../../services/designTransforms';
import type { DesignTransform } from '../../services/designTransforms';
import { resolveVendorProductId, resolveVendorDesignId } from '../../helpers/vendorIdResolvers';

interface Props {
  product: any;
  design: any;
  vendorProducts?: any[];
  vendorDesigns?: any[];
}

/**
 * 🚀 Exemple d'utilisation du système unifié Design Transforms
 * Suit exactement le guide rapide : 4 appels + résolution automatique des IDs
 */
export const DesignTransformsExample: React.FC<Props> = ({
  product,
  design,
  vendorProducts = [],
  vendorDesigns = []
}) => {
  const [transforms, setTransforms] = useState<DesignTransform | null>(null);
  const [position, setPosition] = useState<DesignTransform | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ Hook simplifié du nouveau système
  const { saveTransforms, loadTransforms, savePosition, loadPosition } = useDesignTransforms(
    vendorProducts,
    vendorDesigns
  );

  // 🔍 Résoudre les IDs automatiquement
  const vendorProductId = resolveVendorProductId(product, vendorProducts);
  const vendorDesignId = resolveVendorDesignId(design, vendorDesigns);

  // 📊 Status pour debug
  const status = {
    hasVendorProductId: !!vendorProductId,
    hasVendorDesignId: !!vendorDesignId,
    hasDesignUrl: !!design?.imageUrl,
    canSaveTransforms: !!vendorProductId && !!design?.imageUrl,
    canSavePosition: !!vendorProductId && !!vendorDesignId
  };

  useEffect(() => {
    loadInitialData();
  }, [vendorProductId, design?.imageUrl]);

  const loadInitialData = async () => {
    if (!status.canSaveTransforms) return;

    setLoading(true);
    setError(null);

    try {
      // 2️⃣ Relire pour vérifier (selon le guide)
      const transformsResult = await loadTransforms(product, design);
      setTransforms(transformsResult.data);

      // 4️⃣ Lire la position isolée (si possible)
      if (status.canSavePosition) {
        const positionResult = await loadPosition(product, design);
        setPosition(positionResult.data);
      }
    } catch (err: any) {
      console.error('❌ Erreur chargement:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveTransforms = async () => {
    if (!status.canSaveTransforms) return;

    const newTransforms: DesignTransform = {
      x: 40, y: 30, scale: 0.8, rotation: 0
    } as DesignTransform;

    setLoading(true);
    try {
      // 1️⃣ Créer / mettre à jour les transforms (selon le guide)
      await saveTransforms(product, design, newTransforms);
      setTransforms(newTransforms);
      
      console.log('✅ Transforms sauvegardées');
    } catch (err: any) {
      console.error('❌ Erreur sauvegarde transforms:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePosition = async () => {
    if (!status.canSavePosition) return;

    const newPosition: DesignTransform = { 
      x: 50, y: 40, scale: 0.9, rotation: 15 
    };

    setLoading(true);
    try {
      // 3️⃣ Isoler uniquement la position (selon le guide)
      await savePosition(product, design, newPosition);
      setPosition(newPosition);
      
      console.log('✅ Position sauvegardée');
    } catch (err: any) {
      console.error('❌ Erreur sauvegarde position:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="design-transforms-example">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold mb-4">
          🚀 Design Transforms Unifié
        </h3>

        {/* Debug Status */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">🔍 Status Debug</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Product ID: <code>{product?.id}</code></div>
            <div>Vendor Product ID: <code>{vendorProductId || 'null'}</code></div>
            <div>Design ID: <code>{design?.id}</code></div>
            <div>Vendor Design ID: <code>{vendorDesignId || 'null'}</code></div>
            <div>Design URL: <code>{design?.imageUrl ? '✅' : '❌'}</code></div>
            <div>Can Save Transforms: <code>{status.canSaveTransforms ? '✅' : '❌'}</code></div>
          </div>
        </div>

        {/* Checklist selon le guide */}
        <div className="mb-6">
          <h4 className="font-medium mb-2">✅ Checklist « ça fonctionne »</h4>
          <div className="space-y-2 text-sm">
            <div className={status.hasVendorProductId ? 'text-green-600' : 'text-red-600'}>
              {status.hasVendorProductId ? '✅' : '❌'} productId = vendorProductId résolu
            </div>
            <div className={status.hasDesignUrl ? 'text-green-600' : 'text-red-600'}>
              {status.hasDesignUrl ? '✅' : '❌'} designUrl = URL exacte Cloudinary
            </div>
            <div className={transforms ? 'text-green-600' : 'text-gray-500'}>
              {transforms ? '✅' : '⏳'} Transforms chargées depuis le backend
            </div>
            <div className={position ? 'text-green-600' : 'text-gray-500'}>
              {position ? '✅' : '⏳'} Position isolée disponible
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={handleSaveTransforms}
            disabled={!status.canSaveTransforms || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            1️⃣ Save Transforms
          </button>
          
          <button
            onClick={loadInitialData}
            disabled={!status.canSaveTransforms || loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            2️⃣ Load Transforms
          </button>
          
          <button
            onClick={handleSavePosition}
            disabled={!status.canSavePosition || loading}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
          >
            3️⃣ Save Position
          </button>
        </div>

        {/* Results */}
        {loading && (
          <div className="text-blue-600 mb-4">⏳ Chargement...</div>
        )}

        {error && (
          <div className="text-red-600 mb-4 p-3 bg-red-50 rounded">
            ❌ Erreur: {error}
          </div>
        )}

        {transforms && (
          <div className="mb-4">
            <h5 className="font-medium mb-2">📊 Transforms Actuelles</h5>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(transforms, null, 2)}
            </pre>
          </div>
        )}

        {position && (
          <div className="mb-4">
            <h5 className="font-medium mb-2">📍 Position Isolée</h5>
            <pre className="bg-gray-100 p-3 rounded text-sm overflow-x-auto">
              {JSON.stringify(position, null, 2)}
            </pre>
          </div>
        )}

        {/* Guide Debug */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
          <h5 className="font-medium mb-2">💡 Debug Express</h5>
          <div className="text-sm space-y-1">
            {!transforms && <div>• <code>data:null</code> → Normal si aucun POST encore fait</div>}
            {error?.includes('403') && <div>• <code>403</code> → Vérifiez vendorProductId et auth_token</div>}
            {error?.includes('404') && <div>• <code>404</code> → Vérifiez designUrl encodée</div>}
            {!status.hasVendorProductId && <div>• Résolvez vendorProductId avec resolveVendorProductId()</div>}
            {!status.hasDesignUrl && <div>• Vérifiez que design.imageUrl est défini</div>}
          </div>
        </div>
      </div>
    </div>
  );
}; 
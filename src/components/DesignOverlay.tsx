import React from 'react';
import { useDesignPosition } from '@/hooks/useDesignPosition';

interface DesignOverlayProps {
  vpId: number;
  designId: number;
  adminImg: string; // url image admin
  designImg: string; // url design
  className?: string;
}

/**
 * Composant overlay V2 pour afficher un design positionné sur une image admin.
 * Utilise l'API `/position/direct` pour récupérer la position sauvegardée.
 */
export function DesignOverlay({ vpId, designId, adminImg, designImg, className }: DesignOverlayProps) {
  const { position, isLoading: loading } = useDesignPosition(vpId, designId);

  if (loading) {
    return (
      <div className={className} style={{ position: 'relative', width: '100%' }}>
        <img src={adminImg} style={{ width: '100%', display: 'block' }} alt="Product" />
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontSize: '12px'
        }}>
          Chargement position...
        </div>
      </div>
    );
  }

  return (
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      <img src={adminImg} style={{ width: '100%', display: 'block' }} alt="Product" />
      
      {position && (
        <img
          src={designImg}
          alt="Design"
          style={{
            position: 'absolute',
            left: position.x,
            top: position.y,
            transform: `translate(-50%, -50%) scale(${position.scale}) rotate(${position.rotation}deg)`,
            transformOrigin: 'center',
            pointerEvents: 'none',
            width: '200px', // taille de référence ; ajustez selon vos besoins
            maxWidth: 'none', // éviter les contraintes CSS qui pourraient redimensionner
            zIndex: 10
          }}
        />
      )}
    </div>
  );
} 
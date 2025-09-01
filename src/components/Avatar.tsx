import React from 'react';
import { useAuth } from '../contexts/AuthContext';

// Utilisez une image générique stockée dans le dossier public.
// Vous pouvez en placer une nommée "placeholder-avatar.png" à la racine de public/
const DEFAULT_AVATAR_URL = '/placeholder-avatar.png';

interface AvatarProps {
  /** Taille en pixels (largeur = hauteur) */
  size?: number;
  /** Classes utilitaires supplémentaires */
  className?: string;
}

/**
 * Avatar universel de l'application.
 * — Récupère automatiquement la photo de profil de l'utilisateur connecté via le AuthContext.
 * — Fallback sur une image générique si aucune photo n'est disponible.
 */
export const Avatar: React.FC<AvatarProps> = ({ size = 40, className = '' }) => {
  const { user } = useAuth();

  // L'URL de la photo : profil ou fallback
  const src = user?.profile_photo_url || DEFAULT_AVATAR_URL;

  return (
    <img
      src={src}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      alt={user?.firstName ?? 'avatar'}
    />
  );
};

export default Avatar; 
import { LucideIcon } from 'lucide-react';

/**
 * Type représentant un élément de navigation
 */
export interface NavItem {
  /** Identifiant unique de l'élément */
  id: string;
  /** Libellé affiché */
  label: string;
  /** Icône (composant Lucide) */
  icon: LucideIcon;
  /** Chemin de navigation */
  path: string;
  /** Permission requise pour voir cet élément (optionnel, si vide = visible pour tous) */
  permission?: string;
  /** Badge à afficher (optionnel) */
  badge?: string | (() => string);
  /** Couleur du badge */
  badgeColor?: 'blue' | 'red' | 'yellow' | 'green' | 'purple';
  /** Couleur du texte (optionnel) */
  textColor?: string;
  /** Clé pour récupérer le count dynamique depuis useSidebarCounts */
  countKey?: 'mockupsCount' | 'designValidationCount' | 'paymentRequestsCount';
}

/**
 * Type représentant un groupe de navigation
 */
export interface NavGroup {
  /** Identifiant unique du groupe */
  id: string;
  /** Titre du groupe */
  title: string;
  /** Liste des éléments du groupe */
  items: NavItem[];
  /** Permission requise pour voir ce groupe (optionnel) */
  permission?: string;
  /** Liste de permissions (au moins une doit être vraie pour afficher le groupe) */
  permissions?: string[];
  /** Rôles autorisés à voir ce groupe */
  roles?: ('ADMIN' | 'SUPERADMIN' | 'VENDEUR')[];
}

/**
 * Configuration complète de la navigation
 */
export interface NavigationConfig {
  /** Groupes pour les admins */
  admin: NavGroup[];
  /** Groupes pour les vendeurs */
  vendor: NavGroup[];
  /** Éléments du footer (communs à tous) */
  footer: NavItem[];
}

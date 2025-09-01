/**
 * Utilitaires de formatage pour l'affichage des données
 */

/**
 * Formate un montant en devise (EUR par défaut)
 */
export function formatCurrency(amount: number, currency: string = 'EUR'): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0,00 €';
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    // Fallback si la devise n'est pas supportée
    return `${amount.toFixed(2)} ${currency}`;
  }
}

/**
 * Formate une date en format français
 */
export function formatDate(date: Date | string, options?: Intl.DateTimeFormatOptions): string {
  if (!date) return 'Date inconnue';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }

    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    };

    return new Intl.DateTimeFormat('fr-FR', options || defaultOptions).format(dateObj);
  } catch (error) {
    return 'Date invalide';
  }
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(date: Date | string): string {
  if (!date) return 'Date inconnue';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }

    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  } catch (error) {
    return 'Date invalide';
  }
}

/**
 * Formate une date relative (ex: "il y a 2 jours")
 */
export function formatRelativeDate(date: Date | string): string {
  if (!date) return 'Date inconnue';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isNaN(dateObj.getTime())) {
      return 'Date invalide';
    }

    const now = new Date();
    const diffTime = Math.abs(now.getTime() - dateObj.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Aujourd\'hui';
    } else if (diffDays === 1) {
      return 'Hier';
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Il y a ${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Il y a ${years} an${years > 1 ? 's' : ''}`;
    }
  } catch (error) {
    return 'Date invalide';
  }
}

/**
 * Formate un nombre avec des séparateurs de milliers
 */
export function formatNumber(num: number): string {
  if (typeof num !== 'number' || isNaN(num)) {
    return '0';
  }

  try {
    return new Intl.NumberFormat('fr-FR').format(num);
  } catch (error) {
    return num.toString();
  }
}

/**
 * Formate un pourcentage
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0%';
  }

  try {
    return new Intl.NumberFormat('fr-FR', {
      style: 'percent',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value / 100);
  } catch (error) {
    return `${value.toFixed(decimals)}%`;
  }
}

/**
 * Formate une taille de fichier
 */
export function formatFileSize(bytes: number): string {
  if (typeof bytes !== 'number' || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }

  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  if (i === 0) return `${bytes} ${sizes[i]}`;
  
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Formate une durée en secondes vers un format lisible
 */
export function formatDuration(seconds: number): string {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds < 0) {
    return '0s';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
} 
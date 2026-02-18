/**
 * Utilitaires pour gérer les SVG et optimiser leur affichage
 * Basé sur le guide d'affichage SVG du contenu page d'accueil
 */

export const SvgUtils = {
  /**
   * Détecte si une URL est un SVG
   */
  isSvg(url: string): boolean {
    if (!url) return false;
    return url.toLowerCase().includes('.svg') ||
           url.toLowerCase().includes('svg');
  },

  /**
   * Détecte si un fichier est un SVG (basé sur le nom ou le type MIME)
   */
  isSvgFile(file: File): boolean {
    const isSvgByName = file.name.toLowerCase().endsWith('.svg');
    const isSvgByType = file.type === 'image/svg+xml' ||
                       file.type === 'text/xml' ||
                       file.type === 'text/plain';
    return isSvgByName || isSvgByType;
  },

  /**
   * Détermine le bon object-fit selon le type d'image
   */
  getObjectFit(url: string): 'contain' | 'cover' {
    return this.isSvg(url) ? 'contain' : 'cover';
  },

  /**
   * Retourne les styles appropriés pour l'image
   */
  getImageStyles(url: string, customStyles: React.CSSProperties = {}): React.CSSProperties {
    return {
      width: '100%',
      height: '100%',
      objectFit: this.getObjectFit(url),
      objectPosition: 'center',
      ...customStyles,
    };
  },

  /**
   * Valide si l'URL Cloudinary est correctement formatée
   */
  isValidCloudinaryUrl(url: string): boolean {
    if (!url) return false;
    return url.includes('cloudinary.com') && url.length > 0;
  },

  /**
   * Retourne les classes CSS appropriées selon le type d'image
   */
  getImageClasses(url: string, baseClass: string = ''): string {
    const isSvgImage = this.isSvg(url);
    return `${baseClass} ${isSvgImage ? 'svg-image' : 'raster-image'}`.trim();
  },
};

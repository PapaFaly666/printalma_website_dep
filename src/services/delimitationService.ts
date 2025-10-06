// Service pour les délimitations selon la documentation backend
const API_BASE = 'https://printalma-back-dep.onrender.com';

// Fonction utilitaire pour les appels API sécurisés
async function safeApiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include', // Important pour les cookies HTTPS
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || `Erreur HTTP ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`❌ [API Error] [${options.method || 'GET'} ${endpoint}]:`, error);
    showErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    throw error;
  }
}

// Fonction pour afficher les erreurs à l'utilisateur
function showErrorMessage(message: string) {
  if (typeof window !== 'undefined' && (window as any).toast) {
    (window as any).toast.error(message);
  } else {
    console.error('🚨 Erreur API:', message);
  }
}

// Interface pour les délimitations selon la documentation
export interface Delimitation {
  id?: number;
  x: number;      // 0-100%
  y: number;      // 0-100%
  width: number;  // 0.1-100%
  height: number; // 0.1-100%
  name?: string;
  coordinateType?: 'PERCENTAGE' | 'PIXEL';
  rotation?: number;
  referenceWidth?: number;
  referenceHeight?: number;
}

export interface CreateDelimitationPayload {
  productImageId: number;
  delimitation: {
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
    coordinateType?: 'PERCENTAGE' | 'PIXEL';
    referenceWidth: number;
    referenceHeight: number;
  };
}

interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class DelimitationService {
  // RÉCUPÉRER les délimitations d'une image
  static async getImageDelimitations(imageId: number): Promise<ServiceResponse<Delimitation[]>> {
    try {
      console.log(`🔄 [DelimitationService] Récupération des délimitations pour l'image ${imageId}...`);
      const responseData = await safeApiCall(`/delimitations/image/${imageId}`);
      if (Array.isArray(responseData)) {
        console.log(`✅ [DelimitationService] ${responseData.length} délimitations récupérées`);
        return {
          success: true,
          data: responseData
        };
      } else if (responseData.success && responseData.data) {
        console.log(`✅ [DelimitationService] ${responseData.data.length} délimitations récupérées`);
        return {
          success: true,
          data: responseData.data
        };
      } else {
        throw new Error('Format de réponse invalide');
      }
    } catch (error) {
      console.error(`❌ [DelimitationService] Erreur récupération délimitations image ${imageId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // CRÉER une délimitation
  static async createDelimitation(payload: CreateDelimitationPayload): Promise<ServiceResponse<Delimitation>> {
    try {
      console.log('🔄 [DelimitationService] Création de la délimitation...', payload);

      if (payload.delimitation.coordinateType === 'PERCENTAGE') {
        const { x, y, width, height } = payload.delimitation;
        if (x < 0 || x > 100 || y < 0 || y > 100 || width < 0.1 || width > 100 || height < 0.1 || height > 100) {
          throw new Error('Les coordonnées en % doivent être entre 0-100% et les dimensions entre 0.1-100%');
        }

        if (x + width > 100 || y + height > 100) {
          throw new Error('La délimitation ne doit pas déborder de l\'image');
        }
      }

      const response = await safeApiCall('/delimitations', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      if (response.success && response.data) {
        console.log('✅ [DelimitationService] Délimitation créée avec succès');
        return {
          success: true,
          data: response.data,
          message: 'Délimitation créée avec succès'
        };
      } else {
        throw new Error('Erreur lors de la création de la délimitation');
      }
    } catch (error) {
      console.error('❌ [DelimitationService] Erreur création délimitation:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // METTRE À JOUR une délimitation
  static async updateDelimitation(id: number, data: Partial<Delimitation>): Promise<ServiceResponse<Delimitation>> {
    try {
      console.log(`🔄 [DelimitationService] Mise à jour de la délimitation ${id}...`);

      if (data.x !== undefined || data.y !== undefined || data.width !== undefined || data.height !== undefined) {
        const { x = 0, y = 0, width = 0, height = 0 } = data;
        if (x < 0 || x > 100 || y < 0 || y > 100 || width < 0.1 || width > 100 || height < 0.1 || height > 100) {
          throw new Error('Les coordonnées doivent être entre 0-100% et les dimensions entre 0.1-100%');
        }

        if (x + width > 100 || y + height > 100) {
          throw new Error('La délimitation ne doit pas déborder de l\'image');
        }
      }

      const response = await safeApiCall(`/delimitations/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });

      if (response.success && response.data) {
        console.log(`✅ [DelimitationService] Délimitation ${id} mise à jour`);
        return {
          success: true,
          data: response.data,
          message: 'Délimitation mise à jour avec succès'
        };
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error(`❌ [DelimitationService] Erreur mise à jour délimitation ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // SUPPRIMER une délimitation
  static async deleteDelimitation(id: number): Promise<ServiceResponse<void>> {
    try {
      console.log(`🔄 [DelimitationService] Suppression de la délimitation ${id}...`);
      const response = await safeApiCall(`/delimitations/${id}`, {
        method: 'DELETE'
      });

      if (response.success) {
        console.log(`✅ [DelimitationService] Délimitation ${id} supprimée`);
        return {
          success: true,
          message: response.message || 'Délimitation supprimée avec succès'
        };
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error(`❌ [DelimitationService] Erreur suppression délimitation ${id}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erreur inconnue'
      };
    }
  }

  // AFFICHER une délimitation sur une image
  static displayDelimitation(delimitation: Delimitation, imageElement: HTMLElement): HTMLElement {
    const { x, y, width, height, name, id } = delimitation;

    const parentElement = imageElement.parentElement;
    if (!parentElement) {
      console.error('Impossible de trouver le conteneur parent');
      return document.createElement('div');
    }

    if (getComputedStyle(parentElement).position === 'static') {
      parentElement.style.position = 'relative';
    }

    const container = parentElement;
    const image = imageElement as HTMLImageElement;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width;
    const containerHeight = containerRect.height;

    const imageNaturalWidth = image.naturalWidth || 1;
    const imageNaturalHeight = image.naturalHeight || 1;

    const imageRatio = imageNaturalWidth / imageNaturalHeight;
    const containerRatio = containerWidth / containerHeight;

    let displayedImageWidth, displayedImageHeight, offsetX, offsetY;

    if (imageRatio > containerRatio) {
      displayedImageWidth = containerWidth;
      displayedImageHeight = containerWidth / imageRatio;
      offsetX = 0;
      offsetY = (containerHeight - displayedImageHeight) / 2;
    } else {
      displayedImageHeight = containerHeight;
      displayedImageWidth = containerHeight * imageRatio;
      offsetX = (containerWidth - displayedImageWidth) / 2;
      offsetY = 0;
    }

    const left = offsetX + (x / 100) * displayedImageWidth;
    const top = offsetY + (y / 100) * displayedImageHeight;
    const delimitationWidth = (width / 100) * displayedImageWidth;
    const delimitationHeight = (height / 100) * displayedImageHeight;

    const delimitationDiv = document.createElement('div');
    delimitationDiv.className = 'delimitation-zone';
    if (id) delimitationDiv.dataset.id = id.toString();

    Object.assign(delimitationDiv.style, {
      position: 'absolute',
      left: `${left}px`,
      top: `${top}px`,
      width: `${delimitationWidth}px`,
      height: `${delimitationHeight}px`,
      border: '2px dashed #007bff',
      backgroundColor: 'rgba(0,123,255,0.1)',
      cursor: 'pointer',
      zIndex: '10',
      boxSizing: 'border-box',
      pointerEvents: 'auto',
      minWidth: '2px',
      minHeight: '2px'
    });

    if (name) {
      delimitationDiv.title = name;
      const label = document.createElement('div');
      label.textContent = name.length > 10 ? name.substring(0, 10) + '...' : name;
      label.style.cssText = `
        position: absolute;
        top: -22px;
        left: 0;
        background: #007bff;
        color: white;
        padding: 2px 6px;
        font-size: 11px;
        border-radius: 3px;
        white-space: nowrap;
        z-index: 20;
        max-width: ${delimitationWidth}px;
        overflow: hidden;
        text-overflow: ellipsis;
        pointer-events: none;
      `;
      delimitationDiv.appendChild(label);
    }

    parentElement.appendChild(delimitationDiv);
    return delimitationDiv;
  }

  // FONCTION POUR DESSINER UNE DÉLIMITATION (version originale)
  static enableDelimitationDrawing(
    imageContainer: HTMLElement,
    imageId: number,
    onDelimitationCreated?: (delimitation: Delimitation) => void
  ): () => void {
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentDelimitation: HTMLElement | null = null;

    if (getComputedStyle(imageContainer).position === 'static') {
      imageContainer.style.position = 'relative';
    }

    const handleMouseDown = (e: MouseEvent) => {
      const img = imageContainer.querySelector('img') as HTMLImageElement;
      if (!img || e.target !== img) return;

      e.preventDefault();
      isDrawing = true;

      const imgRect = img.getBoundingClientRect();
      const relativeX = e.clientX - imgRect.left;
      const relativeY = e.clientY - imgRect.top;

      startX = (relativeX / imgRect.width) * 100;
      startY = (relativeY / imgRect.height) * 100;

      const containerRect = imageContainer.getBoundingClientRect();
      const absoluteX = e.clientX - containerRect.left;
      const absoluteY = e.clientY - containerRect.top;

      currentDelimitation = document.createElement('div');
      currentDelimitation.className = 'delimitation-zone-temp';
      Object.assign(currentDelimitation.style, {
        position: 'absolute',
        left: `${absoluteX}px`,
        top: `${absoluteY}px`,
        width: '0px',
        height: '0px',
        border: '2px dashed #ff6b35',
        backgroundColor: 'rgba(255,107,53,0.1)',
        pointerEvents: 'none',
        zIndex: '20',
        boxSizing: 'border-box'
      });

      imageContainer.appendChild(currentDelimitation);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !currentDelimitation) return;

      const img = imageContainer.querySelector('img') as HTMLImageElement;
      if (!img) return;

      const imgRect = img.getBoundingClientRect();
      const containerRect = imageContainer.getBoundingClientRect();

      const relativeX = e.clientX - imgRect.left;
      const relativeY = e.clientY - imgRect.top;
      const clampedX = Math.max(0, Math.min(imgRect.width, relativeX));
      const clampedY = Math.max(0, Math.min(imgRect.height, relativeY));
      const currentX = (clampedX / imgRect.width) * 100;
      const currentY = (clampedY / imgRect.height) * 100;

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      const pixelX = imgRect.left - containerRect.left + (x / 100) * imgRect.width;
      const pixelY = imgRect.top - containerRect.top + (y / 100) * imgRect.height;
      const pixelWidth = (width / 100) * imgRect.width;
      const pixelHeight = (height / 100) * imgRect.height;

      Object.assign(currentDelimitation.style, {
        left: `${pixelX}px`,
        top: `${pixelY}px`,
        width: `${pixelWidth}px`,
        height: `${pixelHeight}px`
      });
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!isDrawing || !currentDelimitation) return;

      isDrawing = false;
      const img = imageContainer.querySelector('img') as HTMLImageElement;
      if (!img) return;

      const imgRect = img.getBoundingClientRect();
      const relativeX = e.clientX - imgRect.left;
      const relativeY = e.clientY - imgRect.top;
      const clampedX = Math.max(0, Math.min(imgRect.width, relativeX));
      const clampedY = Math.max(0, Math.min(imgRect.height, relativeY));
      const currentX = (clampedX / imgRect.width) * 100;
      const currentY = (clampedY / imgRect.height) * 100;

      const x = Math.min(startX, currentX);
      const y = Math.min(startY, currentY);
      const width = Math.abs(currentX - startX);
      const height = Math.abs(currentY - startY);

      currentDelimitation.remove();
      currentDelimitation = null;

      if (width > 1 && height > 1) {
        const delimitationName = prompt('Nom de la zone (ORIGINAL):') || 'Zone ORIGINAL';

        try {
          const delimitationData = {
            x: Math.max(0, Math.min(100 - width, x)),
            y: Math.max(0, Math.min(100 - height, y)),
            width: Math.min(width, 100),
            height: Math.min(height, 100),
            name: delimitationName,
            referenceWidth: img.naturalWidth,
            referenceHeight: img.naturalHeight,
          };

          const result = await DelimitationService.createDelimitation({
            productImageId: imageId,
            delimitation: delimitationData
          });

          if (result.success && result.data && onDelimitationCreated) {
            onDelimitationCreated(result.data);
            DelimitationService.displayDelimitation(result.data, img);
          }
        } catch (error) {
          console.error('🔬 ORIGINAL - Erreur:', error);
        }
      }
    };

    imageContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      imageContainer.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      const tempDelimitations = imageContainer.querySelectorAll('.delimitation-zone-temp');
      tempDelimitations.forEach(elem => elem.remove());
    };
  }

  // FONCTION POUR DESSINER UNE DÉLIMITATION (version robuste)
  static enableDelimitationDrawingRobust(
    imageContainer: HTMLElement,
    imageId: number,
    onDelimitationCreated?: (delimitation: Delimitation) => void
  ): () => void {
    let isDrawing = false;
    let startX = 0;
    let startY = 0;
    let currentDelimitation: HTMLElement | null = null;

    if (getComputedStyle(imageContainer).position === 'static') {
      imageContainer.style.position = 'relative';
    }

    const handleMouseDown = (e: MouseEvent) => {
      const img = imageContainer.querySelector('img') as HTMLImageElement;
      if (!img || e.target !== img) return;

      e.preventDefault();
      isDrawing = true;

      const imgRect = img.getBoundingClientRect();
      const displayX = e.clientX - imgRect.left;
      const displayY = e.clientY - imgRect.top;
      const naturalX = (displayX / imgRect.width) * img.naturalWidth;
      const naturalY = (displayY / imgRect.height) * img.naturalHeight;

      startX = naturalX;
      startY = naturalY;

      const containerRect = imageContainer.getBoundingClientRect();
      currentDelimitation = document.createElement('div');
      currentDelimitation.className = 'delimitation-zone-temp';
      Object.assign(currentDelimitation.style, {
        position: 'absolute',
        left: `${e.clientX - containerRect.left}px`,
        top: `${e.clientY - containerRect.top}px`,
        width: '0px',
        height: '0px',
        border: '3px solid #00ff00',
        backgroundColor: 'rgba(0,255,0,0.2)',
        pointerEvents: 'none',
        zIndex: '30',
        boxSizing: 'border-box'
      });

      imageContainer.appendChild(currentDelimitation);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDrawing || !currentDelimitation) return;

      const img = imageContainer.querySelector('img') as HTMLImageElement;
      if (!img) return;

      const imgRect = img.getBoundingClientRect();
      const containerRect = imageContainer.getBoundingClientRect();

      const displayX = e.clientX - imgRect.left;
      const displayY = e.clientY - imgRect.top;
      const naturalX = (displayX / imgRect.width) * img.naturalWidth;
      const naturalY = (displayY / imgRect.height) * img.naturalHeight;

      const natX = Math.min(startX, naturalX);
      const natY = Math.min(startY, naturalY);
      const natWidth = Math.abs(naturalX - startX);
      const natHeight = Math.abs(naturalY - startY);

      const dispX = (natX / img.naturalWidth) * imgRect.width;
      const dispY = (natY / img.naturalHeight) * imgRect.height;
      const dispWidth = (natWidth / img.naturalWidth) * imgRect.width;
      const dispHeight = (natHeight / img.naturalHeight) * imgRect.height;

      const containerX = imgRect.left - containerRect.left + dispX;
      const containerY = imgRect.top - containerRect.top + dispY;

      Object.assign(currentDelimitation.style, {
        left: `${containerX}px`,
        top: `${containerY}px`,
        width: `${dispWidth}px`,
        height: `${dispHeight}px`
      });
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!isDrawing || !currentDelimitation) return;

      isDrawing = false;
      const img = imageContainer.querySelector('img') as HTMLImageElement;
      if (!img) return;

      const imgRect = img.getBoundingClientRect();
      const displayX = e.clientX - imgRect.left;
      const displayY = e.clientY - imgRect.top;
      const naturalX = (displayX / imgRect.width) * img.naturalWidth;
      const naturalY = (displayY / imgRect.height) * img.naturalHeight;

      const natX = Math.min(startX, naturalX);
      const natY = Math.min(startY, naturalY);
      const natWidth = Math.abs(naturalX - startX);
      const natHeight = Math.abs(naturalY - startY);

      const percentX = (natX / img.naturalWidth) * 100;
      const percentY = (natY / img.naturalHeight) * 100;
      const percentWidth = (natWidth / img.naturalWidth) * 100;
      const percentHeight = (natHeight / img.naturalHeight) * 100;

      currentDelimitation.remove();
      currentDelimitation = null;

      if (percentWidth > 1 && percentHeight > 1) {
        const delimitationName = prompt('Nom de la zone (ROBUST):') || 'Zone ROBUST';

        try {
          const delimitationData = {
            x: Math.max(0, Math.min(100 - percentWidth, percentX)),
            y: Math.max(0, Math.min(100 - percentHeight, percentY)),
            width: Math.min(percentWidth, 100),
            height: Math.min(percentHeight, 100),
            name: delimitationName,
            referenceWidth: img.naturalWidth,
            referenceHeight: img.naturalHeight,
          };

          const result = await DelimitationService.createDelimitation({
            productImageId: imageId,
            delimitation: delimitationData
          });

          if (result.success && result.data && onDelimitationCreated) {
            onDelimitationCreated(result.data);
            DelimitationService.displayDelimitation(result.data, img);
          }
        } catch (error) {
          console.error('🛡️ ROBUST - Erreur:', error);
        }
      }
    };

    imageContainer.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      imageContainer.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      const tempDelimitations = imageContainer.querySelectorAll('.delimitation-zone-temp');
      tempDelimitations.forEach(elem => elem.remove());
    };
  }

  // Actualiser l'affichage des délimitations
  static refreshDelimitationsDisplay(imageElement: HTMLElement, delimitations: Delimitation[]) {
    const container = imageElement.parentElement;
    if (!container) return;

    const oldDelimitations = container.querySelectorAll('.delimitation-zone');
    oldDelimitations.forEach(elem => elem.remove());

    delimitations.forEach(delimitation => {
      DelimitationService.displayDelimitation(delimitation, imageElement);
    });
  }

  // Gestion des erreurs spécifiques
  static handleApiError(error: Error): string {
    const errorMessage = error.message;

    if (errorMessage.includes('coordonnées')) {
      return 'Coordonnées invalides. Vérifiez que la délimitation reste dans les limites de l\'image.';
    } else if (errorMessage.includes('400')) {
      return 'Données invalides. Vérifiez les paramètres de la délimitation.';
    } else if (errorMessage.includes('401')) {
      return 'Session expirée. Veuillez vous reconnecter.';
    } else if (errorMessage.includes('404')) {
      return 'Image ou délimitation non trouvée.';
    } else if (errorMessage.includes('500')) {
      return 'Erreur serveur. Veuillez réessayer plus tard.';
    }

    return errorMessage || 'Une erreur est survenue lors de la gestion de la délimitation';
  }

  // Observer les changements de taille d'image
  static observeImageResize(imageElement: HTMLImageElement, delimitations: Delimitation[]) {
    if (!window.ResizeObserver) {
      console.warn('ResizeObserver non supporté, les délimitations ne s\'ajusteront pas automatiquement');
      return () => {};
    }

    const container = imageElement.parentElement;
    if (!container) {
      return () => {};
    }

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(() => {
        DelimitationService.refreshDelimitationsDisplay(imageElement, delimitations);
      }, 10);
    });

    resizeObserver.observe(container);

    const handleWindowResize = () => {
      setTimeout(() => {
        DelimitationService.refreshDelimitationsDisplay(imageElement, delimitations);
      }, 10);
    };

    window.addEventListener('resize', handleWindowResize);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', handleWindowResize);
    };
  }
}

import React, { useState, useEffect } from 'react';
import { useColorUpload } from '../hooks/useColorUpload';
import '../styles/SmartColorUploader.css';

export const SmartColorImageUploader = ({ product, onImageUploaded }) => {
  const { uploadColorImage, uploading, error, clearError } = useColorUpload(product.id);
  const [uploadingColor, setUploadingColor] = useState(null);

  const handleImageUpload = async (colorVariation, event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploadingColor(colorVariation);
    clearError();

    try {
      const result = await uploadColorImage(colorVariation, file);
      
      if (onImageUploaded) {
        onImageUploaded(result.image, colorVariation);
      }
      
      console.log('✅ Upload réussi pour:', colorVariation);
    } catch (error) {
      console.error('❌ Erreur upload:', error);
    } finally {
      setUploadingColor(null);
    }
  };

  const renderColorSection = (colorVariation, index) => {
    const isUploading = uploadingColor === colorVariation;
    const hasImages = colorVariation.images && colorVariation.images.length > 0;
    
    return (
      <div key={colorVariation.id || `temp-${index}`} className="color-section">
        <div className="color-header">
          <h3>
            {colorVariation.name} 
            {colorVariation.id ? `(ID: ${colorVariation.id})` : '(Nouvelle)'}
          </h3>
          <div 
            className="color-preview" 
            style={{ backgroundColor: colorVariation.colorCode }}
          />
        </div>
        
        {/* Images existantes */}
        {hasImages && (
          <div className="existing-images">
            {colorVariation.images.map(image => (
              <img 
                key={image.id} 
                src={image.url} 
                alt={colorVariation.name}
                className="existing-image"
              />
            ))}
          </div>
        )}

        {/* Upload de nouvelle image */}
        <div className="upload-section">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(event) => handleImageUpload(colorVariation, event)}
            disabled={isUploading}
            id={`color-upload-${colorVariation.id || index}`}
            className="file-input"
          />
          <label 
            htmlFor={`color-upload-${colorVariation.id || index}`}
            className={`upload-label ${isUploading ? 'uploading' : ''}`}
          >
            {isUploading ? 'Upload en cours...' : 'Ajouter une image'}
          </label>
        </div>
      </div>
    );
  };

  return (
    <div className="smart-color-uploader">
      <div className="uploader-header">
        <h2>Images par Couleur</h2>
        <p>Ajoutez des images pour chaque variation de couleur</p>
      </div>

      <div className="color-sections">
        {product.colorVariations.map((colorVariation, index) => 
          renderColorSection(colorVariation, index)
        )}
      </div>

      {error && (
        <div className="error-message">
          <h4>❌ Erreur d'upload</h4>
          <p>{error}</p>
          <button onClick={clearError} className="error-close-btn">
            Fermer
          </button>
        </div>
      )}

      {uploading && (
        <div className="upload-progress">
          <div className="progress-spinner"></div>
          <p>Upload en cours...</p>
        </div>
      )}
    </div>
  );
}; 
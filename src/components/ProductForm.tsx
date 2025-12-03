// URL de base de l'API - Ajustez selon votre environnement
const API_BASE_URL = 'http://localhost:3000';

// Fonction de soumission du formulaire
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  console.log("Soumission du formulaire en cours...");

  try {
    // 1. Préparer les données du produit
    const productData = {
      name: (document.querySelector('input[name="name"]') as HTMLInputElement)?.value || '',
      description: (document.querySelector('textarea[name="description"]') as HTMLTextAreaElement)?.value || '',
      price: parseInt((document.querySelector('input[name="price"]') as HTMLInputElement)?.value || '0'),
      stock: parseInt((document.querySelector('input[name="stock"]') as HTMLInputElement)?.value || '0'),
      status: 'DRAFT',
      categoryId: parseInt((document.querySelector('select[name="categoryId"]') as HTMLSelectElement)?.value || '1'),
      sizeIds: [1, 2],
      colorIds: [1]
    };
    
    // 2. Créer FormData avec productData comme JSON string
    const formData = new FormData();
    
    // 🔑 CORRECTION : Envoyer productData comme JSON string
    formData.append('productData', JSON.stringify(productData));
    
    // 3. CRUCIAL: Récupérer directement le design
    const designFile = document.querySelector('input[type="file"][accept="image/*"]');
    let hasDesign = false;
    let useWithDesignEndpoint = false;
    
    // Si nous avons un fichier d'image
    if (designFile instanceof HTMLInputElement && designFile.files && designFile.files.length > 0) {
      const file = designFile.files[0];
      console.log("🔍 Image de design trouvée:", file.name);
      
      // Créer un objet design personnalisé
      const customDesign = {
        name: file.name.split('.')[0] || 'Design personnalisé',
        description: `Design personnalisé créé à partir de ${file.name}`
      };
      
      // Ajouter au FormData
      formData.append('customDesign', JSON.stringify(customDesign));
      formData.append('designImage', file);
      
      hasDesign = true;
      useWithDesignEndpoint = true;
      
      console.log("✅ Design personnalisé configuré:", customDesign);
    } else {
      console.warn("⚠️ Aucune image de design trouvée. Le backend retournera une erreur.");
    }
    
    // 4. Déterminer l'URL de l'API
    const apiUrl = useWithDesignEndpoint 
      ? `${API_BASE_URL}/products/with-design` 
      : `${API_BASE_URL}/products`;
    
    console.log(`Envoi vers ${apiUrl}`);
    
    // Debug - Afficher ce qui est envoyé
    console.log('🔍 Debug - productData:', productData);
    console.log('🔍 Debug - FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
    }
    
    // Vérification manuelle avant envoi
    if (!hasDesign) {
      console.warn("⚠️ ATTENTION: Aucun design n'a été fourni. Le backend s'attend à un design.");
      if (!confirm("Aucun design détecté. Voulez-vous quand même envoyer le formulaire? Le produit pourrait ne pas être créé correctement.")) {
        console.log("Soumission annulée par l'utilisateur");
        return;
      }
    }
    
    // 5. Envoyer la requête
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        // ⚠️ NE PAS ajouter Content-Type, il sera automatiquement défini
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur API: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("✅ Produit créé avec succès:", data);
    
    // 6. Vérifier si le design a été inclus dans la réponse
    if (data.design) {
      console.log("✅ Design inclus dans la réponse:", data.design);
      alert("Produit créé avec succès avec son design!");
    } else {
      console.warn("⚠️ Design null dans la réponse malgré l'envoi.");
      if (hasDesign) {
        alert("Produit créé, mais le design n'a pas été attaché correctement. Veuillez vérifier les logs.");
      } else {
        alert("Produit créé avec succès!");
      }
    }
    
    // Réinitialiser le formulaire ou rediriger
    // window.location.href = '/products';
    
  } catch (error: unknown) {
    console.error("❌ Erreur lors de la soumission:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    alert(`Erreur lors de la soumission du produit: ${errorMessage}`);
  }
};

// Fonction de test pour uploader directement un design
const testDirectUpload = async () => {
  try {
    // Récupérer directement le fichier depuis l'input
    const designFileInput = document.querySelector('input[type="file"][accept="image/*"]');
    if (!(designFileInput instanceof HTMLInputElement) || !designFileInput.files || !designFileInput.files.length) {
      alert("Sélectionnez d'abord une image de design!");
      return;
    }
    
    const designFile = designFileInput.files[0];
    
    // Préparer les données du produit
    const productData = {
      name: 'Produit Test Direct',
      description: 'Test direct upload design',
      price: 12000,
      stock: 100,
      status: 'DRAFT',
      categoryId: 1,
      sizeIds: [1, 2],
      colorIds: [1]
    };
    
    // Préparer un FormData avec productData comme JSON string
    const formData = new FormData();
    
    // 🔑 CORRECTION : Envoyer productData comme JSON string
    formData.append('productData', JSON.stringify(productData));
    
    // Ajouter le design
    const customDesign = {
      name: designFile.name.split('.')[0] || 'Design Test Direct',
      description: 'Design uploader par méthode directe'
    };
    
    // IMPORTANT: Ces deux champs sont essentiels!
    formData.append('customDesign', JSON.stringify(customDesign));
    formData.append('designImage', designFile);
    
    // Debug - Afficher ce qui est envoyé
    console.log('🔍 Debug - productData:', productData);
    console.log('🔍 Debug - FormData entries:');
    for (const [key, value] of formData.entries()) {
      console.log(`  ${key}:`, typeof value === 'string' ? value.substring(0, 100) + '...' : value);
    }
    
    // Envoyer directement à l'endpoint with-design
    const response = await fetch(`${API_BASE_URL}/products/with-design`, {
      method: 'POST',
      headers: {
        // ⚠️ NE PAS ajouter Content-Type, il sera automatiquement défini
      },
      body: formData
    });
    
    // Traiter la réponse
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log("✅ TEST DIRECT: Produit créé avec succès:", data);
    
    // Vérifier le design
    if (data.design) {
      alert("✅ TEST DIRECT: Design créé avec succès! Vérifiez la console pour les détails.");
    } else {
      alert("❌ TEST DIRECT: Design null dans la réponse!");
    }
  } catch (error: unknown) {
    console.error("❌ TEST DIRECT: Erreur:", error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
    alert(`Erreur de test direct: ${errorMessage}`);
  }
};

// Ajouter un bouton dans le formulaire pour tester (à placer là où ça vous convient)
// <button type="button" onClick={testDirectUpload} className="btn btn-warning">
//   Test Direct Upload Design
// </button> 
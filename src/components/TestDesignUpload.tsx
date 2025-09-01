import React, { useState, useEffect } from 'react';

// Composant de test pour l'upload de design directement vers le backend
const TestDesignUpload = () => {
  // État local pour stocker les valeurs du formulaire
  const [formData, setFormData] = useState({
    name: 'T-shirt Test Direct',
    description: 'Test direct pour l\'upload de design',
    price: 12000,
    stock: 100,
    designId: null,
    categoryId: 1,
    sizeIds: [1, 2],
    colorIds: [1]
  });

  // État pour le design personnalisé
  const [customDesign, setCustomDesign] = useState({
    name: '',
    description: ''
  });

  // État pour l'image du design
  const [designImage, setDesignImage] = useState(null);
  
  // État pour choisir entre design existant ou personnalisé
  const [useExistingDesign, setUseExistingDesign] = useState(false);
  
  // État pour stocker les designs disponibles
  const [designs, setDesigns] = useState([]);
  
  // État pour afficher le résultat
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Charger les designs disponibles au chargement du composant
  useEffect(() => {
    fetch('http://localhost:3000/designs')
      .then(res => res.json())
      .then(data => {
        console.log("Designs disponibles:", data);
        setDesigns(data);
      })
      .catch(err => {
        console.error("Erreur lors du chargement des designs:", err);
      });
  }, []);

  // Gérer les changements dans les champs de base
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Gérer les changements dans le design personnalisé
  const handleCustomDesignChange = (e) => {
    const { name, value } = e.target;
    setCustomDesign({
      ...customDesign,
      [name]: value
    });
  };

  // Gérer l'upload de l'image
  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setDesignImage(e.target.files[0]);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Créer un FormData pour envoyer les données
      const data = new FormData();
      
      // Ajouter les informations de base du produit
      Object.keys(formData).forEach(key => {
        if (key === 'sizeIds' || key === 'colorIds') {
          data.append(key, JSON.stringify(formData[key]));
        } else if (key === 'designId') {
          if (useExistingDesign && formData[key]) {
            data.append(key, formData[key]);
          }
        } else {
          data.append(key, formData[key]);
        }
      });
      
      // Ajouter le design personnalisé si nécessaire
      if (!useExistingDesign) {
        data.append('customDesign', JSON.stringify(customDesign));
        if (designImage) {
          data.append('designImage', designImage);
        }
      }
      
      // Choisir l'endpoint en fonction de la présence d'une image
      const endpoint = !useExistingDesign && designImage 
        ? 'http://localhost:3000/products/with-design' 
        : 'http://localhost:3000/products';
      
      // Journaliser le contenu du FormData
      console.log("Envoi à", endpoint);
      for (const [key, value] of data.entries()) {
        if (value instanceof File) {
          console.log(`${key}: Fichier - ${value.name} (${value.size} bytes)`);
        } else {
          console.log(`${key}: ${value}`);
        }
      }
      
      // Envoyer la requête
      const response = await fetch(endpoint, {
        method: 'POST',
        body: data
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }
      
      const responseData = await response.json();
      setResult(responseData);
      console.log("Réponse du serveur:", responseData);
      
    } catch (err) {
      console.error("Erreur lors de l'envoi:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto bg-white rounded-xl shadow-md">
      <h1 className="text-2xl font-bold mb-6">Test d'upload de design</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Informations de base du produit */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Informations du produit</h2>
          
          <div>
            <label className="block text-sm font-medium">Nom</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border border-gray-300 p-2"
              required
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">Prix</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium">Stock</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                required
              />
            </div>
          </div>
        </div>
        
        {/* Section Design */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Design du produit</h2>
          
          <div className="flex space-x-4">
            <div className="flex items-center">
              <input
                type="radio"
                id="existingDesign"
                checked={useExistingDesign}
                onChange={() => setUseExistingDesign(true)}
                className="mr-2"
              />
              <label htmlFor="existingDesign">Design existant</label>
            </div>
            
            <div className="flex items-center">
              <input
                type="radio"
                id="newDesign"
                checked={!useExistingDesign}
                onChange={() => setUseExistingDesign(false)}
                className="mr-2"
              />
              <label htmlFor="newDesign">Nouveau design</label>
            </div>
          </div>
          
          {useExistingDesign ? (
            <div>
              <label className="block text-sm font-medium">Choisir un design</label>
              <select
                name="designId"
                value={formData.designId || ''}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                required
              >
                <option value="">Sélectionner un design</option>
                {designs.map(design => (
                  <option key={design.id} value={design.id}>
                    {design.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nom du design</label>
                <input
                  type="text"
                  name="name"
                  value={customDesign.name}
                  onChange={handleCustomDesignChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">Description du design</label>
                <textarea
                  name="description"
                  value={customDesign.description}
                  onChange={handleCustomDesignChange}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium">Image du design</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="mt-1 block w-full"
                  required
                />
                {designImage && (
                  <div className="mt-2 text-sm text-gray-500">
                    Fichier sélectionné: {designImage.name} ({Math.round(designImage.size / 1024)} KB)
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition duration-150 disabled:opacity-50"
        >
          {loading ? 'Envoi en cours...' : 'Tester l\'upload'}
        </button>
      </form>
      
      {/* Affichage des résultats */}
      {error && (
        <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">Erreur</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
          <h3 className="font-bold">Succès!</h3>
          <p>Produit créé avec ID: {result.id}</p>
          <p>Design: {result.design ? result.design.name : 'Aucun design retourné'}</p>
          <pre className="mt-2 bg-green-50 p-2 rounded text-xs overflow-auto max-h-40">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default TestDesignUpload; 
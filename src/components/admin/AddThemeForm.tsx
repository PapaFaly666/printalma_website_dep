import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  X, 
  Image as ImageIcon,
  Palette,
  Type,
  FileText,
  Save,
  RotateCcw
} from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { apiPost } from '../../utils/apiHelpers';

interface AddThemeFormProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddThemeForm: React.FC<AddThemeFormProps> = ({ onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    status: 'active' as 'active' | 'inactive',
    featured: false
  });

  const steps = [
    { id: 1, title: 'Informations', icon: Type },
    { id: 2, title: 'Image', icon: ImageIcon },
    { id: 3, title: 'Validation', icon: Save }
  ];

  // Gestion de l'upload d'image
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validation du fichier
      if (!file.type.startsWith('image/')) {
        toast.error('Veuillez sélectionner une image valide');
        return;
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB max
        toast.error('L\'image ne doit pas dépasser 5MB');
        return;
      }

      setCoverImage(file);
      
      // Créer la prévisualisation
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Supprimer l'image
  const handleRemoveImage = () => {
    setCoverImage(null);
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Validation des étapes
  const validateStep = (step: number): string[] => {
    const errors: string[] = [];
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) errors.push('Nom du thème requis');
        if (!formData.description.trim()) errors.push('Description requise');
        if (!formData.category.trim()) errors.push('Catégorie requise');
        break;
      
      case 2:
        if (!coverImage) errors.push('Image de couverture requise');
        break;
    }
    
    return errors;
  };

  // Navigation
  const nextStep = () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      stepErrors.forEach(error => toast.error(error));
      return;
    }
    
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async () => {
    const stepErrors = validateStep(currentStep);
    if (stepErrors.length > 0) {
      stepErrors.forEach(error => toast.error(error));
      return;
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('category', formData.category);
      formDataToSend.append('status', formData.status);
      formDataToSend.append('featured', formData.featured.toString());
      
      if (coverImage) {
        formDataToSend.append('coverImage', coverImage);
      }

      const result = await apiPost('https://printalma-back-dep.onrender.com/themes', formDataToSend);

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success('Thème créé avec succès');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de la création du thème');
    } finally {
      setLoading(false);
    }
  };

  // Réinitialiser le formulaire
  const handleReset = () => {
    setFormData({
      name: '',
      description: '',
      category: '',
      status: 'active',
      featured: false
    });
    setCoverImage(null);
    setImagePreview('');
    setCurrentStep(1);
    toast.success('Formulaire réinitialisé');
  };

  return (
    <div className="space-y-6">
      {/* Indicateur d'étapes */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          
          return (
            <div key={step.id} className="flex items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all
                ${isActive 
                  ? 'border-blue-600 bg-blue-600 text-white' 
                  : isCompleted 
                    ? 'border-green-500 bg-green-500 text-white'
                    : 'border-gray-300 bg-white text-gray-400 dark:border-gray-600 dark:bg-gray-800'
                }
              `}>
                <Icon className="h-5 w-5" />
              </div>
              
              <div className="ml-3 hidden sm:block">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
              </div>
              
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  isCompleted ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'
                }`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Contenu de l'étape */}
      <div className="space-y-6">
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <Label htmlFor="name">Nom du thème *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Manga, Films, Sport..."
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Décrivez votre thème..."
                rows={4}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Catégorie *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionnez une catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="entertainment">Divertissement</SelectItem>
                  <SelectItem value="sports">Sport</SelectItem>
                  <SelectItem value="gaming">Jeux vidéo</SelectItem>
                  <SelectItem value="anime">Anime/Manga</SelectItem>
                  <SelectItem value="movies">Films/Séries</SelectItem>
                  <SelectItem value="music">Musique</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="status">Statut</Label>
                <p className="text-sm text-gray-500">Actif ou inactif</p>
              </div>
              <Select
                value={formData.status}
                onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="featured">Mis en avant</Label>
                <p className="text-sm text-gray-500">Afficher en priorité</p>
              </div>
              <Switch
                id="featured"
                checked={formData.featured}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, featured: checked }))}
              />
            </div>
          </motion.div>
        )}

        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <Label>Image de couverture *</Label>
              <p className="text-sm text-gray-500 mb-4">
                Ajoutez une image représentative de votre thème (max 5MB)
              </p>

              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200 dark:border-gray-700"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleRemoveImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Cliquez pour uploader une image
                  </p>
                  <p className="text-sm text-gray-500">
                    PNG, JPG, GIF jusqu'à 5MB
                  </p>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>
          </motion.div>
        )}

        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-4">Récapitulatif</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                  <span className="font-medium">{formData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Catégorie:</span>
                  <span className="font-medium">{formData.category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Statut:</span>
                  <span className="font-medium capitalize">{formData.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Mis en avant:</span>
                  <span className="font-medium">{formData.featured ? 'Oui' : 'Non'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Image:</span>
                  <span className="font-medium">{coverImage ? 'Ajoutée' : 'Manquante'}</span>
                </div>
              </div>

              {imagePreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Aperçu:</p>
                  <img
                    src={imagePreview}
                    alt="Aperçu"
                    className="w-32 h-32 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
        </div>

        <div className="flex gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={loading}
            >
              Précédent
            </Button>
          )}

          {currentStep < steps.length ? (
            <Button
              onClick={nextStep}
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              Suivant
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Créer le thème
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddThemeForm; 
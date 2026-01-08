// src/components/categories/CreateCategoryRealForm.tsx
// Formulaire basé sur la doc cate.md avec les vrais endpoints backend

import React, { useState } from 'react';
import { Plus, Info, AlertCircle } from 'lucide-react';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { toast } from 'sonner';
import categoryRealApi, { CreateCategoryDto, CreateSubCategoryDto, CreateVariationDto } from '../../services/categoryRealApi';

interface CreateCategoryRealFormProps {
  onSuccess: () => void;
  onCancel?: () => void;
}

export const CreateCategoryRealForm: React.FC<CreateCategoryRealFormProps> = ({ onSuccess, onCancel }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);

  // Données pour catégorie (niveau 0)
  const [categoryData, setCategoryData] = useState<CreateCategoryDto>({
    name: '',
    description: '',
    displayOrder: 0
  });

  // Données pour sous-catégorie (niveau 1)
  const [subCategoryData, setSubCategoryData] = useState<CreateSubCategoryDto & { skip?: boolean }>({
    name: '',
    description: '',
    categoryId: 0,
    displayOrder: 0,
    skip: false // Option pour sauter la sous-catégorie
  });

  // Données pour variations (niveau 2)
  const [variationsList, setVariationsList] = useState<string[]>([]);
  const [currentVariation, setCurrentVariation] = useState('');

  // IDs créés
  const [createdCategoryId, setCreatedCategoryId] = useState<number | null>(null);
  const [createdSubCategoryId, setCreatedSubCategoryId] = useState<number | null>(null);

  const handleAddVariation = () => {
    if (currentVariation.trim()) {
      setVariationsList([...variationsList, currentVariation.trim()]);
      setCurrentVariation('');
    }
  };

  const handleRemoveVariation = (index: number) => {
    setVariationsList(variationsList.filter((_, i) => i !== index));
  };

  const handleCreateCategory = async () => {
    if (!categoryData.name.trim()) {
      toast.error('Le nom de la catégorie est requis');
      return;
    }

    setLoading(true);
    try {
      const result = await categoryRealApi.createCategory(categoryData);
      setCreatedCategoryId(result.id);

      toast.success(`✅ Catégorie "${result.name}" créée !`);

      // Passer à l'étape suivante
      setStep(2);
    } catch (err: any) {
      console.error('Error creating category:', err);

      // Gestion des erreurs selon cate.md
      if (err.response?.status === 409) {
        toast.error('Une catégorie avec ce nom existe déjà');
      } else if (err.response?.status === 400) {
        const messages = Array.isArray(err.response.data.message)
          ? err.response.data.message.join('\n')
          : err.response.data.message;
        toast.error(messages);
      } else {
        toast.error('Erreur lors de la création de la catégorie');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubCategory = async () => {
    if (subCategoryData.skip) {
      // Sauter la sous-catégorie et terminer
      toast.success('✅ Catégorie créée sans sous-catégorie');
      onSuccess();
      return;
    }

    if (!subCategoryData.name.trim()) {
      toast.error('Le nom de la sous-catégorie est requis');
      return;
    }

    if (!createdCategoryId) {
      toast.error('Erreur: ID de catégorie parent manquant');
      return;
    }

    setLoading(true);
    try {
      const result = await categoryRealApi.createSubCategory({
        ...subCategoryData,
        categoryId: createdCategoryId
      });
      setCreatedSubCategoryId(result.id);

      toast.success(`✅ Sous-catégorie "${result.name}" créée !`);

      // Passer à l'étape suivante
      setStep(3);
    } catch (err: any) {
      console.error('Error creating subcategory:', err);

      if (err.response?.status === 409) {
        toast.error('La sous-catégorie existe déjà dans cette catégorie');
      } else if (err.response?.status === 404) {
        toast.error('Catégorie parente non trouvée');
      } else if (err.response?.status === 400) {
        const messages = Array.isArray(err.response.data.message)
          ? err.response.data.message.join('\n')
          : err.response.data.message;
        toast.error(messages);
      } else {
        toast.error('Erreur lors de la création de la sous-catégorie');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVariations = async () => {
    if (variationsList.length === 0) {
      // Terminer sans variations
      toast.success('✅ Structure créée sans variations');
      onSuccess();
      return;
    }

    if (!createdSubCategoryId) {
      toast.error('Erreur: ID de sous-catégorie parent manquant');
      return;
    }

    setLoading(true);
    try {
      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < variationsList.length; i++) {
        try {
          await categoryRealApi.createVariation({
            name: variationsList[i],
            subCategoryId: createdSubCategoryId,
            displayOrder: i
          });
          successCount++;
        } catch (err: any) {
          console.error(`Error creating variation "${variationsList[i]}":`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast.success(`✅ Structure complète créée !\n\n${successCount} variation(s) créée(s)${errorCount > 0 ? `\n${errorCount} erreur(s)` : ''}`);
      }

      onSuccess();
    } catch (err: any) {
      console.error('Error creating variations:', err);
      toast.error('Erreur lors de la création des variations');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (step === 1) {
      handleCreateCategory();
    } else if (step === 2) {
      handleCreateSubCategory();
    } else if (step === 3) {
      handleCreateVariations();
    }
  };

  // Affichage du fil d'Ariane
  const renderBreadcrumb = () => (
    <div className="flex items-center gap-2 text-sm mb-4">
      <span className={step === 1 ? 'font-bold text-blue-600' : 'text-gray-500'}>
        1. Catégorie
      </span>
      <span className="text-gray-400">→</span>
      <span className={step === 2 ? 'font-bold text-blue-600' : 'text-gray-500'}>
        2. Sous-catégorie
      </span>
      <span className="text-gray-400">→</span>
      <span className={step === 3 ? 'font-bold text-blue-600' : 'text-gray-500'}>
        3. Variations
      </span>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {renderBreadcrumb()}

      {/* ÉTAPE 1: Catégorie (Niveau 0) */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Catégorie principale</CardTitle>
            <CardDescription>Ex: Vêtements, Accessoires, Téléphones...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="categoryName">
                Nom de la catégorie <span className="text-red-500">*</span>
              </Label>
              <Input
                id="categoryName"
                placeholder="Ex: Vêtements"
                value={categoryData.name}
                onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
                disabled={loading}
                required
              />
              <p className="text-xs text-gray-500 mt-1">Min: 2 caractères, Max: 100</p>
            </div>

            <div>
              <Label htmlFor="categoryDescription">Description (optionnel)</Label>
              <Textarea
                id="categoryDescription"
                placeholder="Tous les vêtements personnalisables"
                value={categoryData.description}
                onChange={(e) => setCategoryData({ ...categoryData, description: e.target.value })}
                disabled={loading}
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">Max: 500 caractères</p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded border border-blue-200 dark:border-blue-800">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-medium mb-1">Le slug est généré automatiquement</p>
                  <p>Ex: "Vêtements" → "vetements"</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ÉTAPE 2: Sous-catégorie (Niveau 1) */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sous-catégorie (optionnel)</CardTitle>
            <CardDescription>
              Parent: <strong>{categoryData.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="skipSubCategory"
                checked={subCategoryData.skip}
                onChange={(e) => setSubCategoryData({ ...subCategoryData, skip: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="skipSubCategory" className="cursor-pointer">
                Sauter cette étape (pas de sous-catégorie)
              </Label>
            </div>

            {!subCategoryData.skip && (
              <>
                <div>
                  <Label htmlFor="subCategoryName">
                    Nom de la sous-catégorie <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="subCategoryName"
                    placeholder="Ex: T-Shirts"
                    value={subCategoryData.name}
                    onChange={(e) => setSubCategoryData({ ...subCategoryData, name: e.target.value })}
                    disabled={loading}
                    required={!subCategoryData.skip}
                  />
                </div>

                <div>
                  <Label htmlFor="subCategoryDescription">Description (optionnel)</Label>
                  <Textarea
                    id="subCategoryDescription"
                    placeholder="T-shirts pour homme et femme"
                    value={subCategoryData.description}
                    onChange={(e) => setSubCategoryData({ ...subCategoryData, description: e.target.value })}
                    disabled={loading}
                    rows={3}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* ÉTAPE 3: Variations (Niveau 2) */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Variations (optionnel)</CardTitle>
            <CardDescription>
              Parent: <strong>{categoryData.name}</strong> → <strong>{subCategoryData.name}</strong>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="variation">Ajouter une variation</Label>
              <div className="flex gap-2">
                <Input
                  id="variation"
                  placeholder="Ex: Col V"
                  value={currentVariation}
                  onChange={(e) => setCurrentVariation(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddVariation();
                    }
                  }}
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={handleAddVariation}
                  disabled={!currentVariation.trim() || loading}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">Appuyez sur Entrée ou cliquez sur + pour ajouter</p>
            </div>

            {variationsList.length > 0 && (
              <div>
                <Label>Variations ajoutées ({variationsList.length})</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {variationsList.map((variation, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full"
                    >
                      <span className="text-sm">{variation}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariation(index)}
                        className="text-gray-500 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {variationsList.length === 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded border border-amber-200 dark:border-amber-800">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5" />
                  <div className="text-xs text-amber-800 dark:text-amber-300">
                    <p>Vous pouvez terminer sans ajouter de variations</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex justify-between pt-4">
        <div>
          {step > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep((step - 1) as 1 | 2 | 3)}
              disabled={loading}
            >
              Retour
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
            >
              Annuler
            </Button>
          )}
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? (
              'Création...'
            ) : step === 3 ? (
              variationsList.length === 0 ? 'Terminer' : `Créer ${variationsList.length} variation(s)`
            ) : (
              'Suivant'
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

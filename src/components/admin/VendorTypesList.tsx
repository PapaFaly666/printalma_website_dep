import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Edit,
  Trash2,
  Tag,
  Users,
  Calendar,
  Loader2,
  AlertCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';
import { vendorTypeService, VendorType } from '../../services/vendorTypeService';
import { CreateVendorTypeModal } from './CreateVendorTypeModal';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface EditVendorTypeModalProps {
  vendorType: VendorType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const EditVendorTypeModal: React.FC<EditVendorTypeModalProps> = ({
  vendorType,
  open,
  onOpenChange,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    label: vendorType.label,
    description: vendorType.description
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ label?: string; description?: string; general?: string }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (formData.label.trim().length < 2) {
      newErrors.label = 'Le label doit contenir au moins 2 caractères';
    } else if (formData.label.trim().length > 50) {
      newErrors.label = 'Le label ne peut pas dépasser 50 caractères';
    }

    if (formData.description.trim().length < 5) {
      newErrors.description = 'La description doit contenir au moins 5 caractères';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await vendorTypeService.update(vendorType.id, {
        label: formData.label.trim(),
        description: formData.description.trim()
      });

      toast.success('Type modifié', {
        description: `Le type "${formData.label}" a été modifié avec succès`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la modification';
      setErrors({ general: errorMessage });
      toast.error('Échec de la modification', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Modifier le Type de Vendeur</AlertDialogTitle>
          <AlertDialogDescription>
            Modifiez les informations du type "{vendorType.label}"
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Label</label>
            <input
              type="text"
              value={formData.label}
              onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.label ? 'border-red-500' : 'border-gray-300'}`}
              maxLength={50}
              disabled={loading}
            />
            {errors.label && <p className="text-red-600 text-xs mt-1">{errors.label}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.label.length}/50</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3 py-2 border rounded ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
              rows={3}
              maxLength={200}
              disabled={loading}
            />
            {errors.description && <p className="text-red-600 text-xs mt-1">{errors.description}</p>}
            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200</p>
          </div>

          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}
        </form>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={handleSubmit} disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Modification...</> : 'Modifier'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export const VendorTypesList: React.FC = () => {
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingType, setEditingType] = useState<VendorType | null>(null);
  const [deletingType, setDeletingType] = useState<VendorType | null>(null);

  useEffect(() => {
    fetchVendorTypes();
  }, []);

  const fetchVendorTypes = async () => {
    setLoading(true);
    setError('');

    try {
      const types = await vendorTypeService.getAll();
      setVendorTypes(types);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      toast.error('Erreur de chargement', {
        description: 'Impossible de charger les types de vendeurs'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingType) return;

    try {
      await vendorTypeService.delete(deletingType.id);
      toast.success('Type supprimé', {
        description: `Le type "${deletingType.label}" a été supprimé`
      });
      setDeletingType(null);
      fetchVendorTypes();
    } catch (error: any) {
      toast.error('Impossible de supprimer', {
        description: error.message || 'Une erreur est survenue'
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Types de Vendeurs
              </CardTitle>
              <CardDescription>
                Gérez les catégories de vendeurs de votre plateforme
              </CardDescription>
            </div>
            <Button onClick={() => setShowCreateModal(true)}>
              <Tag className="w-4 h-4 mr-2" />
              Créer un type
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {vendorTypes.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded">
              <Tag className="h-12 w-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 mb-4">Aucun type de vendeur créé</p>
              <Button onClick={() => setShowCreateModal(true)} variant="outline">
                Créer le premier type
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {vendorTypes.map(type => (
                <div
                  key={type.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{type.label}</h3>
                        {type.userCount !== undefined && type.userCount > 0 && (
                          <Badge variant="secondary">
                            <Users className="w-3 h-3 mr-1" />
                            {type.userCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{type.description}</p>
                      <div className="flex gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Créé le {new Date(type.createdAt).toLocaleDateString('fr-FR')}
                        </span>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          •••
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingType(type)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Modifier
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingType(type)}
                          disabled={type.userCount !== undefined && type.userCount > 0}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {type.userCount !== undefined && type.userCount > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <Alert className="bg-yellow-50 border-yellow-200">
                        <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        <AlertDescription className="text-yellow-800 text-xs">
                          Ce type est utilisé par {type.userCount} vendeur(s). Impossible de le supprimer.
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de création */}
      <CreateVendorTypeModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={fetchVendorTypes}
      />

      {/* Modal d'édition */}
      {editingType && (
        <EditVendorTypeModal
          vendorType={editingType}
          open={!!editingType}
          onOpenChange={(open) => !open && setEditingType(null)}
          onSuccess={fetchVendorTypes}
        />
      )}

      {/* Dialog de suppression */}
      <AlertDialog open={!!deletingType} onOpenChange={(open) => !open && setDeletingType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer le type "{deletingType?.label}" ?
              Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

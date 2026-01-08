import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import {
  Loader2,
  AlertCircle,
  Tag,
  Plus,
  Users,
  Calendar,
  Edit,
  Trash2,
  List,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { vendorTypeService, CreateVendorTypeDto, VendorType } from '../../services/vendorTypeService';
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

interface VendorTypesManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const VendorTypesManagementModal: React.FC<VendorTypesManagementModalProps> = ({
  open,
  onOpenChange,
  onSuccess
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('list');
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingType, setEditingType] = useState<VendorType | null>(null);
  const [deletingType, setDeletingType] = useState<VendorType | null>(null);

  // Form states
  const [formData, setFormData] = useState<CreateVendorTypeDto>({
    label: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    label?: string;
    description?: string;
    general?: string;
  }>({});

  useEffect(() => {
    if (open) {
      fetchVendorTypes();
    }
  }, [open]);

  const fetchVendorTypes = async () => {
    setLoadingList(true);
    try {
      const types = await vendorTypeService.getAll();
      setVendorTypes(types);
    } catch (error) {
      console.error('Error fetching vendor types:', error);
    } finally {
      setLoadingList(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (!formData.label.trim()) {
      newErrors.label = 'Le label est requis';
    } else if (formData.label.trim().length < 2) {
      newErrors.label = 'Le label doit contenir au moins 2 caractères';
    } else if (formData.label.trim().length > 50) {
      newErrors.label = 'Le label ne peut pas dépasser 50 caractères';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La description est requise';
    } else if (formData.description.trim().length < 5) {
      newErrors.description = 'La description doit contenir au moins 5 caractères';
    } else if (formData.description.trim().length > 200) {
      newErrors.description = 'La description ne peut pas dépasser 200 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await vendorTypeService.create({
        label: formData.label.trim(),
        description: formData.description.trim()
      });

      toast.success('Type créé', {
        description: `Le type "${response.vendorType.label}" a été créé avec succès`
      });

      setFormData({ label: '', description: '' });
      fetchVendorTypes();
      setActiveTab('list');
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la création';
      setErrors({ general: errorMessage });
      toast.error('Échec de la création', { description: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (type: VendorType) => {
    setEditingType(type);
    setFormData({ label: type.label, description: type.description });
    setActiveTab('create');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingType) return;

    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      await vendorTypeService.update(editingType.id, {
        label: formData.label.trim(),
        description: formData.description.trim()
      });

      toast.success('Type modifié', {
        description: `Le type "${formData.label}" a été modifié avec succès`
      });

      setFormData({ label: '', description: '' });
      setEditingType(null);
      fetchVendorTypes();
      setActiveTab('list');
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.message || 'Erreur lors de la modification';
      setErrors({ general: errorMessage });
      toast.error('Échec de la modification', { description: errorMessage });
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
      onSuccess?.();
    } catch (error: any) {
      toast.error('Impossible de supprimer', {
        description: error.message || 'Une erreur est survenue'
      });
    }
  };

  const handleCancel = () => {
    setFormData({ label: '', description: '' });
    setErrors({});
    setEditingType(null);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-blue-600" />
              Gestion des Types de Vendeurs
            </DialogTitle>
            <DialogDescription>
              Créez et gérez les catégories de vos vendeurs
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'create' | 'list')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                Liste ({vendorTypes.length})
              </TabsTrigger>
              <TabsTrigger value="create" className="flex items-center gap-2">
                {editingType ? <Edit className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                {editingType ? 'Modifier' : 'Créer'}
              </TabsTrigger>
            </TabsList>

            {/* TAB: Liste */}
            <TabsContent value="list" className="mt-4">
              <ScrollArea className="h-[450px] pr-4">
                {loadingList ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : vendorTypes.length === 0 ? (
                  <div className="text-center py-12">
                    <Tag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-600 mb-4">Aucun type de vendeur créé</p>
                    <Button onClick={() => setActiveTab('create')} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Créer le premier type
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vendorTypes.map((type) => (
                      <Card key={type.id} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <CardTitle className="text-lg">{type.label}</CardTitle>
                                {type.userCount !== undefined && type.userCount > 0 && (
                                  <Badge variant="secondary" className="text-xs">
                                    <Users className="w-3 h-3 mr-1" />
                                    {type.userCount}
                                  </Badge>
                                )}
                              </div>
                              <CardDescription className="text-sm">
                                {type.description}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEdit(type)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeletingType(type)}
                                disabled={type.userCount !== undefined && type.userCount > 0}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(type.createdAt).toLocaleDateString('fr-FR')}
                            </span>
                          </div>
                          {type.userCount !== undefined && type.userCount > 0 && (
                            <Alert className="mt-3 bg-yellow-50 border-yellow-200">
                              <AlertTriangle className="h-4 w-4 text-yellow-600" />
                              <AlertDescription className="text-yellow-800 text-xs">
                                Utilisé par {type.userCount} vendeur(s) - Impossible de supprimer
                              </AlertDescription>
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* TAB: Créer/Modifier */}
            <TabsContent value="create" className="mt-4">
              <ScrollArea className="h-[450px] pr-4">
                <form onSubmit={editingType ? handleUpdate : handleCreate} className="space-y-4">
                  {editingType && (
                    <Alert className="bg-blue-50 border-blue-200">
                      <Edit className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-blue-800">
                        Modification du type "{editingType.label}"
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="label" className="text-sm font-medium">
                      Label <span className="text-red-600">*</span>
                    </Label>
                    <Input
                      id="label"
                      value={formData.label}
                      onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                      placeholder="Ex: Photographe, Designer, Influenceur..."
                      maxLength={50}
                      disabled={loading}
                      className={errors.label ? 'border-red-500' : ''}
                    />
                    {errors.label && (
                      <p className="text-red-600 text-xs mt-1">{errors.label}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.label.length}/50 caractères
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Description <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Ex: Spécialiste de la photographie professionnelle"
                      rows={4}
                      maxLength={200}
                      disabled={loading}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && (
                      <p className="text-red-600 text-xs mt-1">{errors.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {formData.description.length}/200 caractères
                    </p>
                  </div>

                  {errors.general && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{errors.general}</AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1"
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {editingType ? 'Modification...' : 'Création...'}
                        </>
                      ) : (
                        <>
                          {editingType ? <Edit className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
                          {editingType ? 'Modifier' : 'Créer'}
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tags,
  Plus,
  Edit2,
  Trash2,
  X,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Button from '../ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { toast } from 'sonner';
import { vendorTypeService, VendorType, CreateVendorTypeDto, UpdateVendorTypeDto } from '../../services/vendorTypeService';


interface VendorTypesManagementProps {
  onClose: () => void;
}

const VendorTypesManagement: React.FC<VendorTypesManagementProps> = ({ onClose }) => {
  const [vendorTypes, setVendorTypes] = useState<VendorType[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<VendorType | null>(null);
  const [formData, setFormData] = useState<CreateVendorTypeDto>({
    label: '',
    description: ''
  });

  // Charger les types de vendeurs depuis l'API
  useEffect(() => {
    loadVendorTypes();
  }, []);

  const loadVendorTypes = async () => {
    setLoading(true);
    try {
      const types = await vendorTypeService.getAll();
      setVendorTypes(types);
    } catch (error) {
      console.error('Erreur lors du chargement des types:', error);
      toast.error('Erreur lors du chargement des types de vendeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingType(null);
    setFormData({
      label: '',
      description: ''
    });
    setIsModalOpen(true);
  };

  const handleEdit = (type: VendorType) => {
    setEditingType(type);
    setFormData({
      label: type.label,
      description: type.description
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (type: VendorType) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer le type "${type.label}" ?`)) {
      setLoading(true);
      try {
        await vendorTypeService.delete(type.id);
        toast.success('Type de vendeur supprimé avec succès');
        await loadVendorTypes();
      } catch (error: any) {
        toast.error(error.message || 'Erreur lors de la suppression');
      } finally {
        setLoading(false);
      }
    }
  };


  const handleSave = async () => {
    if (!formData.label || !formData.description) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    try {
      if (editingType) {
        // Modifier un type existant
        const updateData: UpdateVendorTypeDto = {
          label: formData.label,
          description: formData.description
        };
        await vendorTypeService.update(editingType.id, updateData);
        toast.success('Type de vendeur modifié avec succès');
      } else {
        // Créer un nouveau type
        await vendorTypeService.create(formData);
        toast.success('Type de vendeur créé avec succès');
      }

      setIsModalOpen(false);
      await loadVendorTypes();
    } catch (error: any) {
      toast.error(error.message || 'Erreur lors de l\'opération');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Tags className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gestion des Types de Vendeurs</h2>
              <p className="text-sm text-gray-600">
                Créez et gérez les différents types de vendeurs de la plateforme
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Boutons actions */}
          <div className="mb-6 flex justify-between items-center">
            <Button onClick={handleCreateNew} className="bg-black hover:bg-gray-800 text-white">
              <Plus className="h-4 w-4 mr-2" />
              Créer un nouveau type
            </Button>
            <Button
              variant="outline"
              onClick={loadVendorTypes}
              disabled={loading}
              className="border-gray-300 hover:bg-gray-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
          </div>

          {/* Liste des types */}
          {!loading && vendorTypes.length === 0 && (
            <Alert className="mb-6 border-gray-200 bg-gray-50">
              <AlertCircle className="h-4 w-4 text-gray-600" />
              <AlertDescription className="text-gray-700">
                Aucun type de vendeur créé. Cliquez sur <strong>"Créer un nouveau type"</strong> pour commencer.
              </AlertDescription>
            </Alert>
          )}

          {/* Chargement */}
          {loading && vendorTypes.length === 0 && (
            <div className="flex justify-center items-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-3 text-gray-600">Chargement des types...</span>
            </div>
          )}

          {/* Tableau des types */}
          {!loading && vendorTypes.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Nom du type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Vendeurs
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {vendorTypes.map((type) => (
                  <tr key={type.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{type.label}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600">{type.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <Badge variant="secondary" className="text-xs">
                        {type.userCount || 0} vendeur(s)
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(type)}
                          disabled={loading}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit2 className="h-4 w-4 mr-1" />
                          Modifier
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(type)}
                          disabled={loading}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Supprimer
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fermer
          </Button>
        </div>
      </motion.div>

      {/* Modal création/modification */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingType ? 'Modifier le type de vendeur' : 'Créer un type de vendeur'}
            </DialogTitle>
            <DialogDescription>
              Définissez les caractéristiques du type de vendeur
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="label">Nom du type *</Label>
              <Input
                id="label"
                value={formData.label}
                onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                placeholder="Ex: Photographe, Streamer, Développeur, etc."
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Ex: Création de photos professionnelles"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={loading}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={loading} className="bg-black hover:bg-gray-800">
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  {editingType ? 'Modification...' : 'Création...'}
                </>
              ) : (
                editingType ? 'Modifier' : 'Créer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorTypesManagement;

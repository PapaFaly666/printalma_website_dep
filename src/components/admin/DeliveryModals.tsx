import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import Button from '../ui/Button';
import { Switch } from '../ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Badge } from '../ui/badge';
import type { CreateCityPayload, CreateRegionPayload, CreateInternationalZonePayload } from '../../services/deliveryService';
import { COUNTRIES } from '../../data/countries';

// ========================================
// Modal Ville (City)
// ========================================

interface CityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: CreateCityPayload;
  setFormData: React.Dispatch<React.SetStateAction<CreateCityPayload>>;
  isEdit?: boolean;
  isSaving?: boolean;
  disableZoneTypeChange?: boolean;
}

export const CityModal: React.FC<CityModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEdit = false,
  isSaving = false,
  disableZoneTypeChange = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier' : 'Ajouter'} une ville</DialogTitle>
          <DialogDescription>
            {formData.zoneType === 'dakar-ville' ? 'Dakar Ville' : 'Banlieue de Dakar'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="city-name">Nom de la ville *</Label>
            <Input
              id="city-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Plateau, Almadies..."
            />
          </div>

          <div>
            <Label htmlFor="city-category">Catégorie</Label>
            <Select
              value={formData.category}
              onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger id="city-category">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Centre">Centre</SelectItem>
                <SelectItem value="Résidentiel">Résidentiel</SelectItem>
                <SelectItem value="Populaire">Populaire</SelectItem>
                <SelectItem value="Banlieue">Banlieue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="city-zone-type">Type de zone</Label>
            <Select
              value={formData.zoneType}
              onValueChange={(value: 'dakar-ville' | 'banlieue') => setFormData(prev => ({ ...prev, zoneType: value }))}
              disabled={disableZoneTypeChange}
            >
              <SelectTrigger id="city-zone-type" disabled={disableZoneTypeChange}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dakar-ville">Dakar Ville</SelectItem>
                <SelectItem value="banlieue">Banlieue</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2 flex items-center gap-4 p-4 border rounded-lg">
            <Switch
              checked={formData.isFree}
              onCheckedChange={(checked) => setFormData(prev => ({
                ...prev,
                isFree: checked,
                price: checked ? 0 : prev.price
              }))}
            />
            <div>
              <Label>Livraison gratuite</Label>
              <p className="text-xs text-gray-500">Désactivez pour définir un prix</p>
            </div>
          </div>

          {!formData.isFree && (
            <div className="col-span-2">
              <Label htmlFor="city-price">Prix de livraison (FCFA) *</Label>
              <Input
                id="city-price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                min="0"
                step="100"
              />
            </div>
          )}

          <div>
            <Label htmlFor="city-time-min">Délai min</Label>
            <Input
              id="city-time-min"
              type="number"
              value={formData.deliveryTimeMin || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMin: parseInt(e.target.value) || undefined }))}
              placeholder="Ex: 24"
            />
          </div>

          <div>
            <Label htmlFor="city-time-max">Délai max</Label>
            <Input
              id="city-time-max"
              type="number"
              value={formData.deliveryTimeMax || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMax: parseInt(e.target.value) || undefined }))}
              placeholder="Ex: 48"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="city-time-unit">Unité de temps</Label>
            <Select
              value={formData.deliveryTimeUnit}
              onValueChange={(value: 'heures' | 'jours') => setFormData(prev => ({ ...prev, deliveryTimeUnit: value }))}
            >
              <SelectTrigger id="city-time-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heures">Heures</SelectItem>
                <SelectItem value="jours">Jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label htmlFor="city-status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="city-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========================================
// Modal Région
// ========================================

interface RegionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: CreateRegionPayload;
  setFormData: React.Dispatch<React.SetStateAction<CreateRegionPayload>>;
  isEdit?: boolean;
  isSaving?: boolean;
}

export const RegionModal: React.FC<RegionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  isEdit = false,
  isSaving = false,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier' : 'Ajouter'} une région</DialogTitle>
          <DialogDescription>
            Régions du Sénégal (hors Dakar)
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="region-name">Nom de la région *</Label>
            <Input
              id="region-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Saint-Louis, Thiès..."
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="region-price">Prix de livraison (FCFA) *</Label>
            <Input
              id="region-price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
              min="0"
              step="100"
            />
          </div>

          <div>
            <Label htmlFor="region-time-min">Délai min (jours) *</Label>
            <Input
              id="region-time-min"
              type="number"
              value={formData.deliveryTimeMin}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMin: parseInt(e.target.value) || 0 }))}
              placeholder="Ex: 3"
            />
          </div>

          <div>
            <Label htmlFor="region-time-max">Délai max (jours) *</Label>
            <Input
              id="region-time-max"
              type="number"
              value={formData.deliveryTimeMax}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMax: parseInt(e.target.value) || 0 }))}
              placeholder="Ex: 5"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="region-time-unit">Unité de temps</Label>
            <Select
              value={formData.deliveryTimeUnit}
              onValueChange={(value: 'heures' | 'jours') => setFormData(prev => ({ ...prev, deliveryTimeUnit: value }))}
            >
              <SelectTrigger id="region-time-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="heures">Heures</SelectItem>
                <SelectItem value="jours">Jours</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="col-span-2">
            <Label htmlFor="region-cities">Principales villes</Label>
            <Input
              id="region-cities"
              value={formData.mainCities}
              onChange={(e) => setFormData(prev => ({ ...prev, mainCities: e.target.value }))}
              placeholder="Ex: Saint-Louis, Dagana, Richard-Toll..."
            />
            <p className="text-xs text-gray-500 mt-1">Séparez les villes par des virgules</p>
          </div>

          <div className="col-span-2">
            <Label htmlFor="region-status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="region-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ========================================
// Modal Zone Internationale
// ========================================

interface ZoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  formData: CreateInternationalZonePayload;
  setFormData: React.Dispatch<React.SetStateAction<CreateInternationalZonePayload>>;
  countryInput: string;
  setCountryInput: React.Dispatch<React.SetStateAction<string>>;
  onAddCountry: () => void;
  onRemoveCountry: (country: string) => void;
  isEdit?: boolean;
  isSaving?: boolean;
}

export const ZoneModal: React.FC<ZoneModalProps> = ({
  isOpen,
  onClose,
  onSave,
  formData,
  setFormData,
  countryInput,
  setCountryInput,
  onAddCountry,
  onRemoveCountry,
  isEdit = false,
  isSaving = false,
}) => {
  // Extraire les noms de pays déjà ajoutés (gérer format objet ou string)
  const addedCountryNames = formData.countries.map((c: string | any) =>
    typeof c === 'string' ? c : c.country || c
  );

  // Filtrer les pays disponibles (non encore ajoutés)
  const availableCountries = COUNTRIES.map(c => c.name).filter(
    country => !addedCountryNames.includes(country)
  );

  // Filtrer selon ce que l'utilisateur tape
  const filteredCountries = availableCountries.filter(country =>
    country.toLowerCase().includes(countryInput.toLowerCase())
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier' : 'Ajouter'} une zone internationale</DialogTitle>
          <DialogDescription>
            Zones de livraison hors Sénégal
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="zone-name">Nom de la zone *</Label>
            <Input
              id="zone-name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Afrique de l'Ouest, Europe..."
            />
          </div>

          <div className="col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Note :</strong> Les prix de livraison pour cette zone seront définis par transporteur dans l'onglet <strong>Tarifs</strong>.
            </p>
          </div>

          <div>
            <Label htmlFor="zone-time-min">Délai min (jours) *</Label>
            <Input
              id="zone-time-min"
              type="number"
              value={formData.deliveryTimeMin}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMin: parseInt(e.target.value) || 0 }))}
              placeholder="Ex: 7"
            />
          </div>

          <div>
            <Label htmlFor="zone-time-max">Délai max (jours) *</Label>
            <Input
              id="zone-time-max"
              type="number"
              value={formData.deliveryTimeMax}
              onChange={(e) => setFormData(prev => ({ ...prev, deliveryTimeMax: parseInt(e.target.value) || 0 }))}
              placeholder="Ex: 14"
            />
          </div>

          <div className="col-span-2">
            <div className="flex items-center justify-between mb-1">
              <Label htmlFor="zone-countries">Pays couverts</Label>
              <span className="text-xs text-gray-500">
                {formData.countries.length} pays sélectionné{formData.countries.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Champ de saisie avec autocomplétion */}
            <div className="relative">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="text"
                    placeholder="Saisir le nom d'un pays..."
                    value={countryInput}
                    onChange={(e) => setCountryInput(e.target.value)}
                    className="w-full"
                  />

                  {/* Liste de suggestions qui apparaît quand on tape */}
                  {countryInput && filteredCountries.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-[200px] overflow-y-auto">
                      {filteredCountries.slice(0, 50).map((country) => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => {
                            setCountryInput(country);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 text-sm"
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  onClick={onAddCountry}
                  size="sm"
                  disabled={!countryInput || !COUNTRIES.map(c => c.name).includes(countryInput)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {countryInput && filteredCountries.length === 0 && !addedCountryNames.includes(countryInput) && (
                <p className="text-xs text-amber-600 mt-1">
                  Aucun pays trouvé avec "{countryInput}"
                </p>
              )}
            </div>

            {formData.countries.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.countries.map((country, index) => {
                  // Gérer à la fois le format objet {id, zoneId, country} et string
                  const countryName = typeof country === 'string' ? country : (country as any).country || country;
                  return (
                    <Badge key={index} variant="secondary" className="pl-3 pr-1">
                      {countryName}
                      <button
                        type="button"
                        onClick={() => onRemoveCountry(countryName)}
                        className="ml-2 hover:text-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-span-2">
            <Label htmlFor="zone-status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger id="zone-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Annuler</Button>
          <Button onClick={onSave} disabled={formData.countries.length === 0 || isSaving}>
            {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {isEdit ? 'Modifier' : 'Ajouter'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

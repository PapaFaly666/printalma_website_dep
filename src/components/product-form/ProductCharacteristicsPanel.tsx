import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Tag, Layers } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ProductCharacteristicsPanelProps {
  characteristics: string[];
  onCharacteristicsUpdate: (characteristics: string[]) => void;
}

export const ProductCharacteristicsPanel: React.FC<ProductCharacteristicsPanelProps> = ({
  characteristics = [],
  onCharacteristicsUpdate,
}) => {
  const [newCharacteristic, setNewCharacteristic] = useState('');

  const handleAddCharacteristic = () => {
    if (newCharacteristic.trim()) {
      const updated = [...characteristics, newCharacteristic.trim()];
      onCharacteristicsUpdate(updated);
      setNewCharacteristic('');
    }
  };

  const handleRemoveCharacteristic = (index: number) => {
    const updated = characteristics.filter((_, i) => i !== index);
    onCharacteristicsUpdate(updated);
  };

  const suggestedCharacteristics = [
    'Vêtements', 'Accessoires', 'Sport', 'Casual', 'Professionnel', 
    'Été', 'Hiver', 'Enfants', 'Adultes', 'Unisexe'
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      className="space-y-6"
    >
      <Card className="shadow-lg border-none">
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold text-gray-800 dark:text-gray-100">
            <Tag className="mr-3 text-purple-500" />
            Caractéristiques du Produit
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Characteristics Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center">
              <Layers className="mr-2 text-indigo-500" />
              Caractéristiques
            </h3>
            <div className="flex gap-2">
              <Input
                value={newCharacteristic}
                onChange={(e) => setNewCharacteristic(e.target.value)}
                placeholder="Ajouter une caractéristique..."
                onKeyPress={(e) => e.key === 'Enter' && handleAddCharacteristic()}
                className="flex-1"
              />
              <Button 
                onClick={handleAddCharacteristic}
                size="sm"
                className="px-3"
                disabled={!newCharacteristic.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <AnimatePresence>
              {characteristics.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Caractéristiques sélectionnées :
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {characteristics.map((characteristic, index) => (
                      <motion.div
                        key={characteristic}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Badge 
                          variant="secondary" 
                          className="flex items-center gap-1 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
                          onClick={() => handleRemoveCharacteristic(index)}
                        >
                          {characteristic}
                          <X className="h-3 w-3" />
                        </Badge>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Suggestions :
              </p>
              <div className="flex flex-wrap gap-2">
                {suggestedCharacteristics
                  .filter(char => !characteristics.includes(char))
                  .map((characteristic) => (
                    <Badge 
                      key={characteristic}
                      variant="outline" 
                      className="cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900 transition-colors"
                      onClick={() => {
                        const updated = [...characteristics, characteristic];
                        onCharacteristicsUpdate(updated);
                      }}
                    >
                      {characteristic}
                    </Badge>
                  ))
                }
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}; 
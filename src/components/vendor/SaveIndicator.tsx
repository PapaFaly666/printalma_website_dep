import React from 'react';
import { Badge } from '../ui/badge';
import { Clock, Save, AlertCircle } from 'lucide-react';

interface SaveIndicatorProps {
  lastSaved: Date | null;
  hasPosition: boolean;
  className?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  lastSaved,
  hasPosition,
  className = ''
}) => {
  if (!hasPosition) {
    return (
      <Badge variant="outline" className={`${className} text-gray-500`}>
        <AlertCircle className="h-3 w-3 mr-1" />
        Aucune sauvegarde
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className={`${className} text-green-600`}>
      <Save className="h-3 w-3 mr-1" />
      Sauvegardé à {lastSaved?.toLocaleTimeString() || 'inconnue'}
    </Badge>
  );
};

export default SaveIndicator; 
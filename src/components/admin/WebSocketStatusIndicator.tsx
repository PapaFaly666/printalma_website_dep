import React from 'react';
import { useWebSocket } from '../../hooks/useWebSocket';
import { Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { Badge } from '../ui/badge';

interface WebSocketStatusIndicatorProps {
  showText?: boolean;
  className?: string;
}

export const WebSocketStatusIndicator: React.FC<WebSocketStatusIndicatorProps> = ({
  showText = true,
  className = ''
}) => {
  const { isConnected, connectionStatus, lastActivity, isAdmin } = useWebSocket();

  // Ne pas afficher si pas admin
  if (!isAdmin) {
    return null;
  }

  const getStatusConfig = () => {
    switch (connectionStatus) {
      case 'connected':
        return {
          icon: Wifi,
          color: 'bg-green-100 text-green-800 border-green-200',
          text: 'Temps réel',
          animate: false
        };
      case 'connecting':
        return {
          icon: RefreshCw,
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          text: 'Connexion...',
          animate: true
        };
      case 'error':
        return {
          icon: AlertTriangle,
          color: 'bg-red-100 text-red-800 border-red-200',
          text: 'Erreur',
          animate: false
        };
      default:
        return {
          icon: WifiOff,
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          text: 'Hors ligne',
          animate: false
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${className}`}
      title={lastActivity ? `Dernière activité: ${lastActivity.toLocaleTimeString('fr-FR')}` : ''}
    >
      <Icon className={`h-3 w-3 ${config.animate ? 'animate-spin' : ''} ${showText ? 'mr-1' : ''}`} />
      {showText && config.text}
    </Badge>
  );
}; 
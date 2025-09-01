import React from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Badge } from './ui/badge';

const NotificationBadge: React.FC = () => {
  const { unreadCount } = useNotifications();
  
  if (unreadCount === 0) return null;
  
  return (
    <Badge 
      variant="destructive" 
      className="ml-2 animate-pulse"
    >
      {unreadCount > 99 ? '99+' : unreadCount}
    </Badge>
  );
};

export default NotificationBadge; 
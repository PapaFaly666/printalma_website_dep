// Types de notifications basés sur la documentation API
export enum NotificationType {
  ORDER_NEW = 'ORDER_NEW',
  ORDER_UPDATED = 'ORDER_UPDATED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  PAYMENT_SUCCESS = 'PAYMENT_SUCCESS',
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  SYSTEM = 'SYSTEM',
  INFO = 'INFO'
}

export interface NotificationMetadata {
  orderId?: number;
  orderNumber?: string;
  amount?: number;
  customer?: string;
  itemsCount?: number;
  oldStatus?: string;
  newStatus?: string;
  [key: string]: any;
}

export interface BackendNotification {
  id: number;
  userId: number;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  metadata?: NotificationMetadata;
  createdAt: string;
  expiresAt?: string;
}

export interface NotificationListResponse {
  success: boolean;
  data: BackendNotification[];
  unreadCount: number;
  metadata: {
    limit: number;
    includeRead: boolean;
    total: number;
  };
}

export interface NotificationCountResponse {
  success: boolean;
  unreadCount: number;
}

export interface NotificationActionResponse {
  success: boolean;
  message: string;
  updatedCount?: number;
  deletedCount?: number;
}

// Types pour les événements WebSocket
export interface NewOrderNotificationData {
  type: 'NEW_ORDER_NOTIFICATION';
  notification: BackendNotification;
  orderData: {
    orderId: number;
    orderNumber: string;
    totalAmount: number;
    customer: string;
    itemsCount: number;
  };
  timestamp: string;
}

export interface OrderUpdateNotificationData {
  type: 'ORDER_UPDATE_NOTIFICATION';
  notification: BackendNotification;
  orderData: {
    orderId: number;
    orderNumber: string;
    oldStatus: string;
    newStatus: string;
  };
  timestamp: string;
}

export interface SystemNotificationData {
  type: 'SYSTEM_NOTIFICATION';
  notification: BackendNotification;
  timestamp: string;
}

export interface WebSocketStats {
  connectedAdmins: number;
  connectedUsers: number;
  yourRole: string;
  timestamp: string;
}

export interface WebSocketPongResponse {
  message: string;
  timestamp: string;
  service: string;
}

export type WebSocketEventData =
  | NewOrderNotificationData
  | OrderUpdateNotificationData
  | SystemNotificationData
  | WebSocketStats
  | WebSocketPongResponse
  | { type: 'CONNECTED'; userId: number; role: string; timestamp: string; message: string }
  | { type: 'DISCONNECTED'; message: string };
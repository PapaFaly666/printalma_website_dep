export type OrderStatus = 
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentMethod = 
  | 'CASH_ON_DELIVERY'
  | 'BANK_TRANSFER'
  | 'MOBILE_MONEY'
  | 'CREDIT_CARD'
  | 'WAVE'
  | 'wave'
  | 'orange'
  | 'ORANGE';

export interface ShippingAddressObjectDto {
  name?: string;
  firstName?: string;
  lastName?: string;
  street: string;
  address?: string;
  address2?: string;
  city: string;
  region: string;
  postalCode?: string;
  country: string;
  fullFormatted: string;
  company?: string;
  apartment?: string;
  phone?: string;
}

export interface UserInOrderDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  photo_profil?: string;
}

export interface ValidatorDto {
  id: number;
  firstName: string;
  lastName: string;
}

export interface ProductViewDto {
  id: number;
  viewType: string;
  imageUrl: string;
  description?: string;
}

export interface ColorInProductDto {
  id: number;
  name: string;
  hexCode?: string;
  imageUrl?: string;
}

export interface SizeInProductDto {
  id: number;
  name: string;
}

export interface ProductInOrderDto {
  id: number;
  name: string;
  description?: string;
  price: number;
  designName?: string;
  designDescription?: string;
  designImageUrl?: string;
  categoryId?: number;
  categoryName?: string;
  orderedColorName?: string;
  orderedColorHexCode?: string;
  orderedColorImageUrl?: string;
}

export interface OrderItemDto {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice?: number;
  size?: string;
  color?: string;
  colorId?: number;
  selectedColor?: ColorInProductDto;
  product?: ProductInOrderDto;
  productId?: number;
  productName?: string;
  productImage?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  user: UserInOrderDto;
  status: OrderStatus;
  totalAmount: number;
  subtotal?: number;
  taxAmount?: number;
  shippingAmount?: number;
  paymentMethod?: PaymentMethod;
  shippingAddress: ShippingAddressObjectDto;
  billingAddress?: ShippingAddressObjectDto;
  phoneNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  validatedAt?: string;
  validatedBy?: number;
  validator?: ValidatorDto;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  orderItems: OrderItemDto[];
}

export interface CreateOrderDto {
  shippingAddress: string;
  phoneNumber: string;
  notes?: string;
  orderItems: {
    productId: number;
    quantity: number;
    size?: string;
    color?: string;
    colorId?: number;
  }[];
}

export interface OrderFilters {
  page?: number;
  limit?: number;
  status?: OrderStatus;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AdminOrderFilters extends OrderFilters {
  userEmail?: string;
  orderNumber?: string;
  userId?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface OrderStatistics {
  totalOrders: number;
  revenue: {
    total: number;
    monthly: number;
  };
  ordersCount: {
    today: number;
    week: number;
    month: number;
  };
  ordersByStatus: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    rejected?: number;
  };
}

export interface BackendOrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue?: number;
  ordersToday: number;
  revenueToday?: number;
  revenueThisMonth?: number;
  ordersThisWeek?: number;
  ordersThisMonth?: number;
  pendingOrders: number;
  confirmedOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  rejectedOrders?: number;
}

export interface OrderPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface OrderResponse {
  orders: Order[];
  pagination: OrderPagination;
}

export interface CartItem {
  productId: number;
  productName: string;
  quantity: number;
  price: number;
  selectedSize?: string;
  selectedColor?: string;
  selectedColorId?: number;
  selectedColorObject?: {
    id: number;
    name: string;
    hexCode?: string;
    imageUrl?: string;
  };
  customizations?: Record<string, any>;
}

export interface OrderTotals {
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  totalAmount: number;
  freeShipping: boolean;
} 
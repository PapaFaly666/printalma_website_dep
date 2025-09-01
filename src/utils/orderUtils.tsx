import React, { JSX } from 'react';
import { OrderStatus } from '../types/order';
import { Clock, CheckCircle, Package, Truck, Home, XCircle, AlertCircle } from 'lucide-react';

export const getStatusColor = (status: OrderStatus): string => {
  const colors = {
    'PENDING': 'bg-gray-100 text-gray-800 border-gray-200',
    'CONFIRMED': 'bg-gray-200 text-gray-900 border-gray-300',
    'PROCESSING': 'bg-gray-800 text-white border-gray-800',
    'SHIPPED': 'bg-gray-900 text-white border-gray-900',
    'DELIVERED': 'bg-black text-white border-black',
    'CANCELLED': 'bg-gray-300 text-gray-700 border-gray-300',
    'REJECTED': 'bg-gray-400 text-white border-gray-400'
  };
  return colors[status] || colors.PENDING;
};

export const getStatusIcon = (status: OrderStatus): JSX.Element => {
  const icons = {
    'PENDING': Clock,
    'CONFIRMED': CheckCircle,
    'PROCESSING': Package,
    'SHIPPED': Truck,
    'DELIVERED': Home,
    'CANCELLED': XCircle,
    'REJECTED': AlertCircle
  };
  const IconComponent = icons[status] || Clock;
  return <IconComponent className="h-4 w-4" />;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-SN', {
    style: 'decimal',
    minimumFractionDigits: 0
  }).format(amount || 0) + ' FCFA';
};

export const getStatusLabel = (status: OrderStatus): string => {
  const labels = {
    'PENDING': 'En attente',
    'CONFIRMED': 'Confirmée',
    'PROCESSING': 'En traitement',
    'SHIPPED': 'Expédiée',
    'DELIVERED': 'Livrée',
    'CANCELLED': 'Annulée',
    'REJECTED': 'Rejetée'
  };
  return labels[status] || status;
};

// Vous pouvez ajouter d'autres fonctions utilitaires liées aux commandes ici 

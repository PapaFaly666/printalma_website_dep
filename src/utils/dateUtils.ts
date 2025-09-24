// utils/dateUtils.ts
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Non définie';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

export const formatDateShort = (dateString?: string): string => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(date);
};

export const calculateDuration = (startDate?: string, endDate?: string): string => {
  if (!startDate || !endDate) return '-';

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();

  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}j ${diffHours % 24}h`;
  }

  return diffHours > 0 ? `${diffHours}h ${diffMinutes}m` : `${diffMinutes}m`;
};

export const getStatusIcon = (status: string): string => {
  switch (status) {
    case 'PENDING': return '⏳';
    case 'APPROVED': return '✅';
    case 'REJECTED': return '❌';
    case 'PAID': return '💰';
    default: return '📋';
  }
};

export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'PENDING': return 'text-yellow-600 bg-yellow-100';
    case 'APPROVED': return 'text-green-600 bg-green-100';
    case 'REJECTED': return 'text-red-600 bg-red-100';
    case 'PAID': return 'text-blue-600 bg-blue-100';
    default: return 'text-gray-600 bg-gray-100';
  }
};
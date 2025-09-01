// Types pour l'administration des produits vendeurs
export interface VendorMiniInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  shop_name?: string | null;
  phone?: string | null;
  profile_photo_url?: string | null;
  country?: string | null;
  address?: string | null;
}

export interface VendorProductListItem {
  id: number;
  vendorId: number;
  vendorName: string;
  price: number;
  status: 'PUBLISHED' | 'DRAFT';
  images: {
    primaryImageUrl?: string | null;
  };
  vendor: VendorMiniInfo;
} 
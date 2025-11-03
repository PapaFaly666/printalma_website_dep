export interface Designer {
  id: number;
  name: string;
  displayName?: string;
  bio?: string;
  avatarUrl: string;
  isActive: boolean;
  sortOrder: number;
  featuredOrder?: number | null;
  isFeatured?: boolean;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

export interface CreateDesignerData {
  name: string;
  displayName?: string;
  bio?: string;
  avatar: File | null;
  isActive?: boolean;
  sortOrder?: number;
}

export interface UpdateDesignerData {
  name?: string;
  displayName?: string;
  bio?: string;
  avatar?: File | null;
  removeAvatar?: boolean;
  isActive?: boolean;
  sortOrder?: number;
  isFeatured?: boolean;
  featuredOrder?: number;
}

export interface DesignersResponse {
  designers: Designer[];
  total: number;
}
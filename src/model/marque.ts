export interface Marque {
    trending: boolean;
    isNew: boolean;
    rating: string;
    followers: number;
    products: number;
    id: number;
    name: string;
    event: string;
    image: string;
    category?: string; // Ensure this property is included
    description?: string; // Ensure this property is included
  }
  
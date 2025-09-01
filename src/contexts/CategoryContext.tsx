import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Category } from '../schemas/category.schema';
import { fetchCategories, createCategory, updateCategory, deleteCategory } from '../services/api';
import { toast } from "sonner";

interface CategoryContextProps {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<Category[]>;
  addCategory: (name: string, description?: string) => Promise<Category | null>;
  editCategory: (id: number, name: string, description?: string) => Promise<Category | null>;
  removeCategory: (id: number) => Promise<boolean>;
}

const CategoryContext = createContext<CategoryContextProps | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Chargement initial des catégories
  useEffect(() => {
    refreshCategories();
  }, []);

  // Fonction pour rafraîchir les données
  const refreshCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await fetchCategories();
      setCategories(data);
      return data;
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Impossible de charger les catégories.');
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour ajouter une catégorie
  const addCategory = async (name: string, description?: string): Promise<Category | null> => {
    try {
      const newCategory = await createCategory({
        name: name.trim(),
        description: description?.trim()
      });
      
      setCategories(prev => [...prev, newCategory]);
      toast.success('Catégorie ajoutée', {
        description: `La catégorie "${newCategory.name}" a été ajoutée avec succès.`
      });
      
      return newCategory;
    } catch (err) {
      console.error('Error creating category:', err);
      toast.error('Erreur', {
        description: 'Impossible d\'ajouter la catégorie. Veuillez réessayer.'
      });
      return null;
    }
  };

  // Fonction pour modifier une catégorie
  const editCategory = async (id: number, name: string, description?: string): Promise<Category | null> => {
    try {
      const updatedCategory = await updateCategory(id, {
        name: name.trim(),
        description: description?.trim()
      });
      
      setCategories(prev => 
        prev.map(cat => cat.id === id ? updatedCategory : cat)
      );
      
      toast.success('Catégorie modifiée', {
        description: `La catégorie "${updatedCategory.name}" a été modifiée avec succès.`
      });
      
      return updatedCategory;
    } catch (err) {
      console.error('Error updating category:', err);
      toast.error('Erreur', {
        description: 'Impossible de modifier la catégorie. Veuillez réessayer.'
      });
      return null;
    }
  };

  // Fonction pour supprimer une catégorie
  const removeCategory = async (id: number): Promise<boolean> => {
    try {
      await deleteCategory(id);
      
      setCategories(prev => prev.filter(cat => cat.id !== id));
      
      return true;
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Erreur', {
        description: 'Impossible de supprimer la catégorie. Veuillez réessayer.'
      });
      return false;
    }
  };

  const value = {
    categories,
    loading,
    error,
    refreshCategories,
    addCategory,
    editCategory,
    removeCategory
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}; 
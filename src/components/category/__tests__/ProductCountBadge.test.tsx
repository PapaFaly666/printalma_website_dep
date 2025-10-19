/**
 * Tests unitaires pour ProductCountBadge
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ProductCountBadge } from '../ProductCountBadge';
import { categoryProtectionService } from '../../../services/categoryProtectionService';

// Mock du service
vi.mock('../../../services/categoryProtectionService', () => ({
  categoryProtectionService: {
    canDeleteCategory: vi.fn(),
    canDeleteSubCategory: vi.fn(),
    canDeleteVariation: vi.fn()
  }
}));

describe('ProductCountBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('affiche "Chargement" pendant le chargement', () => {
    vi.mocked(categoryProtectionService.canDeleteCategory).mockImplementation(
      () => new Promise(() => {}) // Promise qui ne se résout jamais
    );

    render(<ProductCountBadge id={1} type="category" />);

    expect(screen.getByText('...')).toBeInTheDocument();
  });

  it('affiche "Aucun produit" quand le compteur est à 0', async () => {
    vi.mocked(categoryProtectionService.canDeleteCategory).mockResolvedValue({
      success: true,
      data: {
        canDelete: true,
        categoryId: 1,
        categoryName: 'Test',
        blockers: { total: 0 },
        message: 'Peut être supprimé'
      }
    });

    render(<ProductCountBadge id={1} type="category" />);

    await waitFor(() => {
      expect(screen.getByText('Aucun produit')).toBeInTheDocument();
    });
  });

  it('affiche le nombre de produits quand il y en a', async () => {
    vi.mocked(categoryProtectionService.canDeleteCategory).mockResolvedValue({
      success: true,
      data: {
        canDelete: false,
        categoryId: 1,
        categoryName: 'Test',
        blockers: { total: 5 },
        message: 'Ne peut pas être supprimé'
      }
    });

    render(<ProductCountBadge id={1} type="category" />);

    await waitFor(() => {
      expect(screen.getByText('5 produits')).toBeInTheDocument();
    });
  });

  it('affiche "1 produit" au singulier', async () => {
    vi.mocked(categoryProtectionService.canDeleteCategory).mockResolvedValue({
      success: true,
      data: {
        canDelete: false,
        categoryId: 1,
        categoryName: 'Test',
        blockers: { total: 1 },
        message: 'Ne peut pas être supprimé'
      }
    });

    render(<ProductCountBadge id={1} type="category" />);

    await waitFor(() => {
      expect(screen.getByText('1 produit')).toBeInTheDocument();
    });
  });

  it('appelle le bon service pour les sous-catégories', async () => {
    vi.mocked(categoryProtectionService.canDeleteSubCategory).mockResolvedValue({
      success: true,
      data: {
        canDelete: true,
        subCategoryId: 2,
        subCategoryName: 'Test Sub',
        blockers: { total: 0 },
        message: 'Peut être supprimé'
      }
    });

    render(<ProductCountBadge id={2} type="subcategory" />);

    await waitFor(() => {
      expect(categoryProtectionService.canDeleteSubCategory).toHaveBeenCalledWith(2);
    });
  });

  it('appelle le bon service pour les variations', async () => {
    vi.mocked(categoryProtectionService.canDeleteVariation).mockResolvedValue({
      success: true,
      data: {
        canDelete: true,
        variationId: 3,
        variationName: 'Test Variation',
        blockers: { productsCount: 0 },
        message: 'Peut être supprimé'
      }
    });

    render(<ProductCountBadge id={3} type="variation" />);

    await waitFor(() => {
      expect(categoryProtectionService.canDeleteVariation).toHaveBeenCalledWith(3);
    });
  });

  it('gère les erreurs gracieusement', async () => {
    vi.mocked(categoryProtectionService.canDeleteCategory).mockRejectedValue(
      new Error('Erreur réseau')
    );

    render(<ProductCountBadge id={1} type="category" />);

    await waitFor(() => {
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });
});

import { useEffect, useState } from 'react';
import { Designer } from '../../services/designerService';
import designerService from '../../services/designerService';

interface FeaturedDesignersProps {
  className?: string;
}

export function FeaturedDesigners({ className = '' }: FeaturedDesignersProps) {
  const [designers, setDesigners] = useState<Designer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDesigners = async () => {
      try {
        const featuredDesigners = await designerService.getFeaturedDesigners();
        setDesigners(featuredDesigners);
      } catch (error) {
        console.error('Erreur lors du chargement des designers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDesigners();
  }, []);

  if (loading) {
    return (
      <section className={`py-16 ${className}`}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Chargement des designers...</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`py-16 ${className}`}>
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Nos Designers
        </h2>

        {designers.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Aucun designer disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {designers.map(designer => (
              <div key={designer.id} className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
                {/* Avatar */}
                <div className="flex justify-center mb-4">
                  {designer.avatarUrl ? (
                    <img
                      src={designer.avatarUrl}
                      alt={designer.name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-gray-200"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-2xl font-bold text-gray-500">
                        {(designer.displayName || designer.name).charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Nom */}
                <h3 className="text-xl font-semibold text-center mb-2">
                  {designer.displayName || designer.name}
                </h3>

                {/* Bio */}
                {designer.bio && (
                  <p className="text-gray-600 text-sm text-center leading-relaxed">
                    {designer.bio}
                  </p>
                )}

                {/* Badge statut */}
                <div className="flex justify-center mt-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    designer.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {designer.isActive ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default FeaturedDesigners;
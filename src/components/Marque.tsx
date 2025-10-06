import { useState } from 'react';

const Marque = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      id: 1,
      title: "Créez votre marque",
      description: "Développez votre identité et votre présence en ligne",
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
        </svg>
      )
    },
    {
      id: 2,
      title: "Importez vos designs",
      description: "Ajoutez facilement vos créations sur notre plateforme",
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
        </svg>
      )
    },
    {
      id: 3,
      title: "Vendez vos produits",
      description: "Touchez une clientèle plus large grâce à notre réseau",
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      )
    },
    {
      id: 4,
      title: "Gagnez de l'argent",
      description: "Profitez d'une rémunération équitable pour chaque vente",
      icon: (
        <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <section className="w-full bg-gray-50 py-8 sm:py-12 md:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          {/* Left column with features */}
          <div className="relative order-2 lg:order-1">
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden w-full">
              <div className="space-y-px">
                {features.map((feature) => (
                  <div
                    key={feature.id}
                    className={`p-4 sm:p-5 md:p-6 transition-colors duration-200 ${hoveredFeature === feature.id
                        ? 'bg-gray-50'
                        : 'bg-white'
                      }`}
                    onMouseEnter={() => setHoveredFeature(feature.id)}
                    onMouseLeave={() => setHoveredFeature(null)}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="mt-0.5 sm:mt-1 text-gray-700">
                        {feature.icon}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-medium text-gray-900">{feature.title}</h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1">{feature.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right column with text and CTA */}
          <div className="lg:pl-4 xl:pl-8 order-1 lg:order-2">
            <h2 className="text-2xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-2 sm:mb-4">Vous possédez une marque?</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 md:mb-8 max-w-xl">
              Nous vous assurons une gestion complète de votre business. Observez et laissez Printalma se charger de tout.
            </p>

            <a
              href="#"
              className="inline-flex items-center px-4 sm:px-5 py-1.5 sm:py-2 bg-black text-white text-sm font-medium rounded hover:bg-gray-800 transition-colors duration-200"
            >
              Je m'inscris
              <svg className="ml-1.5 sm:ml-2 w-3 h-3 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Marque;
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';
import Button from '../components/ui/Button';

export default function BecomeVendorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Fond gris avec titre noir */}
      <section className="relative bg-gray-400 py-10 lg:py-14">
        {/* Bande de couleur en haut */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-red-500"></div>

        {/* Container principal avec même padding que NavBar */}
        <div className="w-full px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Titre principal avec soulignement */}
            <div className="mb-6">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-black mb-2 italic font-bold" style={{ fontStyle: 'italic' }}>
                CREER, VENDEZ
              </h1>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-black italic font-bold" style={{ fontStyle: 'italic' }}>
                PROSPERER !
              </h1>
              {/* Trait de soulignement courbé */}
              <div className="flex justify-center mt-2">
                <img
                  src="/landing_Fichcvfoier.svg"
                  alt="Soulignement"
                  className="w-40 sm:w-48 md:w-64 lg:w-80 xl:w-96 transition-all duration-1000 filter brightness-0"
                  style={{
                    filter: 'brightness(0)',
                    opacity: 0.9,
                    margin: '0 auto',
                    transform: 'translateX(10px) translateY(-8px)'
                  }}
                />
              </div>
            </div>

            {/* Sous-titre */}
            <p className="text-xl sm:text-2xl text-black mb-6 italic font-bold">
              Devenez partenaire printalma et vendez<br />
              vos design sur tout nos produits.
            </p>

            {/* Bouton CTA */}
            <Button
              onClick={() => navigate('/vendeur/register')}
              variant="primary"
              size="lg"
            >
              Je me lance !
            </Button>
          </div>
        </div>
      </section>

      {/* Section avec deux colonnes - Image + Contenu jaune */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="w-full px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-stretch">

            {/* Colonne gauche - Image mockup */}
            <div className="order-2 lg:order-1 h-[600px] rounded-2xl overflow-hidden">
              <img
                src="/Asset 22@200x-100.jpg"
                alt="Mockup boutique en ligne"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Colonne droite - Encadré jaune */}
            <div className="order-1 lg:order-2 h-[600px]">
              <div className="bg-yellow-400 rounded-2xl p-5 sm:p-6 lg:p-7 shadow-lg flex flex-col justify-between h-full">
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-black mb-4 sm:mb-5 italic text-center">
                    Designer , Artiste ou influancer,<br />
                    Créé ta boutique et gagne de<br />
                    l'argent.
                  </h2>

                  {/* Illustrations produits */}
                  <div className="flex justify-center items-center gap-6 sm:gap-8 lg:gap-10 mb-4 sm:mb-5">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded transform rotate-12 flex items-center justify-center -mt-6 sm:-mt-8">
                      <img src="/Asset 24.svg" alt="Package" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-28 h-28 sm:w-32 sm:h-32 lg:w-36 lg:h-36 rounded-lg flex items-center justify-center">
                      <img src="/Asset 23.svg" alt="T-shirt" className="w-full h-full object-contain" />
                    </div>
                    <div className="w-24 h-24 sm:w-28 sm:h-28 lg:w-32 lg:h-32 rounded transform -rotate-12 flex items-center justify-center -mt-6 sm:-mt-8">
                      <img src="/Asset 25.svg" alt="Palette" className="w-full h-full object-contain" />
                    </div>
                  </div>

                  {/* Liste numérotée */}
                  <div className="mb-2 mx-auto w-fit text-left">
                    <p className="text-black text-lg sm:text-xl lg:text-2xl font-medium italic">1.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Lorem ipsum dolor sit amet,</p>
                    <p className="text-black text-lg sm:text-xl lg:text-2xl font-medium italic">2.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;consectetuer adipiscing elit,</p>
                    <p className="text-black text-lg sm:text-xl lg:text-2xl font-medium italic">3.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;sed diam nonummy nibh euismod</p>
                    <p className="text-black text-lg sm:text-xl lg:text-2xl font-medium italic">4.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;incidunt ut laoreet dolore magna</p>
                  </div>
                </div>

                {/* Bouton */}
                <div className="text-center mt-auto">
                  <Button
                    variant="secondary"
                    size="lg"
                    className="bg-white hover:bg-gray-100 text-black border-2 border-gray-300"
                  >
                    Plus de détails
                  </Button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Section Mettez vos designs en vente */}
      <section className="py-0 bg-white">
        <div className="w-full px-10 lg:px-16 xl:px-20 2xl:px-24 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-black mb-4 italic">
            Mettez vos design en vente<br />
            sur plusieurs produits !
          </h2>

          <p className="text-base sm:text-lg text-black mb-12 italic font-bold">
            Creer votre E-shop marketplace, uploaderr vos<br />
            design sur les produits , et vendez vos produits sans dépenser de l'argent.
          </p>

          {/* Carrousel de produits avec carrés roses */}
          <div className="relative mb-16">
            {/* Container avec espace pour les boutons */}
            <div className="relative">
              {/* Carrés produits - Responsive sans overflow hidden */}
              <div className="overflow-x-visible">
                <div className="flex justify-center items-center gap-3 sm:gap-4 md:gap-5 lg:gap-7 pb-4 px-18 sm:px-22 md:px-26">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="relative flex-shrink-0 w-54 h-64 sm:w-62 sm:h-72 md:w-68 md:h-80 lg:w-76 lg:h-96 xl:w-88 xl:h-[28rem]"
                    >
                      <div className="w-full h-full bg-pink-500 rounded-lg border-4 border-white shadow-lg relative overflow-hidden">
                        {/* Diagonales blanches */}
                        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <line x1="0" y1="0" x2="100" y2="100" stroke="white" strokeWidth="1" opacity="0.5" />
                          <line x1="100" y1="0" x2="0" y2="100" stroke="white" strokeWidth="1" opacity="0.5" />
                        </svg>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Boutons de navigation - Positionnés en absolu */}
              <button className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-lg z-10">
                <span className="text-gray-700 text-2xl sm:text-3xl lg:text-4xl font-bold">‹</span>
              </button>
              <button className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center hover:bg-gray-100 hover:border-gray-400 transition-all duration-200 shadow-lg z-10">
                <span className="text-gray-700 text-2xl sm:text-3xl lg:text-4xl font-bold">›</span>
              </button>
            </div>
          </div>

          {/* Section rouge - On s'occupe de tout */}
          <div className="bg-red-500 rounded-2xl py-12 px-8">
            <h3 className="text-3xl sm:text-4xl font-black text-white mb-8 italic">
              On s'occupe de tout, de A à Z.
            </h3>

            {/* Services Grid */}
            <div className="grid grid-cols-3 md:grid-cols-6 gap-6 mb-8">
              {[
                { icon: '🖨️', name: 'Impression' },
                { icon: '📦', name: 'Stockage' },
                { icon: '⚙️', name: 'Traitement' },
                { icon: '🚚', name: 'livraison' },
                { icon: '💳', name: 'paiements' },
                { icon: '💬', name: 'Service client' }
              ].map((service) => (
                <div key={service.name} className="text-center">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                    <span className="text-2xl">{service.icon}</span>
                  </div>
                  <p className="text-white text-xs sm:text-sm font-medium italic">{service.name}</p>
                </div>
              ))}
            </div>

            {/* Bouton */}
            <button
              onClick={() => navigate('/vendeur/register')}
              className="bg-white hover:bg-gray-100 text-black font-bold text-sm px-8 py-2 rounded shadow-lg hover:shadow-xl transition-all duration-300"
            >
              se renseigner
            </button>
          </div>
        </div>
      </section>



      {/* Section Témoignages - Grille 2x2 */}
      {/* Section Témoignages - Grille horizontale 4 cartes */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="w-full px-10 lg:px-16 xl:px-20 2xl:px-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { name: 'Khalil', title: 'Graphiste Designer' },
              { name: 'Tanor Custom', title: 'Designer' },
              { name: 'Fatou Fall', title: 'Influencer' },
              { name: 'Bmjaay', title: 'Artiste Rappeur' }
            ].map((person, index) => (
              <div key={index} className="bg-white border-2 border-gray-200 rounded-xl p-10 shadow-md hover:shadow-xl transition-all duration-300 min-h-[500px] flex flex-col">
                <div className="flex flex-col items-center text-center mb-8">
                  <div className="w-28 h-28 bg-black rounded-full flex items-center justify-center text-white text-4xl font-bold mb-5">
                    {person.name.charAt(0)}
                  </div>
                  <h4 className="font-bold text-2xl text-black mb-2">{person.name}</h4>
                  <p className="text-base text-gray-600">{person.title}</p>
                </div>
                <p className="text-base text-gray-700 leading-relaxed italic text-center flex-grow">
                  " Lorem ipsum dolor sit amet, consectetuer adipiscing elit, sed diam nonummy nibh euismod tincidunt ut laoreet dolore magna aliquam erat volutpat. Ut wisi enim ad minim veniam, quis nostrud exerci tation ullamcorper suscipit lobortis nisl ut aliquip ex ea commodo consequat. Duis autem vel eum iriure dolor in hendrerit in vulputate velit esse molestie consequat, vel illum dolore eu feugiat nulla facilisis at vero eros et accumsan et iusto odio"
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section Marques qui nous font confiance */}
      <section className="py-12 bg-white">
        <div className="w-full px-10 lg:px-16 xl:px-20 2xl:px-24">
          <h2 className="text-2xl sm:text-3xl font-black text-black text-center mb-8 italic">
            D'innombrables marques, nous font confiance !
          </h2>
          <div className="bg-gray-100 py-8 rounded-lg">
            <div className="flex flex-wrap justify-center items-center gap-6">
              {[...Array(11)].map((_, i) => (
                <div key={i} className="w-20 h-14 bg-gray-300 rounded flex items-center justify-center">
                  <span className="text-white text-sm font-medium">logo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
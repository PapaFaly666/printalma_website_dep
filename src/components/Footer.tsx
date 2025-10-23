import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Main Footer Content */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 items-start">

          {/* Company Info */}
          <div className="flex flex-col space-y-4">
            <h3 className="text-lg sm:text-xl font-bold text-blue-400">Printalma</h3>
            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
              Bilder oder benutzerdefinierte<br />
              digitalisiert deine magna alitam erit volutpat.<br />
              Ut wisi enim ad minim veniam, quis nostrud exerci tation
            </p>
            {/* Social Icons */}
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/>
                </svg>
              </a>
              {/* Ajouter d'autres icônes ici */}
            </div>
          </div>

          {/* À propos de printalma */}
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4 text-gray-300">À propos de printalma</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">À propos de nous</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Conditions générales</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Politique de confidentialité</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Catalogue d'aide newsletter</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Politique de livraison</a></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4 text-gray-300">Ressources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Blog</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">FAQ</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Contact</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Services client</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Directives pour les design</a></li>
            </ul>
          </div>

          {/* Produits Printalma */}
          <div>
            <h3 className="text-sm font-medium uppercase tracking-wider mb-4 text-gray-300">Produits Printalma</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Meilleures ventes</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Vêtements</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Accessoires</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Maison/décorations</a></li>
              <li><a href="#" className="text-sm text-gray-400 hover:text-white">Directives pour les design</a></li>
            </ul>
          </div>

        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-700">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-sm text-gray-500">
            © {currentYear} Printalma.com. Tous droits réservés.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

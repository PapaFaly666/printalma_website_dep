const TravailRemarquable = () => {
    return (
        <div>
            <div className="w-full py-8 sm:py-10 md:py-12 px-3 sm:px-4 md:px-6 lg:px-8 bg-white">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row gap-4 sm:gap-6">
                        {/* Partie gauche - Image principale avec texte */}
                        <div className="w-full lg:w-2/3 rounded-lg overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-black/50 sm:from-black/40 to-black/20 sm:to-black/10 z-10 transition-opacity duration-300"></div>

                            <img
                                src="https://printalma.com/wp-content/uploads/2021/11/home-yowle-e1638273140804.jpg"
                                alt="Travail remarquable"
                                className="w-full h-64 sm:h-80 md:h-96 lg:h-[500px] object-cover transition-transform duration-500 group-hover:scale-105"
                            />

                            {/* Texte superposé */}
                            <div className="absolute inset-0 z-20 flex flex-col justify-center p-4 sm:p-6 md:p-8 lg:p-12">
                                <div className="max-w-md">
                                    <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-medium text-white mb-2 sm:mb-3 leading-tight">
                                        Travail remarquable
                                    </h2>
                                    <p className="text-white/90 text-sm sm:text-base md:text-lg mb-4 sm:mb-6">
                                        Qui se fait avec amour et passion
                                    </p>
                                    <button className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white border border-white/30 px-3 sm:px-4 md:px-6 py-2 md:py-3 rounded-md text-xs sm:text-sm font-medium transition-all duration-300 hover:shadow-lg hover:border-white/50">
                                        Voir T-shirts
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Partie droite - Image secondaire avec badge vidéo */}
                        <div className="w-full lg:w-1/3 rounded-lg overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-b from-black/0 to-black/20 z-10"></div>

                            <img
                                src="https://printalma.com/wp-content/uploads/2021/11/home-paco-e1638273255167.jpg"
                                alt="Artiste en performance"
                                className="w-full h-56 sm:h-64 md:h-72 lg:h-[500px] object-cover"
                            />

                            {/* Badge de lecture vidéo */}
                            <button className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/30 backdrop-blur-sm w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 group">
                                <svg
                                    className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white transition-transform duration-300 group-hover:scale-110"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </button>

                            {/* Indication vidéo */}
                            <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4 z-20 bg-white/10 backdrop-blur-sm rounded-md px-3 sm:px-4 py-2 sm:py-3">
                                <p className="text-white text-xs sm:text-sm font-medium">Découvrez notre processus créatif</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TravailRemarquable

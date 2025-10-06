export interface Article {
    id: number;
    title: string;
    description: string;
    price: string;
    image: string;
    categorie: string,
    meilleurVente: boolean,
    images?: string[];
    designImage?: string;
    couleurs?: CouleurImage[];
}

export interface CouleurImage {
    couleur: string;
    image: string;
}
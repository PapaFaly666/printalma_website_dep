import { Article } from "../model/article";

// Données principales des articles
export const article: Article[] = [
    {
        id: 1,
        title: "T-Shirt",
        description: "Fleur de Printemps Brodée",
        price: "4500 FCFA",
        image: "https://printalma.com/wp-content/uploads/2023/02/IMG_7412.jpg",
        categorie: "T-Shirt",
        couleurs: [
            {
                couleur: "#FFFFFF", // Blanc
                image: "https://printalma.com/wp-content/uploads/2023/02/T-Shirt_Mockup-baayFall-blanc.jpg"
            },
            {
                couleur: "#000000", // Noir
                image: "https://printalma.com/wp-content/uploads/2023/02/T-Shirt_Mockup-baayFall-noir.jpg"
            }
        ],
        meilleurVente: true,
        designImage: "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        images: [
            "https://printalma.com/wp-content/uploads/2023/02/IMG_7412.jpg",
            "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        ],
    },
    {
        id: 2,
        title: "Sweat à capuche",
        description: "Toujours en croissance",
        price: "8000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2023/04/Sweat-hys-noir.jpg",
        categorie: "Sweats",
        meilleurVente: false,
        images: [
            "https://printalma.com/wp-content/uploads/2023/04/Sweat-hys-noir.jpg",
            "https://printalma.com/wp-content/uploads/2023/04/Sweat-hys-noir-back.jpg",
            "https://printalma.com/wp-content/uploads/2023/04/Sweat-hys-noir-detail.jpg",
            "https://printalma.com/wp-content/uploads/2023/04/Sweat-hys-noir-wearing.jpg"
        ]
    },
    {
        id: 3,
        title: "Mugs",
        description: "Fleurs Flower Power",
        price: "4000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2022/02/Thermos.png",
        categorie: "Mugs",
        meilleurVente: true,
        designImage: "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png",
        images: [
            "https://printalma.com/wp-content/uploads/2022/02/Thermos.png",
            "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png"
        ],
    },
    {
        id: 4,
        title: "T-Shirt",
        description: "Peanuts Snoopy",
        price: "5000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2021/12/t-shirt-TOGOmockup.jpg",
        categorie: "T-Shirt",
        meilleurVente: true,
        designImage: "https://printalma.com/wp-content/uploads/2021/12/kaayjob.jpeg",
        couleurs: [
            {
                couleur: "#FFFFFF", // Blanc
                image: "https://printalma.com/wp-content/uploads/2021/12/t-shirt-TOGOmockupBLANC.jpg"
            },
            {
                couleur: "#000000", // Noir
                image: "https://printalma.com/wp-content/uploads/2021/12/t-shirt-TOGOmockup.jpg"
            }
        ],
        images: [
            "https://printalma.com/wp-content/uploads/2021/12/t-shirt-TOGOmockup.jpg",
            "https://printalma.com/wp-content/uploads/2021/12/kaayjob.jpeg",
        ]
    },
    {
        id: 5,
        title: "Sacs",
        description: "Céramique premium",
        price: "1000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.43.jpeg",
        categorie: "Sac",
        meilleurVente: true,
        images: [
            "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.43.jpeg",
            "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.44.jpeg",
            "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.45.jpeg"
        ]
    },
    {
        id: 6,
        title: "Sacs",
        description: "Céramique premium",
        price: "1000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.46.jpeg",
        categorie: "Sac",
        meilleurVente: false,
        images: [
            "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.46.jpeg",
            "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.47.jpeg",
            "https://printalma.com/wp-content/uploads/2021/12/WhatsApp-Image-2021-12-15-at-13.53.48.jpeg"
        ]
    },
    {
        id: 7,
        title: "T-Shirt",
        description: "Céramique premium",
        price: "1000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2022/01/Tshirt-Dior-Blanc-Noir.jpg",
        categorie: "T-Shirt",
        meilleurVente: true,
        couleurs: [
            {
                couleur: "#FFFFFF", 
                image: "https://printalma.com/wp-content/uploads/2022/01/Tshirt-Dior-Blanc-Noir.jpg"
            },
            {
                couleur: "#000000",
                image: "https://printalma.com/wp-content/uploads/2022/01/Tshirt-Dior-Noir-Blanc.jpg"
            },
            {
                couleur: "#FF0000", 
                image: "https://printalma.com/wp-content/uploads/2022/01/Tshirt-Dior-Rouge-Blanc.jpg"
            }
        ],
        images: [
            "https://printalma.com/wp-content/uploads/2022/02/TSHIRTDIOE3.jpg",
            "https://printalma.com/wp-content/uploads/2022/02/TSHIRTDIOE3-back.jpg",
            "https://printalma.com/wp-content/uploads/2022/02/TSHIRTDIOE3-detail.jpg"
        ]
    },
    {
        id: 8,
        title: "Mugs",
        description: "Céramique premium",
        price: "1000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2022/02/mug-ifage.jpeg",
        designImage: "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png",
        categorie: "Mugs",
        meilleurVente: true,
        images: [
            "https://printalma.com/wp-content/uploads/2022/02/mug-ifage.jpeg",
            "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png"
        ]
    },
    {
        id: 9,
        title: "Mugs",
        description: "Céramique premium",
        price: "4000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2022/02/Ifage-Hoodie-Blanc-scaled.jpg",
        designImage: "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png",
        categorie: "Mugs",
        meilleurVente: true,
        images: [
            "https://printalma.com/wp-content/uploads/2022/02/Ifage-Hoodie-Blanc-scaled.jpg",
            "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png"
        ]
    },
    {
        id: 10,
        title: "Mugs",
        description: "Céramique premium",
        price: "5000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2022/02/Ifage-Noir-01.jpg",
        categorie: "Mugs",
        designImage: "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png",
        meilleurVente: true,
        images: [
            "https://printalma.com/wp-content/uploads/2022/02/Ifage-Noir-01.jpg",
            "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png"
        ]
    },
    {
        id: 11,
        title: "Mugs",
        description: "Céramique premium",
        price: "3500 FCFA",
        image: "https://printalma.com/wp-content/uploads/2022/02/ifage-hoodies-noir.jpeg",
        designImage: "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png",
        categorie: "Sac",
        meilleurVente: true,
        images: [
            "https://printalma.com/wp-content/uploads/2022/02/ifage-hoodies-noir.jpeg",
            "https://printalma.com/wp-content/uploads/2022/02/cropped-Logo-ifage.png"
        ]
    },
    {
        id: 12,
        title: "Mugs",
        description: "Céramique premium",
        price: "3500 FCFA",
        image: "https://printalma.com/wp-content/uploads/2023/02/IMG_7420.jpg",
        designImage: "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        categorie: "Sac",
        meilleurVente: true,
        images: [
            "https://printalma.com/wp-content/uploads/2023/02/IMG_7420.jpg",
            "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        ]
    },
    {
        id: 13,
        title: "Mugs",
        description: "Céramique premium",
        price: "3500 FCFA",
        image: "https://printalma.com/wp-content/uploads/2023/02/sweat-baayFall-noir.jpg",
        categorie: "Sac",
        meilleurVente: true,
        designImage: "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        images: [
            "https://printalma.com/wp-content/uploads/2023/02/sweat-baayFall-noir.jpg",
            "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        ]
    },
    {
        id: 14,
        title: "Mugs",
        description: "Céramique premium",
        price: "2500 FCFA",
        image: "https://printalma.com/wp-content/uploads/2023/02/cap-baayFall-blanc.jpg",
        categorie: "Sac",
        designImage: "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        meilleurVente: true,
        images: [
            "https://printalma.com/wp-content/uploads/2023/02/cap-baayFall-blanc.jpg",
            "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        ]
    },
    {
        id: 15,
        title: "Mugs",
        description: "Céramique premium",
        price: "10000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2023/02/sweat-baayFall-Blanc.jpg",
        categorie: "Sac",
        meilleurVente: true,
        designImage: "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        images: [
            "https://printalma.com/wp-content/uploads/2023/02/sweat-baayFall-Blanc.jpg",
            "https://printalma.com/wp-content/uploads/2023/02/4FD260BE-7471-40DA-BD61-B3478335FC62_1_100_o.jpeg",
        ]
    },
    {
        id: 16,
        title: "Mugs",
        description: "Céramique premium",
        price: "9000 FCFA",
        image: "https://printalma.com/wp-content/uploads/2022/02/pull-blanc-scaled.jpg",
        categorie: "Sac",
        meilleurVente: true,
        designImage: "https://printalma.com/wp-content/uploads/2022/02/banner-1.png",
        images: [
            "https://printalma.com/wp-content/uploads/2022/02/pull-blanc-scaled.jpg",
            "https://printalma.com/wp-content/uploads/2022/02/banner-1.png",
        ]
    }
];

// Données spécifiques pour l'affichage des produits liés
// Vous pouvez prédéfinir les produits que vous souhaitez afficher pour chaque produit principal
export const relatedProductsMap: Record<number, Article[]> = {
    // Pour le produit avec id 1 (T-Shirt), ces produits seront affichés comme liés
    1: [
        article.find(item => item.id === 12)!,
        article.find(item => item.id === 13)!,
        article.find(item => item.id === 14)!,
        article.find(item => item.id === 15)!
    ],
    // Pour le produit avec id 2 (Sweat à capuche)
    2: [
        article.find(item => item.id === 1)!,
        article.find(item => item.id === 7)!,
        article.find(item => item.id === 3)!,
        article.find(item => item.id === 6)!
    ],
    // Pour le produit avec id 3 (Mugs)
    3: [
        article.find(item => item.id === 8)!,
        article.find(item => item.id === 9)!,
        article.find(item => item.id === 10)!,
        article.find(item => item.id === 11)!
    ],
    // Pour le produit avec id 4 (Casquette)
    4: [
        article.find(item => item.id === 15)!,
        article.find(item => item.id === 2)!,
        article.find(item => item.id === 5)!,
        article.find(item => item.id === 3)!
    ],
    // Pour le produit avec id 5 (Sacs)
    5: [
        article.find(item => item.id === 6)!,
        article.find(item => item.id === 3)!,
        article.find(item => item.id === 4)!,
        article.find(item => item.id === 7)!
    ],
    // Pour le produit avec id 6 (Sacs)
    6: [
        article.find(item => item.id === 5)!,
        article.find(item => item.id === 3)!,
        article.find(item => item.id === 1)!,
        article.find(item => item.id === 2)!
    ],
    // Pour le produit avec id 7 (T-Shirt)
    7: [
        article.find(item => item.id === 1)!,
        article.find(item => item.id === 2)!,
        article.find(item => item.id === 4)!,
        article.find(item => item.id === 3)!
    ]
};

// Fonction d'aide pour obtenir les produits liés par ID de produit
export function getRelatedProducts(productId: number): Article[] {
    return relatedProductsMap[productId] || [];
}

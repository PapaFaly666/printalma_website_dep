export interface Client {
  id: number;
  email: string;
  nom?: string;
  prenom?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  codePostal?: string;
  pays?: string;
  dateInscription: string;
  derniereConnexion?: string;
  actif: boolean;
  emailVerifie: boolean;
  nombreCommandes: number;
  montantTotalCommandes: number;
  preferences?: {
    newsletter: boolean;
    notifications: boolean;
    langue: string;
  };
}

export interface ClientFilters {
  search?: string;
  actif?: boolean;
  emailVerifie?: boolean;
  dateInscriptionDebut?: string;
  dateInscriptionFin?: string;
}

export interface ClientsResponse {
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
}
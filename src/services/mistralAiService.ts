// Service pour intégrer l'API Mistral AI
export interface AiSupportRequest {
  question: string;
  context?: string;
  userRole?: 'admin' | 'vendor';
}

export interface AiSupportResponse {
  response: string;
  timestamp: string;
  model: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

class MistralAiService {
  private apiKey = '3gfBl2ZcES1zPPnmXUCuamybnYyiXAjW';
  private baseURL = 'https://api.mistral.ai/v1';
  private model = 'mistral-medium';

  // Context spécialisé pour PrintAlma
  private getSystemPrompt(): string {
    return `Tu es l'assistant IA de PrintAlma, spécialisé dans l'aide aux vendeurs de la plateforme PrintAlma.

**Ton rôle principal :**
- Aider les vendeurs à naviguer et utiliser efficacement la plateforme PrintAlma
- Expliquer les processus de vente, de gestion des designs, et des commandes de façon simple et non technique
- Fournir des conseils pratiques pour optimiser leurs ventes
- Répondre aux questions sur les fonctionnalités disponibles

**Contexte détaillé de PrintAlma :**
PrintAlma est une plateforme e-commerce de personnalisation de produits où :
- Les vendeurs peuvent créer et vendre des designs personnalisés sur des produits (t-shirts, mugs, casquettes, sacs, etc.)
- Les clients peuvent acheter des produits avec ces designs
- Il y a un système de validation des designs par l'administration avant publication
- Les vendeurs gagnent des commissions sur leurs ventes et peuvent faire des demandes de retrait

**PROCESSUS COMPLET DU VENDEUR :**

**1. GESTION DES DESIGNS :**
- **Création** : Uploader un fichier image (PNG, JPG, max 10MB)
- **Statuts des designs** :
  - 📝 **Brouillon** : Design créé mais pas encore soumis pour validation
  - ⏳ **En attente** : Design soumis pour validation par l'admin
  - ✅ **Validé & Publié** : Design approuvé et automatiquement publié
  - ❌ **Rejeté** : Design refusé (peut être modifié et re-soumis)
- **Workflow** : Créer → Soumettre pour validation → Attendre validation → Design publié automatiquement si approuvé
- **Métriques** : Vues, likes, gains, utilisations par design

**2. CRÉATION DE PRODUITS PERSONNALISÉS :**
- **Étape 1** : Sélectionner un produit de base (t-shirt, mug, etc.) dans le catalogue admin
- **Étape 2** : Choisir un de ses designs validés
- **Étape 3** : Positionner le design sur le produit avec l'outil interactif (drag & drop, rotation, échelle)
- **Étape 4** : Finaliser avec nom, description et mode de publication
- **Modes de publication** :
  - **Automatique** : Publié automatiquement si design validé
  - **Manuelle** : Créé en brouillon (vendeur publie manuellement)

**3. SYSTÈME FINANCIER ET DEMANDES DE FONDS :**
- **Gains** : Commission sur chaque vente de produit avec leurs designs
- **Types de montants** :
  - 💰 **Gains Totaux** : Total de tous les gains accumulés
  - 💵 **Disponible** : Montant prêt pour retrait immédiat
  - ⏳ **En attente** : Montant en cours de traitement
  - 📊 **Commission** : Taux moyen (généralement autour de 10-12%)

- **PROCESSUS D'APPEL DE FONDS COMPLET** :

  **📋 Étape 1 - Accéder à l'appel de fonds :**
  - Aller dans le menu "Appel de Fonds"
  - Voir le dashboard avec 4 cartes : Gains Totaux, Disponible, En attente, Commissions

  **💰 Étape 2 - Vérifier le solde disponible :**
  - Minimum requis : 1 000 FCFA (pas 10 000)
  - Le montant "Disponible" est ce qu'on peut retirer
  - Le montant "En attente" correspond aux demandes en cours de traitement

  **➕ Étape 3 - Créer une nouvelle demande :**
  - Cliquer sur "Nouvelle Demande"
  - Saisir le montant (minimum 1 000 F, maximum = solde disponible)
  - Choisir la méthode de paiement :
    - 📱 **Wave** : Numéro de téléphone +221
    - 🧡 **Orange Money** : Numéro de téléphone +221
    - 🏦 **Virement bancaire** : IBAN requis

  **✅ Étape 4 - Confirmer la demande :**
  - Vérifier le récapitulatif (montant, méthode, solde après retrait)
  - Confirmer définitivement
  - La demande est créée avec le statut "PENDING" (En attente de paiement)

  **⏱️ Étape 5 - Suivi de la demande :**
  - Délai de traitement : 24-48h (pas 1-3 jours)
  - Statuts possibles :
    - 🟡 **PENDING** : En attente de paiement (statut initial)
    - 🟢 **PAID** : Payé et terminé
  - Notifications par email à chaque étape
  - Historique complet des demandes avec dates et détails

**4. SUIVI DES PERFORMANCES :**
- **Dashboard** avec métriques clés :
  - Chiffre d'affaires annuel et mensuel
  - Solde disponible
  - Nombre de produits (total, publiés, en attente, brouillons)
  - Nombre de designs par statut
  - Vues de la boutique
- **Commandes** : Suivi des ventes et commandes clients
- **Statistiques détaillées** : Performance par design et produit

**5. VALIDATION ET WORKFLOW :**
- **Validation des designs** : Obligatoire par l'admin avant publication
- **Cascade de validation** : Système hiérarchique (design → produit → publication)
- **Notifications** : Email à chaque étape de validation
- **Gestion des rejets** : Possibilité de modifier et re-soumettre

**CONSEILS PRATIQUES POUR OPTIMISER LES VENTES :**

**Design :**
- Créer des designs de qualité, originaux et attrayants
- Choisir des thèmes populaires et tendance
- Optimiser la taille et qualité des fichiers
- Utiliser des mots-clés pertinents dans les descriptions

**Pricing :**
- Analyser les prix de la concurrence
- Proposer des designs dans différentes gammes de prix
- Considérer la valeur ajoutée de vos créations

**Marketing :**
- Soigner les descriptions de produits
- Utiliser des tags appropriés
- Créer des collections cohérentes
- Surveiller les performances via le dashboard

**Gestion :**
- Soumettre régulièrement de nouveaux designs
- Maintenir un stock de designs en brouillon
- Suivre les tendances et adapter l'offre
- Utiliser les statistiques pour optimiser

**PROBLÈMES COURANTS ET SOLUTIONS :**

**Design rejeté :**
- Vérifier la qualité et originalité
- Respecter les guidelines de la plateforme
- Modifier et re-soumettre
- Contacter le support en cas de doute

**Faibles ventes :**
- Analyser les métriques du dashboard
- Optimiser les descriptions et prix
- Créer plus de variety dans les designs
- Suivre les tendances du marché

**Problème de demande de fonds :**
- Vérifier le solde minimum (1 000 FCFA, pas 10 000)
- S'assurer que le montant ne dépasse pas le solde disponible
- Vérifier que le numéro de téléphone est correct pour Wave/Orange Money
- Vérifier que l'IBAN est correct pour les virements bancaires
- Suivre le statut dans l'historique des demandes
- Contacter le support si délai de 48h dépassé
- Les demandes sont traitées directement par l'équipe (pas d'approbation admin d'abord)

**Ton style de communication :**
- Amical, encourageant et professionnel
- Explications simples étape par étape (pas technique)
- Utilise des exemples concrets et pratiques
- Utilise des émojis pour rendre les explications plus claires
- Encourage et motive les vendeurs
- Réponds toujours en français
- Donne des conseils actionnables

**INFORMATIONS DE CONTACT ET SUPPORT :**
- **Email support :** payments@printalma.com
- **Téléphone :** +221 77 123 45 67
- **Horaires :** Lundi-Vendredi, 9h-18h
- **Délai de traitement habituel :** 1-3 jours ouvrés (général), 24-48h (appel de fonds)

Si une question sort de ton domaine d'expertise (technique avancé, juridique, problèmes de compte),
redirige gentiment l'utilisateur vers le support technique de PrintAlma avec les coordonnées ci-dessus.`;
  }

  async askQuestion(request: AiSupportRequest): Promise<AiSupportResponse> {
    try {
      console.log('🤖 Envoi de la question à Mistral AI:', request.question);

      const messages = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        {
          role: 'user',
          content: `Question: ${request.question}${request.context ? `\n\nContexte supplémentaire: ${request.context}` : ''}`
        }
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: messages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API Mistral: ${response.status}`);
      }

      const data = await response.json();

      console.log('✅ Réponse de Mistral AI reçue');

      return {
        response: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
        model: this.model
      };

    } catch (error) {
      console.error('❌ Erreur lors de l\'appel à Mistral AI:', error);
      throw new Error('Impossible de contacter l\'assistant IA. Veuillez réessayer.');
    }
  }

  // Méthode pour les conversations en continu
  async continueChat(messages: ChatMessage[]): Promise<AiSupportResponse> {
    try {
      console.log('🤖 Continuation de chat avec Mistral AI');

      const mistralMessages = [
        {
          role: 'system',
          content: this.getSystemPrompt()
        },
        ...messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        }))
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: mistralMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API Mistral: ${response.status}`);
      }

      const data = await response.json();

      return {
        response: data.choices[0].message.content,
        timestamp: new Date().toISOString(),
        model: this.model
      };

    } catch (error) {
      console.error('❌ Erreur lors du chat avec Mistral AI:', error);
      throw new Error('Impossible de contacter l\'assistant IA. Veuillez réessayer.');
    }
  }

  // Méthode avec contexte système additionnel (profil/stats vendeur)
  async continueChatWithContext(messages: ChatMessage[], systemContext: string): Promise<AiSupportResponse> {
    try {
      const mistralMessages = [
        { role: 'system', content: this.getSystemPrompt() },
        { role: 'system', content: `Contexte dynamique vendeur:\n${systemContext}` },
        ...messages.map(msg => ({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content }))
      ];

      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages: mistralMessages,
          max_tokens: 1000,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur API Mistral: ${response.status}`);
      }

      const data = await response.json();
      return { response: data.choices[0].message.content, timestamp: new Date().toISOString(), model: this.model };
    } catch (error) {
      console.error('❌ Erreur chat IA avec contexte:', error);
      // Fallback sur chat sans contexte
      return this.continueChat(messages);
    }
  }

  // Questions prédéfinies pour guider les vendeurs
  getSuggestedQuestions(): string[] {
    return [
      "Comment créer et uploader mon premier design ?",
      "Comment positionner correctement mon design sur un produit ?",
      "Pourquoi mon design a été rejeté et que faire ?",
      "Comment faire une demande d'appel de fonds pour retirer mes gains ?",
      "Quelles sont les meilleures pratiques pour vendre plus ?",
      "Comment voir mes statistiques de ventes et gains ?",
      "Quel est le processus de validation des designs ?",
      "Comment créer un produit personnalisé avec mon design ?",
      "Combien de temps prend la validation d'un design ?",
      "Comment optimiser mes descriptions de produits ?"
    ];
  }

  // Erreurs courantes et solutions pour vendeurs
  getCommonIssues(): Array<{title: string, question: string}> {
    return [
      {
        title: "Mon design a été rejeté",
        question: "Pourquoi mon design a été rejeté et comment le corriger pour qu'il soit accepté ?"
      },
      {
        title: "Je n'arrive pas à positionner mon design",
        question: "Comment utiliser l'outil de positionnement pour placer mon design correctement sur le produit ?"
      },
      {
        title: "Ma demande d'appel de fonds prend du temps",
        question: "Ma demande d'appel de fonds est en attente depuis longtemps, que dois-je faire ?"
      },
      {
        title: "Je ne vois pas mes gains",
        question: "Où puis-je voir mes gains et statistiques de ventes dans mon tableau de bord ?"
      },
      {
        title: "Mes ventes sont faibles",
        question: "Comment améliorer mes ventes et faire en sorte que mes designs se vendent mieux ?"
      },
      {
        title: "Erreur lors de l'upload de design",
        question: "J'ai une erreur quand j'essaie d'uploader mon design, comment la résoudre ?"
      }
    ];
  }
}

export const mistralAiService = new MistralAiService();
export default mistralAiService;
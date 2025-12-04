# 🔐 Guide de sécurité - PrintAlma

## Configuration des clés API

### ⚠️ IMPORTANT - Sécurité des clés API

**NE JAMAIS** committer vos clés API dans Git ! Les clés API doivent être stockées dans des fichiers d'environnement locaux qui ne sont pas versionnés.

### Configuration initiale

1. **Créer votre fichier de configuration local :**
   ```bash
   cp .env.example .env.local
   ```

2. **Éditer `.env.local` avec vos vraies clés :**
   ```bash
   # Ouvrez le fichier et remplacez les valeurs d'exemple
   nano .env.local
   # ou
   code .env.local
   ```

3. **Redémarrer le serveur de développement :**
   ```bash
   npm run dev
   ```

### Clés API nécessaires

#### Stability AI (Génération d'images IA) ⭐ ACTIF
- **Variable :** `VITE_STABILITY_API_KEY`
- **Statut :** Configuré et fonctionnel
- **Comment l'obtenir :**
  1. Visitez https://platform.stability.ai/account/keys
  2. Créez un compte Stability AI
  3. Générez une nouvelle clé API
  4. Copiez la clé dans votre fichier `.env.local`

**Avantages de Stability AI :**
- ✅ Génération d'images de qualité professionnelle
- ✅ Support de multiples styles (réaliste, cartoon, artistique, minimaliste)
- ✅ Ratio de 1:1 optimal pour les designs de produits
- ✅ Coût raisonnable (~$0.03 par image)
- ✅ API stable et bien documentée
- ✅ Système de fallback automatique en cas d'erreur

**Fonctionnalités implémentées :**
- Génération d'images IA en temps réel
- 4 presets de style adaptés aux designs de produits
- Prompts optimisés automatiquement pour l'impression
- Negative prompts pour améliorer la qualité
- Images de fallback stylisées en cas d'indisponibilité

### Vérification de la configuration

Pour vérifier que vos clés sont bien configurées, démarrez le serveur de développement.
Si une clé est manquante, vous verrez une erreur dans la console du navigateur.

### En production

Pour le déploiement en production :
- **Vercel/Netlify :** Ajoutez les variables d'environnement dans le dashboard
- **Docker :** Utilisez un fichier `.env` ou passez les variables via docker-compose
- **Serveur traditionnel :** Configurez les variables d'environnement système

### Fichiers à ne JAMAIS committer

✅ **Fichiers sûrs (commités) :**
- `.env.example` - Modèle de configuration
- `SECURITY.md` - Ce fichier

❌ **Fichiers sensibles (NE PAS committer) :**
- `.env.local` - Vos clés réelles
- `.env` - Clés de développement
- `.env.development.local`
- `.env.production.local`

Ces fichiers sont déjà dans `.gitignore` pour votre sécurité.

## Que faire si vous avez commité une clé par accident ?

1. **Révoquez immédiatement la clé** sur la plateforme concernée
2. **Générez une nouvelle clé**
3. **Mettez à jour votre `.env.local`**
4. **Supprimez la clé de l'historique Git** :
   ```bash
   # ATTENTION: Ceci réécrit l'historique Git
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch FICHIER_AVEC_CLE" \
     --prune-empty --tag-name-filter cat -- --all
   ```

## Support

Si vous avez des questions sur la configuration des clés API, consultez la documentation de chaque service ou contactez l'équipe de développement.

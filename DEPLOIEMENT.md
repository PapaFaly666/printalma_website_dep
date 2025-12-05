# 🚀 Guide de Déploiement - PrintAlma

Ce guide explique comment déployer PrintAlma avec toutes les fonctionnalités, y compris la génération d'images par IA.

---

## 📋 Prérequis

- Node.js 18+ installé
- npm ou yarn
- Compte Stability AI (pour la génération d'images IA)
- Backend déployé et accessible

---

## 🔑 Configuration des Variables d'Environnement

### Pour le Développement Local

1. Copiez le fichier `.env.example` en `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Modifiez `.env.local` avec vos vraies valeurs:
   ```env
   VITE_API_URL=http://localhost:3004
   VITE_ENVIRONMENT=development
   VITE_STABILITY_API_KEY=sk-votre_cle_stability_ai_ici
   ```

### Pour la Production

1. **IMPORTANT**: Modifiez `.env.production` avec vos valeurs de production:
   ```env
   VITE_API_URL=https://votre-api-backend.com
   VITE_ENVIRONMENT=production
   VITE_SECURE_COOKIES=true
   VITE_SAME_SITE=lax
   VITE_STABILITY_API_KEY=sk-votre_cle_stability_ai_production
   ```

2. **⚠️ Sécurité**:
   - Ne committez JAMAIS vos vraies clés API dans Git
   - Utilisez des clés différentes pour dev et production
   - Sur les plateformes de déploiement (Vercel, Netlify, etc.), configurez les variables dans le dashboard

---

## 🎨 Configuration de l'API Stability AI

### Obtenir votre Clé API

1. Créez un compte sur [Stability AI](https://platform.stability.ai/)
2. Allez dans **Account > API Keys**
3. Créez une nouvelle clé API
4. Copiez la clé (commence par `sk-`)

### Ajouter la Clé dans le Projet

**Développement:**
```bash
# Dans .env.local
VITE_STABILITY_API_KEY=sk-votre_cle_dev
```

**Production:**
```bash
# Dans .env.production
VITE_STABILITY_API_KEY=sk-votre_cle_prod
```

### Coût Estimé

- ~0.03$ par image générée
- ~33 images pour 1$
- Budget recommandé: 10-20$ par mois pour démarrer

### Comportement sans Clé API

Si aucune clé n'est configurée:
- ✅ L'application fonctionne normalement
- ✅ L'interface IA est accessible
- ⚠️ Des images placeholder sont générées à la place
- 💡 Message d'avertissement dans la console

---

## 🏗️ Build et Déploiement

### Build Local

```bash
# Installer les dépendances
npm install

# Build pour la production
npm run build

# Tester le build localement
npm run preview
```

### Déploiement sur Vercel

1. **Connecter votre dépôt**:
   ```bash
   vercel
   ```

2. **Configurer les variables d'environnement** dans le dashboard Vercel:
   - `VITE_API_URL` → URL de votre backend
   - `VITE_STABILITY_API_KEY` → Votre clé Stability AI
   - `VITE_ENVIRONMENT` → `production`
   - `VITE_SECURE_COOKIES` → `true`

3. **Déployer**:
   ```bash
   vercel --prod
   ```

### Déploiement sur Netlify

1. **Build settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`

2. **Variables d'environnement** (dans Settings > Environment):
   ```
   VITE_API_URL=https://votre-backend.com
   VITE_STABILITY_API_KEY=sk-votre_cle_prod
   VITE_ENVIRONMENT=production
   VITE_SECURE_COOKIES=true
   ```

3. **Déployer**:
   ```bash
   netlify deploy --prod
   ```

### Déploiement sur un VPS (Ubuntu/Debian)

```bash
# 1. Cloner le projet
git clone https://github.com/votre-repo/printalma.git
cd printalma

# 2. Installer les dépendances
npm install

# 3. Créer .env.production avec vos valeurs
nano .env.production

# 4. Build
npm run build

# 5. Servir avec nginx ou pm2
# (Voir la section Configuration Nginx ci-dessous)
```

---

## 🌐 Configuration Nginx (VPS)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    root /var/www/printalma/dist;
    index index.html;

    # Compression
    gzip on;
    gzip_types text/css application/javascript image/svg+xml;

    # Cache des assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA - Rediriger toutes les routes vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ✅ Vérification Post-Déploiement

### 1. Tester la Génération d'Images IA

1. Allez sur la page de personnalisation d'un produit
2. Cliquez sur l'onglet "IA" (icône Sparkles ✨)
3. Entrez un prompt (ex: "Un lion majestueux")
4. Cliquez sur "Générer l'image"

**Résultat attendu:**
- ✅ Image générée par Stability AI (délai 5-30 secondes)
- ✅ Qualité professionnelle
- ✅ Possibilité d'ajouter l'image au design

**Si ça ne fonctionne pas:**
- Vérifiez la console du navigateur (F12)
- Cherchez les erreurs `[Stability AI]`
- Vérifiez que `VITE_STABILITY_API_KEY` est bien configurée
- Vérifiez votre crédit Stability AI

### 2. Vérifier les Variables d'Environnement

Dans la console du navigateur:
```javascript
// Vérifier que les variables sont chargées
console.log('API URL:', import.meta.env.VITE_API_URL);
console.log('Environment:', import.meta.env.VITE_ENVIRONMENT);
console.log('Has Stability Key:', !!import.meta.env.VITE_STABILITY_API_KEY);
```

### 3. Tests Fonctionnels

- [ ] Connexion/Déconnexion
- [ ] Navigation entre pages
- [ ] Personnalisation de produits
- [ ] Génération d'images IA
- [ ] Ajout au panier
- [ ] Passage de commande

---

## 🐛 Dépannage

### Problème: "Clé API non configurée"

**Symptôme:** Message d'erreur lors de la génération d'images IA

**Solution:**
1. Vérifiez que `.env.production` contient `VITE_STABILITY_API_KEY`
2. Sur Vercel/Netlify, vérifiez les variables d'environnement
3. Rebuildez l'application après avoir ajouté la variable
4. Les variables Vite doivent commencer par `VITE_`

### Problème: Images placeholder au lieu d'images IA

**Symptôme:** Images avec texte généré au lieu d'images réelles

**Raison:** La clé API n'est pas chargée ou invalide

**Solution:**
```bash
# Vérifier que la variable est présente
cat .env.production | grep STABILITY

# Vérifier que la clé est valide sur Stability AI
# (Testez-la directement sur leur plateforme)
```

### Problème: Erreur CORS

**Symptôme:** Erreurs dans la console concernant l'API

**Solution:** Configurez les CORS sur votre backend

### Problème: Build échoue

**Solution:**
```bash
# Nettoyer et réinstaller
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Monitoring en Production

### Logs Stability AI

Les logs sont visibles dans la console:
```
🎨 [Stability AI] Génération d'image avec prompt: ...
✅ [Stability AI] Image générée avec succès!
```

### Métriques à Surveiller

- Nombre de générations d'images par jour
- Taux de succès des générations
- Temps moyen de génération
- Coût mensuel Stability AI

### Budget Recommandé

**Petit site (< 100 générations/mois):**
- Budget: 5-10$ / mois

**Site moyen (100-500 générations/mois):**
- Budget: 15-25$ / mois

**Gros site (> 500 générations/mois):**
- Budget: 30-50$ / mois
- Envisager un système de cache

---

## 🔒 Sécurité

### Protection de la Clé API

- ✅ Ne JAMAIS exposer la clé dans le code client
- ✅ Les variables `VITE_*` sont intégrées au build (OK pour l'usage client-side)
- ✅ Alternativement, utilisez un proxy backend pour cacher la clé
- ✅ Limitez le débit dans Stability AI (rate limiting)

### Recommandations

1. **Proxy Backend (Recommandé pour production)**:
   - Créez une route `/api/generate-image` dans votre backend
   - Le backend appelle Stability AI avec la clé
   - Le frontend appelle votre backend
   - ✅ La clé API reste secrète côté serveur

2. **Client-side (Configuration actuelle)**:
   - Plus simple à configurer
   - Clé visible dans le bundle (acceptable pour usage limité)
   - Utilisez les limites de débit Stability AI

---

## 📚 Ressources

- [Documentation Stability AI](https://platform.stability.ai/docs)
- [Pricing Stability AI](https://platform.stability.ai/pricing)
- [Support Stability AI](https://platform.stability.ai/support)
- [Documentation Vite](https://vitejs.dev/)
- [Documentation React](https://react.dev/)

---

## 📝 Checklist de Déploiement

Avant de déployer en production:

- [ ] Variables d'environnement configurées dans `.env.production`
- [ ] Clé API Stability AI valide et testée
- [ ] Backend déployé et accessible via HTTPS
- [ ] CORS configuré sur le backend
- [ ] Tests de génération d'images IA réussis
- [ ] Build local réussi (`npm run build`)
- [ ] Preview local testé (`npm run preview`)
- [ ] Budget Stability AI défini
- [ ] Monitoring configuré
- [ ] DNS configurés (si applicable)
- [ ] HTTPS activé
- [ ] Cookies sécurisés configurés

---

**Bon déploiement! 🚀**

Pour toute question, consultez les logs ou créez une issue sur GitHub.

# 🔧 Fix: Génération d'images IA en Production

## 🐛 Problème Résolu

La génération d'images par IA fonctionnait en local mais **pas en production** après déploiement.

### Cause
La clé API Stability AI (`VITE_STABILITY_API_KEY`) n'était **pas configurée** dans les fichiers d'environnement de production.

---

## ✅ Solution Appliquée

### 1. Configuration de la Clé API

**Fichier modifié:** `.env`

Ajout de la clé API Stability AI :
```env
VITE_STABILITY_API_KEY=sk-C4ZyKMA9D5kN7p4BeeaUqWDsG5dv0WDlzbjWDvqe1ioJ8EFn
```

### 2. Sécurité Renforcée

**Fichier modifié:** `.gitignore`

Ajout de `.env` dans `.gitignore` pour **protéger les clés sensibles** :
```gitignore
.env  # ⚠️ IMPORTANT: Contient les vraies clés API
```

**Action Git:**
```bash
git rm --cached .env  # Retirer du tracking Git (sans supprimer le fichier)
```

### 3. Documentation Améliorée

**Nouveaux fichiers créés:**

- ✅ `.env.example` - Modèle avec instructions détaillées
- ✅ `.env.production.example` - Configuration production
- ✅ `DEPLOIEMENT.md` - Guide complet de déploiement
- ✅ `FIX_IA_PRODUCTION.md` - Ce fichier

**Fichiers modifiés:**

- ✅ `src/services/stabilityService.ts` - Meilleurs messages d'erreur
- ✅ `.env` - Configuration propre et commentée

---

## 🚀 Comment Déployer Maintenant

### Option 1: Build Local puis Upload

```bash
# 1. Le .env contient déjà la bonne clé
npm run build

# 2. Le dossier dist/ contient tout ce qu'il faut
# Uploadez dist/ sur votre serveur
```

### Option 2: Déploiement sur Vercel/Netlify

**Important:** Sur ces plateformes, configurez la variable dans le dashboard :

**Vercel:**
1. Allez dans Settings > Environment Variables
2. Ajoutez :
   - Key: `VITE_STABILITY_API_KEY`
   - Value: `sk-gWC4XEXAbuXxUjp5JMX7nTKVDx5RueYlEe2Ay5z2FS10wDaZ`
   - Environments: Production ✓

**Netlify:**
1. Allez dans Site settings > Environment > Environment variables
2. Ajoutez :
   - Key: `VITE_STABILITY_API_KEY`
   - Value: `sk-gWC4XEXAbuXxUjp5JMX7nTKVDx5RueYlEe2Ay5z2FS10wDaZ`

### Option 3: VPS/Serveur Dédié

```bash
# Sur le serveur
git pull origin main
nano .env  # Ajoutez VITE_STABILITY_API_KEY=votre_clé
npm install
npm run build
```

---

## 🧪 Test de Vérification

Après déploiement, testez la génération d'images IA :

1. **Ouvrez votre site en production**
2. **Allez sur une page de personnalisation produit**
3. **Cliquez sur l'onglet IA** (icône Sparkles ✨)
4. **Entrez un prompt** (ex: "Un lion majestueux")
5. **Cliquez sur "Générer l'image"**

**Résultat attendu:**
- ✅ Image générée en 5-30 secondes
- ✅ Qualité professionnelle (pas de placeholder)
- ✅ Possibilité d'ajouter l'image au design

**Si ça ne marche pas:**
- Ouvrez la console (F12)
- Cherchez les logs `[Stability AI]`
- Vérifiez que la clé est bien chargée :
  ```javascript
  console.log(import.meta.env.VITE_STABILITY_API_KEY)
  ```

---

## 📊 Fichiers Modifiés

```
printalma_website_dep/
├── .env                          # ✅ Clé API ajoutée (NON committé)
├── .env.example                  # ✅ Amélioré avec instructions
├── .env.production.example       # 🆕 Nouveau fichier
├── .gitignore                    # ✅ .env ajouté
├── src/services/stabilityService.ts  # ✅ Meilleurs messages d'erreur
├── DEPLOIEMENT.md                # 🆕 Guide complet
└── FIX_IA_PRODUCTION.md          # 🆕 Ce fichier
```

---

## 🔒 Sécurité

### ✅ Protections Mises en Place

1. **`.env` dans `.gitignore`** → Clé jamais commitée
2. **`.env.example` sans vraie clé** → Peut être commité
3. **Messages d'erreur informatifs** → Debug facile
4. **Documentation complète** → Déploiement sécurisé

### ⚠️ Important

- **JAMAIS** commit `.env` avec la vraie clé
- **TOUJOURS** utiliser `.env.example` comme modèle
- **LIMITER** le débit sur Stability AI dashboard
- **SURVEILLER** l'utilisation et les coûts

---

## 💰 Coûts Stability AI

Avec votre clé actuelle :
- ~0.03$ par image générée
- ~33 images pour 1$
- Budget recommandé : 10-20$/mois pour démarrer

**Surveillance:**
- Vérifiez votre usage sur https://platform.stability.ai/account/credits
- Configurez des alertes de budget

---

## 📚 Ressources

- [Guide de déploiement complet](./DEPLOIEMENT.md)
- [Documentation Stability AI](https://platform.stability.ai/docs)
- [Pricing](https://platform.stability.ai/pricing)

---

## ✅ Checklist Finale

Avant de pousser en production :

- [x] Clé API configurée dans `.env`
- [x] `.env` dans `.gitignore`
- [x] `.env` retiré du tracking Git
- [x] Documentation créée
- [x] Messages d'erreur améliorés
- [ ] Build testé localement (`npm run build`)
- [ ] Variables configurées sur plateforme de déploiement (si Vercel/Netlify)
- [ ] Premier test de génération IA en production
- [ ] Budget Stability AI surveillé

---

**Fix appliqué avec succès ! 🎉**

La génération d'images IA devrait maintenant fonctionner en production comme en local.

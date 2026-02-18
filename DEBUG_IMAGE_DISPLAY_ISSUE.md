# Debug - Images Ne S'Affichent Pas

## 🐛 Problème Actuel

Les images ne s'affichent pas du tout dans `/admin/content-management`, même après tous les fixes appliqués.

---

## 🔍 Étapes de Diagnostic

### 1. Vérifier la Console du Navigateur

Ouvrir `/admin/content-management` et regarder la console (F12):

**Chercher ces logs:**

```
📦 Données chargées depuis le backend: { designs: [...], ... }
📊 Nombre de designs: 6
📊 Nombre d'influenceurs: 5
📊 Nombre de merchandising: 6
🖼️ Premier design: { id: "...", name: "...", imageUrl: "..." }
```

### 2. Vérifier la Structure des Données

**Si vous voyez:**
```javascript
{
  designs: [],
  influencers: [],
  merchandising: []
}
```

**➡️ Problème:** Le backend ne retourne pas de données. Voir [Section Backend](#backend-ne-retourne-pas-de-données).

**Si vous voyez:**
```javascript
{
  designs: [
    { id: "xyz", name: "Designer 1", imageUrl: null }  // ❌ null au lieu de ""
  ]
}
```

**➡️ Problème:** Le backend retourne `null` au lieu de `""`. Voir [Section imageUrl null](#imageurl-null-au-lieu-de-chaine-vide).

**Si vous voyez:**
```javascript
{
  designs: [
    { id: "xyz", name: "Designer 1", imageUrl: "" }  // ✅ Vide, normal
  ]
}
```

**➡️ Normal:** Aucune image n'a été uploadée encore.

**Si vous voyez:**
```javascript
{
  designs: [
    { id: "xyz", name: "Designer 1", imageUrl: "https://..." }  // ✅ URL présente
  ]
}
```

**➡️ Les données sont bonnes.** Continuer au point 3.

### 3. Vérifier le Rendu du Composant

**Chercher ces logs dans la console:**

```
🔄 ContentImage: src changé { oldSrc: "...", newSrc: "...", alt: "..." }
```

**Si ce log n'apparaît PAS:**

**➡️ Problème:** Le composant `ContentImage` ne reçoit pas de props. Voir [Section Composant Non Rendu](#composant-non-rendu).

**Si vous voyez:**
```
🔄 ContentImage: src changé { newSrc: "", alt: "Designer 1" }
⏳ ContentImage: URL distante, attente du chargement
```

**➡️ Normal:** Pas d'image uploadée, le fallback devrait s'afficher.

**Si vous voyez:**
```
🔄 ContentImage: src changé { newSrc: "https://res.cloudinary.com/...", alt: "Designer 1" }
⏳ ContentImage: URL distante, attente du chargement
❌ ContentImage: Erreur de chargement { src: "https://res.cloudinary.com/..." }
```

**➡️ Problème:** L'URL existe mais le chargement échoue. Voir [Section Erreur de Chargement](#erreur-de-chargement-image).

**Si vous voyez:**
```
🔄 ContentImage: src changé { newSrc: "https://res.cloudinary.com/...", alt: "Designer 1" }
⏳ ContentImage: URL distante, attente du chargement
✅ ContentImage: Image chargée avec succès { src: "https://res.cloudinary.com/..." }
```

**➡️ Bon:** L'image se charge correctement. Si elle ne s'affiche toujours pas, voir [Section CSS/Affichage](#problème-css-ou-affichage).

### 4. Vérifier l'Appel API

Ouvrir l'onglet **Network** (Réseau) dans DevTools:

**Chercher la requête:**
```
GET /admin/content
```

**Vérifier:**
- ✅ Status: 200 OK
- ✅ Response Headers contient `Set-Cookie` ou accepte les cookies
- ✅ Response Body: Structure JSON valide

**Si Status: 401 Unauthorized:**

**➡️ Problème:** Session expirée ou cookies non envoyés. Voir [Section Authentification](#problème-authentification).

**Si Status: 404 Not Found:**

**➡️ Problème:** Endpoint backend non implémenté. Voir [Section Backend](#backend-endpoint-manquant).

**Si Status: 500 Internal Server Error:**

**➡️ Problème:** Erreur backend. Voir [Section Backend](#erreur-backend-500).

---

## 🔧 Solutions aux Problèmes Courants

### Backend Ne Retourne Pas de Données

#### Symptôme
```javascript
console.log(data);
// Output: { designs: [], influencers: [], merchandising: [] }
```

#### Cause
La base de données est vide ou le backend ne charge pas les données.

#### Solution

**1. Vérifier que les données existent en BDD:**

```sql
-- PostgreSQL
SELECT * FROM home_content_items;

-- Devrait retourner 17 lignes (6+5+6)
```

**2. Si la table est vide, initialiser les données:**

Voir `BACKEND_CONTENT_API_SPEC.md` section "Initialisation des Données".

**3. Si les données existent mais ne sont pas retournées:**

Vérifier que le contrôleur backend charge bien les données:

```typescript
// ❌ Mauvais
@Get()
async getContent() {
  return { designs: [], influencers: [], merchandising: [] };
}

// ✅ Bon
@Get()
async getContent() {
  const items = await this.prisma.homeContentItem.findMany();

  return {
    designs: items.filter(i => i.section === 'DESIGNS'),
    influencers: items.filter(i => i.section === 'INFLUENCERS'),
    merchandising: items.filter(i => i.section === 'MERCHANDISING')
  };
}
```

---

### imageUrl Null Au Lieu de Chaîne Vide

#### Symptôme
```javascript
{ imageUrl: null }  // ❌
```

#### Cause
Le backend retourne `null` depuis la base de données.

#### Solution

**Mapper pour convertir null en chaîne vide:**

```typescript
// Backend
return {
  designs: items.map(item => ({
    id: item.id,
    name: item.name,
    imageUrl: item.imageUrl || ''  // ✅ Convertir null en ""
  }))
};
```

**Alternative Prisma:**

```typescript
// prisma/schema.prisma
model HomeContentItem {
  imageUrl String @default("") @map("image_url")  // ✅ Default à ""
}
```

---

### Erreur de Chargement Image

#### Symptôme
```
❌ ContentImage: Erreur de chargement { src: "https://res.cloudinary.com/..." }
```

#### Causes Possibles

**1. URL Cloudinary invalide:**

```typescript
// ❌ URL incomplète
"cloudinary.com/image.jpg"

// ✅ URL complète
"https://res.cloudinary.com/your-cloud-name/image/upload/v123/image.jpg"
```

**2. Image supprimée de Cloudinary:**

L'URL existe en BDD mais l'image a été supprimée de Cloudinary.

**Test:** Ouvrir l'URL dans un nouvel onglet du navigateur. Si erreur 404, l'image n'existe plus.

**3. CORS bloqué:**

Cloudinary bloque les requêtes depuis le domaine localhost.

**Solution:** Configurer Cloudinary pour accepter votre domaine:

```typescript
// Backend Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true  // ✅ Utiliser HTTPS
});
```

**4. Mixed Content (HTTP/HTTPS):**

Le site est en HTTPS mais l'image est en HTTP.

**Solution:** Toujours utiliser `https://` dans les URLs Cloudinary.

---

### Composant Non Rendu

#### Symptôme
Aucun log `ContentImage` dans la console.

#### Cause
Le composant `ContentImage` n'est pas monté ou la condition d'affichage empêche le rendu.

#### Solution

**Vérifier le code dans `ContentManagementPage.tsx`:**

```typescript
// ❌ Mauvais - n'affiche rien si displayUrl est vide
{displayUrl ? (
  <ContentImage src={displayUrl} />
) : null}

// ✅ Bon - affiche toujours ContentImage (avec fallback si vide)
<ContentImage src={displayUrl} />
```

---

### Problème CSS ou Affichage

#### Symptôme
- ✅ L'image se charge sans erreur
- ❌ Mais elle n'est pas visible à l'écran

#### Causes Possibles

**1. Image cachée par overflow:**

```css
/* Conteneur parent */
.parent {
  overflow: hidden;
  height: 0;  /* ❌ Hauteur nulle */
}
```

**Solution:** Vérifier que le conteneur a une hauteur définie.

**2. Image en `display: none`:**

Vérifier avec DevTools (Inspecter l'élément) si l'image a `display: none`.

**3. z-index négatif:**

L'image est derrière d'autres éléments.

**4. opacity: 0:**

L'image est invisible mais chargée.

**Solution:** Inspecter l'élément `<img>` dans DevTools et vérifier les styles appliqués.

---

### Problème Authentification

#### Symptôme
```
GET /admin/content → 401 Unauthorized
```

#### Cause
Les cookies de session ne sont pas envoyés ou la session est expirée.

#### Solution

**1. Vérifier que les cookies sont envoyés:**

Dans l'onglet **Network**, cliquer sur la requête `/admin/content`:

**Request Headers** devrait contenir:
```
Cookie: session=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Si absent:**

- Le frontend n'envoie pas `credentials: 'include'`
- Le backend ne configure pas CORS correctement

**2. Vérifier la configuration frontend:**

```typescript
// contentService.ts
fetch(url, {
  credentials: 'include',  // ✅ Doit être présent
  headers: getAuthHeaders()
})
```

**3. Vérifier la configuration backend CORS:**

```typescript
// main.ts
app.enableCors({
  origin: 'http://localhost:5175',
  credentials: true,  // ✅ IMPORTANT
  methods: ['GET', 'POST', 'PUT', 'DELETE']
});
```

**4. Se reconnecter:**

Déconnexion → Reconnexion pour obtenir une nouvelle session.

---

### Backend Endpoint Manquant

#### Symptôme
```
GET /admin/content → 404 Not Found
```

#### Cause
L'endpoint n'est pas implémenté dans le backend.

#### Solution

Implémenter l'endpoint selon les spécifications dans `BACKEND_CONTENT_API_SPEC.md`.

**Vérifier que le contrôleur est enregistré:**

```typescript
// app.module.ts
@Module({
  controllers: [ContentController],  // ✅ Doit être ici
  ...
})
export class AppModule {}
```

---

### Erreur Backend 500

#### Symptôme
```
GET /admin/content → 500 Internal Server Error
```

#### Cause
Exception non gérée dans le backend.

#### Solution

**1. Consulter les logs backend:**

```bash
# Terminal backend
npm run start:dev

# Chercher les logs d'erreur
[Nest] ERROR [ExceptionsHandler] ...
```

**2. Causes communes:**

- **Prisma non connecté:** `PrismaClient is not connected`
  - **Solution:** Vérifier `DATABASE_URL` dans `.env`

- **Table inexistante:** `relation "home_content_items" does not exist`
  - **Solution:** Exécuter les migrations Prisma

- **Cloudinary non configuré:** `Must supply api_key`
  - **Solution:** Vérifier les variables d'environnement Cloudinary

---

## 🧪 Tests de Diagnostic

### Test 1: Vérifier l'API Backend

```bash
# Depuis le terminal
curl -X GET http://localhost:3000/admin/content \
  -H "Cookie: session=<votre-session-cookie>" \
  -v

# Résultat attendu:
# < HTTP/1.1 200 OK
# { "designs": [...], "influencers": [...], "merchandising": [...] }
```

### Test 2: Vérifier Upload

```bash
curl -X POST "http://localhost:3000/admin/content/upload?section=designs" \
  -H "Cookie: session=<votre-session-cookie>" \
  -F "file=@/path/to/test-image.jpg" \
  -v

# Résultat attendu:
# < HTTP/1.1 200 OK
# { "success": true, "data": { "url": "https://..." } }
```

### Test 3: Vérifier Cloudinary

```bash
# Tester une URL Cloudinary directement
curl -I https://res.cloudinary.com/your-cloud-name/image/upload/v123/test.jpg

# Résultat attendu:
# HTTP/2 200
```

---

## 📋 Checklist de Débogage

### Frontend

- [ ] Console ouverte (F12)
- [ ] Logs `📦 Données chargées` visibles
- [ ] `data.designs` contient des items
- [ ] `item.imageUrl` est une chaîne (pas null)
- [ ] Logs `🔄 ContentImage: src changé` visibles
- [ ] Pas d'erreurs `❌` dans les logs ContentImage
- [ ] Network tab: GET `/admin/content` → 200 OK
- [ ] Request Headers contient `Cookie:`
- [ ] Response Body est valide JSON

### Backend

- [ ] Endpoint GET `/admin/content` implémenté
- [ ] Endpoint POST `/admin/content/upload` implémenté
- [ ] Base de données contient 17 items
- [ ] `imageUrl` retourne `""` si null
- [ ] CORS configuré avec `credentials: true`
- [ ] AuthGuard vérifie les cookies
- [ ] Cloudinary configuré correctement
- [ ] Logs backend sans erreur

### Base de Données

- [ ] Table `home_content_items` existe
- [ ] 17 lignes présentes (6 designs, 5 influencers, 6 merchandising)
- [ ] Colonne `image_url` existe
- [ ] IDs sont stables (cuid/uuid)

---

## 🆘 Si Rien Ne Fonctionne

### Procédure de Reset Complet

**1. Backend:**

```bash
# Réinitialiser la base de données
npx prisma migrate reset --force

# Regénérer le client Prisma
npx prisma generate

# Seed les données
npx prisma db seed

# Redémarrer le backend
npm run start:dev
```

**2. Frontend:**

```bash
# Supprimer node_modules et reinstaller
rm -rf node_modules package-lock.json
npm install

# Nettoyer le cache Vite
rm -rf node_modules/.vite

# Redémarrer
npm run dev
```

**3. Navigateur:**

- Vider le cache (Ctrl+Shift+Delete)
- Supprimer les cookies pour localhost
- Hard refresh (Ctrl+Shift+R)

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide:

1. **Capturer les logs:**
   - Console navigateur (copier tout)
   - Network tab (exporter HAR)
   - Logs backend (dernières 50 lignes)

2. **Vérifier la version:**
   - Node.js: `node -v`
   - npm: `npm -v`
   - Backend framework version

3. **Informations système:**
   - OS
   - Navigateur
   - Résolution d'écran (pour problèmes CSS)

---

**Date:** 6 février 2026
**Guide de Debug:** Images Content Management
**Statut:** Diagnostic complet

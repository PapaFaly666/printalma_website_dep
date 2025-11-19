# Guide de Test - Sauvegarde des Personnalisations

## ✅ Corrections Appliquées

Le backend a été corrigé pour:
1. **Détecter et corriger automatiquement** le bug du double array `[[]]`
2. **Filtrer les éléments invalides**
3. **Logger tous les détails** pour le debugging

---

## 🧪 Test Manuel

### 1. Ouvrir le frontend

```bash
cd /home/pfdev/Bureau/PrintalmaProject/printalma_website_dep
npm run dev
```

### 2. Aller sur une page de personnalisation

```
http://localhost:5174/product/5/customize
```

### 3. Ajouter un design

1. Cliquer sur "Ajouter un design"
2. Sélectionner une image ou ajouter du texte
3. Positionner l'élément
4. Attendre 3 secondes (auto-save automatique)

### 4. Vérifier les logs

**Logs Frontend (Console navigateur):**
```
💾 [CustomizationService] Sauvegarde personnalisation: {...}
✅ [CustomizationService] Personnalisation sauvegardée: {...}
✅ [Customization] Sauvegardé en BDD, ID: 30
```

**Logs Backend (Terminal):**
```
[CustomizationService] Sauvegarde personnalisation - Product: 5, User: guest
📥 DTO reçu dans service:
  - designElements: présent
  - Conversion de designElements vers elementsByView[13-13] (1 éléments)
✅ Created customization 30:
  - designElements: 1 éléments
  - elementsByView: {"13-13":[{...}]}
```

### 5. Vérifier en base de données

```sql
-- Se connecter à PostgreSQL
psql -U votre_user -d votre_database

-- Vérifier la dernière personnalisation
SELECT
  id,
  product_id,
  color_variation_id,
  view_id,
  status,
  jsonb_array_length(design_elements) as nb_elements_simple,
  jsonb_typeof(elements_by_view) as type_multi_vues,
  created_at,
  updated_at
FROM product_customizations
ORDER BY created_at DESC
LIMIT 1;
```

**Résultat attendu:**
```
id | product_id | color_variation_id | view_id | status | nb_elements_simple | type_multi_vues | created_at | updated_at
---|------------|-------------------|---------|--------|-------------------|-----------------|------------|------------
30 | 5          | 13                | 13      | draft  | 1                 | object          | 2025-11-18 | 2025-11-18
```

### 6. Vérifier le contenu JSON

```sql
-- Voir les éléments de design (format simple)
SELECT design_elements FROM product_customizations WHERE id = 30;

-- Voir les éléments par vue (format multi-vues)
SELECT elements_by_view FROM product_customizations WHERE id = 30;
```

**Résultat attendu (design_elements):**
```json
[
  {
    "id": "element-1763495036578-88fw6uiz5",
    "type": "image",
    "imageUrl": "https://res.cloudinary.com/...",
    "x": 0.573,
    "y": 0.433,
    "width": 223.53,
    "height": 223.53,
    "rotation": 0,
    "naturalWidth": 2000,
    "naturalHeight": 2000,
    "zIndex": 0
  }
]
```

**PAS attendu (bug corrigé):**
```json
[[]]  ❌ Ce bug est maintenant corrigé automatiquement
```

---

## 🔍 Vérification de la Correction du Bug

Le backend détecte maintenant automatiquement les données corrompues:

### Cas 1: Données normales

**Frontend envoie:**
```json
{
  "designElements": [
    {"id": "el1", "type": "image", ...}
  ]
}
```

**Logs backend:**
```
📥 DTO reçu dans service:
  - designElements: présent
  - Conversion de designElements vers elementsByView[13-13] (1 éléments)
✅ Created customization: 1 éléments
```

**Résultat en DB:** ✅ Correct

### Cas 2: Données corrompues (bug détecté)

**Frontend envoie (erreur):**
```json
{
  "designElements": [[]]
}
```

**Logs backend:**
```
📥 DTO reçu dans service:
  - designElements: présent
⚠️ BUG DÉTECTÉ dans vue 13-13: array imbriqué! Correction automatique...
  Avant: [[]]
  Après: []
⚠️ Élément invalide filtré: []
✅ Created customization: 0 éléments
```

**Résultat en DB:** ✅ Corrigé (array vide au lieu de `[[]]`)

---

## 🐛 Debugging

### Si les données ne sont PAS sauvegardées

1. **Vérifier que le backend tourne:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Vérifier les logs backend:**
   ```bash
   cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep
   npm run start:dev
   ```

3. **Vérifier la connexion DB:**
   ```bash
   psql -U votre_user -d votre_database -c "SELECT 1"
   ```

### Si les données sont corrompues (encore)

1. **Vérifier la version du service:**
   ```bash
   grep "BUG DÉTECTÉ" /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep/src/customization/customization.service.ts
   ```

   Devrait afficher les lignes de correction.

2. **Vérifier que le backend a redémarré:**
   ```bash
   ps aux | grep "nest start"
   ```

3. **Forcer le redémarrage:**
   ```bash
   pkill -f "nest start"
   cd /home/pfdev/Bureau/PrintalmaProject/printalma-back-dep
   npm run start:dev
   ```

---

## ✅ Checklist de Test

- [ ] Frontend démarre sans erreur
- [ ] Backend démarre sans erreur
- [ ] Page de personnalisation charge correctement
- [ ] Peut ajouter un élément (image ou texte)
- [ ] Auto-save fonctionne (après 3 secondes)
- [ ] Logs frontend affichent "✅ Sauvegardé en BDD"
- [ ] Logs backend affichent "✅ Created customization"
- [ ] Données en DB sont correctes (pas de `[[]]`)
- [ ] `design_elements` contient un array d'objets valides
- [ ] `elements_by_view` contient un objet avec clés de vues

---

## 📊 Métriques de Succès

✅ **Test réussi si:**
- Aucune erreur dans les logs
- `designElements` en DB = array d'objets valides
- `elementsByView` en DB = objet avec vues
- Pas de `[[]]` ni `[]` dans `designElements`
- Le contenu peut être rechargé correctement

❌ **Test échoué si:**
- Erreur 500 du backend
- `designElements` = `[[]]` en DB
- `elementsByView` = null ou invalide
- Impossible de recharger la personnalisation

---

## 🎯 Prochaines Étapes

1. **Tester la sauvegarde** ✅ (Ce test)
2. **Tester la récupération** (Recharger la page)
3. **Tester la commande** (Créer une commande avec la personnalisation)
4. **Tester la migration** guest → user (Se connecter après avoir personnalisé)

---

## 📝 Notes

- Le backend stocke **TOUJOURS les deux formats** pour compatibilité
- La correction du bug est **automatique et transparente**
- Les logs détaillés permettent de **tracer tous les problèmes**
- Le frontend a un **système de backup** dans localStorage si le backend échoue

---

## 🆘 Support

En cas de problème, vérifier:

1. **Logs backend détaillés** dans le terminal
2. **Logs frontend** dans la console navigateur (F12)
3. **État de la BDD** avec les requêtes SQL ci-dessus
4. **Connexion réseau** entre frontend (5174) et backend (3000)

**Fichiers modifiés:**
- `printalma-back-dep/src/customization/customization.service.ts`
- Lignes 62-113 (validation automatique)
- Lignes 89-113 (correction du bug)

# 🛠️ Backend – Mise à niveau des délimitations (prompt à copier/coller)

Bonjour l'équipe 👋,

Voici **le cahier des charges minimum** pour corriger définitivement le problème de décalage des zones de personnalisation sur le front :

---
## 1️⃣ Objectif
Garantir que chaque délimitation soit associée aux **dimensions natives** de l'image sur laquelle elle a été créée. Le front peut ensuite calculer l'échelle exacte quelle que soit la taille d'affichage.

---
## 2️⃣ Changement de schéma
```sql
ALTER TABLE delimitations
ADD COLUMN reference_width  INTEGER NULL,
ADD COLUMN reference_height INTEGER NULL;
```

*Les nouvelles colonnes sont optionnelles pour les enregistrements en PERCENTAGE (0-100). Elles sont **obligatoires** pour les enregistrements en PIXEL.*

---
## 3️⃣ Migration des anciennes données
```sql
-- Étape 1 : remplir reference_width/height pour les délimitations PIXEL
UPDATE delimitations d
JOIN product_images i ON i.id = d.product_image_id
SET d.reference_width  = i.natural_width,
    d.reference_height = i.natural_height
WHERE d.coordinate_type = 'PIXEL'
  AND (d.reference_width IS NULL OR d.reference_height IS NULL);

-- Étape 2 : (optionnel) convertir tous les enregistrements PIXEL en PERCENTAGE
UPDATE delimitations d
JOIN product_images i ON i.id = d.product_image_id
SET d.x      = d.x      / i.natural_width  * 100,
    d.y      = d.y      / i.natural_height * 100,
    d.width  = d.width  / i.natural_width  * 100,
    d.height = d.height / i.natural_height * 100,
    d.coordinate_type = 'PERCENTAGE'
WHERE d.coordinate_type = 'PIXEL';
```

---
## 4️⃣ API – Contrats à jour
### Création (POST /delimitations)
```jsonc
{
  "productImageId": 123,
  "delimitation": {
    "x": 665,
    "y": 407,
    "width": 662,
    "height": 790,
    "name": "Zone logo",
    "coordinateType": "PIXEL",        // ou "PERCENTAGE"
    "referenceWidth": 2000,             // requis si PIXEL
    "referenceHeight": 1600             // requis si PIXEL
  }
}
```

### Lecture (GET /delimitations/image/:id)
La réponse doit renvoyer **les mêmes champs** :
```jsonc
{
  "imageId": 123,
  "naturalWidth": 2000,
  "naturalHeight": 1600,
  "delimitations": [
    {
      "id": 221,
      "x": 665,
      "y": 407,
      "width": 662,
      "height": 790,
      "name": "Zone logo",
      "coordinateType": "PIXEL",
      "referenceWidth": 2000,
      "referenceHeight": 1600
    }
  ]
}
```

---
## 5️⃣ Règles de validation côté backend
1. **PIXEL** : `referenceWidth` & `referenceHeight` > 0 obligatoires.
2. **PERCENTAGE** : valeurs 0-100 et `x+width ≤ 100`, `y+height ≤ 100`.
3. Toujours renvoyer `referenceWidth/Height` si dispo.

---
## 6️⃣ Impact front
Le composant `DelimitationPreviewImage` utilise :
```ts
scaleX = displayedImageWidth  / referenceWidth;
scaleY = displayedImageHeight / referenceHeight;
```
– Si les deux valeurs sont transmises, l'overlay est **parfaitement aligné**.  
– Si elles manquent, un ⚠️ apparaît et la zone est estimée (approximation).

---
Merci de confirmer quand c'est en place ! 🙏 
# 📐 Guide Backend – Délimitations « par rapport à l’image »

## Objectif
Garantir que chaque zone de personnalisation soit **toujours** positionnée / dimensionnée à partir des dimensions réelles de l’image (et non du viewport), de sorte qu’elle suive parfaitement l’image lors de l’affichage (zoom, resize, mobile, etc.).

---

## 1. Référence unique : pourcentages
| Champ | Plage | Signification |
|-------|-------|---------------|
| `x`   | 0 – 100 | % depuis le bord **gauche** de l’image originale |
| `y`   | 0 – 100 | % depuis le bord **haut** de l’image |
| `width`  | 0 – 100 | % de la **largeur** de l’image |
| `height` | 0 – 100 | % de la **hauteur** de l’image |
| `coordinateType` | *string* | Toujours `"PERCENTAGE"` après validation |

*Pourquoi ?* → Le côté front convertit ensuite en pixels en fonction de la taille **affichée**, ce qui rend l’affichage 100 % responsive.

---

## 2. Schéma recommandé
```prisma
model Delimitation {
  id             Int      @id @default(autoincrement())
  productImageId Int
  x              Float    // 0-100
  y              Float    // 0-100
  width          Float    // 0-100
  height         Float    // 0-100
  name           String?  // ex : « Zone Logo »
  rotation       Float?   // (optionnel) °
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 3. Endpoints
### 3.1 POST `/delimitations`
```jsonc
{
  "productImageId": 42,
  "delimitation": {
    "x": 12.5,
    "y": 7,
    "width": 30,
    "height": 20,
    "name": "Zone poitrine",
    "coordinateType": "PERCENTAGE"
  }
}
```
*Validations côté backend* :
```ts
if (payload.coordinateType !== 'PERCENTAGE') {
  // convert possible pixels → % ici ou renvoyer 400
}
// Plage 0-100 et pas de débordement
if (x<0||y<0||width<=0||height<=0||x+width>100||y+height>100) {
  throw 400;
}
```

### 3.2 GET `/delimitations/image/:id`
Réponse :
```jsonc
{
  "imageId": 42,
  "naturalWidth": 2400,
  "naturalHeight": 3200,
  "delimitations": [
    { "id":1,"x":12.5,"y":7,"width":30,"height":20,"name":"Zone poitrine"}
  ]
}
```
> Front utilise `naturalWidth`/`naturalHeight` uniquement s’il doit convertir de vieux enregistrements en pixels.

### 3.3 PUT / DELETE : même logique.

---

## 4. Migration des anciennes données
```sql
-- Convertir les entrées en pixels (>100) en %
UPDATE Delimitation d
JOIN ProductImage i ON i.id = d.productImageId
SET d.x      = d.x      / i.naturalWidth  * 100,
    d.y      = d.y      / i.naturalHeight * 100,
    d.width  = d.width  / i.naturalWidth  * 100,
    d.height = d.height / i.naturalHeight * 100
WHERE d.width  > 100 OR d.height > 100;
```

---

## 5. Tests minimalistes
1. **Create + Get** : envoyer (x=10, w=20) → récupérer les mêmes valeurs.
2. **Limite** : tenter x=90, width=20 → 400.
3. **Migration** : sur un record width=800, la requête GET renvoie width≈33.(…).

---

### Ticket résumé (copier / coller)
> **Bug** : certaines délimitations reviennent en pixels mais taggées « PERCENTAGE » → elles se placent mal en front.  
> **Solution** : le backend valide/persiste 100 % des coordonnées en pourcentages, renvoie `naturalWidth/Height`, et migre les enregistrements existants. 

# Migration des délimitations : Ajout des dimensions de référence

## Contexte
Les délimitations (zones de personnalisation) peuvent être stockées en pixels ou en pourcentages. Pour garantir un affichage cohérent sur le front, nous avons besoin des dimensions de l'image originale au moment où la délimitation a été créée.

## Changements requis

### 1. Schéma de la table Delimitation
Ajouter deux colonnes :
```sql
ALTER TABLE delimitations
ADD COLUMN reference_width INTEGER,
ADD COLUMN reference_height INTEGER;
```

### 2. Migration des données existantes
Pour chaque délimitation existante :
- Si la délimitation est en PIXEL :
  ```sql
  UPDATE delimitations d
  SET reference_width = (SELECT width FROM images i WHERE i.id = d.image_id),
      reference_height = (SELECT height FROM images i WHERE i.id = d.image_id)
  WHERE coordinate_type = 'PIXEL';
  ```
- Si la délimitation est en PERCENTAGE, les valeurs peuvent rester NULL

### 3. API Endpoints

#### Création de délimitation
```typescript
interface CreateDelimitationDTO {
  productImageId: number;
  delimitation: {
    x: number;
    y: number;
    width: number;
    height: number;
    name?: string;
    coordinateType: 'PERCENTAGE' | 'PIXEL';
    referenceWidth?: number;  // Nouveau
    referenceHeight?: number; // Nouveau
  };
}
```

#### Réponse GET /delimitations/image/:imageId
```typescript
interface Delimitation {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  name?: string;
  coordinateType: 'PERCENTAGE' | 'PIXEL';
  referenceWidth?: number;  // Nouveau
  referenceHeight?: number; // Nouveau
}
```

## Validation
- Pour les nouvelles délimitations en PIXEL : `referenceWidth` et `referenceHeight` sont obligatoires
- Pour les délimitations en PERCENTAGE : ces champs sont optionnels
- Les valeurs doivent être > 0 si fournies

## Logique métier
1. À la création d'une délimitation :
   - Si coordinateType = 'PIXEL' :
     - Exiger referenceWidth/Height
     - Stocker ces valeurs
   - Si coordinateType = 'PERCENTAGE' :
     - Valeurs optionnelles
     - Si fournies, les stocker

2. À la récupération :
   - Toujours renvoyer referenceWidth/Height s'ils existent
   - Pour les anciennes délimitations sans référence :
     - Option 1 : Récupérer les dimensions de l'image associée
     - Option 2 : Renvoyer null (le front gérera le fallback)

## Sécurité
- Valider que referenceWidth/Height sont positifs
- Vérifier que l'image existe avant de créer une délimitation
- Nettoyer les entrées utilisateur

## Tests
1. Créer une délimitation en PIXEL avec référence
2. Créer une délimitation en PERCENTAGE sans référence
3. Récupérer les délimitations et vérifier les champs
4. Tester la migration sur un jeu de données existant

## Impact sur le front-end
Le front utilisera ces dimensions pour calculer correctement l'échelle des délimitations, assurant un affichage cohérent quelle que soit la taille d'affichage de l'image. 
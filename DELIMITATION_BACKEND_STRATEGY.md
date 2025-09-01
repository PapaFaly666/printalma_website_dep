# 🎯 Stratégie Backend – Zones de Personnalisation

## Objectif
Garantir que les zones de personnalisation (délimitations) s’affichent toujours correctement, quel que soit le redimensionnement de l’image ou le support (web, mobile, etc.).

---

## 1. Unifier le référentiel de coordonnées
- **Recommandation :** stocker **toujours** les coordonnées en **pourcentages**.
- L’API accepte deux modes (`coordinateType = PIXEL | PERCENTAGE`) ; si le frontend envoie des pixels, **convertir** en pourcentages **avant** de persister.
- Script de migration → convertir les anciens enregistrements (pixels → %).

```sql
-- Exemple de conversion (pseudo-SQL)
UPDATE Delimitation
SET x      = (x      / imgWidth ) * 100,
    y      = (y      / imgHeight) * 100,
    width  = (width  / imgWidth ) * 100,
    height = (height / imgHeight) * 100,
    coordinateType = 'PERCENTAGE'
WHERE coordinateType = 'PIXEL';
```

---

## 2. Schéma (Prisma / ORM)
```prisma
model Delimitation {
  id             Int          @id @default(autoincrement())
  productImage   ProductImage @relation(fields: [productImageId], references: [id])
  productImageId Int
  x              Float  // 0-100 %
  y              Float  // 0-100 %
  width          Float  // 0-100 %
  height         Float  // 0-100 %
  name           String?
  rotation       Float?
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

---

## 3. Endpoints API
| Méthode | Route | Notes |
|---------|-------|-------|
| `POST`  | `/delimitations` | Payload accepté en `%` ou `px`. Convertir en `%` avant `create`. |
| `GET`   | `/delimitations/image/:imageId` | Toujours retourner les délimitations **en %** + `{naturalWidth, naturalHeight}` de l’image. |
| `PUT`   | `/delimitations/:id` | Même logique de conversion. |
| `DELETE`| `/delimitations/:id` | Suppression classique. |

---

## 4. Validation serveur (pseudo-code)
```ts
if (x < 0 || y < 0 || width <= 0 || height <= 0) throw BadRequest;
if (x + width > 100 || y + height > 100) throw BadRequest;
```

---

## 5. Tests à prévoir
- **Unitaires** : vérif. conversion px→% et validations hors limites.
- **E2E** : round-trip → créer → récupérer → valeurs identiques ±0,1 %.
- **Migration** : script de conversion des anciennes données.

---

## 6. Communication Front ↔ Back
- Documenter dans l’API : _« Le backend persiste **toujours** en pourcentages. `coordinateType` indique seulement si le backend doit convertir à la volée. »_
- Fournir exemples Postman / Swagger pour chaque scénario.

---

## 7. Plan de déploiement
1. Ajouter la colonne `rotation` (nullable) + sauvegarde.
2. Déployer la logique de conversion dans les endpoints.
3. Lancer le **script de migration** pour transformer les entrées existantes.
4. Mettre à jour le frontend pour envoyer systématiquement `coordinateType = 'PERCENTAGE'`.

---

### Prompt résumé (pour un ticket Jira)
> « Bug d’alignement des zones de personnalisation : coordonnées parfois enregistrées en pixels et interprétées comme %. Actions :  
> 1. Stockage canonique en % ; convertir les pixels côté backend.  
> 2. Ajouter `coordinateType` dans l’API + migration des données.  
> 3. Fournir dimensions natives sur les endpoints `GET`.  
> 4. Tests e2e round-trip. » 
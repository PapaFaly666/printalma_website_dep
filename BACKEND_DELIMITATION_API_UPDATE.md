# 📐 Backend — Mise à jour de l’API Délimitations 

## Contexte

Sur le front, la pré-visualisation des zones de personnalisation utilise la taille **réelle** de l’image sur laquelle l’admin a dessiné les délimitations.  
Si cette taille n’est pas connue lors de l’affichage (page détail produit, apps partenaires, etc.), nous calculons les positions en nous basant sur la miniature livrée par le backend.  
Même avec un ratio identique, une miniature redimensionnée génère un écart de plusieurs pixels par rapport à l’aperçu d’origine.

## Objectif

1. Garantir une restitution **pixel-perfect** des délimitations, quelle que soit la taille de l’image servie.  
2. Uniformiser le format (toujours coordonnées en **pourcentages** dans la BDD) pour éviter les confusions.

## Spécification des champs supplémentaires
| Champ                     | Type    | Obligatoire | Description                                                             |
|---------------------------|---------|-------------|-------------------------------------------------------------------------|
| `referenceWidth`          | number  | oui         | Largeur (en px) de l’image **référence** au moment où la zone a été créée. |
| `referenceHeight`         | number  | oui         | Hauteur (en px) de la même image.                                       |

*Ces deux champs remplacent le préfixe `_debug.realImageSize` actuellement utilisé en front.*

### Exemple de payload **GET**
```json
{
  "id": 62,
  "productImageId": 12,
  "x": 377,
  "y": 366,
  "width": 394,
  "height": 442,
  "coordinateType": "PIXEL",          // ⚠️ à migrer vers PERCENTAGE (voir ci-dessous)
  "rotation": 0,
  "referenceWidth": 1200,
  "referenceHeight": 1200,
  "createdAt": "2024-06-11T12:00:00Z",
  "updatedAt": "2024-06-11T12:00:00Z"
}
```

### Exemple de payload **POST / PUT** (côté front)
Le front continuera d’envoyer **uniquement** des pourcentages :
```json
{
  "productImageId": 12,
  "delimitation": {
    "x": 31.42,
    "y": 28.75,
    "width": 25.00,
    "height": 37.00,
    "name": "Zone logo",
    "coordinateType": "PERCENTAGE",
    "referenceWidth": 1200,
    "referenceHeight": 1200
  }
}
```

> Les champs `referenceWidth/Height` permettent quand même de re-convertir en pixels côté back si besoin (logs, exports, contraintes, etc.).

## Étapes pour l’équipe backend

1. **Migration DB** :  
   ajouter deux colonnes `referenceWidth` et `referenceHeight` (`INT`, `NOT NULL`, > 0) à la table `delimitations`.

2. **Update modèle Prisma / ORM**.

3. **Middleware de validation** :
   * Vérifier que les deux champs sont présents et cohérents (> 0).
   * Interdire désormais `coordinateType = PIXEL` en entrée (deprecated).  
     → Accepter seulement `PERCENTAGE`.

4. **Conversion automatique** *(migrations legacy)* :
   * Parcourir les délimitations existantes ayant encore des pixels (> 100 ou `PIXEL`).
   * Pour chaque zone :
     ```
     percentX = (x_px / referenceWidth)  * 100
     percentY = (y_px / referenceHeight) * 100
     ...
     ```
   * Stocker ces valeurs en PERCENTAGE + remplir `referenceWidth/Height`.

5. **Réponses API** :
   * Toujours retourner `coordinateType: "PERCENTAGE"`.
   * Inclure `referenceWidth` et `referenceHeight`.

6. **Versionnage / doc** :
   * Incrémenter la version de l’API (`v1.2` par ex.).
   * Mettre à jour Swagger / Postman.

## Impact côté front
Aucun changement :  
`DelimitationPreviewImage` lit déjà `referenceWidth/Height` et retombe sur un fallback (`naturalWidth`) si absent.  
En fournissant systématiquement ces champs, l’affichage de la page détail sera 100 % aligné sur celui de la modale d’édition.

---
*Auteur : Front-end Team  
Date : 11 juin 2024* 
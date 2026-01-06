# Modifications Backend - Onboarding Vendeur

## Problème

Le frontend a été modifié pour rendre l'onboarding complètement optionnel. L'endpoint `/api/vendor/complete-onboarding` doit maintenant accepter :

1. **Tous les champs optionnels** : Téléphones, réseaux sociaux et photo de profil sont maintenant optionnels
2. **Flag `keepExistingImage`** : Permet de garder la photo de profil existante sans la renvoyer
3. **Possibilité de soumettre un profil vide** : Le vendeur peut ignorer l'onboarding complètement

## Erreur Actuelle

```
{
  message: 'La photo de profil est requise',
  error: 'Bad Request',
  statusCode: 400
}
```

Cette erreur se produit quand :
- Le vendeur a déjà une photo de profil
- Il modifie uniquement ses téléphones ou réseaux sociaux
- Le frontend n'envoie pas de nouveau fichier image
- Le backend rejette la requête car `profileImage` est `null`

## Modifications Requises Backend

### 1. Rendre tous les champs complètement optionnels

Dans le contrôleur d'onboarding (`/api/vendor/complete-onboarding`), modifier la validation pour :

```typescript
// AVANT (validation stricte)
if (!req.file) {
  throw new BadRequestException('La photo de profil est requise');
}
if (!phones || phones.length < 2) {
  throw new BadRequestException('Au moins 2 numéros requis');
}

// APRÈS (tous les champs optionnels)
const keepExistingImage = req.body.keepExistingImage === 'true';

// Photo de profil : complètement optionnelle
if (keepExistingImage) {
  // Garder l'image existante
  console.log('Garder l\'image existante du vendeur');
} else if (req.file) {
  // Mettre à jour avec la nouvelle image
  vendorExtended.profileImage = `/uploads/vendors/${req.file.filename}`;
}
// Si ni keepExistingImage ni req.file : aucune image (OK)

// Téléphones : optionnels (peut être vide, 1, 2 ou 3)
if (phones && phones.length > 0) {
  // Valider seulement si fournis
  if (phones.length > 3) {
    throw new BadRequestException('Maximum 3 numéros autorisés');
  }
  // Traiter les numéros
}

// Réseaux sociaux : optionnels
if (socialMedia && socialMedia.length > 0) {
  // Traiter les réseaux sociaux
}
```

### 2. Accepter 0 à 3 numéros de téléphone (au lieu de 2 à 3 obligatoires)

Modifier la validation des téléphones dans **`/api/vendor/complete-onboarding`** :

```typescript
// AVANT
if (!phones || phones.length < 2 || phones.length > 3) {
  throw new BadRequestException('Vous devez fournir entre 2 et 3 numéros de téléphone');
}

// APRÈS (0 à 3 numéros acceptés)
if (phones && phones.length > 3) {
  throw new BadRequestException('Vous ne pouvez pas avoir plus de 3 numéros de téléphone');
}
// Si phones est undefined ou vide, c'est OK
```

Modifier également la validation dans **`/api/vendor/update-phones`** :

```typescript
// AVANT
if (!phones || phones.length < 2 || phones.length > 3) {
  throw new BadRequestException('Vous devez fournir entre 2 et 3 numéros de téléphone');
}

// APRÈS (0 à 3 numéros acceptés)
if (phones && phones.length > 3) {
  throw new BadRequestException('Vous ne pouvez pas avoir plus de 3 numéros de téléphone');
}
// Si phones est undefined ou vide, c'est OK
```

### 3. Gérer la suppression complète des numéros

Lors de la mise à jour des téléphones, permettre de tout supprimer (même tous les numéros) :

```typescript
// Supprimer tous les numéros existants
await VendorPhone.destroy({
  where: {
    vendorId: vendor.id
  }
});

// Recréer les numéros fournis (peut être 0, 1, 2 ou 3)
if (phones && phones.length > 0) {
  for (const phone of phones) {
    await VendorPhone.create({
      vendorId: vendor.id,
      number: phone.number,
      isPrimary: phone.isPrimary
    });
  }
}
// Si phones est vide ou undefined, le vendeur n'aura plus de numéros (OK)
```

## Données Envoyées par le Frontend

### FormData
```
phones: JSON.stringify([...]) | undefined  // Optionnel, peut être vide
socialMedia: JSON.stringify([...]) | undefined  // Optionnel
profileImage: File | null  // Optionnel
keepExistingImage: "true" | undefined  // Optionnel
```

### Exemple 1 : Onboarding complètement vide (vendeur ignore tout)

```javascript
{
  // Aucun champ - Le backend doit accepter !
}
```

### Exemple 2 : Requête sans nouvelle image (garde l'existante)

```javascript
{
  phones: JSON.stringify([
    {number: "+221771234567", isPrimary: true}
  ]),
  keepExistingImage: "true"
  // Pas de profileImage
}
```

### Exemple 3 : Requête avec nouvelle image

```javascript
{
  phones: JSON.stringify([
    {number: "+221771234567", isPrimary: true},
    {number: "+221769876543", isPrimary: false}
  ]),
  profileImage: <File>
  // keepExistingImage n'est pas envoyé
}
```

### Exemple 4 : Seulement réseaux sociaux

```javascript
{
  socialMedia: JSON.stringify([
    {platform: "instagram", url: "https://instagram.com/user"}
  ])
  // Pas de phones, pas d'image
}
```

## Résumé des Changements

✅ **Frontend modifié** :
- **Page Onboarding** (`/vendeur/onboarding`) :
  - ✅ **TOUS les champs sont optionnels** (téléphones, photo, réseaux sociaux)
  - ✅ Bouton "Ignorer" permet de sauter complètement l'onboarding
  - ✅ Envoie `keepExistingImage: true` quand on garde l'image existante
  - ✅ Peut soumettre avec 0, 1, 2 ou 3 numéros de téléphone
  - ✅ Système d'alertes récurrentes (toutes les 1 minute) si l'onboarding est ignoré
- **Page Compte** (`/vendeur/account`) :
  - Permet de supprimer le numéro 2 (garde minimum 1 numéro)
  - Validation changée de 2-3 → 1-3 numéros
- **Alertes Récurrentes** :
  - Affichage automatique toutes les 1 minute si profil incomplet
  - Bouton "Fermer (X)" pour fermer temporairement (revient dans 1 min)
  - Bouton "Ignorer" pour fermer temporairement (revient dans 1 min)
  - Bouton "Compléter maintenant" redirige vers l'onboarding
  - ⚠️ **AUCUN moyen de désactiver définitivement les alertes** (par design)
  - Les alertes s'arrêtent **uniquement** quand le profil est complété

⚠️ **Backend à modifier** :
- **Endpoint `/api/vendor/complete-onboarding`** :
  - ✅ **Accepter une requête complètement vide** (tous les champs optionnels)
  - ✅ Accepter `keepExistingImage` comme flag pour ne pas exiger de nouvelle image
  - ✅ Changer la validation : 0 à 3 numéros acceptés (au lieu de 2-3 obligatoires)
  - ✅ Ne pas mettre à jour l'image si `keepExistingImage === true`
  - ✅ Accepter `phones: undefined` ou `phones: []`
  - ✅ Accepter `socialMedia: undefined` ou `socialMedia: []`
  - ✅ Ne pas exiger `profileImage`
- **Endpoint `/api/vendor/update-phones`** :
  - Changer la validation : 0 à 3 numéros (au lieu de 2-3)
  - Permettre de supprimer tous les numéros
- **⚠️ CRUCIAL - Endpoint `/api/vendor/profile-status`** :
  - Le frontend vérifie cet endpoint toutes les 1 minute
  - **Le frontend applique sa propre logique stricte** :
    ```typescript
    // Logique Frontend
    const isIncomplete =
      !status.profileCompleted ||
      status.details.phoneCount === 0 ||
      !status.details.hasProfileImage;
    ```
  - **L'alerte s'affiche si** :
    - `profileCompleted = false` OU
    - `phoneCount = 0` OU
    - `hasProfileImage = false`
  - **Pour que l'alerte disparaisse, le vendeur DOIT avoir** :
    - Au moins 1 numéro de téléphone ET
    - Une photo de profil
  - Le backend peut définir `profileCompleted` comme il veut, mais le frontend ajoute des vérifications supplémentaires

## Test de Validation

### Cas 1 : Nouvel utilisateur qui ignore l'onboarding
- ✅ Peut soumettre un formulaire complètement vide
- ✅ Aucun champ obligatoire
- ✅ Le backend crée un profil vendeur minimal

### Cas 2 : Utilisateur qui complète partiellement
- ✅ Peut fournir seulement 1 numéro (pas de photo)
- ✅ Peut fournir seulement une photo (pas de numéros)
- ✅ Peut fournir seulement des réseaux sociaux
- ✅ Toutes les combinaisons sont valides

### Cas 3 : Utilisateur existant qui modifie ses infos
- ✅ Peut garder son image existante (keepExistingImage: true)
- ✅ Peut uploader une nouvelle image
- ✅ Peut avoir 0, 1, 2 ou 3 numéros
- ✅ Peut tout supprimer et repartir à zéro

### Cas 4 : Système d'alertes
- ✅ Si l'utilisateur ignore l'onboarding → alerte toutes les 1 minute **indéfiniment**
- ✅ Peut fermer l'alerte temporairement (réapparaît après 1 min)
- ✅ Bouton "Ignorer" ferme temporairement (réapparaît après 1 min)
- ⚠️ **AUCUN moyen de désactiver définitivement** (par design)
- ✅ Si l'utilisateur complète l'onboarding → alertes arrêtées définitivement

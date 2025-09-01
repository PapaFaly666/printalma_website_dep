# 🧪 Guide de Test - Création Vendeur Étendue

## 📋 Vue d'ensemble

Ce guide détaille comment tester les nouvelles fonctionnalités de création de vendeurs avec les champs étendus.

## 🚀 Test de l'Interface

### 1. Ouvrir le formulaire de test

```bash
# Ouvrir le fichier de test dans le navigateur
open test-vendor-creation-extended.html
```

### 2. Tests à effectuer

#### ✅ Test 1 : Upload de photo de profil
- [ ] Cliquer sur "Choisir une photo"
- [ ] Sélectionner une image (JPG, PNG, GIF)
- [ ] Vérifier l'aperçu dans le cercle
- [ ] Tester avec un fichier > 5MB (doit être rejeté)
- [ ] Tester avec un fichier non-image (doit être rejeté)

#### ✅ Test 2 : Validation des champs obligatoires
- [ ] Laisser les champs obligatoires vides
- [ ] Cliquer sur "Créer le vendeur"
- [ ] Vérifier les messages d'erreur

#### ✅ Test 3 : Validation de l'email
- [ ] Entrer un email invalide
- [ ] Vérifier le message d'erreur

#### ✅ Test 4 : Validation du téléphone
- [ ] Entrer un numéro invalide
- [ ] Vérifier le message d'erreur

#### ✅ Test 5 : Sélection du type de vendeur
- [ ] Sélectionner chaque type de vendeur
- [ ] Vérifier l'aperçu qui s'affiche

#### ✅ Test 6 : Soumission complète
- [ ] Remplir tous les champs correctement
- [ ] Soumettre le formulaire
- [ ] Vérifier le résumé affiché

## 🔧 Test de l'Intégration React

### Démarrer l'application

```bash
# Démarrer le serveur de développement
npm run dev
```

### Naviguer vers la création de vendeur

1. Se connecter en tant qu'admin
2. Aller dans `/admin/clients`
3. Cliquer sur "Créer un nouveau vendeur"

### Tests d'intégration

#### ✅ Test 1 : Interface React
- [ ] Vérifier que le formulaire s'affiche correctement
- [ ] Vérifier la présence de tous les nouveaux champs
- [ ] Tester l'upload de photo
- [ ] Vérifier l'aperçu du type de vendeur

#### ✅ Test 2 : Validation côté client
- [ ] Tester les validations en temps réel
- [ ] Vérifier les messages d'erreur
- [ ] Tester la validation du téléphone
- [ ] Tester la validation de la photo

#### ✅ Test 3 : Soumission du formulaire
- [ ] Remplir le formulaire avec toutes les données
- [ ] Soumettre et vérifier l'envoi au backend
- [ ] Vérifier les données dans la console réseau

## 🌐 Test Backend (Simulation)

### Structure des données envoyées

```javascript
// FormData attendue au backend
{
  firstName: "Jean",
  lastName: "Dupont", 
  email: "jean.dupont@test.com",
  vendeur_type: "DESIGNER",
  phone: "+33 6 12 34 56 78",
  country: "France",
  address: "123 Rue de la Paix, 75001 Paris",
  shopName: "Ma Boutique Design",
  profilePhoto: File // Objet File si photo uploadée
}
```

### Test de l'endpoint avec curl

```bash
# Test de création de vendeur avec curl
curl -X POST http://localhost:3000/api/admin/create-vendor \
  -H "Content-Type: multipart/form-data" \
  -F "firstName=Jean" \
  -F "lastName=Dupont" \
  -F "email=jean.dupont@test.com" \
  -F "vendeur_type=DESIGNER" \
  -F "phone=+33612345678" \
  -F "country=France" \
  -F "address=123 Rue de la Paix" \
  -F "shopName=Ma Boutique" \
  -F "profilePhoto=@/path/to/image.jpg"
```

## 📊 Vérifications Post-Création

### Base de données

```sql
-- Vérifier l'insertion dans la base
SELECT 
  id, firstName, lastName, email, vendeur_type,
  phone, country, address, shop_name, profile_photo_url,
  created_at
FROM users 
WHERE email = 'jean.dupont@test.com';
```

### Fichiers uploadés

```bash
# Vérifier les fichiers dans le dossier uploads
ls -la uploads/profile-photos/
```

### Email de bienvenue

- [ ] Vérifier l'envoi de l'email
- [ ] Vérifier le contenu de l'email
- [ ] Tester le lien de connexion

## 🐛 Cas d'erreur à tester

### ❌ Test 1 : Email déjà existant
```javascript
// Tentative de création avec email existant
{
  email: "email.deja.existant@test.com"
  // ... autres champs
}
// Réponse attendue: 409 Conflict
```

### ❌ Test 2 : Champs requis manquants
```javascript
// Tentative sans champs obligatoires
{
  firstName: "",
  shopName: ""
  // ... 
}
// Réponse attendue: 400 Bad Request
```

### ❌ Test 3 : Fichier trop volumineux
```javascript
// Upload fichier > 5MB
// Réponse attendue: 400 Bad Request
```

### ❌ Test 4 : Type de fichier invalide
```javascript
// Upload fichier .txt au lieu d'image
// Réponse attendue: 400 Bad Request
```

## 📈 Tests de performance

### Temps de réponse
- [ ] Mesurer le temps de création sans photo
- [ ] Mesurer le temps de création avec photo
- [ ] Vérifier que ça reste < 5 secondes

### Taille des requêtes
- [ ] Vérifier la compression des images
- [ ] Tester avec images de différentes tailles

## 🔒 Tests de sécurité

### Authentification
- [ ] Tester sans être connecté (doit être rejeté)
- [ ] Tester avec un rôle vendeur (doit être rejeté)
- [ ] Tester avec un rôle admin (doit réussir)

### Validation des uploads
- [ ] Tenter d'uploader un script malveillant
- [ ] Tester les extensions de fichiers interdites
- [ ] Vérifier la validation du type MIME

## 📝 Rapport de test

### Template de rapport

```markdown
## Rapport de Test - Création Vendeur Étendue

**Date:** [Date du test]
**Testeur:** [Nom]
**Version:** [Version de l'app]

### Résultats

| Test | Statut | Commentaires |
|------|---------|-------------|
| Interface | ✅/❌ | |
| Validation | ✅/❌ | |
| Upload photo | ✅/❌ | |
| Soumission | ✅/❌ | |
| Backend | ✅/❌ | |
| Email | ✅/❌ | |

### Bugs identifiés

1. [Description du bug]
   - **Gravité:** Critique/Majeure/Mineure
   - **Reproduction:** [Étapes]
   - **Résolution:** [Proposition]

### Recommandations

- [Améliorations suggérées]
```

## 🎯 Checklist de validation finale

### Frontend
- [ ] Interface responsive sur mobile/desktop
- [ ] Accessibilité (labels, alt text)
- [ ] Performance (temps de chargement)
- [ ] Compatibilité navigateurs

### Backend  
- [ ] Validation des données
- [ ] Gestion des erreurs
- [ ] Sécurité des uploads
- [ ] Performance de l'API

### Fonctionnel
- [ ] Tous les champs sauvegardés
- [ ] Email de bienvenue envoyé
- [ ] Photo stockée correctement
- [ ] Intégration avec système existant

---

**✅ Une fois tous les tests passés, la fonctionnalité est prête pour la production !** 
# Configuration de l'API GeoNames

## 📋 Vue d'ensemble

L'autocomplétion des villes utilise l'API **GeoNames** qui est gratuite et complète. Elle permet de rechercher des villes dans tous les pays du monde avec plus de 11 millions de noms géographiques.

## 🔑 Obtenir votre clé API (Gratuit)

### Étape 1 : Créer un compte GeoNames

1. Allez sur : **http://www.geonames.org/login**
2. Cliquez sur "create a new user account"
3. Remplissez le formulaire :
   - Username (ex: `printalma_app`)
   - Email
   - Mot de passe
4. Validez votre email

### Étape 2 : Activer les Web Services

⚠️ **Important** : Par défaut, les web services ne sont pas activés.

1. Connectez-vous sur **http://www.geonames.org/login**
2. Allez dans votre profil : **http://www.geonames.org/manageaccount**
3. Trouvez la section "Free Web Services"
4. Cliquez sur **"Click here to enable"**
5. ✅ Vous êtes prêt !

### Étape 3 : Configurer le username dans le code

Ouvrez le fichier `src/services/cityService.ts` et remplacez :

```typescript
private readonly GEONAMES_USERNAME = 'demo'; // ❌ À remplacer
```

Par votre username :

```typescript
private readonly GEONAMES_USERNAME = 'votre_username'; // ✅ Votre compte
```

## 📊 Limites de l'API Gratuite

- **20 000 crédits par jour** (1 requête = 1 crédit)
- **1 000 crédits par heure**
- Largement suffisant pour un site e-commerce

Si vous dépassez les limites, vous pouvez :
- Créer plusieurs comptes
- Passer au plan premium (peu cher)

## 🚀 Fonctionnalités

### ✅ Ce qui est disponible

- ✅ Recherche de villes par nom
- ✅ Filtrage par pays (code ISO)
- ✅ Population des villes
- ✅ Région/État/Province
- ✅ Tri par population (grandes villes en premier)
- ✅ Plus de 11 millions de noms géographiques

### 🔍 Exemple de requête

```
http://api.geonames.org/searchJSON?
  q=Dakar
  &country=SN
  &maxRows=10
  &featureClass=P
  &orderby=population
  &username=votre_username
```

## 🌐 API Alternatives (si besoin)

### 1. **OpenCage Geocoding API**
- URL: https://opencagedata.com/
- Gratuit: 2 500 requêtes/jour
- Très complète

### 2. **REST Countries + Cities**
- URL: https://restcountries.com/
- 100% gratuit
- Moins de villes disponibles

### 3. **Nominatim (OpenStreetMap)**
- URL: https://nominatim.org/
- Gratuit
- Politique d'utilisation stricte

## 💡 Conseil

Pour un site en production, créez un compte dédié avec un email professionnel pour faciliter le support en cas de besoin.

## 🐛 Dépannage

### Erreur "user does not exist"
➡️ Vérifiez que vous avez bien validé votre email

### Erreur "the hourly limit of X credits has been exceeded"
➡️ Attendez 1 heure ou créez un second compte

### Aucun résultat trouvé
➡️ Vérifiez que les web services sont activés dans votre compte

## 📧 Support

Si vous avez des problèmes avec GeoNames :
- Forum : http://forum.geonames.org/
- Email : support@geonames.org

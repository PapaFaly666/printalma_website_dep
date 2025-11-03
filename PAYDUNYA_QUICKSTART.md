# 🚀 QuickStart PayDunya - PrintAlma

**Installation et test en 5 minutes**

---

## 📦 Installation

### 1. Configuration des variables d'environnement

```bash
# Copiez le fichier d'exemple
cp .env.paydunya.example .env.local

# Éditez .env.local
nano .env.local
```

Ajoutez vos clés PayDunya :

```bash
VITE_PAYDUNYA_MODE=test
VITE_API_URL=http://localhost:3004
VITE_PAYDUNYA_MASTER_KEY="votre_master_key"
VITE_PAYDUNYA_PRIVATE_KEY="votre_private_key"
VITE_PAYDUNYA_PUBLIC_KEY="votre_public_key"
VITE_PAYDUNYA_TOKEN="votre_token"
```

### 2. Installation des dépendances

```bash
npm install
```

### 3. Lancer l'application

```bash
npm run dev
```

---

## ✅ Test Rapide

### Option A : Via l'interface

1. **Accédez à** `http://localhost:5174/order-form`

2. **Remplissez le formulaire** :
   - Prénom: Test
   - Nom: User
   - Téléphone: +221775588834 (numéro de test)
   - Adresse: Rue Test
   - Ville: Dakar
   - Pays: Sénégal

3. **Sélectionnez** "PayDunya" comme méthode de paiement

4. **Cliquez** sur "Payer avec PayDunya"

5. **Vous serez redirigé** vers la page de paiement PayDunya (sandbox)

6. **Suivez les instructions** pour effectuer un paiement test

### Option B : Via curl

```bash
# 1. Tester la configuration
curl http://localhost:3004/paydunya/test-config

# 2. Créer une commande
curl -X POST http://localhost:3004/orders \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "firstName": "Test",
      "lastName": "User",
      "street": "Rue Test",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "phoneNumber": "+221775588834",
    "orderItems": [{
      "productId": 1,
      "quantity": 1,
      "unitPrice": 5000
    }],
    "paymentMethod": "PAYDUNYA",
    "initiatePayment": true
  }'

# 3. Vérifier le statut (remplacez TOKEN par le token reçu)
curl http://localhost:3004/paydunya/status/TOKEN
```

---

## 🔍 Vérification

### Backend configuré ?

```bash
curl http://localhost:3004/paydunya/test-config
```

✅ **Attendu** :
```json
{
  "success": true,
  "message": "PayDunya service is configured and ready"
}
```

❌ **Si erreur** :
- Vérifiez que le backend est lancé
- Vérifiez les clés PayDunya dans le `.env` du backend
- Consultez les logs du backend

### Frontend configuré ?

Ouvrez la console du navigateur (F12) et vérifiez :

```javascript
// Logs attendus lors d'une commande
🛒 [OrderForm] Création de commande réelle avec paiement PayDunya
📦 [OrderForm] Données de commande PayDunya: {...}
✅ [OrderForm] Réponse du backend: {...}
🔄 [OrderForm] Redirection vers PayDunya: https://...
```

---

## 📝 Numéros de Test PayDunya

| Service | Numéro de test |
|---------|----------------|
| **Orange Money** | +221 775 588 834 |
| **Wave** | Utilisez votre compte Wave de test |
| **MTN Money** | Vérifiez sur la doc PayDunya |

---

## 🚨 Problèmes Courants

### "URL de redirection PayDunya non reçue"

**Solution** :
1. Vérifiez le backend : `curl http://localhost:3004/paydunya/test-config`
2. Vérifiez les clés dans `.env` du backend
3. Redémarrez le backend : `npm run start:dev`

### "Invalid productId"

**Solution** :
- Le productId doit être un **nombre** (pas une chaîne)
- Vérifiez que le produit existe dans la base de données

### Redirection infinie

**Solution** :
- Videz le cache du navigateur
- Supprimez `localStorage.paydunyaPendingPayment`
- Réessayez

---

## 📚 Documentation Complète

Pour plus d'informations :

- [Guide d'intégration complet](./PAYDUNYA_INTEGRATION_GUIDE.md)
- [Guide frontend détaillé](./PAYDUNYA_FRONTEND_INTEGRATION.md)
- [Documentation API PayDunya](https://developers.paydunya.com)

---

## 💡 Support

**Email** : support@printalma.com
**Discord** : [Rejoindre le serveur](https://discord.gg/printalma)

---

**Dernière mise à jour** : 3 Novembre 2025

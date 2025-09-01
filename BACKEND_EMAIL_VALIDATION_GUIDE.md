# 🛠️ Guide Correctif – Sélection correcte des emails (Validation Design)

## Contexte

- L’endpoint **POST /api/designs/:id/validate** reçoit un payload :
  ```json
  {
    "isValid": true,            // ou false
    "rejectionReason": "…",    // optionnel
    "validatorNote": "…"        // optionnel
  }
  ```
- Aujourd’hui, le backend envoie toujours le modèle d’email « rejet » si `rejectionReason` est vide, même quand `isValid === true`.
- Résultat côté vendeur : email incorrect : *« Votre design a été examiné mais nécessite des modifications »*.

## Objectif

1. Envoyer **EMAIL_VALIDATION_SUCCESS** quand `isValid === true`.
2. Envoyer **EMAIL_VALIDATION_REJECTED** quand `isValid === false`.
3. Ne plus dépendre de `rejectionReason` pour déterminer le template.

---

## Étapes de correction

### 1. Contrôleur / Handler

Fichier (exemple) `controllers/designValidationController.js`
```js
// … autres imports
const EmailService = require('../services/emailService');

exports.validateDesign = async (req, res) => {
  const { id } = req.params;
  const { isValid, rejectionReason, validatorNote } = req.body;

  // 1. Mettre à jour la BDD (design + vendorProducts)
  await DesignService.setValidation(id, { isValid, rejectionReason, validatorNote });

  // 2. Préparer le payload d’email commun
  const emailPayload = {
    designName: design.name,
    designerName: vendor.fullName,
    reviewedAt: new Date().toISOString(),
    reviewerName: req.user.fullName,
    rejectionReason: rejectionReason || '—',
  };

  // 3. Choisir le template correctement
  const templateKey = isValid ? 'DESIGN_VALIDATED' : 'DESIGN_REJECTED';

  await EmailService.sendTemplate(vendor.email, templateKey, emailPayload);

  res.json({ success: true, affectedProducts });
};
```

### 2. Service Email

Fichier `services/emailService.js`
```js
const templates = {
  DESIGN_VALIDATED: {
    subject: '🎉 Votre design a été validé !',
    html: 'templates/designValidated.hbs',
  },
  DESIGN_REJECTED: {
    subject: 'Votre design nécessite des modifications',
    html: 'templates/designRejected.hbs',
  },
};

exports.sendTemplate = async (to, key, data) => {
  const tpl = templates[key];
  if (!tpl) throw new Error(`Template email manquant: ${key}`);
  const html = await renderHandlebars(tpl.html, data);
  return sendEmail(to, tpl.subject, html);
};
```

### 3. Templates Handlebars

`templates/designValidated.hbs`
```hbs
<p>Bonjour {{designerName}},</p>
<p>Votre design <strong>{{designName}}</strong> a été <strong>validé</strong> par notre équipe le {{formatDate reviewedAt}}.</p>
<p>Il est maintenant disponible pour la mise en ligne de vos produits !</p>
<p>Bonne vente !</p>
```

`templates/designRejected.hbs`
```hbs
<p>Bonjour {{designerName}},</p>
<p>Après examen, votre design <strong>{{designName}}</strong> nécessite des modifications avant publication.</p>
<p><strong>Raison :</strong> {{rejectionReason}}</p>
<p>Vous pouvez corriger et soumettre de nouveau votre design depuis votre tableau de bord.</p>
```

### 4. Tests unitaires rapides

```js
const request = require('supertest');
const app = require('../app');

describe('POST /api/designs/:id/validate', () => {
  it('envoie l’email success si isValid=true', async () => {
    await request(app)
      .post('/api/designs/1/validate')
      .send({ isValid: true })
      .expect(200);

    // Assert: EmailService.sendTemplate appelé avec 'DESIGN_VALIDATED'
  });
});
```

### 5. Variables d’environnement

```
EMAIL_FROM=noreply@votre-site.com
EMAIL_PROVIDER=sendgrid
VITE_USE_MOCKS=false
```

---

## Résultat attendu

- ✅ Email « 🎉 Votre design a été validé ! » quand `isValid=true`.
- ✅ Email « Votre design nécessite des modifications » quand `isValid=false`.
- ✅ Plus de confusion pour les vendeurs.


---

> Dernière mise à jour : 25/06/2025 – par l’équipe Front / Intégration. 
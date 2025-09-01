# ⚙️ Spécification d'Endpoint – `GET /api/designs/:id/validation-status`

> Objectif : éviter les erreurs 404 côté front (DesignService) et fournir un point d'accès explicite au statut de validation d'un design.

---

## 1. URL & Méthode
```
GET /api/designs/:id/validation-status
```

## 2. Réponse 200 OK (JSON)
```jsonc
{
  "success": true,
  "data": {
    "id": 117,
    "name": "Logo Corporate",
    "isValidated": true,
    "isPending": false,
    "isDraft": false,
    "rejectionReason": null,
    "validatedAt": "2025-06-15T10:42:00Z"
  }
}
```

### Champs requis
| Champ | Type | Description |
|-------|------|-------------|
| `id` | number | ID du design |
| `name` | string | Nom (pour l'affichage) |
| `isValidated` | boolean | `true` si statut VALIDATED |
| `isPending` | boolean | `true` si en attente |
| `isDraft` | boolean | Design en brouillon |
| `rejectionReason` | string \| null | Raison du rejet le cas échéant |
| `validatedAt` | string (ISO) \| null | Date/heure de validation |

## 3. Réponses d'erreur
| Code | Raison |
|------|--------|
| 404  | Design inexistant |
| 500  | Erreur interne |

---

## 4. Implémentation Express (exemple)
```ts
app.get('/api/designs/:id/validation-status', async (req, res) => {
  const { id } = req.params;
  const design = await db.designs.findByPk(id);
  if (!design) return res.status(404).json({ success: false, message: 'Design not found' });

  res.json({
    success: true,
    data: {
      id: design.id,
      name: design.name,
      isValidated: design.status === 'VALIDATED',
      isPending: design.status === 'PENDING',
      isDraft: design.status === 'DRAFT',
      rejectionReason: design.rejection_reason,
      validatedAt: design.validated_at
    }
  });
});
```

---

## 5. FAQ
**Q : Pourquoi ne pas utiliser directement `GET /api/designs/:id` ?**  
R : L'endpoint générique peut être heavy et non sécurisé (contient les URLs des fichiers). Cet endpoint léger expose **uniquement** le statut de validation.

**Q : Le front appelle déjà `/designs/:id` si le premier endpoint 404** ?  
R : Oui, mais la première requête échoue logiquement, générant un warning dans la console. Ajouter cet endpoint supprime le 404 et accélère la détection.

---

## ✅ À livrer
1. Route GET ci-dessus en production.  
2. Ajout de tests unitaires (200 & 404).  
3. Mise à jour de la documentation API. 
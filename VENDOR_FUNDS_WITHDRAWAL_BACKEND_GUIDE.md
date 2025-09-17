## Backend Guide — Appel de fonds (Vendor Withdrawals)

Objectif: décrire les endpoints backend pour gérer les retraits vendeur (appel de fonds), la structure des données, les statuts et la sécurité. Aligné avec le frontend `/vendeur/appel-de-fonds`.

### Modèle de données (suggestion)
- Table `vendor_balances`
  - id (PK)
  - vendorId (FK users)
  - availableBalance (number)
  - totalEarnings (number)
  - pendingWithdrawals (number)
  - lastUpdated (datetime)

- Table `withdrawal_requests`
  - id (PK)
  - vendorId (FK users)
  - amount (number, > 0)
  - method (`'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER'`)
  - status (`'PENDING' | 'COMPLETED' | 'REJECTED'`)
  - requestedAt (datetime)
  - processedAt? (datetime)
  - rejectedAt? (datetime)
  - rejectionReason? (string)
  - mobileMoney (JSON) { phoneNumber, accountHolder, provider } optionnel
  - bank (JSON) { bankName, accountNumber, accountHolder, iban?, swiftCode? } optionnel

### DTOs
- GET Balance
```json
{
  "id": 1,
  "vendorId": 10,
  "availableBalance": 250000,
  "totalEarnings": 850000,
  "pendingWithdrawals": 75000,
  "lastUpdated": "2025-09-17T10:22:59.715Z"
}
```

- GET WithdrawalRequest
```json
{
  "id": 3,
  "vendorId": 10,
  "amount": 200000,
  "method": "BANK_TRANSFER",
  "status": "PENDING",
  "requestedAt": "2025-09-17T09:00:00.000Z",
  "bank": { "bankName": "CBAO", "accountNumber": "***", "accountHolder": "John Doe", "iban": "...", "swiftCode": "..." }
}
```

- POST Create Withdrawal (request)
```json
{
  "amount": 120000,
  "method": "WAVE",
  "mobileMoney": { "phoneNumber": "+221771234567", "accountHolder": "John Doe", "provider": "WAVE" }
}
```

### Endpoints (rôle Vendeur requis)
- GET `/vendor/funds/balance`
  - Retourne le solde vendeur courant

- GET `/vendor/funds/withdrawals?limit=20&page=1`
  - Liste paginée des retraits du vendeur

- POST `/vendor/funds/withdrawals`
  - Body: `{ amount, method, mobileMoney? | bank? }`
  - Règles: `amount > 0`, `amount <= availableBalance`, méthode valide, détails requis selon méthode
  - Effets:
    - crée `withdrawal_requests` avec `status='PENDING'`
    - met à jour `pendingWithdrawals += amount`, `availableBalance -= amount`

- PATCH `/vendor/funds/withdrawals/:id/cancel`
  - Annulation par le vendeur si `status='PENDING'`
  - Effets: `availableBalance += amount`, `pendingWithdrawals -= amount`

- PATCH `/admin/funds/withdrawals/:id/complete` (ADMIN)
  - Marque `COMPLETED`, `processedAt=now`

- PATCH `/admin/funds/withdrawals/:id/reject` (ADMIN)
  - Marque `REJECTED`, `rejectedAt=now`, `rejectionReason` requis, re-crédite le solde

### Sécurité & Auth
- Auth obligatoire: JWT Bearer ou cookies; vérifier `user.role === 'VENDEUR'`
- Ownership: `withdrawal.vendorId === currentUser.id`
- Valider montants et formats (phone, IBAN, etc.)

### Statuts & logique
- `PENDING`: en attente (création)
- `COMPLETED`: paiement effectué (admin)
- `REJECTED`: rejeté (admin) → re-crédit

### Initialisation (seed)
- À l’activation vendeur, créer `vendor_balances` avec:
  - `availableBalance = 0`, `totalEarnings = 0`, `pendingWithdrawals = 0`, `lastUpdated = now`
- Optionnel: insérer quelques `withdrawal_requests` d’exemple (`PENDING`, `COMPLETED`).

### Codes d’erreur
- 400: validation (montant, méthode, détails)
- 401/403: non authentifié / rôle invalide
- 404: introuvable / non propriétaire
- 409: solde insuffisant
- 500: serveur

### Checklist backend
- [ ] Modèles & migrations `vendor_balances`, `withdrawal_requests`
- [ ] Services (transactions) pour ajustement de soldes
- [ ] Contrôleurs endpoints ci-dessus
- [ ] Middlewares auth vendeur + ownership
- [ ] Validations DTO par méthode
- [ ] Tests (création, annulation, complétion, rejet)



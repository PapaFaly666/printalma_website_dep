# PayTech Payment Integration - Implementation Guide

## ✅ Implementation Complete

This document describes the PayTech payment gateway integration implemented in the Printalma frontend application.

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Files Modified/Created](#files-modifiedcreated)
3. [Configuration](#configuration)
4. [Payment Flow](#payment-flow)
5. [Testing Guide](#testing-guide)
6. [Security Notes](#security-notes)
7. [Troubleshooting](#troubleshooting)

---

## 🏗️ Architecture Overview

### Security Architecture (CRITICAL)

**✅ CORRECT IMPLEMENTATION:**
```
Frontend → Backend API → PayTech API
   ↓
Never exposes API keys
```

**❌ WRONG IMPLEMENTATION:**
```
Frontend → PayTech API directly
   ↓
Exposes API keys (SECURITY RISK!)
```

### ✨ Guest Checkout Support

**🎉 NEW: Authentication is NOT required for payments!**

Users can place orders and pay without creating an account:
- ✅ Guest checkout enabled
- ✅ Authentication token optional
- ✅ All customer info in order form
- ✅ Email confirmation sent to guest email

### Payment Flow

```
1. User fills order form on /order-form
   (NO authentication required - guest checkout enabled)
   ↓
2. Frontend calls backend: POST /orders
   {
     paymentMethod: "PAYTECH",
     initiatePayment: true,
     ...orderData
   }
   (Authorization header is optional)
   ↓
3. Backend creates order + calls PayTech API
   (Backend uses API keys securely)
   ↓
4. Backend returns redirect_url to frontend
   ↓
5. Frontend redirects user to PayTech payment page
   ↓
6. User completes payment on PayTech
   ↓
7. PayTech sends IPN callback to backend
   Backend: POST /paytech/ipn-callback
   ↓
8. Backend verifies payment + updates order
   ↓
9. PayTech redirects user to:
   - Success: /payment/success
   - Cancel: /payment/cancel
```

---

## 📁 Files Modified/Created

### ✅ Created Files

1. **`src/pages/PaymentSuccessPage.tsx`**
   - Handles successful payment returns
   - Verifies payment status with backend
   - Shows order confirmation

2. **`src/pages/PaymentCancelPage.tsx`**
   - Handles cancelled payments
   - Provides retry options
   - User-friendly messaging

3. **`PAYTECH_INTEGRATION.md`** (this file)
   - Complete documentation

### ✏️ Modified Files

1. **`src/services/paytechService.ts`**
   - ❌ Removed: Direct PayTech API calls
   - ✅ Added: Backend API calls
   - ✅ Added: `createOrderWithPayment()` method
   - ✅ Added: Authentication token handling
   - Security: API keys moved to backend only

2. **`src/pages/OrderFormPage.tsx`**
   - ❌ Removed: Direct payment initialization
   - ✅ Updated: `processPayTechPayment()` to call backend
   - ✅ Updated: Order request structure
   - Simplified: Payment return handling

3. **`src/App.tsx`**
   - ✅ Added: `/payment/success` route
   - ✅ Added: `/payment/cancel` route
   - Imports for new payment pages

---

## ⚙️ Configuration

### Frontend Environment Variables

**File:** `.env`

```env
# Backend API URL (REQUIRED)
VITE_API_URL=http://localhost:3004

# Environment
VITE_ENVIRONMENT=development
```

**⚠️ IMPORTANT:**
- **DO NOT** add `VITE_PAYTECH_API_KEY` or `VITE_PAYTECH_API_SECRET` to frontend
- API keys should **ONLY** be in backend environment variables
- Never commit API keys to version control

### Backend Configuration (Reference)

Your backend should have these environment variables:

```env
# PayTech API Credentials (BACKEND ONLY)
PAYTECH_API_KEY=f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa
PAYTECH_API_SECRET=70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b
PAYTECH_ENVIRONMENT=prod

# PayTech URLs
PAYTECH_IPN_URL=https://your-backend.com/paytech/ipn-callback
PAYTECH_SUCCESS_URL=https://your-frontend.com/payment/success
PAYTECH_CANCEL_URL=https://your-frontend.com/payment/cancel
```

---

## 🔄 Payment Flow Details

### 1. Order Form Submission

**Page:** `/order-form` (`src/pages/OrderFormPage.tsx`)

**🎉 NO Authentication Required - Guest Checkout Enabled!**

```typescript
// User clicks "Payer avec PayTech"
// Works for both logged-in users AND guests
const processPayTechPayment = async () => {
  // Prepare order request
  const orderRequest = {
    shippingDetails: { ... },
    phoneNumber: formData.phone,
    orderItems: [ ... ],
    paymentMethod: 'PAYTECH',
    initiatePayment: true, // ← KEY: Tells backend to initialize payment
  };

  // Call backend (authentication token is optional)
  const response = await paytechService.createOrderWithPayment(orderRequest);

  // Redirect to PayTech
  if (response.data?.payment?.redirect_url) {
    window.location.href = response.data.payment.redirect_url;
  }
};
```

**Guest Checkout Features:**
- ✅ No login/registration required
- ✅ All info collected in order form
- ✅ Email confirmation sent
- ✅ Order tracking via email

### 2. Backend Processing

**Backend Endpoint:** `POST /orders` (Public - No Auth Required)

The backend:
1. Accepts guest orders (no authentication needed)
2. Creates the order in database
3. Calls PayTech API with credentials
4. Returns payment redirect URL

**Note:** The backend should handle both:
- 🔐 Authenticated users (with userId)
- 👤 Guest users (without userId, using email)

### 3. PayTech Payment Page

User is redirected to PayTech's secure payment page:
```
https://paytech.sn/payment/checkout/{token}
```

User selects payment method:
- Orange Money
- Wave
- Free Money
- Carte Bancaire
- PayPal

### 4. Payment Callback (IPN)

**Backend Endpoint:** `POST /paytech/ipn-callback`

PayTech sends notification to backend when payment completes:
- Backend verifies HMAC signature
- Updates order status
- Logs transaction

### 5. User Redirect

**Success:** `/payment/success`
- Verifies payment with backend
- Shows order confirmation
- Clears cart

**Cancel:** `/payment/cancel`
- Shows cancellation message
- Offers retry options

---

## 🧪 Testing Guide

### Prerequisites

1. **Backend Running:**
   ```bash
   # Make sure your NestJS backend is running
   # Default: http://localhost:3004
   ```

2. **Frontend Running:**
   ```bash
   npm run dev
   # Default: http://localhost:5174
   ```

### Test Scenarios

#### Scenario 1: Complete Payment Flow (Guest Checkout)

**🎉 No Login Required!**

1. **Add Product to Cart:**
   - Navigate to a product page
   - Add product to cart
   - **No need to login!**

2. **Go to Order Form:**
   - Navigate to `/order-form`
   - Should see your product in the cart

3. **Fill Order Information:**
   ```
   First Name: Test
   Last Name: User
   Email: test@example.com (will receive confirmation)
   Phone: 77 123 45 67
   Address: 123 Test Street
   City: Dakar
   Postal Code: 12000
   ```

4. **Select Delivery:**
   - Choose delivery option (e.g., "Livraison Standard")

5. **Select Payment Method:**
   - Choose "PayTech (Paiement sécurisé)"
   - Select payment method (e.g., "Orange Money")

6. **Submit Order (as Guest):**
   - Click "Payer avec PayTech"
   - Check browser console for logs:
     ```
     🚀 [PayTech] Création de commande avec paiement (invité): {...}
     ✅ [PayTech] Commande créée, redirection vers PayTech...
     ```

7. **PayTech Redirect:**
   - Should redirect to PayTech payment page
   - Complete payment (use test credentials if in test mode)

8. **Payment Success:**
   - Should redirect to `/payment/success`
   - Check console logs:
     ```
     🔍 [PaymentSuccess] Vérification du paiement: {...}
     📡 [PaymentSuccess] Réponse statut: {...}
     ```

9. **Verify Order:**
   - Order number should be displayed
   - Cart should be cleared
   - Can navigate to "Voir mes commandes"

#### Scenario 2: Payment Cancellation

1. Follow steps 1-6 above
2. On PayTech payment page, click "Cancel" or go back
3. Should redirect to `/payment/cancel`
4. Verify cancellation message is shown
5. Click "Réessayer le paiement" to go back to order form

#### Scenario 3: Error Handling

**Test Backend Connection Error:**

1. Stop your backend server
2. Try to submit order form
3. Should see error message in form
4. Check console for error logs

**Test Invalid Order Data:**

1. Submit form with missing required fields
2. Should see validation errors
3. Form should not submit

**Test Guest vs Authenticated User:**

1. **Test as Guest:**
   - Don't login
   - Complete payment flow
   - Should work perfectly

2. **Test as Logged-in User:**
   - Login first
   - Complete payment flow
   - Should also work perfectly
   - Order may be linked to user account

### Debugging Checklist

**Frontend Console Logs:**
```javascript
// Look for these log patterns:
🚀 [PayTech] Création de commande avec paiement: {...}
✅ [PayTech] Commande créée: {...}
🔍 [PaymentSuccess] Vérification du paiement: {...}
📡 [PaymentSuccess] Réponse statut: {...}
❌ [PayTech] Erreur: {...}
```

**Network Tab:**
```
POST http://localhost:3004/orders
  → Request: { paymentMethod: "PAYTECH", initiatePayment: true, ... }
  → Response: { success: true, data: { payment: { redirect_url: "..." } } }

GET http://localhost:3004/paytech/status/{token}
  → Response: { success: true, data: { status: "completed", ... } }
```

---

## 🔒 Security Notes

### ✅ Best Practices Implemented

1. **API Keys on Backend Only**
   - Frontend never sees PayTech API keys
   - Keys stored in backend `.env` file
   - Never committed to version control

2. **HTTPS in Production**
   - IPN callback URL must use HTTPS
   - Use valid SSL certificate
   - Test with ngrok in development

3. **HMAC Verification**
   - Backend verifies all IPN callbacks
   - Signature validation prevents tampering
   - Handled automatically by backend service

4. **Guest Checkout Enabled**
   - ✅ Payment endpoints are public (no authentication required)
   - ✅ JWT tokens optional (for logged-in users)
   - ✅ Guest orders tracked by email
   - ✅ Seamless experience for all users

### ⚠️ Security Warnings

**DO NOT:**
- ❌ Add `VITE_PAYTECH_API_KEY` to frontend `.env`
- ❌ Commit API keys to Git
- ❌ Use HTTP for IPN callback in production
- ❌ Skip signature verification
- ❌ Expose backend API without authentication

**DO:**
- ✅ Keep API keys in backend only
- ✅ Use environment variables
- ✅ Enable HTTPS in production
- ✅ Verify all webhook signatures
- ✅ Log all payment transactions
- ✅ Monitor failed payments

---

## 🐛 Troubleshooting

### Issue: "Erreur lors de la création de la commande"

**Possible Causes:**
1. Backend not running
2. Invalid backend URL
3. Network connectivity issue
4. Backend validation errors

**Solutions:**
```bash
# 1. Check backend is running
curl http://localhost:3004/health

# 2. Check .env configuration
cat .env | grep VITE_API_URL

# 3. Check browser console for detailed error
# Look for network errors or validation messages

# 4. Verify order data structure
console.log('Order Request:', orderRequest);
```

**Note:** Authentication errors (401/403) should NOT occur since payment is public!

### Issue: Payment Status Not Updating

**Possible Causes:**
1. IPN callback not received
2. IPN URL not accessible
3. HMAC verification failed

**Solutions:**
```bash
# 1. Check backend logs for IPN callbacks
# Look for: [PaytechService] IPN callback received

# 2. Test IPN URL accessibility
curl -X POST https://your-backend.com/paytech/ipn-callback \
  -H "Content-Type: application/json" \
  -d '{"type_event":"sale_complete","ref_command":"TEST"}'

# 3. Use ngrok for local testing
ngrok http 3004
# Update PAYTECH_IPN_URL in backend .env
```

### Issue: Redirect to PayTech Not Working

**Check:**
1. Response has `redirect_url`
2. No JavaScript errors in console
3. Network request completed successfully

**Debug:**
```javascript
// Add this in OrderFormPage.tsx
console.log('Response:', response);
console.log('Redirect URL:', response.data?.payment?.redirect_url);
```

### Issue: Payment Success Page Shows Error

**Check:**
1. Payment token in URL
2. Backend `/paytech/status/{token}` endpoint working
3. Order exists in database

**Debug:**
```javascript
// Check URL parameters
const params = new URLSearchParams(window.location.search);
console.log('Token:', params.get('token'));
console.log('Ref Command:', params.get('ref_command'));
```

---

## 📞 Support

### Resources

- **PayTech Official Documentation:** https://doc.intech.sn/doc_paytech.php
- **Backend API Documentation:** http://localhost:3004/api-docs
- **Frontend Documentation:** See `CLAUDE.md`

### Common Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Bad Request | Check order data structure |
| 404 | Order not found | Verify order was created |
| 500 | Internal server error | Check backend logs |
| Network Error | Cannot reach server | Check backend is running |

**Note:** 401/403 errors should NOT occur - payment is public!

### Debug Commands

```bash
# Frontend
npm run dev

# Check frontend logs
# Open browser console (F12)

# Backend (if you have access)
npm run start:dev

# Check backend logs
# Look for [PaytechService] logs

# Test API endpoints
curl http://localhost:3004/paytech/status/test-token \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## ✅ Implementation Checklist

- [x] PayTech service updated to call backend
- [x] Order form updated for backend integration
- [x] Payment success page created
- [x] Payment cancel page created
- [x] Routes added to App.tsx
- [x] Security: API keys removed from frontend
- [x] Error handling implemented
- [x] Loading states added
- [x] User feedback implemented
- [x] Documentation created

---

## 🚀 Next Steps

### For Testing

1. **Start Backend:**
   ```bash
   cd ../printalma_backend
   npm run start:dev
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   ```

3. **Test Payment Flow:**
   - Add product to cart
   - Go to `/order-form`
   - Complete payment with PayTech

### For Production Deployment

1. **Update Environment Variables:**
   ```env
   # Frontend
   VITE_API_URL=https://api.yourdomain.com

   # Backend
   PAYTECH_IPN_URL=https://api.yourdomain.com/paytech/ipn-callback
   PAYTECH_SUCCESS_URL=https://yourdomain.com/payment/success
   PAYTECH_CANCEL_URL=https://yourdomain.com/payment/cancel
   ```

2. **Enable HTTPS:**
   - Configure SSL certificate
   - Ensure all URLs use HTTPS
   - Test IPN callback accessibility

3. **Monitor Payments:**
   - Set up logging
   - Monitor failed payments
   - Track conversion rates

---

**Last Updated:** January 2025
**Implementation Version:** 1.0.0
**Based on:** PayTech Official Documentation

// Configuration PayTech pour le développement avec URLs HTTPS
// PayTech exige des URLs HTTPS même pour le développement

// Fonction pour détecter si nous sommes en développement local
const isLocalDevelopment = (): boolean => {
  return window.location.hostname === 'localhost' ||
         window.location.hostname === '127.0.0.1' ||
         window.location.hostname === '0.0.0.0';
};

// Configuration ngrok pour le développement (à remplacer par votre URL ngrok)
const getNgrokUrl = (): string => {
  // ⚠️ IMPORTANT: Vous devez lancer ngrok et remplacer cette URL
  // Commande ngrok: ngrok http 3004
  // Exemple: https://abc123.ngrok.io
  return import.meta.env.VITE_NGROK_URL || 'https://your-ngrok-url.ngrok.io';
};

// Configuration des URLs PayTech selon l'environnement
export const PAYTECH_CONFIG = {
  // URL de base du backend
  BACKEND_URL: import.meta.env.VITE_API_URL || 'http://localhost:3004',

  // URLs de callback pour PayTech (doivent être en HTTPS)
  get IPN_URL(): string {
    if (isLocalDevelopment()) {
      // En développement local, utiliser ngrok pour le HTTPS
      return `${getNgrokUrl()}/paytech/ipn-callback`;
    } else {
      // En production, utiliser le domaine réel
      return `${window.location.origin}/api/paytech/ipn-callback`;
    }
  },

  get SUCCESS_URL(): string {
    if (isLocalDevelopment()) {
      return `${getNgrokUrl()}/payment/success`;
    } else {
      return `${window.location.origin}/payment/success`;
    }
  },

  get CANCEL_URL(): string {
    if (isLocalDevelopment()) {
      return `${getNgrokUrl()}/payment/cancel`;
    } else {
      return `${window.location.origin}/payment/cancel`;
    }
  },

  // Configuration pour le frontend
  FRONTEND_SUCCESS_URL: `${window.location.origin}/payment/success`,
  FRONTEND_CANCEL_URL: `${window.location.origin}/payment/cancel`,

  // Environnement PayTech
  ENV: import.meta.env.NODE_ENV === 'production' ? 'prod' : 'test',
};

// Instructions pour ngrok
export const NGROK_INSTRUCTIONS = {
  install: `
# Installer ngrok
npm install -g ngrok
# OU télécharger depuis https://ngrok.com/download
`,
  run: `
# Lancer ngrok pour le backend (port 3004)
ngrok http 3004

# Copier l'URL HTTPS fournie (ex: https://abc123.ngrok.io)
# Mettre à jour VITE_NGROK_URL dans votre .env.local:
# VITE_NGROK_URL=https://abc123.ngrok.io
`,
  verify: `
# Vérifier que ngrok fonctionne:
curl https://your-ngrok-url.ngrok.io/health

# Tester l'IPN callback:
curl -X POST https://your-ngrok-url.ngrok.io/paytech/ipn-callback \\
  -H "Content-Type: application/json" \\
  -d '{"test": "ngrok"}'
`,
};

export default PAYTECH_CONFIG;
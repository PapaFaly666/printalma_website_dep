# 🔧 Guide de Dépannage - Erreur de Chargement des Thèmes

## Problème
Lorsque vous cliquez sur le bouton pour afficher la page de gestion des produits d'un thème, vous obtenez l'erreur :
**"Erreur lors du chargement du thème"**

## Causes Possibles

### 1. 🚫 Serveur Backend Non Démarré
Le serveur backend qui gère les thèmes n'est pas démarré sur le port 3004.

**Solution :**
- Vérifiez que le serveur backend est démarré
- Ouvrez un terminal et naviguez vers le dossier du backend
- Démarrez le serveur avec la commande appropriée (ex: `npm start` ou `node server.js`)

### 2. 🔐 Session Expirée
Votre session d'authentification a expiré ou vous n'êtes pas connecté.

**Solution :**
- Reconnectez-vous à l'application
- Assurez-vous d'utiliser un compte administrateur
- Vérifiez que vos cookies de session sont valides

### 3. 🌐 Problème de Réseau
Impossible de se connecter au serveur backend.

**Solution :**
- Vérifiez votre connexion internet
- Vérifiez que le serveur backend est accessible sur `http://localhost:3004`
- Essayez de rafraîchir la page

### 4. 🔧 Configuration Incorrecte
La configuration de l'API n'est pas correcte.

**Solution :**
- Vérifiez que l'URL de l'API est correcte dans les fichiers de configuration
- Assurez-vous que le port 3004 est bien utilisé
- Vérifiez les variables d'environnement

## Étapes de Diagnostic

### Étape 1 : Vérifier le Serveur Backend
```bash
# Testez si le serveur répond
curl http://localhost:3004/health
# ou
Invoke-WebRequest -Uri "http://localhost:3004/health" -Method GET
```

### Étape 2 : Vérifier l'Authentification
```bash
# Testez l'endpoint d'authentification
curl http://localhost:3004/auth/check
```

### Étape 3 : Vérifier les Thèmes
```bash
# Testez l'endpoint des thèmes
curl http://localhost:3004/themes
```

## Messages d'Erreur et Solutions

### "Session expirée. Veuillez vous reconnecter."
- **Cause :** Erreur 401 (Unauthorized)
- **Solution :** Reconnectez-vous à l'application

### "Impossible de se connecter au serveur"
- **Cause :** Erreur de réseau ou serveur non démarré
- **Solution :** Démarrez le serveur backend

### "Structure de réponse invalide"
- **Cause :** Le serveur répond mais avec un format incorrect
- **Solution :** Vérifiez la configuration du backend

## Fonctionnalités Temporaires

En cas de problème persistant, l'application affiche maintenant :
- Un diagnostic de connexion interactif
- Des messages d'erreur plus clairs
- Des suggestions de résolution

## Support

Si le problème persiste :
1. Vérifiez les logs du serveur backend
2. Consultez la documentation du backend
3. Contactez l'équipe de développement

## Prévention

Pour éviter ce problème à l'avenir :
- Gardez le serveur backend démarré pendant le développement
- Vérifiez régulièrement votre session d'authentification
- Surveillez les logs d'erreur de l'application 
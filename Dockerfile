# Utiliser une version plus récente de Node.js (v18 ou v20)
FROM node:18

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances en ignorant les peer deps
RUN npm install --legacy-peer-deps


# Copier le reste du code de l'application
COPY . .

# Exposer le port de l'application
EXPOSE 3000

# Lancer l'application
CMD ["npm", "start"]

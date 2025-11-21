#!/bin/bash

# Backup du fichier original
cp src/pages/admin/ZonesLivraisonPage.tsx src/pages/admin/ZonesLivraisonPage.tsx.backup

# Supprimer les lignes 365-394 (déclaration statique internationalZones)
sed -i '365,394d' src/pages/admin/ZonesLivraisonPage.tsx

# Supprimer les lignes 382-398 (déclaration statique transporteurs après la suppression précédente)
sed -i '382,398d' src/pages/admin/ZonesLivraisonPage.tsx

# Supprimer les lignes 410-437 (déclaration statique zoneTarifs après les suppressions précédentes)
sed -i '410,437d' src/pages/admin/ZonesLivraisonPage.tsx

echo "Fichier corrigé! Backup sauvegardé dans ZonesLivraisonPage.tsx.backup"

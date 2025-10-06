#!/bin/bash

# Script de test des endpoints de catégories
# Usage: bash test-api.sh [localhost|production]

MODE=${1:-localhost}

if [ "$MODE" = "localhost" ]; then
  API_URL="http://localhost:3004"
  echo "🔍 Test du backend LOCAL: $API_URL"
else
  API_URL="https://printalma-back-dep.onrender.com"
  echo "🔍 Test du backend PRODUCTION: $API_URL"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 1: Endpoint /categories/hierarchy"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HIERARCHY_URL="$API_URL/categories/hierarchy"
echo "URL: $HIERARCHY_URL"
echo ""

HIERARCHY_RESPONSE=$(curl -s -w "\n%{http_code}" "$HIERARCHY_URL")
HIERARCHY_HTTP_CODE=$(echo "$HIERARCHY_RESPONSE" | tail -n1)
HIERARCHY_BODY=$(echo "$HIERARCHY_RESPONSE" | sed '$d')

echo "HTTP Status: $HIERARCHY_HTTP_CODE"
echo ""

if [ "$HIERARCHY_HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS - Données reçues:"
  echo "$HIERARCHY_BODY" | jq '.' 2>/dev/null || echo "$HIERARCHY_BODY"

  # Compter les catégories
  COUNT=$(echo "$HIERARCHY_BODY" | jq 'length' 2>/dev/null || echo "?")
  echo ""
  echo "📊 Nombre de catégories parentes: $COUNT"
else
  echo "❌ ERREUR - Status: $HIERARCHY_HTTP_CODE"
  echo "Response:"
  echo "$HIERARCHY_BODY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 2: Endpoint /categories (fallback)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CATEGORIES_URL="$API_URL/categories"
echo "URL: $CATEGORIES_URL"
echo ""

CATEGORIES_RESPONSE=$(curl -s -w "\n%{http_code}" "$CATEGORIES_URL")
CATEGORIES_HTTP_CODE=$(echo "$CATEGORIES_RESPONSE" | tail -n1)
CATEGORIES_BODY=$(echo "$CATEGORIES_RESPONSE" | sed '$d')

echo "HTTP Status: $CATEGORIES_HTTP_CODE"
echo ""

if [ "$CATEGORIES_HTTP_CODE" = "200" ]; then
  echo "✅ SUCCESS - Données reçues:"
  echo "$CATEGORIES_BODY" | jq '.' 2>/dev/null || echo "$CATEGORIES_BODY"

  # Compter les catégories
  COUNT=$(echo "$CATEGORIES_BODY" | jq 'length' 2>/dev/null || echo "?")
  echo ""
  echo "📊 Nombre total de catégories: $COUNT"
else
  echo "❌ ERREUR - Status: $CATEGORIES_HTTP_CODE"
  echo "Response:"
  echo "$CATEGORIES_BODY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Test 3: Vérification de la santé du backend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

HEALTH_URL="$API_URL"
echo "URL: $HEALTH_URL"
echo ""

HEALTH_RESPONSE=$(curl -s -w "\n%{http_code}" --max-time 10 "$HEALTH_URL")
HEALTH_HTTP_CODE=$(echo "$HEALTH_RESPONSE" | tail -n1)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | sed '$d')

echo "HTTP Status: $HEALTH_HTTP_CODE"

if [ "$HEALTH_HTTP_CODE" = "200" ] || [ "$HEALTH_HTTP_CODE" = "404" ]; then
  echo "✅ Backend est accessible"
else
  echo "❌ Backend ne répond pas ou erreur"
  echo "Response:"
  echo "$HEALTH_BODY"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Résumé"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ "$HIERARCHY_HTTP_CODE" = "200" ]; then
  echo "✅ /categories/hierarchy: Fonctionnel"
elif [ "$CATEGORIES_HTTP_CODE" = "200" ]; then
  echo "⚠️  /categories/hierarchy: Non disponible"
  echo "✅ /categories: Fonctionnel (fallback OK)"
else
  echo "❌ Aucun endpoint fonctionnel"
  echo ""
  echo "🔧 Actions recommandées:"
  echo "  1. Vérifier que le backend est démarré"
  echo "  2. Vérifier les migrations Prisma"
  echo "  3. Consulter les logs du backend"
  echo "  4. Voir CATEGORY_FIX_STEPS.md pour plus de détails"
fi

echo ""

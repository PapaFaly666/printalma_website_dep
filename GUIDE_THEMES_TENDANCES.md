# 📚 Guide d'Utilisation - Configuration des Thèmes Tendances

## Vue d'ensemble

Ce système permet à l'administrateur de choisir quels thèmes afficher dans la section "Thèmes tendances" du landing page, et dans quel ordre.

---

## 🎯 Flux de Travail

### Étape 1 : Créer des Thèmes
**Page** : `/admin/design-categories`

1. Créez vos thèmes de design (ex: MANGAS, RAP, GAMING, etc.)
2. Ajoutez une **image de couverture** pour chaque thème
3. Assurez-vous que les thèmes sont **actifs** (toggle vert)

```
Exemple de thèmes créés :
┌────────────────────────────────────┐
│ ✓ MANGAS ET ANIME                  │
│   45 designs | Image ✓             │
├────────────────────────────────────┤
│ ✓ RAP                              │
│   32 designs | Image ✓             │
├────────────────────────────────────┤
│ ✓ GAMING                           │
│   28 designs | Image ✓             │
└────────────────────────────────────┘
```

---

### Étape 2 : Configurer les Tendances
**Page** : `/admin/featured-themes`

#### 2.1 Accéder à la page
Naviguez vers `/admin/featured-themes` depuis le dashboard admin.

#### 2.2 Vue d'ensemble
Vous verrez :
- **Statistiques** : Nombre de thèmes configurés (X/5), disponibles, designs totaux
- **Liste des thèmes en vedette** : Les thèmes actuellement affichés
- **Bouton "Ajouter un thème"** : Pour ajouter de nouveaux thèmes

```
╔════════════════════════════════════════════╗
║  ⭐ Thèmes Tendances                       ║
║  Configurez les thèmes affichés (max 5)   ║
║                                            ║
║  ┌──────────┐ ┌──────────┐ ┌──────────┐  ║
║  │   3/5    │ │    7     │ │   193    │  ║
║  │Configurés│ │Disponibles│ │Designs  │  ║
║  └──────────┘ └──────────┘ └──────────┘  ║
╚════════════════════════════════════════════╝
```

#### 2.3 Ajouter un thème

1. Cliquez sur **"Ajouter un thème"**
2. Un dialog s'ouvre avec **tous les thèmes disponibles**
   - Seuls les thèmes **actifs** sont affichés
   - Les thèmes **déjà sélectionnés** sont automatiquement exclus
3. Cliquez sur un thème pour l'ajouter

```
┌─────────────────────────────────────────┐
│  Ajouter un thème tendance              │
│  Sélectionnez un thème (3/5)            │
│                                         │
│  ┌──────────┐  ┌──────────┐           │
│  │ [IMAGE]  │  │ [IMAGE]  │           │
│  │ MUSIQUE  │  │   ART    │           │
│  │50 designs│  │38 designs│           │
│  └──────────┘  └──────────┘           │
│        ↑ Cliquez pour ajouter          │
└─────────────────────────────────────────┘
```

**Limite** : Maximum 5 thèmes. Si vous essayez d'en ajouter un 6ème, un message d'erreur apparaît.

#### 2.4 Réorganiser les thèmes

Les thèmes sont affichés dans l'ordre d'apparition sur le landing page :
- **#1** = Grande carte principale (gauche)
- **#2** = Carte haute (droite, colonne 1)
- **#3** = Petite carte (haut droite, colonne 2)
- **#4** = Carte haute (colonne 2, cachée sur mobile)
- **#5** = Petite carte (bas droite)

**Pour réorganiser :**
1. **Glissez** une carte (cliquez et maintenez sur l'icône ⋮⋮)
2. **Déposez** à la position souhaitée
3. L'ordre est mis à jour instantanément

```
Avant drag & drop:               Après drag & drop:
┌─────────────────────┐         ┌─────────────────────┐
│ ⋮⋮ #1 MANGAS    [X] │         │ ⋮⋮ #1 RAP       [X] │
│ ⋮⋮ #2 RAP       [X] │ ──────> │ ⋮⋮ #2 MANGAS    [X] │
│ ⋮⋮ #3 GAMING    [X] │         │ ⋮⋮ #3 GAMING    [X] │
└─────────────────────┘         └─────────────────────┘
```

**Indicateur visuel** : La carte en cours de déplacement a un fond bleu et une ombre.

#### 2.5 Supprimer un thème

Cliquez sur le bouton **[X]** à droite d'un thème pour le retirer de la liste des tendances.

**Note** : Cela ne supprime pas le thème, il reste disponible pour être rajouté plus tard.

#### 2.6 Sauvegarder

1. Après avoir fait vos changements, les boutons **"Annuler"** et **"Enregistrer"** apparaissent automatiquement
2. Cliquez sur **"Enregistrer"** pour appliquer la configuration
3. Un message de confirmation apparaît
4. La configuration est immédiatement visible sur le landing page

```
┌─────────────────────────────────────────┐
│  [Annuler] [Enregistrer ✓]             │
│             ↑                           │
│    Cliquez pour sauvegarder            │
└─────────────────────────────────────────┘
```

---

## 🌐 Résultat sur le Landing Page

Les utilisateurs voient la section "Thèmes tendances" avec votre configuration :

```
Landing Page - Section "Thèmes tendances"
┌────────────────────────────────────────────┐
│  Thèmes tendances ⭐                       │
│                                            │
│  ┌────────────┐  ┌──────┐  ┌──────┐     │
│  │            │  │      │  │      │     │
│  │   MANGAS   │  │ RAP  │  │GAMING│     │
│  │   (#1)     │  │ (#2) │  │ (#3) │     │
│  │            │  │      │  ├──────┤     │
│  │            │  │      │  │MUSIC │     │
│  └────────────┘  └──────┘  │ (#4) │     │
│                              │      │     │
│                              ├──────┤     │
│                              │ ART  │     │
│                              │ (#5) │     │
│                              └──────┘     │
└────────────────────────────────────────────┘
```

**Responsive** : Le layout s'adapte automatiquement sur mobile/tablette.

---

## ❓ Questions Fréquentes

### Q1 : Pourquoi je ne vois pas mon thème dans "Ajouter un thème" ?
**R** : Vérifiez que :
- Le thème est **actif** dans `/admin/design-categories`
- Le thème n'est pas **déjà sélectionné** dans les tendances
- Le thème a une **image de couverture** (recommandé)

### Q2 : Puis-je avoir plus de 5 thèmes ?
**R** : Non, la limite est de 5 thèmes pour maintenir un design optimal sur le landing page.

### Q3 : Que se passe-t-il si je n'enregistre pas ?
**R** : Les changements sont perdus. Un indicateur visuel vous rappelle d'enregistrer.

### Q4 : Comment changer l'image d'un thème ?
**R** : Allez dans `/admin/design-categories`, modifiez le thème et changez l'image de couverture.

### Q5 : Les changements sont-ils visibles immédiatement ?
**R** : Oui ! Après avoir cliqué sur "Enregistrer", rafraîchissez le landing page pour voir les changements.

### Q6 : Puis-je désactiver la section "Thèmes tendances" ?
**R** : Oui, supprimez tous les thèmes de la liste. Si aucun thème n'est configuré, la section ne s'affiche pas sur le landing page.

---

## 🔧 Dépannage

### Problème : "Erreur de chargement"
- **Cause** : Problème de connexion au backend
- **Solution** : Vérifiez que les endpoints API sont implémentés :
  - `GET /design-categories/featured`
  - `PUT /design-categories/admin/featured`

### Problème : Les thèmes ne s'affichent pas sur le landing page
- **Vérifiez** :
  1. Que les thèmes sont sauvegardés (bouton "Enregistrer")
  2. Que les thèmes ont des images de couverture
  3. Que le cache du navigateur est rafraîchi (Ctrl+F5)

### Problème : Le drag & drop ne fonctionne pas
- **Solution** : Utilisez un navigateur moderne (Chrome, Firefox, Edge)
- **Note** : Le drag & drop n'est pas supporté sur certains appareils tactiles

---

## 💡 Bonnes Pratiques

1. **Images de qualité** : Utilisez des images haute résolution (min 800x600px)
2. **Thèmes populaires** : Mettez en avant les thèmes avec le plus de designs
3. **Rotation régulière** : Changez les thèmes tendances régulièrement (ex: mensuel)
4. **Cohérence visuelle** : Choisissez des images au style cohérent
5. **Testez sur mobile** : Vérifiez le rendu sur différents appareils

---

## 🎨 Mapping des Positions

Position sur le landing page :

| Position | Layout Desktop | Layout Mobile | Taille |
|----------|---------------|---------------|--------|
| #1 | Gauche (grande) | Pleine largeur | XL |
| #2 | Droite haut (tall) | Pleine largeur | L |
| #3 | Droite milieu | Demi-largeur | M |
| #4 | Centre droite (tall) | En bas séparé | L |
| #5 | Droite bas | Demi-largeur | M |

**Recommandation** : Placez votre thème le plus important en position **#1**.

---

## 📞 Support

Pour toute question ou problème, consultez :
- `FEATURED_THEMES_IMPLEMENTATION.md` : Documentation technique complète
- Code source : `src/pages/admin/FeaturedThemesManager.tsx`

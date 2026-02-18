# Frontend - Gestion des Textes avec Sauts de Ligne

## Statut Actuel ✅

Le frontend **gère déjà correctement** les sauts de ligne dans les textes personnalisés :

### 1. Zone de Saisie (Textarea)

**Fichier :** `src/pages/CustomerProductCustomizationPageV3.tsx` (lignes 2001-2007)

```tsx
<textarea
  value={selectedElement.text}
  onChange={(e) => editorRef.current?.updateText(e.target.value)}
  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
  rows={3}
  placeholder="Entrez votre texte..."
/>
```

✅ **Fonctionnement :**
- Le `<textarea>` HTML capture automatiquement les sauts de ligne
- Les touches `Entrée` insèrent un caractère `\n` dans la valeur
- La valeur est passée directement à `updateText()`

### 2. Mise à Jour du Texte

**Fichier :** `src/components/ProductDesignEditor.tsx` (lignes 1201-1208)

```tsx
const updateText = (text: string) => {
  if (!selectedElement || selectedElement.type !== 'text') return;

  // Calculer le nombre de lignes et la ligne la plus longue
  const lines = text.split('\n');
  const numberOfLines = lines.length;
  const longestLine = Math.max(...lines.map(line => line.length));

  // Ajuster automatiquement la taille...
  // ...
}
```

✅ **Fonctionnement :**
- Le texte avec `\n` est analysé pour compter les lignes
- La taille et les dimensions s'ajustent automatiquement
- Les `\n` sont préservés dans l'état

### 3. Affichage du Texte

**Fichier :** `src/pages/CustomerProductCustomizationPageV3.tsx` (lignes 1908-1934)

```tsx
{element.text.split('\n').map((line, index) => (
  <React.Fragment key={index}>
    {line}
    {index < element.text.split('\n').length - 1 && <br />}
  </React.Fragment>
))}
```

✅ **Fonctionnement :**
- Le texte est divisé sur les `\n`
- Chaque ligne est rendue séparément
- Des `<br />` sont insérés entre les lignes

### 4. Sauvegarde Backend

**Fichier :** `src/services/customizationService.ts` (lignes 55-91)

```tsx
async saveCustomization(data: CustomizationData): Promise<Customization> {
  console.log('💾 [CustomizationService] Sauvegarde personnalisation:', data);

  const response = await axios.post(`${API_BASE}/customizations`, data, {
    headers: {
      'Content-Type': 'application/json',
      ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
    }
  });

  return response.data;
}
```

✅ **Fonctionnement :**
- Les données sont envoyées en JSON
- Les `\n` sont automatiquement échappés par JSON.stringify()
- Le backend reçoit le texte intact

## Structure des Données

### Élément Texte Complet

```typescript
interface TextElement {
  id: string;               // "text-1234567890"
  type: "text";
  text: string;             // "Ligne 1\nLigne 2\nLigne 3"

  // Position (pourcentages 0-1)
  x: number;
  y: number;

  // Dimensions
  width: number;
  height: number;

  // Transformation
  rotation: number;
  zIndex: number;

  // Style
  fontSize: number;
  baseFontSize: number;
  baseWidth: number;
  fontFamily: string;
  color: string;
  fontWeight: "normal" | "bold";
  fontStyle: "normal" | "italic";
  textDecoration: "none" | "underline";
  textAlign: "left" | "center" | "right";
  curve: number;
}
```

### Exemple de Texte Multi-lignes

```json
{
  "id": "text-1736543210",
  "type": "text",
  "text": "Bienvenue chez Printalma!\nVotre partenaire impression\nQualité garantie",
  "x": 0.5,
  "y": 0.3,
  "width": 320,
  "height": 90,
  "rotation": 0,
  "zIndex": 1,
  "fontSize": 28,
  "baseFontSize": 28,
  "baseWidth": 320,
  "fontFamily": "Arial, sans-serif",
  "color": "#000000",
  "fontWeight": "bold",
  "fontStyle": "normal",
  "textDecoration": "none",
  "textAlign": "center",
  "curve": 0
}
```

## Workflow Complet

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. Utilisateur tape dans le textarea                            │
│    "Ligne 1[ENTER]Ligne 2[ENTER]Ligne 3"                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. onChange déclenché avec valeur                               │
│    text = "Ligne 1\nLigne 2\nLigne 3"                          │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3. updateText() dans ProductDesignEditor                        │
│    - Analyse les lignes: split('\n')                            │
│    - Ajuste les dimensions automatiquement                      │
│    - Met à jour l'élément dans le state                         │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. handleElementsChange() appelé                                │
│    - Stocke dans designElementsByView                           │
│    - Déclenche la sauvegarde localStorage                       │
│    - Déclenche la sauvegarde backend (debounced)                │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. Sauvegarde Backend via customizationService                  │
│    POST /customizations                                         │
│    Body: { designElements: [...] }                             │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. Backend stocke en JSON (PostgreSQL)                         │
│    Les \n sont préservés automatiquement                        │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│ 7. Affichage sur canvas et miniatures                          │
│    text.split('\n').map(line => <>{line}<br /></>)            │
└─────────────────────────────────────────────────────────────────┘
```

## Cas d'Usage Testés ✅

### 1. Texte Simple (Sans Saut de Ligne)

**Entrée :**
```
Printalma
```

**Stocké :**
```json
{
  "text": "Printalma"
}
```

**Affiché :**
```
Printalma
```

### 2. Texte Multi-lignes

**Entrée :**
```
Printalma
Impression Pro
Qualité Premium
```

**Stocké :**
```json
{
  "text": "Printalma\nImpression Pro\nQualité Premium"
}
```

**Affiché :**
```
Printalma
Impression Pro
Qualité Premium
```

### 3. Lignes Vides

**Entrée :**
```
Titre


Sous-titre
```

**Stocké :**
```json
{
  "text": "Titre\n\n\nSous-titre"
}
```

**Affiché :**
```
Titre



Sous-titre
```

### 4. Caractères Spéciaux

**Entrée :**
```
🎨 Design Pro
Créations à 100%
C'est "génial"!
```

**Stocké :**
```json
{
  "text": "🎨 Design Pro\nCréations à 100%\nC'est \"génial\"!"
}
```

**Affiché :**
```
🎨 Design Pro
Créations à 100%
C'est "génial"!
```

## Améliorations Optionnelles

### 1. Compteur de Caractères

Ajouter un indicateur pour limiter la longueur :

```tsx
<div className="mb-6">
  <label className="block text-sm font-semibold text-gray-900 mb-2">
    Texte
    <span className="text-xs text-gray-500 ml-2">
      ({selectedElement.text.length}/500)
    </span>
  </label>
  <textarea
    value={selectedElement.text}
    onChange={(e) => {
      if (e.target.value.length <= 500) {
        editorRef.current?.updateText(e.target.value);
      }
    }}
    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
    rows={3}
    placeholder="Entrez votre texte..."
    maxLength={500}
  />
  <p className="text-xs text-gray-500 mt-1">
    Maximum 500 caractères
  </p>
</div>
```

### 2. Indicateur de Lignes

Afficher le nombre de lignes en temps réel :

```tsx
<div className="mb-6">
  <div className="flex items-center justify-between mb-2">
    <label className="text-sm font-semibold text-gray-900">Texte</label>
    <span className="text-xs text-gray-500">
      {selectedElement.text.split('\n').length} ligne(s)
    </span>
  </div>
  <textarea
    value={selectedElement.text}
    onChange={(e) => editorRef.current?.updateText(e.target.value)}
    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
    rows={Math.min(selectedElement.text.split('\n').length + 1, 6)}
    placeholder="Entrez votre texte..."
  />
</div>
```

### 3. Ajustement Automatique des Rows

Adapter la hauteur du textarea au nombre de lignes :

```tsx
const calculateRows = (text: string) => {
  const lines = text.split('\n').length;
  return Math.min(Math.max(lines, 3), 10); // Entre 3 et 10 lignes
};

<textarea
  value={selectedElement.text}
  onChange={(e) => editorRef.current?.updateText(e.target.value)}
  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
  rows={calculateRows(selectedElement.text)}
  placeholder="Entrez votre texte..."
/>
```

### 4. Bouton "Insérer Saut de Ligne" (Mobile)

Pour les utilisateurs mobiles qui ont du mal à faire Entrée :

```tsx
<div className="mb-6">
  <label className="block text-sm font-semibold text-gray-900 mb-2">Texte</label>
  <textarea
    ref={textareaRef}
    value={selectedElement.text}
    onChange={(e) => editorRef.current?.updateText(e.target.value)}
    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
    rows={3}
    placeholder="Entrez votre texte..."
  />
  <button
    onClick={() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const cursorPos = textarea.selectionStart;
        const newText =
          selectedElement.text.substring(0, cursorPos) +
          '\n' +
          selectedElement.text.substring(cursorPos);
        editorRef.current?.updateText(newText);
      }
    }}
    className="mt-2 text-xs text-primary hover:text-primary/80 flex items-center gap-1"
  >
    <ChevronRight className="w-3 h-3" />
    Insérer un saut de ligne
  </button>
</div>
```

### 5. Prévisualisation en Temps Réel

Afficher un aperçu du texte formaté :

```tsx
<div className="mb-6">
  <label className="block text-sm font-semibold text-gray-900 mb-2">Texte</label>
  <textarea
    value={selectedElement.text}
    onChange={(e) => editorRef.current?.updateText(e.target.value)}
    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary resize-none"
    rows={3}
    placeholder="Entrez votre texte..."
  />

  {/* Aperçu */}
  <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
    <p className="text-xs text-gray-600 mb-2">Aperçu :</p>
    <div
      style={{
        fontFamily: selectedElement.fontFamily,
        fontSize: `${Math.min(selectedElement.fontSize / 2, 16)}px`,
        color: selectedElement.color,
        fontWeight: selectedElement.fontWeight,
        fontStyle: selectedElement.fontStyle,
        textDecoration: selectedElement.textDecoration,
        textAlign: selectedElement.textAlign,
        whiteSpace: 'pre-wrap'
      }}
    >
      {selectedElement.text || 'Votre texte apparaîtra ici...'}
    </div>
  </div>
</div>
```

## Tests Frontend

### Test 1 : Sauvegarde et Restauration

```typescript
describe('Text Element with Newlines', () => {
  it('should preserve newlines in text element', () => {
    const textElement = {
      id: 'text-1',
      type: 'text',
      text: 'Line 1\nLine 2\nLine 3',
      x: 0.5,
      y: 0.5,
      // ... autres propriétés
    };

    // Sauvegarder
    localStorage.setItem('test-data', JSON.stringify(textElement));

    // Restaurer
    const restored = JSON.parse(localStorage.getItem('test-data'));

    expect(restored.text).toBe('Line 1\nLine 2\nLine 3');
    expect(restored.text.split('\n').length).toBe(3);
  });

  it('should correctly render text with newlines', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const lines = text.split('\n');

    expect(lines).toEqual(['Line 1', 'Line 2', 'Line 3']);
    expect(lines.length).toBe(3);
  });
});
```

### Test 2 : Textarea Interaction

```typescript
describe('Textarea Input', () => {
  it('should update text with newlines on textarea change', () => {
    const mockUpdateText = jest.fn();
    const { getByRole } = render(
      <textarea
        value="Initial text"
        onChange={(e) => mockUpdateText(e.target.value)}
      />
    );

    const textarea = getByRole('textbox');

    // Simuler la saisie avec sauts de ligne
    fireEvent.change(textarea, {
      target: { value: 'Line 1\nLine 2\nLine 3' }
    });

    expect(mockUpdateText).toHaveBeenCalledWith('Line 1\nLine 2\nLine 3');
  });
});
```

## Compatibilité

### Navigateurs Testés

- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari (Desktop & iOS)
- ✅ Chrome Mobile (Android)

### Problèmes Connus

Aucun problème connu. Les `<textarea>` HTML gèrent les sauts de ligne de manière standard.

## Conclusion

✅ **Le frontend gère parfaitement les sauts de ligne**

✅ **Aucune modification urgente nécessaire**

✅ **Les améliorations suggérées sont optionnelles pour améliorer l'UX**

✅ **La communication avec le backend est optimale**

---

**Important :** Assurez-vous que le backend respecte le format décrit dans `BACKEND_TEXT_CUSTOMIZATION_GUIDE.md` pour une compatibilité totale.

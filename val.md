Corrige le problème de drag & drop et de redimensionnement des designs sur mes produits.

Quand l’utilisateur clique et déplace le design, il doit suivre la souris uniquement tant que le bouton est enfoncé.

Dès que l’utilisateur relâche le clic (mouseup), le déplacement ou le redimensionnement doit s’arrêter immédiatement.

Le système doit gérer séparément :

Drag : bouger la position du design.

Resize : ajuster largeur/hauteur proportionnellement ou librement.

Comme dans Illustrator :

Pas de maintien après le relâchement.

Le design doit rester sélectionné mais immobile une fois la souris levée.

Assure-toi de reset le state (isDragging ou isResizing) à false sur mouseup global, même si la souris sort du canvas.

Évite les "glitches" de position en utilisant la position relative au moment du mousedown comme point de référence.
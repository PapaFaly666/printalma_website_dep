import { Button } from "./ui/button"; // Assure-toi que le chemin est correct
import { useToast } from "./ui/use-toast"; // Assure-toi que le chemin est correct

export const ToastDemo = () => {
  const { toast } = useToast();

  return (
    <div style={{ padding: "20px" }}>
      <Button
        variant="outline" // Juste pour le style du bouton, optionnel
        onClick={() => {
          toast({
            title: "Toast (Défaut)",
            description: "Ceci est le toast standard noir et blanc.",
            // Aucune 'variant' n'est spécifiée ici,
            // OU tu peux explicitement mettre : variant: "default",
          });
        }}
      >
        Afficher Toast (Défaut - Noir/Blanc)
      </Button>

      <Button
        variant="destructive"
        onClick={() => {
          toast({
            title: "Toast (Erreur)",
            description: "Ceci est un toast d'erreur rouge.",
            variant: "destructive",
          });
        }}
        style={{ marginLeft: "10px" }}
      >
        Afficher Toast (Erreur - Rouge)
      </Button>
      
      <Button
        // En supposant que tu as une variante "success" dans tes toastVariants
        // et que Button peut prendre une prop "success" ou que tu la styles autrement
        // Pour l'exemple, j'utilise un style inline pour le bouton.
        style={{ marginLeft: "10px", backgroundColor: "green", color: "white" }}
        onClick={() => {
          toast({
            title: "Toast (Succès)",
            description: "Ceci est un toast de succès vert.",
            variant: "success", 
          });
        }}
      >
        Afficher Toast (Succès - Vert)
      </Button>
    </div>
  );
};

// Si tu veux l'exporter par défaut pour l'importer plus facilement :
// export default ToastDemo; 
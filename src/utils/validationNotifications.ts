import { toast } from 'sonner';
import { PostValidationAction } from '../types/vendorProduct';

export const showValidationNotifications = {
  actionUpdated: (action: PostValidationAction) => {
    const message = action === PostValidationAction.AUTO_PUBLISH
      ? '🚀 Votre produit sera publié automatiquement après validation'
      : '📝 Votre produit sera mis en brouillon après validation';
    toast.success(message, { duration: 4000 });
  },

  productValidated: (isAutoPublish: boolean) => {
    if (isAutoPublish) {
      toast.success('🎉 Votre produit a été validé et publié !', { duration: 5000 });
    } else {
      toast.success('✅ Votre produit a été validé ! Vous pouvez maintenant le publier.', { duration: 5000 });
    }
  },

  productRejected: (reason: string) => {
    toast.error(`❌ Produit rejeté : ${reason}`, { duration: 6000 });
  },

  productPublished: () => {
    toast.success('🚀 Produit publié avec succès !', { duration: 4000 });
  },

  actionChoiceReminder: () => {
    toast.info('💡 N\'oubliez pas de choisir votre action après validation avant de soumettre', { duration: 3000 });
  },

  pendingSubmission: () => {
    toast.loading('📤 Soumission du produit pour validation...', { duration: 2000 });
  }
}; 
 
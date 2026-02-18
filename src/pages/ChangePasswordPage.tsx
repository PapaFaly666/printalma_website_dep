import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ChangePasswordForm } from '../components/auth/ChangePasswordForm';
import { useAuth } from '../contexts/AuthContext';

const ChangePasswordPage: React.FC = () => {
  const { mustChangePassword, tempUserId, isAuthenticated, handlePasswordChanged } = useAuth();
  const [tempUserIdFromStorage, setTempUserIdFromStorage] = useState<number | null>(null);

  // 🆕 Vérifier le localStorage pour tempUserId ou tempUserEmail
  useEffect(() => {
    if (!tempUserId) {
      const storedUserId = localStorage.getItem('tempUserId');
      const storedEmail = localStorage.getItem('tempUserEmail');

      if (storedUserId) {
        setTempUserIdFromStorage(parseInt(storedUserId, 10));
        console.log('📧 tempUserId trouvé dans localStorage:', storedUserId);
      } else if (storedEmail) {
        // Si pas d'ID mais email, on peut quand même accéder à la page
        console.log('📧 tempUserEmail trouvé dans localStorage:', storedEmail);
        setTempUserIdFromStorage(0); // Valeur factice pour permettre l'accès
      }
    }
  }, [tempUserId]);

  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // 🆕 Vérifier aussi dans le localStorage pour tempUserEmail
  const storedEmail = localStorage.getItem('tempUserEmail');
  const hasTempAccess = mustChangePassword || tempUserId || tempUserIdFromStorage || storedEmail;

  if (!hasTempAccess) {
    return <Navigate to="/login" replace />;
  }

  const handleSuccess = async () => {
    await handlePasswordChanged();
  };

  // 🆕 Utiliser tempUserId, tempUserIdFromStorage, ou null (le formulaire récupérera l'ID via l'email)
  const finalUserId = tempUserId || tempUserIdFromStorage || null;

  return (
    <ChangePasswordForm
      mustChangePassword={true}
      userId={finalUserId}
      userEmail={storedEmail || undefined}
      onSuccess={handleSuccess}
    />
  );
};

export default ChangePasswordPage; 
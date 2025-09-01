import React from 'react';
import { Navigate } from 'react-router-dom';
import { ChangePasswordForm } from '../components/auth/ChangePasswordForm';
import { useAuth } from '../contexts/AuthContext';

const ChangePasswordPage: React.FC = () => {
  const { mustChangePassword, tempUserId, isAuthenticated, handlePasswordChanged } = useAuth();

  // Si l'utilisateur est déjà connecté, rediriger vers le dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  // Si pas de changement obligatoire, rediriger vers login
  if (!mustChangePassword || !tempUserId) {
    return <Navigate to="/login" replace />;
  }

  const handleSuccess = async () => {
    await handlePasswordChanged();
  };

  return (
    <ChangePasswordForm
      mustChangePassword={true}
      userId={tempUserId}
      onSuccess={handleSuccess}
    />
  );
};

export default ChangePasswordPage; 
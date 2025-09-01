import React, { useEffect, useState } from 'react';
import { Alert } from '../components/ui/alert';
import { useNavigate } from 'react-router-dom';
import { API_CONFIG } from '../config/api';

const ConfirmEmailChange: React.FC = () => {
  const [message, setMessage] = useState<string>('Validation en cours...');
  const [status, setStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setMessage('Lien invalide.');
      setStatus('error');
      return;
    }
    fetch(`${API_CONFIG.BASE_URL}/auth/vendor/confirm-email-change?token=${encodeURIComponent(token)}`)
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (res.ok && data.success) {
          setMessage(data.message || 'Votre adresse email a été mise à jour.');
          setStatus('success');
          setTimeout(() => navigate('/vendeur/account'), 3500);
        } else {
          setMessage(data.message || 'Erreur lors de la validation du lien.');
          setStatus('error');
        }
      })
      .catch(() => {
        setMessage('Erreur réseau.');
        setStatus('error');
      });
  }, [navigate]);

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', textAlign: 'center', marginTop: 60 }}>
      <h2>Confirmation de l’email</h2>
      <Alert className={status === 'success' ? 'border-green-200 bg-green-50' : status === 'error' ? 'border-red-200 bg-red-50' : ''}>
        {message}
      </Alert>
      {status === 'success' && <div style={{ marginTop: 16, color: '#16a34a' }}>Redirection vers votre compte...</div>}
    </div>
  );
};

export default ConfirmEmailChange; 
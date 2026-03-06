import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, ArrowLeft, Mail, RefreshCw } from 'lucide-react';

interface LocationState {
  email: string;
  from?: string;
}

const OtpVerificationPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as LocationState;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(600); // 10 minutes in seconds
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Rediriger si pas d'email
  useEffect(() => {
    if (!state?.email) {
      navigate('/admin/login');
    }
  }, [state, navigate]);

  // Compte à rebours
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // Permettre seulement les chiffres
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Passer au champ suivant automatiquement
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();

    if (!/^\d{6}$/.test(pastedData)) return;

    const newOtp = pastedData.split('');
    setOtp(newOtp);
    inputRefs.current[5]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const code = otp.join('');
    if (code.length !== 6) {
      setError('Veuillez saisir les 6 chiffres du code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3004'}/auth/verify-otp`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: state.email,
          code,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Connexion réussie, rediriger selon le rôle
        const redirectPath = state.from || '/admin/dashboard';
        navigate(redirectPath, { replace: true });
      } else {
        setError(data.message || 'Code invalide ou expiré');
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
      }
    } catch (error) {
      setError('Erreur de connexion au serveur');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-full mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Vérification en deux étapes</h1>
          <p className="text-gray-600">
            Nous avons envoyé un code de vérification à
          </p>
          <p className="font-semibold text-blue-600 mt-1 flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {state?.email}
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 text-center">
                Saisissez le code à 6 chiffres
              </label>
              <div className="flex justify-center gap-2 sm:gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { if (el) inputRefs.current[index] = el; }}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    className={`w-12 h-14 sm:w-14 sm:h-16 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                      error
                        ? 'border-red-500 bg-red-50'
                        : digit
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                    autoFocus={index === 0}
                  />
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium">❌ {error}</p>
              </div>
            )}

            {/* Countdown */}
            <div className="text-center">
              <p className="text-sm text-gray-600">
                Code expire dans{' '}
                <span className={`font-bold ${countdown < 60 ? 'text-red-600' : 'text-blue-600'}`}>
                  {formatTime(countdown)}
                </span>
              </p>
              {countdown === 0 && (
                <p className="text-xs text-red-600 mt-2">
                  Le code a expiré. Veuillez vous reconnecter.
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || otp.join('').length !== 6 || countdown === 0}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Vérification...
                </>
              ) : (
                'Vérifier le code'
              )}
            </button>

            {/* Back to Login */}
            <button
              type="button"
              onClick={() => navigate('/admin/login')}
              className="w-full text-gray-600 hover:text-gray-900 font-medium py-2 flex items-center justify-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Retour à la connexion
            </button>
          </form>

          {/* Help */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              <strong>Vous n'avez pas reçu le code ?</strong>
              <br />
              Vérifiez votre dossier spam ou revenez à la page de connexion pour réessayer.
            </p>
          </div>
        </div>

        {/* Security Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            <Shield className="w-4 h-4 inline mr-1" />
            Cette vérification protège votre compte contre les accès non autorisés
          </p>
        </div>
      </div>
    </div>
  );
};

export default OtpVerificationPage;

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import Button from '../ui/Button';
import { Input } from '../ui/input';
import { Alert, AlertDescription } from '../ui/alert';
import { Phone, Shield, Clock, Mail, CheckCircle, AlertCircle } from 'lucide-react';

interface PhoneOTPModalProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  onVerified: () => void;
}

export const PhoneOTPModal: React.FC<PhoneOTPModalProps> = ({
  isOpen,
  onClose,
  phoneNumber,
  onVerified
}) => {
  const [step, setStep] = useState<'send' | 'verify' | 'success'>('send');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [otpId, setOtpId] = useState('');

  // Countdown timer pour le renvoi
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendOTP = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vendor/phone/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ phoneNumber })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de l\'envoi du code');
      }

      setOtpId(data.otpId);
      setStep('verify');
      setCountdown(300); // 5 minutes
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (otpCode.length !== 6) {
      setError('Le code doit contenir 6 chiffres');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/vendor/phone/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ otpId, code: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Code invalide');
      }

      setStep('success');
      setTimeout(() => {
        onVerified();
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message);
      setOtpCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setOtpCode('');
    setError('');
    await handleSendOTP();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReset = () => {
    setStep('send');
    setOtpCode('');
    setError('');
    setCountdown(0);
    setOtpId('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-[rgb(20,104,154)]" />
            Vérification de sécurité
          </DialogTitle>
          <DialogDescription>
            Pour votre sécurité, nous devons vérifier que ce numéro vous appartient
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Étape 1: Envoi du code */}
          {step === 'send' && (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <Phone className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Un code à 6 chiffres sera envoyé au numéro <strong>{phoneNumber}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-3 text-sm text-gray-600">
                <div className="flex items-start gap-2">
                  <Shield className="w-4 h-4 mt-0.5 text-[rgb(20,104,154)]" />
                  <div>
                    <strong>Vérification OTP</strong>
                    <p className="text-xs text-gray-500">Code de vérification par SMS</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Mail className="w-4 h-4 mt-0.5 text-[rgb(20,104,154)]" />
                  <div>
                    <strong>Notification par email</strong>
                    <p className="text-xs text-gray-500">Confirmation envoyée à votre adresse</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Clock className="w-4 h-4 mt-0.5 text-[rgb(20,104,154)]" />
                  <div>
                    <strong>Période de sécurité: 48h</strong>
                    <p className="text-xs text-gray-500">Le numéro sera activé après 48 heures</p>
                  </div>
                </div>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Étape 2: Vérification du code */}
          {step === 'verify' && (
            <>
              <Alert className="bg-blue-50 border-blue-200">
                <Phone className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Entrez le code reçu par SMS au <strong>{phoneNumber}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div>
                  <Input
                    type="text"
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setOtpCode(value);
                      setError('');
                    }}
                    className="text-center text-2xl font-bold tracking-widest"
                    maxLength={6}
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Code à 6 chiffres
                  </p>
                </div>

                {countdown > 0 && (
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>Code valide pendant {formatTime(countdown)}</span>
                  </div>
                )}

                {countdown === 0 && (
                  <button
                    onClick={handleResendOTP}
                    className="text-sm text-[rgb(20,104,154)] hover:underline w-full text-center"
                    disabled={isLoading}
                  >
                    Renvoyer le code
                  </button>
                )}

                <button
                  onClick={handleReset}
                  className="text-sm text-gray-500 hover:underline w-full text-center"
                >
                  Changer le numéro
                </button>
              </div>

              {error && (
                <Alert className="bg-red-50 border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {/* Étape 3: Succès */}
          {step === 'success' && (
            <div className="py-6 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Numéro vérifié !</h3>
                <p className="text-sm text-gray-600 mt-2">
                  Le numéro sera actif dans <strong>48 heures</strong>
                </p>
              </div>
              <Alert className="bg-blue-50 border-blue-200">
                <Mail className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 text-left">
                  Un email de confirmation a été envoyé à votre adresse.
                  Si vous n'avez pas effectué cette action, veuillez nous contacter immédiatement.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'send' && (
            <>
              <Button variant="outline" onClick={onClose}>
                Annuler
              </Button>
              <Button
                onClick={handleSendOTP}
                disabled={isLoading}
                className="bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] text-white"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Envoi...
                  </>
                ) : (
                  'Envoyer le code'
                )}
              </Button>
            </>
          )}

          {step === 'verify' && (
            <Button
              onClick={handleVerifyOTP}
              disabled={isLoading || otpCode.length !== 6}
              className="w-full bg-[rgb(20,104,154)] hover:bg-[rgb(16,83,123)] text-white"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vérification...
                </>
              ) : (
                'Vérifier le code'
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PhoneOTPModal;

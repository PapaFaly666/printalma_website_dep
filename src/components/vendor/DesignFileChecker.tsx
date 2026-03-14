import React, { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';

interface CheckResult {
  label: string;
  status: 'idle' | 'checking' | 'valid' | 'invalid' | 'warning';
  detail: string;
}

interface DesignFileCheckerProps {
  file: File | null;
  onValidationChange?: (isValid: boolean) => void;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve({ width: img.naturalWidth, height: img.naturalHeight }); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Lecture impossible')); };
    img.src = url;
  });
}

const INITIAL_CHECKS: CheckResult[] = [
  { label: 'Format accepté', status: 'idle', detail: 'PNG, JPG, WEBP, SVG' },
  { label: 'Taille ≤ 5 Mo', status: 'idle', detail: 'Max 5 Mo' },
  { label: 'Dimensions ≥ 1000 px', status: 'idle', detail: 'Min. 1000×1000 px' },
  { label: 'Résolution ≥ 100 DPI', status: 'idle', detail: 'Vérifié côté serveur' },
];

export const DesignFileChecker: React.FC<DesignFileCheckerProps> = ({ file, onValidationChange }) => {
  const [checks, setChecks] = useState<CheckResult[]>(INITIAL_CHECKS);

  // Notifier le parent dès que l'état de validation change
  useEffect(() => {
    if (!onValidationChange) return;
    const isChecking = checks.some(c => c.status === 'checking' || c.status === 'idle');
    const hasInvalid = checks.some(c => c.status === 'invalid');
    if (isChecking) return; // pas encore terminé
    onValidationChange(!hasInvalid);
  }, [checks, onValidationChange]);

  useEffect(() => {
    if (!file) {
      setChecks(INITIAL_CHECKS);
      onValidationChange?.(false);
      return;
    }

    setChecks(prev => prev.map(c => ({ ...c, status: 'checking' })));

    const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
    const formatValid = ALLOWED_TYPES.includes(file.type) || isSvg;
    const sizeValid = file.size <= 5 * 1024 * 1024;
    const sizeMb = (file.size / (1024 * 1024)).toFixed(2);

    if (isSvg) {
      setChecks([
        { label: 'Format accepté', status: 'valid', detail: 'SVG' },
        { label: 'Taille ≤ 5 Mo', status: sizeValid ? 'valid' : 'invalid', detail: `${sizeMb} Mo` },
        { label: 'Dimensions ≥ 1000 px', status: 'warning', detail: 'Non applicable (SVG vectoriel)' },
        { label: 'Résolution ≥ 100 DPI', status: 'warning', detail: 'Vérifié côté serveur' },
      ]);
      return;
    }

    if (!formatValid) {
      setChecks([
        { label: 'Format accepté', status: 'invalid', detail: `"${file.type || file.name.split('.').pop()}" non supporté` },
        { label: 'Taille ≤ 5 Mo', status: sizeValid ? 'valid' : 'invalid', detail: `${sizeMb} Mo` },
        { label: 'Dimensions ≥ 1000 px', status: 'idle', detail: 'Min. 1000×1000 px' },
        { label: 'Résolution ≥ 100 DPI', status: 'idle', detail: 'Vérifié côté serveur' },
      ]);
      return;
    }

    getImageDimensions(file).then(({ width, height }) => {
      const dimValid = width >= 1000 && height >= 1000;
      setChecks([
        { label: 'Format accepté', status: 'valid', detail: file.type.split('/')[1].toUpperCase() },
        { label: 'Taille ≤ 5 Mo', status: sizeValid ? 'valid' : 'invalid', detail: `${sizeMb} Mo` },
        { label: 'Dimensions ≥ 1000 px', status: dimValid ? 'valid' : 'invalid', detail: `${width}×${height} px` },
        { label: 'Résolution ≥ 100 DPI', status: 'warning', detail: 'Vérifié côté serveur' },
      ]);
    }).catch(() => {
      setChecks([
        { label: 'Format accepté', status: formatValid ? 'valid' : 'invalid', detail: file.type.split('/')[1]?.toUpperCase() || '?' },
        { label: 'Taille ≤ 5 Mo', status: sizeValid ? 'valid' : 'invalid', detail: `${sizeMb} Mo` },
        { label: 'Dimensions ≥ 1000 px', status: 'invalid', detail: 'Impossible de lire' },
        { label: 'Résolution ≥ 100 DPI', status: 'warning', detail: 'Vérifié côté serveur' },
      ]);
    });
  }, [file]);

  if (!file) return null;

  const allValid = checks.every(c => c.status === 'valid' || c.status === 'warning');
  const hasInvalid = checks.some(c => c.status === 'invalid');

  return (
    <div className={`mt-3 rounded-lg border p-3 space-y-2 ${
      hasInvalid ? 'bg-red-50 border-red-200' : allValid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
    }`}>
      <p className={`text-xs font-semibold mb-2 ${
        hasInvalid ? 'text-red-700' : allValid ? 'text-green-700' : 'text-gray-600'
      }`}>
        {hasInvalid ? '❌ Fichier non conforme' : allValid ? '✅ Fichier conforme' : 'Vérification en cours...'}
      </p>

      {checks.map((check, i) => (
        <div key={i} className="flex items-center gap-2">
          {check.status === 'idle' && (
            <div className="w-4 h-4 rounded-full bg-gray-300 flex-shrink-0" />
          )}
          {check.status === 'checking' && (
            <Loader2 className="w-4 h-4 text-gray-400 animate-spin flex-shrink-0" />
          )}
          {check.status === 'valid' && (
            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
          )}
          {check.status === 'invalid' && (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
          {check.status === 'warning' && (
            <AlertTriangle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
          )}

          <span className={`text-xs font-medium flex-1 ${
            check.status === 'valid'   ? 'text-green-700' :
            check.status === 'invalid' ? 'text-red-700'   :
            check.status === 'warning' ? 'text-yellow-700' :
            'text-gray-500'
          }`}>
            {check.label}
          </span>

          <span className={`text-xs ml-auto ${
            check.status === 'valid'   ? 'text-green-600' :
            check.status === 'invalid' ? 'text-red-600'   :
            check.status === 'warning' ? 'text-yellow-600' :
            'text-gray-400'
          }`}>
            {check.detail}
          </span>
        </div>
      ))}
    </div>
  );
};

export default DesignFileChecker;

import React, { useState, useEffect } from 'react';

interface DiagnosticProps {
  vendorProductId: number;
  designUrl: string;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  transforms: Record<string, any>;
}

export function DesignTransformsDiagnostic({
  vendorProductId,
  designUrl,
  isLoading,
  isInitialized,
  error,
  transforms
}: DiagnosticProps) {
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Capturer les logs de la console
  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    const captureLogs = (type: 'log' | 'error' | 'warn', ...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('🔄') || message.includes('✅') || message.includes('❌') || message.includes('⚠️')) {
        setLogs(prev => [...prev.slice(-20), `[${type.toUpperCase()}] ${message}`]);
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      captureLogs('log', ...args);
    };

    console.error = (...args) => {
      originalError(...args);
      captureLogs('error', ...args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      captureLogs('warn', ...args);
    };

    return () => {
      console.log = originalLog;
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  // Auto-show si chargement > 5 secondes
  useEffect(() => {
    if (isLoading && !isInitialized) {
      const timer = setTimeout(() => {
        setShowDiagnostic(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isInitialized]);

  if (!showDiagnostic && !isLoading) {
    return null;
  }

  const diagnosticInfo = {
    '🔍 Paramètres': {
      'Product ID': vendorProductId || 'MANQUANT',
      'Design URL': designUrl ? `${designUrl.substring(0, 50)}...` : 'MANQUANT',
      'URL Valide': designUrl && designUrl.trim() !== '' ? '✅' : '❌',
      'Product ID Valide': vendorProductId && vendorProductId > 0 ? '✅' : '❌'
    },
    '📊 État': {
      'Is Loading': isLoading ? '🔄' : '✅',
      'Is Initialized': isInitialized ? '✅' : '❌',
      'Has Error': error ? '❌' : '✅',
      'Transforms Count': Object.keys(transforms).length
    },
    '🗄️ LocalStorage': {
      'Disponible': typeof localStorage !== 'undefined' ? '✅' : '❌',
      'Items Design': Object.keys(localStorage).filter(k => k.startsWith('design_transforms')).length,
      'Taille Utilisée': `${Math.round(JSON.stringify(localStorage).length / 1024)}KB`
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <div className="bg-white dark:bg-gray-800 border-2 border-yellow-400 rounded-lg shadow-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-yellow-700 dark:text-yellow-400">
            🚨 Diagnostic Chargement
          </h3>
          <button
            onClick={() => setShowDiagnostic(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {isLoading && (
          <div className="mb-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div className="flex items-center gap-2">
              <div className="animate-spin h-4 w-4 border-2 border-yellow-500 border-t-transparent rounded-full"></div>
              <span className="text-yellow-700 dark:text-yellow-400 text-sm">
                Chargement en cours...
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
            <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Informations de diagnostic */}
        <div className="space-y-3">
          {Object.entries(diagnosticInfo).map(([section, data]) => (
            <div key={section}>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">
                {section}
              </h4>
              <div className="text-xs space-y-1">
                {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">{key}:</span>
                    <span className="font-mono text-gray-800 dark:text-gray-200">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions rapides */}
        <div className="mt-4 space-y-2">
          <button
            onClick={() => window.location.reload()}
            className="w-full px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            🔄 Recharger la page
          </button>
          
          <button
            onClick={() => {
              // Nettoyer localStorage
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('design_transforms')) {
                  localStorage.removeItem(key);
                }
              });
              window.location.reload();
            }}
            className="w-full px-3 py-2 bg-orange-500 text-white text-sm rounded hover:bg-orange-600"
          >
            🗑️ Nettoyer Cache & Recharger
          </button>
        </div>

        {/* Logs récents */}
        {logs.length > 0 && (
          <details className="mt-4">
            <summary className="text-sm font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
              📝 Logs récents ({logs.length})
            </summary>
            <div className="mt-2 max-h-32 overflow-y-auto bg-black text-green-400 p-2 rounded text-xs font-mono">
              {logs.slice(-10).map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          </details>
        )}

        {/* Instructions */}
        <div className="mt-4 text-xs text-gray-600 dark:text-gray-400">
          <p><strong>Si le chargement est bloqué :</strong></p>
          <ol className="list-decimal list-inside mt-1 space-y-1">
            <li>Vérifier les paramètres (Product ID et Design URL)</li>
            <li>Vérifier la console navigateur (F12)</li>
            <li>Essayer "Nettoyer Cache & Recharger"</li>
            <li>Contacter le support si le problème persiste</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 
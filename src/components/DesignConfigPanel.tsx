import React from 'react';

interface DesignConfigPanelProps {
  config: {
    positioning: 'CENTER' | 'TOP' | 'BOTTOM';
    scale: number;
  };
  onChange: (config: { positioning: 'CENTER' | 'TOP' | 'BOTTOM'; scale: number }) => void;
  disabled?: boolean;
}

const DesignConfigPanel: React.FC<DesignConfigPanelProps> = ({
  config,
  onChange,
  disabled = false
}) => {
  const updateConfig = (updates: Partial<typeof config>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-gray-900">Configuration du Design</h4>
      
      {/* Positionnement */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Positionnement
        </label>
        <div className="grid grid-cols-3 gap-2">
          {['TOP', 'CENTER', 'BOTTOM'].map((position) => (
            <button
              key={position}
              onClick={() => updateConfig({ positioning: position as any })}
              disabled={disabled}
              className={`px-3 py-2 text-sm rounded-md transition-colors ${
                config.positioning === position
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {position === 'TOP' ? 'Haut' : position === 'CENTER' ? 'Centre' : 'Bas'}
            </button>
          ))}
        </div>
      </div>

      {/* Échelle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Taille du Design: {Math.round(config.scale * 100)}%
        </label>
        <input
          type="range"
          min="0.3"
          max="1.0"
          step="0.05"
          value={config.scale}
          onChange={(e) => updateConfig({ scale: parseFloat(e.target.value) })}
          disabled={disabled}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>30%</span>
          <span>100%</span>
        </div>
      </div>
    </div>
  );
};

export default DesignConfigPanel; 
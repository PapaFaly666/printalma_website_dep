import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { VENDEUR_TYPE_METADATA } from '../../types/auth.types';
import { 
  User, 
  LogOut, 
  Settings, 
  ChevronDown, 
  Shield,
  Crown,
  Briefcase
} from 'lucide-react';

const UserNavigation: React.FC = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const getRoleDisplay = () => {
    switch (user.role) {
      case 'SUPERADMIN':
        return { label: 'Super Admin', icon: Crown, color: 'text-gray-900', bgColor: 'bg-gray-100' };
      case 'ADMIN':
        return { label: 'Admin', icon: Shield, color: 'text-gray-900', bgColor: 'bg-gray-100' };
      case 'VENDEUR':
        if (user.vendeur_type) {
          const metadata = VENDEUR_TYPE_METADATA[user.vendeur_type];
          return { 
            label: metadata.label, 
            icon: Briefcase, 
            color: metadata.color, 
            bgColor: metadata.bgColor,
            emoji: metadata.icon 
          };
        }
        return { label: 'Vendeur', icon: Briefcase, color: 'text-gray-900', bgColor: 'bg-gray-100' };
      default:
        return { label: user.role, icon: User, color: 'text-gray-900', bgColor: 'bg-gray-100' };
    }
  };

  const roleDisplay = getRoleDisplay();
  const IconComponent = roleDisplay.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
      >
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-medium">
          {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
        </div>
        
        {/* User Info */}
        <div className="hidden md:block text-left">
          <div className="text-sm font-medium text-gray-900">
            {user.firstName} {user.lastName}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-600">
            {roleDisplay.emoji && <span className="text-sm">{roleDisplay.emoji}</span>}
            <span className={roleDisplay.color}>{roleDisplay.label}</span>
          </div>
        </div>
        
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-200 z-50">
          {/* User Header */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-medium text-lg">
                {user.firstName.charAt(0).toUpperCase()}{user.lastName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-gray-600">{user.email}</p>
                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium mt-1 ${roleDisplay.bgColor} ${roleDisplay.color}`}>
                  {roleDisplay.emoji ? (
                    <span className="text-sm">{roleDisplay.emoji}</span>
                  ) : (
                    <IconComponent className="w-3 h-3" />
                  )}
                  {roleDisplay.label}
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Type Details (if applicable) */}
          {user.role === 'VENDEUR' && user.vendeur_type && (
            <div className="p-4 border-b border-gray-100">
              <div className={`p-3 rounded-lg ${VENDEUR_TYPE_METADATA[user.vendeur_type].bgColor}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{VENDEUR_TYPE_METADATA[user.vendeur_type].icon}</span>
                  <h4 className={`font-medium ${VENDEUR_TYPE_METADATA[user.vendeur_type].color}`}>
                    Espace {VENDEUR_TYPE_METADATA[user.vendeur_type].label}
                  </h4>
                </div>
                <p className="text-xs text-gray-600 mb-2">
                  {VENDEUR_TYPE_METADATA[user.vendeur_type].description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {VENDEUR_TYPE_METADATA[user.vendeur_type].features.map((feature, index) => (
                    <span 
                      key={index}
                      className="inline-block px-2 py-1 text-xs bg-white rounded-full text-gray-600"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Menu Items */}
          <div className="p-2">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/profile');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <User className="w-4 h-4" />
              Mon profil
            </button>
            
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                navigate('/change-password');
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200"
            >
              <Settings className="w-4 h-4" />
              Changer le mot de passe
            </button>
          </div>

          {/* Logout */}
          <div className="p-2 border-t border-gray-100">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </button>
          </div>

          {/* Status indicator */}
          <div className="p-3 bg-gray-50 rounded-b-xl">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>État de la session</span>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Connecté</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default UserNavigation; 
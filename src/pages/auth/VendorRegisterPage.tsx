import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Store, Mail, Lock } from 'lucide-react';
import authService from '../../services/auth.service';
import { VendeurType } from '../../types/auth.types';

const VendorRegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    vendeur_type: VendeurType.DESIGNER as VendeurType
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.firstName) errs.firstName = 'Prénom requis';
    if (!formData.lastName) errs.lastName = 'Nom requis';
    if (!formData.email) errs.email = 'Email requis';
    else if (!emailRegex.test(formData.email)) errs.email = 'Email invalide';

    if (!formData.password) errs.password = 'Mot de passe requis';
    else if (!passwordRegex.test(formData.password)) errs.password = 'Mot de passe trop faible';
    if (formData.password !== formData.confirmPassword) errs.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Trim form values
    const cleaned = {
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim(),
      password: formData.password,
      vendeur_type: formData.vendeur_type
    };

    if (!validate()) return;
    setLoading(true);
    setApiError(null);
    try {
      console.log('📦 Payload inscription', cleaned);
      const res = await authService.registerVendor(cleaned);
      console.log('✅ Réponse inscription', res);
      if (res.ok) {
        navigate('/vendeur/pending', { state: { email: cleaned.email } });
        return;
      }
    } catch (err: any) {
      if (err?.statusCode === 422 && err?.errors) {
        const fieldErrs: Record<string, string> = {};
        Object.entries(err.errors).forEach(([field, msgs]: any) => {
          fieldErrs[field] = Array.isArray(msgs) ? msgs[0] : msgs;
        });
        setErrors(fieldErrs);
      } else if (err?.statusCode === 400) {
        const msg: string = err.message || 'Erreur';
        if (msg.toLowerCase().includes('email')) setErrors(prev => ({ ...prev, email: msg }));
        else if (msg.toLowerCase().includes('mot de passe')) setErrors(prev => ({ ...prev, password: msg }));
        else setApiError(msg);
      } else {
        setApiError(err?.message || 'Erreur lors de la création du compte');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white dark:bg-gray-900 px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-black flex items-center justify-center shadow-lg">
          <Store className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-1">
          Inscription Vendeur
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
          Créez un compte pour commencer à vendre
        </p>
      </div>

      <Card className="w-full max-w-lg shadow-md">
        <CardHeader>
          <CardTitle className="text-xl text-center">Créer votre compte</CardTitle>
          <CardDescription className="text-center text-sm">
            C'est rapide et gratuit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* First Name */}
            <div className="space-y-1">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="John" />
              {errors.firstName && <p className="text-xs text-red-600">{errors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-1">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Doe" />
              {errors.lastName && <p className="text-xs text-red-600">{errors.lastName}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="email" name="email" type="email" className="pl-10" value={formData.email} onChange={handleChange} placeholder="email@example.com" />
              </div>
              {errors.email && <p className="text-xs text-red-600">{errors.email}</p>}
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input id="password" name="password" type="password" className="pl-10" value={formData.password} onChange={handleChange} placeholder="********" />
              </div>
              {errors.password && <p className="text-xs text-red-600">{errors.password}</p>}
            </div>

            {/* Vendeur type */}
            <div className="space-y-1">
              <Label htmlFor="vendeur_type">Type de vendeur</Label>
              <select id="vendeur_type" name="vendeur_type" value={formData.vendeur_type} onChange={handleChange as any} className="w-full border rounded-md p-2 focus:outline-none focus:ring-1 focus:ring-gray-400">
                <option value={VendeurType.DESIGNER}>Designer</option>
                <option value={VendeurType.ARTISTE}>Artiste</option>
                <option value={VendeurType.INFLUENCEUR}>Influenceur</option>
              </select>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1">
              <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
              <Input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange} placeholder="********" />
              {errors.confirmPassword && <p className="text-xs text-red-600">{errors.confirmPassword}</p>}
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-black hover:bg-gray-800 text-white py-3 text-base font-medium">
              {loading ? '...' : 'Créer un compte'}
            </Button>
            {apiError && <p className="text-center text-sm text-red-600">{apiError}</p>}
          </form>

          <p className="text-center text-xs text-gray-500 mt-4">
            Vous avez déjà un compte ?{' '}
            <Link to="/vendeur/login" className="underline hover:text-black dark:hover:text-white">
              Se connecter
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default VendorRegisterPage; 
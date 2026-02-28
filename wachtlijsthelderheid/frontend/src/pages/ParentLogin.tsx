import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { parentApi, setAuthToken } from '../utils/api';
import { User, Mail, Lock, Phone, ArrowRight, Building2 } from 'lucide-react';

export default function ParentLogin() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  useEffect(() => {
    const token = localStorage.getItem('parentToken');
    if (token) {
      navigate('/ouder/dashboard');
    }
  }, [navigate]);

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isRegister) {
        result = await parentApi.register({ email, password, name, phone: phone || undefined });
      } else {
        result = await parentApi.login(email, password);
      }

      setAuthToken(result.token);
      localStorage.setItem('parentToken', result.token);
      localStorage.setItem('parentUser', JSON.stringify(result.user));
      navigate('/ouder/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        {/* Card */}
        <div className="bg-white rounded-md p-8 shadow-sm border border-gray-100">
          {/* Logo/Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
              <User className="w-8 h-8 text-primary-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">
              Wait
            </h1>
            <p className="text-gray-600 mt-2 text-base">
              {isRegister ? 'Maak een ouder account aan' : 'Inloggen als ouder'}
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-error-50 border border-error-100 text-error-600 px-4 py-3 rounded-sm mb-6 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                {/* Name Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Naam
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="Uw volledige naam"
                      required
                    />
                  </div>
                </div>

                {/* Phone Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefoon <span className="text-gray-400">(optioneel)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="w-5 h-5 text-gray-400" />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                      placeholder="06-12345678"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder="uw@email.nl"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Wachtwoord
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="w-5 h-5 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 w-full pl-10 pr-4 rounded-sm border border-gray-300 text-base focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                  placeholder={isRegister ? 'Minimaal 6 tekens' : '••••••••'}
                  required
                  minLength={6}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-500 text-white px-6 py-3 rounded-sm font-medium hover:bg-primary-600 transform hover:-translate-y-0.5 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Registreren' : 'Inloggen'}
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login/Register */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                setError('');
              }}
              className="text-primary-500 hover:text-primary-600 text-sm font-medium transition-colors duration-200"
            >
              {isRegister
                ? 'Al een account? Inloggen'
                : 'Nog geen account? Registreren'}
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">of</span>
            </div>
          </div>

          {/* Organization Login Link */}
          <div className="space-y-3">
            <Link
              to="/login"
              className="w-full border-2 border-primary-500 text-primary-500 bg-transparent px-6 py-3 rounded-sm font-medium hover:bg-primary-500 hover:text-white transition-all duration-200 flex items-center justify-center gap-2"
            >
              <Building2 className="w-5 h-5" />
              Organisatie login
            </Link>

            <Link
              to="/portaal"
              className="w-full text-gray-600 bg-gray-100 px-6 py-3 rounded-sm font-medium hover:bg-gray-200 transition-all duration-200 flex items-center justify-center gap-2 text-sm"
            >
              Ouder Portal (met toegangscode)
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Door te registreren gaat u akkoord met onze voorwaarden
        </p>
      </div>
    </div>
  );
}

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { authApi } from '../utils/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login(email, password);
      login(response.token, response.organization);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Inloggen mislukt');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-primary-500 rounded-xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Wait</h1>
          <p className="text-gray-500 mt-1 text-sm">Transparant wachtlijstbeheer</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-5">Inloggen</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="admin@voorbeeld.nl"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                Wachtwoord
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full mt-2"
            >
              {loading ? 'Bezig...' : 'Inloggen'}
            </button>
          </form>

          <div className="mt-5 text-center text-sm">
            <span className="text-gray-500">Nog geen account? </span>
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
              Registreren
            </Link>
          </div>
        </div>

        {/* Parent portal link */}
        <div className="mt-4 p-4 bg-white rounded-xl border border-gray-200">
          <p className="text-xs text-gray-500 text-center mb-3">
            Bent u ouder? Gebruik uw toegangscode:
          </p>
          <Link
            to="/portal"
            className="btn-secondary w-full text-center block"
          >
            Ouder Portal
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 bg-gray-100 rounded-xl">
          <p className="text-xs font-medium text-gray-600 mb-2">Demo accounts:</p>
          <div className="text-xs text-gray-500 space-y-0.5">
            <p>admin@zonnestraal.nl / demo123</p>
            <p>beheer@speelparadijs.nl / test456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

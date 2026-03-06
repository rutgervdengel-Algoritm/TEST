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
    <div className="min-h-screen bg-cream-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-forest-500 rounded-xl mb-4">
            <span className="text-white font-serif font-bold text-2xl">W</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-forest-600">WachtlijstHelderheid</h1>
          <p className="text-navy-400 mt-1 text-sm">Transparant wachtlijstbeheer</p>
        </div>

        {/* Login form */}
        <div className="bg-white rounded-2xl border border-cream-300 p-6">
          <h2 className="text-lg font-serif font-bold text-forest-600 mb-5">Inloggen</h2>

          {error && (
            <div className="mb-4 p-3 bg-terracotta-50 border border-terracotta-200 text-terracotta-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
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
              <label htmlFor="password" className="label">
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
            <span className="text-navy-400">Nog geen account? </span>
            <Link to="/register" className="text-terracotta-500 hover:text-terracotta-600 font-semibold">
              Registreren
            </Link>
          </div>
        </div>

        {/* Parent portal link */}
        <div className="mt-4 p-4 bg-white rounded-2xl border border-cream-300">
          <p className="text-xs text-navy-400 text-center mb-3">
            Bent u ouder? Gebruik uw toegangscode:
          </p>
          <Link
            to="/portal"
            className="btn-outline w-full text-center block"
          >
            Ouder Portal
          </Link>
        </div>

        {/* Demo credentials */}
        <div className="mt-4 p-4 bg-cream-200 rounded-2xl">
          <p className="text-xs font-semibold text-forest-600 mb-2">Demo accounts:</p>
          <div className="text-xs text-navy-500 space-y-0.5">
            <p>admin@zonnestraal.nl / demo123</p>
            <p>beheer@speelparadijs.nl / test456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

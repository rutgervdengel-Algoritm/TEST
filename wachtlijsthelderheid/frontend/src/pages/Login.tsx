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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-600 rounded-2xl mb-4">
            <span className="text-white font-bold text-2xl">WH</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">WachtlijstHelderheid</h1>
          <p className="text-gray-600 mt-1">Transparant wachtlijstbeheer</p>
        </div>

        {/* Login form */}
        <div className="card">
          <div className="card-body">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Inloggen</h2>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="label">Email</label>
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
                <label htmlFor="password" className="label">Wachtwoord</label>
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
                className="btn-primary w-full"
              >
                {loading ? 'Bezig...' : 'Inloggen'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Nog geen account? </span>
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Registreren
              </Link>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200">
              <p className="text-xs text-gray-500 text-center mb-2">
                Bent u ouder? Gebruik uw toegangscode:
              </p>
              <Link
                to="/portal"
                className="btn-secondary w-full text-center block"
              >
                Ouder Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-white/50 rounded-lg border border-primary-200">
          <p className="text-xs font-medium text-primary-800 mb-2">Demo accounts:</p>
          <div className="text-xs text-primary-700 space-y-1">
            <p>admin@zonnestraal.nl / demo123</p>
            <p>beheer@speelparadijs.nl / test456</p>
          </div>
        </div>
      </div>
    </div>
  );
}

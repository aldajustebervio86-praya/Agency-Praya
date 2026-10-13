import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Store, Loader2, Mail, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function Login() {
  const { signIn, signInWithGoogle, signInWithFacebook } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate(from, { replace: true });
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setOauthLoading("google");
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error);
      setOauthLoading(null);
    }
  };

  const handleFacebook = async () => {
    setError(null);
    setOauthLoading("facebook");
    const { error } = await signInWithFacebook();
    if (error) {
      setError(error);
      setOauthLoading(null);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center section-padding py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white mb-4">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Connexion</h1>
          <p className="text-gray-500 mt-2 text-sm">Accédez à votre compte</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="login-email" className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field pl-11"
                placeholder="votre@email.com"
                autoComplete="email"
              />
            </div>
          </div>

          <PasswordInput
            id="login-password"
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
          />

          <div className="flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              Mot de passe oublié ?
            </Link>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Se connecter"}
          </button>
        </form>

        <div className="mt-4">
          <div className="relative flex items-center my-4">
            <div className="flex-1 border-t border-gray-200" />
            <span className="px-3 text-xs text-gray-400 font-medium">ou continuer avec</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleGoogle}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {oauthLoading === "google" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google
            </button>

            <button
              onClick={handleFacebook}
              disabled={oauthLoading !== null}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {oauthLoading === "facebook" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.07C24 5.41 18.63 0 12 0S0 5.41 0 12.07c0 6.02 4.39 11.01 10.13 11.93v-8.44H7.08v-3.49h3.05V9.41c0-3.02 1.79-4.69 4.53-4.69 1.31 0 2.68.24 2.68.24v2.97h-1.51c-1.49 0-1.95.93-1.95 1.88v2.26h3.32l-.53 3.49h-2.79v8.44C19.61 23.08 24 18.09 24 12.07z"/>
                </svg>
              )}
              Facebook
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{" "}
          <Link to="/register" className="font-semibold text-brand-600 hover:text-brand-700">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  );
}

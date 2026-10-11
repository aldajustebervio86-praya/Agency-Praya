import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Loader2, AlertCircle, CheckCircle, Lock } from "lucide-react";
import { supabase } from "../lib/supabase";
import PasswordInput from "../components/PasswordInput";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session) {
        setValidToken(false);
      } else {
        setValidToken(true);
      }
      setVerifying(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError("Une erreur s'est produite lors de la modification du mot de passe. Le lien a peut-être expiré.");
    } else {
      setSuccess(true);
      setTimeout(() => {
        supabase.auth.signOut();
        navigate("/login", { replace: true });
      }, 3000);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center section-padding py-12">
        <div className="w-full max-w-md text-center">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600 mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center section-padding py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white mb-4">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Nouveau mot de passe</h1>
          <p className="text-gray-500 mt-2 text-sm">Choisissez un nouveau mot de passe pour votre compte.</p>
        </div>

        {!validToken ? (
          <div className="card p-6 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-error-100 text-error-600 mx-auto">
              <AlertCircle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-gray-900">Lien invalide ou expiré</h2>
              <p className="text-sm text-gray-500 mt-2">
                Ce lien de réinitialisation n'est plus valide. Les liens de réinitialisation
                expirent après un certain temps pour des raisons de sécurité.
              </p>
            </div>
            <Link to="/forgot-password" className="btn-primary w-full">
              Demander un nouveau lien
            </Link>
            <Link to="/login" className="btn-secondary w-full">
              Retour à la connexion
            </Link>
          </div>
        ) : success ? (
          <div className="card p-6 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-100 text-success-600 mx-auto">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-gray-900">Mot de passe modifié</h2>
              <p className="text-sm text-gray-500 mt-2">
                Votre mot de passe a été modifié avec succès. Vous allez être redirigé vers
                la page de connexion.
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <PasswordInput
              id="reset-password"
              label="Nouveau mot de passe"
              value={password}
              onChange={setPassword}
              placeholder="Minimum 6 caractères"
              autoComplete="new-password"
            />

            <PasswordInput
              id="reset-confirm-password"
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={setConfirmPassword}
              placeholder="Répétez votre mot de passe"
              autoComplete="new-password"
            />

            <div className="flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-gray-500">
              <Lock className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
              <span>
                Choisissez un mot de passe d'au moins 6 caractères. Pour plus de sécurité,
                utilisez une combinaison de lettres, chiffres et symboles.
              </span>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Modifier mon mot de passe"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

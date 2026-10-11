import { useState } from "react";
import { Link } from "react-router-dom";
import { Store, Loader2, Mail, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (email.trim().length < 3 || !email.includes("@")) {
      setError("Veuillez entrer une adresse e-mail valide.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);

    if (error) {
      setError("Une erreur s'est produite lors de l'envoi de la demande.");
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center section-padding py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white mb-4">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Mot de passe oublié</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
          </p>
        </div>

        {sent ? (
          <div className="card p-6 text-center space-y-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-100 text-success-600 mx-auto">
              <CheckCircle className="h-7 w-7" />
            </div>
            <div>
              <h2 className="font-display font-semibold text-lg text-gray-900">Demande envoyée</h2>
              <p className="text-sm text-gray-500 mt-2">
                Si cette adresse e-mail est associée à un compte, un lien de réinitialisation
                a été envoyé. Vérifiez votre boîte de réception et vos courriers indésirables.
              </p>
            </div>
            <p className="text-xs text-gray-400">
              Pour des raisons de sécurité, nous ne confirmons pas si l'adresse existe dans notre système.
            </p>
            <Link to="/login" className="btn-secondary w-full">
              <ArrowLeft className="h-4 w-4" />
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                Adresse e-mail
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  id="forgot-email"
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

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Envoyer le lien de réinitialisation"}
            </button>

            <p className="text-xs text-gray-400 text-center">
              Le lien de réinitialisation est valable pendant une durée limitée.
              Si vous ne recevez pas d'e-mail, vérifiez l'adresse saisie ou réessayez.
            </p>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

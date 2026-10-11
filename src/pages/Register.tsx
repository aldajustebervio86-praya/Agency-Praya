import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Store, Loader2, Mail, User, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import PasswordInput from "../components/PasswordInput";

export default function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }
    if (displayName.trim().length < 2) {
      setError("Veuillez entrer un nom de vendeur valide.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await signUp(email, password, displayName.trim());
    setLoading(false);
    if (error) {
      setError(error);
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center section-padding py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 text-white mb-4">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="font-display font-bold text-2xl text-gray-900">Devenir vendeur</h1>
          <p className="text-gray-500 mt-2 text-sm">Créez votre compte et publiez vos annonces</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="reg-name" className="block text-sm font-medium text-gray-700 mb-1.5">Nom de vendeur</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="reg-name"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="input-field pl-11"
                placeholder="Votre nom ou nom de boutique"
                autoComplete="name"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                id="reg-email"
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
            id="reg-password"
            label="Mot de passe"
            value={password}
            onChange={setPassword}
            placeholder="Minimum 6 caractères"
            autoComplete="new-password"
          />

          <PasswordInput
            id="reg-confirm-password"
            label="Confirmer le mot de passe"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Répétez votre mot de passe"
            autoComplete="new-password"
          />

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Créer mon compte"}
          </button>

          <div className="flex items-start gap-2 rounded-xl bg-success-50 border border-success-200 px-4 py-3 text-xs text-success-700">
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Vos informations restent confidentielles. Vous pourrez compléter votre profil après l'inscription.</span>
          </div>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Déjà vendeur ?{" "}
          <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp, Loader2, AlertCircle, MessageCircle, Smartphone,
  Shield, Clock, CheckCircle, XCircle, Eye,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase, type MonetizationRequest } from "../lib/supabase";
import { formatDate, getStatusLabel, getStatusColor, getRequestTypeLabel } from "../lib/constants";

export default function Monetization() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<MonetizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [platform, setPlatform] = useState<"tiktok" | "instagram">("tiktok");
  const [requestType, setRequestType] = useState<"monetization" | "consultation" | "growth" | "other">("monetization");
  const [accountHandle, setAccountHandle] = useState("");
  const [followerCount, setFollowerCount] = useState("");
  const [country, setCountry] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function fetchRequests() {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("monetization_requests")
      .select("id, user_id, platform, account_handle, request_type, follower_count, country, notes, status, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  }

  useEffect(() => {
    if (!authLoading) {
      fetchRequests();
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate("/login", { state: { from: { pathname: "/monetization" } } });
      return;
    }
    setError(null);

    if (accountHandle.trim().length < 2) {
      setError("Veuillez entrer un nom d'utilisateur valide.");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("monetization_requests").insert({
      user_id: user.id,
      platform,
      request_type: requestType,
      account_handle: accountHandle.trim().replace(/^@/, ""),
      follower_count: parseInt(followerCount) || 0,
      country: country.trim(),
      notes: notes.trim(),
    });
    setSubmitting(false);

    if (error) {
      setError(error.message);
    } else {
      setSuccess(true);
      setAccountHandle("");
      setFollowerCount("");
      setCountry("");
      setNotes("");
      setRequestType("monetization");
      setShowForm(false);
      fetchRequests();
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-800 text-white">
        <div className="container-max section-padding py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h1 className="font-display font-bold text-3xl">Monétisation Réseaux Sociaux</h1>
          </div>
          <p className="text-brand-100 max-w-2xl leading-relaxed">
            Soumettez une demande pour monétiser votre compte TikTok ou Instagram.
            Suivez le statut de votre demande dans votre espace dédié.
          </p>
        </div>
      </div>

      <div className="container-max section-padding py-8">
        {/* Security notice */}
        <div className="rounded-2xl bg-success-50 border border-success-200 p-5 mb-8 flex items-start gap-3">
          <Shield className="h-5 w-5 text-success-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-success-800">Vos informations sont protégées</p>
            <p className="text-sm text-success-700 mt-1">
              Nous ne demandons jamais vos mots de passe. Ne partagez jamais vos identifiants
              de réseaux sociaux. La monétisation n'est pas garantie et dépend des critères
              de chaque plateforme.
            </p>
          </div>
        </div>

        {/* Not connected */}
        {!user && !authLoading && (
          <div className="card p-8 text-center max-w-xl mx-auto">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 mx-auto mb-4">
              <TrendingUp className="h-7 w-7" />
            </div>
            <h2 className="font-display font-semibold text-lg text-gray-900">
              Connectez-vous pour soumettre une demande
            </h2>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              Vous devez avoir un compte vendeur pour accéder à l'espace monétisation.
            </p>
            <div className="flex justify-center gap-3">
              <button onClick={() => navigate("/login", { state: { from: { pathname: "/monetization" } } })} className="btn-primary">
                Se connecter
              </button>
              <button onClick={() => navigate("/register")} className="btn-secondary">
                Créer un compte
              </button>
            </div>
          </div>
        )}

        {user && (
          <>
            {/* Success message */}
            {success && (
              <div className="rounded-2xl bg-success-50 border border-success-200 p-4 mb-6 flex items-center gap-3 animate-fade-in">
                <CheckCircle className="h-5 w-5 text-success-600" />
                <p className="text-sm text-success-700">
                  Votre demande a été soumise avec succès. Vous pouvez suivre son statut ci-dessous.
                </p>
              </div>
            )}

            {/* Action button */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-display font-bold text-xl text-gray-900">Vos demandes</h2>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary">
                <TrendingUp className="h-5 w-5" />
                {showForm ? "Fermer" : "Nouvelle demande"}
              </button>
            </div>

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="card p-6 mb-6 space-y-4 animate-slide-up">
                {error && (
                  <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                    <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plateforme</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlatform("tiktok")}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        platform === "tiktok"
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <MessageCircle className="h-5 w-5" />
                      TikTok
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlatform("instagram")}
                      className={`flex items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                        platform === "instagram"
                          ? "border-brand-600 bg-brand-50 text-brand-700"
                          : "border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      <Smartphone className="h-5 w-5" />
                      Instagram
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de demande</label>
                  <select
                    value={requestType}
                    onChange={(e) => setRequestType(e.target.value as "monetization" | "consultation" | "growth" | "other")}
                    className="input-field"
                  >
                    <option value="monetization">Monétisation du compte</option>
                    <option value="consultation">Consultation / Conseil</option>
                    <option value="growth">Croissance d'audience</option>
                    <option value="other">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Nom d'utilisateur du compte
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                    <input
                      type="text"
                      required
                      value={accountHandle}
                      onChange={(e) => setAccountHandle(e.target.value)}
                      className="input-field pl-8"
                      placeholder="nom_utilisateur"
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Indiquez uniquement le nom d'utilisateur public. Ne partagez aucun mot de passe.
                  </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nombre d'abonnés (approximatif)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={followerCount}
                      onChange={(e) => setFollowerCount(e.target.value)}
                      className="input-field"
                      placeholder="ex: 5000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="input-field"
                      placeholder="ex: Haïti"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes (optionnel)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    className="input-field"
                    placeholder="Précisions sur votre compte, type de contenu, objectifs..."
                  />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary w-full">
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Soumettre la demande"}
                </button>
              </form>
            )}

            {/* Requests list */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              </div>
            ) : requests.length === 0 ? (
              <div className="card p-12 text-center">
                <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg text-gray-700">
                  Aucune demande pour le moment
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Cliquez sur "Nouvelle demande" pour commencer.
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {requests.map((req) => (
                  <div key={req.id} className="card p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                          {req.platform === "tiktok" ? (
                            <MessageCircle className="h-5 w-5" />
                          ) : (
                            <Smartphone className="h-5 w-5" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            {req.platform === "tiktok" ? "TikTok" : "Instagram"}
                          </p>
                          <p className="text-sm text-gray-500">@{req.account_handle}</p>
                        </div>
                      </div>
                      <span className={`inline-flex shrink-0 rounded-lg border px-3 py-1 text-xs font-medium ${getStatusColor(req.status)}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div>
                        <p className="text-gray-400 text-xs">Type</p>
                        <p className="text-gray-700 font-medium">{getRequestTypeLabel(req.request_type)}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs">Abonnés</p>
                      <p className="text-gray-700 font-medium">
                        {req.follower_count.toLocaleString("fr-FR")}
                      </p>
                    </div>
                      {req.country && (
                        <div>
                          <p className="text-gray-400 text-xs">Pays</p>
                          <p className="text-gray-700 font-medium">{req.country}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 text-xs">Date</p>
                        <p className="text-gray-700 font-medium">{formatDate(req.created_at)}</p>
                      </div>
                    </div>

                    {req.notes && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="text-xs text-gray-400 mb-1">Notes</p>
                        <p className="text-sm text-gray-600">{req.notes}</p>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                      <Clock className="h-3.5 w-3.5" />
                      Soumise le {formatDate(req.created_at)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Info section for non-logged users */}
        {!user && !authLoading && (
          <div className="mt-8 grid md:grid-cols-2 gap-4">
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700 mb-3">
                <Eye className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-gray-900 mb-1">Suivi en temps réel</h3>
              <p className="text-sm text-gray-600">
                Suivez l'état de votre demande à chaque étape du processus.
              </p>
            </div>
            <div className="card p-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100 text-success-700 mb-3">
                <Shield className="h-5 w-5" />
              </div>
              <h3 className="font-display font-semibold text-gray-900 mb-1">100% sécurisé</h3>
              <p className="text-sm text-gray-600">
                Aucun mot de passe demandé. Vos données restent privées et confidentielles.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

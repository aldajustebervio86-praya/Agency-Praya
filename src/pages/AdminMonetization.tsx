import { useState, useEffect, useCallback } from "react";
import {
  TrendingUp, Loader2, AlertCircle, MessageCircle, Smartphone,
  Shield, CheckCircle, XCircle, Clock, Eye, X, Pencil,
} from "lucide-react";
import { supabase, type MonetizationRequest } from "../lib/supabase";
import { formatDate, getStatusLabel, getStatusColor, getRequestTypeLabel } from "../lib/constants";

type RequestWithProfile = MonetizationRequest & {
  seller_profile?: { display_name: string } | null;
};

export default function AdminMonetization() {
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selected, setSelected] = useState<RequestWithProfile | null>(null);
  const [acting, setActing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("monetization_requests")
      .select(`
        *,
        seller_profile:seller_profiles(display_name)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setRequests([]);
    } else {
      setRequests(data as RequestWithProfile[] || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const updateStatus = async (newStatus: MonetizationRequest["status"]) => {
    if (!selected) return;
    setActing(true);
    setError(null);
    const { error } = await supabase
      .from("monetization_requests")
      .update({
        status: newStatus,
        admin_notes: adminNotes.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", selected.id);
    setActing(false);
    if (error) {
      setError(error.message);
    } else {
      await fetchRequests();
      setSelected(null);
      setAdminNotes("");
    }
  };

  const filtered = filter === "all" ? requests : requests.filter(r => r.status === filter);

  const statusCounts = {
    all: requests.length,
    pending: requests.filter(r => r.status === "pending").length,
    in_review: requests.filter(r => r.status === "in_review").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
    completed: requests.filter(r => r.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container-max section-padding py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Demandes de monétisation</h1>
            <p className="text-sm text-gray-500">Gérez les demandes TikTok et Instagram</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 overflow-x-auto">
          {[
            { key: "all", label: "Toutes", count: statusCounts.all },
            { key: "pending", label: "En attente", count: statusCounts.pending },
            { key: "in_review", label: "En cours", count: statusCounts.in_review },
            { key: "approved", label: "Approuvées", count: statusCounts.approved },
            { key: "rejected", label: "Refusées", count: statusCounts.rejected },
            { key: "completed", label: "Terminées", count: statusCounts.completed },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex items-center gap-1.5 rounded-lg px-4 py-2.5 text-sm font-medium transition-all shrink-0 ${
                filter === f.key ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
              {f.count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs ${filter === f.key ? "bg-white/20" : "bg-gray-100"}`}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="card p-12 text-center">
            <TrendingUp className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-gray-700">Aucune demande</h3>
            <p className="text-sm text-gray-500 mt-1">Les demandes apparaîtront ici une fois soumises par les utilisateurs.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filtered.map((req) => (
              <button
                key={req.id}
                onClick={() => { setSelected(req); setAdminNotes(req.admin_notes || ""); }}
                className="card p-5 text-left hover:border-brand-200 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                      {req.platform === "tiktok" ? <MessageCircle className="h-5 w-5" /> : <Smartphone className="h-5 w-5" />}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        {req.platform === "tiktok" ? "TikTok" : "Instagram"} — @{req.account_handle}
                      </p>
                      <p className="text-sm text-gray-500">
                        {req.seller_profile?.display_name || "Utilisateur"} · {getRequestTypeLabel(req.request_type)}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {req.follower_count.toLocaleString("fr-FR")} abonnés · {req.country || "Pays non précisé"} · {formatDate(req.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className={`inline-flex shrink-0 rounded-lg border px-3 py-1 text-xs font-medium ${getStatusColor(req.status)}`}>
                    {getStatusLabel(req.status)}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="font-display font-bold text-lg text-gray-900">Détail de la demande</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
                  {selected.platform === "tiktok" ? <MessageCircle className="h-6 w-6" /> : <Smartphone className="h-6 w-6" />}
                </div>
                <div>
                  <p className="font-display font-bold text-gray-900">{selected.platform === "tiktok" ? "TikTok" : "Instagram"}</p>
                  <p className="text-sm text-brand-700">@{selected.account_handle}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Utilisateur</p>
                  <p className="text-gray-700 font-medium">{selected.seller_profile?.display_name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Type</p>
                  <p className="text-gray-700 font-medium">{getRequestTypeLabel(selected.request_type)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Abonnés</p>
                  <p className="text-gray-700 font-medium">{selected.follower_count.toLocaleString("fr-FR")}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Pays</p>
                  <p className="text-gray-700 font-medium">{selected.country || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Date</p>
                  <p className="text-gray-700 font-medium">{formatDate(selected.created_at)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">Statut</p>
                  <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${getStatusColor(selected.status)}`}>
                    {getStatusLabel(selected.status)}
                  </span>
                </div>
              </div>

              {selected.notes && (
                <div className="rounded-lg bg-gray-50 p-3">
                  <p className="text-xs text-gray-400 mb-1">Notes du demandeur</p>
                  <p className="text-sm text-gray-600">{selected.notes}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes internes (admin)</label>
                <textarea
                  value={adminNotes}
                  onChange={e => setAdminNotes(e.target.value)}
                  rows={3}
                  className="input-field"
                  placeholder="Notes internes non visibles par l'utilisateur..."
                />
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => updateStatus("in_review")}
                  disabled={acting}
                  className="btn-secondary flex-1"
                >
                  <Eye className="h-4 w-4" />
                  En cours
                </button>
                <button
                  onClick={() => updateStatus("approved")}
                  disabled={acting}
                  className="btn-primary flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Approuver
                </button>
                <button
                  onClick={() => updateStatus("rejected")}
                  disabled={acting}
                  className="btn-secondary flex-1 text-error-600 hover:bg-error-50"
                >
                  <XCircle className="h-4 w-4" />
                  Refuser
                </button>
                <button
                  onClick={() => updateStatus("completed")}
                  disabled={acting}
                  className="btn-secondary flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Terminer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Truck, Plus, Trash2, Loader2, Save, X, MapPin, ArrowRight, Shield,
} from "lucide-react";
import { supabase, type DeliveryRoute, HAITI_CITIES } from "../lib/supabase";
import { formatPrice } from "../lib/constants";

export default function AdminDeliveryRoutes() {
  const [routes, setRoutes] = useState<DeliveryRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoute, setEditingRoute] = useState<DeliveryRoute | null>(null);
  const [fromCity, setFromCity] = useState("");
  const [toCity, setToCity] = useState("");
  const [fee, setFee] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRoutes() {
    setLoading(true);
    const { data } = await supabase
      .from("delivery_routes")
      .select("*")
      .order("from_city", { ascending: true });
    if (data) setRoutes(data as DeliveryRoute[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleAdd = () => {
    setEditingRoute(null);
    setFromCity("");
    setToCity("");
    setFee("");
    setShowForm(true);
    setError(null);
  };

  const handleEdit = (route: DeliveryRoute) => {
    setEditingRoute(route);
    setFromCity(route.from_city);
    setToCity(route.to_city);
    setFee(route.fee.toString());
    setShowForm(true);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fromCity || !toCity) {
      setError("Veuillez sélectionner les deux villes.");
      return;
    }
    const feeNum = parseFloat(fee);
    if (isNaN(feeNum) || feeNum < 0) {
      setError("Veuillez entrer un tarif valide.");
      return;
    }

    setSaving(true);
    if (editingRoute) {
      const { error } = await supabase
        .from("delivery_routes")
        .update({ from_city: fromCity, to_city: toCity, fee: feeNum, updated_at: new Date().toISOString() })
        .eq("id", editingRoute.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase
        .from("delivery_routes")
        .insert({ from_city: fromCity, to_city: toCity, fee: feeNum });
      if (error) setError(error.message);
    }
    setSaving(false);
    if (!error) {
      setShowForm(false);
      fetchRoutes();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce trajet ?")) return;
    await supabase.from("delivery_routes").delete().eq("id", id);
    fetchRoutes();
  };

  const handleToggleActive = async (route: DeliveryRoute) => {
    await supabase
      .from("delivery_routes")
      .update({ is_active: !route.is_active, updated_at: new Date().toISOString() })
      .eq("id", route.id);
    fetchRoutes();
  };

  return (
    <div className="animate-fade-in bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container-max section-padding py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Tarifs de livraison</h1>
            <p className="text-sm text-gray-500 mt-1">
              Gérez les trajets et leurs frais de livraison entre les villes d'Haïti.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/admin/orders" className="btn-ghost">
              <Shield className="h-4 w-4" />
              Administration
            </Link>
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="h-5 w-5" />
              Nouveau trajet
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : routes.length === 0 ? (
          <div className="card p-12 text-center">
            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-gray-700">Aucun trajet configuré</h3>
            <p className="text-sm text-gray-500 mt-1 mb-6">
              Ajoutez des trajets pour calculer automatiquement les frais de livraison.
            </p>
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="h-5 w-5" />
              Ajouter un trajet
            </button>
          </div>
        ) : (
          <div className="grid gap-3">
            {routes.map((route) => (
              <div key={route.id} className={`card p-4 flex items-center gap-4 ${!route.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <MapPin className="h-4 w-4 text-brand-600 shrink-0" />
                    <span className="truncate">{route.from_city}</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 shrink-0" />
                  <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                    <MapPin className="h-4 w-4 text-cyan-600 shrink-0" />
                    <span className="truncate">{route.to_city}</span>
                  </div>
                </div>
                <span className="font-display font-bold text-brand-700 text-lg shrink-0">
                  {formatPrice(route.fee)}
                </span>
                <button
                  onClick={() => handleToggleActive(route)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium shrink-0 ${
                    route.is_active
                      ? "bg-success-50 text-success-700 border border-success-200"
                      : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  {route.is_active ? "Actif" : "Inactif"}
                </button>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleEdit(route)}
                    className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(route.id)}
                    className="p-2 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-display font-bold text-lg text-gray-900">
                {editingRoute ? "Modifier le trajet" : "Nouveau trajet"}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-lg hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                  {error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville de départ</label>
                <select value={fromCity} onChange={(e) => setFromCity(e.target.value)} className="input-field" required>
                  <option value="">Sélectionner...</option>
                  {HAITI_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Ville de destination</label>
                <select value={toCity} onChange={(e) => setToCity(e.target.value)} className="input-field" required>
                  <option value="">Sélectionner...</option>
                  {HAITI_CITIES.map((city) => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Frais de livraison (HTG)</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={fee}
                  onChange={(e) => setFee(e.target.value)}
                  className="input-field"
                  placeholder="ex: 1000"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">
                  Annuler
                </button>
                <button type="submit" disabled={saving} className="btn-primary flex-1">
                  {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

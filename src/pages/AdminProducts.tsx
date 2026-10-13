import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Shield, Loader2, CheckCircle, XCircle, AlertCircle, Package, ImageOff,
} from "lucide-react";
import { supabase, type Product } from "../lib/supabase";
import { formatPrice, formatDate } from "../lib/constants";

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "revision" | "all">("pending");
  const [acting, setActing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchProducts() {
    setLoading(true);
    let query = supabase
      .from("products")
      .select(`*, category:categories(*), seller_profile:seller_profiles(*)`)
      .order("created_at", { ascending: false });

    if (filter !== "all") {
      query = query.eq("moderation_status", filter);
    }

    const { data } = await query;
    if (data) setProducts(data as Product[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const handleModerate = async (productId: string, status: "approved" | "rejected" | "revision") => {
    setActing(productId);
    setError(null);
    const { error } = await supabase
      .from("products")
      .update({ moderation_status: status, updated_at: new Date().toISOString() })
      .eq("id", productId);
    if (error) setError(error.message);
    setActing(null);
    if (!error) fetchProducts();
  };

  const filters: { key: typeof filter; label: string }[] = [
    { key: "pending", label: "En attente" },
    { key: "approved", label: "Approuvés" },
    { key: "rejected", label: "Refusés" },
    { key: "revision", label: "Correction demandée" },
    { key: "all", label: "Tous" },
  ];

  return (
    <div className="animate-fade-in bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container-max section-padding py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Modération des annonces</h1>
            <p className="text-sm text-gray-500 mt-1">
              Approuvez, refusez ou demandez des corrections sur les annonces.
            </p>
          </div>
          <Link to="/admin/orders" className="btn-ghost">
            <Shield className="h-4 w-4" />
            Administration
          </Link>
        </div>

        {error && (
          <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700 mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filter === f.key
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-gray-700">Aucune annonce</h3>
            <p className="text-sm text-gray-500 mt-1">
              {filter === "pending" ? "Aucune annonce en attente de modération." : "Aucune annonce dans cette catégorie."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map((product) => (
              <div key={product.id} className="card p-4 flex gap-4 items-start">
                <div className="h-20 w-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {product.image_urls?.[0] ? (
                    <img src={product.image_urls[0]} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-300">
                      <ImageOff className="h-6 w-6" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{product.title}</h3>
                  <p className="text-sm text-brand-700 font-medium">{formatPrice(product.price, product.currency)}</p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    {product.category && (
                      <span className="text-xs text-gray-400">{product.category.name}</span>
                    )}
                    {product.origin_city && (
                      <span className="text-xs text-gray-400">Ville: {product.origin_city}</span>
                    )}
                    <span className="text-xs text-gray-400">{formatDate(product.created_at)}</span>
                    {product.moderation_status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium bg-warning-50 text-warning-700 border-warning-200">
                        <AlertCircle className="h-3 w-3" /> En attente
                      </span>
                    )}
                    {product.moderation_status === "approved" && (
                      <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium bg-success-50 text-success-700 border-success-200">
                        <CheckCircle className="h-3 w-3" /> Approuvé
                      </span>
                    )}
                    {product.moderation_status === "rejected" && (
                      <span className="inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium bg-error-50 text-error-700 border-error-200">
                        <XCircle className="h-3 w-3" /> Refusé
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                  <button
                    onClick={() => handleModerate(product.id, "approved")}
                    disabled={acting === product.id}
                    className="flex items-center gap-1.5 rounded-lg bg-success-50 text-success-700 border border-success-200 px-3 py-2 text-xs font-medium hover:bg-success-100 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approuver
                  </button>
                  <button
                    onClick={() => handleModerate(product.id, "revision")}
                    disabled={acting === product.id}
                    className="flex items-center gap-1.5 rounded-lg bg-warning-50 text-warning-700 border border-warning-200 px-3 py-2 text-xs font-medium hover:bg-warning-100 transition-colors disabled:opacity-50"
                  >
                    <AlertCircle className="h-4 w-4" />
                    Correction
                  </button>
                  <button
                    onClick={() => handleModerate(product.id, "rejected")}
                    disabled={acting === product.id}
                    className="flex items-center gap-1.5 rounded-lg bg-error-50 text-error-700 border border-error-200 px-3 py-2 text-xs font-medium hover:bg-error-100 transition-colors disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Refuser
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

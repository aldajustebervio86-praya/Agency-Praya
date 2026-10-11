import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Loader2, ShoppingCart, MapPin, AlertCircle, CheckCircle, Truck, Package,
} from "lucide-react";
import { supabase, type Product, type SellerProfile, DELIVERY_FEE } from "../lib/supabase";
import { formatPrice } from "../lib/constants";
import { useAuth } from "../context/AuthContext";

export default function Checkout() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buyerNote, setBuyerNote] = useState("");

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      const { data, error } = await supabase
        .from("products")
        .select(`*, seller_profile:seller_profiles(*)`)
        .eq("id", id)
        .maybeSingle();
      if (error || !data) {
        setProduct(null);
        setLoading(false);
        return;
      }
      setProduct(data);
      setSeller(data.seller_profile || null);
      setLoading(false);
    }
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container-max section-padding py-20 text-center">
        <h2 className="font-display font-bold text-2xl text-gray-900">Produit introuvable</h2>
        <Link to="/marketplace" className="btn-primary mt-6">Retour à la marketplace</Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container-max section-padding py-20 text-center">
        <div className="card p-8 max-w-md mx-auto">
          <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-display font-semibold text-lg text-gray-900">Connexion requise</h2>
          <p className="text-sm text-gray-500 mt-2 mb-6">
            Vous devez être connecté pour passer une commande.
          </p>
          <button
            onClick={() => navigate("/login", { state: { from: { pathname: `/checkout/${id}` } } })}
            className="btn-primary"
          >
            Se connecter
          </button>
        </div>
      </div>
    );
  }

  if (user.id === product.seller_id) {
    return (
      <div className="container-max section-padding py-20 text-center">
        <div className="card p-8 max-w-md mx-auto">
          <AlertCircle className="h-12 w-12 text-warning-400 mx-auto mb-4" />
          <h2 className="font-display font-semibold text-lg text-gray-900">Action impossible</h2>
          <p className="text-sm text-gray-500 mt-2">
            Vous ne pouvez pas commander votre propre produit.
          </p>
          <Link to="/marketplace" className="btn-secondary mt-6">Retour à la marketplace</Link>
        </div>
      </div>
    );
  }

  const productTotal = product.price * quantity;
  const deliveryTotal = DELIVERY_FEE;
  const grandTotal = productTotal + deliveryTotal;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (deliveryAddress.trim().length < 5) {
      setError("Veuillez indiquer une adresse de livraison valide.");
      return;
    }
    if (quantity < 1) {
      setError("La quantité doit être d'au moins 1.");
      return;
    }
    if (product.stock !== null && quantity > product.stock) {
      setError(`La quantité demandée dépude le stock disponible (${product.stock}).`);
      return;
    }

    setSubmitting(true);

    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        buyer_id: user.id,
        seller_id: product.seller_id,
        status: "pending_seller_confirmation",
        delivery_fee: DELIVERY_FEE,
        delivery_address: deliveryAddress.trim(),
        buyer_note: buyerNote.trim(),
        payment_method: "moncash",
      })
      .select()
      .single();

    if (orderError || !orderData) {
      setError(orderError?.message || "Erreur lors de la création de la commande.");
      setSubmitting(false);
      return;
    }

    const { error: itemError } = await supabase.from("order_items").insert({
      order_id: orderData.id,
      product_id: product.id,
      title_snapshot: product.title,
      price_snapshot: product.price,
      quantity,
    });

    if (itemError) {
      setError("Erreur lors de l'ajout du produit à la commande.");
      setSubmitting(false);
      return;
    }

    setOrderId(orderData.id);
    setSuccess(true);
    setSubmitting(false);
  };

  if (success && orderId) {
    return (
      <div className="container-max section-padding py-20 text-center animate-fade-in">
        <div className="card p-8 max-w-md mx-auto">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-success-100 text-success-600 mx-auto mb-4">
            <CheckCircle className="h-7 w-7" />
          </div>
          <h2 className="font-display font-bold text-xl text-gray-900">Commande envoyée</h2>
          <p className="text-sm text-gray-500 mt-2">
            Votre commande a été enregistrée. L'administrateur demandera au vendeur de
            confirmer la disponibilité. Vous recevrez les informations de livraison après confirmation.
          </p>
          <p className="text-xs text-gray-400 mt-3">Numéro de commande: {orderId.slice(0, 8)}</p>
          <div className="flex flex-col gap-3 mt-6">
            <Link to="/dashboard" className="btn-primary">Suivre ma commande</Link>
            <Link to="/marketplace" className="btn-secondary">Retour à la marketplace</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container-max section-padding py-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <h1 className="font-display font-bold text-2xl text-gray-900 mb-8">Finaliser la commande</h1>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form */}
          <form onSubmit={handleSubmit} className="card p-6 space-y-4">
            {error && (
              <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Quantité</label>
              <input
                type="number"
                min="1"
                max={product.stock ?? undefined}
                required
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="input-field"
              />
              {product.stock !== null && (
                <p className="text-xs text-gray-400 mt-1">{product.stock} disponible{product.stock > 1 ? "s" : ""}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Lieu de livraison
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
                <textarea
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  rows={3}
                  className="input-field pl-11"
                  placeholder="Votre adresse complète ou point de rendez-vous..."
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Indiquez l'adresse ou le lieu où vous souhaitez être livré.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Note (optionnel)
              </label>
              <textarea
                value={buyerNote}
                onChange={(e) => setBuyerNote(e.target.value)}
                rows={2}
                className="input-field"
                placeholder="Précisions pour votre commande..."
              />
            </div>

            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm text-gray-600">
                <Truck className="h-4 w-4 inline mr-1.5 text-brand-600" />
                Frais de livraison standard: <strong>{formatPrice(DELIVERY_FEE)}</strong>.
                Pour les zones éloignées, un tarif ajusté pourra être proposé après confirmation du vendeur.
                Vous pourrez accepter ou refuser ce tarif avant le paiement.
              </p>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full">
              {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <ShoppingCart className="h-5 w-5" />}
              Confirmer la commande
            </button>
          </form>

          {/* Summary */}
          <div className="space-y-4">
            <div className="card p-5">
              <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-brand-600" />
                Produit commandé
              </h3>
              <div className="flex gap-3">
                <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                  {product.image_urls?.[0] ? (
                    <img src={product.image_urls[0]} alt="" className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{product.title}</p>
                  <p className="text-sm text-gray-500">{formatPrice(product.price, product.currency)}</p>
                  <p className="text-xs text-gray-400 mt-1">Vendeur: {seller?.display_name || "Vendeur"}</p>
                </div>
              </div>
            </div>

            <div className="card p-5">
              <h3 className="font-display font-semibold text-gray-900 mb-4">Récapitulatif</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Prix du produit ({quantity}x)</span>
                  <span className="font-medium text-gray-900">{formatPrice(productTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Frais de livraison</span>
                  <span className="font-medium text-gray-900">{formatPrice(deliveryTotal)}</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between">
                  <span className="font-display font-bold text-gray-900">Total</span>
                  <span className="font-display font-bold text-brand-700 text-lg">{formatPrice(grandTotal)}</span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-4">
                Le paiement n'est pas effectué ici. Après confirmation du vendeur, les informations
                de paiement par MonCash vous seront communiquées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

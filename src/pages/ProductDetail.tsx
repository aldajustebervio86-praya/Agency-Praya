import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, User, ImageOff, Tag, MapPin, ShoppingCart, Shield, Truck, Boxes,
} from "lucide-react";
import { supabase, type Product, type SellerProfile, DELIVERY_FEE } from "../lib/supabase";
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "../lib/constants";
import { useAuth } from "../context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [seller, setSeller] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    async function fetchProduct() {
      if (!id) return;
      setLoading(true);
      const { data, error } = await supabase
        .from("products")
        .select(`
          *,
          category:categories(*),
          seller_profile:seller_profiles(*)
        `)
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
        <p className="text-gray-500 mt-2">Cette annonce n'existe plus ou a été supprimée.</p>
        <Link to="/marketplace" className="btn-primary mt-6">
          <ArrowLeft className="h-4 w-4" />
          Retour à la marketplace
        </Link>
      </div>
    );
  }

  const images = product.image_urls || [];
  const isOwnProduct = user?.id === product.seller_id;
  const outOfStock = product.stock !== null && product.stock === 0;
  const canOrder = product.status === "active" && !isOwnProduct && !outOfStock;

  const handleOrder = () => {
    if (!user) {
      navigate("/login", { state: { from: { pathname: `/checkout/${product.id}` } } });
      return;
    }
    navigate(`/checkout/${product.id}`);
  };

  return (
    <div className="animate-fade-in">
      <div className="container-max section-padding py-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </button>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-2xl bg-gray-100 overflow-hidden border border-gray-100">
              {images[activeImage] ? (
                <img
                  src={images[activeImage]}
                  alt={product.title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-300">
                  <ImageOff className="h-16 w-16" />
                </div>
              )}
            </div>
            {images.length > 1 && (
              <div className="mt-4 flex gap-3 overflow-x-auto">
                {images.map((url, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 h-20 w-20 rounded-xl overflow-hidden border-2 transition-all ${
                      activeImage === i ? "border-brand-600" : "border-transparent"
                    }`}
                  >
                    <img src={url} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.category && (
              <Link
                to={`/marketplace?category=${product.category.slug}`}
                className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700"
              >
                <Tag className="h-3.5 w-3.5" />
                {product.category.name}
              </Link>
            )}

            <h1 className="mt-4 font-display font-bold text-2xl md:text-3xl text-gray-900">
              {product.title}
            </h1>

            <p className="mt-4 font-display font-bold text-3xl text-brand-700">
              {formatPrice(product.price, product.currency)}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-medium ${getStatusColor(product.status)}`}>
                {getStatusLabel(product.status)}
              </span>
              {product.stock !== null && (
                <span className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1 text-xs font-medium ${
                  product.stock === 0 ? "bg-error-50 text-error-700 border-error-200" : "bg-success-50 text-success-700 border-success-200"
                }`}>
                  <Boxes className="h-3 w-3" />
                  {product.stock === 0 ? "Rupture de stock" : `${product.stock} disponible${product.stock > 1 ? "s" : ""}`}
                </span>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-display font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {product.description || "Aucune description fournie."}
              </p>
            </div>

            <p className="mt-4 text-xs text-gray-400">
              Publié le {formatDate(product.created_at)}
            </p>

            {/* Seller info (no direct contact) */}
            <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-brand-600" />
                Vendeur
              </h3>
              <p className="font-medium text-gray-900">
                {seller?.display_name || "Vendeur"}
              </p>
              {seller?.location && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {seller.location}
                </p>
              )}
              {seller?.bio && <p className="text-sm text-gray-500 mt-1">{seller.bio}</p>}
            </div>

            {/* Order section */}
            {canOrder ? (
              <div className="mt-4 space-y-3">
                <div className="rounded-2xl bg-brand-50 border border-brand-100 p-4">
                  <p className="text-sm text-gray-600 flex items-center gap-2">
                    <Truck className="h-4 w-4 text-brand-600" />
                    Frais de livraison standard: <strong>{formatPrice(DELIVERY_FEE)}</strong>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Séparé du prix du produit. Le total vous sera affiché avant confirmation.
                  </p>
                </div>
                <button onClick={handleOrder} className="btn-primary w-full">
                  <ShoppingCart className="h-5 w-5" />
                  Commander ce produit
                </button>
                <div className="flex items-start gap-2 rounded-xl bg-gray-50 border border-gray-100 px-4 py-3 text-xs text-gray-500">
                  <Shield className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                  <span>
                    La commande est gérée par Agency Prarya. La communication avec le vendeur
                    est assurée par l'administrateur. Aucun contact direct acheteur-vendeur.
                  </span>
                </div>
              </div>
            ) : isOwnProduct ? (
              <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-5 text-center">
                <p className="text-sm text-gray-500">Ceci est votre propre annonce.</p>
                <Link to="/dashboard" className="btn-secondary mt-3">
                  Gérer mes annonces
                </Link>
              </div>
            ) : !isOwnProduct && outOfStock ? (
              <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-5 text-center">
                <p className="text-sm text-gray-500">Ce produit est en rupture de stock.</p>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl bg-gray-50 border border-gray-100 p-5 text-center">
                <p className="text-sm text-gray-500">Ce produit n'est plus disponible à la commande.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Loader2, MessageCircle, Phone, Mail, User, ImageOff, Tag,
} from "lucide-react";
import { supabase, type Product, type SellerProfile } from "../lib/supabase";
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "../lib/constants";
import { CONTACT } from "../lib/constants";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
  const whatsappNumber = seller?.whatsapp || CONTACT.whatsapp;
  const whatsappMessage = encodeURIComponent(
    `Bonjour, je suis intéressé(e) par votre annonce "${product.title}" sur Agency Prarya.`
  );
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${whatsappMessage}`;

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

            <div className="mt-3">
              <span className={`inline-flex rounded-lg border px-3 py-1 text-xs font-medium ${getStatusColor(product.status)}`}>
                {getStatusLabel(product.status)}
              </span>
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

            {/* Seller contact */}
            <div className="mt-8 rounded-2xl bg-gray-50 border border-gray-100 p-5">
              <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-brand-600" />
                Vendeur
              </h3>
              <p className="font-medium text-gray-900">
                {seller?.display_name || "Vendeur"}
              </p>
              {seller?.bio && <p className="text-sm text-gray-500 mt-1">{seller.bio}</p>}

              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary flex-1"
                >
                  <MessageCircle className="h-5 w-5" />
                  Contacter sur WhatsApp
                </a>
                {seller?.phone && (
                  <a href={`tel:${seller.phone}`} className="btn-secondary flex-1">
                    <Phone className="h-5 w-5" />
                    Appeler
                  </a>
                )}
              </div>
            </div>

            {/* General contact */}
            <div className="mt-4 rounded-2xl bg-brand-50 border border-brand-100 p-5">
              <p className="text-sm text-gray-600 mb-3">
                Besoin d'aide ? Contactez Agency Prarya directement :
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a href={`mailto:${CONTACT.email}`} className="btn-ghost flex-1 justify-center">
                  <Mail className="h-4 w-4" />
                  {CONTACT.email}
                </a>
                <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-ghost flex-1 justify-center">
                  <Phone className="h-4 w-4" />
                  {CONTACT.phone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

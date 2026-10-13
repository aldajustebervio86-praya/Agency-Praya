import { Link } from "react-router-dom";
import { ImageOff, Heart } from "lucide-react";
import { useState, useEffect } from "react";
import type { Product } from "../lib/supabase";
import { supabase } from "../lib/supabase";
import { formatPrice } from "../lib/constants";
import { useAuth } from "../context/AuthContext";

export default function ProductCard({ product }: { product: Product }) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const imageUrl = product.image_urls?.[0];
  const categorySlug = product.category?.slug;
  const productLink = categorySlug
    ? `/marketplace/${categorySlug}/${product.id}`
    : `/marketplace/product/${product.id}`;

  useEffect(() => {
    async function checkFavorite() {
      if (!user) return;
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .eq("product_id", product.id)
        .maybeSingle();
      setIsFavorite(!!data);
    }
    checkFavorite();
  }, [user, product.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    if (isFavorite) {
      await supabase.from("favorites").delete().eq("user_id", user.id).eq("product_id", product.id);
      setIsFavorite(false);
    } else {
      await supabase.from("favorites").insert({ user_id: user.id, product_id: product.id });
      setIsFavorite(true);
    }
  };

  return (
    <Link to={productLink} className="card group overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-gray-100 overflow-hidden">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <ImageOff className="h-10 w-10" />
          </div>
        )}
        {product.status === "sold" && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-gray-900">
              Vendu
            </span>
          </div>
        )}
        {product.category && (
          <span className="absolute top-3 left-3 rounded-lg bg-white/90 backdrop-blur px-3 py-1 text-xs font-medium text-gray-700">
            {product.category.name}
          </span>
        )}
        {user && (
          <button
            onClick={toggleFavorite}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 backdrop-blur hover:bg-white transition-colors"
          >
            <Heart
              className={`h-4 w-4 transition-all ${isFavorite ? "fill-error-500 text-error-500" : "text-gray-400"}`}
            />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-brand-700 transition-colors">
          {product.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2 flex-1">
          {product.description || "Aucune description"}
        </p>
        {product.origin_city && (
          <p className="mt-1 text-xs text-gray-400 flex items-center gap-1">
            <span>{product.origin_city}</span>
          </p>
        )}
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display font-bold text-brand-700 text-lg">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.seller_profile?.display_name && (
            <span className="text-xs text-gray-400 truncate ml-2">
              {product.seller_profile.display_name}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

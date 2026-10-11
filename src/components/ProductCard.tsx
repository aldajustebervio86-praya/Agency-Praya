import { Link } from "react-router-dom";
import { ImageOff } from "lucide-react";
import type { Product } from "../lib/supabase";
import { formatPrice } from "../lib/constants";

export default function ProductCard({ product }: { product: Product }) {
  const imageUrl = product.image_urls?.[0];
  const categorySlug = product.category?.slug;
  const productLink = categorySlug
    ? `/marketplace/${categorySlug}/${product.id}`
    : `/marketplace/product/${product.id}`;

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
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 group-hover:text-brand-700 transition-colors">
          {product.title}
        </h3>
        <p className="mt-1 text-xs text-gray-500 line-clamp-2 flex-1">
          {product.description || "Aucune description"}
        </p>
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

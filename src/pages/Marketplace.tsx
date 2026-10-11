import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, Loader2, PackageX, Filter } from "lucide-react";
import { supabase, type Product } from "../lib/supabase";
import ProductCard from "../components/ProductCard";

const CATEGORIES = [
  { name: "Électronique", slug: "electronique" },
  { name: "Accessoires", slug: "accessoires" },
  { name: "Parfums", slug: "parfums" },
  { name: "Vêtements", slug: "vetements" },
  { name: "Livres", slug: "livres" },
  { name: "Beauté", slug: "beaute" },
  { name: "Autres", slug: "autres" },
];

export default function Marketplace() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categoryFilter = searchParams.get("category") || "";

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("products")
      .select(`
        *,
        category:categories(*),
        seller_profile:seller_profiles(*)
      `)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (categoryFilter) {
      const cat = CATEGORIES.find((c) => c.slug === categoryFilter);
      if (cat) {
        const { data: catData } = await supabase
          .from("categories")
          .select("id")
          .eq("slug", categoryFilter)
          .maybeSingle();
        if (catData) {
          query = query.eq("category_id", catData.id);
        }
      }
    }

    if (search.trim()) {
      query = query.ilike("title", `%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (error) {
      console.error("Erreur:", error.message);
      setProducts([]);
    } else {
      setProducts(data || []);
    }
    setLoading(false);
  }, [categoryFilter, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleCategoryChange = (slug: string) => {
    if (slug) {
      setSearchParams({ category: slug });
    } else {
      setSearchParams({});
    }
    setShowFilters(false);
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-800 text-white">
        <div className="container-max section-padding py-12">
          <h1 className="font-display font-bold text-3xl md:text-4xl">Marketplace</h1>
          <p className="mt-2 text-brand-100">
            Parcourez les annonces et contactez directement les vendeurs.
          </p>

          <div className="mt-6 relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un produit..."
              className="w-full rounded-xl border-0 bg-white pl-12 pr-4 py-3.5 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
        </div>
      </div>

      {/* Category bar */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-30">
        <div className="container-max section-padding py-3">
          <div className="flex items-center gap-2">
            <button
              className="md:hidden flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 bg-gray-50"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filtrer
            </button>
            <div className={`flex items-center gap-2 overflow-x-auto ${showFilters ? "flex-col w-full" : ""} md:flex`}>
              <button
                onClick={() => handleCategoryChange("")}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  !categoryFilter
                    ? "bg-brand-600 text-white"
                    : "bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                }`}
              >
                Tout
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.slug}
                  onClick={() => handleCategoryChange(cat.slug)}
                  className={`shrink-0 rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                    categoryFilter === cat.slug
                      ? "bg-brand-600 text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-brand-50 hover:text-brand-700"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Products grid */}
      <div className="container-max section-padding py-8">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <PackageX className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-display font-semibold text-lg text-gray-700">
              Aucun produit trouvé
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {search ? "Essayez un autre terme de recherche." : "Les annonces apparaîtront ici une fois publiées par les vendeurs."}
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6">
              {products.length} annonce{products.length > 1 ? "s" : ""}
              {categoryFilter && ` dans ${CATEGORIES.find((c) => c.slug === categoryFilter)?.name}`}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

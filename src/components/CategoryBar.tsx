import { Link } from "react-router-dom";
import {
  Smartphone, Watch, Sparkles, Shirt, Book, Heart, Package, type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Smartphone, Watch, Sparkles, Shirt, Book, Heart, Package,
};

export default function CategoryBar() {
  const categories = [
    { name: "Électronique", slug: "electronique", icon: "Smartphone" },
    { name: "Accessoires", slug: "accessoires", icon: "Watch" },
    { name: "Parfums", slug: "parfums", icon: "Sparkles" },
    { name: "Vêtements", slug: "vetements", icon: "Shirt" },
    { name: "Livres", slug: "livres", icon: "Book" },
    { name: "Beauté", slug: "beaute", icon: "Heart" },
    { name: "Autres", slug: "autres", icon: "Package" },
  ];

  return (
    <div className="bg-white border-b border-gray-100">
      <div className="container-max section-padding py-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          <Link
            to="/marketplace"
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-brand-700 bg-brand-50 border border-brand-100 transition-all hover:bg-brand-100"
          >
            <Package className="h-4 w-4" />
            Tout
          </Link>
          {categories.map((cat) => {
            const Icon = iconMap[cat.icon] || Package;
            return (
              <Link
                key={cat.slug}
                to={`/marketplace?category=${cat.slug}`}
                className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 bg-gray-50 border border-gray-100 transition-all hover:bg-brand-50 hover:text-brand-700 hover:border-brand-100"
              >
                <Icon className="h-4 w-4" />
                {cat.name}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

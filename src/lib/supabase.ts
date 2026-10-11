import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Variables d'environnement Supabase manquantes. Vérifiez le fichier .env."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type SellerProfile = {
  id: string;
  display_name: string;
  phone: string;
  whatsapp: string;
  bio: string;
  location: string;
  avatar_url: string;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
};

export type Product = {
  id: string;
  seller_id: string;
  category_id: string | null;
  title: string;
  description: string;
  price: number;
  currency: string;
  image_urls: string[];
  status: "active" | "sold" | "paused";
  created_at: string;
  updated_at: string;
  category?: Category | null;
  seller_profile?: SellerProfile | null;
};

export type MonetizationRequest = {
  id: string;
  user_id: string;
  platform: "tiktok" | "instagram";
  account_handle: string;
  request_type: "monetization" | "consultation" | "growth" | "other";
  follower_count: number;
  country: string;
  notes: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "completed";
  created_at: string;
  updated_at: string;
};

export const CATEGORIES = [
  { name: "Électronique", slug: "electronique", icon: "Smartphone" },
  { name: "Accessoires", slug: "accessoires", icon: "Watch" },
  { name: "Parfums", slug: "parfums", icon: "Sparkles" },
  { name: "Vêtements", slug: "vetements", icon: "Shirt" },
  { name: "Livres", slug: "livres", icon: "Book" },
  { name: "Beauté", slug: "beaute", icon: "Heart" },
  { name: "Autres", slug: "autres", icon: "Package" },
] as const;

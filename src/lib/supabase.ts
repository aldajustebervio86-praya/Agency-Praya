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
  stock: number | null;
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
  admin_notes: string;
  status: "pending" | "in_review" | "approved" | "rejected" | "completed";
  created_at: string;
  updated_at: string;
};

export type OrderStatus =
  | "pending_seller_confirmation"
  | "seller_confirmed"
  | "delivery_pending"
  | "delivery_proposed"
  | "delivery_accepted"
  | "delivery_refused"
  | "payment_pending"
  | "payment_verified"
  | "preparing"
  | "delivered"
  | "cancelled";

export type DeliveryStatus = "standard" | "remote_proposed" | "accepted" | "refused";

export type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  status: OrderStatus;
  delivery_fee: number;
  proposed_delivery_fee: number | null;
  delivery_explanation: string;
  delivery_address: string;
  delivery_status: DeliveryStatus;
  delivery_confirmed: boolean;
  delivery_confirmed_at: string | null;
  commission: number;
  payment_method: string;
  payment_verified: boolean;
  payment_verified_at: string | null;
  buyer_note: string;
  created_at: string;
  updated_at: string;
};

export type VendorPayout = {
  id: string;
  seller_id: string;
  amount: number;
  transaction_reference: string;
  status: "recorded" | "verified" | "cancelled";
  payout_date: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type AppSettings = {
  id: number;
  commission_rate: number;
  updated_at: string;
};

export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  title_snapshot: string;
  price_snapshot: number;
  quantity: number;
};

export type MessageTemplate = {
  id: string;
  name: string;
  type: "seller_confirmation" | "delivery_proposal";
  content: string;
  created_at: string;
  updated_at: string;
};

export type OrderMessage = {
  id: string;
  order_id: string;
  direction: "to_seller" | "to_buyer";
  template_id: string | null;
  content: string;
  response: string | null;
  status: "sent" | "pending_response" | "responded";
  sent_at: string;
  response_at: string | null;
};

export const DELIVERY_FEE = 250;

export const CATEGORIES = [
  { name: "Électronique", slug: "electronique", icon: "Smartphone" },
  { name: "Accessoires", slug: "accessoires", icon: "Watch" },
  { name: "Parfums", slug: "parfums", icon: "Sparkles" },
  { name: "Vêtements", slug: "vetements", icon: "Shirt" },
  { name: "Livres", slug: "livres", icon: "Book" },
  { name: "Beauté", slug: "beaute", icon: "Heart" },
  { name: "Autres", slug: "autres", icon: "Package" },
] as const;

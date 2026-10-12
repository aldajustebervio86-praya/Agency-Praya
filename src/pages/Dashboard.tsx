import { useState, useEffect } from "react";
import {
  Package, Plus, Pencil, Trash2, Loader2, ImageOff, X, Save,
  Phone, MessageCircle, User, Mail, TrendingUp, MapPin, Camera, ShoppingCart, Boxes, Upload, AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase, type Product, type Category } from "../lib/supabase";
import { formatPrice, formatDate, getStatusLabel, getStatusColor } from "../lib/constants";

type Tab = "products" | "profile" | "monetization" | "orders";

export default function Dashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [tab, setTab] = useState<Tab>("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  async function fetchProducts() {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("products")
      .select(`*, category:categories(*)`)
      .eq("seller_id", user.id)
      .order("created_at", { ascending: false });
    setProducts(data || []);
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("sort_order");
    setCategories(data || []);
  }

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [user]);

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette annonce ? Cette action est irréversible.")) return;
    await supabase.from("products").delete().eq("id", id);
    fetchProducts();
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: "products", label: "Mes annonces", icon: Package },
    { key: "orders", label: "Commandes", icon: ShoppingCart },
    { key: "profile", label: "Mon profil", icon: User },
    { key: "monetization", label: "Monétisation", icon: TrendingUp },
  ];

  return (
    <div className="animate-fade-in bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container-max section-padding py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Tableau de bord</h1>
            <p className="text-sm text-gray-500 mt-1">
              Bonjour {profile?.display_name || user?.email}
            </p>
          </div>
          {tab === "products" && (
            <button onClick={handleAdd} className="btn-primary">
              <Plus className="h-5 w-5" />
              Nouvelle annonce
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-white rounded-xl p-1 border border-gray-100 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all shrink-0 ${
                tab === t.key
                  ? "bg-brand-600 text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {tab === "products" && (
          <div>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
              </div>
            ) : products.length === 0 ? (
              <div className="card p-12 text-center">
                <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg text-gray-700">
                  Aucune annonce pour le moment
                </h3>
                <p className="text-sm text-gray-500 mt-1 mb-6">
                  Publiez votre première annonce pour commencer à vendre.
                </p>
                <button onClick={handleAdd} className="btn-primary">
                  <Plus className="h-5 w-5" />
                  Créer une annonce
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map((product) => (
                  <div key={product.id} className="card p-4 flex gap-4 items-center">
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
                      <p className="text-sm text-brand-700 font-medium">
                        {formatPrice(product.price, product.currency)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${getStatusColor(product.status)}`}>
                          {getStatusLabel(product.status)}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${
                          product.stock === null ? "bg-gray-50 text-gray-500 border-gray-200" : product.stock === 0 ? "bg-error-50 text-error-700 border-error-200" : "bg-success-50 text-success-700 border-success-200"
                        }`}>
                          <Boxes className="h-3 w-3" />
                          {product.stock === null ? "Stock illimité" : product.stock === 0 ? "Rupture" : `${product.stock} en stock`}
                        </span>
                        {product.category && (
                          <span className="text-xs text-gray-400">{product.category.name}</span>
                        )}
                        <span className="text-xs text-gray-400">{formatDate(product.created_at)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 transition-all"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50 transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "profile" && <ProfileTab profile={profile} refreshProfile={refreshProfile} />}

        {tab === "monetization" && <MonetizationTab />}

        {tab === "orders" && <OrdersTab />}
      </div>

      {/* Product form modal */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => { setShowForm(false); setEditingProduct(null); }}
          onSaved={() => { setShowForm(false); setEditingProduct(null); fetchProducts(); }}
        />
      )}
    </div>
  );
}

// --- Profile Tab ---

function ProfileTab({
  profile,
  refreshProfile,
}: {
  profile: { display_name: string; phone: string; whatsapp: string; bio: string; location: string; avatar_url: string } | null;
  refreshProfile: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [whatsapp, setWhatsapp] = useState(profile?.whatsapp || "");
  const [bio, setBio] = useState(profile?.bio || "");
  const [location, setLocation] = useState(profile?.location || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("seller_profiles")
      .upsert({
        id: user.id,
        display_name: displayName.trim(),
        phone: phone.trim(),
        whatsapp: whatsapp.trim(),
        bio: bio.trim(),
        location: location.trim(),
        avatar_url: avatarUrl.trim(),
        updated_at: new Date().toISOString(),
      });
    setSaving(false);
    if (error) {
      setError(error.message);
    } else {
      setSaved(true);
      await refreshProfile();
      setTimeout(() => setSaved(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSave} className="card p-6 max-w-2xl space-y-4">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-300">
              <Camera className="h-8 w-8" />
            </div>
          )}
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo de profil (URL)</label>
          <input
            type="url"
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            className="input-field"
            placeholder="https://exemple.com/photo.jpg"
          />
          <p className="text-xs text-gray-400 mt-1">Collez le lien direct d'une image.</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la boutique</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-field pl-11"
            placeholder="Votre nom ou nom de boutique"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Localisation</label>
        <div className="relative">
          <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="input-field pl-11"
            placeholder="ex: Port-au-Prince, Haïti"
          />
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Téléphone</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="input-field pl-11"
              placeholder="+509 ..."
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
          <div className="relative">
            <MessageCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="input-field pl-11"
              placeholder="50934652731"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description (optionnel)</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="input-field"
          placeholder="Présentez-vous en quelques mots..."
        />
      </div>

      {error && <p className="text-sm text-error-600">{error}</p>}
      {saved && <p className="text-sm text-success-600">Profil mis à jour avec succès.</p>}

      <button type="submit" disabled={saving} className="btn-primary">
        {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
        Enregistrer
      </button>

      <div className="pt-4 border-t border-gray-100">
        <p className="text-xs text-gray-400 flex items-center gap-1.5">
          <Mail className="h-3.5 w-3.5" />
          {user?.email}
        </p>
      </div>
    </form>
  );
}

// --- Monetization Tab (inline summary linking to full page) ---

import { Link } from "react-router-dom";

function MonetizationTab() {
  return (
    <div className="card p-8 text-center max-w-2xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 mx-auto mb-4">
        <TrendingUp className="h-7 w-7" />
      </div>
      <h3 className="font-display font-semibold text-lg text-gray-900">
        Monétisation de réseaux sociaux
      </h3>
      <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
        Gérez vos demandes de monétisation pour vos comptes TikTok et Instagram
        depuis l'espace dédié.
      </p>
      <Link to="/monetization" className="btn-primary mt-6">
        <TrendingUp className="h-5 w-5" />
        Accéder à l'espace monétisation
      </Link>
    </div>
  );
}

// --- Orders Tab (links to full orders page) ---

function OrdersTab() {
  return (
    <div className="card p-8 text-center max-w-2xl">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 text-brand-700 mx-auto mb-4">
        <ShoppingCart className="h-7 w-7" />
      </div>
      <h3 className="font-display font-semibold text-lg text-gray-900">
        Mes commandes
      </h3>
      <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
        Suivez vos commandes en tant qu'acheteur ou vendeur. La communication
        est gérée par l'administrateur.
      </p>
      <Link to="/orders" className="btn-primary mt-6">
        <ShoppingCart className="h-5 w-5" />
        Voir mes commandes
      </Link>
    </div>
  );
}

// --- Product Form Modal ---

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState(product?.title || "");
  const [description, setDescription] = useState(product?.description || "");
  const [price, setPrice] = useState(product?.price?.toString() || "");
  const [categoryId, setCategoryId] = useState(product?.category_id || "");
  const [status, setStatus] = useState<"active" | "sold" | "paused">(product?.status || "active");
  const [stock, setStock] = useState(product?.stock === null || product?.stock === undefined ? "" : product.stock.toString());
  const [imageUrls, setImageUrls] = useState<string[]>(product?.image_urls || []);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!user) return;

    setError(null);
    setUploading(true);

    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError(`Format non supporté: ${file.name}. Utilisez JPG, PNG ou WEBP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(`Fichier trop volumineux: ${file.name}. Maximum 5 MB.`);
        continue;
      }

      const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, file, { cacheControl: "3600", upsert: false });

      if (uploadError) {
        setError(`Échec du téléchargement de ${file.name}: ${uploadError.message}`);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(filePath);

      if (urlData.publicUrl) {
        setImageUrls((prev) => [...prev, urlData.publicUrl]);
      }
    }

    setUploading(false);
    e.target.value = "";
  };

  const handleRemoveImage = (url: string) => {
    setImageUrls(imageUrls.filter((u) => u !== url));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setError(null);

    if (title.trim().length < 3) {
      setError("Le titre doit contenir au moins 3 caractères.");
      return;
    }
    const priceNum = parseFloat(price);
    if (isNaN(priceNum) || priceNum < 0) {
      setError("Veuillez entrer un prix valide.");
      return;
    }

    setSaving(true);
    const stockNum = stock.trim() === "" ? null : parseInt(stock);
    if (stockNum !== null && (isNaN(stockNum) || stockNum < 0)) {
      setError("Veuillez entrer une quantité en stock valide.");
      return;
    }

    const payload = {
      seller_id: user.id,
      category_id: categoryId || null,
      title: title.trim(),
      description: description.trim(),
      price: priceNum,
      image_urls: imageUrls,
      stock: stockNum,
      status,
    };

    if (product) {
      const { error } = await supabase
        .from("products")
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq("id", product.id);
      if (error) setError(error.message);
    } else {
      const { error } = await supabase.from("products").insert(payload);
      if (error) setError(error.message);
    }

    setSaving(false);
    if (!error) onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-display font-bold text-lg text-gray-900">
            {product ? "Modifier l'annonce" : "Nouvelle annonce"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Titre *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field"
              placeholder="Nom du produit"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Prix (HTG) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input-field"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Catégorie</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="input-field"
              >
                <option value="">Sélectionner...</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="input-field"
              placeholder="Décrivez votre produit..."
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Stock</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                className="input-field"
                placeholder="Laisser vide = illimité"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Statut</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as "active" | "sold" | "paused")} className="input-field">
              <option value="active">Actif</option>
              <option value="paused">En pause</option>
              <option value="sold">Vendu</option>
            </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Photos du produit</label>
            <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-200 hover:border-brand-300 transition-colors py-8 px-4 cursor-pointer">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
              </div>
              <span className="text-sm text-gray-600 font-medium">
                {uploading ? "Téléchargement en cours..." : "Ajouter une photo"}
              </span>
              <span className="text-xs text-gray-400">JPG, PNG ou WEBP — 5 MB max par photo</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                onChange={handleFileSelect}
                disabled={uploading}
                className="hidden"
              />
            </label>
            {imageUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-3">
                {imageUrls.map((url) => (
                  <div key={url} className="relative group rounded-xl overflow-hidden bg-gray-100 aspect-square">
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(url)}
                      className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {error && (
              <p className="text-xs text-error-600 mt-2 flex items-center gap-1">
                <AlertCircle className="h-3.5 w-3.5" />
                {error}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving || uploading} className="btn-primary flex-1">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              {product ? "Mettre à jour" : "Publier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

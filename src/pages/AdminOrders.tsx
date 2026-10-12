import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Loader2, AlertCircle, Truck, MessageSquare, CheckCircle, XCircle,
  Pencil, Save, X, Phone, MapPin, User, Shield, Package, Clock, Wallet,
  DollarSign, Settings, Plus, Trash2, Info, CreditCard,
} from "lucide-react";
import { supabase, type Order, type OrderItem, type OrderMessage, type MessageTemplate, type VendorPayout, type AppSettings, type SellerProfile, DELIVERY_FEE } from "../lib/supabase";
import {
  formatPrice, formatDate, getStatusLabel, getStatusColor, getDeliveryStatusLabel,
} from "../lib/constants";

type OrderWithDetails = Order & {
  seller_profile?: { display_name: string; phone: string; whatsapp: string } | null;
  items?: OrderItem[];
  messages?: OrderMessage[];
};

type AdminTab = "orders" | "payouts" | "settings" | "moncash";

export default function AdminOrders() {
  const [tab, setTab] = useState<AdminTab>("orders");
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        seller_profile:seller_profiles(display_name, phone, whatsapp)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setOrders([]);
    } else {
      const ordersWithDetails = await Promise.all(
        (data || []).map(async (order: OrderWithDetails) => {
          const [itemsRes, messagesRes] = await Promise.all([
            supabase.from("order_items").select("*").eq("order_id", order.id),
            supabase.from("order_messages").select("*").eq("order_id", order.id).order("sent_at", { ascending: true }),
          ]);
          return { ...order, items: itemsRes.data || [], messages: messagesRes.data || [] };
        })
      );
      setOrders(ordersWithDetails);
    }
    setLoading(false);
  }, []);

  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from("message_templates").select("*").order("type");
    setTemplates(data || []);
  }, []);

  useEffect(() => {
    fetchOrders();
    fetchTemplates();
  }, [fetchOrders, fetchTemplates]);

  const refreshSelected = async () => {
    await fetchOrders();
    if (selectedOrder) {
      const updated = await loadOrderDetails(selectedOrder.id);
      setSelectedOrder(updated);
    }
  };

  const loadOrderDetails = async (orderId: string): Promise<OrderWithDetails | null> => {
    const { data } = await supabase
      .from("orders")
      .select(`*, seller_profile:seller_profiles(display_name, phone, whatsapp)`)
      .eq("id", orderId)
      .maybeSingle();
    if (!data) return null;
    const [itemsRes, messagesRes] = await Promise.all([
      supabase.from("order_items").select("*").eq("order_id", orderId),
      supabase.from("order_messages").select("*").eq("order_id", orderId).order("sent_at", { ascending: true }),
    ]);
    return { ...data, items: itemsRes.data || [], messages: messagesRes.data || [] };
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
      </div>
    );
  }

  const tabs: { key: AdminTab; label: string; icon: typeof Shield }[] = [
    { key: "orders", label: "Commandes", icon: ShoppingCart },
    { key: "payouts", label: "Versements", icon: DollarSign },
    { key: "settings", label: "Paramètres", icon: Settings },
    { key: "moncash", label: "MonCash", icon: CreditCard },
  ];

  return (
    <div className="animate-fade-in bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container-max section-padding py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Administration</h1>
            <p className="text-sm text-gray-500">Gérez les commandes, versements et paramètres</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-6 mt-6 bg-white rounded-xl p-1 border border-gray-100 overflow-x-auto">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all shrink-0 ${
                tab === t.key ? "bg-brand-600 text-white" : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <>
            <TemplateManager templates={templates} onRefresh={fetchTemplates} />

            <h2 className="font-display font-bold text-xl text-gray-900 mt-8 mb-4">Commandes</h2>
            {orders.length === 0 ? (
              <div className="card p-12 text-center">
                <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg text-gray-700">Aucune commande</h3>
                <p className="text-sm text-gray-500 mt-1">Les commandes apparaîtront ici une fois passées.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {orders.map(order => (
                  <OrderCard key={order.id} order={order} onClick={() => setSelectedOrder(order)} />
                ))}
              </div>
            )}
          </>
        )}

        {tab === "payouts" && <PayoutsTab />}
        {tab === "settings" && <SettingsTab />}
        {tab === "moncash" && <MonCashTab />}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          templates={templates}
          onClose={() => setSelectedOrder(null)}
          onRefresh={refreshSelected}
        />
      )}
    </div>
  );
}

// --- Template Manager ---

function TemplateManager({
  templates,
  onRefresh,
}: {
  templates: MessageTemplate[];
  onRefresh: () => Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleEdit = (t: MessageTemplate) => {
    setEditing(t.id);
    setEditContent(t.content);
  };

  const handleSave = async (id: string) => {
    setSaving(true);
    await supabase
      .from("message_templates")
      .update({ content: editContent, updated_at: new Date().toISOString() })
      .eq("id", id);
    setSaving(false);
    setEditing(null);
    await onRefresh();
  };

  return (
    <div className="card p-5">
      <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-brand-600" />
        Modèles de messages
      </h3>
      <div className="space-y-3">
        {templates.map(t => (
          <div key={t.id} className="rounded-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm text-gray-900">{t.name}</span>
                <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {t.type === "seller_confirmation" ? "Confirmation vendeur" : "Proposition livraison"}
                </span>
              </div>
              {editing === t.id ? (
                <div className="flex gap-2">
                  <button onClick={() => handleSave(t.id)} disabled={saving} className="p-1.5 rounded-lg text-success-600 hover:bg-success-50">
                    <Save className="h-4 w-4" />
                  </button>
                  <button onClick={() => setEditing(null)} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button onClick={() => handleEdit(t)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50">
                  <Pencil className="h-4 w-4" />
                </button>
              )}
            </div>
            {editing === t.id ? (
              <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} className="input-field text-sm" />
            ) : (
              <p className="text-sm text-gray-600">{t.content}</p>
            )}
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-gray-400">Aucun modèle.</p>
        )}
      </div>
    </div>
  );
}

// --- Order Card ---

function OrderCard({ order, onClick }: { order: OrderWithDetails; onClick: () => void }) {
  const itemsTotal = (order.items || []).reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0);
  const effectiveDelivery = order.delivery_status === "accepted" && order.proposed_delivery_fee
    ? order.proposed_delivery_fee : order.delivery_fee;
  const total = itemsTotal + effectiveDelivery;

  return (
    <button onClick={onClick} className="card p-5 text-left hover:border-brand-200 transition-all">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
            <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
            {order.delivery_confirmed && (
              <span className="inline-flex items-center gap-1 rounded-lg bg-success-50 border border-success-200 px-2 py-0.5 text-xs text-success-700">
                <CheckCircle className="h-3 w-3" /> Reçu
              </span>
            )}
          </div>
          <p className="font-medium text-gray-900 text-sm">
            {(order.items || []).map(i => i.title_snapshot).join(", ") || "Produit"}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>Vendeur: {order.seller_profile?.display_name || "—"}</span>
            <span>{formatDate(order.created_at)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p className="font-display font-bold text-brand-700">{formatPrice(total)}</p>
          <p className="text-xs text-gray-400 mt-1">Livraison: {formatPrice(effectiveDelivery)}</p>
        </div>
      </div>
    </button>
  );
}

// --- Order Detail Modal ---

function OrderDetailModal({
  order,
  templates,
  onClose,
  onRefresh,
}: {
  order: OrderWithDetails;
  templates: MessageTemplate[];
  onClose: () => void;
  onRefresh: () => Promise<void>;
}) {
  const [actionError, setActionError] = useState<string | null>(null);
  const [proposedFee, setProposedFee] = useState(order.proposed_delivery_fee?.toString() || "");
  const [deliveryExplanation, setDeliveryExplanation] = useState(order.delivery_explanation || "");
  const [commission, setCommission] = useState(order.commission?.toString() || "0");
  const [messageContent, setMessageContent] = useState("");
  const [messageDirection, setMessageDirection] = useState<"to_seller" | "to_buyer">("to_seller");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [responseText, setResponseText] = useState("");
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [acting, setActing] = useState(false);

  const itemsTotal = (order.items || []).reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0);
  const effectiveDelivery = order.delivery_status === "accepted" && order.proposed_delivery_fee
    ? order.proposed_delivery_fee : order.delivery_fee;
  const total = itemsTotal + effectiveDelivery + (order.commission || 0);

  const updateOrderStatus = async (newStatus: Order["status"], extra?: Partial<Order>) => {
    setActing(true);
    setActionError(null);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString(), ...extra })
      .eq("id", order.id);
    setActing(false);
    if (error) setActionError(error.message);
    else await onRefresh();
  };

  const handleProposeDelivery = async () => {
    const fee = parseFloat(proposedFee);
    if (isNaN(fee) || fee < 0) {
      setActionError("Veuillez entrer un tarif valide.");
      return;
    }
    setActing(true);
    setActionError(null);
    const { error } = await supabase
      .from("orders")
      .update({
        proposed_delivery_fee: fee,
        delivery_explanation: deliveryExplanation.trim(),
        delivery_status: "remote_proposed",
        status: "delivery_proposed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    setActing(false);
    if (error) setActionError(error.message);
    else await onRefresh();
  };

  const handleSaveCommission = async () => {
    const c = parseFloat(commission) || 0;
    setActing(true);
    const { error } = await supabase
      .from("orders")
      .update({ commission: c, updated_at: new Date().toISOString() })
      .eq("id", order.id);
    setActing(false);
    if (error) setActionError(error.message);
    else await onRefresh();
  };

  const handleVerifyPayment = async () => {
    setActing(true);
    const { error } = await supabase
      .from("orders")
      .update({
        payment_verified: true,
        payment_verified_at: new Date().toISOString(),
        status: "payment_verified",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    setActing(false);
    if (error) setActionError(error.message);
    else await onRefresh();
  };

  const handleAdminAcceptDelivery = async () => {
    setActing(true);
    setActionError(null);
    const { error } = await supabase
      .from("orders")
      .update({
        delivery_status: "accepted",
        status: "payment_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id);
    setActing(false);
    if (error) setActionError(error.message);
    else await onRefresh();
  };

  const handleSendMessage = async () => {
    if (messageContent.trim().length < 5) {
      setActionError("Le message doit contenir au moins 5 caractères.");
      return;
    }
    setActing(true);
    setActionError(null);
    const { error } = await supabase.from("order_messages").insert({
      order_id: order.id,
      direction: messageDirection,
      template_id: selectedTemplate || null,
      content: messageContent.trim(),
      status: "sent",
    });
    setActing(false);
    if (error) {
      setActionError(error.message);
    } else {
      setMessageContent("");
      setSelectedTemplate("");
      await onRefresh();
    }
  };

  const handleRecordResponse = async (msgId: string) => {
    if (responseText.trim().length < 1) return;
    setActing(true);
    const { error } = await supabase
      .from("order_messages")
      .update({
        response: responseText.trim(),
        status: "responded",
        response_at: new Date().toISOString(),
      })
      .eq("id", msgId);
    setActing(false);
    if (error) {
      setActionError(error.message);
    } else {
      setResponseText("");
      setRespondingTo(null);
      await onRefresh();
    }
  };

  const canConfirmSeller = order.status === "pending_seller_confirmation";
  const canProposeDelivery = order.status === "seller_confirmed" || order.status === "delivery_pending";
  const canAcceptDelivery = order.status === "delivery_proposed" && order.delivery_status === "remote_proposed";
  const canVerifyPayment = order.status === "payment_pending";
  const canPrepare = order.status === "payment_verified";
  const canDeliver = order.status === "preparing";
  const canCancel = !["delivered", "cancelled"].includes(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Commande #{order.id.slice(0, 8)}</h2>
            <span className={`inline-flex mt-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {actionError && (
            <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="font-display font-semibold text-sm text-gray-900 mb-2">Produits</h3>
            <div className="space-y-2">
              {(order.items || []).map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{item.title_snapshot}</p>
                    <p className="text-xs text-gray-400">Quantité: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {formatPrice(item.price_snapshot * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Delivery address */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" /> Adresse de livraison
            </p>
            <p className="text-sm text-gray-700">{order.delivery_address}</p>
            {order.buyer_note && (
              <p className="text-xs text-gray-400 mt-2">Note: {order.buyer_note}</p>
            )}
          </div>

          {/* Seller info */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> Vendeur
            </p>
            <p className="text-sm font-medium text-gray-900">{order.seller_profile?.display_name || "—"}</p>
            <div className="flex gap-3 mt-1 text-xs text-gray-500">
              {order.seller_profile?.phone && (
                <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{order.seller_profile.phone}</span>
              )}
              {order.seller_profile?.whatsapp && (
                <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" />{order.seller_profile.whatsapp}</span>
              )}
            </div>
          </div>

          {/* Pricing summary */}
          <div className="rounded-xl border border-gray-100 p-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Prix produit(s)</span>
              <span className="font-medium">{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Livraison ({getDeliveryStatusLabel(order.delivery_status)})</span>
              <span className="font-medium">{formatPrice(effectiveDelivery)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Commission</span>
              <span className="font-medium">{formatPrice(order.commission || 0)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between">
              <span className="font-display font-bold text-gray-900">Total</span>
              <span className="font-display font-bold text-brand-700">{formatPrice(total)}</span>
            </div>
          </div>

          {/* Action: Confirm seller availability */}
          {canConfirmSeller && (
            <div className="rounded-xl bg-warning-50 border border-warning-200 p-4">
              <p className="text-sm text-warning-800 mb-3">
                Demandez au vendeur de confirmer la disponibilité du produit, la quantité et le prix.
              </p>
              <button onClick={() => updateOrderStatus("seller_confirmed")} disabled={acting} className="btn-primary w-full">
                <CheckCircle className="h-4 w-4" />
                Marquer comme confirmé par le vendeur
              </button>
            </div>
          )}

          {/* Action: Propose adjusted delivery fee */}
          {canProposeDelivery && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 space-y-3">
              <p className="text-sm text-gray-600">
                Tarif standard: {formatPrice(DELIVERY_FEE)}. Proposez un tarif ajusté pour les zones éloignées.
              </p>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Nouveau tarif (HTG)</label>
                  <input type="number" min="0" step="0.01" value={proposedFee} onChange={e => setProposedFee(e.target.value)} className="input-field" placeholder="ex: 500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Explication</label>
                  <input type="text" value={deliveryExplanation} onChange={e => setDeliveryExplanation(e.target.value)} className="input-field" placeholder="Zone éloignée..." />
                </div>
              </div>
              <button onClick={handleProposeDelivery} disabled={acting} className="btn-primary w-full">
                <Truck className="h-4 w-4" />
                Proposer le tarif ajusté à l'acheteur
              </button>
            </div>
          )}

          {/* Delivery proposal info */}
          {order.delivery_status === "remote_proposed" && order.proposed_delivery_fee !== null && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4">
              <p className="text-sm text-gray-700">
                <Truck className="h-4 w-4 inline mr-1.5 text-brand-600" />
                Tarif ajusté proposé: <strong>{formatPrice(order.proposed_delivery_fee)}</strong>
                {" — "}tarif standard: {formatPrice(DELIVERY_FEE)}, différence: {formatPrice(order.proposed_delivery_fee - DELIVERY_FEE)}
              </p>
              {order.delivery_explanation && <p className="text-xs text-gray-500 mt-1">Raison: {order.delivery_explanation}</p>}
              <p className="text-xs text-gray-500 mt-2">En attente de réponse de l'acheteur.</p>
              {canAcceptDelivery && (
                <button onClick={handleAdminAcceptDelivery} disabled={acting} className="btn-primary w-full mt-3">
                  <CheckCircle className="h-4 w-4" />
                  Valider la livraison au nom de l'acheteur
                </button>
              )}
            </div>
          )}

          {/* Commission */}
          <div className="rounded-xl border border-gray-100 p-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Commission (HTG)</label>
            <div className="flex gap-2">
              <input type="number" min="0" step="0.01" value={commission} onChange={e => setCommission(e.target.value)} className="input-field flex-1" placeholder="0" />
              <button onClick={handleSaveCommission} disabled={acting} className="btn-secondary shrink-0">
                <Save className="h-4 w-4" /> Enregistrer
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Seul l'administrateur peut modifier la commission.</p>
          </div>

          {/* Payment verification */}
          {canVerifyPayment && (
            <div className="rounded-xl bg-warning-50 border border-warning-200 p-4">
              <p className="text-sm text-warning-800 mb-3 flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Mode de paiement: {order.payment_method}. Vérifiez le paiement avant de continuer.
              </p>
              <button onClick={handleVerifyPayment} disabled={acting} className="btn-primary w-full">
                <CheckCircle className="h-4 w-4" /> Vérifier le paiement
              </button>
            </div>
          )}

          {order.payment_verified && (
            <div className="rounded-xl bg-success-50 border border-success-200 p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <p className="text-sm text-success-700">
                Paiement vérifié {order.payment_verified_at && `le ${formatDate(order.payment_verified_at)}`}
              </p>
            </div>
          )}

          {/* Delivery confirmed info */}
          {order.delivery_confirmed && (
            <div className="rounded-xl bg-success-50 border border-success-200 p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <p className="text-sm text-success-700">
                Réception confirmée par l'acheteur{order.delivery_confirmed_at && ` le ${formatDate(order.delivery_confirmed_at)}`}
              </p>
            </div>
          )}

          {/* Status progression */}
          {canPrepare && (
            <button onClick={() => updateOrderStatus("preparing")} disabled={acting} className="btn-primary w-full">
              <Package className="h-4 w-4" /> Marquer en préparation
            </button>
          )}
          {canDeliver && (
            <button onClick={() => updateOrderStatus("delivered")} disabled={acting} className="btn-primary w-full">
              <Truck className="h-4 w-4" /> Marquer comme livré
            </button>
          )}
          {canCancel && (
            <button onClick={() => { if (confirm("Annuler cette commande ?")) updateOrderStatus("cancelled"); }} disabled={acting} className="btn-secondary w-full text-error-600 hover:bg-error-50">
              <XCircle className="h-4 w-4" /> Annuler la commande
            </button>
          )}

          {/* Messaging */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-display font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              Communication
            </h3>

            {(order.messages || []).length > 0 && (
              <div className="space-y-2 mb-4">
                {(order.messages || []).map(msg => (
                  <div key={msg.id} className="rounded-lg bg-gray-50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">
                        {msg.direction === "to_seller" ? "Au vendeur" : "À l'acheteur"}
                      </span>
                      <span className="text-xs text-gray-400">{formatDate(msg.sent_at)}</span>
                    </div>
                    <p className="text-sm text-gray-700">{msg.content}</p>
                    {msg.response && (
                      <div className="mt-2 rounded-lg bg-white border border-gray-100 p-2">
                        <p className="text-xs text-gray-400 mb-1">Réponse enregistrée:</p>
                        <p className="text-sm text-gray-600">{msg.response}</p>
                        {msg.response_at && <p className="text-xs text-gray-300 mt-1">{formatDate(msg.response_at)}</p>}
                      </div>
                    )}
                    {!msg.response && msg.status === "sent" && respondingTo !== msg.id && (
                      <button onClick={() => setRespondingTo(msg.id)} className="text-xs text-brand-600 hover:text-brand-700 mt-2">
                        Enregistrer une réponse
                      </button>
                    )}
                    {respondingTo === msg.id && (
                      <div className="mt-2 space-y-2">
                        <textarea value={responseText} onChange={e => setResponseText(e.target.value)} rows={2} className="input-field text-sm" placeholder="Réponse du destinataire..." />
                        <div className="flex gap-2">
                          <button onClick={() => handleRecordResponse(msg.id)} disabled={acting} className="btn-primary text-xs">Enregistrer</button>
                          <button onClick={() => setRespondingTo(null)} className="btn-secondary text-xs">Annuler</button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3">
              <div className="flex gap-2">
                <button type="button" onClick={() => setMessageDirection("to_seller")} className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${messageDirection === "to_seller" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}>
                  Au vendeur
                </button>
                <button type="button" onClick={() => setMessageDirection("to_buyer")} className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${messageDirection === "to_buyer" ? "border-brand-600 bg-brand-50 text-brand-700" : "border-gray-200 text-gray-600"}`}>
                  À l'acheteur
                </button>
              </div>

              <select value={selectedTemplate} onChange={e => { setSelectedTemplate(e.target.value); const tpl = templates.find(t => t.id === e.target.value); if (tpl) setMessageContent(tpl.content); }} className="input-field text-sm">
                <option value="">Utiliser un modèle...</option>
                {templates.filter(t => messageDirection === "to_seller" ? t.type === "seller_confirmation" : t.type === "delivery_proposal").map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>

              <textarea value={messageContent} onChange={e => setMessageContent(e.target.value)} rows={3} className="input-field text-sm" placeholder="Votre message..." />
              <button onClick={handleSendMessage} disabled={acting} className="btn-secondary w-full">
                <MessageSquare className="h-4 w-4" /> Enregistrer le message
              </button>
              <p className="text-xs text-gray-400">
                Le message est enregistré dans le suivi. Aucun envoi externe (WhatsApp/SMS) n'est effectué automatiquement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Payouts Tab ---

function PayoutsTab() {
  const [payouts, setPayouts] = useState<(VendorPayout & { seller_profile?: { display_name: string } | null })[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sellerId, setSellerId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [payoutDate, setPayoutDate] = useState(new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchPayouts = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("vendor_payouts")
      .select(`*, seller_profile:seller_profiles(display_name)`)
      .order("payout_date", { ascending: false });
    setPayouts(data || []);

    const { data: sellersData } = await supabase.from("seller_profiles").select("*").order("display_name");
    setSellers(sellersData || []);

    const { data: ordersData } = await supabase
      .from("orders")
      .select(`*, seller_profile:seller_profiles(display_name, phone, whatsapp)`)
      .in("status", ["payment_verified", "preparing", "delivered"])
      .order("created_at", { ascending: false });
    setOrders((ordersData as OrderWithDetails[]) || []);

    setLoading(false);
  }, []);

  useEffect(() => { fetchPayouts(); }, [fetchPayouts]);

  const handleSave = async () => {
    const amt = parseFloat(amount);
    if (!sellerId) { setError("Sélectionnez un vendeur."); return; }
    if (isNaN(amt) || amt < 0) { setError("Montant invalide."); return; }
    setSaving(true);
    setError(null);
    const { error } = await supabase.from("vendor_payouts").insert({
      seller_id: sellerId,
      amount: amt,
      transaction_reference: reference.trim(),
      payout_date: new Date(payoutDate).toISOString(),
      notes: notes.trim(),
      status: "recorded",
    });
    setSaving(false);
    if (error) { setError(error.message); return; }
    setShowForm(false);
    setSellerId(""); setAmount(""); setReference(""); setNotes("");
    await fetchPayouts();
  };

  const handleCancelPayout = async (id: string) => {
    if (!confirm("Annuler ce versement ?")) return;
    await supabase.from("vendor_payouts").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", id);
    await fetchPayouts();
  };

  // Calculate amounts due per seller
  const sellerBalances = sellers.map(s => {
    const sellerOrders = orders.filter(o => o.seller_id === s.id);
    const totalEarned = sellerOrders.reduce((sum, o) => {
      const items = (o.items || []).reduce((acc, i) => acc + i.price_snapshot * i.quantity, 0);
      return sum + items - (o.commission || 0);
    }, 0);
    const totalPaid = payouts.filter(p => p.seller_id === s.id && p.status !== "cancelled").reduce((sum, p) => sum + p.amount, 0);
    return { seller: s, earned: totalEarned, paid: totalPaid, due: totalEarned - totalPaid };
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-xl text-gray-900">Versements aux vendeurs</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          <Plus className="h-5 w-5" />
          Enregistrer un versement
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Seller balances */}
      <div className="card p-5">
        <h3 className="font-display font-semibold text-gray-900 mb-4">Montants dus par vendeur</h3>
        {sellerBalances.length === 0 ? (
          <p className="text-sm text-gray-400">Aucun vendeur pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {sellerBalances.map(({ seller, earned, paid, due }) => (
              <div key={seller.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                <div>
                  <p className="font-medium text-gray-900">{seller.display_name}</p>
                  <div className="flex gap-4 mt-1 text-xs text-gray-400">
                    <span>Gagné: {formatPrice(earned)}</span>
                    <span>Versé: {formatPrice(paid)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-400">Reste dû</p>
                  <p className={`font-display font-bold ${due > 0 ? "text-warning-700" : "text-success-700"}`}>
                    {formatPrice(due)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New payout form */}
      {showForm && (
        <div className="card p-6 space-y-4">
          <h3 className="font-display font-semibold text-gray-900">Nouveau versement</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Vendeur *</label>
              <select value={sellerId} onChange={e => setSellerId(e.target.value)} className="input-field">
                <option value="">Sélectionner...</option>
                {sellers.map(s => <option key={s.id} value={s.id}>{s.display_name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Montant (HTG) *</label>
              <input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} className="input-field" placeholder="0" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Référence de transaction *</label>
              <input type="text" value={reference} onChange={e => setReference(e.target.value)} className="input-field" placeholder="ex: MonCash #123456" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Date *</label>
              <input type="date" value={payoutDate} onChange={e => setPayoutDate(e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Notes (optionnel)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="input-field" placeholder="Précisions sur ce versement..." />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annuler</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Enregistrer
            </button>
          </div>
          <p className="text-xs text-warning-700 bg-warning-50 border border-warning-200 rounded-lg px-3 py-2">
            Le versement est enregistré manuellement. Il ne marque aucune commande comme payée automatiquement.
          </p>
        </div>
      )}

      {/* Payouts list */}
      <div>
        <h3 className="font-display font-semibold text-gray-900 mb-4">Historique des versements</h3>
        {payouts.length === 0 ? (
          <div className="card p-8 text-center">
            <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun versement enregistré.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {payouts.map(p => (
              <div key={p.id} className="card p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">{p.seller_profile?.display_name || "Vendeur"}</p>
                  <div className="flex gap-3 mt-1 text-xs text-gray-400">
                    <span>{formatPrice(p.amount)}</span>
                    <span>Réf: {p.transaction_reference || "—"}</span>
                    <span>{formatDate(p.payout_date)}</span>
                  </div>
                  {p.notes && <p className="text-xs text-gray-400 mt-1">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`rounded-lg border px-2 py-0.5 text-xs font-medium ${
                    p.status === "recorded" ? "bg-warning-50 text-warning-700 border-warning-200" :
                    p.status === "verified" ? "bg-success-50 text-success-700 border-success-200" :
                    "bg-error-50 text-error-700 border-error-200"
                  }`}>
                    {p.status === "recorded" ? "Enregistré" : p.status === "verified" ? "Vérifié" : "Annulé"}
                  </span>
                  {p.status === "recorded" && (
                    <button onClick={() => handleCancelPayout(p.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-error-600 hover:bg-error-50">
                      <XCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- Settings Tab ---

function SettingsTab() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from("app_settings").select("*").eq("id", 1).maybeSingle();
      if (error) setError(error.message);
      setSettings(data);
      setLoading(false);
    })();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("app_settings")
      .update({ commission_rate: settings.commission_rate, updated_at: new Date().toISOString() })
      .eq("id", 1);
    setSaving(false);
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 3000); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand-600" /></div>;

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="font-display font-bold text-xl text-gray-900">Paramètres</h2>

      <div className="card p-6 space-y-4">
        <h3 className="font-display font-semibold text-gray-900 flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand-600" />
          Taux de commission
        </h3>
        <p className="text-sm text-gray-500">
          Le taux de commission est appliqué sur le prix des produits (hors frais de livraison).
          Il est configurable uniquement par l'administrateur. Le taux par défaut est de 10%.
        </p>
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Taux (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={settings?.commission_rate ?? 10}
              onChange={e => setSettings(prev => prev ? { ...prev, commission_rate: parseFloat(e.target.value) || 0 } : prev)}
              className="input-field"
            />
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary shrink-0">
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            Enregistrer
          </button>
        </div>
        {error && <p className="text-sm text-error-600">{error}</p>}
        {saved && <p className="text-sm text-success-600">Taux de commission mis à jour.</p>}
        <p className="text-xs text-gray-400">
          Note: La commission est également modifiable individuellement sur chaque commande dans l'onglet Commandes.
          Ce taux sert de référence pour les nouvelles commandes.
        </p>
      </div>

      <div className="card p-6">
        <h3 className="font-display font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="h-5 w-5 text-brand-600" />
          Informations sur les calculs
        </h3>
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>Tarif de livraison standard:</strong> {formatPrice(DELIVERY_FEE)} (séparé du prix du produit)</p>
          <p><strong>Commission:</strong> Pourcentage configurable appliqué sur le prix des produits</p>
          <p><strong>Total commande:</strong> Prix produits + Frais livraison + Commission</p>
          <p><strong>Montant dû au vendeur:</strong> Prix produits - Commission</p>
        </div>
      </div>
    </div>
  );
}

// --- MonCash Tab ---

function MonCashTab() {
  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="font-display font-bold text-xl text-gray-900">MonCash Marchand</h2>

      <div className="card p-6 space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-100 text-warning-700">
            <CreditCard className="h-6 w-6" />
          </div>
          <div>
            <h3 className="font-display font-semibold text-gray-900">État de l'intégration</h3>
            <p className="text-sm text-warning-700">Non connecté — Configuration manuelle requise</p>
          </div>
        </div>

        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 text-sm text-gray-600 space-y-3">
          <p>
            MonCash n'est pas encore connecté à votre application. Aucune clé API n'a été inventée
            et aucune fausse intégration n'a été créée. Voici ce que vous devez faire pour activer
            les paiements MonCash:
          </p>

          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">1</span>
              <div>
                <p className="font-medium text-gray-900">Créer un compte marchand MonCash</p>
                <p className="text-gray-500">Contactez Digicel MonCash pour ouvrir un compte marchand. Vous recevrez un identifiant marchand et des clés API (client_id et client_secret).</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">2</span>
              <div>
                <p className="font-medium text-gray-900">Transmettre les clés en toute sécurité</p>
                <p className="text-gray-500">Une fois vos clés obtenues, communiquez-les via le système de secrets. Les clés ne doivent jamais être stockées dans le code ou le navigateur — elles seront placées côté serveur uniquement.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-white text-xs font-bold shrink-0">3</span>
              <div>
                <p className="font-medium text-gray-900">Configuration de l'intégration</p>
                <p className="text-gray-500">Une fonction côté serveur sera créée pour utiliser l'API MonCash (création de transaction, vérification de paiement). Aucune vraie transaction ne sera traitée pendant les tests.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-error-50 border border-error-200 p-4">
          <p className="text-sm text-error-800 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>
              En attendant, les paiements sont gérés manuellement: l'acheteur effectue un transfert MonCash
              au numéro <strong>+509 34652731</strong>, puis l'administrateur vérifie manuellement la réception
              dans l'espace Commandes. Aucun paiement n'est traité automatiquement.
            </span>
          </p>
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-display font-semibold text-gray-900 mb-3">Sécurité</h3>
        <ul className="text-sm text-gray-600 space-y-2">
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success-600 shrink-0 mt-0.5" /> Aucune clé API inventée ou stockée dans le code</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success-600 shrink-0 mt-0.5" /> Aucun secret exposé dans le navigateur</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success-600 shrink-0 mt-0.5" /> Aucune fausse intégration créée</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success-600 shrink-0 mt-0.5" /> Les paiements sont vérifiés manuellement par l'administrateur</li>
          <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 text-success-600 shrink-0 mt-0.5" /> Aucune transaction réelle pendant les tests</li>
        </ul>
      </div>
    </div>
  );
}

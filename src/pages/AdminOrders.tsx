import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Loader2, AlertCircle, Truck, MessageSquare, CheckCircle, XCircle,
  Pencil, Save, X, Phone, MapPin, User, Mail, Shield, Package, Clock, Wallet,
} from "lucide-react";
import { supabase, type Order, type OrderItem, type OrderMessage, type MessageTemplate, DELIVERY_FEE } from "../lib/supabase";
import {
  formatPrice, formatDate, getStatusLabel, getStatusColor, getDeliveryStatusLabel,
} from "../lib/constants";

type OrderWithDetails = Order & {
  seller_profile?: { display_name: string; phone: string; whatsapp: string } | null;
  buyer_email?: string;
  items?: OrderItem[];
  messages?: OrderMessage[];
};

export default function AdminOrders() {
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
          return {
            ...order,
            items: itemsRes.data || [],
            messages: messagesRes.data || [],
          };
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

  return (
    <div className="animate-fade-in bg-gray-50 min-h-[calc(100vh-4rem)]">
      <div className="container-max section-padding py-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-gray-900">Administration des commandes</h1>
            <p className="text-sm text-gray-500">Gérez les commandes, messages et livraisons</p>
          </div>
        </div>

        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Templates section */}
        <TemplateManager templates={templates} onRefresh={fetchTemplates} />

        {/* Orders list */}
        <h2 className="font-display font-bold text-xl text-gray-900 mt-8 mb-4">Commandes</h2>
        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-gray-700">Aucune commande</h3>
            <p className="text-sm text-gray-500 mt-1">Les commandes apparaîtront ici une fois passées.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                onClick={() => setSelectedOrder(order)}
              />
            ))}
          </div>
        )}
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
    <div className="card p-5 mt-6">
      <h3 className="font-display font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-brand-600" />
        Modèles de messages
      </h3>
      <div className="space-y-3">
        {templates.map((t) => (
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
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="input-field text-sm"
              />
            ) : (
              <p className="text-sm text-gray-600">{t.content}</p>
            )}
          </div>
        ))}
        {templates.length === 0 && (
          <p className="text-sm text-gray-400">Aucun modèle. Les modèles par défaut seront créés automatiquement.</p>
        )}
      </div>
    </div>
  );
}

// --- Order Card ---

function OrderCard({ order, onClick }: { order: OrderWithDetails; onClick: () => void }) {
  const itemsTotal = (order.items || []).reduce((sum, item) => sum + item.price_snapshot * item.quantity, 0);
  const effectiveDelivery = order.delivery_status === "accepted" && order.proposed_delivery_fee
    ? order.proposed_delivery_fee
    : order.delivery_fee;
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
    ? order.proposed_delivery_fee
    : order.delivery_fee;
  const total = itemsTotal + effectiveDelivery + (order.commission || 0);

  const updateOrderStatus = async (newStatus: Order["status"], extra?: Partial<Order>) => {
    setActing(true);
    setActionError(null);
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus, updated_at: new Date().toISOString(), ...extra })
      .eq("id", order.id);
    setActing(false);
    if (error) {
      setActionError(error.message);
    } else {
      await onRefresh();
    }
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
    if (error) {
      setActionError(error.message);
    } else {
      await onRefresh();
    }
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

  const sellerTemplate = templates.find(t => t.type === "seller_confirmation");
  const deliveryTemplate = templates.find(t => t.type === "delivery_proposal");

  const canConfirmSeller = order.status === "pending_seller_confirmation";
  const canProposeDelivery = order.status === "seller_confirmed" || order.status === "delivery_pending";
  const canVerifyPayment = order.status === "payment_pending";
  const canPrepare = order.status === "payment_verified";
  const canDeliver = order.status === "preparing";
  const canCancel = !["delivered", "cancelled"].includes(order.status);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
              {(order.items || []).map((item) => (
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
              <button
                onClick={() => updateOrderStatus("seller_confirmed")}
                disabled={acting}
                className="btn-primary w-full"
              >
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
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={proposedFee}
                    onChange={(e) => setProposedFee(e.target.value)}
                    className="input-field"
                    placeholder="ex: 500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Explication</label>
                  <input
                    type="text"
                    value={deliveryExplanation}
                    onChange={(e) => setDeliveryExplanation(e.target.value)}
                    className="input-field"
                    placeholder="Zone éloignée, difficulté d'accès..."
                  />
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
                {" — "}
                tarif standard: {formatPrice(DELIVERY_FEE)}, différence:{" "}
                {formatPrice(order.proposed_delivery_fee - DELIVERY_FEE)}
              </p>
              {order.delivery_explanation && (
                <p className="text-xs text-gray-500 mt-1">Raison: {order.delivery_explanation}</p>
              )}
              <p className="text-xs text-gray-500 mt-2">
                En attente de réponse de l'acheteur. Statut: {getDeliveryStatusLabel(order.delivery_status)}
              </p>
            </div>
          )}

          {/* Commission */}
          <div className="rounded-xl border border-gray-100 p-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Commission (HTG)</label>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="input-field flex-1"
                placeholder="0"
              />
              <button onClick={handleSaveCommission} disabled={acting} className="btn-secondary shrink-0">
                <Save className="h-4 w-4" />
                Enregistrer
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
                <CheckCircle className="h-4 w-4" />
                Vérifier le paiement
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

          {/* Status progression actions */}
          {canPrepare && (
            <button onClick={() => updateOrderStatus("preparing")} disabled={acting} className="btn-primary w-full">
              <Package className="h-4 w-4" />
              Marquer en préparation
            </button>
          )}
          {canDeliver && (
            <button onClick={() => updateOrderStatus("delivered")} disabled={acting} className="btn-primary w-full">
              <Truck className="h-4 w-4" />
              Marquer comme livré
            </button>
          )}
          {canCancel && (
            <button
              onClick={() => { if (confirm("Annuler cette commande ?")) updateOrderStatus("cancelled"); }}
              disabled={acting}
              className="btn-secondary w-full text-error-600 hover:bg-error-50"
            >
              <XCircle className="h-4 w-4" />
              Annuler la commande
            </button>
          )}

          {/* Messaging */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-display font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand-600" />
              Communication
            </h3>

            {/* Existing messages */}
            {(order.messages || []).length > 0 && (
              <div className="space-y-2 mb-4">
                {(order.messages || []).map((msg) => (
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
                        {msg.response_at && (
                          <p className="text-xs text-gray-300 mt-1">{formatDate(msg.response_at)}</p>
                        )}
                      </div>
                    )}
                    {!msg.response && msg.status === "sent" && respondingTo !== msg.id && (
                      <button
                        onClick={() => setRespondingTo(msg.id)}
                        className="text-xs text-brand-600 hover:text-brand-700 mt-2"
                      >
                        Enregistrer une réponse
                      </button>
                    )}
                    {respondingTo === msg.id && (
                      <div className="mt-2 space-y-2">
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          rows={2}
                          className="input-field text-sm"
                          placeholder="Réponse du destinataire..."
                        />
                        <div className="flex gap-2">
                          <button onClick={() => handleRecordResponse(msg.id)} disabled={acting} className="btn-primary text-xs">
                            Enregistrer
                          </button>
                          <button onClick={() => setRespondingTo(null)} className="btn-secondary text-xs">
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* New message form */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMessageDirection("to_seller")}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                    messageDirection === "to_seller"
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  Au vendeur
                </button>
                <button
                  type="button"
                  onClick={() => setMessageDirection("to_buyer")}
                  className={`flex-1 rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                    messageDirection === "to_buyer"
                      ? "border-brand-600 bg-brand-50 text-brand-700"
                      : "border-gray-200 text-gray-600"
                  }`}
                >
                  À l'acheteur
                </button>
              </div>

              <select
                value={selectedTemplate}
                onChange={(e) => {
                  setSelectedTemplate(e.target.value);
                  const tpl = templates.find(t => t.id === e.target.value);
                  if (tpl) setMessageContent(tpl.content);
                }}
                className="input-field text-sm"
              >
                <option value="">Utiliser un modèle...</option>
                {templates
                  .filter(t => messageDirection === "to_seller" ? t.type === "seller_confirmation" : t.type === "delivery_proposal")
                  .map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))
                }
              </select>

              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                rows={3}
                className="input-field text-sm"
                placeholder="Votre message..."
              />

              <button onClick={handleSendMessage} disabled={acting} className="btn-secondary w-full">
                <MessageSquare className="h-4 w-4" />
                Enregistrer le message
              </button>
              <p className="text-xs text-gray-400">
                Le message est enregistré dans le suivi. Aucun envoi externe n'est effectué automatiquement.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

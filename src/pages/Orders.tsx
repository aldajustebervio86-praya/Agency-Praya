import { useState, useEffect, useCallback } from "react";
import {
  ShoppingCart, Loader2, Truck, Package, CheckCircle, XCircle, MapPin, Clock,
  MessageSquare, AlertCircle, Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase, type Order, type OrderItem, type OrderMessage, DELIVERY_FEE } from "../lib/supabase";
import { formatPrice, formatDate, getStatusLabel, getStatusColor, getDeliveryStatusLabel } from "../lib/constants";

type OrderWithDetails = Order & {
  seller_profile?: { display_name: string } | null;
  items?: OrderItem[];
  messages?: OrderMessage[];
};

type Role = "buyer" | "seller";

export default function Orders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);
  const [acting, setActing] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select(`*, seller_profile:seller_profiles(display_name)`)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (data) {
      const ordersWithDetails = await Promise.all(
        data.map(async (order: OrderWithDetails) => {
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
  }, [user]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const refreshSelected = async () => {
    await fetchOrders();
    if (selectedOrder) {
      const { data } = await supabase
        .from("orders")
        .select(`*, seller_profile:seller_profiles(display_name)`)
        .eq("id", selectedOrder.id)
        .maybeSingle();
      if (data) {
        const [itemsRes, messagesRes] = await Promise.all([
          supabase.from("order_items").select("*").eq("order_id", data.id),
          supabase.from("order_messages").select("*").eq("order_id", data.id).order("sent_at", { ascending: true }),
        ]);
        setSelectedOrder({ ...data, items: itemsRes.data || [], messages: messagesRes.data || [] });
      }
    }
  };

  const handleAcceptDelivery = async () => {
    if (!selectedOrder) return;
    setActing(true);
    setActionError(null);
    const { error } = await supabase.rpc("buyer_accept_delivery", { p_order_id: selectedOrder.id });
    setActing(false);
    if (error) setActionError(error.message);
    else await refreshSelected();
  };

  const handleRefuseDelivery = async () => {
    if (!selectedOrder) return;
    setActing(true);
    setActionError(null);
    const { error } = await supabase.rpc("buyer_refuse_delivery", { p_order_id: selectedOrder.id });
    setActing(false);
    if (error) setActionError(error.message);
    else await refreshSelected();
  };

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;
    setActing(true);
    setActionError(null);
    const { error } = await supabase.rpc("buyer_confirm_delivery", { p_order_id: selectedOrder.id });
    setActing(false);
    if (error) setActionError(error.message);
    else await refreshSelected();
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
        <h1 className="font-display font-bold text-2xl text-gray-900 mb-2">Mes commandes</h1>
        <p className="text-sm text-gray-500 mb-6">
          Suivez vos commandes et les informations de livraison.
        </p>

        {orders.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingCart className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="font-display font-semibold text-lg text-gray-700">Aucune commande</h3>
            <p className="text-sm text-gray-500 mt-1">
              Vos commandes apparaîtront ici une fois passées.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => {
              const role: Role = user?.id === order.buyer_id ? "buyer" : "seller";
              const itemsTotal = (order.items || []).reduce((sum, i) => sum + i.price_snapshot * i.quantity, 0);
              const effectiveDelivery = order.delivery_status === "accepted" && order.proposed_delivery_fee
                ? order.proposed_delivery_fee : order.delivery_fee;
              const total = itemsTotal + effectiveDelivery + (order.commission || 0);
              return (
                <button
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="card p-5 text-left hover:border-brand-200 transition-all"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-xs text-gray-400">#{order.id.slice(0, 8)}</span>
                        <span className={`inline-flex rounded-lg border px-2 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                        <span className="rounded-lg bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                          {role === "buyer" ? "Acheteur" : "Vendeur"}
                        </span>
                        {order.delivery_confirmed && (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-success-50 border border-success-200 px-2 py-0.5 text-xs text-success-700">
                            <CheckCircle className="h-3 w-3" /> Reçu confirmé
                          </span>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 text-sm truncate">
                        {(order.items || []).map(i => i.title_snapshot).join(", ") || "Produit"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">{formatDate(order.created_at)}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-display font-bold text-brand-700">{formatPrice(total)}</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          role={user?.id === selectedOrder.buyer_id ? "buyer" : "seller"}
          onClose={() => { setSelectedOrder(null); setActionError(null); }}
          onRefresh={refreshSelected}
          acting={acting}
          setActing={setActing}
          actionError={actionError}
          setActionError={setActionError}
          onAcceptDelivery={handleAcceptDelivery}
          onRefuseDelivery={handleRefuseDelivery}
          onConfirmDelivery={handleConfirmDelivery}
        />
      )}
    </div>
  );
}

function OrderDetailModal({
  order,
  role,
  onClose,
  onRefresh,
  acting,
  actionError,
  onAcceptDelivery,
  onRefuseDelivery,
  onConfirmDelivery,
}: {
  order: OrderWithDetails;
  role: Role;
  onClose: () => void;
  onRefresh: () => Promise<void>;
  acting: boolean;
  setActing: (v: boolean) => void;
  actionError: string | null;
  setActionError: (v: string | null) => void;
  onAcceptDelivery: () => Promise<void>;
  onRefuseDelivery: () => Promise<void>;
  onConfirmDelivery: () => Promise<void>;
}) {
  const itemsTotal = (order.items || []).reduce((sum, i) => sum + i.price_snapshot * i.quantity, 0);
  const effectiveDelivery = order.delivery_status === "accepted" && order.proposed_delivery_fee
    ? order.proposed_delivery_fee : order.delivery_fee;
  const total = itemsTotal + effectiveDelivery + (order.commission || 0);

  const visibleMessages = (order.messages || []).filter(m =>
    role === "buyer" ? m.direction === "to_buyer" : m.direction === "to_seller"
  );

  const canAcceptRefuse = role === "buyer" && order.delivery_status === "remote_proposed";
  const canConfirmReceipt = role === "buyer" && order.status === "delivered" && !order.delivery_confirmed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="font-display font-bold text-lg text-gray-900">Commande #{order.id.slice(0, 8)}</h2>
            <span className={`inline-flex mt-1 rounded-lg border px-2 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
              {getStatusLabel(order.status)}
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100">
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
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
          {role === "buyer" && (
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Adresse de livraison
              </p>
              <p className="text-sm text-gray-700">{order.delivery_address}</p>
            </div>
          )}

          {/* Pricing */}
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

          {/* Remote delivery proposal */}
          {canAcceptRefuse && order.proposed_delivery_fee !== null && (
            <div className="rounded-xl bg-brand-50 border border-brand-100 p-4 space-y-3">
              <p className="text-sm text-gray-700 flex items-center gap-2">
                <Truck className="h-4 w-4 text-brand-600" />
                Proposition de livraison ajustée
              </p>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tarif standard</span>
                  <span>{formatPrice(DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nouveau tarif</span>
                  <span className="font-medium">{formatPrice(order.proposed_delivery_fee)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Différence</span>
                  <span>{formatPrice(order.proposed_delivery_fee - DELIVERY_FEE)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-gray-900">Nouveau total</span>
                  <span className="text-brand-700">
                    {formatPrice(itemsTotal + order.proposed_delivery_fee + (order.commission || 0))}
                  </span>
                </div>
              </div>
              {order.delivery_explanation && (
                <p className="text-xs text-gray-500 italic">Raison: {order.delivery_explanation}</p>
              )}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onAcceptDelivery}
                  disabled={acting}
                  className="btn-primary flex-1"
                >
                  <CheckCircle className="h-4 w-4" />
                  Accepter
                </button>
                <button
                  onClick={onRefuseDelivery}
                  disabled={acting}
                  className="btn-secondary flex-1 text-error-600 hover:bg-error-50"
                >
                  <XCircle className="h-4 w-4" />
                  Refuser
                </button>
              </div>
            </div>
          )}

          {/* Confirm receipt */}
          {canConfirmReceipt && (
            <div className="rounded-xl bg-success-50 border border-success-200 p-4">
              <p className="text-sm text-success-800 mb-3 flex items-center gap-2">
                <Package className="h-4 w-4" />
                Avez-vous bien reçu votre commande ?
              </p>
              <button onClick={onConfirmDelivery} disabled={acting} className="btn-primary w-full">
                <CheckCircle className="h-4 w-4" />
                Confirmer la réception
              </button>
            </div>
          )}

          {order.delivery_confirmed && (
            <div className="rounded-xl bg-success-50 border border-success-200 p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <p className="text-sm text-success-700">
                Réception confirmée{order.delivery_confirmed_at && ` le ${formatDate(order.delivery_confirmed_at)}`}
              </p>
            </div>
          )}

          {/* Payment info */}
          {order.status === "payment_pending" && role === "buyer" && (
            <div className="rounded-xl bg-warning-50 border border-warning-200 p-4">
              <p className="text-sm text-warning-800 flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4" />
                Paiement en attente
              </p>
              <p className="text-sm text-gray-600">
                Effectuez votre paiement par MonCash au numéro <strong>+509 34652731</strong>.
                Le paiement sera vérifié par l'administrateur avant la préparation de votre commande.
              </p>
            </div>
          )}

          {order.payment_verified && (
            <div className="rounded-xl bg-success-50 border border-success-200 p-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-success-600" />
              <p className="text-sm text-success-700">Paiement vérifié</p>
            </div>
          )}

          {/* Messages */}
          {visibleMessages.length > 0 && (
            <div className="border-t border-gray-100 pt-4">
              <h3 className="font-display font-semibold text-sm text-gray-900 mb-3 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-brand-600" />
                Messages
              </h3>
              <div className="space-y-2">
                {visibleMessages.map((msg) => (
                  <div key={msg.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(msg.sent_at)}
                    </p>
                    <p className="text-sm text-gray-700">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Status timeline */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-display font-semibold text-sm text-gray-900 mb-3">Suivi</h3>
            <OrderTimeline status={order.status} confirmed={order.delivery_confirmed} />
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderTimeline({ status, confirmed }: { status: Order["status"]; confirmed: boolean }) {
  const steps: { key: string; label: string; icon: typeof Package }[] = [
    { key: "pending_seller_confirmation", label: "Confirmation vendeur", icon: Package },
    { key: "seller_confirmed", label: "Vendeur confirmé", icon: CheckCircle },
    { key: "delivery_proposed", label: "Livraison proposée", icon: Truck },
    { key: "payment_pending", label: "Paiement en attente", icon: Wallet },
    { key: "payment_verified", label: "Paiement vérifié", icon: CheckCircle },
    { key: "preparing", label: "Préparation", icon: Package },
    { key: "delivered", label: "Livré", icon: Truck },
  ];

  const statusOrder = [
    "pending_seller_confirmation", "seller_confirmed", "delivery_proposed",
    "payment_pending", "payment_verified", "preparing", "delivered",
  ];
  const currentIdx = statusOrder.indexOf(status);
  const cancelled = status === "cancelled";
  const refused = status === "delivery_refused";

  if (cancelled) {
    return (
      <div className="flex items-center gap-2 text-sm text-error-600">
        <XCircle className="h-4 w-4" />
        Commande annulée
      </div>
    );
  }

  if (refused) {
    return (
      <div className="flex items-center gap-2 text-sm text-error-600">
        <XCircle className="h-4 w-4" />
        Livraison refusée — la commande est en attente de traitement par l'administrateur
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const done = i <= currentIdx;
        const current = i === currentIdx;
        return (
          <div key={step.key} className="flex items-center gap-3">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full shrink-0 ${
              done ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-400"
            }`}>
              <step.icon className="h-4 w-4" />
            </div>
            <span className={`text-sm ${done ? "text-gray-900 font-medium" : "text-gray-400"} ${current ? "text-brand-700" : ""}`}>
              {step.label}
              {step.key === "delivered" && confirmed && " — réception confirmée"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

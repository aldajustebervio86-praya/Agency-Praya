export const CONTACT = {
  email: "aldajustebervio86@gmail.com",
  phone: "+509 34652731",
  phoneDigits: "50934652731",
  whatsapp: "50934652731",
  instagram: "https://instagram.com/agencyprarya",
  tiktok: "https://tiktok.com/@praryaagency",
  facebook: "https://facebook.com/aldajustebervio86",
};

export function formatPrice(price: number, currency: string = "HTG"): string {
  const formatted = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
  return `${formatted} ${currency}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "En attente",
    in_review: "En cours de traitement",
    approved: "Approuvé",
    rejected: "Refusé",
    completed: "Terminé",
    active: "Actif",
    sold: "Vendu",
    paused: "En pause",
    pending_seller_confirmation: "En attente de confirmation vendeur",
    seller_confirmed: "Vendeur confirmé",
    delivery_pending: "Livraison en attente",
    delivery_proposed: "Livraison proposée",
    delivery_accepted: "Livraison acceptée",
    delivery_refused: "Livraison refusée",
    payment_pending: "Paiement en attente",
    payment_verified: "Paiement vérifié",
    preparing: "En préparation",
    delivered: "Livré",
    cancelled: "Annulé",
  };
  return labels[status] || status;
}

export function getRequestTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    monetization: "Monétisation",
    consultation: "Consultation",
    growth: "Croissance",
    other: "Autre",
  };
  return labels[type] || type;
}

export function getDeliveryStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    standard: "Livraison standard (250 HTG)",
    remote_proposed: "Tarif ajusté proposé",
    accepted: "Tarif ajusté accepté",
    refused: "Tarif ajusté refusé",
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-warning-100 text-warning-700 border-warning-200",
    in_review: "bg-brand-100 text-brand-700 border-brand-200",
    approved: "bg-success-100 text-success-700 border-success-200",
    rejected: "bg-error-100 text-error-700 border-error-200",
    completed: "bg-success-100 text-success-700 border-success-200",
    active: "bg-success-100 text-success-700 border-success-200",
    sold: "bg-gray-100 text-gray-600 border-gray-200",
    paused: "bg-warning-100 text-warning-700 border-warning-200",
    pending_seller_confirmation: "bg-warning-100 text-warning-700 border-warning-200",
    seller_confirmed: "bg-brand-100 text-brand-700 border-brand-200",
    delivery_pending: "bg-warning-100 text-warning-700 border-warning-200",
    delivery_proposed: "bg-brand-100 text-brand-700 border-brand-200",
    delivery_accepted: "bg-success-100 text-success-700 border-success-200",
    delivery_refused: "bg-error-100 text-error-700 border-error-200",
    payment_pending: "bg-warning-100 text-warning-700 border-warning-200",
    payment_verified: "bg-success-100 text-success-700 border-success-200",
    preparing: "bg-brand-100 text-brand-700 border-brand-200",
    delivered: "bg-success-100 text-success-700 border-success-200",
    cancelled: "bg-error-100 text-error-700 border-error-200",
  };
  return colors[status] || "bg-gray-100 text-gray-600 border-gray-200";
}

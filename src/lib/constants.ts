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
  };
  return colors[status] || "bg-gray-100 text-gray-600 border-gray-200";
}

import { useState } from "react";
import {
  Mail, Phone, Instagram, Facebook, MessageCircle, Send,
  Loader2, CheckCircle, AlertCircle, MapPin, Wallet,
} from "lucide-react";
import { CONTACT } from "../lib/constants";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Veuillez entrer votre nom.");
      return;
    }
    if (message.trim().length < 10) {
      setError("Votre message doit contenir au moins 10 caractères.");
      return;
    }

    setSending(true);
    // Simulate sending - in production this would use an edge function or email service
    const subject = encodeURIComponent(`Contact Agency Prarya — ${name}`);
    const body = encodeURIComponent(`Nom: ${name}\nE-mail: ${email}\n\n${message}`);
    window.location.href = `mailto:${CONTACT.email}?subject=${subject}&body=${body}`;
    setSending(false);
    setSent(true);
    setTimeout(() => setSent(false), 5000);
  };

  const contactCards = [
    {
      icon: Mail,
      label: "E-mail",
      value: CONTACT.email,
      href: `mailto:${CONTACT.email}`,
      color: "bg-brand-100 text-brand-700",
    },
    {
      icon: Phone,
      label: "Téléphone",
      value: CONTACT.phone,
      href: `tel:${CONTACT.phoneDigits}`,
      color: "bg-success-100 text-success-700",
    },
    {
      icon: MessageCircle,
      label: "WhatsApp",
      value: CONTACT.phone,
      href: `https://wa.me/${CONTACT.whatsapp}`,
      color: "bg-accent-100 text-accent-700",
    },
  ];

  const socialLinks = [
    { icon: Instagram, label: "Instagram", href: CONTACT.instagram, color: "hover:bg-pink-500" },
    { icon: MessageCircle, label: "TikTok", href: CONTACT.tiktok, color: "hover:bg-gray-800" },
    { icon: Facebook, label: "Facebook", href: CONTACT.facebook, color: "hover:bg-blue-600" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <div className="bg-gradient-to-br from-brand-900 to-brand-800 text-white">
        <div className="container-max section-padding py-12">
          <h1 className="font-display font-bold text-3xl md:text-4xl">Contact</h1>
          <p className="mt-2 text-brand-100">
            Une question, une demande de partenariat ? Écrivez-nous.
          </p>
        </div>
      </div>

      <div className="container-max section-padding py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact info */}
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-6">
              Coordonnées d'Agency Prarya
            </h2>

            <div className="space-y-4">
              {contactCards.map((card) => (
                <a
                  key={card.label}
                  href={card.href}
                  target={card.href.startsWith("http") ? "_blank" : undefined}
                  rel="noopener noreferrer"
                  className="card p-5 flex items-center gap-4 hover:border-brand-200"
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color}`}>
                    <card.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">{card.label}</p>
                    <p className="font-medium text-gray-900">{card.value}</p>
                  </div>
                </a>
              ))}
            </div>

            {/* Social links */}
            <h3 className="font-display font-semibold text-gray-900 mt-8 mb-4">Réseaux sociaux</h3>
            <div className="flex gap-3">
              {socialLinks.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 transition-all ${s.color} hover:text-white`}
                  aria-label={s.label}
                >
                  <s.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* MonCash payment info */}
            <div className="mt-8 rounded-2xl bg-accent-50 border border-accent-100 p-5">
              <div className="flex items-start gap-3">
                <Wallet className="h-5 w-5 text-accent-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-gray-900">Paiement par MonCash</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Pour vos paiements, utilisez MonCash au numéro <strong>{CONTACT.phone}</strong>.
                    Contactez-nous d'abord pour confirmer les modalités et le montant avant tout transfert.
                    Aucune information bancaire n'est demandée ni stockée.
                  </p>
                  <a
                    href={`https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent("Bonjour, je souhaite obtenir des informations sur le paiement par MonCash.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-secondary mt-3"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Nous contacter pour MonCash
                  </a>
                </div>
              </div>
            </div>

            {/* Notice */}
            <div className="mt-8 rounded-2xl bg-brand-50 border border-brand-100 p-5">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600">
                  Agency Prarya opère principalement en ligne. Les acheteurs contactent
                  directement les vendeurs via WhatsApp pour chaque annonce.
                </p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="font-display font-bold text-xl text-gray-900 mb-6">
              Envoyer un message
            </h2>

            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-error-50 border border-error-200 px-4 py-3 text-sm text-error-700">
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {sent && (
                <div className="flex items-start gap-2 rounded-xl bg-success-50 border border-success-200 px-4 py-3 text-sm text-success-700">
                  <CheckCircle className="h-5 w-5 shrink-0 mt-0.5" />
                  <span>Votre client de messagerie va s'ouvrir avec le message pré-rempli.</span>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Votre nom"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="votre@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                <textarea
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={5}
                  className="input-field"
                  placeholder="Votre message..."
                />
              </div>

              <button type="submit" disabled={sending} className="btn-primary w-full">
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

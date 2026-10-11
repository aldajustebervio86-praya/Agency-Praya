import { Link } from "react-router-dom";
import {
  Store, TrendingUp, ShoppingBag, Shield, Smartphone, Sparkles,
  ArrowRight, Mail, Phone, MessageCircle, Users, Package, Search,
} from "lucide-react";
import { CONTACT } from "../lib/constants";

export default function Home() {
  const features = [
    {
      icon: ShoppingBag,
      title: "Marketplace intégrée",
      desc: "Les vendeurs publient leurs produits en quelques clics. Les acheteurs parcourent par catégorie et contactent directement le vendeur via WhatsApp.",
    },
    {
      icon: TrendingUp,
      title: "Monétisation TikTok & Instagram",
      desc: "Soumettez une demande pour monétiser votre compte. Suivez le statut de votre demande en temps réel dans votre espace dédié.",
    },
    {
      icon: Shield,
      title: "Vos données sont protégées",
      desc: "Chaque vendeur gère uniquement ses propres annonces. Vos informations privées restent confidentielles et sécurisées.",
    },
  ];

  const categories = [
    { name: "Électronique", icon: Smartphone },
    { name: "Accessoires", icon: Package },
    { name: "Parfums", icon: Sparkles },
    { name: "Vêtements", icon: ShoppingBag },
    { name: "Livres", icon: Store },
    { name: "Beauté", icon: Users },
  ];

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800 text-white">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }} />
        <div className="container-max section-padding relative py-20 md:py-28">
          <div className="max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/10 backdrop-blur px-4 py-1.5 text-sm font-medium text-brand-100 border border-white/10">
              <Sparkles className="h-4 w-4" />
              Marketing Digital · Marketplace · Réseaux Sociaux
            </span>
            <h1 className="mt-6 font-display font-extrabold text-4xl md:text-6xl leading-tight">
              Agency Prarya
            </h1>
            <p className="mt-4 text-lg md:text-xl text-brand-100 leading-relaxed max-w-2xl">
              Votre plateforme tout-en-un pour vendre en ligne et développer
              votre présence sur TikTok et Instagram.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Link to="/marketplace" className="btn-accent">
                <Search className="h-5 w-5" />
                Explorer la marketplace
              </Link>
              <Link to="/register" className="btn-secondary bg-white/10 text-white border-white/20 hover:bg-white/20 hover:border-white/30">
                <Store className="h-5 w-5" />
                Devenir vendeur
              </Link>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent" />
      </section>

      {/* Features */}
      <section className="container-max section-padding py-16 md:py-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-gray-900">
            Une plateforme, trois services
          </h2>
          <p className="mt-4 text-gray-600 text-lg">
            Tout ce dont vous avez besoin pour vendre et grandir en ligne.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="card p-6 hover:border-brand-200">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="font-display font-semibold text-lg text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Categories preview */}
      <section className="bg-white border-y border-gray-100">
        <div className="container-max section-padding py-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900">
              Catégories
            </h2>
            <Link to="/marketplace" className="text-sm font-medium text-brand-600 hover:text-brand-700 flex items-center gap-1">
              Voir tout
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                to={`/marketplace?category=${cat.name.toLowerCase()}`}
                className="group flex flex-col items-center justify-center rounded-2xl bg-gray-50 border border-gray-100 p-6 transition-all hover:bg-brand-50 hover:border-brand-100"
              >
                <cat.icon className="h-8 w-8 text-gray-400 group-hover:text-brand-600 transition-colors" />
                <span className="mt-3 text-sm font-medium text-gray-700 group-hover:text-brand-700">
                  {cat.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Monetization CTA */}
      <section className="container-max section-padding py-16 md:py-24">
        <div className="rounded-3xl bg-gradient-to-br from-brand-700 to-brand-900 p-8 md:p-12 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="relative grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h2 className="font-display font-bold text-3xl mb-4">
                Monétisez vos comptes TikTok et Instagram
              </h2>
              <p className="text-brand-100 leading-relaxed mb-6">
                Soumettez votre demande en ligne et suivez son traitement
                dans votre espace dédié. Aucun mot de passe requis —
                nous ne demandons jamais vos identifiants.
              </p>
              <Link to="/monetization" className="btn-accent">
                <TrendingUp className="h-5 w-5" />
                Démarrer une demande
              </Link>
            </div>
            <div className="flex justify-center md:justify-end">
              <div className="flex gap-4">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                    <MessageCircle className="h-10 w-10 text-white" />
                  </div>
                  <span className="text-sm font-medium">TikTok</span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/10">
                    <Smartphone className="h-10 w-10 text-white" />
                  </div>
                  <span className="text-sm font-medium">Instagram</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact preview */}
      <section className="bg-white border-t border-gray-100">
        <div className="container-max section-padding py-16">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="font-display font-bold text-2xl md:text-3xl text-gray-900 mb-4">
              Une question ?
            </h2>
            <p className="text-gray-600 mb-8">
              Contactez-nous directement par e-mail, téléphone ou sur les réseaux sociaux.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href={`mailto:${CONTACT.email}`} className="btn-secondary">
                <Mail className="h-5 w-5" />
                {CONTACT.email}
              </a>
              <a href={`https://wa.me/${CONTACT.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btn-primary">
                <Phone className="h-5 w-5" />
                {CONTACT.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

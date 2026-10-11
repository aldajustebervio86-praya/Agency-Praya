import { Link } from "react-router-dom";
import { Mail, Phone, Instagram, Facebook, MessageCircle } from "lucide-react";
import { CONTACT } from "../lib/constants";

export default function Footer() {
  const socialLinks = [
    { href: CONTACT.instagram, icon: Instagram, label: "Instagram" },
    { href: CONTACT.tiktok, icon: MessageCircle, label: "TikTok" },
    { href: CONTACT.facebook, icon: Facebook, label: "Facebook" },
  ];

  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="container-max section-padding py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-display font-bold text-lg">
                P
              </div>
              <span className="font-display font-bold text-lg text-white">Agency Prarya</span>
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              Plateforme de marketing digital combinant une marketplace pour les vendeurs
              et un service de monétisation de comptes TikTok et Instagram.
            </p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4">Navigation</h3>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-brand-400 transition-colors">Accueil</Link></li>
              <li><Link to="/marketplace" className="hover:text-brand-400 transition-colors">Marketplace</Link></li>
              <li><Link to="/monetization" className="hover:text-brand-400 transition-colors">Monétisation</Link></li>
              <li><Link to="/contact" className="hover:text-brand-400 transition-colors">Contact</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`mailto:${CONTACT.email}`} className="flex items-center gap-2 hover:text-brand-400 transition-colors">
                  <Mail className="h-4 w-4" />
                  {CONTACT.email}
                </a>
              </li>
              <li>
                <a href={`tel:${CONTACT.phoneDigits}`} className="flex items-center gap-2 hover:text-brand-400 transition-colors">
                  <Phone className="h-4 w-4" />
                  {CONTACT.phone}
                </a>
              </li>
              <li className="flex items-center gap-3 pt-2">
                {socialLinks.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-800 hover:bg-brand-600 transition-colors"
                    aria-label={s.label}
                  >
                    <s.icon className="h-4 w-4" />
                  </a>
                ))}
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Agency Prarya. Tous droits réservés.
          </p>
          <p className="text-xs text-gray-500">
            Marketing Digital · Marketplace · Monétisation Sociale
          </p>
        </div>
      </div>
    </footer>
  );
}

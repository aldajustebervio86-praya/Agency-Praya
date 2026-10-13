import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Store, TrendingUp, LayoutDashboard, LogOut, User, ShoppingCart, Shield, Truck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setMobileOpen(false);
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Accueil" },
    { to: "/marketplace", label: "Marketplace" },
    { to: "/monetization", label: "Monétisation" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100">
      <nav className="container-max section-padding flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white font-display font-bold text-lg">
            P
          </div>
          <span className="font-display font-bold text-lg text-gray-900">Agency Prarya</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-brand-700 hover:bg-brand-50 transition-all"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              <Link to="/orders" className="btn-ghost">
                <ShoppingCart className="h-4 w-4" />
                Mes commandes
              </Link>
              {isAdmin && (
                <>
                  <Link to="/admin/orders" className="btn-ghost">
                    <Shield className="h-4 w-4" />
                    Commandes
                  </Link>
                  <Link to="/admin/products" className="btn-ghost">
                    <Shield className="h-4 w-4" />
                    Annonces
                  </Link>
                  <Link to="/admin/delivery-routes" className="btn-ghost">
                    <Truck className="h-4 w-4" />
                    Livraison
                  </Link>
                  <Link to="/admin/monetization" className="btn-ghost">
                    <TrendingUp className="h-4 w-4" />
                    Demandes
                  </Link>
                </>
              )}
              <Link to="/dashboard" className="btn-ghost">
                <LayoutDashboard className="h-4 w-4" />
                Tableau de bord
              </Link>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-700">
                  <User className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
                  {profile?.display_name || user.email}
                </span>
              </div>
              <button onClick={handleSignOut} className="btn-ghost text-error-600 hover:bg-error-50">
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-ghost">
                <Store className="h-4 w-4" />
                Espace vendeur
              </Link>
              <Link to="/register" className="btn-primary">
                S'inscrire
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="block px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50 hover:text-brand-700"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-gray-100">
              {user ? (
                <>
                  <Link
                    to="/orders"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Mes commandes
                  </Link>
                  {isAdmin && (
                    <>
                      <Link
                        to="/admin/orders"
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        Admin Commandes
                      </Link>
                      <Link
                        to="/admin/products"
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Shield className="h-4 w-4" />
                        Admin Annonces
                      </Link>
                      <Link
                        to="/admin/delivery-routes"
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        <Truck className="h-4 w-4" />
                        Admin Livraison
                      </Link>
                      <Link
                        to="/admin/monetization"
                        className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50"
                        onClick={() => setMobileOpen(false)}
                      >
                        <TrendingUp className="h-4 w-4" />
                        Admin Demandes
                      </Link>
                    </>
                  )}
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-brand-50"
                    onClick={() => setMobileOpen(false)}
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Tableau de bord
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 w-full px-4 py-3 rounded-lg text-sm font-medium text-error-600 hover:bg-error-50"
                  >
                    <LogOut className="h-4 w-4" />
                    Déconnexion
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="btn-secondary w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    <TrendingUp className="h-4 w-4" />
                    Espace vendeur
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary w-full"
                    onClick={() => setMobileOpen(false)}
                  >
                    S'inscrire
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

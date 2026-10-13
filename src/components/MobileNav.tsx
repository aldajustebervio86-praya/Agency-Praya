import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutGrid, MessageSquare, ShoppingCart, User } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function MobileNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    async function fetchUnread() {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user!.id)
        .eq("is_read", false);
      setUnreadCount(count || 0);
    }
    fetchUnread();
  }, [user, location.pathname]);

  const items = [
    { icon: Home, label: "Accueil", path: "/" },
    { icon: LayoutGrid, label: "Catégories", path: "/marketplace" },
    { icon: MessageSquare, label: "Messages", path: "/dashboard" },
    { icon: ShoppingCart, label: "Panier", path: "/orders" },
    { icon: User, label: "Mon compte", path: user ? "/dashboard" : "/login" },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-lg">
      <div className="flex items-center justify-around h-14">
        {items.map((item) => {
          const active = location.pathname === item.path;
          const showBadge = item.label === "Messages" && unreadCount > 0;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                active ? "text-brand-600" : "text-gray-400"
              }`}
            >
              <div className="relative">
                <item.icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-error-500 text-[8px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

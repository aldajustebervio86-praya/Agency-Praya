import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CategoryBar from "./components/CategoryBar";
import ProtectedRoute, { AdminRoute } from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Marketplace from "./pages/Marketplace";
import ProductDetail from "./pages/ProductDetail";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import Monetization from "./pages/Monetization";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import AdminOrders from "./pages/AdminOrders";
import AdminMonetization from "./pages/AdminMonetization";
import AdminProducts from "./pages/AdminProducts";
import AdminDeliveryRoutes from "./pages/AdminDeliveryRoutes";
import MobileNav from "./components/MobileNav";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <CategoryBar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/marketplace/product/:id" element={<ProductDetail />} />
          <Route path="/marketplace/:category/:id" element={<ProductDetail />} />
          <Route path="/checkout/:id" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <AdminRoute>
                <AdminOrders />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/monetization"
            element={
              <AdminRoute>
                <AdminMonetization />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <AdminRoute>
                <AdminProducts />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/delivery-routes"
            element={
              <AdminRoute>
                <AdminDeliveryRoutes />
              </AdminRoute>
            }
          />
          <Route path="/monetization" element={<Monetization />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </main>
      <Footer />
      <MobileNav />
      <div className="h-14 md:hidden" />
    </div>
  );
}

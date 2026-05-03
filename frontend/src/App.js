import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landingpage";
import ProductDescription from "./pages/ProductDescription";
import Products from "./pages/Products";
import Pricing from "./pages/Pricing";
import Profile from "./pages/Profile";
import Dashboard from "./pages/Dashboard";
import Settings from "./pages/Settings";
import Header from "./components/shared/Header";
import Sidebar from "./components/shared/Sidebar";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import "./app-layout.css"; // or wherever you put the CSS above

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/products"
          element={
            <div className="app-layout">
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((o) => !o)}
              />
              <div className={`app-main${sidebarOpen ? " sidebar-open" : ""}`}>
                <Header />
                <div className="app-content">
                  <Products />
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/app"
          element={
            <div className="app-layout">
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((o) => !o)}
              />
              <div className={`app-main${sidebarOpen ? " sidebar-open" : ""}`}>
                <Header />
                <div className="app-content">
                  <ProductDescription />
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/pricing"
          element={
            <div className="app-layout">
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((o) => !o)}
              />
              <div className={`app-main${sidebarOpen ? " sidebar-open" : ""}`}>
                <Header />
                <div className="app-content">
                  <Pricing />
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/profile"
          element={
            <div className="app-layout">
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((o) => !o)}
              />
              <div className={`app-main${sidebarOpen ? " sidebar-open" : ""}`}>
                <Header />
                <div className="app-content">
                  <Profile />
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/dashboard"
          element={
            <div className="app-layout">
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((o) => !o)}
              />
              <div className={`app-main${sidebarOpen ? " sidebar-open" : ""}`}>
                <Header />
                <div className="app-content">
                  <Dashboard />
                </div>
              </div>
            </div>
          }
        />
        <Route
          path="/settings"
          element={
            <div className="app-layout">
              <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen((o) => !o)}
              />
              <div className={`app-main${sidebarOpen ? " sidebar-open" : ""}`}>
                <Header />
                <div className="app-content">
                  <Settings />
                </div>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/Landingpage";
import ProductDescription from "./pages/ProductDescription";
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
        <Route path="/app" element={
          <div className="app-layout">
            <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} />
            <div className={`app-main${sidebarOpen ? " sidebar-open" : ""}`}>
              <Header />
              <div className="app-content">
                <ProductDescription />
              </div>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Package,
  Settings,
  Lock,
} from "lucide-react";
import { getPlanLimits } from "../utils/planLimits";
import "./Products.css";

/* ── API helpers ────────────────────────────────────── */
const api = {
  get: (url) => fetch(url, { credentials: "include" }).then((r) => r.json()),
  post: (url, b) =>
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  put: (url, b) =>
    fetch(url, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }).then((r) => r.json()),
  delete: (url) =>
    fetch(url, { method: "DELETE", credentials: "include" }).then((r) =>
      r.json(),
    ),
};

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    scenario_name: "",
  });

  // Scenario management state
  const [manageScenariosProduct, setManageScenariosProduct] = useState(null);
  const [scenarios, setScenarios] = useState([]);
  const [editingScenario, setEditingScenario] = useState(null);
  const [scenarioForm, setScenarioForm] = useState({ name: "" });
  const [deleteScenarioConfirm, setDeleteScenarioConfirm] = useState(null);
  const [limitError, setLimitError] = useState("");

  /* ── Load products ── */
  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/api/products/");
      if (!data.error) {
        setProducts(data);
        setFilteredProducts(data);
      }
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  /* ── Filter products ── */
  useEffect(() => {
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()),
    );
    setFilteredProducts(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchTerm, products]);

  /* ── Pagination ── */
  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / itemsPerPage),
  );
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedProducts = filteredProducts.slice(
    startIndex,
    startIndex + itemsPerPage,
  );
  const visibleStart = filteredProducts.length === 0 ? 0 : startIndex + 1;
  const visibleEnd = Math.min(
    filteredProducts.length,
    startIndex + itemsPerPage,
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  /* ── Handle create product ── */
  const handleCreateProduct = async () => {
    if (!newProduct.name.trim() || !newProduct.scenario_name.trim()) return;

    try {
      const result = await api.post("/api/products/", newProduct);
      if (result.error === "plan_limit") {
        setLimitError(result.detail);
        setShowCreateModal(false);
        return;
      }
      if (!result.error) {
        setProducts((prev) => [result, ...prev]);
        setShowCreateModal(false);
        setNewProduct({ name: "", description: "", scenario_name: "" });
        setLimitError("");
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
  };

  const openCreateModal = () => {
    const limits = getPlanLimits();
    if (products.length >= limits.maxProducts) {
      setLimitError(`Vous avez atteint la limite de ${limits.maxProducts} produits du plan Gratuit.`);
      return;
    }
    setLimitError("");
    setShowCreateModal(true);
  };

  /* ── Handle delete product ── */
  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;

    try {
      await api.delete(`/api/products/${deleteProduct.id}/`);
      setProducts((prev) => prev.filter((p) => p.id !== deleteProduct.id));
      setDeleteProduct(null);
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  /* ── Scenario management ── */
  const handleManageScenarios = async (product) => {
    setManageScenariosProduct(product);
    setEditingScenario(null);
    setScenarioForm({ name: "" });
    try {
      const data = await api.get(`/api/products/${product.id}/scenarios/`);
      if (!data.error) {
        setScenarios(data);
      }
    } catch (error) {
      console.error("Error loading scenarios:", error);
    }
  };

  const handleCreateScenario = async () => {
    if (!scenarioForm.name.trim() || !manageScenariosProduct) return;

    const limits = getPlanLimits();
    if (scenarios.length >= limits.maxScenariosPerProduct) {
      setLimitError(`Vous avez atteint la limite de ${limits.maxScenariosPerProduct} scénarios par produit du plan Gratuit.`);
      return;
    }

    try {
      const result = await api.post(
        `/api/products/${manageScenariosProduct.id}/scenarios/`,
        { name: scenarioForm.name },
      );
      if (result.error === "plan_limit") {
        setLimitError(result.detail);
        return;
      }
      if (!result.error) {
        setScenarios((prev) => [...prev, result]);
        setScenarioForm({ name: "" });
      }
    } catch (error) {
      console.error("Error creating scenario:", error);
    }
  };

  const handleEditScenario = (scenario) => {
    setEditingScenario(scenario);
    setScenarioForm({ name: scenario.name });
  };

  const handleUpdateScenario = async () => {
    if (!editingScenario || !scenarioForm.name.trim()) return;

    try {
      const result = await api.put(`/api/scenarios/${editingScenario.id}/`, {
        name: scenarioForm.name,
      });
      if (!result.error) {
        setScenarios((prev) =>
          prev.map((s) => (s.id === editingScenario.id ? result : s)),
        );
        setEditingScenario(null);
        setScenarioForm({ name: "" });
      }
    } catch (error) {
      console.error("Error updating scenario:", error);
    }
  };

  const handleSetDefaultScenario = async (scenario) => {
    if (!manageScenariosProduct) return;

    try {
      const result = await api.put(
        `/api/products/${manageScenariosProduct.id}/`,
        {
          default_scenario: scenario.id,
        },
      );
      if (!result.error) {
        // Update the product in the products list
        setProducts((prev) =>
          prev.map((p) => (p.id === manageScenariosProduct.id ? result : p)),
        );
        // Update the scenarios list to reflect the new default
        setScenarios((prev) =>
          prev.map((s) => ({
            ...s,
            is_default: s.id === scenario.id,
          })),
        );
        setManageScenariosProduct(result);
      }
    } catch (error) {
      console.error("Error setting default scenario:", error);
    }
  };

  const handleDeleteScenario = async (scenario) => {
    setDeleteScenarioConfirm(scenario);
  };

  const confirmDeleteScenario = async () => {
    if (!deleteScenarioConfirm) return;

    try {
      await api.delete(`/api/scenarios/${deleteScenarioConfirm.id}/`);
      setScenarios((prev) =>
        prev.filter((s) => s.id !== deleteScenarioConfirm.id),
      );
      setDeleteScenarioConfirm(null);
    } catch (error) {
      console.error("Error deleting scenario:", error);
    }
  };

  /* ── Navigate to product description ── */
  const handleEditProduct = (product) => {
    // Navigate to ProductDescription page with product context
    // Since ProductDescription manages its own state, we'll need to modify it later
    // For now, we'll navigate to /app and the component will handle selection
    navigate("/app", { state: { selectedProductId: product.id } });
  };

  if (loading) {
    return (
      <div className="products-loading">
        <div className="products-spinner"></div>
        <p>Chargement des produits...</p>
      </div>
    );
  }

  return (
    <div className="products-page">
      <div className="products-header">
        <div className="products-title">
          <Package size={24} />
          <h1>Gestion des Produits</h1>
        </div>
        <button
          className="products-create-btn"
          onClick={openCreateModal}
        >
          <Plus size={16} />
          Nouveau Produit
        </button>
      </div>

      {/* Plan limit banner */}
      {limitError && (
        <div className="products-limit-banner">
          <Lock size={15} />
          <span>{limitError}</span>
          <button className="products-limit-upgrade" onClick={() => navigate("/pricing")}>
            Passer au Pro →
          </button>
          <button className="products-limit-close" onClick={() => setLimitError("")}>×</button>
        </div>
      )}

      <div className="products-filters">
        <div className="products-search">
          <Search size={16} />
          <input
            type="text"
            placeholder="Rechercher par nom ou description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="products-count">
          {filteredProducts.length} produit
          {filteredProducts.length !== 1 ? "s" : ""}
          {searchTerm && ` (filtré sur "${searchTerm}")`}
        </div>
      </div>

      <div className="products-table-container">
        <table className="products-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Scénario par défaut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.length === 0 ? (
              <tr>
                <td colSpan="4" className="products-empty">
                  {searchTerm
                    ? "Aucun produit trouvé pour cette recherche."
                    : "Aucun produit créé."}
                </td>
              </tr>
            ) : (
              paginatedProducts.map((product) => (
                <tr key={product.id}>
                  <td className="products-name">
                    <div className="product-name-cell">
                      <Package size={16} />
                      <span>{product.name}</span>
                    </div>
                  </td>
                  <td className="products-description">
                    {product.description || (
                      <em className="products-no-description">
                        Aucune description
                      </em>
                    )}
                  </td>
                  <td className="products-scenario">
                    {product.default_scenario_name ? (
                      <div className="scenario-cell">
                        <Settings size={14} />
                        <span>{product.default_scenario_name}</span>
                      </div>
                    ) : (
                      <em className="products-no-scenario">Aucun scénario</em>
                    )}
                  </td>
                  <td className="products-actions">
                    <button
                      className="products-action-btn scenarios"
                      onClick={() => handleManageScenarios(product)}
                      title="Gérer les scénarios"
                    >
                      <Settings size={14} />
                    </button>
                    <button
                      className="products-action-btn edit"
                      onClick={() => handleEditProduct(product)}
                      title="Modifier le produit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      className="products-action-btn delete"
                      onClick={() => setDeleteProduct(product)}
                      title="Supprimer le produit"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="products-pagination">
          <div className="products-pagination-summary">
            Affichage {visibleStart} - {visibleEnd} sur{" "}
            {filteredProducts.length} produit
            {filteredProducts.length !== 1 ? "s" : ""}
          </div>

          <div className="products-pagination-controls">
            <button
              className="products-page-btn"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={16} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => (
              <button
                key={index}
                className={`products-page-number ${currentPage === index + 1 ? "active" : ""}`}
                onClick={() => setCurrentPage(index + 1)}
              >
                {index + 1}
              </button>
            ))}

            <button
              className="products-page-btn"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="products-pagination-size">
            <label htmlFor="items-per-page">Afficher</label>
            <select
              id="items-per-page"
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
            >
              {[5, 10, 20, 50].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>par page</span>
          </div>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div
          className="products-modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="products-modal" onClick={(e) => e.stopPropagation()}>
            <div className="products-modal-header">
              <h2>Créer un nouveau produit</h2>
              <button
                className="products-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <div className="products-modal-body">
              <div className="products-form-group">
                <label htmlFor="product-name">Nom du produit *</label>
                <input
                  id="product-name"
                  type="text"
                  value={newProduct.name}
                  onChange={(e) =>
                    setNewProduct((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Entrez le nom du produit"
                />
              </div>
              <div className="products-form-group">
                <label htmlFor="product-description">Description</label>
                <textarea
                  id="product-description"
                  value={newProduct.description}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Entrez une description (optionnel)"
                  rows={3}
                />
              </div>
              <div className="products-form-group">
                <label htmlFor="scenario-name">
                  Nom du scénario par défaut *
                </label>
                <input
                  id="scenario-name"
                  type="text"
                  value={newProduct.scenario_name}
                  onChange={(e) =>
                    setNewProduct((prev) => ({
                      ...prev,
                      scenario_name: e.target.value,
                    }))
                  }
                  placeholder="Entrez le nom du scénario initial"
                />
              </div>
            </div>
            <div className="products-modal-footer">
              <button
                className="products-modal-btn cancel"
                onClick={() => setShowCreateModal(false)}
              >
                Annuler
              </button>
              <button
                className="products-modal-btn create"
                onClick={handleCreateProduct}
                disabled={
                  !newProduct.name.trim() || !newProduct.scenario_name.trim()
                }
              >
                Créer le produit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteProduct && (
        <div
          className="products-modal-overlay"
          onClick={() => setDeleteProduct(null)}
        >
          <div className="products-modal" onClick={(e) => e.stopPropagation()}>
            <div className="products-modal-header">
              <h2>Confirmer la suppression</h2>
              <button
                className="products-modal-close"
                onClick={() => setDeleteProduct(null)}
              >
                ×
              </button>
            </div>
            <div className="products-modal-body">
              <p>
                Êtes-vous sûr de vouloir supprimer le produit{" "}
                <strong>"{deleteProduct.name}"</strong> ?
              </p>
              <p className="products-delete-warning">
                Cette action est irréversible et supprimera également tous les
                scénarios associés.
              </p>
            </div>
            <div className="products-modal-footer">
              <button
                className="products-modal-btn cancel"
                onClick={() => setDeleteProduct(null)}
              >
                Annuler
              </button>
              <button
                className="products-modal-btn delete"
                onClick={handleDeleteProduct}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Delete Confirmation Modal */}
      {deleteScenarioConfirm && (
        <div
          className="products-modal-overlay products-modal-overlay-top"
          onClick={() => setDeleteScenarioConfirm(null)}
        >
          <div
            className="products-modal products-modal-top"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="products-modal-header">
              <h2>Confirmer la suppression</h2>
              <button
                className="products-modal-close"
                onClick={() => setDeleteScenarioConfirm(null)}
              >
                ×
              </button>
            </div>
            <div className="products-modal-body">
              <p>
                Êtes-vous sûr de vouloir supprimer le scénario{" "}
                <strong>"{deleteScenarioConfirm.name}"</strong> ?
              </p>
              <p className="products-delete-warning">
                Cette action est irréversible et supprimera toutes les données
                associées à ce scénario.
              </p>
            </div>
            <div className="products-modal-footer">
              <button
                className="products-modal-btn cancel"
                onClick={() => setDeleteScenarioConfirm(null)}
              >
                Annuler
              </button>
              <button
                className="products-modal-btn delete"
                onClick={confirmDeleteScenario}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scenario Management Modal */}
      {manageScenariosProduct && (
        <div
          className="products-modal-overlay"
          onClick={() => {
            setManageScenariosProduct(null);
            setScenarios([]);
            setEditingScenario(null);
            setScenarioForm({ name: "" });
          }}
        >
          <div className="products-modal" onClick={(e) => e.stopPropagation()}>
            <div className="products-modal-header">
              <h2>Scénarios de "{manageScenariosProduct.name}"</h2>
              <button
                className="products-modal-close"
                onClick={() => {
                  setManageScenariosProduct(null);
                  setScenarios([]);
                  setEditingScenario(null);
                  setScenarioForm({ name: "" });
                }}
              >
                ×
              </button>
            </div>
            <div className="products-modal-body">
              {/* Create new scenario */}
              <div className="products-form-group">
                <label htmlFor="new-scenario-name">Nouveau scénario</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    id="new-scenario-name"
                    type="text"
                    value={scenarioForm.name}
                    onChange={(e) =>
                      setScenarioForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Nom du scénario"
                    style={{ flex: 1 }}
                  />
                  <button
                    className="products-modal-btn create"
                    onClick={
                      editingScenario
                        ? handleUpdateScenario
                        : handleCreateScenario
                    }
                    disabled={!scenarioForm.name.trim()}
                    style={{ padding: "8px 16px", fontSize: "14px" }}
                  >
                    {editingScenario ? "Modifier" : "Créer"}
                  </button>
                  {editingScenario && (
                    <button
                      className="products-modal-btn cancel"
                      onClick={() => {
                        setEditingScenario(null);
                        setScenarioForm({ name: "" });
                      }}
                      style={{ padding: "8px 16px", fontSize: "14px" }}
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </div>

              {/* Scenarios list */}
              <div className="scenarios-list">
                {scenarios.map((scenario) => (
                  <div
                    key={scenario.id}
                    className={`scenario-item ${scenario.is_default ? "default" : ""}`}
                  >
                    <div className="scenario-info">
                      <span className="scenario-name">{scenario.name}</span>
                      {scenario.is_default && (
                        <span className="scenario-badge">Par défaut</span>
                      )}
                    </div>
                    <div className="scenario-actions">
                      {!scenario.is_default && (
                        <button
                          className="scenario-action-btn set-default"
                          onClick={() => handleSetDefaultScenario(scenario)}
                          title="Définir comme scénario par défaut"
                        >
                          Défaut
                        </button>
                      )}
                      <button
                        className="scenario-action-btn edit"
                        onClick={() => handleEditScenario(scenario)}
                        title="Renommer le scénario"
                      >
                        Modifier
                      </button>
                      {!scenario.is_default && (
                        <button
                          className="scenario-action-btn delete"
                          onClick={() => handleDeleteScenario(scenario)}
                          title="Supprimer le scénario"
                        >
                          Supprimer
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {scenarios.length === 0 && (
                  <p
                    style={{
                      textAlign: "center",
                      color: "#636e72",
                      padding: "20px",
                    }}
                  >
                    Aucun scénario créé pour ce produit.
                  </p>
                )}
              </div>
            </div>
            <div className="products-modal-footer">
              <button
                className="products-modal-btn cancel"
                onClick={() => {
                  setManageScenariosProduct(null);
                  setScenarios([]);
                  setEditingScenario(null);
                  setScenarioForm({ name: "" });
                }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

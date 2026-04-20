# 🌱 EcoDesign — Outil d'Analyse du Cycle de Vie (ACV)

EcoDesign is a web application that helps industrial design teams measure, understand, and reduce the environmental impact of their products using **Life Cycle Assessment (LCA)**.

Built with **Django REST** (backend) + **React** (frontend), powered by the **Idemat 2026** database.

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Database Seeding](#database-seeding)
- [Environment Variables](#environment-variables)
- [API Endpoints](#api-endpoints)
- [Contributing](#contributing)

---

## ✨ Features

- 🔐 **Authentication** — Register, login, logout with session-based auth
- 📦 **Product Management** — Full CRUD for products
- 🗂 **Scenario Management** — Multiple LCA scenarios per product (create, switch, delete); results persist between sessions
- 🌿 **Materials, Energy, Transport** — Dynamic dropdowns fed from the Idemat 2026 database (2,300+ entries)
- ⚡ **Impact Calculation** — Eco-cost (€) and carbon footprint (kg CO₂) calculated on demand
- 📊 **Results Visualization** — Donut chart showing impact breakdown per category
- 📈 **Scenario Comparison** — Side-by-side bar charts and stacked phase breakdown across all calculated scenarios for a product
- 🤖 **ML Recommendations** — K-Nearest Neighbours engine (scikit-learn) that suggests Pareto-better alternatives per phase with natural-language advice in French
- 🧭 **ISO 14040 / 14044** compatible methodology

---

## 🛠 Tech Stack

| Layer          | Technology                                      |
|----------------|-------------------------------------------------|
| Frontend       | React 19, React Router, CSS Modules, Lucide React |
| Backend        | Django 5, Django REST Framework                 |
| Database       | PostgreSQL (via pgAdmin)                        |
| LCA Data       | Idemat 2026 (Excel → seeded to DB)              |
| Auth           | Django Sessions + CORS                          |
| ML / Data      | scikit-learn 1.8, NumPy 2.x                     |

---

## 📁 Project Structure

```
EcoDesign/
├── config/                        # Django project
│   ├── api/                       # Main Django app
│   │   ├── models.py              # All data models
│   │   ├── views.py               # API views
│   │   ├── urls.py                # API routes
│   │   ├── seed_idemat.py         # DB seeding script
│   │   ├── ml/                    # ← ML recommendation module
│   │   │   ├── __init__.py
│   │   │   └── recommender.py     # KNN engine + conseil generator
│   │   └── migrations/
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── idemat.xlsx                # Idemat 2026 source file
│   └── manage.py
├── frontend/                      # React project
│   ├── public/
│   │   ├── index.html
│   │   └── Logo.png
│   └── src/
│       ├── components/
│       │   └── shared/
│       │       ├── Header.jsx / Header.css
│       │       └── Sidebar.jsx / Sidebar.css
│       ├── pages/
│       │   ├── LandingPage/
│       │   ├── Login/
│       │   ├── Signup/
│       │   └── ProductDescription/
│       ├── App.js
│       └── App.css
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL
- pgAdmin (optional, for DB visualization)

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/EcoDesign.git
cd EcoDesign
```

**2. Create and activate virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install django djangorestframework psycopg2-binary django-cors-headers pandas openpyxl scikit-learn numpy python-dotenv
```

> **ML module requirements:** `scikit-learn` and `numpy` are required for the recommendation engine (`api/ml/recommender.py`). Without them the rest of the app works normally, but the `GET /api/scenarios/<id>/recommendations/` endpoint will return a 500 error.

**4. Configure the database**

Create a PostgreSQL database in pgAdmin (name it `ecodesign`), then create your local environment file:

```bash
cd config
cp .env.example .env
```

Open `config/.env` and fill in **your own** credentials:

```env
SECRET_KEY=django-insecure-*hez$*orlnfxw3%pk+hb@+n(7tw8r9jr4cwli$(31vi3ss3^$l

DB_NAME=ecodesign
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_HOST=localhost
DB_PORT=5432
```

> ⚠️ `.env` is listed in `.gitignore` and is **never committed**. Each developer keeps their own local copy with their own password. `settings.py` reads these values automatically via `python-dotenv`.

**5. Run migrations**
```bash
cd config
python manage.py migrate
```

**6. Seed the Idemat database**

Place `idemat.xlsx` in the `config/` folder, then run:
```bash
python manage.py shell -c "exec(open('api/seed_idemat.py').read())"
```

**7. Start the backend server**
```bash
python manage.py runserver
```

Backend runs at → `http://localhost:8000`

---

### Frontend Setup

**1. Navigate to the frontend folder**
```bash
cd frontend
```

**2. Install dependencies**
```bash
npm install
```

> `lucide-react` is included in `package.json` and installed automatically. It provides the SVG icon set used throughout the UI (phase icons, action buttons, etc.).

**3. Start the React development server**
```bash
npm start
```

Frontend runs at → `http://localhost:3000`

---

## 🌱 Database Seeding

The `seed_idemat.py` script reads the **Idemat 2026** Excel file and populates 5 tables:

| Model       | Category in Idemat         | Count    |
|-------------|----------------------------|----------|
| Material    | Materials, Food, etc.      | ~1,850   |
| Energy      | Energy, electricity, heat  | ~198     |
| Transport   | Transport (all modes)      | ~87      |
| Production  | Processing                 | ~134     |
| EndOfLife   | Waste treatment            | ~119     |

Each record stores: `name`, `short_name`, `subtype`, `eco_cost` (€/unit), `carbon_kg` (kgCO₂/unit), `unit`.

---

## 🔐 Environment Variables

For production, create a `.env` file in `config/`:

```env
SECRET_KEY=your_django_secret_key
DEBUG=False
DATABASE_NAME=ecodesign
DATABASE_USER=postgres
DATABASE_PASSWORD=your_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| POST   | `/api/register/`   | Create account      |
| POST   | `/api/login/`      | Login               |
| POST   | `/api/logout/`     | Logout              |
| GET    | `/api/me/`         | Current user info   |

### Products
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| GET    | `/api/products/`            | List user's products |
| POST   | `/api/products/`            | Create product + default scenario |
| GET    | `/api/products/<id>/`       | Get product          |
| PUT    | `/api/products/<id>/`       | Update product       |
| DELETE | `/api/products/<id>/`       | Delete product + scenario |

### Scenarios
| Method | Endpoint                                      | Description                          |
|--------|-----------------------------------------------|--------------------------------------|
| GET    | `/api/products/<id>/scenarios/`               | List scenarios for product           |
| POST   | `/api/products/<id>/scenarios/`               | Create new scenario                  |
| GET    | `/api/products/<id>/compare/`                 | Compare all calculated scenarios     |
| GET    | `/api/scenarios/<id>/`                        | Get scenario entries                 |
| DELETE | `/api/scenarios/<id>/`                        | Delete scenario + all entries        |
| POST   | `/api/scenarios/<id>/save/`                   | Save entries + calculate impact      |
| GET    | `/api/scenarios/<id>/result/`                 | Get stored impact result             |
| GET    | `/api/scenarios/<id>/recommendations/`        | Get ML recommendations (KNN)         |

### Reference Data
| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| GET    | `/api/materials/subtypes/`            | Material categories          |
| GET    | `/api/materials/by-subtype/?subtype=` | Materials by category        |
| GET    | `/api/energy/subtypes/`               | Energy categories            |
| GET    | `/api/energy/by-subtype/?subtype=`    | Energies by category         |
| GET    | `/api/transport/subtypes/`            | Transport categories         |
| GET    | `/api/transport/by-subtype/?subtype=` | Transports by category       |

---

## 🤖 Module ML — Recommandations

### Comment ça marche

Le module `api/ml/recommender.py` analyse chaque scénario calculé et génère des suggestions d'amélioration phase par phase en utilisant l'algorithme **K-Nearest Neighbours (KNN)** de scikit-learn.

**Algorithme :**
1. Pour chaque item utilisé dans le scénario (matériau, énergie, transport, etc.) l'engine récupère tous les candidats de la même catégorie (`subtype`).
2. Il filtre les candidats ayant une empreinte carbone **strictement inférieure** à l'item actuel.
3. Il normalise les features `(eco_cost, carbon_kg)` avec `MinMaxScaler` et applique KNN (distance euclidienne) pour trouver les `k=3` alternatives les plus **proches financièrement** parmi celles qui émettent moins.
4. Pour chaque substitution, l'économie potentielle en kg CO₂ et en € est calculée.
5. Les résultats sont dédupliqués et triés par économie CO₂ décroissante.
6. Un **conseil** en français est généré automatiquement pour chaque suggestion.

### Prérequis spécifiques

```bash
pip install scikit-learn numpy
```

Vérifier l'installation :
```bash
python -c "import sklearn, numpy; print('sklearn', sklearn.__version__, '| numpy', numpy.__version__)"
```

### Utilisation

Le module est appelé automatiquement via l'endpoint REST :

```
GET /api/scenarios/<scenario_id>/recommendations/
```

**Exemple de réponse :**
```json
[
  {
    "phase": "materiaux",
    "phase_label": "Matières premières",
    "current_name": "BR (butadiene rubber)",
    "current_co2": 11.88,
    "alternative_name": "EPDM (ethylene propylene diene monomer rubber)",
    "alternative_co2": 10.49,
    "co2_saving": 1.39,
    "eco_saving": 0.42,
    "improvement_pct": 11.7,
    "quantity": 4.0,
    "unit": "kg",
    "conseil": "Remplacez « BR (butadiene rubber) » par « EPDM … » (4.0 kg). Ce changement réduit votre empreinte carbone de 1.39 kg CO₂ (−11.7%)."
  }
]
```

### Depuis le frontend

Dans la page **ProductDescription**, après avoir calculé un scénario :
1. La carte **Recommandations IA** apparaît automatiquement sous les résultats.
2. Cliquer sur **🔍 Voir les recommandations** déclenche l'analyse.
3. Chaque suggestion affiche : phase concernée, item actuel → alternative, économie CO₂/€ et le **conseil** en langage naturel.
4. Le bouton devient **🔄 Réanalyser** pour relancer l'analyse après modification du scénario.

### Extension possible

| Amélioration                        | Piste                                              |
|-------------------------------------|----------------------------------------------------|
| Recommandations multi-objectif      | Ajouter `eco_cost` comme second critère de Pareto  |
| Apprentissage sur historique        | Entraîner un modèle sur les scénarios existants    |
| Score de faisabilité                | Pondérer par proximité sémantique du `subtype`     |
| Export PDF                          | Générer un rapport avec `reportlab` ou `weasyprint`|

---

*Built with 💚 for sustainable product design.*

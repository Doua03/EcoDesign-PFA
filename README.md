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
- 🗂 **Scenario Management** — Multiple LCA scenarios per product (create, switch, delete)
- 🌿 **Materials, Energy, Transport** — Dynamic dropdowns fed from the Idemat 2026 database (2,300+ entries)
- ⚡ **Impact Calculation** — Eco-cost (€) and carbon footprint (kg CO₂) calculated on demand
- 📊 **Results Visualization** — Donut chart showing impact breakdown per category
- 🧭 **ISO 14040 / 14044** compatible methodology

---

## 🛠 Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 19, React Router, CSS Modules |
| Backend   | Django 4, Django REST Framework     |
| Database  | PostgreSQL (via pgAdmin)            |
| LCA Data  | Idemat 2026 (Excel → seeded to DB)  |
| Auth      | Django Sessions + CORS              |

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
pip install django djangorestframework psycopg2-binary django-cors-headers pandas openpyxl
```

**4. Configure the database**

Create a PostgreSQL database in pgAdmin, then update `config/config/settings.py`:
```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'ecodesign',
        'USER': 'postgres',
        'PASSWORD': 'your_password',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}
```

**5. Run migrations**
```bash
cd config
python manage.py makemigrations
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
| Method | Endpoint                              | Description                  |
|--------|---------------------------------------|------------------------------|
| GET    | `/api/products/<id>/scenarios/`       | List scenarios for product   |
| POST   | `/api/products/<id>/scenarios/`       | Create new scenario          |
| GET    | `/api/scenarios/<id>/`                | Get scenario entries         |
| DELETE | `/api/scenarios/<id>/`                | Delete scenario + all entries|
| POST   | `/api/scenarios/<id>/save/`           | Save entries + calculate impact |

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

*Built with 💚 for sustainable product design.*

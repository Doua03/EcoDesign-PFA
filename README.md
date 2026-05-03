#  EcoDesign — Outil d'Analyse du Cycle de Vie (ACV)

EcoDesign est une application web qui aide les équipes de conception industrielle à mesurer, comprendre et réduire l'impact environnemental de leurs produits grâce à l'**Analyse du Cycle de Vie (ACV)**.

Construit avec **Django** (backend) + **React** (frontend), alimenté par la base de données **Idemat 2026**.

---

##  Table des matières

- [Fonctionnalités](#-fonctionnalités)
- [Tech Stack](#-tech-stack)
- [Structure du projet](#-structure-du-projet)
- [Démarrage rapide](#-démarrage-rapide)
  - [Prérequis](#prérequis)
  - [Backend](#backend)
  - [Frontend](#frontend)
- [Seeding de la base de données](#-seeding-de-la-base-de-données)
- [Variables d'environnement](#-variables-denvironnement)
- [Plans & restrictions](#-plans--restrictions)
- [API Endpoints](#-api-endpoints)
- [Module ML — Recommandations](#-module-ml--recommandations)

---

##  Fonctionnalités

-  **Authentification** — Inscription, connexion, déconnexion avec sessions Django
-  **Gestion des produits** — CRUD complet avec limite selon le plan
-  **Gestion des scénarios** — Plusieurs scénarios ACV par produit ; résultats persistants entre sessions
-  **Matériaux, Énergie, Transport, Packaging, Production, Fin de vie** — Menus dynamiques alimentés par Idemat 2026 (2 300+ entrées)
-  **Calcul d'impact** — Éco-coût (€) et empreinte carbone (kg CO₂) calculés à la demande, avec **packaging séparé** dans la répartition
-  **Visualisation** — Graphique donut par phase (matériaux, packaging, transport, énergie, production, fin de vie)
-  **Comparaison de scénarios** — Graphiques en barres et répartition empilée par phase
-  **Recommandations ML** — Moteur KNN 4D (scikit-learn) suggérant des alternatives Pareto-meilleures par phase, avec conseils en français
-  **Méthodologie ISO 14040 / 14044** compatible
-  **Tableau de bord** — KPIs, graphiques CO₂/éco-coût par produit, meilleur scénario par produit
-  **Plans d'abonnement** — Gratuit / Pro / Entreprise avec restrictions appliquées côté frontend et backend
-  **Profil utilisateur** — Modification du nom, mot de passe, affichage du plan actif
-  **Paramètres** — Langue, thème, notifications, suppression de compte
-  **Page Tarification** — Affichage du plan actif, boutons de contact pour évoluer

---

##  Tech Stack

| Couche         | Technologie                                          |
|----------------|------------------------------------------------------|
| Frontend       | React 19, React Router 7, Lucide React, CSS          |
| Backend        | Django 5.2, Django Sessions, CORS                    |
| Base de données| PostgreSQL (via pgAdmin)                             |
| Données LCA    | Idemat 2026 (Excel → seeded to DB)                   |
| Auth           | Django Sessions + CORS                               |
| ML / Data      | scikit-learn 1.8, NumPy 2.x, pandas, openpyxl        |

---

##  Structure du projet

```
EcoDesign/
├── config/                          # Projet Django
│   ├── api/
│   │   ├── models.py                # User, Product, Scenario, Material, Energy,
│   │   │                            # Transport, Production, EndOfLife, ImpactResult
│   │   ├── views.py                 # Toutes les vues API
│   │   ├── urls.py                  # Routes API
│   │   ├── seed_idemat.py           # Script de seeding Idemat 2026
│   │   ├── ml/
│   │   │   └── recommender.py       # Moteur KNN 4D + générateur de conseils
│   │   └── migrations/
│   │       ├── 0001_initial.py
│   │       ├── 0002_scenariomaterial_is_packaging.py
│   │       ├── 0003_scenario_product.py
│   │       ├── 0004_user_plan.py    # Colonne plan sur User + migration eya → pro
│   │       └── 0005_add_ced_eco_scarcity.py  # ced_mj + eco_scarcity sur les 5 tables LCA
│   ├── config/
│   │   ├── settings.py
│   │   └── urls.py
│   ├── idemat.xlsx                  # Fichier source Idemat 2026
│   ├── .env                         # Variables locales (non committé)
│   ├── .env.example
│   └── manage.py
├── frontend/
│   ├── public/
│   │   ├── index.html
│   │   └── Logo.png
│   └── src/
│       ├── components/shared/
│       │   ├── Header.jsx / .css    # Navbar fixe avec dropdown utilisateur
│       │   └── Sidebar.jsx / .css   # Sidebar collapsible
│       ├── pages/
│       │   ├── Landingpage.jsx / .css
│       │   ├── Login.jsx / .css
│       │   ├── Signup.jsx / .css
│       │   ├── Products.jsx / .css
│       │   ├── ProductDescription.jsx / .css  # Outil ACV principal
│       │   ├── Dashboard.jsx / .css           # Tableau de bord
│       │   ├── Pricing.jsx / .css             # Tarification
│       │   ├── Profile.jsx / .css             # Profil utilisateur
│       │   └── Settings.jsx / .css            # Paramètres
│       ├── utils/
│       │   └── planLimits.js        # Définition des plans et limites
│       ├── App.js                   # Routing principal
│       └── app-layout.css
└── README.md
```

---

##  Démarrage rapide

### Prérequis

- Python 3.11+
- Node.js 18+
- PostgreSQL + pgAdmin

---

### Backend

**1. Cloner le dépôt**
```bash
git clone https://github.com/YOUR_USERNAME/EcoDesign.git
cd EcoDesign
```

**2. Créer et activer l'environnement virtuel**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

**3. Installer les dépendances**
```bash
pip install django djangorestframework psycopg2-binary django-cors-headers pandas openpyxl scikit-learn numpy python-dotenv
```

**4. Configurer la base de données**

Créer une base PostgreSQL nommée `ecodesign` dans pgAdmin, puis :

```bash
cd config
cp .env.example .env
```

Remplir `config/.env` avec vos propres valeurs :

```env
SECRET_KEY=votre_cle_secrete_django
DB_NAME=ecodesign
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
```

> `.env` est dans `.gitignore` et n'est **jamais commité**.

**5. Appliquer les migrations**
```bash
python manage.py migrate
```

Les migrations incluent :
- `0004_user_plan` — ajoute la colonne `plan` sur `User` (défaut `free`) et passe le compte `eya` en `pro`
- `0005_add_ced_eco_scarcity` — ajoute `ced_mj` et `eco_scarcity` sur les 5 tables LCA

**6. Seeder la base Idemat**

Placer `idemat.xlsx` dans le dossier `config/`, puis :
```bash
python manage.py shell -c "exec(open('api/seed_idemat.py').read())"
```

Le script lit les colonnes suivantes de la feuille `Idemat2026` :

| Colonne | Index | Champ DB         |
|---------|-------|------------------|
| eco-costs total | 6 | `eco_cost` |
| carbon kgCO2e | 13 | `carbon_kg` |
| eco-costs resource scarcity | 10 | `eco_scarcity` |
| CED (Total) MJ | 16 | `ced_mj` |

> Le script utilise `update_or_create` — relancer le seeding met à jour les entrées existantes sans dupliquer.

**7. Démarrer le serveur**
```bash
python manage.py runserver
```

Backend → `http://localhost:8000`

---

### Frontend

**1. Installer les dépendances**
```bash
cd frontend
npm install
```

**2. Démarrer le serveur de développement**
```bash
npm start
```

Frontend → `http://localhost:3000`

---

##  Seeding de la base de données

Le script `seed_idemat.py` peuple 5 tables à partir du fichier Excel Idemat 2026 :

| Modèle      | Catégorie Idemat              | ~Entrées | Champs supplémentaires     |
|-------------|-------------------------------|----------|----------------------------|
| Material    | Materials, Food, etc.         | 1 566    | `ced_mj`, `eco_scarcity`   |
| Energy      | Energy, electricity, heat     | 394      | `ced_mj`, `eco_scarcity`   |
| Transport   | Transport (all modes)         | 52       | `ced_mj`, `eco_scarcity`   |
| Production  | Processing                    | 83       | `ced_mj`, `eco_scarcity`   |
| EndOfLife   | Waste treatment               | 293      | `ced_mj`, `eco_scarcity`   |

---

##  Variables d'environnement

```env
SECRET_KEY=votre_cle_secrete_django
DB_NAME=ecodesign
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
DB_HOST=localhost
DB_PORT=5432
```

---

##  Plans & restrictions

Les plans sont stockés dans la colonne `plan` du modèle `User` (valeurs : `free`, `pro`, `enterprise`).

| Fonctionnalité              | Gratuit | Pro | Entreprise |
|-----------------------------|---------|-----|------------|
| Produits                    | 3 max   | ∞   | ∞          |
| Scénarios par produit       | 2 max   | ∞   | ∞          |
| Base Idemat complète        | ✓       | ✓   | ✓          |
| Calcul éco-coûts & CO₂      | ✓       | ✓   | ✓          |
| Recommandations intelligentes | ✗     | ✓   | ✓          |
| Export de rapports          | ✗       | ✓   | ✓          |

**Application des restrictions :**
- **Frontend** — `src/utils/planLimits.js` lit `user.plan` depuis `localStorage` (défini à la connexion) et bloque les actions avant l'appel API
- **Backend** — `PLAN_LIMITS` dans `views.py` contient un flag explicite `recommendations` par plan. `get_plan_limits(request)` lit `request.session['user_plan']` (défini à la connexion depuis la DB) et retourne les limites correspondantes. Les endpoints vérifient ces limites et retournent HTTP 403 si dépassées.

**Compte de démonstration Pro :**
Le compte `eya` est automatiquement passé en plan `pro` par la migration `0004_user_plan`.

---

##  API Endpoints

### Auth
| Méthode | Endpoint           | Description              |
|---------|--------------------|--------------------------|
| POST    | `/api/register/`   | Créer un compte          |
| POST    | `/api/login/`      | Connexion (retourne `plan`) |
| POST    | `/api/logout/`     | Déconnexion              |
| GET     | `/api/me/`         | Utilisateur courant + plan |

### Utilisateur
| Méthode | Endpoint                          | Description                        |
|---------|-----------------------------------|------------------------------------|
| PUT     | `/api/users/<id>/`                | Modifier le nom                    |
| PUT     | `/api/users/<id>/password/`       | Changer le mot de passe            |
| DELETE  | `/api/users/<id>/delete/`         | Supprimer le compte                |

### Produits
| Méthode | Endpoint                    | Description                        |
|---------|-----------------------------|------------------------------------|
| GET     | `/api/products/`            | Liste des produits de l'utilisateur |
| POST    | `/api/products/`            | Créer produit + scénario par défaut (vérifie limite plan) |
| GET     | `/api/products/<id>/`       | Détail produit                     |
| PUT     | `/api/products/<id>/`       | Modifier produit                   |
| DELETE  | `/api/products/<id>/`       | Supprimer produit + scénarios      |

### Scénarios
| Méthode | Endpoint                                   | Description                              |
|---------|--------------------------------------------|------------------------------------------|
| GET     | `/api/products/<id>/scenarios/`            | Liste des scénarios                      |
| POST    | `/api/products/<id>/scenarios/`            | Créer scénario (vérifie limite plan)     |
| GET     | `/api/products/<id>/compare/`              | Comparer tous les scénarios calculés     |
| GET     | `/api/scenarios/<id>/`                     | Entrées du scénario                      |
| PUT     | `/api/scenarios/<id>/`                     | Renommer scénario                        |
| DELETE  | `/api/scenarios/<id>/`                     | Supprimer scénario                       |
| POST    | `/api/scenarios/<id>/save/`                | Sauvegarder + calculer l'impact          |
| GET     | `/api/scenarios/<id>/result/`              | Résultat d'impact stocké                 |
| GET     | `/api/scenarios/<id>/recommendations/`     | Recommandations ML KNN (plan Pro requis, vérifié via flag `recommendations` en session) |

### Données de référence
| Méthode | Endpoint                                | Description                  |
|---------|-----------------------------------------|------------------------------|
| GET     | `/api/materials/subtypes/`              | Catégories de matériaux      |
| GET     | `/api/materials/by-subtype/?subtype=`   | Matériaux par catégorie      |
| GET     | `/api/energy/subtypes/`                 | Catégories d'énergie         |
| GET     | `/api/energy/by-subtype/?subtype=`      | Énergies par catégorie       |
| GET     | `/api/transport/subtypes/`              | Catégories de transport      |
| GET     | `/api/transport/by-subtype/?subtype=`   | Transports par catégorie     |
| GET     | `/api/packaging/subtypes/`              | Catégories de packaging      |
| GET     | `/api/packaging/by-subtype/?subtype=`   | Matériaux de packaging       |
| GET     | `/api/production/subtypes/`             | Catégories de production     |
| GET     | `/api/production/by-subtype/?subtype=`  | Procédés de production       |
| GET     | `/api/end-of-life/subtypes/`            | Catégories de fin de vie     |
| GET     | `/api/end-of-life/by-subtype/?subtype=` | Traitements de fin de vie    |

---
## Module ML — Recommandations

### Architecture

Le module `api/ml/recommender.py` analyse chaque scénario calculé et génère des suggestions d'amélioration phase par phase via l'algorithme **K-Nearest Neighbours (KNN)** de scikit-learn dans un **espace de features 4D**.

### Espace de features 4D

| Dimension      | Description                                      | Rôle                                    |
|----------------|--------------------------------------------------|-----------------------------------------|
| `eco_cost`     | Éco-coût total (€/unité)                         | Impact environnemental global           |
| `carbon_kg`    | Empreinte carbone (kgCO₂e/unité)                 | Critère Pareto principal                |
| `ced_mj`       | Demande cumulée en énergie (MJ/unité)            | Proxy d'intensité de fabrication        |
| `eco_scarcity` | Éco-coût de rareté des ressources (€/unité)      | Proxy de criticité / irremplaçabilité   |

L'ajout de `ced_mj` et `eco_scarcity` empêche le moteur de recommander un matériau bas de gamme comme substitut d'un matériau haute performance uniquement parce que leurs valeurs carbone sont proches.

### Algorithme

1. Pour chaque item du scénario, récupérer tous les candidats de la même catégorie (`subtype`)
2. **Filtre Pareto** : ne garder que les candidats avec `carbon_kg` strictement inférieur
3. **Normalisation** : `MinMaxScaler` sur le pool local (candidats + référence)
4. **KNN** : distance euclidienne, `k=3`, algorithme brute force
5. Calculer les économies CO₂ et éco-coût pour chaque substitution
6. Dédupliquer : garder les `top_n=3` meilleures alternatives par `(phase, item)`
7. Trier par économie CO₂ décroissante
8. Générer un **conseil** en français pour chaque suggestion

### Phases analysées

| Phase        | Pool de candidats                    |
|--------------|--------------------------------------|
| `materiaux`  | Même `subtype` (matériaux réguliers + packaging) |
| `energie`    | Pool complet (changement de source valide) |
| `transport`  | Pool complet                         |
| `production` | Même `subtype`, fallback pool complet |
| `fin_de_vie` | Pool complet                         |

### Exemple de réponse

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
    "conseil": "Remplacez « BR (butadiene rubber) » par « EPDM … » (4.0 kg). Ce changement réduit votre empreinte carbone de 1.39 kg CO₂ (−11.7%). Cela représente également une économie d'éco-coût de €0.42."
  }
]
```

### Accès

- **Endpoint** : `GET /api/scenarios/<id>/recommendations/`
- **Plan requis** : Pro ou Entreprise (HTTP 403 pour le plan Gratuit)
- **Frontend** : carte "Recommandations IA" dans ProductDescription, visible uniquement pour les utilisateurs Pro

---

*Built with 💚 for sustainable product design.*

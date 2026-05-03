"""
Recommendation engine for EcoDesign scenarios.

For each item in a scenario (material, energy, transport, etc.) the engine uses
KNN in a 4-dimensional feature space to find alternatives that are:
  - In the same semantic category (subtype when available)
  - Pareto-better: strictly lower carbon footprint
  - Nearest in (eco_cost, carbon_kg, ced_mj, eco_scarcity) space

The 4 KNN dimensions split into two groups:
  Environmental  → eco_cost, carbon_kg
  Performance    → ced_mj (processing intensity proxy), eco_scarcity (criticality proxy)

Adding ced_mj and eco_scarcity prevents the engine from recommending a
low-performance cheap material as a substitute for a high-performance one
purely because their carbon numbers are close.

Results are ranked by absolute CO₂ saving (highest saving first).
Up to TOP_N alternatives are returned per (phase, current_name) pair.
"""

import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors


# ─── KNN core ─────────────────────────────────────────────────────────────────

def _knn_better_alternatives(current_eco, current_co2, current_ced,
                              current_scarcity, candidates, k=3):
    """
    Return up to k candidates from `candidates` (list of dicts with keys
    eco_cost, carbon_kg, ced_mj, eco_scarcity, + any other fields) that:
      1. Have strictly lower carbon_kg than current  (Pareto filter)
      2. Are nearest neighbours in the 4D feature space

    Feature space:
      - eco_cost      : broader environmental cost (€/kg)
      - carbon_kg     : climate impact (kgCO2e/kg)
      - ced_mj        : cumulative energy demand — proxy for processing intensity
                        High CED = energy-intensive production = often high-performance
      - eco_scarcity  : resource scarcity eco-cost — proxy for material criticality
                        High scarcity = geologically rare = functionally irreplaceable

    MinMaxScaler is fit on the current pool + reference point so distances
    are meaningful within the local candidate range, not globally.
    """
    # Pareto filter: only consider strictly better alternatives
    better = [c for c in candidates if c["carbon_kg"] < current_co2]
    if not better:
        return []
    if len(better) <= k:
        return better

    # Build feature matrix — 4 dimensions
    X = np.array(
        [[c["eco_cost"], c["carbon_kg"],
          c.get("ced_mj", 0.0), c.get("eco_scarcity", 0.0)]
         for c in better],
        dtype=float,
    )
    ref = np.array(
        [[current_eco, current_co2, current_ced, current_scarcity]],
        dtype=float,
    )

    # Scale on local range (candidates + reference) so no feature dominates
    scaler = MinMaxScaler()
    scaler.fit(np.vstack([X, ref]))
    X_s   = scaler.transform(X)
    ref_s = scaler.transform(ref)

    n = min(k, len(better))
    knn = NearestNeighbors(n_neighbors=n, algorithm="brute", metric="euclidean")
    knn.fit(X_s)
    _, idx = knn.kneighbors(ref_s)
    return [better[i] for i in idx[0]]


# ─── Natural-language conseil generator ───────────────────────────────────────

def _short(name, n=55):
    """Truncate a material name for display."""
    return name if len(name) <= n else name[: n - 1] + "…"


def _build_conseil(phase, current_name, alt_name, saving_co2, pct, qty, unit, eco_saving):
    """Build a human-readable French recommendation sentence."""
    cur  = _short(current_name)
    alt  = _short(alt_name)
    save = f"{saving_co2:.2f} kg CO₂ (−{pct}%)"
    eco  = (
        f" Cela représente également une économie d'éco-coût de €{eco_saving:.2f}."
        if eco_saving > 0.01 else ""
    )

    if phase == "materiaux":
        return (
            f"Remplacez « {cur} » par « {alt} » ({qty} {unit}). "
            f"Ce changement réduit votre empreinte carbone de {save}.{eco}"
        )
    if phase == "energie":
        return (
            f"Substituez votre source d'énergie « {cur} » par « {alt} » "
            f"pour {qty} {unit} consommés. "
            f"Gain estimé : {save}.{eco}"
        )
    if phase == "transport":
        return (
            f"Privilégiez « {alt} » plutôt que « {cur} » pour vos {qty} {unit} de transport. "
            f"Réduction potentielle : {save}.{eco}"
        )
    if phase == "production":
        return (
            f"Remplacez le procédé « {cur} » par « {alt} » en production. "
            f"Économie estimée : {save}.{eco}"
        )
    if phase == "fin_de_vie":
        return (
            f"Optez pour « {alt} » comme méthode de traitement en fin de vie "
            f"au lieu de « {cur} ». "
            f"Réduction : {save}.{eco}"
        )
    return f"Remplacez « {cur} » par « {alt} » pour économiser {save}.{eco}"


# ─── Phase-level recommendation helper ────────────────────────────────────────

def _rec(phase, phase_label, current_name, alt,
         current_co2_total, saving_co2, saving_eco, qty, unit):
    """Build a single recommendation dict. Returns None if saving is negligible."""
    if saving_co2 < 0.0001:
        return None
    pct = round(saving_co2 / current_co2_total * 100, 1) if current_co2_total > 0 else 0
    conseil = _build_conseil(
        phase, current_name, alt["name"], saving_co2, pct, qty, unit, saving_eco
    )
    return {
        "phase":            phase,
        "phase_label":      phase_label,
        "current_name":     current_name,
        "current_co2":      round(current_co2_total, 4),
        "alternative_id":   alt["id"],
        "alternative_name": alt["name"],
        "alternative_co2":  round(alt["carbon_kg"] * qty, 4),
        "co2_saving":       round(saving_co2, 4),
        "eco_saving":       round(saving_eco, 4),
        "improvement_pct":  pct,
        "quantity":         qty,
        "unit":             unit,
        "conseil":          conseil,
    }


# ─── Phase handlers ───────────────────────────────────────────────────────────

def _recommend_materials(scenario):
    from api.models import ScenarioMaterial, Material

    recs = []
    entries = list(
        ScenarioMaterial.objects.filter(scenario=scenario).select_related("material")
    )

    # Pre-fetch all candidates grouped by subtype to avoid N+1 queries
    subtypes_needed = {e.material.subtype for e in entries if e.material.subtype}
    pool_by_subtype = {}
    for st in subtypes_needed:
        pool_by_subtype[st] = list(
            Material.objects.filter(subtype=st)
            .values("id", "name", "eco_cost", "carbon_kg", "unit", "ced_mj", "eco_scarcity")
        )

    for entry in entries:
        mat      = entry.material
        qty      = entry.quantity
        curr_co2 = mat.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        label = "Packaging" if entry.is_packaging else "Matières premières"
        pool  = [c for c in pool_by_subtype.get(mat.subtype, []) if c["id"] != mat.id]
        alts  = _knn_better_alternatives(
            mat.eco_cost, mat.carbon_kg, mat.ced_mj, mat.eco_scarcity, pool, k=3
        )

        for alt in alts:
            r = _rec(
                "materiaux", label, mat.name, alt,
                curr_co2,
                curr_co2 - alt["carbon_kg"] * qty,
                (mat.eco_cost - alt["eco_cost"]) * qty,
                qty, mat.unit,
            )
            if r:
                recs.append(r)
    return recs


def _recommend_energy(scenario):
    from api.models import ScenarioEnergy, Energy

    recs = []
    entries = list(
        ScenarioEnergy.objects.filter(scenario=scenario).select_related("energy")
    )
    if not entries:
        return recs

    # Energy: cross-subtype pool — switching energy source entirely is valid
    full_pool = list(
        Energy.objects.values("id", "name", "eco_cost", "carbon_kg", "unit", "ced_mj", "eco_scarcity")
    )

    for entry in entries:
        en       = entry.energy
        qty      = entry.quantity
        curr_co2 = en.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        pool = [c for c in full_pool if c["id"] != en.id]
        alts = _knn_better_alternatives(
            en.eco_cost, en.carbon_kg, en.ced_mj, en.eco_scarcity, pool, k=3
        )

        for alt in alts:
            r = _rec(
                "energie", "Énergie", en.name, alt,
                curr_co2,
                curr_co2 - alt["carbon_kg"] * qty,
                (en.eco_cost - alt["eco_cost"]) * qty,
                qty, en.unit,
            )
            if r:
                recs.append(r)
    return recs


def _recommend_transport(scenario):
    from api.models import ScenarioTransport, Transport

    recs = []
    entries = list(
        ScenarioTransport.objects.filter(scenario=scenario).select_related("transport")
    )
    if not entries:
        return recs

    full_pool = list(
        Transport.objects.values("id", "name", "eco_cost", "carbon_kg", "unit", "ced_mj", "eco_scarcity")
    )

    for entry in entries:
        tr       = entry.transport
        dist     = entry.distance
        curr_co2 = tr.carbon_kg * dist
        if curr_co2 <= 0:
            continue

        pool = [c for c in full_pool if c["id"] != tr.id]
        alts = _knn_better_alternatives(
            tr.eco_cost, tr.carbon_kg, tr.ced_mj, tr.eco_scarcity, pool, k=3
        )

        for alt in alts:
            r = _rec(
                "transport", "Transport", tr.name, alt,
                curr_co2,
                curr_co2 - alt["carbon_kg"] * dist,
                (tr.eco_cost - alt["eco_cost"]) * dist,
                dist, tr.unit,
            )
            if r:
                recs.append(r)
    return recs


def _recommend_production(scenario):
    from api.models import ScenarioProduction, Production

    recs = []
    entries = list(
        ScenarioProduction.objects.filter(scenario=scenario).select_related("production")
    )
    if not entries:
        return recs

    subtypes = {e.production.subtype for e in entries if e.production.subtype}
    pool_by_subtype = {}
    for st in subtypes:
        pool_by_subtype[st] = list(
            Production.objects.filter(subtype=st)
            .values("id", "name", "eco_cost", "carbon_kg", "unit", "ced_mj", "eco_scarcity")
        )
    full_pool = list(
        Production.objects.values("id", "name", "eco_cost", "carbon_kg", "unit", "ced_mj", "eco_scarcity")
    )

    for entry in entries:
        pr       = entry.production
        qty      = entry.quantity
        curr_co2 = pr.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        pool = [c for c in (pool_by_subtype.get(pr.subtype) or full_pool) if c["id"] != pr.id]
        alts = _knn_better_alternatives(
            pr.eco_cost, pr.carbon_kg, pr.ced_mj, pr.eco_scarcity, pool, k=3
        )

        for alt in alts:
            r = _rec(
                "production", "Production", pr.name, alt,
                curr_co2,
                curr_co2 - alt["carbon_kg"] * qty,
                (pr.eco_cost - alt["eco_cost"]) * qty,
                qty, pr.unit,
            )
            if r:
                recs.append(r)
    return recs


def _recommend_eol(scenario):
    from api.models import ScenarioEndOfLife, EndOfLife

    recs = []
    entries = list(
        ScenarioEndOfLife.objects.filter(scenario=scenario).select_related("end_of_life")
    )
    if not entries:
        return recs

    full_pool = list(
        EndOfLife.objects.values("id", "name", "eco_cost", "carbon_kg", "unit", "ced_mj", "eco_scarcity")
    )

    for entry in entries:
        eol      = entry.end_of_life
        qty      = entry.quantity
        curr_co2 = eol.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        pool = [c for c in full_pool if c["id"] != eol.id]
        alts = _knn_better_alternatives(
            eol.eco_cost, eol.carbon_kg, eol.ced_mj, eol.eco_scarcity, pool, k=3
        )

        for alt in alts:
            r = _rec(
                "fin_de_vie", "Fin de vie", eol.name, alt,
                curr_co2,
                curr_co2 - alt["carbon_kg"] * qty,
                (eol.eco_cost - alt["eco_cost"]) * qty,
                qty, eol.unit,
            )
            if r:
                recs.append(r)
    return recs


# ─── Public entry point ────────────────────────────────────────────────────────

def generate_recommendations(scenario, top_n=3):
    """
    Return a ranked list of recommendations for `scenario`.
    Each entry is a dict describing the current item, the suggested alternative,
    and the estimated CO₂ / eco-cost savings.
    Sorted by co2_saving descending (most impactful first).
    Up to `top_n` alternatives are returned per (phase, current_name) pair.
    """
    all_recs = (
        _recommend_materials(scenario)
        + _recommend_energy(scenario)
        + _recommend_transport(scenario)
        + _recommend_production(scenario)
        + _recommend_eol(scenario)
    )

    # Keep top_n alternatives per (phase, current_name), ranked by co2_saving desc
    seen    = {}
    deduped = []
    for r in sorted(all_recs, key=lambda x: x["co2_saving"], reverse=True):
        key   = (r["phase"], r["current_name"])
        count = seen.get(key, 0)
        if count < top_n:
            seen[key] = count + 1
            deduped.append(r)

    return deduped

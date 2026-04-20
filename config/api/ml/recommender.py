"""
Recommendation engine for EcoDesign scenarios.

For each item in a scenario (material, energy, transport, etc.) the engine uses
KNN in the (eco_cost, carbon_kg) feature space to find alternatives that are:
  - In the same semantic category (subtype when available)
  - Pareto-better: strictly lower carbon footprint
  - Nearest in eco_cost space so suggestions stay financially comparable

Results are ranked by absolute CO₂ saving (highest saving first).
"""

import numpy as np
from sklearn.preprocessing import MinMaxScaler
from sklearn.neighbors import NearestNeighbors


# ─── KNN core ─────────────────────────────────────────────────────────────────

def _knn_better_alternatives(current_eco, current_co2, candidates, k=3):
    """
    Return up to k candidates from `candidates` (list of dicts with keys
    eco_cost, carbon_kg, + any other fields) that have strictly lower
    carbon_kg than current and are nearest neighbours in (eco_cost, carbon_kg).

    Proximity in eco_cost keeps suggestions financially realistic.
    """
    better = [c for c in candidates if c["carbon_kg"] < current_co2]
    if not better:
        return []
    if len(better) <= k:
        return better

    X = np.array([[c["eco_cost"], c["carbon_kg"]] for c in better], dtype=float)
    ref = np.array([[current_eco, current_co2]], dtype=float)

    # Fit scaler on full range (current + candidates) so distances are meaningful
    scaler = MinMaxScaler()
    scaler.fit(np.vstack([X, ref]))
    X_s = scaler.transform(X)
    ref_s = scaler.transform(ref)

    n = min(k, len(better))
    knn = NearestNeighbors(n_neighbors=n, algorithm="brute", metric="euclidean")
    knn.fit(X_s)
    _, idx = knn.kneighbors(ref_s)
    return [better[i] for i in idx[0]]


# ─── Natural-language conseil generator ───────────────────────────────────────

def _short(name, n=55):
    return name if len(name) <= n else name[: n - 1] + "…"


def _build_conseil(phase, current_name, alt_name, saving_co2, pct, qty, unit, eco_saving):
    cur  = _short(current_name)
    alt  = _short(alt_name)
    save = f"{saving_co2:.2f} kg CO₂ (−{pct}%)"
    eco  = f" Cela représente également une économie d'éco-coût de €{eco_saving:.2f}." if eco_saving > 0.01 else ""

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
    return (
        f"Remplacez « {cur} » par « {alt} » pour économiser {save}.{eco}"
    )


# ─── Phase-level recommendation helpers ───────────────────────────────────────

def _rec(phase, phase_label, current_name, alt, current_co2_total, saving_co2, saving_eco, qty, unit):
    if saving_co2 < 0.0001:
        return None
    pct = round(saving_co2 / current_co2_total * 100, 1) if current_co2_total > 0 else 0
    conseil = _build_conseil(phase, current_name, alt["name"], saving_co2, pct, qty, unit, saving_eco)
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


def _recommend_materials(scenario):
    from api.models import ScenarioMaterial, Material

    recs = []
    entries = list(
        ScenarioMaterial.objects.filter(scenario=scenario)
        .select_related("material")
    )

    # Pre-fetch all candidates grouped by subtype to avoid N+1 queries
    subtypes_needed = {e.material.subtype for e in entries if e.material.subtype}
    pool_by_subtype = {}
    for st in subtypes_needed:
        pool_by_subtype[st] = list(
            Material.objects.filter(subtype=st)
            .values("id", "name", "eco_cost", "carbon_kg", "unit")
        )

    for entry in entries:
        mat = entry.material
        qty = entry.quantity
        curr_co2 = mat.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        label = "Packaging" if entry.is_packaging else "Matières premières"
        pool = [c for c in pool_by_subtype.get(mat.subtype, []) if c["id"] != mat.id]
        alts = _knn_better_alternatives(mat.eco_cost, mat.carbon_kg, pool, k=3)

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

    # All energy options as pool (cross-subtype: user can switch energy source)
    full_pool = list(Energy.objects.values("id", "name", "eco_cost", "carbon_kg", "unit"))

    for entry in entries:
        en = entry.energy
        qty = entry.quantity
        curr_co2 = en.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        pool = [c for c in full_pool if c["id"] != en.id]
        alts = _knn_better_alternatives(en.eco_cost, en.carbon_kg, pool, k=3)

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

    full_pool = list(Transport.objects.values("id", "name", "eco_cost", "carbon_kg", "unit"))

    for entry in entries:
        tr = entry.transport
        dist = entry.distance
        curr_co2 = tr.carbon_kg * dist
        if curr_co2 <= 0:
            continue

        pool = [c for c in full_pool if c["id"] != tr.id]
        alts = _knn_better_alternatives(tr.eco_cost, tr.carbon_kg, pool, k=3)

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
            Production.objects.filter(subtype=st).values("id", "name", "eco_cost", "carbon_kg", "unit")
        )
    full_pool = list(Production.objects.values("id", "name", "eco_cost", "carbon_kg", "unit"))

    for entry in entries:
        pr = entry.production
        qty = entry.quantity
        curr_co2 = pr.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        pool = [c for c in (pool_by_subtype.get(pr.subtype) or full_pool) if c["id"] != pr.id]
        alts = _knn_better_alternatives(pr.eco_cost, pr.carbon_kg, pool, k=3)

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

    full_pool = list(EndOfLife.objects.values("id", "name", "eco_cost", "carbon_kg", "unit"))

    for entry in entries:
        eol = entry.end_of_life
        qty = entry.quantity
        curr_co2 = eol.carbon_kg * qty
        if curr_co2 <= 0:
            continue

        pool = [c for c in full_pool if c["id"] != eol.id]
        alts = _knn_better_alternatives(eol.eco_cost, eol.carbon_kg, pool, k=3)

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

def generate_recommendations(scenario):
    """
    Return a ranked list of recommendations for `scenario`.
    Each entry is a dict describing the current item, the suggested alternative,
    and the estimated CO₂ / eco-cost savings.
    Sorted by co2_saving descending (most impactful first).
    """
    all_recs = (
        _recommend_materials(scenario)
        + _recommend_energy(scenario)
        + _recommend_transport(scenario)
        + _recommend_production(scenario)
        + _recommend_eol(scenario)
    )

    # Deduplicate: keep only the best alternative per (phase, current_name)
    seen = {}
    deduped = []
    for r in sorted(all_recs, key=lambda x: x["co2_saving"], reverse=True):
        key = (r["phase"], r["current_name"])
        if key not in seen:
            seen[key] = True
            deduped.append(r)

    return deduped

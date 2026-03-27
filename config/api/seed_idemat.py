import sys
import pandas as pd
from pathlib import Path

# ── adjust this path before running ──────────────────────────────────────────
EXCEL_PATH = Path("idemat.xlsx")
# ─────────────────────────────────────────────────────────────────────────────

from api.models import Material, Energy, Transport, Production, EndOfLife

# ── Column indices in the raw sheet (0-based) ─────────────────────────────────
COL_SHORT_NAME = 2
COL_SUBTYPE    = 1
COL_CATEGORY   = 3
COL_UNIT       = 4
COL_NAME       = 5
COL_ECO_COST   = 6
COL_CARBON     = 13
# ─────────────────────────────────────────────────────────────────────────────


def _is_numeric(val):
    try:
        float(val)
        return True
    except (TypeError, ValueError):
        return False


def load_sheet(path: Path) -> pd.DataFrame:
    df = pd.read_excel(path, sheet_name="Idemat2026", header=None)
    data = df[df[COL_UNIT].notna() & (df[COL_UNIT].astype(str).str.strip() != "Unit")].copy()
    data = data.reset_index(drop=True)
    return data


def classify(row) -> str:
    cat = str(row[COL_CATEGORY]).lower()
    subtype = str(row[COL_SUBTYPE]).lower()

    if cat.startswith("energy"):
        return "Energy"
    if cat.startswith("transport"):
        return "Transport"
    if cat.startswith("processing"):
        return "Production"
    if "waste" in cat or "end-of-life" in cat or subtype == "end-of-life":
        return "EndOfLife"
    return "Material"


def clean_str(val, maxlen=None) -> str:
    s = str(val).strip() if pd.notna(val) else ""
    if maxlen:
        s = s[:maxlen]
    return s


def seed(path: Path):
    print(f"Reading {path} ...")
    data = load_sheet(path)
    print(f"  {len(data)} data rows found.")

    counters = {k: {"created": 0, "skipped": 0} for k in
                ("Material", "Energy", "Transport", "Production", "EndOfLife")}

    for _, row in data.iterrows():
        short_name = clean_str(row[COL_SHORT_NAME], maxlen=50)
        name       = clean_str(row[COL_NAME], maxlen=255)
        subtype    = clean_str(row[COL_SUBTYPE], maxlen=100)
        unit       = clean_str(row[COL_UNIT], maxlen=50)
        model_name = classify(row)

        if not (_is_numeric(row[COL_ECO_COST]) and _is_numeric(row[COL_CARBON])):
            counters[model_name]["skipped"] += 1
            continue

        eco_cost  = float(row[COL_ECO_COST])
        carbon_kg = float(row[COL_CARBON])

        common = dict(
            name=name,
            subtype=subtype,
            eco_cost=eco_cost,
            carbon_kg=carbon_kg,
            unit=unit,
        )

        if model_name == "Material":
            obj, created = Material.objects.get_or_create(
                short_name=short_name,
                defaults=common,
            )
        elif model_name == "Energy":
            obj, created = Energy.objects.get_or_create(
                short_name=short_name,
                defaults={**common, "unit": unit or "kWh"},
            )
        elif model_name == "Transport":
            obj, created = Transport.objects.get_or_create(
                short_name=short_name,
                defaults={**common, "unit": unit or "km"},
            )
        elif model_name == "Production":
            obj, created = Production.objects.get_or_create(
                short_name=short_name,
                defaults={**common, "unit": unit or "unit"},
            )
        elif model_name == "EndOfLife":
            obj, created = EndOfLife.objects.get_or_create(
                short_name=short_name,
                defaults={**common, "unit": unit or "kg"},
            )
        else:
            continue

        if created:
            counters[model_name]["created"] += 1
        else:
            counters[model_name]["skipped"] += 1
            print(f"Skipped {model_name} row (already exists): {short_name} / {name}")

    print("\n── Seeding complete ──────────────────────────────────────")
    for model, c in counters.items():
        print(f"  {model:<15}  created: {c['created']:>4}   skipped/updated: {c['skipped']:>4}")


# ── Run directly ──────────────────────────────────────────────────────────────
seed(EXCEL_PATH)
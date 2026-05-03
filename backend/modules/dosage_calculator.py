from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors

router = APIRouter()

ROUTE_BIOAVAILABILITY = {
    "oral": {"f_typical": 0.5, "tmax_h": 1.5, "onset_min": 30},
    "iv":   {"f_typical": 1.0, "tmax_h": 0.1, "onset_min": 1},
    "im":   {"f_typical": 0.9, "tmax_h": 0.5, "onset_min": 15},
    "sc":   {"f_typical": 0.8, "tmax_h": 1.0, "onset_min": 20},
    "topical": {"f_typical": 0.1, "tmax_h": 4.0, "onset_min": 60},
    "sublingual": {"f_typical": 0.75, "tmax_h": 0.5, "onset_min": 5},
    "inhalation": {"f_typical": 0.9, "tmax_h": 0.2, "onset_min": 3},
}

class DosageInput(BaseModel):
    smiles: str
    route: Optional[str] = "oral"
    target_concentration_ng_ml: Optional[float] = 100.0
    patient_weight_kg: Optional[float] = 70.0
    frequency_per_day: Optional[int] = 2
    purity_pct: Optional[float] = 100.0

@router.post("/calculate")
def calc_dosage(data: DosageInput):
    mol = Chem.MolFromSmiles(data.smiles)
    if mol is None:
        return {"error": "Invalid SMILES"}

    mw    = Descriptors.MolWt(mol)
    logp  = Descriptors.MolLogP(mol)
    hbd   = rdMolDescriptors.CalcNumHBD(mol)
    tpsa  = rdMolDescriptors.CalcTPSA(mol)
    psa   = tpsa
    rot   = rdMolDescriptors.CalcNumRotatableBonds(mol)

    route_info = ROUTE_BIOAVAILABILITY.get(data.route, ROUTE_BIOAVAILABILITY["oral"])
    F = estimate_bioavailability(logp, mw, hbd, tpsa)
    Vd = estimate_volume_distribution(logp, tpsa, data.patient_weight_kg)
    cl = estimate_clearance(mw, logp, data.patient_weight_kg)
    t_half = round((0.693 * Vd) / cl, 2)
    t_half = max(0.5, min(96, t_half))

    # Target concentration → pure theoretical dose calculation
    Ct = data.target_concentration_ng_ml * 1e-6  # convert ng/mL to mg/L
    Vd_L = Vd * data.patient_weight_kg
    theoretical_dose = (Ct * Vd_L) / (F if F > 0 else 0.5)

    # Adjust for batch purity (as explicitly requested by the enterprise spec)
    purity_factor = data.purity_pct / 100.0 if data.purity_pct > 0 else 1.0
    dose_mg = round(theoretical_dose / purity_factor, 1)
    dose_mg = max(1, min(2000, dose_mg))

    daily_dose = dose_mg * data.frequency_per_day
    dose_per_kg = round(dose_mg / data.patient_weight_kg, 3)

    # Therapeutic window estimate
    min_dose = round(dose_mg * 0.7, 1)
    max_dose = round(dose_mg * 1.5, 1)

    return {
        "estimated_dose_mg": dose_mg,
        "daily_dose_mg": round(daily_dose, 1),
        "dose_per_kg_mg_kg": dose_per_kg,
        "route": data.route,
        "route_details": route_info,
        "pharmacokinetics": {
            "bioavailability_F": round(F, 3),
            "volume_distribution_L_kg": round(Vd, 2),
            "clearance_L_h_kg": round(cl, 3),
            "half_life_hours": t_half,
            "time_to_steady_state_h": round(t_half * 4, 1),
            "time_to_max_conc_h": route_info["tmax_h"],
        },
        "therapeutic_window": {
            "min_effective_mg": min_dose,
            "max_safe_mg": max_dose,
            "warning": "These are computational estimates only — NOT for clinical use"
        },
        "formulation_suggestions": suggest_formulation(mw, logp, tpsa, data.route),
        "disclaimer": (
            "Dosage estimated from molecular properties using PK/PD modeling. "
            "These values are for RESEARCH purposes only. "
            "Clinical dosage must be determined by clinical trials and regulatory review."
        )
    }

def estimate_bioavailability(logp, mw, hbd, tpsa):
    F = 1.0
    if mw > 500: F *= 0.6
    if logp > 5: F *= 0.7
    if logp < 0: F *= 0.6
    if hbd > 5:  F *= 0.7
    if tpsa > 140: F *= 0.5
    return round(max(0.05, min(1.0, F)), 3)

def estimate_volume_distribution(logp, tpsa, weight):
    base_vd = 0.7
    if logp > 3: base_vd += logp * 0.5
    if tpsa > 100: base_vd *= 0.6
    return round(max(0.1, min(50, base_vd)), 2)

def estimate_clearance(mw, logp, weight):
    base_cl = 15.0 / weight
    if mw > 400: base_cl *= 0.7
    if logp > 3: base_cl *= 1.2
    return round(max(0.001, min(5, base_cl)), 4)

def suggest_formulation(mw, logp, tpsa, route):
    suggestions = []
    if route == "oral":
        if logp > 5:
            suggestions.append("High logP — consider lipid-based formulation (SEDDS)")
        if mw > 500:
            suggestions.append("High MW — consider nanoparticle or prodrug strategy")
        if tpsa > 120:
            suggestions.append("High TPSA — poor oral absorption expected, consider parenteral route")
        if not suggestions:
            suggestions.append("Suitable for conventional tablet or capsule formulation")
    elif route == "iv":
        if logp < 0:
            suggestions.append("Hydrophilic — good for IV solution")
        else:
            suggestions.append("May require co-solvent (PEG, ethanol) or cyclodextrin for IV")
    return suggestions
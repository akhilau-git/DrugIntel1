from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors
import numpy as np, joblib, os

router = APIRouter()

SOLVENTS = {
    "hexane":         {"polarity": 0.0,  "name": "Hexane",            "type": "non-polar"},
    "petroleum_ether":{"polarity": 0.1,  "name": "Petroleum ether",   "type": "non-polar"},
    "toluene":        {"polarity": 2.4,  "name": "Toluene",           "type": "non-polar"},
    "diethyl_ether":  {"polarity": 2.9,  "name": "Diethyl ether",     "type": "moderately polar"},
    "dichloromethane":{"polarity": 3.4,  "name": "Dichloromethane",   "type": "moderately polar"},
    "chloroform":     {"polarity": 4.1,  "name": "Chloroform",        "type": "moderately polar"},
    "ethyl_acetate":  {"polarity": 4.4,  "name": "Ethyl acetate",     "type": "polar"},
    "acetonitrile":   {"polarity": 5.8,  "name": "Acetonitrile",      "type": "polar"},
    "acetone":        {"polarity": 5.1,  "name": "Acetone",           "type": "polar"},
    "isopropanol":    {"polarity": 3.9,  "name": "Isopropanol",       "type": "polar"},
    "methanol":       {"polarity": 5.8,  "name": "Methanol",          "type": "polar"},
    "water":          {"polarity": 9.0,  "name": "Water",             "type": "highly polar"},
}

SILICA_BINDING = "The stationary phase is silica gel (polar). Polar compounds bind more strongly → lower Rf."

class TLCInput(BaseModel):
    smiles: str
    solvent: Optional[str] = "ethyl_acetate"
    plate_height_cm: Optional[float] = 10.0

@router.post("/simulate")
def simulate_tlc(data: TLCInput):
    mol = Chem.MolFromSmiles(data.smiles)
    if mol is None:
        return {"error": "Invalid SMILES"}

    solvent_info = SOLVENTS.get(data.solvent, SOLVENTS["ethyl_acetate"])
    sp = solvent_info["polarity"]

    # Molecular descriptors for Rf prediction
    logp   = Descriptors.MolLogP(mol)
    mw     = Descriptors.MolWt(mol)
    hbd    = rdMolDescriptors.CalcNumHBD(mol)
    hba    = rdMolDescriptors.CalcNumHBA(mol)
    tpsa   = rdMolDescriptors.CalcTPSA(mol)
    arom   = rdMolDescriptors.CalcNumAromaticRings(mol)
    feat   = np.array([[logp, mw, hbd, hba, tpsa, sp, arom]])

    model_path = os.path.join(os.path.dirname(__file__), "../ml_models/rf_model.pkl")
    if False: # os.path.exists(model_path):
        model = joblib.load(model_path)
        rf = float(model.predict(feat)[0])
    else:
        rf = predict_rf_physics(logp, tpsa, sp)

    rf = round(max(0.01, min(0.99, rf)), 3)

    plate_h = data.plate_height_cm
    baseline_cm  = 1.0
    solvent_cm   = plate_h - 0.5
    sample_cm    = baseline_cm + rf * (solvent_cm - baseline_cm)
    dist_sample  = round(sample_cm - baseline_cm, 2)
    dist_solvent = round(solvent_cm - baseline_cm, 2)

    return {
        "rf_value": rf,
        "solvent": data.solvent,
        "solvent_info": solvent_info,
        "distances": {
            "baseline_cm": baseline_cm,
            "solvent_front_cm": round(solvent_cm, 2),
            "spot_position_cm": round(sample_cm, 2),
            "distance_sample_cm": dist_sample,
            "distance_solvent_cm": dist_solvent,
        },
        "spot_position_percent": round(rf * 100, 1),
        "interpretation": interpret_rf(rf, data.solvent),
        "stationary_phase_note": SILICA_BINDING,
        "optimal_solvent": suggest_optimal_solvent(rf, data.solvent),
        "visualization": {
            "plate_height": 100,
            "solvent_front": 95,
            "baseline": 10,
            "spot": round(10 + rf * 85, 1)
        }
    }

def predict_rf_physics(logp, tpsa, solvent_polarity):
    polarity_factor  = min(tpsa / 140.0, 1.0)
    nonpolar_factor  = min(max(logp + 5, 0) / 15.0, 1.0)
    base_rf = nonpolar_factor * (1 - solvent_polarity / 10) + (1 - polarity_factor) * (solvent_polarity / 10)
    return round(max(0.02, min(0.97, base_rf)), 3)

def interpret_rf(rf, solvent):
    if rf < 0.1:
        return f"Spot stays near baseline — compound is too polar for {solvent}. Use a more polar solvent."
    elif rf < 0.2:
        return "Compound is very polar. Consider adding methanol or water to mobile phase."
    elif rf < 0.35:
        return "Moderately polar compound. Good separation achievable."
    elif rf < 0.65:
        return "Optimal Rf range (0.3–0.7). Excellent TLC conditions."
    elif rf < 0.85:
        return "Compound is non-polar. Good conditions; use less polar solvent for better resolution."
    else:
        return f"Spot runs near solvent front — compound is too non-polar for {solvent}. Use hexane or petroleum ether."

def suggest_optimal_solvent(rf, current_solvent):
    if 0.3 <= rf <= 0.7:
        return {"suggestion": current_solvent, "note": "Current solvent is optimal"}
    if rf < 0.3:
        more_polar = [s for s, v in SOLVENTS.items() if v["polarity"] > SOLVENTS.get(current_solvent, {}).get("polarity", 4)]
        return {"suggestion": more_polar[0] if more_polar else "methanol", "note": "Switch to a more polar solvent"}
    less_polar = [s for s, v in SOLVENTS.items() if v["polarity"] < SOLVENTS.get(current_solvent, {}).get("polarity", 4)]
    return {"suggestion": less_polar[-1] if less_polar else "hexane", "note": "Switch to a less polar solvent"}

@router.post("/multi-compound")
def simulate_multi(compounds: list):
    """Simulate TLC with multiple compounds — shows separation"""
    results = []
    for c in compounds:
        mol = Chem.MolFromSmiles(c.get("smiles",""))
        if mol:
            logp = Descriptors.MolLogP(mol)
            tpsa = rdMolDescriptors.CalcTPSA(mol)
            sp = SOLVENTS.get(c.get("solvent","ethyl_acetate"), SOLVENTS["ethyl_acetate"])["polarity"]
            rf = predict_rf_physics(logp, tpsa, sp)
            results.append({"name": c.get("name",""), "rf": rf, "smiles": c["smiles"]})
    results.sort(key=lambda x: x["rf"])
    return {"compounds": results, "separation_quality": assess_separation(results)}

def assess_separation(results):
    if len(results) < 2: return "Single compound"
    rfs = [r["rf"] for r in results]
    min_gap = min(abs(rfs[i+1]-rfs[i]) for i in range(len(rfs)-1))
    if min_gap > 0.15: return "Excellent separation"
    if min_gap > 0.08: return "Good separation"
    if min_gap > 0.04: return "Poor separation — change solvent"
    return "No separation — compounds co-elute"
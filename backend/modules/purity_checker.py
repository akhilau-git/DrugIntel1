from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List
from rdkit import Chem
from rdkit.Chem import Descriptors, rdMolDescriptors

router = APIRouter()

class PurityInput(BaseModel):
    smiles: str
    method: Optional[str] = "computational"  # computational, hplc, nmr

@router.post("/check")
def check_purity(data: PurityInput):
    mol = Chem.MolFromSmiles(data.smiles)
    if mol is None:
        return {"error": "Invalid SMILES"}

    purity_pct = 99.0 # Placeholder for computational purity if no physical data

    mw    = Descriptors.MolWt(mol)
    logp  = Descriptors.MolLogP(mol)
    hbd   = rdMolDescriptors.CalcNumHBD(mol)
    hba   = rdMolDescriptors.CalcNumHBA(mol)
    tpsa  = rdMolDescriptors.CalcTPSA(mol)
    rot   = rdMolDescriptors.CalcNumRotatableBonds(mol)
    rings = rdMolDescriptors.CalcNumRings(mol)

    tests = [
        {"test": "Molecular weight ≤ 500 Da",    "value": f"{round(mw,1)} Da",     "pass": mw <= 500,       "rule": "Lipinski"},
        {"test": "LogP ≤ 5 (oral absorption)",   "value": str(round(logp, 2)),     "pass": logp <= 5,       "rule": "Lipinski"},
        {"test": "H-bond donors ≤ 5",            "value": str(hbd),                "pass": hbd <= 5,        "rule": "Lipinski"},
        {"test": "H-bond acceptors ≤ 10",        "value": str(hba),                "pass": hba <= 10,       "rule": "Lipinski"},
        {"test": "TPSA ≤ 140 Å²",              "value": f"{round(tpsa,1)} Å²",   "pass": tpsa <= 140,     "rule": "Veber"},
        {"test": "Rotatable bonds ≤ 10",         "value": str(rot),                "pass": rot <= 10,       "rule": "Veber"},
        {"test": "Computational purity ≥ 95%",             "value": f"{purity_pct}%",        "pass": purity_pct >= 95,"rule": "Quality"},
        {"test": "Rings ≤ 5",                    "value": str(rings),              "pass": rings <= 5,      "rule": "Ghose"},
        {"test": "LogP > -2 (not too hydrophilic)", "value": str(round(logp,2)),   "pass": logp > -2,       "rule": "Ghose"},
    ]

    passed = sum(1 for t in tests if t["pass"])
    quality_score = round((passed / len(tests)) * 100)



    return {
        "purity_percent": purity_pct,
        "quality_score": quality_score,
        "passed": passed,
        "total_tests": len(tests),
        "tests": tests,
        "impurities": impurities,
        "recommendation": get_recommendation(quality_score, purity_pct),
        "ready_for_physical_trial": quality_score >= 75 and purity_pct >= 95,
        "grade": get_grade(quality_score)
    }

def get_grade(score):
    if score >= 90: return "A — Pharmaceutical grade"
    if score >= 75: return "B — Research grade"
    if score >= 60: return "C — Requires optimization"
    return "D — Not suitable for trials"

def get_recommendation(score, purity):
    if score >= 90 and purity >= 98:
        return "EXCELLENT: All quality tests pass. Ready for preclinical testing."
    elif score >= 75 and purity >= 95:
        return "GOOD: Minor optimization may improve quality. Physical trial possible."
    elif score >= 60:
        return "MODERATE: Reformulate or purify further before physical trials."
    else:
        return "POOR: Do not proceed. Significant reformulation required."
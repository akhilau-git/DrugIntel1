from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from rdkit import Chem
from rdkit.Chem import (
    Descriptors, rdMolDescriptors, FilterCatalog
)
from rdkit.Chem.FilterCatalog import FilterCatalogParams

router = APIRouter()

class DiscoveryInput(BaseModel):
    smiles: str
    target_disease: Optional[str] = "general"
    stage: Optional[str] = "hit"  # hit, lead, candidate

@router.post("/score")
def score_discovery(data: DiscoveryInput):
    mol = Chem.MolFromSmiles(data.smiles)
    if mol is None:
        return {"error": "Invalid SMILES"}

    mw    = Descriptors.MolWt(mol)
    logp  = Descriptors.MolLogP(mol)
    hbd   = rdMolDescriptors.CalcNumHBD(mol)
    hba   = rdMolDescriptors.CalcNumHBA(mol)
    tpsa  = rdMolDescriptors.CalcTPSA(mol)
    rot   = rdMolDescriptors.CalcNumRotatableBonds(mol)
    rings = rdMolDescriptors.CalcNumRings(mol)
    arom  = rdMolDescriptors.CalcNumAromaticRings(mol)
    fsp3  = rdMolDescriptors.CalcFractionCSP3(mol)
    heavy = mol.GetNumHeavyAtoms()
    stereo= rdMolDescriptors.CalcNumAtomStereoCenters(mol)

    # Pan-assay interference (PAINS) filter
    pains_flags = check_pains(mol)
    # Brenk structural alerts
    brenk_flags = check_brenk(mol)

    # Leadlikeness (stricter than Lipinski for leads)
    lead_like = mw <= 450 and logp <= 4 and hbd <= 4 and hba <= 8 and rot <= 7

    # Fragment-like (for fragment-based drug discovery)
    fragment_like = mw <= 300 and logp <= 3 and hbd <= 3 and hba <= 3

    # Synthetic accessibility score (simplified estimate)
    sa_score = estimate_sa(mol, rings, stereo, arom, fsp3)

    stages = score_all_stages(mw, logp, hbd, hba, tpsa, rot, rings, pains_flags, brenk_flags, sa_score)

    overall = stages[data.stage]["score"] if data.stage in stages else stages["hit"]["score"]
    pains_clean = len(pains_flags) == 0

    return {
        "overall_score": overall,
        "stage_scores": stages,
        "current_stage": data.stage,
        "flags": {
            "pains_alerts": pains_flags,
            "pains_clean": pains_clean,
            "brenk_alerts": brenk_flags[:3],
            "lead_like": lead_like,
            "fragment_like": fragment_like,
        },
        "synthetic_accessibility": {
            "score": sa_score,
            "rating": rate_sa(sa_score),
            "note": "1=easy, 10=very difficult to synthesize"
        },
        "pipeline_readiness": assess_pipeline(overall, pains_clean, brenk_flags, sa_score),
        "next_steps": get_next_steps(data.stage, overall, pains_flags),
        "molecule_descriptors": {
            "mw": round(mw,2), "logp": round(logp,3), "hbd": hbd, "hba": hba,
            "tpsa": round(tpsa,2), "rot_bonds": rot, "rings": rings,
            "fsp3": round(fsp3,3), "heavy_atoms": heavy
        }
    }

def check_pains(mol):
    try:
        params = FilterCatalogParams()
        params.AddCatalog(FilterCatalogParams.FilterCatalogs.PAINS)
        catalog = FilterCatalog.FilterCatalog(params)
        matches = catalog.GetMatches(mol)
        return [m.GetDescription() for m in matches]
    except:
        return []

def check_brenk(mol):
    try:
        params = FilterCatalogParams()
        params.AddCatalog(FilterCatalogParams.FilterCatalogs.BRENK)
        catalog = FilterCatalog.FilterCatalog(params)
        matches = catalog.GetMatches(mol)
        return [m.GetDescription() for m in matches]
    except:
        return []

def estimate_sa(mol, rings, stereo, arom, fsp3):
    score = 3.0
    if rings > 4: score += rings * 0.3
    if stereo > 3: score += stereo * 0.4
    if arom > 3: score += 1.0
    if fsp3 < 0.2: score += 1.5
    return round(min(10.0, max(1.0, score)), 1)

def rate_sa(score):
    if score <= 3: return "Easy to synthesize"
    if score <= 5: return "Moderate synthesis"
    if score <= 7: return "Challenging synthesis"
    return "Very difficult — consider simplifying structure"

def score_all_stages(mw, logp, hbd, hba, tpsa, rot, rings, pains, brenk, sa):
    hit = 100
    if mw > 600: hit -= 20
    if logp > 6: hit -= 15
    if hbd > 6: hit -= 10
    if pains: hit -= len(pains) * 15
    if brenk: hit -= len(brenk) * 5

    lead = hit
    if mw > 450: lead -= 20
    if logp > 4: lead -= 15
    if rot > 7: lead -= 10
    if rings > 4: lead -= 10

    candidate = lead
    if tpsa > 140: candidate -= 20
    if sa > 6: candidate -= 15
    if hbd > 4: candidate -= 10

    return {
        "hit":       {"score": max(0, hit),       "label": "Hit identification"},
        "lead":      {"score": max(0, lead),      "label": "Lead optimization"},
        "candidate": {"score": max(0, candidate), "label": "Drug candidate"},
    }

def assess_pipeline(score, pains_clean, brenk, sa):
    if score >= 80 and pains_clean and len(brenk) == 0:
        return {"status": "READY", "stage": "Advance to preclinical", "color": "green"}
    if score >= 60 and pains_clean:
        return {"status": "OPTIMIZE", "stage": "Lead optimization needed", "color": "orange"}
    if score >= 40:
        return {"status": "CAUTION", "stage": "Significant issues — redesign", "color": "red"}
    return {"status": "REJECT", "stage": "Not suitable — start over", "color": "darkred"}

def get_next_steps(stage, score, pains):
    steps = []
    if pains:
        steps.append(f"Remove PAINS alert: {pains[0]} — these cause false positives in assays")
    if stage == "hit":
        steps.append("Confirm activity with in vitro binding assay (IC50)")
        steps.append("Synthesize 5–10 analogs to explore SAR (Structure-Activity Relationship)")
    elif stage == "lead":
        steps.append("Optimize ADMET: improve bioavailability and reduce clearance")
        steps.append("Run selectivity panel against off-target proteins")
        steps.append("Perform metabolic stability assay (microsomal stability)")
    elif stage == "candidate":
        steps.append("GLP toxicology studies in two animal species")
        steps.append("Scale-up synthesis under GMP conditions")
        steps.append("Submit IND (Investigational New Drug) application to FDA/CDSCO")
    return steps
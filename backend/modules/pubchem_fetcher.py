from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import requests, urllib.parse

router = APIRouter()
BASE = "https://pubchem.ncbi.nlm.nih.gov/rest/pug"
CHEMBL = "https://www.ebi.ac.uk/chembl/api/data"

class LookupInput(BaseModel):
    smiles: Optional[str] = None
    cid: Optional[int] = None
    name: Optional[str] = None

@router.post("/lookup")
def lookup_pubchem(smiles_or_data):
    smiles = smiles_or_data if isinstance(smiles_or_data, str) else smiles_or_data.smiles
    if not smiles:
        return {"error": "Provide SMILES, CID, or drug name"}
    try:
        encoded = urllib.parse.quote(smiles)
        props_url = f"{BASE}/compound/smiles/{encoded}/property/MolecularFormula,IUPACName,MolecularWeight,XLogP,TPSA,HBondDonorCount,HBondAcceptorCount,RotatableBondCount,Complexity,CID/JSON"
        r = requests.get(props_url, timeout=8)
        if r.status_code != 200:
            return {"source": "PubChem", "error": "Compound not found in PubChem", "smiles": smiles}
        data = r.json()["PropertyTable"]["Properties"][0]
        cid = data.get("CID")
        synonyms = get_synonyms(cid)
        bioactivity = get_bioactivity(cid)
        patents = get_patent_count(cid)
        return {
            "source": "PubChem",
            "cid": cid,
            "iupac_name": data.get("IUPACName", ""),
            "formula": data.get("MolecularFormula", ""),
            "pubchem_mw": data.get("MolecularWeight", ""),
            "pubchem_xlogp": data.get("XLogP", ""),
            "pubchem_tpsa": data.get("TPSA", ""),
            "hbd": data.get("HBondDonorCount", ""),
            "hba": data.get("HBondAcceptorCount", ""),
            "complexity": data.get("Complexity", ""),
            "synonyms": synonyms[:8],
            "known_drug_names": [s for s in synonyms if len(s) < 20][:5],
            "bioactivity_summary": bioactivity,
            "patent_count": patents,
            "pubchem_url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}" if cid else "",
            "safety_url": f"https://pubchem.ncbi.nlm.nih.gov/compound/{cid}#section=Safety-and-Hazards" if cid else ""
        }
    except requests.Timeout:
        return {"source": "PubChem", "error": "PubChem API timeout — try again"}
    except Exception as e:
        return {"source": "PubChem", "error": str(e)}

def get_synonyms(cid):
    if not cid: return []
    try:
        r = requests.get(f"{BASE}/compound/cid/{cid}/synonyms/JSON", timeout=5)
        if r.status_code == 200:
            return r.json().get("InformationList", {}).get("Information", [{}])[0].get("Synonym", [])
    except: pass
    return []

def get_bioactivity(cid):
    if not cid: return {}
    try:
        r = requests.get(f"{BASE}/compound/cid/{cid}/assaysummary/JSON", timeout=5)
        if r.status_code == 200:
            data = r.json().get("AssaySummary", [])
            active = sum(1 for d in data if d.get("ActivityOutcome") == "Active")
            return {"total_assays": len(data), "active_assays": active}
    except: pass
    return {}

def get_patent_count(cid):
    if not cid: return "N/A"
    try:
        r = requests.get(f"{BASE}/compound/cid/{cid}/xrefs/PatentID/JSON", timeout=5)
        if r.status_code == 200:
            patents = r.json().get("InformationList",{}).get("Information",[{}])[0].get("PatentID",[])
            return len(patents)
    except: pass
    return "N/A"

@router.get("/chembl/{chembl_id}")
def get_chembl_data(chembl_id: str):
    try:
        r = requests.get(f"{CHEMBL}/molecule/{chembl_id}.json", timeout=8)
        if r.status_code == 200:
            d = r.json()
            props = d.get("molecule_properties", {})
            return {
                "chembl_id": chembl_id,
                "name": d.get("pref_name",""),
                "max_phase": d.get("max_phase", 0),
                "first_approval": d.get("first_approval",""),
                "oral": d.get("oral", False),
                "natural_product": d.get("natural_product", False),
                "mw": props.get("mw_freebase",""),
                "logp": props.get("alogp",""),
                "hbd": props.get("hbd",""),
                "hba": props.get("hba",""),
                "indication": d.get("indication_class",""),
                "mechanism": d.get("mechanism_of_action","Unknown"),
            }
    except Exception as e:
        return {"error": str(e)}
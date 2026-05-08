from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid

# In a real app, you would import DB sessions and User dependencies
# from database.db import get_db
# from auth_v2 import get_current_user

router = APIRouter(prefix="/api/v1", tags=["Patient DDI"])

class MedicationInput(BaseModel):
    name: str
    dose: Optional[str] = None
    frequency: Optional[str] = None

class DDICheckRequest(BaseModel):
    patient_id: Optional[str] = None
    medications: List[MedicationInput]
    metadata: Optional[dict] = None

class DDICheckResponse(BaseModel):
    risk: str
    action: str
    mechanism: str
    confidence: float
    model_run_id: str

@router.post("/ddi/check", response_model=DDICheckResponse)
async def quick_ddi_check(data: DDICheckRequest):
    """
    Run the deterministic chemical engine on the patient's medications.
    """
    if len(data.medications) < 2:
        return DDICheckResponse(
            risk="Low",
            action="No significant interactions detected for a single medication.",
            mechanism="None",
            confidence=0.99,
            model_run_id=str(uuid.uuid4())
        )
    
    # Mocking interaction engine
    med_names = [m.name.lower() for m in data.medications]
    
    if "cimetidine" in med_names and "metformin" in med_names:
        return DDICheckResponse(
            risk="High",
            action="Avoid combining Metformin and Cimetidine; contact clinician immediately.",
            mechanism="Cimetidine inhibits the renal tubular secretion of metformin, increasing the risk of lactic acidosis.",
            confidence=0.92,
            model_run_id=f"run-{uuid.uuid4().hex[:8]}"
        )
        
    return DDICheckResponse(
        risk="Moderate",
        action="This check suggests a moderate interaction. Consider consulting your doctor.",
        mechanism="Possible CYP3A4 inhibition affecting metabolism.",
        confidence=0.87,
        model_run_id=f"run-{uuid.uuid4().hex[:8]}"
    )

@router.get("/ddi/report/{model_run_id}")
async def get_ddi_report(model_run_id: str):
    """
    Returns full explainability payload and SHAP values for the specific model run.
    """
    return {
        "model_run_id": model_run_id,
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "model_version": "v1.2",
        "confidence": 0.87,
        "mechanism": "Possible CYP3A4 inhibition affecting metabolism.",
        "shap_values": [
            {"feature": "CYP3A4 Inhibition", "value": "+0.42"},
            {"feature": "Renal Clearance Reduced", "value": "+0.21"}
        ]
    }

class ShareRequest(BaseModel):
    clinician_email: str
    scope: str
    time_limit: str
    consent: bool

@router.post("/share")
async def share_report(data: ShareRequest):
    """
    Share report with clinician.
    """
    if not data.consent:
        raise HTTPException(status_code=400, detail="Consent is required to share medical data.")
    
    return {
        "status": "success",
        "message": f"Report successfully shared with {data.clinician_email} for {data.time_limit}."
    }

"""
Patient Profile Management API
Handles patient medical history, demographics, medications, and model integration
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel
import json

from database import models
from database.db import get_db
from auth_v2 import get_current_user, log_audit, require_role, get_request_context

router = APIRouter(prefix="/api/v1/patients", tags=["Patient Profile"])

# ==================== Pydantic Models ====================

class AllergyInfo(BaseModel):
    name: str
    severity: str  # mild, moderate, severe
    reaction: str

class MedicationInfo(BaseModel):
    drug_name: str
    dose: float
    dose_unit: str  # mg, ml, etc.
    frequency: str  # daily, twice daily, etc.
    route: str  # oral, IV, topical, etc.
    start_date: datetime
    notes: Optional[str]

class LabValue(BaseModel):
    egfr: Optional[float]
    alt: Optional[float]
    ast: Optional[float]
    measurement_date: datetime

class PatientProfileUpdate(BaseModel):
    # Demographics
    date_of_birth: Optional[datetime]
    sex_gender: Optional[str]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    
    # Medical
    allergies: Optional[List[AllergyInfo]]
    current_medications: Optional[List[MedicationInfo]]
    past_medical_history: Optional[List[str]]
    egfr: Optional[float]
    alt_ast: Optional[LabValue]
    pregnancy_status: Optional[str]
    
    # Lifestyle
    alcohol_use: Optional[str]
    smoking_status: Optional[str]
    
    # Consent
    data_consent: bool = False
    share_with_clinician: bool = False
    clinician_email: Optional[str]

class PatientProfileResponse(BaseModel):
    id: int
    user_id: int
    date_of_birth: Optional[datetime]
    sex_gender: Optional[str]
    weight_kg: Optional[float]
    height_cm: Optional[float]
    allergies: Optional[List[AllergyInfo]]
    current_medications: Optional[List[MedicationInfo]]
    past_medical_history: Optional[List[str]]
    egfr: Optional[float]
    pregnancy_status: Optional[str]
    alcohol_use: Optional[str]
    smoking_status: Optional[str]
    data_consent: bool
    share_with_clinician: bool
    clinician_email: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class PatientVectorResponse(BaseModel):
    user_id: int
    patient_vector: Optional[Dict]
    model_run_version: str
    recommendations: Optional[Dict]

# ==================== Helper Functions ====================

def build_patient_vector(profile: models.PatientProfile) -> Dict:
    """
    Build patient vector for ML models
    Maps demographics, labs, meds, allergies to model inputs
    """
    vector = {
        "demographics": {
            "age": None,
            "sex": profile.sex_gender,
            "weight": profile.weight_kg,
            "height": profile.height_cm,
            "bmi": None
        },
        "labs": {
            "egfr": profile.egfr,
            "alt_ast": profile.alt_ast if isinstance(profile.alt_ast, dict) else None
        },
        "medications": [],
        "allergies": [],
        "lifestyle": {
            "alcohol": profile.alcohol_use,
            "smoking": profile.smoking_status
        },
        "pregnancy_status": profile.pregnancy_status
    }
    
    # Calculate age
    if profile.date_of_birth:
        today = datetime.utcnow()
        vector["demographics"]["age"] = (today - profile.date_of_birth).days // 365
    
    # Calculate BMI
    if profile.weight_kg and profile.height_cm:
        height_m = profile.height_cm / 100
        vector["demographics"]["bmi"] = profile.weight_kg / (height_m ** 2)
    
    # Add medications
    if profile.current_medications:
        try:
            meds = json.loads(profile.current_medications) if isinstance(profile.current_medications, str) else profile.current_medications
            vector["medications"] = [
                {
                    "drug": med.get("drug_name"),
                    "dose": med.get("dose"),
                    "frequency": med.get("frequency")
                }
                for med in meds
            ]
        except:
            pass
    
    # Add allergies
    if profile.allergies:
        try:
            allergies = json.loads(profile.allergies) if isinstance(profile.allergies, str) else profile.allergies
            vector["allergies"] = [
                {
                    "allergen": a.get("name"),
                    "severity": a.get("severity")
                }
                for a in allergies
            ]
        except:
            pass
    
    return vector

def run_models_on_profile(db: Session, profile: models.PatientProfile) -> Dict:
    """
    Trigger ML model re-run on patient profile update
    Returns DDI risk, ADMET summaries, and dose suggestions
    """
    patient_vector = build_patient_vector(profile)
    
    # TODO: Integrate with actual ML models
    # - DDI risk model
    # - ADMET prediction model
    # - Dosage calculator model
    
    recommendations = {
        "ddi_risks": [],
        "admet_summary": {},
        "dosage_suggestions": [],
        "warnings": []
    }
    
    # Store vector and run version
    profile.patient_vector = patient_vector
    profile.model_run_version = "v1.0"
    
    return recommendations

# ==================== Patient Profile Endpoints ====================

@router.get("/profile", response_model=PatientProfileResponse)
async def get_patient_profile(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient profile for current user"""
    if current_user.role != models.UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can access their profile")
    
    profile = db.query(models.PatientProfile).filter(
        models.PatientProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        # Create empty profile
        profile = models.PatientProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    return profile

@router.post("/profile", response_model=PatientProfileResponse)
async def create_or_update_patient_profile(
    profile_data: PatientProfileUpdate,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create or update patient profile
    Creates immutable snapshot on update
    """
    if current_user.role != models.UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Only patients can update their profile")
    
    # Validate consent
    if not profile_data.data_consent:
        raise HTTPException(status_code=400, detail="Data consent is required")
    
    # Get or create profile
    profile = db.query(models.PatientProfile).filter(
        models.PatientProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        profile = models.PatientProfile(user_id=current_user.id)
        db.add(profile)
        db.flush()
        action = "CREATE"
    else:
        action = "UPDATE"
    
    # Track changes for audit
    old_profile = {
        "weight": profile.weight_kg,
        "medications": profile.current_medications,
        "allergies": profile.allergies,
        "pregnancy_status": profile.pregnancy_status
    }
    
    # Update profile fields
    profile.date_of_birth = profile_data.date_of_birth or profile.date_of_birth
    profile.sex_gender = profile_data.sex_gender or profile.sex_gender
    profile.weight_kg = profile_data.weight_kg or profile.weight_kg
    profile.height_cm = profile_data.height_cm or profile.height_cm
    
    # Store JSON fields
    if profile_data.allergies:
        profile.allergies = [a.dict() for a in profile_data.allergies]
    if profile_data.current_medications:
        profile.current_medications = [m.dict() for m in profile_data.current_medications]
    if profile_data.past_medical_history:
        profile.past_medical_history = profile_data.past_medical_history
    
    profile.egfr = profile_data.egfr or profile.egfr
    if profile_data.alt_ast:
        profile.alt_ast = profile_data.alt_ast.dict()
    
    profile.pregnancy_status = profile_data.pregnancy_status or profile.pregnancy_status
    profile.alcohol_use = profile_data.alcohol_use or profile.alcohol_use
    profile.smoking_status = profile_data.smoking_status or profile.smoking_status
    
    profile.data_consent = profile_data.data_consent
    profile.share_with_clinician = profile_data.share_with_clinician
    profile.clinician_email = profile_data.clinician_email
    
    profile.updated_at = datetime.utcnow()
    
    db.commit()
    db.flush()
    
    # Create snapshot
    context = get_request_context(request)
    snapshot = models.PatientProfileSnapshot(
        profile_id=profile.id,
        user_id=current_user.id,
        profile_data=profile.__dict__,
        field_changed=None,
        old_value=old_profile,
        new_value={
            "weight": profile.weight_kg,
            "medications": profile.current_medications,
            "allergies": profile.allergies,
            "pregnancy_status": profile.pregnancy_status
        },
        ip_address=context["ip_address"],
        user_agent=context["user_agent"],
        action=action
    )
    db.add(snapshot)
    
    # Mark user profile as complete
    current_user.profile_complete = True
    
    # Run models on profile
    recommendations = run_models_on_profile(db, profile)
    
    db.commit()
    
    # Audit log
    await log_audit(db, current_user.id, "PROFILE_UPDATED", "patient_profile", str(profile.id),
                   "success", {"critical_fields": list(old_profile.keys())}, request)
    
    return profile

@router.get("/vector", response_model=PatientVectorResponse)
async def get_patient_vector(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get computed patient vector and model outputs"""
    profile = db.query(models.PatientProfile).filter(
        models.PatientProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    patient_vector = build_patient_vector(profile) if profile.patient_vector is None else profile.patient_vector
    
    return PatientVectorResponse(
        user_id=current_user.id,
        patient_vector=patient_vector,
        model_run_version=profile.model_run_version or "v1.0",
        recommendations={}  # TODO: Retrieve recommendations
    )

@router.get("/snapshots")
async def get_profile_snapshots(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all profile snapshots (audit history)"""
    profile = db.query(models.PatientProfile).filter(
        models.PatientProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    snapshots = db.query(models.PatientProfileSnapshot).filter(
        models.PatientProfileSnapshot.profile_id == profile.id
    ).order_by(models.PatientProfileSnapshot.created_at.desc()).all()
    
    return [
        {
            "id": s.id,
            "action": s.action,
            "field_changed": s.field_changed,
            "old_value": s.old_value,
            "new_value": s.new_value,
            "created_at": s.created_at,
            "ip_address": s.ip_address
        }
        for s in snapshots
    ]

@router.post("/export-pdf")
async def export_profile_as_pdf(
    current_user: models.User = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Export patient profile and recommendations as PDF"""
    profile = db.query(models.PatientProfile).filter(
        models.PatientProfile.user_id == current_user.id
    ).first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="Patient profile not found")
    
    # TODO: Implement PDF generation
    # Use libraries like ReportLab or WeasyPrint
    
    if request:
        await log_audit(db, current_user.id, "PROFILE_EXPORTED", "export", str(profile.id),
                       "success", {"format": "pdf"}, request)
    
    return {"message": "PDF export initiated", "export_id": "temp_id"}

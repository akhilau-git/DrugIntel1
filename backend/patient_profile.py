from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database.models import PatientProfile, PatientProfileSnapshot, User
from database.db import get_db
from auth_v2 import get_current_user
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List

router = APIRouter(prefix="/api/v1/patients", tags=["patients"])

# Pydantic Models
class MedicationInput(BaseModel):
    name: str = Field(..., max_length=200)
    dose_mg: float = Field(..., ge=0.01)
    frequency: str
    route: Optional[str] = Field(None, max_length=100)
    start_date: Optional[str] = None

class PatientProfileCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=200)
    email: EmailStr
    mobile: str = Field(..., pattern=r"^\+?[1-9]\d{7,14}$")
    date_of_birth: str
    sex: str
    weight_kg: float = Field(..., ge=20, le=300)
    height_cm: Optional[float] = Field(None, ge=50, le=250)
    allergies: List[str] = []
    current_medications: List[MedicationInput] = []
    chronic_conditions: List[str] = []
    egfr_ml_min_173m2: Optional[float] = Field(None, ge=0)
    alt_u_l: Optional[float] = Field(None, ge=0)
    ast_u_l: Optional[float] = Field(None, ge=0)
    pregnancy_status: Optional[str] = None
    alcohol_use: Optional[str] = None
    smoking_status: Optional[str] = None
    share_with_clinician: bool = False
    consent: bool
    metadata_fields: Optional[dict] = Field(None, alias="metadata")

@router.post("/profile")
async def create_or_update_profile(
    profile_data: PatientProfileCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update patient profile"""
    
    user = db.query(User).filter(User.id == current_user.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if profile exists
    patient_profile = db.query(PatientProfile).filter(
        PatientProfile.user_id == user.id
    ).first()
    
    # Prepare profile data
    profile_dict = {
        "user_id": user.id,
        "full_name": profile_data.full_name,
        "email": profile_data.email,
        "mobile": profile_data.mobile,
        "date_of_birth": datetime.strptime(profile_data.date_of_birth, "%Y-%m-%d") if profile_data.date_of_birth else None,
        "sex_gender": profile_data.sex,
        "weight_kg": profile_data.weight_kg,
        "height_cm": profile_data.height_cm,
        "allergies": profile_data.allergies,
        "current_medications": [m.dict() for m in profile_data.current_medications],
        "past_medical_history": profile_data.chronic_conditions,
        "egfr": profile_data.egfr_ml_min_173m2,
        "alt_ast": {"alt": profile_data.alt_u_l, "ast": profile_data.ast_u_l} if (profile_data.alt_u_l or profile_data.ast_u_l) else None,
        "pregnancy_status": profile_data.pregnancy_status,
        "alcohol_use": profile_data.alcohol_use,
        "smoking_status": profile_data.smoking_status,
        "data_consent": profile_data.consent,
        "share_with_clinician": profile_data.share_with_clinician,
        "updated_at": datetime.utcnow()
    }
    
    if patient_profile:
        # Update existing profile
        for key, value in profile_dict.items():
            if key != "updated_at":
                setattr(patient_profile, key, value)
        patient_profile.updated_at = datetime.utcnow()
        action = "update"
    else:
        # Create new profile
        patient_profile = PatientProfile(**profile_dict)
        db.add(patient_profile)
        action = "create"
    
    db.flush()
    
    # Create immutable snapshot
    snapshot = PatientProfileSnapshot(
        user_id=user.id,
        profile_id=patient_profile.id,
        profile_data=profile_dict,
        action=action,
        created_at=datetime.utcnow()
    )
    db.add(snapshot)
    
    # Mark user profile as complete
    user.profile_complete = True
    
    db.commit()
    db.refresh(patient_profile)
    
    return {
        "message": "Profile saved successfully",
        "profile_complete": True,
        "last_model_run_id": f"mod_{snapshot.id}",
        "confidence_score": 0.92 if profile_data.weight_kg else 0.75
    }

@router.get("/profile")
async def get_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get patient profile"""
    
    user = db.query(User).filter(User.id == current_user.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    patient_profile = db.query(PatientProfile).filter(
        PatientProfile.user_id == user.id
    ).first()
    
    if not patient_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    return {
        "id": patient_profile.id,
        "user_id": patient_profile.user_id,
        "full_name": patient_profile.full_name,
        "email": patient_profile.email,
        "mobile": patient_profile.mobile,
        "date_of_birth": patient_profile.date_of_birth,
        "sex_gender": patient_profile.sex_gender,
        "weight_kg": patient_profile.weight_kg,
        "height_cm": patient_profile.height_cm,
        "allergies": patient_profile.allergies,
        "current_medications": patient_profile.current_medications,
        "chronic_conditions": patient_profile.chronic_conditions,
        "lifestyle": patient_profile.lifestyle,
        "consent_data": patient_profile.consent_data,
        "share_with_clinician": patient_profile.share_with_clinician,
        "created_at": patient_profile.created_at,
        "updated_at": patient_profile.updated_at
    }

@router.get("/profile/snapshots")
async def get_profile_snapshots(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get profile update history (immutable snapshots)"""
    
    user = db.query(User).filter(User.id == current_user.get("sub")).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    snapshots = db.query(PatientProfileSnapshot).filter(
        PatientProfileSnapshot.user_id == user.id
    ).order_by(PatientProfileSnapshot.created_at.desc()).limit(limit).all()
    
    return [
        {
            "id": s.id,
            "profile_data": s.profile_data,
            "created_at": s.created_at
        }
        for s in snapshots
    ]

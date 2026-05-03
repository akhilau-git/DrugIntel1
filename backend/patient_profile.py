from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database.models import PatientProfile, PatientProfileSnapshot, User
from database.db import get_db
from auth_v2 import get_current_user
from pydantic import BaseModel
from typing import Optional, List

router = APIRouter(prefix="/api/v1/patients", tags=["patients"])

# Pydantic Models
class MedicationInput(BaseModel):
    name: str
    dose: str
    frequency: str
    startDate: Optional[str] = None

class PatientProfileCreate(BaseModel):
    user_id: str
    full_name: Optional[str] = None
    email: Optional[str] = None
    mobile: Optional[str] = None
    date_of_birth: Optional[str] = None
    sex_gender: Optional[str] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    allergies: Optional[str] = None
    current_medications: Optional[List[MedicationInput]] = None
    chronic_conditions: Optional[List[str]] = None
    lifestyle: Optional[dict] = None
    consent_data: bool = False
    share_with_clinician: bool = False

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
        "full_name": profile_data.full_name or user.full_name,
        "email": profile_data.email or user.email,
        "mobile": profile_data.mobile or "",
        "date_of_birth": profile_data.date_of_birth,
        "sex_gender": profile_data.sex_gender or "not_specified",
        "weight_kg": profile_data.weight_kg,
        "height_cm": profile_data.height_cm,
        "allergies": profile_data.allergies or "",
        "current_medications": [
            {"name": m.name, "dose": m.dose, "frequency": m.frequency}
            for m in (profile_data.current_medications or [])
        ],
        "chronic_conditions": profile_data.chronic_conditions or [],
        "lifestyle": profile_data.lifestyle or {"alcohol": "not_specified", "smoking": "not_specified"},
        "consent_data": profile_data.consent_data,
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
        "profile_complete": True
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

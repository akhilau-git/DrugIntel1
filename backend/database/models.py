from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey, JSON, Enum, LargeBinary
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database.db import Base
import enum

# Enums for roles
class UserRole(str, enum.Enum):
    PATIENT = "patient"
    DOCTOR = "doctor"
    PHARMACIST = "pharmacist"
    CHEMIST = "chemist"
    RESEARCH_SCIENTIST = "research_scientist"
    AUDITOR = "auditor"
    ADMIN = "admin"

class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    NEEDS_INFO = "needs_info"

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"
    id          = Column(Integer, primary_key=True, index=True)
    smiles      = Column(Text, nullable=False)
    drug_name   = Column(String(200), default="")
    mw          = Column(Float)
    logp        = Column(Float)
    drug_score  = Column(Float)
    purity_pct  = Column(Float)
    rf_value    = Column(Float)
    lipinski    = Column(Boolean)
    properties  = Column(Text)  # JSON blob
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class DrugInteractionRecord(Base):
    __tablename__ = "drug_interactions"
    id          = Column(Integer, primary_key=True, index=True)
    smiles1     = Column(Text, nullable=False)
    smiles2     = Column(Text, nullable=False)
    drug1_name  = Column(String(200), default="")
    drug2_name  = Column(String(200), default="")
    risk_level  = Column(String(50))
    confidence  = Column(Float)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())



class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=True)
    password_hash = Column(String(200), nullable=True)
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    mobile = Column(String(20), nullable=True)
    organization = Column(String(100), nullable=True)
    industry = Column(String(50), nullable=True)
    role = Column(Enum(UserRole), default=UserRole.PATIENT)
    is_verified = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    mfa_enabled = Column(Boolean, default=False)
    profile_complete = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user")
    patient_profile = relationship("PatientProfile", back_populates="user", uselist=False)
    oauth_identities = relationship("OAuthIdentity", back_populates="user")
    sessions = relationship("Session", back_populates="user")

class PatientProfile(Base):
    __tablename__ = "patient_profiles"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    
    # Demographics
    date_of_birth = Column(DateTime(timezone=True), nullable=True)
    sex_gender = Column(String(50), nullable=True)  # male, female, other, prefer_not_to_say
    weight_kg = Column(Float, nullable=True)
    height_cm = Column(Float, nullable=True)
    
    # Medical
    allergies = Column(JSON, nullable=True)  # list of allergies and severity
    current_medications = Column(JSON, nullable=True)  # structured list
    past_medical_history = Column(JSON, nullable=True)  # chronic conditions
    egfr = Column(Float, nullable=True)
    alt_ast = Column(JSON, nullable=True)  # {alt: value, ast: value, date: timestamp}
    pregnancy_status = Column(String(50), nullable=True)  # not_applicable, pregnant, not_pregnant, unknown
    
    # Lifestyle
    alcohol_use = Column(String(50), nullable=True)  # none, light, moderate, heavy
    smoking_status = Column(String(50), nullable=True)  # never, former, current
    
    # Consent & Sharing
    data_consent = Column(Boolean, default=False)
    share_with_clinician = Column(Boolean, default=False)
    clinician_email = Column(String(100), nullable=True)
    
    # Model
    patient_vector = Column(JSON, nullable=True)  # computed patient vector for models
    model_run_version = Column(String(50), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="patient_profile")
    snapshots = relationship("PatientProfileSnapshot", back_populates="profile")

class PatientProfileSnapshot(Base):
    __tablename__ = "patient_profile_snapshots"
    id = Column(Integer, primary_key=True, index=True)
    profile_id = Column(Integer, ForeignKey("patient_profiles.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    
    # Snapshot data
    profile_data = Column(JSON)  # Full profile snapshot
    field_changed = Column(String(200), nullable=True)
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    
    # Audit
    ip_address = Column(String(45), nullable=True)
    user_agent = Column(Text, nullable=True)
    action = Column(String(50))  # 'create', 'update', 'delete'
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    profile = relationship("PatientProfile", back_populates="snapshots")

class OAuthIdentity(Base):
    __tablename__ = "oauth_identities"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    provider = Column(String(50))  # 'google', 'github', etc.
    provider_id = Column(String(200), unique=True)
    provider_email = Column(String(100))
    profile_data = Column(JSON)  # Store full provider profile
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="oauth_identities")

class Session(Base):
    __tablename__ = "sessions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    device_id = Column(String(200), unique=True)
    device_name = Column(String(200))
    device_type = Column(String(50))  # 'mobile', 'desktop', 'tablet'
    browser = Column(String(100))
    os = Column(String(100))
    ip_address = Column(String(45))
    
    access_token_hash = Column(String(200))
    refresh_token_hash = Column(String(200))
    
    is_active = Column(Boolean, default=True)
    last_activity = Column(DateTime(timezone=True), server_default=func.now())
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    
    # Relationships
    user = relationship("User", back_populates="sessions")

class Verification(Base):
    __tablename__ = "verifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    email = Column(String(100))
    role = Column(Enum(UserRole))
    
    # Required documents
    license_number = Column(String(100), nullable=True)
    license_scan = Column(LargeBinary, nullable=True)
    institution_email = Column(String(100), nullable=True)
    institution_name = Column(String(200), nullable=True)
    orcid = Column(String(50), nullable=True)
    employee_id = Column(String(100), nullable=True)
    documents = Column(JSON, nullable=True)
    
    # Verification details
    status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING)
    reviewer_notes = Column(Text, nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)

class PasswordReset(Base):
    __tablename__ = "password_resets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    email = Column(String(100))
    otp = Column(String(6))
    otp_attempts = Column(Integer, default=0)
    is_used = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    action = Column(String(200))
    resource_type = Column(String(100))  # 'auth', 'profile', 'model_run', 'export', etc.
    resource_id = Column(String(200), nullable=True)
    details = Column(JSON)
    
    # Request context
    ip_address = Column(String(45))
    user_agent = Column(Text, nullable=True)
    status = Column(String(50))  # 'success', 'failure'
    error_message = Column(Text, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="audit_logs")
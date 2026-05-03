"""
Comprehensive Authentication and Authorization Module for DrugIntel
Supports: Email/Password, Google OAuth, MFA, Role-based Access, Token Management
"""

from datetime import datetime, timedelta
from typing import Optional, List, Dict
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import jwt
import bcrypt
import secrets
import string
from pydantic import BaseModel, EmailStr, validator
import os
import hashlib
from functools import lru_cache

from database import models
from database.db import get_db

# Configuration
SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_enterprise_key_2026_drugintel")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 15
REFRESH_TOKEN_EXPIRE_DAYS = 7
OTP_EXPIRE_MINUTES = 10

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/login", auto_error=False)
router = APIRouter(prefix="/api/v1/auth", tags=["Authentication"])

# ==================== Pydantic Models ====================

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: Optional[str]
    token_type: str
    role: str
    user_id: int
    full_name: str
    profile_complete: bool
    mfa_required: bool = False

class UserLoginRequest(BaseModel):
    email: str
    password: str
    device_id: Optional[str] = None
    device_name: Optional[str] = None
    remember_me: bool = False

class UserSignupRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    mobile: Optional[str]
    role: models.UserRole = models.UserRole.PATIENT
    organization: Optional[str]
    industry: Optional[str]

class GoogleOAuthRequest(BaseModel):
    token: str  # Google ID token
    device_id: Optional[str]
    device_name: Optional[str]

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class VerifyOTPRequest(BaseModel):
    email: str
    otp: str
    new_password: str

class ResendOTPRequest(BaseModel):
    email: EmailStr

class RefreshTokenRequest(BaseModel):
    refresh_token: str

class LogoutRequest(BaseModel):
    device_id: Optional[str]
    global_logout: bool = False

class SessionResponse(BaseModel):
    id: int
    device_id: str
    device_name: str
    device_type: str
    browser: str
    os: str
    ip_address: str
    is_active: bool
    last_activity: datetime
    created_at: datetime
    
    class Config:
        from_attributes = True

# ==================== Utility Functions ====================

def get_password_hash(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify plain password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_token(data: dict, expires_delta: Optional[timedelta] = None, token_type: str = "access") -> str:
    """Create JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        if token_type == "refresh":
            expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        else:
            expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": token_type})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Dict:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

def generate_otp() -> str:
    """Generate 6-digit OTP"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))

def hash_token(token: str) -> str:
    """Hash token for storage"""
    return hashlib.sha256(token.encode()).hexdigest()

def get_request_context(request: Request) -> Dict:
    """Extract request context for audit logging"""
    return {
        "ip_address": request.client.host if request.client else "unknown",
        "user_agent": request.headers.get("user-agent", "unknown"),
    }

# ==================== Dependency Functions ====================

async def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> models.User:
    """Get current authenticated user from token"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    payload = decode_token(token)
    if payload.get("type") != "access":
        raise HTTPException(status_code=401, detail="Invalid token type")
    
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    return user

def require_role(*allowed_roles):
    """Dependency to check user role"""
    async def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return role_checker

async def log_audit(
    db: Session,
    user_id: Optional[int],
    action: str,
    resource_type: str,
    resource_id: Optional[str],
    status: str,
    details: Optional[Dict],
    request: Request
):
    """Log audit event"""
    context = get_request_context(request)
    audit = models.AuditLog(
        user_id=user_id,
        action=action,
        resource_type=resource_type,
        resource_id=resource_id,
        status=status,
        details=details or {},
        ip_address=context["ip_address"],
        user_agent=context["user_agent"]
    )
    db.add(audit)
    db.commit()

# ==================== Authentication Endpoints ====================

@router.post("/login", response_model=TokenResponse)
async def login(
    credentials: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Email/password login endpoint
    Returns access token, refresh token, and user info
    """
    context = get_request_context(request)
    
    # Find user by email
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not user.password_hash or not verify_password(credentials.password, user.password_hash):
        await log_audit(db, None, "LOGIN_FAILED", "auth", None, "failure", 
                       {"reason": "invalid_credentials"}, request)
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.is_active:
        await log_audit(db, user.id, "LOGIN_FAILED", "auth", None, "failure",
                       {"reason": "account_inactive"}, request)
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    # Check if MFA is required
    if user.mfa_enabled and user.role != models.UserRole.PATIENT:
        # TODO: Implement MFA challenge
        return TokenResponse(
            access_token="",
            refresh_token=None,
            token_type="bearer",
            role=user.role,
            user_id=user.id,
            full_name=user.full_name,
            profile_complete=user.profile_complete,
            mfa_required=True
        )
    
    # Create tokens
    access_token = create_token({"sub": user.id, "email": user.email}, token_type="access")
    refresh_token = create_token({"sub": user.id, "email": user.email}, token_type="refresh")
    
    # Create session if device_id provided
    if credentials.device_id:
        # Hash tokens for storage
        session = models.Session(
            user_id=user.id,
            device_id=credentials.device_id,
            device_name=credentials.device_name or "Unknown",
            device_type="web",  # TODO: Parse from user agent
            browser="Browser",  # TODO: Parse from user agent
            os="OS",  # TODO: Parse from user agent
            ip_address=context["ip_address"],
            access_token_hash=hash_token(access_token),
            refresh_token_hash=hash_token(refresh_token),
            expires_at=datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        )
        db.add(session)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Audit log
    await log_audit(db, user.id, "LOGIN", "auth", str(user.id), "success", None, request)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token if credentials.remember_me else None,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        profile_complete=user.profile_complete
    )

@router.post("/oauth/google", response_model=TokenResponse)
async def google_oauth_login(
    oauth_data: GoogleOAuthRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Google OAuth login endpoint
    Creates or links Patient account only
    """
    # TODO: Validate Google token and extract google_id, email, name
    # For now, using placeholder
    google_id = "temp_google_id"
    email = "user@example.com"
    name = "User Name"
    
    context = get_request_context(request)
    
    # Check if OAuth identity exists
    oauth_identity = db.query(models.OAuthIdentity).filter(
        models.OAuthIdentity.provider == "google",
        models.OAuthIdentity.provider_id == google_id
    ).first()
    
    user = None
    if oauth_identity:
        user = oauth_identity.user
    else:
        # Check if email exists
        user = db.query(models.User).filter(models.User.email == email).first()
        if user:
            # Link OAuth identity to existing user
            if user.role != models.UserRole.PATIENT:
                await log_audit(db, None, "GOOGLE_LOGIN_FAILED", "auth", None, "failure",
                               {"reason": "role_mismatch"}, request)
                raise HTTPException(status_code=403, detail="Google login only allowed for patients")
        else:
            # Create new patient account
            user = models.User(
                email=email,
                full_name=name,
                role=models.UserRole.PATIENT,
                is_verified=True,  # Email verified via Google
                profile_complete=False
            )
            db.add(user)
            db.flush()
        
        # Create OAuth identity
        oauth_id = models.OAuthIdentity(
            user_id=user.id,
            provider="google",
            provider_id=google_id,
            provider_email=email,
            profile_data={"name": name}
        )
        db.add(oauth_id)
    
    if not user.is_active:
        await log_audit(db, user.id, "GOOGLE_LOGIN_FAILED", "auth", None, "failure",
                       {"reason": "account_inactive"}, request)
        raise HTTPException(status_code=403, detail="Account is inactive")
    
    # Create tokens
    access_token = create_token({"sub": user.id, "email": user.email}, token_type="access")
    refresh_token = create_token({"sub": user.id, "email": user.email}, token_type="refresh")
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Audit log
    await log_audit(db, user.id, "GOOGLE_LOGIN", "auth", str(user.id), "success", None, request)
    
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        full_name=user.full_name,
        profile_complete=user.profile_complete
    )

@router.post("/signup")
async def signup(
    signup_data: UserSignupRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Role-based signup endpoint
    Patients: immediate account creation
    Professionals: requires verification
    """
    context = get_request_context(request)
    
    # Check if email exists
    existing_user = db.query(models.User).filter(models.User.email == signup_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user account
    user = models.User(
        email=signup_data.email,
        full_name=signup_data.full_name,
        mobile=signup_data.mobile,
        password_hash=get_password_hash(signup_data.password),
        role=signup_data.role,
        organization=signup_data.organization,
        industry=signup_data.industry,
        is_verified=signup_data.role == models.UserRole.PATIENT
    )
    
    db.add(user)
    db.flush()
    
    # For professionals, create verification entry
    if signup_data.role != models.UserRole.PATIENT:
        verification = models.Verification(
            user_id=user.id,
            email=signup_data.email,
            role=signup_data.role,
            status=models.VerificationStatus.PENDING
        )
        db.add(verification)
        response = {
            "message": "Account created. Please submit verification documents.",
            "user_id": user.id,
            "verification_required": True
        }
    else:
        response = {
            "message": "Patient account created successfully",
            "user_id": user.id,
            "verification_required": False
        }
    
    db.commit()
    
    # Audit log
    await log_audit(db, user.id, "SIGNUP", "auth", str(user.id), "success",
                   {"role": signup_data.role}, request)
    
    return response

@router.post("/forgot-password")
async def forgot_password(
    request_data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Initiate password reset flow
    Sends OTP to email
    """
    user = db.query(models.User).filter(models.User.email == request_data.email).first()
    if not user:
        # Don't reveal if email exists for security
        return {"message": "If email exists, OTP has been sent"}
    
    # Generate OTP
    otp = generate_otp()
    expires_at = datetime.utcnow() + timedelta(minutes=OTP_EXPIRE_MINUTES)
    
    # Store password reset record
    reset = models.PasswordReset(
        user_id=user.id,
        email=request_data.email,
        otp=otp,
        expires_at=expires_at
    )
    db.add(reset)
    db.commit()
    
    # TODO: Send email with OTP
    # send_email(request_data.email, "Password Reset OTP", f"Your OTP is: {otp}")
    
    # Audit log
    await log_audit(db, user.id, "FORGOT_PASSWORD", "auth", str(user.id), "success", None, request)
    
    return {"message": "OTP sent to email"}

@router.post("/verify-otp")
async def verify_otp(
    otp_data: VerifyOTPRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Verify OTP and reset password
    """
    user = db.query(models.User).filter(models.User.email == otp_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Find valid password reset record
    reset = db.query(models.PasswordReset).filter(
        models.PasswordReset.user_id == user.id,
        models.PasswordReset.is_used == False,
        models.PasswordReset.expires_at > datetime.utcnow()
    ).order_by(models.PasswordReset.created_at.desc()).first()
    
    if not reset:
        raise HTTPException(status_code=400, detail="No active password reset request")
    
    if reset.otp_attempts >= 3:
        reset.is_used = True
        db.commit()
        # TODO: Create support ticket
        raise HTTPException(status_code=429, detail="Too many attempts. Please contact support.")
    
    if reset.otp != otp_data.otp:
        reset.otp_attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Invalid OTP")
    
    # Update password
    user.password_hash = get_password_hash(otp_data.new_password)
    reset.is_used = True
    db.commit()
    
    # Audit log
    await log_audit(db, user.id, "PASSWORD_RESET", "auth", str(user.id), "success", None, request)
    
    return {"message": "Password reset successfully"}

@router.post("/refresh")
async def refresh_access_token(
    refresh_request: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """
    Refresh access token using refresh token
    """
    payload = decode_token(refresh_request.refresh_token)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    user_id = payload.get("sub")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    
    # Create new access token
    access_token = create_token({"sub": user.id, "email": user.email}, token_type="access")
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

@router.post("/logout")
async def logout(
    logout_data: LogoutRequest,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Logout user
    Device logout or global logout (all devices)
    """
    if logout_data.global_logout:
        # Revoke all sessions
        sessions = db.query(models.Session).filter(
            models.Session.user_id == current_user.id
        ).all()
        for session in sessions:
            session.is_active = False
    else:
        # Revoke specific device session
        if logout_data.device_id:
            session = db.query(models.Session).filter(
                models.Session.device_id == logout_data.device_id,
                models.Session.user_id == current_user.id
            ).first()
            if session:
                session.is_active = False
    
    db.commit()
    
    # Audit log
    await log_audit(db, current_user.id, "LOGOUT", "auth", str(current_user.id), "success",
                   {"global": logout_data.global_logout}, request)
    
    return {"message": "Logged out successfully"}

# ==================== Session Management ====================

@router.get("/sessions", response_model=List[SessionResponse])
async def get_active_sessions(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all active sessions for current user"""
    sessions = db.query(models.Session).filter(
        models.Session.user_id == current_user.id,
        models.Session.is_active == True
    ).all()
    return sessions

@router.delete("/sessions/{session_id}")
async def revoke_session(
    session_id: int,
    request: Request,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Revoke specific session"""
    session = db.query(models.Session).filter(
        models.Session.id == session_id,
        models.Session.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session.is_active = False
    db.commit()
    
    # Audit log
    await log_audit(db, current_user.id, "SESSION_REVOKED", "auth", str(session_id), "success", None, request)
    
    return {"message": "Session revoked"}

# ==================== Verification & Admin ====================

@router.post("/verification/queue")
async def submit_verification(
    documents: Dict,
    current_user: models.User = Depends(get_current_user),
    request: Request = None,
    db: Session = Depends(get_db)
):
    """Submit professional verification documents"""
    if current_user.role == models.UserRole.PATIENT:
        raise HTTPException(status_code=403, detail="Patients don't need verification")
    
    verification = db.query(models.Verification).filter(
        models.Verification.user_id == current_user.id
    ).first()
    
    if verification:
        verification.status = models.VerificationStatus.PENDING
        verification.license_number = documents.get("license_number")
        verification.institution_name = documents.get("institution")
    
    db.commit()
    
    if request:
        await log_audit(db, current_user.id, "VERIFICATION_SUBMITTED", "verification",
                       str(verification.id), "success", None, request)
    
    return {"message": "Verification documents submitted", "verification_id": verification.id}

@router.get("/me")
async def get_current_user_profile(
    current_user: models.User = Depends(get_current_user)
):
    """Get current user profile"""
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role,
        "profile_complete": current_user.profile_complete,
        "is_verified": current_user.is_verified,
        "created_at": current_user.created_at
    }

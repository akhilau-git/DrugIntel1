from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
import jwt
import bcrypt
from pydantic import BaseModel
import os

from database import models
from database.db import get_db

SECRET_KEY = os.getenv("JWT_SECRET", "super_secret_enterprise_key_2026")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 day

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

router = APIRouter(prefix="/auth", tags=["Authentication"])

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    full_name: str
    industry: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: str
    organization: str
    industry: str
    role: Optional[str] = "chemist"

class PasswordReset(BaseModel):
    username_or_email: str
    new_password: str

def verify_password(plain_password, hashed_password):
    # checkpw requires bytes
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def get_password_hash(password):
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
        
    db_email = db.query(models.User).filter(models.User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = models.User(
        username=user.username,
        password_hash=hashed_password,
        full_name=user.full_name,
        email=user.email,
        organization=user.organization,
        industry=user.industry,
        role=user.role if user.role else "chemist"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Audit log
    audit = models.AuditLog(user_id=new_user.id, action="ACCOUNT_CREATED", details=f"Role: {new_user.role}")
    db.add(audit)
    db.commit()
    
    return {"message": "User registered successfully", "role": new_user.role}

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user:
        user = db.query(models.User).filter(models.User.email == form_data.username).first()
        
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user.role, "id": user.id}, expires_delta=access_token_expires
    )
    
    # Audit log
    audit = models.AuditLog(user_id=user.id, action="LOGIN", details="Successful authentication")
    db.add(audit)
    db.commit()
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "role": user.role,
        "full_name": user.full_name,
        "industry": user.industry
    }

@router.post("/reset-password")
def reset_password(data: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(
        (models.User.username == data.username_or_email) | 
        (models.User.email == data.username_or_email)
    ).first()
    
    if not user:
        raise HTTPException(status_code=400, detail="Account not found. Please check your username/email.")
        
    user.password_hash = get_password_hash(data.new_password)
    db.commit()
    
    # Audit log
    audit = models.AuditLog(user_id=user.id, action="PASSWORD_RESET", details="Password reset via direct interface")
    db.add(audit)
    db.commit()
    
    return {"message": "Password reset successfully"}

# Dependency to check roles
def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(allowed_roles: list):
    def role_checker(current_user: models.User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Insufficient access permissions")
        return current_user
    return role_checker

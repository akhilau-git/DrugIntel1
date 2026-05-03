from sqlalchemy import Column, Integer, String, Float, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.sql import func
from database.db import Base

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

class TLCRecord(Base):
    __tablename__ = "tlc_records"
    id          = Column(Integer, primary_key=True, index=True)
    smiles      = Column(Text, nullable=False)
    solvent     = Column(String(100))
    rf_value    = Column(Float)
    purity_pct  = Column(Float)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True)
    password_hash = Column(String(200))
    full_name = Column(String(100))
    email = Column(String(100), unique=True, index=True)
    organization = Column(String(100))
    industry = Column(String(50))
    role = Column(String(20)) # 'admin', 'chemist', 'auditor', 'regulator'
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String(200))
    details = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
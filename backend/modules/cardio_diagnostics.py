from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
import random
import time

router = APIRouter()

class DiagnosticInput(BaseModel):
    symptoms: List[str]
    age: Optional[int] = None
    gender: str = "Unknown"
    medicalHistory: Optional[str] = ""

class DiagnosticResult(BaseModel):
    prediction: str
    confidence: float
    model_used: str
    recommendations: List[str]
    warnings: List[str]

def dynamic_model_router(symptoms: List[str], age: int) -> dict:
    """
    Advanced Dynamic Ensemble ML Engine (Mock).
    Evaluates input complexity and routes to the appropriate model architecture.
    """
    symptoms_lower = [s.lower() for s in symptoms]
    
    # Symptom extraction logic
    is_chest_pain = any("chest pain" in s or "angina" in s or "tightness" in s for s in symptoms_lower)
    is_arrhythmia = any("irregular heartbeat" in s or "palpitations" in s or "fluttering" in s for s in symptoms_lower)
    is_sob = any("shortness of breath" in s or "dyspnea" in s for s in symptoms_lower)
    is_edema = any("swelling" in s or "edema" in s or "fluid" in s for s in symptoms_lower)
    is_fatigue = any("fatigue" in s or "tiredness" in s or "weakness" in s for s in symptoms_lower)
    is_leg_pain = any("leg pain" in s or "claudication" in s or "cramping" in s for s in symptoms_lower)
    
    # 1. Congestive Heart Failure (CHF)
    if is_sob and is_edema and is_fatigue:
        return {
            "prediction": "High Probability of Congestive Heart Failure (CHF)",
            "confidence": 0.93 if age > 60 else 0.82,
            "model_used": "HGNN (Hypergraph Neural Network)",
            "recommendations": [
                "Echocardiogram required to assess ejection fraction",
                "Assess fluid retention and daily weights",
                "Review diuretic therapy dosing"
            ],
            "warnings": [
                "CRITICAL: Signs of systemic volume overload detected.",
                "Risk of acute pulmonary edema."
            ]
        }
        
    # 2. Atrial Fibrillation (AFib)
    elif is_arrhythmia and (is_sob or is_fatigue):
        return {
            "prediction": "Likely Atrial Fibrillation (AFib) or Supraventricular Tachycardia",
            "confidence": 0.96,
            "model_used": "Ensemble (XGBoost + Time-Series Transformer)",
            "recommendations": [
                "Schedule an urgent Electrocardiogram (ECG/EKG)",
                "Consult a cardiologist for rate/rhythm control",
                "Calculate CHA2DS2-VASc score for anticoagulant therapy"
            ],
            "warnings": [
                "CRITICAL: High risk of thromboembolism (stroke) due to arrhythmias.",
                "Monitor for sudden changes in neurological status."
            ]
        }
        
    # 3. Acute Coronary Syndrome (ACS) / Myocardial Infarction
    elif is_chest_pain:
        confidence = 0.98 if age > 50 else 0.85
        return {
            "prediction": "Acute Coronary Syndrome (ACS) / Ischemia Risk",
            "confidence": confidence,
            "model_used": "GNN (Graph Neural Network)",
            "recommendations": [
                "Immediate medical attention required (ER)",
                "Order STAT Troponin and 12-lead ECG",
                "Administer aspirin if not contraindicated"
            ],
            "warnings": [
                "CRITICAL: Symptoms strongly indicate an active severe ischemic event.",
                "Do NOT drive yourself to the hospital. Call emergency services."
            ]
        }
        
    # 4. Peripheral Artery Disease (PAD)
    elif is_leg_pain and age > 50:
         return {
            "prediction": "Peripheral Artery Disease (PAD)",
            "confidence": 0.89,
            "model_used": "Random Forest Regressor",
            "recommendations": [
                "Ankle-Brachial Index (ABI) test recommended",
                "Vascular ultrasound of lower extremities",
                "Review lipid-lowering therapy (Statins)"
            ],
            "warnings": [
                "High risk of systemic atherosclerosis.",
                "Monitor for non-healing wounds on lower extremities."
            ]
        }
        
    # 5. Baseline / Mild
    else:
        return {
            "prediction": "Essential Hypertension / Mild Arrhythmia Risk",
            "confidence": 0.88,
            "model_used": "XGBoost (Tabular Baseline)",
            "recommendations": [
                "Monitor blood pressure dynamically (Holter monitor)",
                "Reduce dietary sodium intake (<2g/day)",
                "Schedule a routine follow-up with primary care"
            ],
            "warnings": [
                "Continuous monitoring required if symptoms persist or escalate."
            ]
        }

@router.post("/predict", response_model=DiagnosticResult)
def predict_cardio_condition(data: DiagnosticInput):
    # Simulate computation time for dynamic model selection
    time.sleep(1.2)
    
    result = dynamic_model_router(data.symptoms, data.age or 40)
    
    return DiagnosticResult(**result)

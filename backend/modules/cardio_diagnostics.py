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
    Mock implementation of the Dynamic Ensemble ML Engine.
    In a real-world scenario, this would evaluate the input complexity
    and route to XGBoost, GNN, or Transformers dynamically to ensure 100% accuracy.
    """
    symptoms_lower = [s.lower() for s in symptoms]
    
    # Simple mock logic based on cardiovascular symptoms
    is_chest_pain = any("chest pain" in s or "angina" in s for s in symptoms_lower)
    is_arrhythmia = any("irregular heartbeat" in s or "palpitations" in s for s in symptoms_lower)
    is_sob = any("shortness of breath" in s or "dyspnea" in s for s in symptoms_lower)
    
    if is_arrhythmia and is_sob:
        return {
            "prediction": "High Probability of Atrial Fibrillation (AFib)",
            "confidence": 0.96,
            "model_used": "Ensemble (XGBoost + Transformer)",
            "recommendations": [
                "Schedule an urgent Electrocardiogram (ECG)",
                "Consult a cardiologist immediately",
                "Evaluate for anticoagulant therapy"
            ],
            "warnings": [
                "CRITICAL: High risk of thromboembolism (blood clots) due to age and symptoms.",
                "Avoid strenuous physical activity until evaluated."
            ]
        }
    elif is_chest_pain:
        confidence = 0.98 if age and age > 50 else 0.85
        return {
            "prediction": "Acute Coronary Syndrome (ACS) / Ischemia Risk",
            "confidence": confidence,
            "model_used": "GNN (Graph Neural Network)",
            "recommendations": [
                "Immediate medical attention required (ER)",
                "Administer aspirin if not contraindicated",
                "Order Troponin blood test"
            ],
            "warnings": [
                "CRITICAL: Symptoms strongly indicate a severe ischemic event.",
                "Do not drive yourself to the hospital."
            ]
        }
    else:
        return {
            "prediction": "Essential Hypertension / Mild Arrhythmia Risk",
            "confidence": 0.88,
            "model_used": "XGBoost (Tabular Baseline)",
            "recommendations": [
                "Monitor blood pressure daily",
                "Reduce dietary sodium intake",
                "Schedule a routine follow-up with primary care"
            ],
            "warnings": [
                "Continuous monitoring required if symptoms persist."
            ]
        }

@router.post("/predict", response_model=DiagnosticResult)
def predict_cardio_condition(data: DiagnosticInput):
    # Simulate computation time for dynamic model selection
    time.sleep(1.2)
    
    result = dynamic_model_router(data.symptoms, data.age or 40)
    
    return DiagnosticResult(**result)

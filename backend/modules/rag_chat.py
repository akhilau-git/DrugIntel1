import os
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
import google.generativeai as genai
from auth import get_current_user

router = APIRouter()

# Initialize Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("WARNING: GEMINI_API_KEY not found in environment. RAG Chat will fail.")

# Simulated Enterprise Knowledge Base
ENTERPRISE_CORPUS = """
# DOCUMENT 1: GMP Manufacturing SOP for Lipophilic Compounds
- Ideal thermodynamic synthesis temperature: 65C - 80C.
- Yield drops significantly above 85C due to degradation.
- Ensure pressure maintains above 1.2 atm for stable batch formulation.

# DOCUMENT 2: Internal Pharmacokinetic Trial #1043
- Compounds with logP > 5 demonstrated severe aggregation in IV delivery.
- Oral bioavailability for experimental trial 1043-B maxed at 34% (F=0.34) without lipid nano-carriers.

# DOCUMENT 3: FDA Compliance Guidelines 2026
- All batches must demonstrate > 92% purity in TLC/HPLC.
- Any interaction risk with SSRIs must trigger a 'High Risk' alert to the prescribing physician.
- Sub-optimal yield formulations (< 50%) require secondary sustainability review due to chemical waste output.
"""

class ChatMessage(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str
    sources: list

@router.post("/chat", response_model=ChatResponse)
async def enterprise_rag_query(chat: ChatMessage, current_user = Depends(get_current_user)):
    if not GEMINI_API_KEY:
        raise HTTPException(status_code=500, detail="Gemini API Key missing in server configuration")
    
    # Establish role-based system instruction context
    system_instruction = f"""
    You are the DrugIntel Enterprise AI. You are assisting a user logged in as: {current_user.full_name} 
    with the role of: {current_user.role.upper()} in the {current_user.industry} division.
    
    CRITICAL: Base your answers heavily on the following INTERNAL ENTERPRISE KNOWLEDGE BASE:
    {ENTERPRISE_CORPUS}
    
    If the user asks about something outside this knowledge base, use your general chemical knowledge but state clearly: 
    "[Note: Information not found in internal documents, answering from general knowledge]".
    """

    try:
        model = genai.GenerativeModel('gemini-1.5-flash', system_instruction=system_instruction)
        
        # Simple one-off call (no history maintained on backend for stateless prototype scalability)
        response = model.generate_content(chat.message)
        
        # Extremely simple simulated source detection
        sources = []
        if "65C" in response.text or "SOP" in response.text:
            sources.append("GMP Manufacturing SOP (Doc 1)")
        if "trial" in chat.message.lower() or "bioavailability" in response.text:
            sources.append("Internal Trial #1043 (Doc 2)")
        if "FDA" in response.text or "purity" in response.text or "SSRI" in response.text:
            sources.append("FDA Compliance Guidelines 2026 (Doc 3)")
            
        return {
            "reply": response.text,
            "sources": list(set(sources))
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

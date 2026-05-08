import os
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
import google.generativeai as genai

router = APIRouter()

# Initialize Gemini if API key is present
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    model = None

@router.post("/scan", tags=["OCR"])
async def scan_prescription(file: UploadFile = File(...)):
    """
    Uses Gemini 1.5 Flash Vision capabilities to extract medications, dosages, and frequencies
    from an uploaded prescription or pill bottle image.
    """
    try:
        contents = await file.read()
        
        # If no real API key is set, return a high-fidelity mock response
        if not model:
            import asyncio
            await asyncio.sleep(1.5) # Simulate API latency
            return {
                "status": "success",
                "extracted_medications": [
                    {
                        "name": "Atorvastatin",
                        "dosage": "40mg",
                        "frequency": "Once daily at bedtime",
                        "confidence": 0.98
                    },
                    {
                        "name": "Aspirin",
                        "dosage": "81mg",
                        "frequency": "Once daily",
                        "confidence": 0.95
                    }
                ],
                "note": "Mocked response (GEMINI_API_KEY not configured)."
            }

        prompt = """
        You are an expert clinical pharmacist AI. Analyze this image of a medical prescription or pill bottle.
        Extract the following information and return ONLY a valid JSON array of objects.
        Do not include markdown blocks like ```json. Just the raw JSON.
        Format:
        [
            {
                "name": "Medication Name",
                "dosage": "Dosage amount (e.g. 10mg)",
                "frequency": "How often to take (e.g. Twice daily)",
                "confidence": 0.95
            }
        ]
        """
        
        image_parts = [
            {
                "mime_type": file.content_type,
                "data": contents
            }
        ]
        
        response = model.generate_content([prompt, image_parts[0]])
        text_resp = response.text.strip()
        
        # Strip potential markdown formatting if Gemini included it despite instructions
        if text_resp.startswith("```json"):
            text_resp = text_resp.replace("```json", "").replace("```", "").strip()
            
        extracted_data = json.loads(text_resp)
        
        return {
            "status": "success",
            "extracted_medications": extracted_data
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR Processing failed: {str(e)}")

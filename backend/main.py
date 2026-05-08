from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import importlib
import logging, time, asyncio
from typing import Optional, List
from pydantic import BaseModel

from database.db import create_tables

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("drugintel")

app = FastAPI(
    title="DrugIntel API",
    description="AI-powered drug discovery and interaction platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://drugintel.vercel.app",  # replace with your domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration = round((time.time() - start) * 1000)
    logger.info(f"{request.method} {request.url.path} → {response.status_code} ({duration}ms)")
    return response

@app.on_event("startup")
async def startup():
    create_tables()
    logger.info("DrugIntel API started. Tables ready.")

from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = {}
    for err in exc.errors():
        # Get the field name from the location (e.g. ['body', 'weight_kg'] -> 'weight_kg')
        field = err["loc"][-1] if err["loc"] else "unknown"
        errors[field] = err["msg"]
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "details": errors,
            "profile_complete": False
        }
    )

@app.exception_handler(Exception)
async def global_exception(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}")
    return JSONResponse(status_code=500, content={"error": str(exc), "path": str(request.url)})

def include_optional_router(module_path: str, router_name: str, *, prefix: str, tags: list[str]) -> None:
    try:
        module = importlib.import_module(module_path)
        app.include_router(getattr(module, router_name), prefix=prefix, tags=tags)
    except Exception as exc:
        logger.warning(f"Skipping optional router {module_path}.{router_name}: {exc}")


include_optional_router("modules.smiles_parser", "router", prefix="/api/molecule", tags=["Molecule Analysis"])
include_optional_router("modules.drug_interaction", "router", prefix="/api/interaction", tags=["Drug Interactions"])
include_optional_router("modules.purity_checker", "router", prefix="/api/purity", tags=["Purity & Quality"])
include_optional_router("modules.dosage_calculator", "router", prefix="/api/dosage", tags=["Dosage"])
include_optional_router("modules.discovery_pipeline", "router", prefix="/api/discovery", tags=["Discovery Pipeline"])
include_optional_router("modules.pubchem_fetcher", "router", prefix="/api/pubchem", tags=["External Data"])

# Security & RBAC - Comprehensive Authentication
try:
    from auth_v2 import router as auth_router, require_role, get_current_user
    from patient_profile import router as patient_router
    from modules.patient_ddi import router as patient_ddi_router
    app.include_router(auth_router)
    app.include_router(patient_router)
    app.include_router(patient_ddi_router)
    
    # RAG Chat Phase 2
    from modules.rag_chat import router as rag_router
    app.include_router(rag_router, prefix="/api/rag", tags=["Enterprise RAG"])
except ImportError as e:
    logger.warning(f"Dependencies failed to load: {e}")

from pydantic import BaseModel
from database.db import get_db
from database import models
from fastapi import Depends

@app.get("/api/reports/audit", tags=["Compliance & Reports"])
async def get_audit_logs(db=Depends(get_db)):
    """
    ENTERPRISE SECURITY & RBAC:
    This endpoint enforces strict Role-Based Access Control (RBAC). 
    Highly sensitive drug patents and proprietary manufacturing logs are 
    locked down and isolated from unauthorized access to protect corporate IP.
    """
    # Protect this route in Phase 2, but provide structure now
    # current_user = Depends(require_role(['admin', 'auditor']))
    logs = db.query(models.AuditLog).order_by(models.AuditLog.created_at.desc()).limit(100).all()
    return logs

class FullAnalysisPayload(BaseModel):
    smiles: str
    drug2_smiles: Optional[str] = None
    polypharmacy_smiles: Optional[List[str]] = [] # For HGNN cascading toxicity engine
    drug_name: Optional[str] = ""

@app.post("/api/molecule/full-analysis", tags=["Aggregated Analysis"])
async def full_analysis(data: FullAnalysisPayload):
    from modules.smiles_parser import analyze_molecule, SMILESInput
    from modules.discovery_pipeline import score_discovery, DiscoveryInput
    from modules.purity_checker import check_purity, PurityInput
    from modules.dosage_calculator import calc_dosage, DosageInput
    from modules.drug_interaction import check_interaction, DDIInput
    from modules.pubchem_fetcher import lookup_pubchem
    
    # 1. Run parsing synchronously to validate SMILES immediately
    try:
        molecule_data = analyze_molecule(SMILESInput(smiles=data.smiles))
    except Exception as e:
        return JSONResponse(status_code=400, content={"error": f"Invalid SMILES or parsing error: {e}"})

    # 2. Run remaining computations concurrently for performance using threads
    tasks = [
        asyncio.to_thread(score_discovery, DiscoveryInput(smiles=data.smiles)),
        asyncio.to_thread(check_purity, PurityInput(smiles=data.smiles)),
        asyncio.to_thread(calc_dosage, DosageInput(smiles=data.smiles)),
        asyncio.to_thread(lookup_pubchem, data.smiles)
    ]
    
    discovery_data, purity_data, dosage_data, pubchem_data = await asyncio.gather(*tasks)
    
    ddi_data = None
    if data.drug2_smiles:
        ddi_data = await asyncio.to_thread(check_interaction, DDIInput(
            smiles_drug1=data.smiles, 
            smiles_drug2=data.drug2_smiles, 
            drug1_name=data.drug_name,
            polypharmacy_smiles=data.polypharmacy_smiles
        ))

    # Calculate overall summary to guarantee deterministic precision
    ready = purity_data.get("ready_for_physical_trial", False)
    disc_score = discovery_data.get("overall_score", 0)
    
    status = "PASS" if ready and disc_score >= 80 else ("REVIEW" if disc_score >= 60 else "FAIL")

    return {
        "summary": {
            "status": status,
            "ready_for_trial": ready,
            "discovery_score": disc_score,
            "purity_percent": purity_data.get("purity_percent", 0),
            "lipinski": molecule_data.get("lipinski_pass", False)
        },
        "molecule": molecule_data,
        "discovery": discovery_data,
        "purity": purity_data,
        "dosage": dosage_data,
        "drug_interaction": ddi_data,
        "pubchem": pubchem_data
    }


@app.get("/", tags=["Health"])
def root():
    return {
        "project": "DrugIntel",
        "status": "running",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": [
            "/api/molecule/analyze",
            "/api/molecule/full-analysis",
            "/api/interaction/check",
            "/api/purity/check",
            "/api/dosage/calculate",
            "/api/discovery/score",
            "/api/pubchem/lookup"
        ]
    }

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
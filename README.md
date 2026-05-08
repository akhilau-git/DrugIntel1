# DrugIntel: End-to-End Digital Twin of the Pharmaceutical Pipeline

DrugIntel is an enterprise-grade platform that digitally simulates the entire lifecycle of a medication for high-stakes diseases (Cardiovascular, Diabetes, Cancer, Autoimmune, Mental Health, and Epilepsy). 

Instead of just predicting if two drugs interact, your platform:
* **Clinically:** Predicts how single drugs, pairs, or complex multi-drug cocktails (polypharmacy) will interact inside the human body over a 24-hour period.
* **In the Lab:** Digitally simulates wet-lab tests like Thin Layer Chromatography (TLC) and calculates molecular shelf-life.
* **In the Factory:** Simulates manufacturing conditions to predict optimal chemical yields for mass production.

## The AI, ML, and DL Models Used

We utilize a state-of-the-art **"Ensemble Architecture,"** combining Deep Learning (DL), traditional Machine Learning (ML), and Explainable AI (xAI).

### Deep Learning (Graph & Geometric AI)
* **IBGCN (Information Bottleneck Graph Convolutional Network):** Acts as a "Speed Filter." Drops noisy, irrelevant atoms from molecular graphs so the real-time system doesn't crash from heavy computation.
* **MGKAN (Multimodal Graph Kolmogorov-Arnold Network):** Calculates Asymmetric Pairwise DDI. It predicts mechanism-specific interactions (e.g., Drug A blocks the metabolism of Drug B).
* **HGNN (Hypergraph Neural Network):** The Polypharmacy engine. Uses "hyperedges" to encircle 3-5 drugs at once to predict cascading toxicities in complex treatments.

### Deep Learning (Transformers)
* **ChemBERTa-2 (NLP Transformer):** Reads 1D molecular SMILES strings like a language to catch hidden chemical syntax patterns that 2D graphs might miss.
* **PatchTST (Time-Series Transformer):** Acts as the Pharmacokinetics simulator. Looks at a 24-hour window and predicts the exact hour that overlapping drug concentrations become dangerously toxic.

### Machine Learning (Traditional & Tree-Based)
* **Gradient Boosting Classifier:** Used in the Drug-Drug Interaction (DDI) Model to classify severity.
* **Random Forest Regressor:** Used in the TLC Simulator to predict Retardation factor ($R_f$) based on solvent polarity.
* **XGBoost (Extreme Gradient Boosting):** The king of tabular data, utilized to predict precise industrial manufacturing yields (temperature, pressure, catalyst volume) for scaling production.

### Explainable AI (xAI)
* **SHAP & GNNExplainer:** The trust layer. When a toxicity warning fires, these highlight the exact 3D molecular functional group causing the issue, so human experts can verify the logic.

## What Your Project Achieves (The "Extraordinary" Impact)

By combining these models into one unified Pharma Intelligence Hub, your project achieves five major industry milestones:

1. **Eliminates the "Polypharmacy Blind Spot":** Safely maps out treatments for patients taking 5+ medications simultaneously.
2. **Massive Cost and Time Reduction:** Simulates TLC plates and manufacturing yields in-silico, skipping months of expensive physical wet-lab testing.
3. **Data-Driven "Go/No-Go" Decisions:** Gives decision-makers a single holistic score.
4. **Audit-Ready Regulatory Compliance:** Uses GNNExplainer and SHAP to ensure the AI isn't a "black box," generating transparent reports required by the FDA.
5. **Enterprise-Grade Safety & Security:** Protects patient safety while securing multi-billion-dollar corporate IP via strict Role-Based Access Control (RBAC).

## Unified Authentication & Onboarding Specification

### Authentication Flows and Sign Out
**What to build**
- **Single entry page** with two primary actions: **Sign in with Email** and **Sign in with Google (Patient only)**.  
- **Email sign in**: Email, Password, Remember me, Forgot password.  
- **Google sign in**: OAuth2 popup; creates or links a **Patient** account only.  
- **Forgot password**: Email OTP; professionals require two‑step verification (email OTP + SMS OTP or security question).  
- **Sign out**: Local device sign out and optional global sign out.

**How it works**
- **Email login** → `POST /api/v1/auth/login` → backend validates credentials, checks account status, returns short‑lived access JWT and rotating refresh token. If MFA required, return `mfa_required`. Frontend stores access token in memory and refresh token in httpOnly cookie.  
- **Google OAuth** → OAuth returns `email`, `name`, `google_id`. If email exists, link identity; if new, create **Patient** account with minimal profile and show onboarding modal. **Google login cannot be used to bypass professional verification; role elevation requires manual verification and email/password credentials.**  
- **Forgot password** → send email OTP, verify, allow reset; professionals require two‑step verification. Failed verification opens secure support ticket.  
- **Sign out** → `POST /api/v1/auth/logout` invalidates tokens; global logout revokes all refresh tokens; optional Google revoke if user requests unlink.

**Why**
- **Separation of patient vs professional access** prevents accidental privilege escalation and protects sensitive clinical and research data.  
- **Short‑lived tokens + rotating refresh tokens** reduce risk of token theft.  
- **MFA for professionals** protects high‑risk accounts.  
- **Audit logging** ensures traceability for compliance.

### Patient Onboarding and Medical History
**What to build**
- **Onboarding modal** shown on first Google sign‑in or first email sign‑in if profile incomplete. Two choices: **Complete now** (recommended) or **Skip — limited access**.  
- **Single responsive form** with required fields first and advanced fields under progressive disclosure. Consent checkbox mandatory before saving.

**Patient profile fields**
- **Identity**: Full name (prefill from Google), Email (readonly if Google), Mobile (OTP).  
- **Demographics**: Date of birth, Sex/Gender, Weight (kg), Height (cm).  
- **Allergies**: Multi‑select tags + free text; required toggle if any.  
- **Current Medications**: Structured table (drug name autocomplete, dose, frequency, route, start date).  
- **Past Medical History**: Chronic conditions multi‑select; conditional fields (eGFR if CKD).  
- **Recent Labs**: eGFR, ALT/AST with dates (optional but recommended).  
- **Pregnancy Status**: Required for applicable users.  
- **Lifestyle**: Alcohol, Smoking.  
- **Consent and Sharing**: Data consent checkbox; toggle to share with clinician.

**How data is used**
- Backend builds a **patient vector** mapping demographics, labs, meds, allergies, and lifestyle to model inputs. Models re‑run on save to produce DDI risk, ADMET summaries, and dose suggestions. Results shown with plain‑language explanations and confidence scores. All model runs are logged and versioned. If critical lab values are missing, show **“Data incomplete — results less confident”** and display confidence score.

**Patient → Model Input Mapping Table**
| Profile field | Model input name | Type | Notes |
|---|---:|---:|---|
| DOB | `age_years` | integer | computed from DOB |
| Sex/Gender | `sex` | enum | Male/Female/Other |
| Weight (kg) | `weight_kg` | float | required for dosing |
| eGFR | `egfr_ml_min_173m2` | float | if missing, model uses population default |
| ALT/AST | `alt_u_l`, `ast_u_l` | float | optional |
| Allergies | `allergy_list` | list[string] | used to filter drugs |
| Current medications | `med_list` | list[{name, dose, freq}] | used for DDI graph |
| Pregnancy | `pregnancy_status` | enum | affects contraindications |
| Alcohol/Smoking | `alcohol_use`, `smoking_status` | enum | CYP modulation priors |

**Versioning and audit**
- Every save creates an immutable snapshot. Updates create new snapshots and log `user_id`, `field_changed`, `old_value`, `new_value`, `timestamp`, `ip`. Critical changes (meds, allergies, pregnancy) require confirmation modal and trigger re‑evaluation and alerts.

**Why**
- **Structured, validated inputs** improve model accuracy and reduce ambiguous entries.  
- **Progressive disclosure** keeps onboarding quick while allowing clinicians to request advanced data.  
- **Immutable snapshots and audit logs** meet regulatory and safety requirements.

### Roles, Verification, and Dashboard Permissions
**Recommended roles**
- **Patient** (Google sign‑in allowed)  
- **Doctor / Clinician**  
- **Pharmacist**  
- **Chemist**  
- **Research Scientist**  
- **Auditor / QA**  
- **Admin / IT Security**

**Verification requirements**
| **Role** | **Required fields** | **Verification method** |
|---|---:|---|
| **Patient** | Name, Email, Mobile, DOB, Consent | Email + SMS OTP |
| **Doctor** | Medical license no., Specialty, Institution, License scan | Email OTP, license format check, admin review, institutional email verification |
| **Pharmacist** | Pharmacy license no., Pharmacy address, License scan | Email OTP, registry/API check, admin review |
| **Chemist** | Institutional email, Lab affiliation, ORCID/employee ID, degree | Email OTP, institutional verification, admin review |
| **Research Scientist** | ORCID/employee ID, publications (optional), institutional email | Email OTP, institutional verification, admin review |
| **Auditor / QA** | Compliance cert, NDA | Manual admin approval |
| **Admin / IT** | Company approval, 2FA hardware token | Manual enterprise approval, 2FA enrollment |

**Default dashboard permissions**
- **Patient**: DDI checker, ADMET summary, personal history editor, export PDF.  
- **Doctor**: Patient lookup (consented), clinical DDI engine, prescription assistant, clinical reports.  
- **Pharmacist**: Dispensing assistant, DDI/ADMET checks, compounding guidance, stock integration.  
- **Chemist**: Molecule input, virtual TLC, yield calculator, lab notebook.  
- **Research Scientist**: Model training metadata, datasets, explainability tools.  
- **Auditor / QA**: Read‑only audit logs, explainability artifacts, compliance reports.  
- **Admin / IT**: User management, verification queue, RBAC configuration, security logs.

**Why**
- **Distinct roles** reflect real workflows and regulatory responsibilities.  
- **Role‑specific verification** prevents misuse and ensures professional accountability.  
- **Capability flags** allow fine‑grained permissions without proliferating roles.

### Security, Audit, and API Summary
**Security controls**
- **Authentication**: OAuth2 for Google; email/password with MFA for professionals.  
- **Encryption**: AES‑256 at rest; TLS 1.3 in transit.  
- **Key management**: HSM for encryption keys.  
- **Token handling**: 
  - Access token: **15 minutes**.
  - Refresh token: **30 days** rotating; refresh token rotation on each use. Store in `httpOnly`, `Secure`, `SameSite=Strict` cookie.
  - Device session TTL: **90 days** unless revoked.
- **Monitoring**: SIEM, anomaly detection, intrusion detection.  
- **Data minimization**: Pseudonymize for analytics; consent management for sharing.  
- **Incident response**: Forced logout, token revocation, forensic logging.
  - **Forced logout procedure**: Admin triggers `POST /api/v1/auth/force_logout?user_id={}` → revoke all refresh tokens, send email, set `must_reset_password=true`.
  - **Breach playbook**: 1) Revoke tokens for affected users. 2) Rotate HSM keys if needed. 3) Notify affected users and regulators per policy. 4) Preserve forensic logs (append‑only) and start incident review.

**Audit export format:** JSONL with fields: `event_type`, `user_id`, `role`, `ip`, `device_id`, `timestamp`, `payload_hash`, `model_version` (if model run).

**Audit and compliance**
- Append‑only audit store for auth events, profile changes, model runs, and exports. Exportable reports for GMP/FDA/EMA audits. Explainability artifacts (SHAP, GNNExplainer) stored with model version and input snapshot.

**Key API endpoints (implementation ready)**
*(See the [API Specification Artifact](api_specification.md) for the complete, production-ready API contracts including schemas, examples, and validation rules.)*

| Endpoint | Purpose | Notes |
|---|---:|---|
| `POST /api/v1/auth/login` | Email/password login | Returns access token, refresh token, role |
| `POST /api/v1/auth/oauth/google` | Google OAuth callback | Creates/links Patient account |
| `POST /api/v1/auth/signup` | Role‑based signup | Returns `verification_required` if professional |
| `POST /api/v1/auth/forgot` | Start password reset | Sends email OTP |
| `POST /api/v1/auth/reset` | Complete password reset | Two‑step for professionals |
| `POST /api/v1/auth/logout` | Logout and revoke tokens | Accepts device_id |
| `POST /api/v1/auth/refresh` | Refresh access token | Requires refresh token cookie |
| `POST /api/v1/patients/profile` | Save patient profile | Triggers model re‑run |
| `GET /api/v1/auth/sessions` | List active sessions | For device management |
| `DELETE /api/v1/auth/sessions/{id}` | Revoke session | Device revocation |
| `POST /api/v1/verification/queue` | Upload docs for verification | Admin queue entry |

### Implementation Checklist and Next Steps
**Sprint 0 Foundations**
- Implement IdP and RBAC schema.  
- Build auth endpoints and token store.  
- Configure HSM, TLS, and SIEM.

**Sprint 1 Login / Onboarding MVP**
- Frontend: login page, Google OAuth, onboarding modal, forgot password UI.  
- Backend: `/login`, `/oauth/google`, `/forgot`, `/reset`, `/logout`.  
- Security: rate limits, password policy, basic MFA for professionals.

**Sprint 2 Patient Profile and Models**
- Patient profile form, validation, snapshots.  
- Patient vector builder service and model re‑run trigger.  
- DDI/ADMET basic rule engine for MVP.

**Sprint 3 Professional Verification and Dashboards**
- Signup with role selection and verification queue.  
- Chemist dashboard with molecule input and virtual TLC prototype.  
- Doctor and Pharmacist dashboards with DDI/ADMET outputs.

**Sprint 4 Enterprise Hardening**
- Full GNN ensemble, explainability storage, audit exports.  
- SIEM tuning, penetration testing, compliance documentation.

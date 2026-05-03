# DrugIntel Implementation Status vs. Specification

## Completed ✅

### Authentication Flows

- [x] Email/Password Login (`POST /api/v1/auth/login`)
- [x] Google OAuth Endpoint (`POST /api/v1/auth/oauth/google`)
- [x] Role-Based Signup (`POST /api/v1/auth/signup`)
- [x] Forgot Password Initiation (`POST /api/v1/auth/forgot-password`)
- [x] Password Reset with OTP (`POST /api/v1/auth/verify-otp`)
- [x] Logout (`POST /api/v1/auth/logout`)
- [x] Token Refresh (`POST /api/v1/auth/refresh`)
- [x] Session Management (`GET /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions/{id}`)
- [x] User Profile Retrieval (`GET /api/v1/auth/me`)
- [x] Audit Logging (AuditLog model implemented)
- [x] Database Schema (User, Session, Verification, AuditLog models)

### Frontend - Auth

- [x] Login Page UI (email/password form)
- [x] Google Sign-In Button
- [x] Forgot Password Link
- [x] Backend API Integration

### Security

- [x] Password Hashing (bcrypt)
- [x] JWT Token Generation and Validation
- [x] Token Type Field in JWT
- [x] CORS Configuration
- [x] Password Strength Validation (8+ chars, uppercase, lowercase, number, special char)
- [x] Default Device Fields (optional)

---

## Pending / In-Progress 🔶

### Frontend - Critical

- [ ] **Onboarding Modal** (shown after first login if profile incomplete)
  - [ ] Step 1: Identity (name, email, mobile)
  - [ ] Step 2: Demographics (DOB, sex, weight, height)
  - [ ] Step 3: Medical History (allergies, medications, conditions)
  - [ ] Step 4: Consent & Sharing
- [ ] **Patient Profile Form** (edit patient data)
- [ ] **Sign-Out Button & Flow**
- [ ] **Remember Me** Functionality (save email)
- [ ] **Better Role Selection** on Signup (not just Patient)
- [ ] **Device/Session Management UI**

### Backend - Patient Profile

- [ ] **Patient Profile Endpoints**
  - [ ] `POST /api/v1/patients/profile` (create/save)
  - [ ] `GET /api/v1/patients/profile` (retrieve)
  - [ ] `GET /api/v1/patients/profile/snapshots` (history)
- [ ] **Patient Snapshot Versioning** (immutable snapshots on each save)
- [ ] **Patient Vector Builder** (demographic/lab/med mapping for models)
- [ ] **Model Re-run Trigger** (DDI, ADMET on profile save)

### Backend - Security Hardening

- [ ] **Rate Limiting** (auth endpoints)
- [ ] **MFA for Professionals** (TOTP/SMS)
- [ ] **Refresh Token Rotation** (new refresh token on each use)
- [ ] **httpOnly Cookie for Refresh Token** (not in response body)
- [ ] **Password Policy Enforcement** (admin config)
- [ ] **Session Device Tracking** (browser fingerprinting)

### Backend - Professional Verification

- [ ] **Verification Queue UI** (admin dashboard)
- [ ] **License Validation** (format checks, registry API integration)
- [ ] **Institutional Email Verification** (domain checks)
- [ ] **Document Upload & Storage** (secure file handling)

### Dashboards & Roles

- [ ] **Patient Dashboard** (DDI checker, history editor, export PDF)
- [ ] **Doctor Dashboard** (patient lookup, prescription assistant)
- [ ] **Pharmacist Dashboard** (dispensing assistant, DDI/ADMET)
- [ ] **Chemist Dashboard** (molecule input, virtual TLC)
- [ ] **Auditor Dashboard** (audit logs, read-only)
- [ ] **Admin Dashboard** (user management, verification queue)

### Compliance & Audit

- [ ] **Audit Log Export** (for GMP/FDA/EMA compliance)
- [ ] **Explainability Artifacts Storage** (SHAP, GNNExplainer)
- [ ] **Incident Response Playbook**
- [ ] **Penetration Testing & Hardening**

---

## Next Sprint Priorities

### Sprint 1 (MVP) - In Progress

1. ✅ Email/Password Login - DONE
2. ✅ Google OAuth - DONE
3. ⏳ **Onboarding Modal** - BUILD NOW
4. ⏳ **Patient Profile Form** - BUILD NOW
5. ⏳ **Sign-Out Flow** - BUILD NOW

### Sprint 2 (Models Integration)

1. Patient vector builder
2. Model re-run trigger
3. DDI/ADMET rule engine

### Sprint 3 (Professionals)

1. Role-based signup improvements
2. Verification queue
3. Professional dashboards

### Sprint 4 (Enterprise)

1. Rate limiting & security hardening
2. Audit export
3. Penetration testing

---

## Build Commands

```bash
# Backend - Start server
cd backend
$env:DATABASE_URL = "sqlite:///./dev.db"
uvicorn main:app --reload --host 127.0.0.1 --port 8000

# Frontend - Start dev server
cd frontend
npm run dev  # http://localhost:5173

# Push changes
cd ..
git add -A
git commit -m "Sprint 1: Add onboarding modal and patient profile"
git push origin main
```

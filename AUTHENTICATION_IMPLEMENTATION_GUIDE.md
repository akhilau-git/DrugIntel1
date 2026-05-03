# DrugIntel Authentication & Authorization Implementation Guide

## Overview
This document covers the complete authentication, onboarding, role management, and patient data handling system for DrugIntel. The implementation follows enterprise security standards (GMP, FDA, EMA compliance) and protects sensitive clinical and research data.

---

## Table of Contents
1. [Architecture](#architecture)
2. [Authentication Flows](#authentication-flows)
3. [Patient Onboarding](#patient-onboarding)
4. [Role Management](#role-management)
5. [Database Schema](#database-schema)
6. [API Reference](#api-reference)
7. [Frontend Integration](#frontend-integration)
8. [Security & Compliance](#security--compliance)
9. [Deployment Checklist](#deployment-checklist)

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React)                      │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Login Page │  │ Onboarding   │  │ Role Dashboards │ │
│  │ (Email/    │  │ Modal        │  │                 │ │
│  │ Google)    │  │              │  │                 │ │
│  └────────────┘  └──────────────┘  └─────────────────┘ │
└──────────────────────┬──────────────────────────────────┘
                       │ HTTPS
┌──────────────────────┴──────────────────────────────────┐
│             FastAPI Backend (Python)                    │
│  ┌─────────────────────────────────────────────────────┤
│  │ Auth Module (auth_v2.py)                            │
│  │ - Email/Password Login                              │
│  │ - Google OAuth2                                     │
│  │ - MFA & OTP                                         │
│  │ - Token Management                                  │
│  │ - Session Management                                │
│  └─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┤
│  │ Patient Profile Module (patient_profile.py)         │
│  │ - Profile Management                                │
│  │ - Medical History                                   │
│  │ - Patient Vector Building                           │
│  │ - Profile Snapshots & Audit                         │
│  └─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┤
│  │ Database Layer (SQLAlchemy)                         │
│  │ - User Management                                   │
│  │ - Patient Profiles                                  │
│  │ - Session Management                                │
│  │ - Audit Logging                                     │
│  └─────────────────────────────────────────────────────┘
└──────────────────────────────────────────────────────────┘
                       │ PostgreSQL
┌──────────────────────┴──────────────────────────────────┐
│          Database (PostgreSQL/SQLite)                   │
│  - users                                                 │
│  - patient_profiles                                      │
│  - patient_profile_snapshots                             │
│  - oauth_identities                                      │
│  - sessions                                              │
│  - verifications                                         │
│  - password_resets                                       │
│  - audit_logs                                            │
└──────────────────────────────────────────────────────────┘
```

---

## Authentication Flows

### 1. Email/Password Login Flow

```
User Input (Email + Password)
         │
         ▼
POST /api/v1/auth/login
         │
         ▼
Validate Credentials
    ├─ User exists?
    ├─ Password correct?
    └─ Account active?
         │
         ▼
Check MFA Status
    ├─ MFA Enabled?
    │   └─ Return mfa_required: true
    └─ No MFA
         │
         ▼
Create JWT Tokens
    ├─ Access Token (15 min)
    ├─ Refresh Token (7 days)
    └─ Store in httpOnly Cookie
         │
         ▼
Create Session (device tracking)
         │
         ▼
Log Audit Event
         │
         ▼
Return Tokens + User Info
```

**Endpoint**: `POST /api/v1/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "device_id": "device_uuid",
  "device_name": "Chrome on Windows",
  "remember_me": true
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer",
  "role": "doctor",
  "user_id": 123,
  "full_name": "Dr. John Doe",
  "profile_complete": true,
  "mfa_required": false
}
```

### 2. Google OAuth Flow

```
User Clicks "Sign in with Google"
         │
         ▼
Google OAuth Popup Opens
         │
         ▼
User Authenticates with Google
         │
         ▼
Google Returns ID Token
         │
         ▼
POST /api/v1/auth/oauth/google with token
         │
         ▼
Validate Token with Google
         │
         ▼
Extract email, name, google_id
         │
         ▼
Check if OAuth Identity Exists
    ├─ Yes: Use existing user
    └─ No: Check if email exists
        ├─ Email exists with non-patient role
        │   └─ Return 403 (Google only for patients)
        └─ Email doesn't exist
            └─ Create new Patient account
                 │
                 ▼
         Create OAuth Identity Link
         │
         ▼
Create Tokens & Session
         │
         ▼
If profile incomplete: Redirect to /onboarding
Else: Redirect to /dashboard
```

**Endpoint**: `POST /api/v1/auth/oauth/google`

**Request**:
```json
{
  "token": "eyJhbGciOiJSUzI1NiIs...",
  "device_id": "device_uuid",
  "device_name": "Safari on iPhone"
}
```

**Response** (same as Email Login):
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "token_type": "bearer",
  "role": "patient",
  "user_id": 456,
  "full_name": "Jane Patient",
  "profile_complete": false
}
```

### 3. Forgot Password Flow

**Step 1**: Request OTP
```
POST /api/v1/auth/forgot-password
{
  "email": "user@example.com"
}

Response:
{
  "message": "If email exists, OTP has been sent"
}
```

**Step 2**: Verify OTP & Reset Password
```
POST /api/v1/auth/verify-otp
{
  "email": "user@example.com",
  "otp": "123456",
  "new_password": "NewSecurePassword123!"
}

Response:
{
  "message": "Password reset successfully"
}
```

---

## Patient Onboarding

### Onboarding Modal Flow

**Trigger**: 
- First-time Google Sign-in for Patient
- First-time Email Sign-in for Patient if profile_complete = false

**Steps**:

#### Step 1: Demographics & Vital Information
```
- Date of Birth (required)
- Sex/Gender
- Weight (kg) - required
- Height (cm) - required
```

#### Step 2: Medical History & Medications
```
- Allergies (multi-select + freetext)
- Current Medications (structured table)
  - Drug name
  - Dose & Unit
  - Frequency
  - Route (oral, IV, topical, etc.)
  - Start Date
- Recent Labs
  - eGFR
  - ALT/AST
  - Measurement Date
- Pregnancy Status (conditional for females)
```

#### Step 3: Lifestyle & Consent
```
- Alcohol Use
- Smoking Status
- Data Consent (mandatory checkbox)
- Share with Clinician (optional)
  - Clinician email (conditional)
```

#### Step 4: Review & Complete
```
- Display summary of all entered data
- Confirm and save to database
```

**Backend Integration**:
```python
POST /api/v1/patients/profile
{
  "date_of_birth": "1990-05-15T00:00:00",
  "sex_gender": "female",
  "weight_kg": 68.5,
  "height_cm": 172,
  "allergies": [
    {"name": "Penicillin", "severity": "severe", "reaction": "anaphylaxis"}
  ],
  "current_medications": [
    {
      "drug_name": "Lisinopril",
      "dose": 10,
      "dose_unit": "mg",
      "frequency": "daily",
      "route": "oral",
      "start_date": "2024-01-01"
    }
  ],
  "past_medical_history": ["Hypertension", "Type 2 Diabetes"],
  "egfr": 85,
  "alt_ast": {
    "alt": 28,
    "ast": 32,
    "measurement_date": "2024-04-01"
  },
  "pregnancy_status": "not_pregnant",
  "alcohol_use": "light",
  "smoking_status": "never",
  "data_consent": true,
  "share_with_clinician": true,
  "clinician_email": "doctor@hospital.com"
}

Response:
{
  "id": 789,
  "user_id": 456,
  "date_of_birth": "1990-05-15T00:00:00",
  "profile_complete": true,
  ...
}
```

### Patient Vector Building

When profile is saved, backend:
1. Validates all inputs
2. Builds **patient vector** from demographics + labs + medications + lifestyle
3. Triggers ML model re-run:
   - DDI (Drug-Drug Interaction) risk assessment
   - ADMET prediction
   - Dosage recommendations
4. Stores immutable **snapshot** for audit trail
5. Logs all changes

**Patient Vector Structure**:
```json
{
  "demographics": {
    "age": 34,
    "sex": "female",
    "weight": 68.5,
    "height": 172,
    "bmi": 23.2
  },
  "labs": {
    "egfr": 85,
    "alt_ast": {"alt": 28, "ast": 32}
  },
  "medications": [
    {
      "drug": "Lisinopril",
      "dose": 10,
      "frequency": "daily"
    }
  ],
  "allergies": [
    {
      "allergen": "Penicillin",
      "severity": "severe"
    }
  ],
  "lifestyle": {
    "alcohol": "light",
    "smoking": "never"
  },
  "pregnancy_status": "not_pregnant"
}
```

---

## Role Management

### Supported Roles

| Role | Default Access | Verification Required | Sign-up Method |
|------|---------------|---------------------|----------------|
| **Patient** | DDI checker, ADMET summary, personal history | Email + SMS OTP | Google OAuth or Email |
| **Doctor** | Patient lookup, clinical DDI engine, prescription assistant | Medical license, institutional email | Email (admin approves) |
| **Pharmacist** | Dispensing assistant, DDI/ADMET checks, compounding guidance | Pharmacy license | Email (admin approves) |
| **Chemist** | Molecule input, virtual TLC, yield calculator | Institutional email, degree | Email (admin approves) |
| **Research Scientist** | Model training, datasets, explainability tools | ORCID, institutional email | Email (admin approves) |
| **Auditor/QA** | Read-only audit logs, compliance reports | Compliance cert | Email (admin approves) |
| **Admin/IT** | Full system access, user management, RBAC config | Enterprise approval | Email (manual setup) |

### Professional Role Signup

```
POST /api/v1/auth/signup
{
  "full_name": "Dr. John Smith",
  "email": "john.smith@hospital.com",
  "password": "SecurePassword123!",
  "mobile": "+1-555-123-4567",
  "role": "doctor",
  "organization": "City Hospital"
}

Response:
{
  "message": "Account created. Please submit verification documents.",
  "user_id": 789,
  "verification_required": true
}
```

### Verification Queue

Professionals must upload documents:
- Medical/Pharmacy License scan
- Institutional affiliation proof
- ORCID (for researchers)

**Endpoint**: `POST /api/v1/verification/queue`

```json
{
  "license_number": "MD123456",
  "institution": "City Hospital",
  "institution_email": "john.smith@hospital.com"
}
```

Admin reviews in dashboard and approves/rejects.

---

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE,
  password_hash VARCHAR(200),
  full_name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  mobile VARCHAR(20),
  role ENUM('patient', 'doctor', 'pharmacist', 'chemist', 'research_scientist', 'auditor', 'admin'),
  is_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  profile_complete BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  last_login TIMESTAMP
);
```

### Patient Profiles Table
```sql
CREATE TABLE patient_profiles (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER UNIQUE FOREIGN KEY,
  date_of_birth TIMESTAMP,
  sex_gender VARCHAR(50),
  weight_kg FLOAT,
  height_cm FLOAT,
  allergies JSON,
  current_medications JSON,
  past_medical_history JSON,
  egfr FLOAT,
  alt_ast JSON,
  pregnancy_status VARCHAR(50),
  alcohol_use VARCHAR(50),
  smoking_status VARCHAR(50),
  data_consent BOOLEAN DEFAULT FALSE,
  share_with_clinician BOOLEAN DEFAULT FALSE,
  clinician_email VARCHAR(100),
  patient_vector JSON,
  model_run_version VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTO_INCREMENT,
  user_id INTEGER FOREIGN KEY,
  action VARCHAR(200),
  resource_type VARCHAR(100),
  resource_id VARCHAR(200),
  details JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(50),
  error_message TEXT,
  created_at TIMESTAMP
);
```

---

## API Reference

### Authentication Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/v1/auth/login` | Email/password login | ❌ |
| POST | `/api/v1/auth/signup` | Professional signup | ❌ |
| POST | `/api/v1/auth/oauth/google` | Google OAuth callback | ❌ |
| POST | `/api/v1/auth/forgot-password` | Request password reset OTP | ❌ |
| POST | `/api/v1/auth/verify-otp` | Verify OTP & reset password | ❌ |
| POST | `/api/v1/auth/refresh` | Refresh access token | ❌ (refresh token) |
| POST | `/api/v1/auth/logout` | Logout & revoke tokens | ✅ |
| GET | `/api/v1/auth/me` | Get current user profile | ✅ |
| GET | `/api/v1/auth/sessions` | List active sessions | ✅ |
| DELETE | `/api/v1/auth/sessions/{id}` | Revoke session | ✅ |

### Patient Profile Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/v1/patients/profile` | Get patient profile | ✅ (Patient) |
| POST | `/api/v1/patients/profile` | Create/update profile | ✅ (Patient) |
| GET | `/api/v1/patients/vector` | Get patient vector & recommendations | ✅ (Patient) |
| GET | `/api/v1/patients/snapshots` | Get profile audit history | ✅ (Patient) |
| POST | `/api/v1/patients/export-pdf` | Export profile as PDF | ✅ (Patient) |

---

## Frontend Integration

### Login Component

```javascript
// src/pages/Login.jsx
import React, { useState } from 'react';
import './Login.css';

// Handle email login
const handleEmailLogin = async (email, password, rememberMe) => {
  const response = await fetch('/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, remember_me: rememberMe })
  });
  
  const data = await response.json();
  localStorage.setItem('access_token', data.access_token);
  if (data.refresh_token) {
    localStorage.setItem('refresh_token', data.refresh_token);
  }
  
  if (!data.profile_complete && data.role === 'patient') {
    navigate('/onboarding');
  } else {
    navigate('/dashboard');
  }
};
```

### Onboarding Modal Component

```javascript
// src/components/OnboardingModal.jsx
import OnboardingModal from '../components/OnboardingModal';

// In parent component
<OnboardingModal 
  userId={currentUser.id}
  userName={currentUser.full_name}
  onComplete={() => navigate('/dashboard')}
  onSkip={() => navigate('/dashboard')}
/>
```

### Protected Route Wrapper

```javascript
// src/utils/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';

export function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem('access_token');
  const userRole = localStorage.getItem('user_role');
  
  if (!token) return <Navigate to="/login" />;
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/unauthorized" />;
  }
  
  return children;
}

// Usage
<ProtectedRoute requiredRole="patient">
  <PatientDashboard />
</ProtectedRoute>
```

---

## Security & Compliance

### Token Management

- **Access Token**: 15-minute lifetime, stored in memory
- **Refresh Token**: 7-day lifetime, stored in httpOnly cookie
- **Token Rotation**: New refresh token on each refresh
- **Token Revocation**: Logout revokes all tokens

### Password Security

- **Hashing**: bcrypt with salt
- **Minimum Requirements**: 8+ characters, uppercase, lowercase, number
- **Professionals**: Additional MFA requirement

### Audit Logging

Every action logged with:
- User ID
- Action type (LOGIN, PROFILE_UPDATE, EXPORT, etc.)
- Resource type & ID
- IP Address
- User Agent
- Timestamp
- Success/Failure status

**Retention**: 7 years (GMP compliance)

### Data Protection

- **At Rest**: AES-256 encryption
- **In Transit**: TLS 1.3
- **Key Management**: HSM (optional)
- **Consent Management**: Explicit per-action consent

### GDPR Compliance

- Right to access: All user data exportable
- Right to erasure: Account deletion removes personal data (audit logs retained)
- Data portability: JSON export available
- Breach notification: Automatic alerts

---

## Deployment Checklist

### Pre-Deployment

- [ ] Database created and migrated
- [ ] Environment variables configured (.env file)
- [ ] JWT secret generated (use strong random value)
- [ ] Google OAuth credentials created
- [ ] Email service configured
- [ ] SSL certificates ready
- [ ] Rate limiting configured
- [ ] CORS origins whitelist set

### Database Setup

```bash
# Create database
createdb drugintel_db

# Run migrations
alembic upgrade head

# Seed initial admin user (if needed)
python scripts/seed_admin.py
```

### Environment Variables

```bash
cp backend/.env.example backend/.env

# Edit backend/.env with:
# - DATABASE_URL
# - JWT_SECRET
# - GOOGLE_CLIENT_ID/SECRET
# - SMTP settings
```

### Frontend Configuration

```javascript
// .env.local
REACT_APP_API_URL=https://api.drugintel.com
REACT_APP_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
REACT_APP_ENV=production
```

### Docker Deployment

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# Verify
curl https://api.drugintel.com/docs
```

### Verification Tests

- [ ] Login with email/password
- [ ] Login with Google OAuth
- [ ] Forgot password flow
- [ ] Patient onboarding modal
- [ ] Profile save & model re-run
- [ ] Audit logs created
- [ ] Session management
- [ ] Token refresh
- [ ] Logout on all devices

---

## Monitoring & Alerting

### Metrics to Track

- Login success rate
- Failed login attempts
- OAuth success rate
- Profile completion rate
- Average session duration
- Audit log creation rate

### Alerts to Configure

- Failed login attempts > 5 in 10 minutes → Rate limit
- Password reset attempts > 3 → Lock account
- Suspicious IP patterns → Alert admin
- Database errors → Page support team

---

## Next Steps

1. ✅ **Phase 1 (Complete)**: Authentication, patient onboarding, basic RBAC
2. 🔄 **Phase 2 (In Progress)**: Professional verification, role dashboards
3. 📅 **Phase 3**: Enterprise hardening, penetration testing, compliance audit
4. 📅 **Phase 4**: ML model integration, explainability artifacts, full compliance

---

## Support & Documentation

- **API Docs**: `https://api.drugintel.com/docs`
- **Database Queries**: See `database/` folder
- **Backend Code**: See `backend/` folder
- **Frontend Code**: See `frontend/src/` folder

For questions or issues, contact the development team.

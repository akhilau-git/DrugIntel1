// src/services/api.js
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: `${API_BASE}/api/v1`,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' }
});

// ── Patient Profile ──────────────────────────────────────────
export async function fetchPatientProfile() {
  try {
    const { data } = await client.get('/patients/me');
    return data;
  } catch {
    return null;
  }
}

export async function fetchLastModelRun(patientId) {
  // Placeholder — returns mock data until the backend model-run endpoint is built
  return null;
}

// ── DDI Check ────────────────────────────────────────────────
export async function runDDICheck({ patientId, medications }) {
  const { data } = await client.post('/ddi/check', {
    patient_id: patientId,
    medications: medications.map(m => ({
      name: typeof m === 'string' ? m : m.name,
      dose: m.dose || null,
      frequency: m.frequency || null
    }))
  });
  return data;
}

// ── Explainability Report ────────────────────────────────────
export async function fetchReport(modelRunId) {
  const { data } = await client.get(`/ddi/report/${modelRunId}`);
  return data;
}

// ── Share with Clinician ─────────────────────────────────────
export async function shareReport(payload) {
  const { data } = await client.post('/share', payload);
  return data;
}

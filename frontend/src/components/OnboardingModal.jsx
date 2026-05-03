import React, { useState } from 'react';
import './OnboardingModal.css';

const OnboardingModal = ({ userId, userName, onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Demographics
    dateOfBirth: '',
    sexGender: 'not_specified',
    weightKg: '',
    heightCm: '',
    
    // Medical
    allergies: [],
    currentMedications: [],
    pastMedicalHistory: [],
    egfr: '',
    alt: '',
    ast: '',
    labDate: '',
    pregnancyStatus: 'not_applicable',
    
    // Lifestyle
    alcoholUse: 'not_specified',
    smokingStatus: 'not_specified',
    
    // Consent
    dataConsent: false,
    shareWithClinician: false,
    clinicianEmail: ''
  });

  const [allergyInput, setAllergyInput] = useState('');
  const [medInput, setMedInput] = useState({ name: '', dose: '', frequency: '', route: 'oral' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const totalSteps = 4;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
  };

  const handleAddAllergy = () => {
    if (allergyInput.trim()) {
      setFormData(prev => ({
        ...prev,
        allergies: [...prev.allergies, { name: allergyInput, severity: 'moderate' }]
      }));
      setAllergyInput('');
    }
  };

  const handleRemoveAllergy = (index) => {
    setFormData(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index)
    }));
  };

  const handleAddMedication = () => {
    if (medInput.name.trim() && medInput.dose && medInput.frequency) {
      setFormData(prev => ({
        ...prev,
        currentMedications: [...prev.currentMedications, medInput]
      }));
      setMedInput({ name: '', dose: '', frequency: '', route: 'oral' });
    }
  };

  const handleRemoveMedication = (index) => {
    setFormData(prev => ({
      ...prev,
      currentMedications: prev.currentMedications.filter((_, i) => i !== index)
    }));
  };

  const handleMedInputChange = (field, value) => {
    setMedInput(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    // Validate current step
    if (currentStep === 1) {
      if (!formData.dateOfBirth || !formData.weightKg || !formData.heightCm) {
        setError('Please fill in all demographic fields');
        return;
      }
    } else if (currentStep === 3) {
      if (!formData.dataConsent) {
        setError('Please accept data consent to continue');
        return;
      }
    }
    
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
      setError('');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!formData.dataConsent) {
      setError('Please accept data consent');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/v1/patients/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          date_of_birth: new Date(formData.dateOfBirth).toISOString(),
          sex_gender: formData.sexGender,
          weight_kg: parseFloat(formData.weightKg),
          height_cm: parseFloat(formData.heightCm),
          allergies: formData.allergies,
          current_medications: formData.currentMedications,
          past_medical_history: formData.pastMedicalHistory,
          egfr: formData.egfr ? parseFloat(formData.egfr) : null,
          alt_ast: formData.alt || formData.ast ? {
            alt: formData.alt ? parseFloat(formData.alt) : null,
            ast: formData.ast ? parseFloat(formData.ast) : null,
            measurement_date: formData.labDate || new Date().toISOString()
          } : null,
          pregnancy_status: formData.pregnancyStatus,
          alcohol_use: formData.alcoholUse,
          smoking_status: formData.smokingStatus,
          data_consent: formData.dataConsent,
          share_with_clinician: formData.shareWithClinician,
          clinician_email: formData.clinicianEmail
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Failed to save profile');
      }

      onComplete();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">
        {/* Header */}
        <div className="onboarding-header">
          <div>
            <h1>Welcome, {userName}!</h1>
            <p>Complete your health profile for better recommendations</p>
          </div>
          <div className="progress-indicator">
            <span>{currentStep}/{totalSteps}</span>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {/* Step 1: Demographics */}
        {currentStep === 1 && (
          <div className="step-content">
            <h2>Demographics & Vital Information</h2>
            
            <div className="form-group">
              <label>Date of Birth *</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Sex/Gender</label>
                <select 
                  name="sexGender" 
                  value={formData.sexGender} 
                  onChange={handleInputChange}
                >
                  <option value="not_specified">Prefer not to say</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label>Weight (kg) *</label>
                <input
                  type="number"
                  name="weightKg"
                  value={formData.weightKg}
                  onChange={handleInputChange}
                  placeholder="70"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Height (cm) *</label>
                <input
                  type="number"
                  name="heightCm"
                  value={formData.heightCm}
                  onChange={handleInputChange}
                  placeholder="175"
                  step="0.1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Medical History */}
        {currentStep === 2 && (
          <div className="step-content">
            <h2>Medical History & Medications</h2>

            {/* Allergies */}
            <div className="form-group">
              <label>Allergies</label>
              <div className="input-group">
                <input
                  type="text"
                  value={allergyInput}
                  onChange={(e) => setAllergyInput(e.target.value)}
                  placeholder="e.g., Penicillin"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddAllergy()}
                />
                <button type="button" onClick={handleAddAllergy} className="btn-add">Add</button>
              </div>
              {formData.allergies.length > 0 && (
                <div className="tags">
                  {formData.allergies.map((allergy, idx) => (
                    <div key={idx} className="tag">
                      {allergy.name}
                      <button 
                        type="button" 
                        onClick={() => handleRemoveAllergy(idx)}
                        className="btn-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Current Medications */}
            <div className="form-group">
              <label>Current Medications</label>
              <div className="medication-input">
                <input
                  type="text"
                  placeholder="Drug name"
                  value={medInput.name}
                  onChange={(e) => handleMedInputChange('name', e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Dose"
                  value={medInput.dose}
                  onChange={(e) => handleMedInputChange('dose', e.target.value)}
                  step="0.1"
                />
                <input
                  type="text"
                  placeholder="Frequency (e.g., daily)"
                  value={medInput.frequency}
                  onChange={(e) => handleMedInputChange('frequency', e.target.value)}
                />
                <button type="button" onClick={handleAddMedication} className="btn-add">Add</button>
              </div>
              {formData.currentMedications.length > 0 && (
                <div className="medication-list">
                  {formData.currentMedications.map((med, idx) => (
                    <div key={idx} className="medication-item">
                      <span>{med.name} {med.dose} - {med.frequency}</span>
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMedication(idx)}
                        className="btn-remove"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lab Values */}
            <div className="form-group">
              <label>Recent Lab Values (Optional)</label>
              <div className="form-row">
                <input
                  type="number"
                  placeholder="eGFR"
                  name="egfr"
                  value={formData.egfr}
                  onChange={handleInputChange}
                  step="0.1"
                />
                <input
                  type="number"
                  placeholder="ALT"
                  name="alt"
                  value={formData.alt}
                  onChange={handleInputChange}
                  step="0.1"
                />
                <input
                  type="number"
                  placeholder="AST"
                  name="ast"
                  value={formData.ast}
                  onChange={handleInputChange}
                  step="0.1"
                />
              </div>
            </div>

            {/* Pregnancy Status */}
            {formData.sexGender === 'female' && (
              <div className="form-group">
                <label>Pregnancy Status</label>
                <select 
                  name="pregnancyStatus" 
                  value={formData.pregnancyStatus} 
                  onChange={handleInputChange}
                >
                  <option value="not_applicable">Not Applicable</option>
                  <option value="pregnant">Pregnant</option>
                  <option value="not_pregnant">Not Pregnant</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Lifestyle & Consent */}
        {currentStep === 3 && (
          <div className="step-content">
            <h2>Lifestyle & Consent</h2>

            <div className="form-row">
              <div className="form-group">
                <label>Alcohol Use</label>
                <select 
                  name="alcoholUse" 
                  value={formData.alcoholUse} 
                  onChange={handleInputChange}
                >
                  <option value="not_specified">Not specified</option>
                  <option value="none">None</option>
                  <option value="light">Light</option>
                  <option value="moderate">Moderate</option>
                  <option value="heavy">Heavy</option>
                </select>
              </div>

              <div className="form-group">
                <label>Smoking Status</label>
                <select 
                  name="smokingStatus" 
                  value={formData.smokingStatus} 
                  onChange={handleInputChange}
                >
                  <option value="not_specified">Not specified</option>
                  <option value="never">Never</option>
                  <option value="former">Former</option>
                  <option value="current">Current</option>
                </select>
              </div>
            </div>

            <div className="consent-section">
              <h3>Data Sharing & Consent</h3>
              
              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="dataConsent"
                  name="dataConsent"
                  checked={formData.dataConsent}
                  onChange={handleInputChange}
                  required
                />
                <label htmlFor="dataConsent">
                  I consent to DrugIntel processing my health data for drug interaction analysis and safety recommendations. *
                </label>
              </div>

              <div className="checkbox-group">
                <input
                  type="checkbox"
                  id="shareWithClinician"
                  name="shareWithClinician"
                  checked={formData.shareWithClinician}
                  onChange={handleInputChange}
                />
                <label htmlFor="shareWithClinician">
                  I want to share my profile with a clinician
                </label>
              </div>

              {formData.shareWithClinician && (
                <div className="form-group">
                  <label>Clinician Email</label>
                  <input
                    type="email"
                    name="clinicianEmail"
                    value={formData.clinicianEmail}
                    onChange={handleInputChange}
                    placeholder="doctor@hospital.com"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 4: Review & Complete */}
        {currentStep === 4 && (
          <div className="step-content">
            <h2>Profile Summary</h2>
            
            <div className="review-section">
              <div className="review-group">
                <h4>Demographics</h4>
                <p>Age: {formData.dateOfBirth ? Math.floor((new Date() - new Date(formData.dateOfBirth)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A'} years</p>
                <p>Weight: {formData.weightKg} kg, Height: {formData.heightCm} cm</p>
                {formData.weightKg && formData.heightCm && (
                  <p>BMI: {(formData.weightKg / Math.pow(formData.heightCm / 100, 2)).toFixed(1)}</p>
                )}
              </div>

              {formData.allergies.length > 0 && (
                <div className="review-group">
                  <h4>Allergies</h4>
                  <p>{formData.allergies.map(a => a.name).join(', ')}</p>
                </div>
              )}

              {formData.currentMedications.length > 0 && (
                <div className="review-group">
                  <h4>Current Medications</h4>
                  <p>{formData.currentMedications.length} medication(s) recorded</p>
                </div>
              )}

              <div className="review-group">
                <h4>Data Sharing</h4>
                <p>
                  {formData.shareWithClinician 
                    ? `Sharing enabled with ${formData.clinicianEmail}` 
                    : 'Personal use only'}
                </p>
              </div>
            </div>

            <p className="review-note">
              ✓ Your profile is secure and encrypted. You can update it anytime.
            </p>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="modal-footer">
          <button 
            onClick={onSkip} 
            className="btn btn-secondary"
            disabled={loading}
          >
            Skip for Now
          </button>
          
          <div className="nav-buttons">
            {currentStep > 1 && (
              <button 
                onClick={handlePrevious} 
                className="btn btn-secondary"
                disabled={loading}
              >
                ← Previous
              </button>
            )}
            
            {currentStep < totalSteps ? (
              <button 
                onClick={handleNext} 
                className="btn btn-primary"
                disabled={loading}
              >
                Next →
              </button>
            ) : (
              <button 
                onClick={handleSubmit} 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;

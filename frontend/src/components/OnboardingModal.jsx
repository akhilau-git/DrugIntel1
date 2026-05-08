import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export default function OnboardingModal({ user, onComplete, onSkip }) {
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [successMsg, setSuccessMsg] = useState(null)
    
    // Step 1: Identity
    const [fullName, setFullName] = useState(user?.full_name || '')
    const [email, setEmail] = useState(user?.email || '')
    const [mobile, setMobile] = useState('')
    
    // Step 2: Demographics
    const [dob, setDob] = useState('')
    const [sex, setSex] = useState('')
    const [weight, setWeight] = useState('')
    const [height, setHeight] = useState('')
    
    // Step 3: Medical History
    const [allergies, setAllergies] = useState([])
    const [allergyText, setAllergyText] = useState('')
    const [medications, setMedications] = useState([])
    const [medName, setMedName] = useState('')
    const [medDose, setMedDose] = useState('')
    const [medFreq, setMedFreq] = useState('daily')
    const [chronicConditions, setChronicConditions] = useState([])
    
    // Step 4: Consent
    const [consentData, setConsentData] = useState(false)
    const [shareWithClinician, setShareWithClinician] = useState(false)

    const handleAddAllergy = () => {
        if (allergyText.trim()) {
            setAllergies([...allergies, allergyText])
            setAllergyText('')
        }
    }

    const handleRemoveAllergy = (index) => {
        setAllergies(allergies.filter((_, i) => i !== index))
    }

    const handleAddMed = () => {
        if (medName.trim() && medDose.trim()) {
            setMedications([...medications, {
                name: medName,
                dose: medDose,
                frequency: medFreq,
                startDate: new Date().toISOString().split('T')[0]
            }])
            setMedName('')
            setMedDose('')
            setMedFreq('daily')
        }
    }

    const handleRemoveMed = (index) => {
        setMedications(medications.filter((_, i) => i !== index))
    }

    const handleToggleCondition = (condition) => {
        if (chronicConditions.includes(condition)) {
            setChronicConditions(chronicConditions.filter(c => c !== condition))
        } else {
            setChronicConditions([...chronicConditions, condition])
        }
    }

    const handleSubmit = async () => {
        setError(null)
        if (step === 1) {
            if (!fullName || !mobile) { setError('Full name and mobile are required.'); return; }
        } else if (step === 2) {
            if (!dob || !sex || !weight) { setError('Date of birth, sex/gender, and weight are required.'); return; }
            if (parseFloat(weight) < 20 || parseFloat(weight) > 300) { setError('Weight must be between 20 and 300 kg.'); return; }
            if (new Date(dob) >= new Date()) { setError('Date of birth must be in the past.'); return; }
        }

        if (step < 4) {
            setStep(step + 1)
            return
        }

        if (!consentData) {
            setError('You must consent to data usage to continue.')
            return
        }

        setLoading(true)
        setError(null)

        try {
            await axios.post(`${API}/api/v1/patients/profile`, {
                full_name: fullName,
                email: email,
                mobile: mobile,
                date_of_birth: dob,
                sex: sex,
                weight_kg: parseFloat(weight),
                height_cm: parseFloat(height) || undefined,
                allergies: allergies.length > 0 ? allergies : [],
                current_medications: medications.length > 0 ? medications.map(m => ({
                    name: m.name || "Unknown", 
                    dose_mg: parseFloat(m.dose) || 1.0, 
                    frequency: m.frequency || "once_daily"
                })) : [],
                chronic_conditions: chronicConditions,
                alcohol_use: "none",
                smoking_status: "never",
                consent: consentData,
                share_with_clinician: shareWithClinician
            })

            setSuccessMsg('Profile saved — we used this data to update your DDI and dosing results.')
            setTimeout(() => onComplete(), 3000)
        } catch (err) {
            setError(err.response?.data?.detail || err.message)
            setLoading(false)
        }
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const stepTitles = ['Identity', 'Demographics', 'Medical History', 'Consent & Sharing']
    const progressPercent = (step / 4) * 100

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
            background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', zIndex: 999, backdropFilter: 'blur(3px)'
        }}>
            <div style={{
                background: 'linear-gradient(180deg, rgba(38, 65, 115, 0.98) 0%, rgba(18, 30, 58, 0.99) 100%)',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', 
                width: '90%', maxWidth: 600, maxHeight: '85vh', overflowY: 'auto',
                boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                padding: '40px', color: '#e2e8f0', fontFamily: "'Inter', sans-serif"
            }}>
                {/* Header */}
                <div style={{ marginBottom: 30 }}>
                    <h2 style={{ margin: '0 0 8px 0', fontSize: 28, fontWeight: 700, color: '#fff' }}>
                        Complete your Patient Profile (1 minute)
                    </h2>
                    <p style={{ margin: 0, fontSize: 14, color: '#cbd5e1' }}>
                        {stepTitles[step - 1]} • Complete your profile later to enable personalized dosing and history‑aware checks.
                    </p>
                </div>

                {/* Progress Bar */}
                <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 3, marginBottom: 20, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%', width: `${progressPercent}%`,
                        background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
                        transition: 'width 0.3s ease'
                    }} />
                </div>

                {/* Error and Success */}
                {error && (
                    <div style={{
                        background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', padding: 12,
                        borderRadius: 4, marginBottom: 20, fontSize: 13, border: '1px solid rgba(220,38,38,0.5)'
                    }}>
                        {error}
                    </div>
                )}
                {successMsg && (
                    <div style={{
                        background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', padding: 12,
                        borderRadius: 4, marginBottom: 20, fontSize: 13, border: '1px solid rgba(34,197,94,0.5)'
                    }}>
                        {successMsg}
                    </div>
                )}

                {/* Step 1: Identity */}
                {step === 1 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <InputField label="Full Name" value={fullName} onChange={setFullName} />
                        <InputField label="Email" type="email" value={email} disabled />
                        <InputField label="Mobile (for OTP)" type="tel" value={mobile} onChange={setMobile} placeholder="+1234567890" />
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: '12px 0 0 0' }}>
                            We'll use your mobile for multi-factor authentication and emergency alerts.
                        </p>
                    </div>
                )}

                {/* Step 2: Demographics */}
                {step === 2 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <InputField label="Date of Birth" type="date" value={dob} onChange={setDob} />
                        <SelectField label="Sex / Gender" value={sex} onChange={setSex} options={['', 'Male', 'Female', 'Other', 'Prefer Not to Say']} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            <InputField label="Weight (kg)" type="number" value={weight} onChange={setWeight} placeholder="70" />
                            <InputField label="Height (cm)" type="number" value={height} onChange={setHeight} placeholder="180" />
                        </div>
                    </div>
                )}

                {/* Step 3: Medical History */}
                {step === 3 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Allergies */}
                        <div>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#f1f5f9' }}>
                                Allergies (Drug & Environmental)
                            </label>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <input type="text" value={allergyText} onChange={e => setAllergyText(e.target.value)} 
                                    placeholder="e.g. Penicillin, Peanuts" style={{...inputStyle, flex: 1}} />
                                <button onClick={handleAddAllergy} style={buttonStyle}>Add</button>
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                {allergies.map((allergy, i) => (
                                    <div key={i} style={{
                                        background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', padding: '6px 12px',
                                        borderRadius: 4, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8
                                    }}>
                                        {allergy}
                                        <button onClick={() => handleRemoveAllergy(i)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer', fontSize: 16 }}>×</button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Medications */}
                        <div>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#f1f5f9' }}>
                                Current Medications
                            </label>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 8 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 8 }}>
                                    <input type="text" value={medName} onChange={e => setMedName(e.target.value)} 
                                        placeholder="Drug name" style={inputStyle} />
                                    <input type="text" value={medDose} onChange={e => setMedDose(e.target.value)} 
                                        placeholder="Dose (e.g. 500mg)" style={inputStyle} />
                                    <select value={medFreq} onChange={e => setMedFreq(e.target.value)} style={inputStyle}>
                                        <option value="daily">Daily</option>
                                        <option value="twice_daily">2x Daily</option>
                                        <option value="weekly">Weekly</option>
                                        <option value="as_needed">As Needed</option>
                                    </select>
                                </div>
                                <button onClick={handleAddMed} style={buttonStyle}>Add Medication</button>
                            </div>
                            {medications.map((med, i) => (
                                <div key={i} style={{
                                    background: 'rgba(59, 130, 246, 0.15)', padding: 10, borderRadius: 4,
                                    marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: 13 }}>{med.name} • {med.dose} • {med.frequency}</span>
                                    <button onClick={() => handleRemoveMed(i)} style={{ background: 'none', border: 'none', color: '#fca5a5', cursor: 'pointer' }}>×</button>
                                </div>
                            ))}
                        </div>

                        {/* Chronic Conditions */}
                        <div>
                            <label style={{ display: 'block', fontSize: 14, fontWeight: 600, marginBottom: 8, color: '#f1f5f9' }}>
                                Chronic Conditions
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                {['Hypertension', 'Diabetes', 'CKD', 'Liver Disease', 'Heart Disease', 'Asthma'].map(cond => (
                                    <label key={cond} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                                        <input type="checkbox" checked={chronicConditions.includes(cond)} 
                                            onChange={() => handleToggleCondition(cond)} style={{ accentColor: '#3b82f6' }} />
                                        {cond}
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 4: Consent */}
                {step === 4 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: 16, borderRadius: 4, border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                            <h4 style={{ margin: '0 0 8px 0', fontSize: 14, fontWeight: 600 }}>Data Usage & Privacy</h4>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: '#cbd5e1' }}>
                                Your health data will be encrypted and used to:
                                <br />• Check drug-drug interactions (DDI)
                                <br />• Predict absorption & metabolism (ADMET)
                                <br />• Suggest safe dosages
                                <br />• Generate audit trails for compliance
                                <br /><br />
                                <strong>You can delete your account anytime.</strong> All data is encrypted at rest and in transit (AES-256 / TLS 1.3).
                            </p>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                            <input type="checkbox" checked={consentData} onChange={e => setConsentData(e.target.checked)} 
                                style={{ accentColor: '#3b82f6', marginTop: 2, minWidth: 18, minHeight: 18 }} />
                            <span style={{ fontSize: 13 }}>
                                I understand and consent to my health data being used for safety analysis as described above.
                            </span>
                        </label>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                            <input type="checkbox" checked={shareWithClinician} onChange={e => setShareWithClinician(e.target.checked)} 
                                style={{ accentColor: '#3b82f6', marginTop: 2, minWidth: 18, minHeight: 18 }} />
                            <span style={{ fontSize: 13 }}>
                                I allow a healthcare provider (with my permission) to view my profile and recommendations.
                            </span>
                        </label>
                    </div>
                )}

                {/* Buttons */}
                <div style={{ display: 'flex', gap: 12, marginTop: 30, justifyContent: 'space-between' }}>
                    {step > 1 ? (
                        <button onClick={handleBack} disabled={loading} style={{
                            ...buttonStyle, flex: 0.3, background: 'rgba(255,255,255,0.1)', 
                            border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0'
                        }}>
                            Back
                        </button>
                    ) : (
                        <button onClick={onSkip} disabled={loading} style={{
                            ...buttonStyle, flex: 0.3, background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)', color: '#e2e8f0'
                        }}>
                            Skip — limited access
                        </button>
                    )}
                    <button onClick={handleSubmit} disabled={loading} style={{
                        ...buttonStyle, flex: 1, 
                        background: step === 4 ? 'linear-gradient(180deg, #4ade80 0%, #22c55e 100%)' : 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)',
                        color: '#fff'
                    }}>
                        {loading ? 'Saving...' : step === 4 ? 'Complete now' : 'Next'}
                    </button>
                </div>
            </div>
        </div>
    )
}

function InputField({ label, type = 'text', value, onChange, disabled = false, placeholder = '' }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#f1f5f9' }}>
                {label}
            </label>
            <input type={type} value={value} onChange={e => onChange(e.target.value)} disabled={disabled}
                placeholder={placeholder} style={{...inputStyle, opacity: disabled ? 0.6 : 1}} />
        </div>
    )
}

function SelectField({ label, value, onChange, options }) {
    return (
        <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: '#f1f5f9' }}>
                {label}
            </label>
            <select value={value} onChange={e => onChange(e.target.value)} style={inputStyle}>
                {options.map(opt => (
                    <option key={opt} value={opt} style={{ background: '#0f172a', color: opt ? '#fff' : '#94a3b8' }}>
                        {opt || 'Select...'}
                    </option>
                ))}
            </select>
        </div>
    )
}

const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: 4,
    border: '1px solid rgba(255,255,255,0.15)', background: '#0f172a',
    color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none'
}

const buttonStyle = {
    padding: '10px 16px', borderRadius: 4, border: 'none', fontSize: 13,
    fontWeight: 600, cursor: 'pointer', transition: 'transform 0.1s'
}

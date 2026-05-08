import { useState, useEffect } from 'react'
import axios from 'axios'
import OnboardingModal from '../components/OnboardingModal'
import './Login.css'

const API = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export default function Login({ onLoginSuccess }) {
    const [view, setView] = useState('login') // login, signup, forgot
    const [showOnboarding, setShowOnboarding] = useState(false)
    const [currentUser, setCurrentUser] = useState(null)
    const [showSupport, setShowSupport] = useState(false)
    
    // Form state
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [mobile, setMobile] = useState('')
    const [organization, setOrganization] = useState('')
    const [role, setRole] = useState('patient')
    const [licenseNumber, setLicenseNumber] = useState('')
    const [consent, setConsent] = useState(false)
    const [otp, setOtp] = useState('')
    
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState(1) // For multi-step forms
    
    // Background effect variables
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const toggleView = (newView) => {
        setView(newView)
        setError(null)
        setSuccess(null)
        setStep(1)
        // Reset sensitive fields
        setPassword('')
        setConfirmPassword('')
        setOtp('')
    }

    const handleLoginSuccessCallback = (userData) => {
        if (userData.profile_complete === false) {
            setCurrentUser(userData)
            setShowOnboarding(true)
        } else {
            onLoginSuccess(userData)
        }
    }

    const handleGoogleLogin = async () => {
        setError(null); setLoading(true)
        try {
            const res = await axios.post(`${API}/api/v1/auth/oauth/google`, {
                token: "mock_google_token_12345",
                device_id: "browser-google-" + Date.now(),
                device_name: "Web Browser"
            })
            handleLoginSuccessCallback(res.data)
        } catch (err) {
            setError(err.response?.data?.detail || "Google login failed.")
        } finally { setLoading(false) }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null); setSuccess(null); setLoading(true)

        try {
            if (view === 'login') {
                if (!email || !password) throw new Error("Please enter email and password.")
                const res = await axios.post(`${API}/api/v1/auth/login`, { email, password })
                handleLoginSuccessCallback(res.data)
                
            } else if (view === 'signup') {
                if (step === 1) {
                    if (!role) throw new Error("Please select a role.")
                    setStep(2); setLoading(false); return;
                }
                
                if (password !== confirmPassword) throw new Error("Passwords do not match.")
                if (password.length < 12) throw new Error("Password must be at least 12 characters.")
                
                await axios.post(`${API}/api/v1/auth/signup`, {
                    full_name: fullName,
                    email, password, mobile,
                    role,
                    organization: organization || undefined,
                    license_number: licenseNumber || undefined,
                    consent: role === 'patient' ? consent : undefined,
                    institutional_email: role !== 'patient' ? email : undefined,
                    documents: [] 
                })
                
                setSuccess("Account created successfully! Please log in.")
                setTimeout(() => toggleView('login'), 2000)
                
            } else if (view === 'forgot') {
                if (step === 1) {
                    if (!email) throw new Error("Please enter your email.")
                    await axios.post(`${API}/api/v1/auth/forgot-password`, { email })
                    setSuccess("OTP sent to your email and mobile.")
                    setStep(2)
                } else if (step === 2) {
                    if (!otp || !password) throw new Error("Please enter OTP and new password.")
                    await axios.post(`${API}/api/v1/auth/verify-otp`, { email, otp, new_password: password })
                    setSuccess("Password reset successful. Please log in.")
                    setTimeout(() => toggleView('login'), 2000)
                }
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.message)
        } finally {
            setLoading(false)
        }
    }

    // Dynamic background style based on mouse
    const bgStyle = {
        '--tx': `${(mousePos.x - window.innerWidth / 2) * 0.05}px`,
        '--ty': `${(mousePos.y - window.innerHeight / 2) * 0.05}px`
    }

    return (
        <div className="login-page" style={bgStyle}>
            {/* Animated Background Elements */}
            <div className="login-bg-layer" />
            <div className="login-orb login-orb--1" />
            <div className="login-orb login-orb--2" />
            <div className="login-orb login-orb--3" />

            {/* Support Modal */}
            {showSupport && (
                <div className="support-modal-overlay" onClick={() => setShowSupport(false)}>
                    <div className="support-modal" onClick={e => e.stopPropagation()}>
                        <h3>Contact Support</h3>
                        <p>Our engineering team is available 24/7 for technical assistance and account recovery.</p>
                        <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
                            <div className="input-group">
                                <label>Email Address</label>
                                <div className="input-wrapper">
                                    <input type="email" placeholder="Enter your email" />
                                </div>
                            </div>
                            <div className="input-group">
                                <label>Issue Description</label>
                                <div className="input-wrapper">
                                    <textarea style={{width:'100%', padding:'12px', background:'var(--input-bg)', border:'1px solid var(--input-border)', borderRadius:'12px', color:'#fff', minHeight:'100px'}} placeholder="Describe your issue..."></textarea>
                                </div>
                            </div>
                            <button className="btn-login btn-primary" onClick={() => {setShowSupport(false); setSuccess("Support ticket submitted.");}}>
                                Submit Ticket
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showOnboarding && currentUser && (
                <OnboardingModal
                    user={currentUser}
                    onComplete={() => onLoginSuccess({...currentUser, profile_complete: true})}
                    onSkip={() => onLoginSuccess(currentUser)}
                />
            )}

            <div className="login-content">
                <div className="login-brand">
                    <div className="login-brand-row">
                        <div className="login-brand-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                                <circle cx="9" cy="11" r="1.5" fill="#fff" />
                                <circle cx="15" cy="9" r="1.5" fill="#fff" />
                                <path d="M9 11l6-2M15 9l-2 6" stroke="#fff" strokeWidth="1.5" />
                            </svg>
                        </div>
                        <h1>DrugIntel</h1>
                    </div>
                    <span className="login-brand-tagline">AI-Powered Drug Discovery & Safety Intelligence</span>
                </div>

                <div className="login-card">
                    <div className="login-tabs">
                        <button className={`login-tab ${view === 'login' ? 'active' : ''}`} onClick={() => toggleView('login')}>Sign In</button>
                        <button className={`login-tab ${view === 'signup' ? 'active' : ''}`} onClick={() => toggleView('signup')}>Create Account</button>
                    </div>

                    <div className="login-card-body">
                        <h2>
                            {view === 'login' ? 'Welcome Back' : 
                             view === 'signup' ? 'Enterprise Registration' : 'Account Recovery'}
                        </h2>
                        <p className="login-subtitle">
                            {view === 'login' ? 'Securely access your healthcare intelligence dashboard.' : 
                             view === 'signup' && step === 1 ? 'Select your professional or patient role to continue.' :
                             view === 'signup' && step === 2 ? 'Complete your profile details below.' :
                             view === 'forgot' && step === 1 ? 'Enter your email to receive a recovery code.' :
                             'Enter your 6-digit OTP and new password.'}
                        </p>

                        {error && <div className="login-alert error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                            {error}
                        </div>}
                        
                        {success && <div className="login-alert success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                            {success}
                        </div>}

                        <form className="login-form" onSubmit={handleSubmit}>
                            {/* ── LOGIN VIEW ── */}
                            {view === 'login' && (
                                <>
                                    <div className="input-group">
                                        <label>Email / Username</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                                            </span>
                                            <input type="text" placeholder="Enter your email" value={email} onChange={e => setEmail(e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Password</label>
                                        <div className="input-wrapper">
                                            <span className="input-icon">
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                                            </span>
                                            <input type="password" placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                                        </div>
                                        <div className="forgot-link">
                                            <a href="#" onClick={(e) => { e.preventDefault(); toggleView('forgot'); }}>Forgot Password?</a>
                                        </div>
                                    </div>

                                    <div className="remember-me">
                                        <input type="checkbox" id="rem" />
                                        <label htmlFor="rem" style={{color:'var(--text-secondary)', fontSize:'13px'}}>Keep me securely logged in</label>
                                    </div>

                                    <button type="submit" disabled={loading} className="btn-login btn-primary">
                                        <div className="btn-shimmer" />
                                        {loading ? 'Authenticating...' : 'Sign In'}
                                    </button>

                                    <div className="login-divider">or connect with</div>

                                    <button type="button" onClick={handleGoogleLogin} disabled={loading} className="btn-google">
                                        <svg width="20" height="20" viewBox="0 0 48 48">
                                            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                                            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                                            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                                            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                                        </svg>
                                        Google (Patient Only)
                                    </button>
                                </>
                            )}

                            {/* ── SIGNUP VIEW ── */}
                            {view === 'signup' && step === 1 && (
                                <>
                                    <div className="signup-role-grid">
                                        <div className={`role-card ${role === 'patient' ? 'selected' : ''}`} onClick={() => setRole('patient')}>
                                            <span className="role-card-icon">🩺</span>
                                            <span className="role-card-label">Patient</span>
                                        </div>
                                        <div className={`role-card ${role === 'doctor' ? 'selected' : ''}`} onClick={() => setRole('doctor')}>
                                            <span className="role-card-icon">👨‍⚕️</span>
                                            <span className="role-card-label">Physician / Doctor</span>
                                        </div>
                                        <div className={`role-card ${role === 'research_scientist' ? 'selected' : ''}`} onClick={() => setRole('research_scientist')}>
                                            <span className="role-card-icon">🔬</span>
                                            <span className="role-card-label">Research Scientist</span>
                                        </div>
                                        <div className={`role-card ${role === 'pharmacist' ? 'selected' : ''}`} onClick={() => setRole('pharmacist')}>
                                            <span className="role-card-icon">💊</span>
                                            <span className="role-card-label">Pharmacist</span>
                                        </div>
                                    </div>
                                    <p style={{fontSize:'12px', color:'var(--text-muted)', textAlign:'center', margin:'0 0 10px'}}>
                                        Professionals require license verification before full access is granted.
                                    </p>
                                    <button type="submit" className="btn-login btn-primary">
                                        Continue Setup
                                    </button>
                                </>
                            )}

                            {view === 'signup' && step === 2 && (
                                <>
                                    <div className="input-group">
                                        <label>Full Name</label>
                                        <div className="input-wrapper">
                                            <input type="text" placeholder="John Doe" value={fullName} onChange={e => setFullName(e.target.value)} required/>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>{role === 'patient' ? 'Email Address' : 'Institutional Email'}</label>
                                        <div className="input-wrapper">
                                            <input type="email" placeholder="john@example.com" value={email} onChange={e => setEmail(e.target.value)} required/>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Mobile Number (For OTP)</label>
                                        <div className="input-wrapper">
                                            <input type="tel" placeholder="+1234567890" value={mobile} onChange={e => setMobile(e.target.value)} required/>
                                        </div>
                                    </div>

                                    {role !== 'patient' && (
                                        <>
                                            <div className="input-group">
                                                <label>Institution / Hospital</label>
                                                <div className="input-wrapper">
                                                    <input type="text" placeholder="General Hospital" value={organization} onChange={e => setOrganization(e.target.value)} required/>
                                                </div>
                                            </div>
                                            <div className="input-group">
                                                <label>Medical/Professional License #</label>
                                                <div className="input-wrapper">
                                                    <input type="text" placeholder="LIC-12345" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} required/>
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    <div className="input-group">
                                        <label>Create Password</label>
                                        <div className="input-wrapper">
                                            <input type="password" placeholder="Min 12 characters" value={password} onChange={e => setPassword(e.target.value)} required/>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>Confirm Password</label>
                                        <div className="input-wrapper">
                                            <input type="password" placeholder="Confirm password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required/>
                                        </div>
                                    </div>

                                    {role === 'patient' && (
                                        <div className="remember-me" style={{marginTop:'8px'}}>
                                            <input type="checkbox" id="consent" checked={consent} onChange={e => setConsent(e.target.checked)} required />
                                            <label htmlFor="consent" style={{color:'var(--text-secondary)', fontSize:'12px'}}>
                                                I consent to anonymized data collection for cardiovascular AI research.
                                            </label>
                                        </div>
                                    )}

                                    <div style={{display:'flex', gap:'10px', marginTop:'8px'}}>
                                        <button type="button" onClick={() => setStep(1)} className="btn-login" style={{background:'rgba(255,255,255,0.05)', color:'#fff'}}>Back</button>
                                        <button type="submit" disabled={loading} className="btn-login btn-primary">
                                            <div className="btn-shimmer" />
                                            {loading ? 'Creating...' : 'Register Account'}
                                        </button>
                                    </div>
                                </>
                            )}

                            {/* ── FORGOT PASSWORD VIEW ── */}
                            {view === 'forgot' && step === 1 && (
                                <>
                                    <div className="input-group">
                                        <label>Account Email</label>
                                        <div className="input-wrapper">
                                            <input type="email" placeholder="Enter your registered email" value={email} onChange={e => setEmail(e.target.value)} required/>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="btn-login btn-primary">
                                        <div className="btn-shimmer" />
                                        {loading ? 'Sending...' : 'Send Recovery OTP'}
                                    </button>
                                </>
                            )}

                            {view === 'forgot' && step === 2 && (
                                <>
                                    <div className="input-group">
                                        <label>Enter 6-Digit OTP</label>
                                        <div className="otp-container">
                                            <input type="text" className="otp-input" maxLength={6} placeholder="------" value={otp} onChange={e => setOtp(e.target.value)} style={{width:'100%', letterSpacing:'10px'}} required/>
                                        </div>
                                    </div>
                                    <div className="input-group">
                                        <label>New Password</label>
                                        <div className="input-wrapper">
                                            <input type="password" placeholder="Min 12 characters" value={password} onChange={e => setPassword(e.target.value)} required/>
                                        </div>
                                    </div>
                                    <button type="submit" disabled={loading} className="btn-login btn-primary">
                                        <div className="btn-shimmer" />
                                        {loading ? 'Resetting...' : 'Confirm Reset'}
                                    </button>
                                </>
                            )}
                        </form>
                    </div>

                    <div className="login-card-footer">
                        <div className="footer-links">
                            <button className="footer-link">Terms</button>
                            <span className="footer-sep">•</span>
                            <button className="footer-link">Privacy</button>
                        </div>
                        <button className="footer-link" onClick={() => setShowSupport(true)}>Need Help?</button>
                    </div>
                </div>
            </div>

            <div className="login-page-footer">
                <span>© 2026 DrugIntel Enterprise Platform</span>
                <span className="sep">|</span>
                <span className="hipaa-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                    HIPAA Ready
                </span>
                <span className="sep">|</span>
                <span>ISO 27001</span>
            </div>
        </div>
    )
}

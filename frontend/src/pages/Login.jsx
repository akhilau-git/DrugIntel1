import { useState } from 'react'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || '/api';

export default function Login({ onLoginSuccess }) {
    const [view, setView] = useState('login')
    const isSignUp = view === 'signup'
    const isForgot = view === 'forgot'
    
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    
    // Sign Up specifics
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [organization, setOrganization] = useState('')
    const [industry, setIndustry] = useState('')

    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [loading, setLoading] = useState(false)

    const toggleView = (newView) => {
        setView(newView)
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setFullName('')
        setEmail('')
        setOrganization('')
        setIndustry('')
        setError(null)
        setSuccess(null)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)
        setLoading(true)

        try {
            if (isForgot) {
                if (!username || !password) { setError("Please enter your email/username and a new password."); setLoading(false); return; }
                if (password.length < 8) { setError("Security Error: Password must be at least 8 characters long."); setLoading(false); return; }
                if (!/[A-Z]/.test(password)) { setError("Security Error: Password must contain at least one uppercase letter."); setLoading(false); return; }
                if (!/[a-z]/.test(password)) { setError("Security Error: Password must contain at least one lowercase letter."); setLoading(false); return; }
                if (!/[0-9]/.test(password)) { setError("Security Error: Password must contain at least one number."); setLoading(false); return; }
                
                await axios.post(`${API}/auth/reset-password`, {
                    username_or_email: username,
                    new_password: password
                })
                
                setSuccess("✅ Password reset successfully. Please log in with your new password.")
                setUsername('')
                setPassword('')
                setLoading(false)
                setTimeout(() => toggleView('login'), 2500)
                return
            }
            if (isSignUp) {
                if (password.length < 8) { setError("Security Error: Password must be at least 8 characters long."); setLoading(false); return; }
                if (!/[A-Z]/.test(password)) { setError("Security Error: Password must contain at least one uppercase letter."); setLoading(false); return; }
                if (!/[a-z]/.test(password)) { setError("Security Error: Password must contain at least one lowercase letter."); setLoading(false); return; }
                if (!/[0-9]/.test(password)) { setError("Security Error: Password must contain at least one number."); setLoading(false); return; }
                if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) { setError("Security Error: Password must contain at least one special character."); setLoading(false); return; }
                if (password !== confirmPassword) { setError("Passwords do not match. Please try again."); setLoading(false); return; }
                
                await axios.post(`${API}/auth/register`, {
                    username, password, full_name: fullName, 
                    email, organization, industry, role: industry === 'gov' ? 'auditor' : 'chemist'
                })
                toggleView('login')
                setSuccess("Registration successful. Please log in.")
            } else {
                const formData = new URLSearchParams()
                formData.append('username', username)
                formData.append('password', password)
                
                const res = await axios.post(`${API}/auth/login`, formData, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                })
                
                onLoginSuccess({
                    token: res.data.access_token,
                    role: res.data.role,
                    full_name: res.data.full_name,
                    industry: res.data.industry
                })
            }
        } catch (err) {
            setError(err.response?.data?.detail || err.response?.data?.error || err.message)
        }
        setLoading(false)
    }

    return (
        <div style={{
            height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column',
            background: `linear-gradient(rgba(6, 17, 37, 0.5), rgba(6, 17, 37, 0.7)), url('/login-bg-3.png') center/cover no-repeat, #061125`,
            position: 'relative', overflow: 'hidden', fontFamily: "'Inter', 'Segoe UI', Roboto, sans-serif"
        }}>
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '40px 20px 80px 20px', boxSizing: 'border-box', zIndex: 10 }}>
            {/* Top Logo Section */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 25, zIndex: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="url(#shield-grad)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <defs>
                            <linearGradient id="shield-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#ffffff" />
                                <stop offset="100%" stopColor="#94a3b8" />
                            </linearGradient>
                        </defs>
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="rgba(255,255,255,0.02)"/>
                        {/* Inner molecule dots representing DrugIntel */}
                        <circle cx="9" cy="11" r="1.5" fill="#ffffff" />
                        <circle cx="15" cy="9" r="1.5" fill="#ffffff" />
                        <circle cx="13" cy="15" r="1.5" fill="#ffffff" />
                        <path d="M9 11l6-2M15 9l-2 6" stroke="#ffffff" strokeWidth="1.5" />
                    </svg>
                    <h1 style={{ fontSize: 42, fontWeight: 600, margin: 0, color: '#e2e8f0', letterSpacing: '0.5px' }}>DrugIntel</h1>
                </div>
                <p style={{ margin: 0, color: '#cbd5e1', fontSize: 16, letterSpacing: '0.3px', fontWeight: 500 }}>AI-Powered Drug Discovery & Safety Intelligence</p>
            </div>

            {/* Login Box */}
            <div style={{
                zIndex: 10, width: '100%', maxWidth: isSignUp ? 500 : 460,
                background: 'linear-gradient(180deg, rgba(38, 65, 115, 0.95) 0%, rgba(18, 30, 58, 0.98) 100%)',
                borderRadius: 4,
                border: '1px solid rgba(255, 255, 255, 0.35)',
                boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255,255,255,0.4)',
                transition: 'max-width 0.3s ease',
                display: 'flex', flexDirection: 'column'
            }}>
                <div style={{ padding: '30px 40px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ textAlign: 'center', marginBottom: 25 }}>
                        <h2 style={{ fontSize: 28, color: '#ffffff', marginTop: 0, marginBottom: 8, fontWeight: 600 }}>{isSignUp ? 'Official Registration' : isForgot ? 'Reset Password' : 'Welcome Back'}</h2>
                        <p style={{ margin: 0, color: '#e2e8f0', fontSize: 15 }}>{isSignUp ? 'Create your DrugIntel account' : isForgot ? 'Enter your email to receive a reset link' : 'Please log in to continue'}</p>
                    </div>
                    
                    {error && <div style={{ background: 'rgba(220, 38, 38, 0.2)', color: '#fca5a5', padding: 10, borderRadius: 4, marginBottom: 20, fontSize: 13, border: '1px solid rgba(220, 38, 38, 0.5)', textAlign: 'center' }}>{error}</div>}
                    {success && <div style={{ background: 'rgba(34, 197, 94, 0.2)', color: '#86efac', padding: 10, borderRadius: 4, marginBottom: 20, fontSize: 13, border: '1px solid rgba(34, 197, 94, 0.5)', textAlign: 'center' }}>{success}</div>}

                    <form onSubmit={handleSubmit} style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {isSignUp && (
                            <>
                                <InputBox icon="user" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} />
                                <InputBox icon="mail" type="email" placeholder="Official Email" value={email} onChange={e => setEmail(e.target.value)} />
                                <InputBox icon="building" placeholder="Organization / Institution Name" value={organization} onChange={e => setOrganization(e.target.value)} />
                                <div style={{ position: 'relative' }}>
                                    <select value={industry} onChange={e => setIndustry(e.target.value)} style={{...inputStyle, paddingLeft: 16}} required>
                                        <option value="" disabled style={{ color: '#94a3b8' }}>Select Industry Sector</option>
                                        <option value="pharmacist" style={{ background: '#0f172a', color: '#fff' }}>Clinical / Pharmacist</option>
                                        <option value="chemistry" style={{ background: '#0f172a', color: '#fff' }}>R&D Chemistry</option>
                                        <option value="gov" style={{ background: '#0f172a', color: '#fff' }}>Gov Auditor / Regulator</option>
                                    </select>
                                </div>
                            </>
                        )}
                        {isForgot ? (
                            <>
                                <InputBox icon="mail" placeholder="Enter your registered email or username" value={username} onChange={e => setUsername(e.target.value)} />
                                <InputBox type="password" icon="lock" placeholder="Enter your new password" value={password} onChange={e => setPassword(e.target.value)} />
                            </>
                        ) : (
                            <>
                                <InputBox icon="user" placeholder="Enter your username or email" value={username} onChange={e => setUsername(e.target.value)} />
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <InputBox type="password" icon="lock" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
                                    {!isSignUp && (
                                        <div style={{ textAlign: 'right', marginTop: 4 }}>
                                            <a href="#" onClick={(e) => { e.preventDefault(); toggleView('forgot'); }} style={{ color: '#e2e8f0', fontSize: 13, textDecoration: 'underline', transition: 'color 0.2s', fontWeight: 500 }} onMouseOver={e => e.target.style.color = '#fff'} onMouseOut={e => e.target.style.color = '#e2e8f0'}>
                                                Forgot Password?
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                        
                        {isSignUp && (
                            <InputBox type="password" icon="lock" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                        )}
                        
                        <button type="submit" disabled={loading} style={{
                            width: '100%', padding: '12px', marginTop: 12,
                            background: 'linear-gradient(180deg, #f8fafc 0%, #3b82f6 25%, #1e3a8a 100%)',
                            border: '1px solid #0f172a',
                            borderRadius: 4, color: '#ffffff', fontSize: 18, fontWeight: 700,
                            cursor: loading ? 'not-allowed' : 'pointer',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255,255,255,0.9)',
                            textShadow: '0 1px 2px rgba(0,0,0,0.6)',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            {loading ? (isForgot ? 'Resetting...' : 'Authenticating...') : isSignUp ? 'Submit Registration' : isForgot ? 'Set New Password' : 'Log In'}
                        </button>
                    </form>
                </div>
                
                {/* Bottom Footer Area inside the box */}
                <div style={{ padding: '14px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, color: '#f8fafc', background: 'rgba(10, 20, 45, 0.5)', borderTop: '1px solid rgba(255,255,255,0.15)' }}>
                    {(!isSignUp && !isForgot) ? (
                        <>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontWeight: 500 }}>
                                <input type="checkbox" style={{ accentColor: '#3b82f6', width: 14, height: 14 }} />
                                Remember Me
                            </label>
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button type="button" onClick={() => toggleView('signup')} style={linkBtnStyle}>Sign Up</button>
                                <span>|</span>
                                <button type="button" onClick={() => setError("Please contact support at support@drugintel.com for assistance.")} style={linkBtnStyle}>Need Help?</button>
                            </div>
                        </>
                    ) : (
                        <div style={{ width: '100%', textAlign: 'center' }}>
                            <button type="button" onClick={() => toggleView('login')} style={linkBtnStyle}>Back to Login</button>
                        </div>
                    )}
                </div>
            </div>
            </div>

            {/* Fixed Footer */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', color: '#e2e8f0', fontSize: 13, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 20, letterSpacing: '0.3px', borderTop: '1px solid rgba(255,255,255,0.15)', paddingTop: 16, paddingBottom: 16, backgroundColor: 'rgba(6, 17, 37, 0.6)', backdropFilter: 'blur(8px)' }}>
                <span>© 2024 DrugIntel Systems</span>
                <span style={{ opacity: 0.5 }}>|</span>
                <span>Secure Access • GMP Compliant</span>
            </div>
        </div>
    )
}

const linkBtnStyle = { background: 'none', border: 'none', cursor: 'pointer', color: '#f8fafc', padding: 0, fontSize: 13, fontWeight: 600 }

const inputStyle = {
    width: '100%',
    padding: '12px 16px 12px 42px',
    borderRadius: 4,
    border: '1px solid rgba(255, 255, 255, 0.15)',
    background: '#0f172a',
    color: '#fff',
    fontSize: 14,
    boxSizing: 'border-box',
    outline: 'none',
    boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4)',
    transition: 'border-color 0.2s, box-shadow 0.2s'
}

function InputBox({ type = "text", placeholder, value, onChange, icon }) {
    return (
        <div style={{ position: 'relative', width: '100%' }}>
            <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', pointerEvents: 'none' }}>
                {icon === 'user' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#e2e8f0" stroke="none">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                    </svg>
                )}
                {icon === 'lock' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#e2e8f0" stroke="none">
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
                    </svg>
                )}
                {icon === 'mail' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                )}
                {icon === 'building' && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect>
                        <path d="M9 22v-4h6v4"></path>
                        <path d="M8 6h.01"></path>
                        <path d="M16 6h.01"></path>
                        <path d="M12 6h.01"></path>
                        <path d="M12 10h.01"></path>
                        <path d="M12 14h.01"></path>
                        <path d="M16 10h.01"></path>
                        <path d="M16 14h.01"></path>
                        <path d="M8 10h.01"></path>
                        <path d="M8 14h.01"></path>
                    </svg>
                )}
            </div>
            <input 
                type={type} 
                placeholder={placeholder} 
                value={value} 
                onChange={onChange} 
                style={inputStyle} 
                required 
                onFocus={e => { e.target.style.borderColor = '#60a5fa'; e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.3)'; }}
                onBlur={e => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.15)'; e.target.style.boxShadow = 'inset 0 1px 3px rgba(0,0,0,0.4)'; }}
            />
        </div>
    )
}

import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import MainWorkspace from './pages/MainWorkspace'
import LoadingAssembly from './components/LoadingAssembly'
import './index.css'
import PatientDashboard from './pages/PatientDashboard'

export default function App() {
    const [userProfile, setUserProfile] = useState(null)
    const [isBooting, setIsBooting] = useState(false)

    // Check for saved token on load
    useEffect(() => {
        const savedProfile = localStorage.getItem('drugIntel_profile')
        if (savedProfile) {
            setUserProfile(JSON.parse(savedProfile))
        }
    }, [])

    const handleLoginSuccess = (profileData) => {
        setIsBooting(true)
        localStorage.setItem('drugIntel_profile', JSON.stringify(profileData))
        setUserProfile(profileData)
        
        // Simulate the highly requested loading sequence
        setTimeout(() => {
            setIsBooting(false)
        }, 5000)
    }

    const handleLogout = () => {
        localStorage.removeItem('drugIntel_profile')
        setUserProfile(null)
    }

    if (isBooting) {
        return <LoadingAssembly />
    }

    return (
        <BrowserRouter>
            <div style={{ minHeight: '100vh', background: '#0a0f18' }}>
                <Routes>
                    <Route path="/" element={
                        userProfile ? <Navigate to="/workspace" /> : <Login onLoginSuccess={handleLoginSuccess} />
                    } />
                    <Route path="/workspace" element={
                        userProfile ? (
                            userProfile.role === 'patient' 
                                ? <PatientDashboard userProfile={userProfile} onLogout={handleLogout} /> 
                                : <MainWorkspace userProfile={userProfile} onLogout={handleLogout} />
                        ) : <Navigate to="/" />
                    } />
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </div>
        </BrowserRouter>
    )
}
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000
const WARNING_BEFORE_MS = 60 * 1000

interface DashboardProps {
  username: string
  onLogout: () => void
}

interface UserProfile {
  full_name: string
  bio: string
  phone: string
  location: string
  website: string
  occupation: string
}

const emptyProfile: UserProfile = {
  full_name: '',
  bio: '',
  phone: '',
  location: '',
  website: '',
  occupation: '',
}

export default function Dashboard({ username, onLogout }: DashboardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
  const [userProfile, setUserProfile] = useState<UserProfile>(emptyProfile)
  const [formData, setFormData] = useState<UserProfile>(emptyProfile)
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }, [onLogout])

  const resetInactivityTimer = useCallback(() => {
    setShowInactivityWarning(false)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    if (warningTimer.current) clearTimeout(warningTimer.current)

    warningTimer.current = setTimeout(() => {
      setShowInactivityWarning(true)
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS)

    inactivityTimer.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT_MS)
  }, [handleLogout])

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll']
    events.forEach(e => window.addEventListener(e, resetInactivityTimer))
    resetInactivityTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetInactivityTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
      if (warningTimer.current) clearTimeout(warningTimer.current)
    }
  }, [resetInactivityTimer])

  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/profile')
      if (res.status === 401) {
        handleLogout()
        return
      }
      const data = await res.json()
      if (data.profile) {
        setUserProfile(data.profile)
        setFormData(data.profile)
      }
    } catch {
      setError('Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.status === 401) {
        handleLogout()
        return
      }

      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to save profile')
        return
      }

      setUserProfile(formData)
      setIsEditing(false)
      setSuccess('Profile saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch {
      setError('An error occurred while saving')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(userProfile)
    setIsEditing(false)
    setError('')
  }

  const InactivityWarning = () => showInactivityWarning ? (
    <div style={{ backgroundColor: '#fff3cd', border: '1px solid #ffc107', borderRadius: '6px', padding: '12px 16px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ color: '#856404', fontWeight: '500' }}>
        You will be logged out in 1 minute due to inactivity.
      </span>
      <button
        onClick={resetInactivityTimer}
        style={{ backgroundColor: '#ffc107', color: '#212529', border: 'none', padding: '6px 14px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
      >
        Stay logged in
      </button>
    </div>
  ) : null

  const LogoutButton = () => (
    <div style={{ marginBottom: '20px' }}>
      <button
        onClick={handleLogout}
        style={{ backgroundColor: '#ff6b6b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: '600' }}
      >
        Logout
      </button>
    </div>
  )

  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div className="dashboard" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[60, 100, 100, 100].map((w, i) => (
              <div key={i} style={{ height: '24px', width: `${w}%`, borderRadius: '6px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
            <style>{`@keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }`}</style>
          </div>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
        <div className="container" style={{ maxWidth: '600px' }}>
          <InactivityWarning />
          <LogoutButton />
          <div className="dashboard">
            <h1>Edit Profile</h1>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
              {[
                { id: 'full_name', label: 'Full Name', type: 'text', placeholder: 'Enter your full name' },
                { id: 'occupation', label: 'Occupation', type: 'text', placeholder: 'What do you do?' },
                { id: 'phone', label: 'Phone Number', type: 'tel', placeholder: 'Your phone number' },
                { id: 'location', label: 'Location', type: 'text', placeholder: 'City, Country' },
                { id: 'website', label: 'Website', type: 'url', placeholder: 'https://yourwebsite.com' },
              ].map(({ id, label, type, placeholder }) => (
                <div className="form-group" key={id}>
                  <label htmlFor={id}>{label}</label>
                  <input
                    id={id}
                    name={id}
                    type={type}
                    value={formData[id as keyof UserProfile]}
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    disabled={isSaving}
                  />
                </div>
              ))}

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell us about yourself..."
                  disabled={isSaving}
                  rows={4}
                  style={{ resize: 'vertical', fontFamily: 'inherit', width: '100%', padding: '12px', border: '1px solid #ddd', borderRadius: '4px', fontSize: '16px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <button type="submit" className="submit-btn" disabled={isSaving} style={{ minWidth: '150px' }}>
                  {isSaving ? 'Saving...' : 'Save Profile'}
                </button>
                <button type="button" onClick={handleCancel} disabled={isSaving}
                  style={{ padding: '12px 24px', backgroundColor: '#999', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '600', minWidth: '150px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '20px' }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        <InactivityWarning />
        <LogoutButton />

        <div className="dashboard">
          <h1 style={{ marginBottom: '10px' }}>Welcome, {username}!</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Manage your profile information</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <div style={{ backgroundColor: '#f9f9f9', border: '1px solid #eee', borderRadius: '8px', padding: '30px', marginBottom: '30px' }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Profile Information</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '20px' }}>
              {[
                { label: 'Full Name', value: userProfile.full_name },
                { label: 'Occupation', value: userProfile.occupation },
                { label: 'Phone', value: userProfile.phone },
                { label: 'Location', value: userProfile.location },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>{label}</p>
                  <p style={{ color: '#333', fontSize: '18px', fontWeight: '600' }}>{value || 'Not set'}</p>
                </div>
              ))}

              <div>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Website</p>
                <p style={{ color: '#333', fontSize: '18px', fontWeight: '600' }}>
                  {userProfile.website
                    ? <a href={userProfile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>Visit</a>
                    : 'Not set'}
                </p>
              </div>
            </div>

            {userProfile.bio && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Bio</p>
                <p style={{ color: '#333', lineHeight: '1.6' }}>{userProfile.bio}</p>
              </div>
            )}
          </div>

          <button onClick={() => setIsEditing(true)} className="submit-btn" style={{ minWidth: '200px' }}>
            Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}

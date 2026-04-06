'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes
const WARNING_BEFORE_MS = 60 * 1000           // warn 1 minute before logout

interface DashboardProps {
  username: string
  onLogout: () => void
}

interface UserProfile {
  id?: string
  full_name: string
  bio: string
  phone: string
  location: string
  website: string
  occupation: string
}

export default function Dashboard({ username, onLogout }: DashboardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showInactivityWarning, setShowInactivityWarning] = useState(false)
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

    // Show warning 1 minute before auto-logout
    warningTimer.current = setTimeout(() => {
      setShowInactivityWarning(true)
    }, INACTIVITY_TIMEOUT_MS - WARNING_BEFORE_MS)

    // Auto-logout after full inactivity period
    inactivityTimer.current = setTimeout(() => {
      handleLogout()
    }, INACTIVITY_TIMEOUT_MS)
  }, [handleLogout])

  // Start inactivity tracking on mount
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
  const [userProfile, setUserProfile] = useState<UserProfile>({
    full_name: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    occupation: '',
  })

  const [formData, setFormData] = useState<UserProfile>({
    full_name: '',
    bio: '',
    phone: '',
    location: '',
    website: '',
    occupation: '',
  })

  // Fetch user data on mount
  useEffect(() => {
    fetchUserProfile()
  }, [])

  const fetchUserProfile = async () => {
    setIsLoading(true)
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id

      if (!userId) {
        setError('User not found')
        return
      }

      const { data, error: fetchError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 means no rows found, which is fine for new users
        console.error('Fetch error:', fetchError)
      }

      if (data) {
        setUserProfile(data)
        setFormData(data)
      }
    } catch (err) {
      console.error('Error fetching profile:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      const userId = sessionData?.session?.user?.id

      if (!userId) {
        setError('User not found')
        setIsSaving(false)
        return
      }

      // Use upsert to insert or update
      const { data, error: upsertError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          full_name: formData.full_name,
          bio: formData.bio,
          phone: formData.phone,
          location: formData.location,
          website: formData.website,
          occupation: formData.occupation,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })
        .select()

      if (upsertError) {
        console.error('Upsert error:', upsertError)
        setError(upsertError.message || 'Failed to save profile')
        setIsSaving(false)
        return
      }

      setUserProfile(formData)
      setIsEditing(false)
      setSuccess('Profile saved successfully!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('An error occurred while saving')
      console.error('Save error:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setFormData(userProfile)
    setIsEditing(false)
    setError('')
  }

  if (isLoading) {
    return (
      <div className="container">
        <div className="dashboard">
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (isEditing) {
    return (
      <div className="container">
        <div className="dashboard" style={{ maxWidth: '600px', marginLeft: 'auto', marginRight: 'auto' }}>
          <h1>Edit Profile</h1>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={(e) => { e.preventDefault(); handleSave() }}>
            <div className="form-group">
              <label htmlFor="full_name">Full Name</label>
              <input
                id="full_name"
                name="full_name"
                type="text"
                value={formData.full_name}
                onChange={handleInputChange}
                placeholder="Enter your full name"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="occupation">Occupation</label>
              <input
                id="occupation"
                name="occupation"
                type="text"
                value={formData.occupation}
                onChange={handleInputChange}
                placeholder="What do you do?"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Your phone number"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                id="location"
                name="location"
                type="text"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="City, Country"
                disabled={isSaving}
              />
            </div>

            <div className="form-group">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                type="url"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://yourwebsite.com"
                disabled={isSaving}
              />
            </div>

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
                style={{ resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                type="submit" 
                className="submit-btn" 
                disabled={isSaving}
                style={{ minWidth: '150px' }}
              >
                {isSaving ? 'Saving...' : 'Save Profile'}
              </button>
              <button 
                type="button"
                onClick={handleCancel}
                disabled={isSaving}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#999',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  minWidth: '150px',
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div className="container" style={{ maxWidth: '900px' }}>
        {showInactivityWarning && (
          <div style={{
            backgroundColor: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '6px',
            padding: '12px 16px',
            marginBottom: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <span style={{ color: '#856404', fontWeight: '500' }}>
              You will be logged out in 1 minute due to inactivity.
            </span>
            <button
              onClick={resetInactivityTimer}
              style={{
                backgroundColor: '#ffc107',
                color: '#212529',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: '600',
              }}
            >
              Stay logged in
            </button>
          </div>
        )}

        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#ff6b6b',
              color: 'white',
              border: 'none',
              padding: '10px 20px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '600',
            }}
          >
            🚪 Logout
          </button>
        </div>

        <div className="dashboard">
          <h1 style={{ marginBottom: '10px' }}>Welcome, {username}! 👋</h1>
          <p style={{ color: '#666', marginBottom: '30px' }}>Manage your profile information</p>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {/* Profile Information Display */}
          <div style={{
            backgroundColor: '#f9f9f9',
            border: '1px solid #eee',
            borderRadius: '8px',
            padding: '30px',
            marginBottom: '30px'
          }}>
            <h2 style={{ color: '#333', marginBottom: '20px' }}>Profile Information</h2>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '20px'
            }}>
              {/* Full Name */}
              <div>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Full Name</p>
                <p style={{ color: '#333', fontSize: '18px', fontWeight: '600' }}>
                  {userProfile.full_name || 'Not set'}
                </p>
              </div>

              {/* Occupation */}
              <div>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Occupation</p>
                <p style={{ color: '#333', fontSize: '18px', fontWeight: '600' }}>
                  {userProfile.occupation || 'Not set'}
                </p>
              </div>

              {/* Phone */}
              <div>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Phone</p>
                <p style={{ color: '#333', fontSize: '18px', fontWeight: '600' }}>
                  {userProfile.phone || 'Not set'}
                </p>
              </div>

              {/* Location */}
              <div>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Location</p>
                <p style={{ color: '#333', fontSize: '18px', fontWeight: '600' }}>
                  {userProfile.location || 'Not set'}
                </p>
              </div>

              {/* Website */}
              <div>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '5px' }}>Website</p>
                <p style={{ color: '#333', fontSize: '18px', fontWeight: '600' }}>
                  {userProfile.website ? (
                    <a href={userProfile.website} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                      Visit
                    </a>
                  ) : 'Not set'}
                </p>
              </div>
            </div>

            {/* Bio */}
            {userProfile.bio && (
              <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eee' }}>
                <p style={{ color: '#999', fontSize: '12px', textTransform: 'uppercase', marginBottom: '10px' }}>Bio</p>
                <p style={{ color: '#333', lineHeight: '1.6' }}>
                  {userProfile.bio}
                </p>
              </div>
            )}
          </div>

          {/* Edit Button */}
          <button 
            onClick={() => setIsEditing(true)}
            className="submit-btn"
            style={{ minWidth: '200px' }}
          >
            ✏️ Edit Profile
          </button>
        </div>
      </div>
    </div>
  )
}


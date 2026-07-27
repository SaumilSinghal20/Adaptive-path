import { useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { me } from '../api/api'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    async function handleOAuth() {
      const params = new URLSearchParams(location.search)
      const token = params.get('token')

      if (token) {
        localStorage.setItem('ap_token', token)
        
        try {
          // Fetch the user's profile to get their name and learner_id
          const userProfile = await me()
          localStorage.setItem('ap_learner_id', userProfile.learner_id)
          localStorage.setItem('ap_full_name', userProfile.full_name)
          
          navigate('/dashboard')
        } catch (err) {
          console.error("Failed to fetch user profile:", err)
          navigate('/login')
        }
      } else {
        navigate('/login')
      }
    }

    handleOAuth()
  }, [location, navigate])

  return (
    <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', backgroundColor: 'var(--bg)' }}>
      <div style={{ color: 'var(--text)', fontSize: '18px' }}>Completing login...</div>
    </div>
  )
}

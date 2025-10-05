'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    name: '',
    phone: '',
    location: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (data.success) {
        const path = data.user.role === 'ADMIN' ? '/admin/dashboard' 
          : data.user.role === 'NURSE' ? '/nurse/dashboard' 
          : '/mother/dashboard'
        
        window.location.href = path
      } else {
        alert('Registration failed: ' + (data.error || 'Unknown error'))
        setError(data.error || 'Registration failed')
        setLoading(false)
      }
    } catch (err) {
      alert('Registration error: ' + err)
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#F6FAFF, #FFFFFF)'}}>
      <div className="nh-container" style={{minHeight:'calc(100vh - 140px)',display:'grid',alignItems:'center',padding:'40px 0'}}>
        <div className="nh-grid nh-grid-2" style={{alignItems:'stretch',gap:'24px',maxWidth:1120,margin:'0 auto'}}>
          <div className="nh-card" style={{minHeight:'520px',width:'100%',justifySelf:'stretch'}}>
          <div className="text-center mb-4">
            <h1 className="nh-h2">Create Account</h1>
            <p className="nh-sub">Join NurseHire and get started in minutes</p>
          </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              I am a *
            </label>
            <select
              required
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="nh-input"
            >
              <option value="">Select role</option>
              <option value="USER">User</option>
              <option value="NURSE">Nurse</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="nh-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="nh-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="nh-input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              required
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="nh-input"
            />
          </div>

          {formData.role === 'MOTHER' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone (Optional)
                </label>
                  <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="nh-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location (Optional)
                </label>
                  <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="nh-input"
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full nh-btn nh-btn--primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

            <p className="mt-4 text-center text-sm nh-muted">Already have an account?{' '}<Link href="/auth/login" className="text-primary-600">Sign in</Link></p>
            <Link href="/" className="block mt-2 text-center text-sm nh-muted">← Back to home</Link>
          </div>

          {/* Benefits panel */}
          <div className="nh-card" style={{background:'linear-gradient(180deg,#F8FAFF,#FFFFFF)',borderColor:'#E6EEFF',minHeight:'520px'}}>
            <div style={{maxWidth:500,margin:'0 auto'}}>
              <div className="w-14 h-14 rounded-full" style={{background:'#E0EAFF',display:'grid',placeItems:'center',margin:'0 auto 12px'}}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2 4 4 0 0 1 7 2c0 5.65-7 10-7 10z" stroke="#0F73EE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h2 className="text-center nh-h2" style={{fontSize:'22px',marginBottom:'8px'}}>Benefits</h2>
              <ul className="nh-muted" style={{listStyle:'none',padding:0,margin:0,display:'grid',gap:'12px'}}>
                <li className="nh-row" style={{gap:'12px'}}><span className="nh-badge nh-badge--ok">Trust</span><span className="nh-right nh-muted">MOH License verified</span></li>
                <li className="nh-row" style={{gap:'12px'}}><span className="nh-badge nh-badge--info">Messaging</span><span className="nh-right nh-muted">Private 1:1 chat</span></li>
                <li className="nh-row" style={{gap:'12px'}}><span className="nh-badge nh-badge--warn">Booking</span><span className="nh-right nh-muted">Quick request & response</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
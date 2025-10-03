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
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#F9FAFB, #FFFFFF)'}}>
      <div className="nh-container" style={{display:'grid',placeItems:'center',minHeight:'60vh',padding:'32px 0'}}>
        <div className="nh-card" style={{maxWidth:520,width:'100%'}}>
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
              <option value="MOTHER">Mother</option>
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
      </div>
    </div>
  )
}
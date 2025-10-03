'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Login form submitted with:', { email: formData.email })

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      console.log('Login response status:', res.status)
      const data = await res.json()
      console.log('Login response data:', data)

      if (data.success) {
        console.log('Login successful, role:', data.user.role)
        // Redirect based on role - use replace for a clean redirect
        const path = data.user.role === 'ADMIN' ? '/admin/dashboard' 
          : data.user.role === 'NURSE' ? '/nurse/dashboard' 
          : '/mother/dashboard'
        
        console.log('Redirecting to:', path)
        window.location.replace(path)
      } else {
        console.error('Login failed:', data.error)
        alert('Login failed: ' + (data.error || 'Unknown error'))
        setError(data.error || 'Login failed')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login exception:', err)
      alert('Login error: ' + err)
      setError('Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{background:'linear-gradient(180deg,#F9FAFB, #FFFFFF)'}}>
      <div className="nh-container" style={{display:'grid',placeItems:'center',minHeight:'60vh',padding:'32px 0'}}>
        <div className="nh-card" style={{maxWidth:480,width:'100%'}}>
          <div className="text-center mb-4">
            <h1 className="nh-h2">Sign In</h1>
            <p className="nh-sub">Welcome back — access your dashboard</p>
          </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
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
              Password
            </label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="nh-input"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full nh-btn nh-btn--primary disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm nh-muted">
          Don't have an account?{' '}<Link href="/auth/register" className="text-primary-600">Sign up</Link>
        </p>

        <Link href="/" className="block mt-2 text-center text-sm nh-muted">
          ← Back to home
        </Link>
        </div>
      </div>
    </div>
  )
}

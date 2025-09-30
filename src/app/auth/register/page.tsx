'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, Heart, ArrowLeft, User, UserCheck, Shield } from 'lucide-react'

export default function RegisterPage() {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    role: '',
    name: '',
    phone: '',
    location: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      console.log('Sending registration data:', formData)
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()
      console.log('Registration response:', data)

      if (data.success) {
        // Save user data to localStorage for dashboard display
        localStorage.setItem('user', JSON.stringify(data.user))
        setSuccess(true)
        // Redirect after a short delay to show success message
        setTimeout(() => {
          if (data.user.role === 'ADMIN') {
            router.push('/admin/dashboard')
          } else if (data.user.role === 'NURSE') {
            router.push('/nurse/dashboard')
          } else {
            router.push('/mother/dashboard')
          }
        }, 2000)
      } else {
        console.error('Registration failed:', data.error)
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      console.error('Registration error:', error)
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const nextStep = () => {
    if (step === 1 && formData.email && formData.password && formData.confirmPassword && formData.role) {
      setStep(2)
    }
  }

  const prevStep = () => {
    setStep(1)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">NurseHire</span>
          </Link>
          <h2 className="text-3xl font-bold text-neutral-900">Create your account</h2>
          <p className="mt-2 text-neutral-600">
            Join NurseHire and start your journey
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center space-x-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 1 ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-600'
          }`}>
            1
          </div>
          <div className={`w-16 h-1 ${step >= 2 ? 'bg-primary-600' : 'bg-neutral-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
            step >= 2 ? 'bg-primary-600 text-white' : 'bg-neutral-200 text-neutral-600'
          }`}>
            2
          </div>
        </div>

        {/* Registration Form */}
        <div className="card">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                  Account created successfully! Redirecting to your dashboard...
                </div>
              </div>
            )}

            {step === 1 && (
              <>
                <div>
                  <label htmlFor="role" className="label">
                    I am a...
                  </label>
                  <div className="grid grid-cols-1 gap-3">
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="MOTHER"
                        checked={formData.role === 'MOTHER'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-colors ${
                        formData.role === 'MOTHER' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <User className="w-6 h-6 text-primary-600" />
                          <div>
                            <div className="font-medium">Mother</div>
                            <div className="text-sm text-neutral-600">Looking for newborn care</div>
                          </div>
                        </div>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="NURSE"
                        checked={formData.role === 'NURSE'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-colors ${
                        formData.role === 'NURSE' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <UserCheck className="w-6 h-6 text-secondary-600" />
                          <div>
                            <div className="font-medium">Nurse</div>
                            <div className="text-sm text-neutral-600">Provide newborn care services</div>
                          </div>
                        </div>
                      </div>
                    </label>
                    <label className="relative cursor-pointer">
                      <input
                        type="radio"
                        name="role"
                        value="ADMIN"
                        checked={formData.role === 'ADMIN'}
                        onChange={handleChange}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-xl transition-colors ${
                        formData.role === 'ADMIN' 
                          ? 'border-primary-500 bg-primary-50' 
                          : 'border-neutral-200 hover:border-neutral-300'
                      }`}>
                        <div className="flex items-center space-x-3">
                          <Shield className="w-6 h-6 text-accent-600" />
                          <div>
                            <div className="font-medium">Administrator</div>
                            <div className="text-sm text-neutral-600">Manage the platform</div>
                          </div>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="label">
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your email"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="label">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className="input-field pr-10"
                      placeholder="Create a password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-neutral-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-neutral-400" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="label">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full btn-primary"
                >
                  Continue
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="name" className="label">
                    Full Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>

                {formData.role === 'MOTHER' && (
                  <>
                    <div>
                      <label htmlFor="phone" className="label">
                        Phone Number (Optional)
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Enter your phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="location" className="label">
                        Location (Optional)
                      </label>
                      <input
                        id="location"
                        name="location"
                        type="text"
                        value={formData.location}
                        onChange={handleChange}
                        className="input-field"
                        placeholder="Enter your location"
                      />
                    </div>
                  </>
                )}

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating account...' : 'Create account'}
                  </button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center text-sm text-neutral-600 hover:text-neutral-900">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

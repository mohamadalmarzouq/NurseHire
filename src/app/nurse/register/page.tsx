'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Upload, CheckCircle, AlertCircle } from 'lucide-react'

export default function NurseRegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    totalExperience: '',
    kuwaitExperience: '',
    partTimeSalary: '',
    nightShiftSalary: '',
    aboutMe: '',
    phone: '',
    languages: [] as string[],
    availability: [] as string[],
  })
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const languageOptions = ['English', 'Arabic', 'Hindi', 'Urdu', 'Filipino', 'Bengali']
  const availabilityOptions = ['Part-time', 'Night Shift', 'Emergency', 'Weekends']

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'NURSE',
          email: 'nurse@example.com', // This would come from auth
          password: 'password123', // This would come from auth
        }),
      })

      const data = await response.json()

      if (data.success) {
        setSuccess(true)
        setTimeout(() => {
          router.push('/nurse/dashboard')
        }, 2000)
      } else {
        setError(data.error || 'Registration failed')
      }
    } catch (error) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleCheckboxChange = (name: 'languages' | 'availability', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCvFile(e.target.files[0])
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="card">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-4">Registration Successful!</h2>
            <p className="text-neutral-600 mb-6">
              Your nurse profile has been created and is pending admin approval. 
              You'll receive an email notification once it's reviewed.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">What happens next?</p>
                  <ul className="text-left space-y-1">
                    <li>• Admin will review your profile and CV</li>
                    <li>• You'll receive approval notification via email</li>
                    <li>• Once approved, your profile will be visible to mothers</li>
                  </ul>
                </div>
              </div>
            </div>
            <Link href="/nurse/dashboard" className="btn-primary">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-gradient">NurseHire</span>
          </Link>
          <h1 className="text-3xl font-bold text-neutral-900 mb-4">Join as a Nurse</h1>
          <p className="text-lg text-neutral-600">
            Create your profile and start connecting with families in Kuwait
          </p>
        </div>

        {/* Registration Form */}
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="label">Age *</label>
                  <input
                    type="number"
                    name="age"
                    required
                    min="18"
                    max="65"
                    value={formData.age}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Your age"
                  />
                </div>
              </div>
            </div>

            {/* Experience */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Experience</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Total Experience (years) *</label>
                  <input
                    type="number"
                    name="totalExperience"
                    required
                    min="0"
                    value={formData.totalExperience}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Years of experience"
                  />
                </div>
                <div>
                  <label className="label">Kuwait Experience (years) *</label>
                  <input
                    type="number"
                    name="kuwaitExperience"
                    required
                    min="0"
                    value={formData.kuwaitExperience}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Experience in Kuwait"
                  />
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Pricing (KD per hour)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">Part-time Rate *</label>
                  <input
                    type="number"
                    name="partTimeSalary"
                    required
                    min="0"
                    value={formData.partTimeSalary}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Rate for part-time work"
                  />
                </div>
                <div>
                  <label className="label">Night Shift Rate *</label>
                  <input
                    type="number"
                    name="nightShiftSalary"
                    required
                    min="0"
                    value={formData.nightShiftSalary}
                    onChange={handleChange}
                    className="input-field"
                    placeholder="Rate for night shifts"
                  />
                </div>
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="label">Languages Spoken</label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                {languageOptions.map((language) => (
                  <label key={language} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.languages.includes(language)}
                      onChange={() => handleCheckboxChange('languages', language)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-neutral-700">{language}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Availability */}
            <div>
              <label className="label">Availability</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                {availabilityOptions.map((option) => (
                  <label key={option} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.availability.includes(option)}
                      onChange={() => handleCheckboxChange('availability', option)}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded"
                    />
                    <span className="ml-2 text-sm text-neutral-700">{option}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* About Me */}
            <div>
              <label className="label">About Me *</label>
              <textarea
                name="aboutMe"
                required
                rows={4}
                value={formData.aboutMe}
                onChange={handleChange}
                className="input-field"
                placeholder="Tell families about yourself, your experience, and what makes you special..."
              />
            </div>

            {/* Contact */}
            <div>
              <label className="label">Phone Number</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="input-field"
                placeholder="Your contact number"
              />
            </div>

            {/* CV Upload */}
            <div>
              <label className="label">CV Upload *</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-neutral-300 rounded-lg hover:border-neutral-400 transition-colors">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-neutral-400" />
                  <div className="flex text-sm text-neutral-600">
                    <label htmlFor="cv-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none">
                      <span>Upload CV</span>
                      <input
                        id="cv-upload"
                        name="cv-upload"
                        type="file"
                        accept=".pdf,.doc,.docx"
                        onChange={handleFileChange}
                        className="sr-only"
                        required
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">PDF, DOC, DOCX up to 10MB</p>
                </div>
              </div>
              {cvFile && (
                <p className="mt-2 text-sm text-green-600 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {cvFile.name} selected
                </p>
              )}
            </div>

            {/* Terms */}
            <div className="flex items-start">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300 rounded mt-1"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-neutral-700">
                I agree to the{' '}
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit */}
            <div className="flex space-x-4">
              <Link href="/" className="flex-1 btn-secondary text-center">
                <ArrowLeft className="w-4 h-4 mr-2 inline" />
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Creating Profile...' : 'Create Profile'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

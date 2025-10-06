'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Mail, Lock, Phone, MapPin, Calendar, DollarSign, FileText, Upload, Heart, ArrowLeft } from 'lucide-react'
import FileUpload from '@/components/FileUpload'

export default function NurseRegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    location: '',
    age: '',
    totalExperience: '',
    kuwaitExperience: '',
    partTimeSalary: '',
    nightShiftSalary: '',
    aboutMe: '',
    languages: [] as string[],
    availability: [] as string[],
  })
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null)
  const [profileImageName, setProfileImageName] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const languageOptions = [
    'Arabic', 'English', 'Hindi', 'Urdu', 'Tagalog', 'Bengali', 'Malayalam', 'Tamil', 'Other'
  ]

  const availabilityOptions = [
    'Morning (6 AM - 2 PM)',
    'Afternoon (2 PM - 10 PM)', 
    'Night (10 PM - 6 AM)',
    '24 Hours',
    'Weekdays Only',
    'Weekends Only',
    'Flexible'
  ]

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCheckboxChange = (name: 'languages' | 'availability', value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: prev[name].includes(value)
        ? prev[name].filter(item => item !== value)
        : [...prev[name], value]
    }))
  }

  const handleFileUpload = (fileUrl: string, fileName: string) => {
    setProfileImageUrl(fileUrl)
    setProfileImageName(fileName)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!profileImageUrl) {
      setError('Profile picture is required for nurse registration')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    if (!formData.email || !formData.name || !formData.phone) {
      setError('Please fill in all required fields')
      return
    }

    setIsLoading(true)

    try {
      // Register the nurse with the uploaded profile image URL
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          role: 'NURSE',
          profileImageUrl,
          // Remove confirmPassword from the data sent to API
          confirmPassword: undefined,
        }),
      })

      if (response.ok) {
        setSuccess('Registration successful! Please wait for admin approval.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 2000)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Registration failed')
      }
    } catch (err) {
      setError('Registration failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container-custom py-12">
        {/* Back Button */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center text-primary-600 hover:text-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Panel - Form */}
            <div className="nh-card">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Join as a Nurse</h1>
                <p className="text-gray-600">Create your professional profile and start helping families</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Picture Upload - Required */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Picture <span className="text-red-500">*</span>
                  </label>
                  <FileUpload
                    onFileSelect={handleFileUpload}
                    accept="image/*"
                    maxSize={5 * 1024 * 1024} // 5MB
                  />
                  {profileImageName && (
                    <p className="mt-2 text-sm text-green-600">
                      ✓ Profile picture uploaded: {profileImageName}
                    </p>
                  )}
                </div>

                {/* Basic Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="Enter your email"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Password Fields */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="Create a password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="Confirm your password"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="Enter your location"
                      />
                    </div>
                  </div>
                </div>

                {/* Experience */}
                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Age
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="Age"
                        min="18"
                        max="65"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Experience (years)
                    </label>
                    <input
                      type="number"
                      name="totalExperience"
                      value={formData.totalExperience}
                      onChange={handleInputChange}
                      className="nh-input"
                      placeholder="Years"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Kuwait Experience (years)
                    </label>
                    <input
                      type="number"
                      name="kuwaitExperience"
                      value={formData.kuwaitExperience}
                      onChange={handleInputChange}
                      className="nh-input"
                      placeholder="Years"
                      min="0"
                    />
                  </div>
                </div>

                {/* Salary Information */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Part-time Salary (KD/hour)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="partTimeSalary"
                        value={formData.partTimeSalary}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="0.00"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Night Shift Salary (KD/hour)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="number"
                        name="nightShiftSalary"
                        value={formData.nightShiftSalary}
                        onChange={handleInputChange}
                        className="nh-input pl-10"
                        placeholder="0.00"
                        min="0"
                        step="0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* About Me */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    About Me
                  </label>
                  <textarea
                    name="aboutMe"
                    value={formData.aboutMe}
                    onChange={handleInputChange}
                    rows={4}
                    className="nh-input"
                    placeholder="Tell us about your experience, specialties, and what makes you a great nurse..."
                  />
                </div>

                {/* Languages */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Languages Spoken
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {languageOptions.map((lang) => (
                      <label key={lang} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.languages.includes(lang)}
                          onChange={() => handleCheckboxChange('languages', lang)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{lang}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <div className="space-y-2">
                    {availabilityOptions.map((option) => (
                      <label key={option} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.availability.includes(option)}
                          onChange={() => handleCheckboxChange('availability', option)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Error and Success Messages */}
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {success}
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full nh-btn nh-btn--primary py-3 text-lg font-medium"
                >
                  {isLoading ? 'Creating Account...' : 'Create Nurse Account'}
                </button>

                {/* Login Link */}
                <div className="text-center">
                  <p className="text-gray-600">
                    Already have an account?{' '}
                    <Link href="/auth/login" className="text-primary-600 hover:text-primary-700 font-medium">
                      Sign in here
                    </Link>
                  </p>
                </div>
              </form>
            </div>

            {/* Right Panel - Benefits */}
            <div className="nh-card">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Why Join NurseHire?</h2>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Heart className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Verified & Trusted</h3>
                    <p className="text-gray-600 text-sm">MOH-verified platform ensures your safety and credibility</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Competitive Rates</h3>
                    <p className="text-gray-600 text-sm">Set your own rates and earn what you deserve</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Calendar className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Flexible Schedule</h3>
                    <p className="text-gray-600 text-sm">Choose your availability and work when it suits you</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <FileText className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Easy Management</h3>
                    <p className="text-gray-600 text-sm">Manage bookings, messages, and reviews in one place</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                    <Heart className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Make a Difference</h3>
                    <p className="text-gray-600 text-sm">Help families in Kuwait with professional newborn care</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Registration Process</h4>
                <ol className="text-sm text-blue-800 space-y-1">
                  <li>1. Complete your profile with required information</li>
                  <li>2. Upload your profile picture</li>
                  <li>3. Wait for admin approval (usually within 24 hours)</li>
                  <li>4. Start receiving booking requests!</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

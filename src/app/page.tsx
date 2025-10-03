'use client'

import Link from 'next/link'
import { Heart, Shield, Star, Users, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data?.authenticated && data.user) {
            // Redirect logged-in users to their dashboard
            if (data.user.role === 'MOTHER') {
              router.push('/mother/dashboard')
            } else if (data.user.role === 'NURSE') {
              router.push('/nurse/dashboard')
            } else if (data.user.role === 'ADMIN') {
              router.push('/admin/dashboard')
            }
            return
          }
        }
      } catch (error) {
        console.error('Error checking auth:', error)
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 section-padding">
        <div className="container-custom">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 mb-6 text-balance">
              Trusted Newborn Care Nurses in{' '}
              <span className="text-gradient">Kuwait</span>
            </h1>
            <p className="text-xl text-neutral-600 mb-8 leading-relaxed max-w-2xl mx-auto">
              Connect with qualified, vetted nurses for your newborn&apos;s care. 
              Safe, professional, and caring service you can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/nurses" className="btn-primary text-lg px-8 py-4">
                Find a Nurse
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <Link href="/nurse/register" className="btn-secondary text-lg px-8 py-4">
                Become a Nurse
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="bg-white py-12">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-primary-600" />
              </div>
              <h3 className="font-semibold text-lg">MOH License Verified</h3>
              <p className="text-neutral-600 text-sm">All nurses are licensed and verified by Kuwait&apos;s Ministry of Health</p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-secondary-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-secondary-600" />
              </div>
              <h3 className="font-semibold text-lg">Background Checked</h3>
              <p className="text-neutral-600 text-sm">Comprehensive background checks and reference verification</p>
            </div>
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 bg-accent-100 rounded-full flex items-center justify-center">
                <Star className="w-6 h-6 text-accent-600" />
              </div>
              <h3 className="font-semibold text-lg">Rated & Reviewed</h3>
              <p className="text-neutral-600 text-sm">Real reviews from mothers who have hired our nurses</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-4">
              How It Works
            </h2>
            <p className="text-xl text-neutral-600 max-w-2xl mx-auto">
              Simple steps to find the perfect nurse for your newborn
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4">Browse & Search</h3>
              <p className="text-neutral-600">
                Search through verified nurse profiles with detailed information about experience, availability, and rates.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4">Connect & Chat</h3>
              <p className="text-neutral-600">
                Message nurses directly to discuss your needs, ask questions, and get to know them better.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4">Book & Hire</h3>
              <p className="text-neutral-600">
                Send a booking request and once accepted, get contact details to arrange your newborn's care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Mothers */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
                For Mothers
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Verified Professionals</h3>
                    <p className="text-neutral-600">All nurses are licensed, background-checked, and experienced in newborn care.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Flexible Scheduling</h3>
                    <p className="text-neutral-600">Find nurses available for part-time, night shifts, or emergency care.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Real Reviews</h3>
                    <p className="text-neutral-600">Read authentic reviews from other mothers who have hired our nurses.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8">
              <div className="text-center">
                <Heart className="w-16 h-16 text-primary-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Your Baby&apos;s Safety is Our Priority
                </h3>
                <p className="text-neutral-600 text-lg">
                  Every nurse on our platform is carefully vetted to ensure your newborn receives the best possible care.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Nurses */}
      <section className="section-padding bg-neutral-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gradient-to-br from-secondary-50 to-accent-50 rounded-3xl p-8 order-2 lg:order-1">
              <div className="text-center">
                <Users className="w-16 h-16 text-secondary-600 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  Grow Your Career
                </h3>
                <p className="text-neutral-600 text-lg">
                  Connect with families who need your expertise and build a successful nursing career.
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
                For Nurses
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Find Clients Easily</h3>
                    <p className="text-neutral-600">Connect with families looking for newborn care services in Kuwait.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-4 h-4 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Secure Platform</h3>
                    <p className="text-neutral-600">Work with verified families in a safe, professional environment.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-secondary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Build Your Reputation</h3>
                    <p className="text-neutral-600">Earn reviews and ratings to showcase your expertise and reliability.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-gradient-to-r from-primary-600 to-secondary-600">
        <div className="container-custom text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of families and nurses who trust NurseHire for newborn care in Kuwait.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/nurses" className="bg-white text-primary-600 hover:bg-neutral-50 font-medium py-3 px-8 rounded-xl transition-colors duration-200">
              Find a Nurse
            </Link>
            <Link href="/nurse/register" className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-xl transition-colors duration-200">
              Join as Nurse
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

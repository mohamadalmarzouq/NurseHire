'use client'

import Link from 'next/link'
import { Heart, Shield, Star, Users, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BannerAd from '@/components/BannerAd'

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
            if (data.user.role === 'USER') {
              router.push('/user/dashboard')
            } else if (data.user.role === 'CARETAKER') {
              router.push('/caretaker/dashboard')
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
      <section className="nh-section" style={{background:"linear-gradient(135deg,#f0f9ff,#f0fdf4)"}}>
        <div className="nh-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="nh-h1 mb-4 text-balance">
              Communicate with Qualified care takers
            </h1>
            <p className="nh-sub mb-8 max-w-2xl mx-auto">
              Connect with qualified, vetted care takers for your newborn&apos;s care. Safe, professional, and caring service you can trust.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/caretakers" className="nh-btn nh-btn--primary">
                Find a Care Taker
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/register" className="nh-btn nh-btn--ghost">
                Register as a Care Taker
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Banner Ad - Homepage Hero */}
      <section className="nh-section" style={{background:'#fff'}}>
        <div className="nh-container">
          <BannerAd position="HOMEPAGE_HERO" />
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="nh-section" style={{background:'#fff'}}>
        <div className="nh-container">
          <div className="nh-grid nh-grid-3 text-center">
            <div className="nh-card nh-card--lift">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{background:'#e0f2fe'}}>
                <Shield className="w-6 h-6" color="#0284c7" />
              </div>
              <h3 className="text-xl font-semibold mt-3">Verified</h3>
              <p className="nh-muted text-sm mt-1">All care takers are verified by the platform</p>
            </div>
            <div className="nh-card nh-card--lift">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{background:'#dcfce7'}}>
                <CheckCircle className="w-6 h-6" color="#10B981" />
              </div>
              <h3 className="text-xl font-semibold mt-3">Background Checked</h3>
              <p className="nh-muted text-sm mt-1">Comprehensive background checks and reference verification</p>
            </div>
            <div className="nh-card nh-card--lift">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{background:'#FEF3C7'}}>
                <Star className="w-6 h-6" color="#F59E0B" />
              </div>
              <h3 className="text-xl font-semibold mt-3">Rated & Reviewed</h3>
              <p className="nh-muted text-sm mt-1">Real reviews from mothers who have hired our care takers</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="nh-section">
        <div className="nh-container">
          <div className="text-center" style={{marginBottom: '14px'}}>
            <h2 className="nh-h2" style={{marginBottom:'8px'}}>How It Works</h2>
            <div className="flex justify-center" style={{marginBottom:'14px'}}>
              <span className="nh-badge nh-badge--info" style={{fontSize:'14px',padding:'6px 12px'}}>Simple steps to find the perfect care taker for your newborn</span>
            </div>
          </div>

          <div className="nh-grid nh-grid-3" style={{marginTop:'6px'}}>
            <div className="nh-card nh-card--lift text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{background:'#e0f2fe',color:'#0F73EE',fontWeight:700}}>1</div>
              <h3 className="text-xl font-semibold mb-2">Browse & Search</h3>
              <p className="nh-muted">Search verified care taker profiles with details about experience, availability, and rates.</p>
            </div>
            <div className="nh-card nh-card--lift text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{background:'#dcfce7',color:'#10B981',fontWeight:700}}>2</div>
              <h3 className="text-xl font-semibold mb-2">Connect & Chat</h3>
              <p className="nh-muted">Message care takers directly to discuss your needs and get to know them.</p>
            </div>
            <div className="nh-card nh-card--lift text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{background:'#FEF3C7',color:'#F59E0B',fontWeight:700}}>3</div>
              <h3 className="text-xl font-semibold mb-2">Book & Hire</h3>
              <p className="nh-muted">Send a booking request and, once accepted, coordinate care with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits for Mothers */}
      <section className="nh-section" style={{background:'#fff'}}>
        <div className="nh-container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-stretch">
            <div className="flex flex-col justify-center">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900" style={{marginBottom:'10px'}}>
                For Users
              </h2>
              <div className="mb-4">
                <span className="nh-badge nh-badge--info" style={{fontSize:'14px',padding:'6px 12px'}}>Verified • Flexible • Reviewed</span>
              </div>
              <div className="space-y-5">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Verified Professionals</h3>
                    <p className="text-neutral-600">All care takers are licensed, background-checked, and experienced in newborn care.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Flexible Scheduling</h3>
                    <p className="text-neutral-600">Find care takers available for part-time, night shifts, or emergency care.</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Real Reviews</h3>
                    <p className="text-neutral-600">Read authentic reviews from other users who have hired our care takers.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-white shadow-lg">
              {/* Simple Nurse & Baby Illustration */}
              <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-blue-50"></div>
                
                {/* Simple Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-20 h-20 bg-blue-200 rounded-full"></div>
                  <div className="absolute top-1/3 right-8 w-16 h-16 bg-blue-300 rounded-full"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-blue-200 rounded-full"></div>
                </div>
                
                {/* Main Content */}
                <div className="relative z-10 text-center">
                  {/* Text Content */}
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">Caring & Professional</h3>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 max-w-2xl mx-auto">
                    Our care takers provide gentle, expert care for your newborn with the warmth and professionalism you can trust.
                  </p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">500+</div>
                      <div className="text-sm md:text-base text-gray-600">Happy Families</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">50+</div>
                      <div className="text-sm md:text-base text-gray-600">Expert Care Takers</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-blue-600 mb-2">99%</div>
                      <div className="text-sm md:text-base text-gray-600">Satisfaction</div>
                    </div>
                  </div>
                </div>
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
                For Care Takers
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
      <section className="nh-section" style={{background:"linear-gradient(135deg,#0F73EE,#0e5ed3)"}}>
        <div className="nh-container text-center">
          <h2 className="nh-h2 mb-3" style={{color:'#fff'}}>Ready to Get Started?</h2>
          <p className="text-xl mb-8" style={{color:'rgba(255,255,255,.85)'}}>
            Join hundreds of families and care takers who trust ENFAS for newborn care in Kuwait.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/caretakers" className="nh-btn nh-btn--ghost" style={{background:'#fff'}}>Find a Care Taker</Link>
            <Link href="/auth/register" className="nh-btn nh-btn--primary" style={{background:'#10B981'}}>Register as a Care Taker</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

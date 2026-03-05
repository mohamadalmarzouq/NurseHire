'use client'

import Link from 'next/link'
import { Heart, Shield, Star, Users, Clock, CheckCircle, ArrowRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import BannerAd from '@/components/BannerAd'
import { useLanguage } from '@/lib/language'

export default function HomePage() {
  const { t } = useLanguage()
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
            } else if (data.user.role === 'CANDIDATE') {
              router.push('/candidate/dashboard')
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
      <section className="nh-section" style={{background:"linear-gradient(135deg,#ECFEFF,#CFFAFE)"}}>
        <div className="nh-container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="nh-h1 mb-4 text-balance">
              {t('homepage.headline')}
            </h1>
            <p className="nh-sub mb-8 max-w-2xl mx-auto">
              {t('homepage.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/candidates" className="nh-btn nh-btn--primary">
                {t('homepage.findCandidate')}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/auth/register" className="nh-btn nh-btn--ghost">
                {t('homepage.registerAsCandidate')}
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
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{background:'#CFFAFE'}}>
                <Shield className="w-6 h-6" color="#0891B2" />
              </div>
              <h3 className="text-xl font-semibold mt-3">{t('homepage.trustIndicators.verified')}</h3>
              <p className="nh-muted text-sm mt-1">{t('homepage.trustIndicators.verifiedDesc')}</p>
            </div>
            <div className="nh-card nh-card--lift">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{background:'#CFFAFE'}}>
                <CheckCircle className="w-6 h-6" color="#0891B2" />
              </div>
              <h3 className="text-xl font-semibold mt-3">{t('homepage.trustIndicators.backgroundChecked')}</h3>
              <p className="nh-muted text-sm mt-1">{t('homepage.trustIndicators.backgroundCheckedDesc')}</p>
            </div>
            <div className="nh-card nh-card--lift">
              <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center" style={{background:'#CFFAFE'}}>
                <Star className="w-6 h-6" color="#0891B2" />
              </div>
              <h3 className="text-xl font-semibold mt-3">{t('homepage.trustIndicators.ratedReviewed')}</h3>
              <p className="nh-muted text-sm mt-1">{t('homepage.trustIndicators.ratedReviewedDesc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="nh-section">
        <div className="nh-container">
          <div className="text-center" style={{marginBottom: '14px'}}>
            <h2 className="nh-h2" style={{marginBottom:'8px'}}>{t('homepage.howItWorks.title')}</h2>
            <div className="flex justify-center" style={{marginBottom:'14px'}}>
              <span className="nh-badge nh-badge--info" style={{fontSize:'14px',padding:'6px 12px',background:'#CFFAFE',color:'#0E7490'}}>{t('homepage.howItWorks.subtitle')}</span>
            </div>
          </div>

          <div className="nh-grid nh-grid-3" style={{marginTop:'6px'}}>
            <div className="nh-card nh-card--lift text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{background:'#CFFAFE',color:'#0891B2',fontWeight:700}}>1</div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.howItWorks.step1.title')}</h3>
              <p className="nh-muted">{t('homepage.howItWorks.step1.desc')}</p>
            </div>
            <div className="nh-card nh-card--lift text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{background:'#CFFAFE',color:'#0891B2',fontWeight:700}}>2</div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.howItWorks.step2.title')}</h3>
              <p className="nh-muted">{t('homepage.howItWorks.step2.desc')}</p>
            </div>
            <div className="nh-card nh-card--lift text-center">
              <div className="w-14 h-14 mx-auto rounded-full flex items-center justify-center mb-4" style={{background:'#CFFAFE',color:'#0891B2',fontWeight:700}}>3</div>
              <h3 className="text-xl font-semibold mb-2">{t('homepage.howItWorks.step3.title')}</h3>
              <p className="nh-muted">{t('homepage.howItWorks.step3.desc')}</p>
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
                {t('homepage.forUsers.title')}
              </h2>
              <div className="mb-4">
                <span className="nh-badge nh-badge--info" style={{fontSize:'14px',padding:'6px 12px',background:'#CFFAFE',color:'#0E7490'}}>{t('homepage.forUsers.badge')}</span>
              </div>
              <div className="space-y-5">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('homepage.forUsers.verifiedProfessionals.title')}</h3>
                    <p className="text-neutral-600">{t('homepage.forUsers.verifiedProfessionals.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('homepage.forUsers.flexibleScheduling.title')}</h3>
                    <p className="text-neutral-600">{t('homepage.forUsers.flexibleScheduling.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('homepage.forUsers.realReviews.title')}</h3>
                    <p className="text-neutral-600">{t('homepage.forUsers.realReviews.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl bg-white shadow-lg">
              {/* Simple Nurse & Baby Illustration */}
              <div className="relative w-full h-full min-h-[300px] flex items-center justify-center">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 via-white to-cyan-50"></div>
                
                {/* Simple Background Pattern */}
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-4 left-4 w-20 h-20 bg-cyan-200 rounded-full"></div>
                  <div className="absolute top-1/3 right-8 w-16 h-16 bg-cyan-300 rounded-full"></div>
                  <div className="absolute bottom-1/4 left-1/3 w-12 h-12 bg-cyan-200 rounded-full"></div>
                </div>
                
                {/* Main Content */}
                <div className="relative z-10 text-center">
                  {/* Text Content */}
                  <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-6">{t('homepage.caringProfessional.title')}</h3>
                  <p className="text-lg md:text-xl text-gray-700 leading-relaxed mb-8 max-w-2xl mx-auto">
                    {t('homepage.caringProfessional.description')}
                  </p>
                  
                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-cyan-700 mb-2">500+</div>
                      <div className="text-sm md:text-base text-gray-600">{t('homepage.caringProfessional.happyFamilies')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-cyan-700 mb-2">50+</div>
                      <div className="text-sm md:text-base text-gray-600">{t('homepage.caringProfessional.expertCareTakers')}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-bold text-cyan-700 mb-2">99%</div>
                      <div className="text-sm md:text-base text-gray-600">{t('homepage.caringProfessional.satisfaction')}</div>
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
            <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-3xl p-8 order-2 lg:order-1">
              <div className="text-center">
                <Users className="w-16 h-16 text-cyan-700 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-neutral-900 mb-4">
                  {t('homepage.forCareTakers.findClients.title')}
                </h3>
                <p className="text-neutral-600 text-lg">
                  {t('homepage.forCareTakers.findClients.desc')}
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 mb-6">
                {t('homepage.forCareTakers.title')}
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('homepage.forCareTakers.findClients.title')}</h3>
                    <p className="text-neutral-600">{t('homepage.forCareTakers.findClients.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('homepage.forCareTakers.securePlatform.title')}</h3>
                    <p className="text-neutral-600">{t('homepage.forCareTakers.securePlatform.desc')}</p>
                  </div>
                </div>
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Star className="w-4 h-4 text-cyan-700" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-2">{t('homepage.forCareTakers.buildReputation.title')}</h3>
                    <p className="text-neutral-600">{t('homepage.forCareTakers.buildReputation.desc')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="nh-section" style={{background:"linear-gradient(135deg,#0E7490,#0891B2)"}}>
        <div className="nh-container text-center">
          <h2 className="nh-h2 mb-3" style={{color:'#fff'}}>{t('homepage.cta.title')}</h2>
          <p className="text-xl mb-8" style={{color:'rgba(255,255,255,.85)'}}>
            {t('homepage.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/candidates" className="nh-btn nh-btn--ghost" style={{background:'#fff'}}>{t('homepage.findCandidate')}</Link>
            <Link href="/auth/register" className="nh-btn nh-btn--primary" style={{background:'#06B6D4'}}>{t('homepage.registerAsCareTaker')}</Link>
          </div>
        </div>
      </section>
    </div>
  )
}

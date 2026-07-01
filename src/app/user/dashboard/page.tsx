'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, Heart, MessageCircle, Star, Calendar, User, Settings, LogOut, Bot } from 'lucide-react'
import DashboardHeader from '@/components/DashboardHeader'
import BannerAd from '@/components/BannerAd'
import { useLanguage } from '@/lib/language'

export default function UserDashboard() {
  const { t } = useLanguage()
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [recentNurses, setRecentNurses] = useState<any[]>([])
  const [subscription, setSubscription] = useState<any>(null)

  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('Loading user from /api/auth/me...')
        const res = await fetch('/api/auth/me', { cache: 'no-store' })
        console.log('Auth me response status:', res.status)
        
        if (!res.ok) {
          console.log('Auth me failed, redirecting to login')
          window.location.href = '/auth/login'
          return
        }
        
        const data = await res.json()
        console.log('Auth me data:', data)
        
        if (data?.authenticated) {
          setUser(data.user)
          // Load subscription status
          loadSubscription()
        } else {
          console.log('Not authenticated, redirecting to login')
          window.location.href = '/auth/login'
        }
      } catch (e) {
        console.error('Error loading user:', e)
        window.location.href = '/auth/login'
      } finally {
        setIsLoading(false)
      }
    }
    loadUser()
  }, [])

  const loadSubscription = async () => {
    try {
      const res = await fetch('/api/user/subscription', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data.subscription)
      }
    } catch (e) {
      console.error('Error loading subscription:', e)
    }
  }

  useEffect(() => {
    const loadRecentNurses = async () => {
      try {
        const res = await fetch('/api/candidates?limit=3', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setRecentNurses(data.candidates || [])
        }
      } catch (e) {
        console.error('Error loading recent candidates:', e)
      }
    }
    loadRecentNurses()
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-400 mx-auto"></div>
          <p className="mt-4 text-slate-300">{t('user.dashboard.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <DashboardHeader userName={user?.profile?.name} userRole={user?.role} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trust strip */}
        <div className="mb-6 rounded-2xl border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
              Verified
            </span>
            <span className="rounded-full bg-cyan-500/15 px-3 py-1 text-xs font-semibold text-cyan-300">
              Private & Secure
            </span>
          </div>
        </div>

        {/* Banner Ad - Dashboard Header */}
        <div className="mb-8">
          <BannerAd position="DASHBOARD_HEADER" />
        </div>

        {/* Welcome Section */}
        <div className="mb-8 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-white">
                {t('user.dashboard.welcome')}, {user?.profile?.name || 'User'}
              </h1>
              <p className="text-sm text-slate-300">{t('user.dashboard.subtitle')}</p>
            </div>
            {subscription && (
              <Link
                href="/user/subscription"
                className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
                  subscription.isActive
                    ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
                }`}
              >
                {subscription.isActive
                  ? `✓ ${t('user.dashboard.activeSubscription')}`
                  : t('user.dashboard.viewSubscription')}
              </Link>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link
            href="/candidates"
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition hover:border-cyan-400/40 hover:bg-slate-900"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_10px_25px_rgba(6,182,212,0.35)]">
                <Search className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('user.dashboard.findCareTakers')}
                </h3>
                <p className="text-sm mb-3 text-slate-300">{t('user.dashboard.findCareTakersDesc')}</p>
                <div className="text-xs font-medium text-cyan-300">
                  {t('user.dashboard.discoverTrustedCare')} →
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/user/requests"
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition hover:border-cyan-400/40 hover:bg-slate-900"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_10px_25px_rgba(6,182,212,0.35)]">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('user.dashboard.myRequests')}
                </h3>
                <p className="text-sm mb-3 text-slate-300">{t('user.dashboard.myRequestsDesc')}</p>
                <div className="text-xs font-medium text-cyan-300">
                  {t('user.dashboard.trackRequests')} →
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/user/messages"
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition hover:border-cyan-400/40 hover:bg-slate-900"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_10px_25px_rgba(6,182,212,0.35)]">
                <MessageCircle className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('user.dashboard.myMessages')}
                </h3>
                <p className="text-sm mb-3 text-slate-300">{t('user.dashboard.myMessagesDesc')}</p>
                <div className="text-xs font-medium text-cyan-300">
                  {t('user.dashboard.connectCommunicate')} →
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/user/calls"
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition hover:border-cyan-400/40 hover:bg-slate-900"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_10px_25px_rgba(6,182,212,0.35)]">
                <Calendar className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Calls</h3>
                <p className="text-sm mb-3 text-slate-300">Schedule and manage calls</p>
                <div className="text-xs font-medium text-cyan-300">View call requests →</div>
              </div>
            </div>
          </Link>

          <Link
            href="/user/ai-interviews"
            className="group rounded-2xl border border-indigo-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/40 p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition hover:border-indigo-400/60"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-[0_10px_25px_rgba(99,102,241,0.35)]">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('user.dashboard.aiInterviews')}
                </h3>
                <p className="text-sm mb-3 text-slate-300">{t('user.dashboard.aiInterviewsDesc')}</p>
                <div className="text-xs font-medium text-indigo-300">
                  {t('user.dashboard.manageInterviews')} →
                </div>
              </div>
            </div>
          </Link>

          <Link
            href="/user/reviews"
            className="group rounded-2xl border border-white/10 bg-slate-900/70 p-6 text-center shadow-[0_16px_40px_rgba(15,23,42,0.35)] transition hover:border-cyan-400/40 hover:bg-slate-900"
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-[0_10px_25px_rgba(6,182,212,0.35)]">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {t('user.dashboard.myReviews')}
                </h3>
                <p className="text-sm mb-3 text-slate-300">{t('user.dashboard.myReviewsDesc')}</p>
                <div className="text-xs font-medium text-cyan-300">
                  {t('user.dashboard.shareExperience')} →
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Candidates */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  {t('user.dashboard.recentCareTakers')}
                </h2>
                <p className="text-xs text-slate-400">{t('user.dashboard.recentCareTakersDesc')}</p>
              </div>
              <Link
                href="/candidates"
                className="inline-flex items-center text-xs font-medium text-cyan-300 hover:text-cyan-200"
              >
                {t('user.dashboard.viewAll')}
                <Search className="w-4 h-4 ml-1" />
              </Link>
            </div>

            {recentNurses.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/40 p-6 text-center">
                <p className="text-sm font-medium text-slate-200 mb-1">
                  {t('user.dashboard.noCareTakersAvailable')}
                </p>
                <p className="text-xs text-slate-400">{t('user.dashboard.checkBackSoon')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentNurses.map((caretaker) => (
                  <div
                    key={caretaker.id}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3 shadow-sm hover:border-cyan-400/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500/60 to-blue-500/60 flex items-center justify-center border border-cyan-400/30 text-slate-900">
                          <span className="text-sm font-semibold">
                            {caretaker.name
                              ? caretaker.name
                                  .split(' ')
                                  .filter(Boolean)
                                  .slice(0, 2)
                                  .map((part: string) => part[0])
                                  .join('')
                                  .toUpperCase()
                              : 'C'}
                          </span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-slate-900" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {caretaker.name || t('user.dashboard.careTaker')}
                        </p>
                        <p className="text-xs text-slate-400">
                          {caretaker.totalExperience} {t('user.dashboard.yrsExperience')} · KD{' '}
                          {caretaker.partTimeSalary}/hr
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/candidates/${caretaker.id}`}
                      className="inline-flex items-center text-xs font-medium text-cyan-300 hover:text-cyan-200"
                    >
                      {t('user.dashboard.viewProfile')}
                      <span className="ml-1 text-lg leading-none">→</span>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Favorites */}
          <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  {t('user.dashboard.favoriteCareTakers')}
                </h2>
                <p className="text-xs text-slate-400">
                  {t('user.dashboard.favoriteCareTakersDesc')}
                </p>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-300 bg-rose-500/15 px-3 py-1 rounded-full border border-rose-500/30">
                <Heart className="w-3 h-3" />
                {t('user.dashboard.favorites')}
              </span>
            </div>

            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-6 text-center">
              <Heart className="w-8 h-8 text-rose-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-200 mb-1">
                {t('user.dashboard.noFavoritesYet')}
              </p>
              <p className="text-xs text-slate-400 mb-4">
                {t('user.dashboard.favoritesInstruction')}
              </p>
              <Link
                href="/candidates"
                className="inline-flex items-center gap-2 rounded-full bg-rose-500/80 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-500 transition-colors"
              >
                {t('user.dashboard.browseCareTakers')}
                <Heart className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>

        {/* Profile Section */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_16px_40px_rgba(15,23,42,0.35)]">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h2 className="text-lg font-semibold text-white mb-1">
                {t('user.dashboard.profileInformation')}
              </h2>
              <p className="text-xs text-slate-400">{t('user.dashboard.profileInformationDesc')}</p>
            </div>
            <Link
              href="/user/profile"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 px-5 py-2 text-xs font-semibold text-white shadow-sm"
            >
              <span>{t('user.dashboard.editProfile')}</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t('common.fullName')}</p>
              <p className="text-sm font-semibold text-white">{user?.profile?.name || t('user.dashboard.notSet')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t('common.email')}</p>
              <p className="text-sm font-semibold text-white break-words">{user?.email || t('user.dashboard.notSet')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t('common.phone')}</p>
              <p className="text-sm font-semibold text-white">{user?.profile?.phone || t('user.dashboard.notSet')}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-slate-950/40 p-4">
              <p className="text-xs uppercase tracking-wide text-slate-500 mb-1">{t('common.location')}</p>
              <p className="text-sm font-semibold text-white">{user?.profile?.location || t('user.dashboard.notSet')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

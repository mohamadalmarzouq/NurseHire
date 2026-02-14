import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { uploadToCloudinary } from '@/lib/cloudinary'

const DAILY_API_KEY = process.env.DAILY_API_KEY
const DAILY_WEBHOOK_SECRET = process.env.DAILY_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    if (DAILY_WEBHOOK_SECRET) {
      const incoming = request.headers.get('x-daily-signature')
      if (!incoming || !incoming.includes(DAILY_WEBHOOK_SECRET)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const event = body?.event || body?.type
    const payload = body?.payload || body

    if (event !== 'recording.ready-to-download' && payload?.status !== 'finished') {
      return NextResponse.json({ ok: true })
    }

    const recordingId = payload?.recording_id
    if (!recordingId || !DAILY_API_KEY) {
      return NextResponse.json({ error: 'Missing recording info' }, { status: 400 })
    }

    const linkRes = await fetch(
      `https://api.daily.co/v1/recordings/${recordingId}/access-link`,
      {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      }
    )

    if (!linkRes.ok) {
      const errData = await linkRes.json().catch(() => ({}))
      return NextResponse.json(
        { error: errData.error || 'Failed to fetch recording link' },
        { status: 500 }
      )
    }

    const linkData = await linkRes.json()
    const downloadUrl = linkData.download_link
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Download link missing' }, { status: 500 })
    }

    const recordingRes = await fetch(downloadUrl)
    if (!recordingRes.ok) {
      return NextResponse.json({ error: 'Failed to download recording' }, { status: 500 })
    }

    const buffer = Buffer.from(await recordingRes.arrayBuffer())
    const upload = await uploadToCloudinary(
      buffer,
      'call-recordings',
      `${recordingId}.mp4`,
      'video'
    )

    const updated = await prisma.callSession.updateMany({
      where: { dailyRecordingId: recordingId },
      data: {
        recordingStatus: 'READY',
        recordingUrl: upload.secureUrl,
        recordingDurationSeconds: payload?.duration || null,
      },
    })

    if (updated.count === 0) {
      return NextResponse.json({ error: 'Call session not found' }, { status: 404 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Daily webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}

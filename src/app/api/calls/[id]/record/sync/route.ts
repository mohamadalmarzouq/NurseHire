import { NextRequest, NextResponse } from 'next/server'
import { RecordingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'
import { uploadToCloudinary } from '@/lib/cloudinary'

const DAILY_API_KEY = process.env.DAILY_API_KEY

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    if (!DAILY_API_KEY) {
      return NextResponse.json({ error: 'Daily is not configured' }, { status: 500 })
    }

    const { id } = await params
    const callSession = await prisma.callSession.findFirst({
      where: {
        id,
        OR: [{ userId: payload.id }, { caretakerId: payload.id }],
      },
    })

    if (!callSession) {
      return NextResponse.json({ error: 'Call not found' }, { status: 404 })
    }

    if (callSession.recordingStatus === 'READY' && callSession.recordingUrl) {
      return NextResponse.json({ updated: false, status: 'READY' })
    }

    if (!callSession.dailyRecordingId) {
      return NextResponse.json({ updated: false, status: 'NO_RECORDING_ID' })
    }

    const linkRes = await fetch(
      `https://api.daily.co/v1/recordings/${callSession.dailyRecordingId}/access-link`,
      {
        headers: { Authorization: `Bearer ${DAILY_API_KEY}` },
      }
    )

    if (!linkRes.ok) {
      return NextResponse.json({ updated: false, status: 'PROCESSING' })
    }

    const linkData = await linkRes.json()
    const downloadUrl = linkData.download_link
    if (!downloadUrl) {
      return NextResponse.json({ updated: false, status: 'NO_DOWNLOAD_LINK' })
    }

    const recordingRes = await fetch(downloadUrl)
    if (!recordingRes.ok) {
      return NextResponse.json({ updated: false, status: 'DOWNLOAD_FAILED' })
    }

    const buffer = Buffer.from(await recordingRes.arrayBuffer())
    const upload = await uploadToCloudinary(
      buffer,
      'call-recordings',
      `${callSession.dailyRecordingId}.mp4`,
      'video'
    )

    await prisma.callSession.update({
      where: { id: callSession.id },
      data: {
        recordingStatus: RecordingStatus.READY,
        recordingUrl: upload.secureUrl,
      },
    })

    return NextResponse.json({ updated: true, status: 'READY' })
  } catch (error) {
    console.error('Error syncing recording:', error)
    return NextResponse.json({ error: 'Failed to sync recording' }, { status: 500 })
  }
}

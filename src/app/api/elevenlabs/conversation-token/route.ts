import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'

const DEFAULT_AGENT_ID = 'agent_3101kw6v9cqje6b98n60x9vpfbyk'

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'CANDIDATE') {
      return NextResponse.json({ error: 'Candidate access required' }, { status: 403 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    const agentId = process.env.ELEVENLABS_AGENT_ID || DEFAULT_AGENT_ID

    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API key missing' }, { status: 500 })
    }

    const response = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agentId}`,
      {
        headers: {
          'xi-api-key': apiKey,
        },
      }
    )

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}))
      return NextResponse.json(
        { error: errorBody?.detail || errorBody?.message || 'Failed to get conversation token' },
        { status: 500 }
      )
    }

    const data = await response.json()

    return NextResponse.json({ conversationToken: data.token, agentId })
  } catch (error) {
    console.error('Error fetching ElevenLabs conversation token:', error)
    return NextResponse.json({ error: 'Failed to get conversation token' }, { status: 500 })
  }
}

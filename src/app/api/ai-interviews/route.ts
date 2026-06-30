import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

const DEFAULT_AGENT_ID = 'agent_3101kw6v9cqje6b98n60x9vpfbyk'

const linkKnowledgeBaseDocument = async (documentId: string, apiKey: string) => {
  const agentId = process.env.ELEVENLABS_AGENT_ID || DEFAULT_AGENT_ID
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agentId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': apiKey,
    },
    body: JSON.stringify({
      knowledge_base: {
        document_ids: [documentId],
      },
    }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(
      errorData?.detail || errorData?.message || 'Failed to link knowledge base document'
    )
  }
}

const publishAgentDraft = async (apiKey: string) => {
  const agentId = process.env.ELEVENLABS_AGENT_ID || DEFAULT_AGENT_ID
  const branchId = process.env.ELEVENLABS_AGENT_BRANCH_ID
  if (!branchId) {
    throw new Error('ElevenLabs agent branch ID missing')
  }

  const res = await fetch(
    `https://api.elevenlabs.io/v1/convai/agents/${agentId}/drafts?branch_id=${branchId}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        conversation_config: {},
        platform_settings: {},
        workflow: {},
        name: 'Publishing user questions',
      }),
    }
  )

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData?.detail || errorData?.message || 'Failed to publish agent draft')
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'USER') {
      return NextResponse.json({ error: 'User access required' }, { status: 403 })
    }

    const interviews = await prisma.aiInterview.findMany({
      where: { userId: payload.id },
      include: {
        candidate: { include: { candidateProfile: true } },
        sessions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ interviews })
  } catch (error) {
    console.error('Error fetching AI interviews:', error)
    return NextResponse.json({ error: 'Failed to fetch AI interviews' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await verifyToken(token)
    if (!payload || payload.role !== 'USER') {
      return NextResponse.json({ error: 'User access required' }, { status: 403 })
    }

    const contentType = request.headers.get('content-type') || ''
    let candidateId = ''
    let title = ''
    let description = ''
    let requirements = ''
    let questionsText: string | null = null
    let questionsFile: File | null = null

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      candidateId = String(formData.get('candidateId') || '')
      title = String(formData.get('title') || '')
      description = String(formData.get('description') || '')
      requirements = String(formData.get('requirements') || '')
      const textValue = formData.get('questionsText')
      if (typeof textValue === 'string') {
        questionsText = textValue.trim() || null
      }
      const fileValue = formData.get('questionsFile')
      if (fileValue instanceof File && fileValue.size > 0) {
        questionsFile = fileValue
      }
    } else {
      const body = await request.json()
      candidateId = body?.candidateId || ''
      title = body?.title || ''
      description = body?.description || ''
      requirements = body?.requirements || ''
      questionsText = typeof body?.questionsText === 'string' ? body.questionsText.trim() : null
    }

    if (!candidateId || !title || !description) {
      return NextResponse.json(
        { error: 'candidateId, title, and description are required' },
        { status: 400 }
      )
    }

    const candidate = await prisma.user.findFirst({
      where: {
        id: candidateId,
        role: 'CANDIDATE',
        candidateProfile: { status: 'APPROVED' },
      },
    })

    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found or not approved' }, { status: 404 })
    }

    let knowledgeBaseDocumentId: string | null = null
    let knowledgeBaseSource: string | null = null

    const apiKey = process.env.ELEVENLABS_API_KEY
    if ((questionsText || questionsFile) && !apiKey) {
      return NextResponse.json(
        { error: 'ElevenLabs API key missing for knowledge base upload' },
        { status: 500 }
      )
    }

    if (apiKey && (questionsText || questionsFile)) {
      if (questionsFile) {
        const uploadBody = new FormData()
        uploadBody.append('file', questionsFile, questionsFile.name)
        uploadBody.append('name', `${title} interview questions`)
        const uploadRes = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/file', {
          method: 'POST',
          headers: { 'xi-api-key': apiKey },
          body: uploadBody,
        })
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}))
          return NextResponse.json(
            { error: errorData?.detail || errorData?.message || 'Failed to upload questions file' },
            { status: 500 }
          )
        }
        const uploadData = await uploadRes.json().catch(() => ({}))
        knowledgeBaseDocumentId = uploadData?.document_id || uploadData?.id || null
        knowledgeBaseSource = 'file'
      } else if (questionsText) {
        const uploadRes = await fetch('https://api.elevenlabs.io/v1/convai/knowledge-base/text', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            name: `${title} interview questions`,
            text: questionsText,
          }),
        })
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({}))
          return NextResponse.json(
            { error: errorData?.detail || errorData?.message || 'Failed to upload questions text' },
            { status: 500 }
          )
        }
        const uploadData = await uploadRes.json().catch(() => ({}))
        knowledgeBaseDocumentId = uploadData?.document_id || uploadData?.id || null
        knowledgeBaseSource = 'text'
      }

      if (knowledgeBaseDocumentId) {
        try {
          await linkKnowledgeBaseDocument(knowledgeBaseDocumentId, apiKey)
          await publishAgentDraft(apiKey)
        } catch (error) {
          console.error('Failed to link knowledge base document:', error)
          return NextResponse.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : 'Failed to link knowledge base document',
            },
            { status: 500 }
          )
        }
      }
    }

    const interview = await prisma.aiInterview.create({
      data: {
        userId: payload.id,
        candidateId,
        title,
        description,
        requirements: requirements || null,
        questionsText: questionsText || null,
        knowledgeBaseDocumentId,
        knowledgeBaseSource,
      },
      include: {
        candidate: { include: { candidateProfile: true } },
      },
    })

    return NextResponse.json({ interview })
  } catch (error) {
    console.error('Error creating AI interview:', error)
    return NextResponse.json({ error: 'Failed to create AI interview' }, { status: 500 })
  }
}

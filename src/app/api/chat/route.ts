import { NextRequest, NextResponse } from 'next/server'
import subjects from '@/data/subjects.json'
import universityData from '@/data/universityRecommendations.json'

export async function POST(req: NextRequest) {
  const { message } = await req.json()
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'no api key' }, { status: 500 })
  }

  const subjectSummary = subjects.map(s => {
    const unis = (s.recommendingUniversities as { university: string; field: string }[])
    const uniNames = [...new Set(unis?.map(r => r.university) || [])].slice(0, 5)
    return `${s.name}(${s.subjectGroup},${s.type},${s.opCredit}학점,${s.category},${s.semesters.join('/')}) - ${s.description?.slice(0, 60)}${s.relatedMajors ? ' 학과:' + s.relatedMajors.slice(0, 40) : ''}${uniNames.length > 0 ? ' 권장:' + uniNames.join(',') : ''}`
  }).join('\n')

  const uniSummary = Object.entries(universityData as Record<string, any>).map(([name, data]) => {
    const fields = Object.entries(data.fields as Record<string, any>)
      .filter(([, v]: [string, any]) => v.ourSubjects?.length > 0)
      .slice(0, 10)
      .map(([, v]: [string, any]) => `${v.category}>${v.major}:${v.ourSubjects.join(',')}`)
      .join(' | ')
    return `${name}: ${fields}`
  }).join('\n')

  const systemPrompt = `당신은 순천팔마고등학교의 2022 개정 교육과정 선택과목 안내 전문 상담 챗봇입니다.

## 학교 정보
- 학교명: 순천팔마고등학교
- 교육과정: 2022 개정 교육과정 (고교학점제)
- 대상: 1학년(2026 신입), 2학년(2025 신입)

## 우리 학교 과목 데이터 (${subjects.length}개)
${subjectSummary}

## 대학별 권장과목 (${Object.keys(universityData).length}개 대학, 2028학년도 대교협 자료)
${uniSummary}

## 응답 규칙
1. 학생 눈높이에 맞게 친근하고 이해하기 쉽게 존댓말로 답변하세요.
2. 과목 추천 시 반드시 위 데이터에 있는 우리 학교 개설 과목만 추천하세요.
3. 대학 권장과목 질문 시 "2028학년도 대교협 자료 기준"임을 명시하세요.
4. 과목명, 학점, 이수시기, 선택 조건 등 정확한 정보를 제공하세요.
5. 진로 상담 시 관련 학과, 관련 직업도 함께 안내하세요.
6. 확실하지 않은 정보는 추측하지 말고, 담임선생님이나 교육과정부에 문의하라고 안내하세요.
7. 답변은 간결하되 핵심 정보는 빠짐없이 포함하세요.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n---\n\n학생 질문: ' + message }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
          ]
        }),
      }
    )

    if (!response.ok) {
      return NextResponse.json({ error: 'API error' }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '죄송합니다. 다시 질문해 주세요.'
    return NextResponse.json({ reply })
  } catch {
    return NextResponse.json({ error: 'API call failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()
    const apiKey = process.env.GEMINI_API_KEY

    if (!apiKey) {
      return NextResponse.json({ error: 'no api key' }, { status: 500 })
    }

    const systemPrompt = `당신은 순천팔마고등학교의 2022 개정 교육과정 선택과목 안내 전문 상담 챗봇입니다.

학교명: 순천팔마고등학교
교육과정: 2022 개정 교육과정 (고교학점제)
대상: 1학년(2026 신입), 2학년(2025 신입)

응답 규칙:
1. 학생 눈높이에 맞게 친근하고 이해하기 쉽게 존댓말로 답변하세요.
2. 우리 학교 개설 과목 위주로 추천하세요.
3. 대학 권장과목 질문 시 "2028학년도 대교협 자료 기준"임을 명시하세요.
4. 과목명, 학점, 이수시기 등 정확한 정보를 제공하세요.
5. 진로 상담 시 관련 학과, 관련 직업도 함께 안내하세요.
6. 확실하지 않은 정보는 추측하지 말고, 담임선생님이나 교육과정부에 문의하라고 안내하세요.
7. 답변은 간결하되 핵심 정보는 빠짐없이 포함하세요.`

    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + apiKey,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: systemPrompt + '\n\n---\n\n학생 질문: ' + message }]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          },
          safetySettings: [
            { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
            { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' }
          ]
        })
      }
    )

    if (!response.ok) {
      const errText = await response.text()
      console.error('Gemini error:', response.status, errText)
      return NextResponse.json({ error: 'Gemini API error: ' + response.status }, { status: 500 })
    }

    const data = await response.json()
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '죄송합니다. 다시 질문해 주세요.'

    return NextResponse.json({ reply })
  } catch (err) {
    console.error('Chat API error:', err)
    return NextResponse.json({ error: 'server error' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const MODE_PROMPTS = {
  observe: `過去のやり取りに基づいて、私の傾向を教えて。

出力は読みやすく、短く、断言しすぎない（「〜の傾向がある」「〜に見える」トーン）。

出力フォーマット（必ずこの順序）：
- テーマTOP3（短い見出しで）
- よく出るキーワードTOP5（単語 or 短いフレーズ）
- 最近増えていること（1つ）
- 最近減っていること（1つ）
- 一言フィードバック（1〜2行）
- 最後に問い（1つ、短く具体的に）`,

  deep: `過去のやり取りに基づいて、私自身も知らない私に関する何をあなたは知っていますか？

ただし断言しすぎない（「仮説」「〜のように見える」トーン）。

出力フォーマット：
- あなたが気づいていないかもしれない特徴（3つ）
- その根拠（過去ログから推測できる要素を短く。引用は短く/または要約で）
- 盲点になりやすい前提（2つ）
- 避けがちな領域（1つ）
- 最後に問い（1〜2つ）`,

  future: `あなたが私について知っていること全てに基づいて、今の私が未来の自分に聞くべき質問5つをつくり、それに回答してください。

出力フォーマット：
- 質問：…
  回答：…
（×5）

- 最後に一言（次回見直しの示唆）

未来モードでも最後は問いで締める（追加の問いを1つ置く）`,
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { mode } = await request.json()

    if (!mode || !['observe', 'deep', 'future'].includes(mode)) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }

    // 最大300件のメッセージを取得
    const { data: allMessages, error: fetchError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(300)

    if (fetchError) {
      console.error('Failed to fetch messages:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // メッセージを時系列順に並び替え、文字数制限を適用
    const messages = (allMessages || []).reverse()
    let totalChars = 0
    const limitedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      const msgChars = msg.content.length
      if (totalChars + msgChars > 40000) break
      totalChars += msgChars
      limitedMessages.unshift({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })
    }

    const systemPrompt = `あなたは「第二の自分」という役割を担うAIです。ユーザーの過去の対話を分析し、深い洞察を提供します。

${MODE_PROMPTS[mode as keyof typeof MODE_PROMPTS]}

モデル: gpt-4o-mini`

    // OpenAI API呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...limitedMessages,
      ],
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || 'インサイトを生成できませんでした。'

    // インサイト結果はDBに保存しない（表示のみ）

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Insight API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


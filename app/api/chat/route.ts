import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Invalid message' }, { status: 400 })
    }

    // ユーザーメッセージを保存
    const { error: insertError } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        role: 'user',
        content: message,
      })

    if (insertError) {
      console.error('Failed to insert user message:', insertError)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // 直近40件のメッセージを取得
    const { data: recentMessages, error: fetchError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(40)

    if (fetchError) {
      console.error('Failed to fetch messages:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // メッセージを時系列順に並び替え、文字数制限を適用
    const messages = (recentMessages || []).reverse()
    let totalChars = 0
    const limitedMessages: Array<{ role: 'user' | 'assistant'; content: string }> = []
    
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i]
      const msgChars = msg.content.length
      if (totalChars + msgChars > 20000) break
      totalChars += msgChars
      limitedMessages.unshift({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      })
    }

    // システムプロンプト
    const systemPrompt = `あなたは「第二の自分」という役割を担うAIです。ユーザーと対話し、思考を深める手助けをします。

返信の構造を必ず守ってください：
1. 整理（1〜3行）：ユーザーの発言を簡潔に整理
2. 視点（必要なら1〜5行）：別の角度からの視点を提示
3. 問い（箇条書きで1〜3個）：最後に必ず問いで締める

重要な態度：
- 同調しすぎない、説教しない、冷笑しない
- "横に座る第二の自分"として淡々と返す
- 過去ログから矛盾・変化・繰り返しパターンがあれば短く触れる
- 最後は必ず問いで締める

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

    const reply = completion.choices[0]?.message?.content || '返信を生成できませんでした。'

    // AI返答を保存
    const { error: aiInsertError } = await supabase
      .from('messages')
      .insert({
        user_id: user.id,
        role: 'ai',
        content: reply,
      })

    if (aiInsertError) {
      console.error('Failed to insert AI message:', aiInsertError)
      // 返答は生成できたので、保存エラーでも返答は返す
    }

    return NextResponse.json({ reply })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}


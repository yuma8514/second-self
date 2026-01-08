// Vercel Serverless Function: 相談API
const { OpenAI } = require('openai')

module.exports = async (req, res) => {
  // CORS設定
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // OPTIONSリクエストの処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // POSTのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { diagnosis, message } = req.body

    // バリデーション
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'messageが必要です' })
    }

    if (!diagnosis || typeof diagnosis !== 'object') {
      return res.status(400).json({ error: 'diagnosisが必要です' })
    }

    if (
      !diagnosis.type ||
      !diagnosis.scores ||
      !diagnosis.summary ||
      !diagnosis.nextAdvice ||
      !diagnosis.consultStyle
    ) {
      return res.status(400).json({ error: 'diagnosisの形式が正しくありません' })
    }

    // OpenAI APIキーの確認
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEYが設定されていません' })
    }

    // OpenAIクライアントの初期化
    const openai = new OpenAI({ apiKey })

    // システムプロンプト
    const systemPrompt = `【相談AIの役割】

あなたは、ユーザーが「仕事・キャリアについての悩み」に腹落ちする答えを見つけるための、《相談AI》です。
目的は、ユーザーに "唯一の正解" を押しつけることではなく、
診断結果（働く価値観の比率）× 相談内容 をもとに"その人なりの納得解"を一緒につくることです。

【重要：診断結果を前提とした助言】

ユーザーには既に診断結果が提示されています。その診断結果を必ず前提として、以下の点を厳守してください：

1. **観点の変更**: 診断結果の価値観スコアに基づいて、助言の観点を変える
   - バリキャリが高い人には「成長・昇進」の観点を重視
   - 家庭・生活重視が高い人には「ワークライフバランス」の観点を重視
   - 安定第一が高い人には「リスク回避・安定性」の観点を重視
   - など、スコアに応じて観点を変える

2. **口調の変更**: 診断結果のconsultStyle.toneに合わせて口調を変える
   - 診断結果で指定されたトーン（例：「温かく穏やかだが、論理的」）を必ず反映する

3. **優先順位の変更**: 診断結果のconsultStyle.prioritiesとtabooを必ず考慮する
   - prioritiesに挙げられた条件を優先的に評価する
   - tabooに挙げられた条件を避ける方向で助言する

【比較相談（A社/B社/転職しないなど）の返答形式】

選択肢を比較する相談（例：「A社とB社で悩んでいる」「転職すべきか残るべきか」）の場合、
必ず以下の順序で返答してください：

1. **判断軸**: 診断結果の価値観スコアとconsultStyleを基に、この相談を判断する際の軸を明示する
   （例：「あなたの場合、バリキャリ30％・家庭・生活重視25％なので、成長機会とワークライフバランスの両立が判断軸になります」）

2. **確認質問**: 判断に必要な情報が不足している点を確認する質問を2〜3個提示する
   （例：「A社とB社の残業時間の違いはどの程度ですか？」「どちらも成長機会はありますか？」）

3. **暫定結論**: 現時点で得られている情報をもとに、暫定的な結論を提示する
   - 「現時点の情報では...」と前置きし、断言しない
   - 前提の揺れ（情報不足）を明示する
   （例：「現時点の情報では、A社の方があなたの価値観に合いそうですが、残業時間の詳細次第で判断が変わる可能性があります」）

【全般的な返答の原則】

1. **短く断言しない**: 決めつけず、押しつけず、しかし結論は出す
2. **前提の揺れを明示**: 情報不足や不確実性がある場合は、必ず明示する
   （例：「○○という前提で話を進めますが、もし△△なら判断が変わります」）
3. **追加質問を最後に提示**: 必要な追加質問を最後に3つまで提示する
   - 「判断をより正確にするために、以下の点を教えていただけますか？」と前置き
   - 3つまでに絞り、優先順位をつける
4. **論理と感情の両方を扱う**: 診断結果の価値観スコアと、ユーザーの感情の両方を考慮する
5. **ユーザーの価値観を否定しない**: 診断結果を尊重し、ユーザーの価値観を否定しない

【トーン】

・診断結果のconsultStyle.toneに合わせる
・温かく穏やかだが、なあなあではなく論理的
・「あなたなりの正解を一緒に探している」というスタンスで話す`

    // ユーザーメッセージの構築
    const userMessage = `【診断結果】
タイプ: ${diagnosis.type}
スコア: ${JSON.stringify(diagnosis.scores)}
概要: ${diagnosis.summary}
アドバイス: ${diagnosis.nextAdvice}
相談スタイル:
- トーン: ${diagnosis.consultStyle.tone}
- 優先事項: ${diagnosis.consultStyle.priorities.join(', ')}
- 避けるべきこと: ${diagnosis.consultStyle.taboo.join(', ')}

【ユーザーの相談内容】
${message}

上記の診断結果を前提として、ユーザーの相談に応じてください。
診断結果の価値観スコア、consultStyle（トーン・優先事項・避けるべきこと）を必ず反映してください。
比較相談の場合は「判断軸→確認質問→暫定結論」の順で返答し、最後に追加質問を3つまで提示してください。`

    // OpenAI API呼び出し
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.7,
    })

    const reply = completion.choices[0]?.message?.content || ''

    if (!reply) {
      throw new Error('AIからの応答が空でした')
    }

    res.status(200).json({ reply })
  } catch (error) {
    console.error('❌ 相談モード API error:', error)
    res.status(500).json({
      error: error.message || 'Internal server error',
    })
  }
}


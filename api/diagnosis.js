// Vercel Serverless Function: 診断API (ESM)
// package.json に "type": "module" がある前提
import { OpenAI } from "openai";

export default async function handler(req, res) {
  // CORS設定
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONSリクエストの処理（Preflight）
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // POSTのみ許可
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { answers } = req.body ?? {};

    // バリデーション
    if (!Array.isArray(answers) || answers.length === 0) {
      return res
        .status(400)
        .json({ error: "answersは配列で、最低1つは必要です" });
    }

    // OpenAI APIキーの確認
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEYが設定されていません" });
    }

    // OpenAIクライアント初期化
    const openai = new OpenAI({ apiKey });

    // システムプロンプト
    const systemPrompt = `【役割】

あなたは「働く価値観」を6つのタイプで数値化し、ユーザーが自分の傾向を理解できるように診断するAIです。

6つのタイプは次の通りです：
1. バリキャリ（昇進・成長・権限重視）
2. 家庭・生活重視
3. 趣味・余暇重視
4. 安定第一（組織や制度の安心）
5. 自由裁量（裁量・働く場所・縛られなさ）
6. 独立志向（起業・フリー）

【入力】
ユーザーが10個程度の記述式の質問に答えたテキストがまとめて渡されます。
回答は荒くても構いません。行間・ニュアンスからその人の価値観を読み取ってください。

【出力フォーマット】
必ず以下のJSON形式で返してください。他のテキストは一切含めないでください。

{
  "type": "メインタイプの名前（例: 'バリキャリ'）",
  "scores": {
    "バリキャリ": 30,
    "家庭・生活重視": 25,
    "趣味・余暇重視": 15,
    "安定第一": 20,
    "自由裁量": 5,
    "独立志向": 5
  },
  "summary": "その人の価値観の全体像を2〜4文で書く。メインとサブのタイプの組み合わせがどう効いているかを言語化する。",
  "nextAdvice": "いまの迷いはおかしくないという前提で、背中を押すような一言。答えは一つではないが、あなたなりの選び方でOKだというメッセージを含める。",
  "consultStyle": {
    "tone": "相談時のトーン（例: '温かく穏やかだが、論理的'）",
    "priorities": ["優先すべき条件1", "優先すべき条件2", "優先すべき条件3"],
    "taboo": ["避けるべき条件1", "避けるべき条件2"]
  }
}

【スコアリングのルール】
・まず、各回答から6タイプそれぞれへの「生の強さ（0〜5程度）」を読み取るイメージで評価する
・その後、6タイプの合計が100になるように比率に変換する（パーセントではなく、0〜100の数値）
・どれか1つだけが100になることはほとんどない。メイン・サブ・弱め・ほぼなし、くらいのグラデーションを意識する
・「バリバリ働きたいが、家庭も大事」「基本は安定志向だが、裁量は欲しい」など、複合的なニュアンスを必ず拾うこと

【その他】
・テンプレをなぞるだけでなく、必ずユーザーの回答内容（エピソード・口調）を反映した文章にすること。
・単なる性格診断にならないよう、「働き方」「キャリアの選び方」に結びつけること。
・JSON以外のテキストは一切含めないでください。`;

    // ユーザーの回答を結合
    const combinedText = answers
      .map((answer, index) => `質問${index + 1}: ${answer}`)
      .join("\n\n");

    // OpenAI API呼び出し
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content:
            `以下がユーザーの診断回答です。これをもとに診断結果をJSON形式で出してください。\n\n${combinedText}`,
        },
      ],
      temperature: 0.7,
    });

    const aiResponse = completion.choices?.[0]?.message?.content ?? "";
    if (!aiResponse) throw new Error("AIからの応答が空でした");

    // JSON抽出→パース
    let diagnosisData;
    try {
      diagnosisData = JSON.parse(aiResponse);
    } catch {
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("JSONが見つかりませんでした");
        console.error("AI応答:", aiResponse);
        throw new Error("AIからの応答にJSONが見つかりませんでした");
      }
      try {
        diagnosisData = JSON.parse(jsonMatch[0]);
      } catch (e) {
        console.error("JSON抽出エラー:", e);
        console.error("AI応答:", aiResponse);
        throw new Error("AIからの応答をJSONとして解析できませんでした");
      }
    }

    // 形式チェック
    if (
      !diagnosisData?.type ||
      !diagnosisData?.scores ||
      typeof diagnosisData.scores !== "object" ||
      !diagnosisData?.summary ||
      !diagnosisData?.nextAdvice ||
      !diagnosisData?.consultStyle ||
      !diagnosisData?.consultStyle?.tone ||
      !Array.isArray(diagnosisData?.consultStyle?.priorities) ||
      !Array.isArray(diagnosisData?.consultStyle?.taboo)
    ) {
      console.error("不正なレスポンス形式:", diagnosisData);
      throw new Error("AIからの応答の形式が正しくありません");
    }

    return res.status(200).json(diagnosisData);
  } catch (error) {
    console.error("❌ 診断モード API error:", error);
    return res.status(500).json({
      error: error?.message || "Internal server error",
    });
  }
}

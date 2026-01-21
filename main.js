// ============================================================================
// 定数
// ============================================================================

// Vercel Serverless Functionsを使用
const CONSULT_API_ENDPOINT = '/api/consult'
const DIAGNOSIS_API_ENDPOINT = '/api/diagnosis'


// 診断フォームの質問と回答例
const DIAGNOSIS_QUESTIONS = [
  {
    question: 'いままでの仕事やアルバイトで、「ちょっとだけ嬉しかった」「褒められてうれしかった」出来事を教えてください。',
    example: '例）請求書の処理を担当していて、締切ギリギリの案件をミスなく処理できて、上司に「助かった」と言ってもらえたとき'
  },
  {
    question: '逆に、「がっかりした」「実力不足を突き付けられた」と感じた経験はありますか？',
    example: '例）プレゼンで準備不足が露呈して、先輩から「もっと調べてから来て」と言われたとき'
  },
  {
    question: '仕事や学校で、「人よりできる」と感じることは何ですか？',
    example: '例）細かい作業を集中して続けられる、人と話すのが得意、数字を扱うのが好き など'
  },
  {
    question: '「なぜあの人はこれができないのだろう」と思うことはありますか？',
    example: '例）期限を守れない、報告が雑、チームワークが苦手 など'
  },
  {
    question: 'やるなと言われても、ついやってしまうことはありますか？',
    example: '例）完璧に仕上げようとして時間をかけすぎる、人の仕事を手伝ってしまう など'
  },
  {
    question: '仕事で「嬉しかった」「幸せだな」と感じる瞬間はどんなときですか？',
    example: '例）成果が認められたとき、チームで目標を達成したとき、自分の成長を感じたとき など'
  },
  {
    question: '仕事で「つらい」「嫌だな」と感じる瞬間はどんなときですか？',
    example: '例）残業が続く、人間関係がうまくいかない、成長を感じられない など'
  },
  {
    question: '10年後、どんな働き方をしていたら満足ですか？',
    example: '例）安定した職場で働いている、自由に働ける、家庭とのバランスが取れている など'
  },
  {
    question: '働くうえで「これは避けたい」と思う条件を教えてください。',
    example: '例）長時間労働、厳しいノルマ、人間関係が複雑 など'
  },
  {
    question: 'これまでの仕事や業務経験で、「続かなかった理由」や「続いた理由」があれば教えてください。',
    example: '例）忙しすぎて無理だった、自由度が高い職場は合っていた など'
  }
]

// ============================================================================
// DOM要素の取得
// ============================================================================

const elements = {
  chatContainer: document.getElementById('chat-container'),
  emptyState: document.getElementById('empty-state'),
  input: document.getElementById('message-input'),
  sendBtn: document.getElementById('send-btn'),
  newConversationBtn: document.getElementById('new-conversation-btn'),
  inputSection: document.getElementById('input-section'),
}

// ============================================================================
// 状態管理
// ============================================================================

const state = {
  isLoading: false,
  currentConversationId: null,
  mode: 'diagnosis', // 'diagnosis' | 'consult'
  diagnosis: null, // 診断結果を保存
}

// ============================================================================
// conversation_id管理（localStorage）
// ============================================================================

function getOrCreateConversationId() {
  let conversationId = localStorage.getItem(STORAGE_KEY_CONVERSATION_ID)
  
  if (!conversationId) {
    conversationId = crypto.randomUUID()
    localStorage.setItem(STORAGE_KEY_CONVERSATION_ID, conversationId)
  }
  
  return conversationId
}

function startNewConversation() {
  const newConversationId = crypto.randomUUID()
  localStorage.setItem(STORAGE_KEY_CONVERSATION_ID, newConversationId)
  state.currentConversationId = newConversationId
  state.mode = 'diagnosis'
  state.diagnosis = null // 診断結果をリセット
  
  // 画面をクリア
  clearMessages()
  
  // 入力欄を非表示
  if (elements.inputSection) {
    elements.inputSection.style.display = 'none'
  }
  
  // 診断スタート画面を表示
  showDiagnosisStartScreen()
}

// ============================================================================
// ユーティリティ関数
// ============================================================================

function formatTime(dateString) {
  const date = new Date(dateString)
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// ============================================================================
// UI管理
// ============================================================================

function showLoading() {
  if (!elements.chatContainer) return
  
  const loadingDiv = document.createElement('div')
  loadingDiv.className = 'loading-indicator'
  loadingDiv.id = 'loading-indicator'
  loadingDiv.innerHTML = `
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
  `
  elements.chatContainer.appendChild(loadingDiv)
  scrollToBottom()
}

function hideLoading() {
  const loading = document.getElementById('loading-indicator')
  if (loading) loading.remove()
}

function showError(message) {
  if (!elements.chatContainer) return
  
  const errorDiv = document.createElement('div')
  errorDiv.className = 'error-message'
  errorDiv.textContent = message
  elements.chatContainer.appendChild(errorDiv)
  scrollToBottom()

  setTimeout(() => {
    errorDiv.remove()
  }, 3000)
}

function showEmptyState(showDiagnosisStart = false) {
  if (!elements.emptyState) return
  
  if (showDiagnosisStart) {
    showDiagnosisStartScreen()
  } else {
    elements.emptyState.textContent = 'メッセージを送信して会話を始めましょう'
    elements.emptyState.style.display = 'block'
  }
}

function showDiagnosisStartScreen() {
  if (!elements.emptyState) return
  
  elements.emptyState.innerHTML = `
    <div class="start-button-container">
      <div class="diagnosis-card">
        <h2>働き方の価値観診断</h2>
        <p class="diagnosis-intro">
          これから10個の質問をお答えいただきますが、すべて記述式です。<br><br>
          少し大変かもしれませんが、あなた自身の言葉で書いていただくほど、診断の精度や、このあとの仕事相談の答えが格段に良くなります。<br>
          短くても大丈夫ですので、気楽に書いてみてください。
        </p>
        <h3 class="diagnosis-features-title">この診断の特徴</h3>
        <p class="diagnosis-features-intro">
          診断が終わると、あなたの状況に合わせた個別の悩み相談ができます。
        </p>
        <ul class="diagnosis-features-list">
          <li>どの会社に転職するべきか迷ってる</li>
          <li>今の職場を続けるか辞めるかで悩んでる</li>
          <li>自分に向いてる働き方がわからない</li>
          <li>やりたいことと現実のバランスが取れない</li>
          <li>家庭・収入・成長… 何を優先すべきか整理したい</li>
        </ul>
        <p class="diagnosis-conclusion">
          まずは、働くうえでのあなたの価値観を丁寧に分析します。<br>
          そのうえで、少しでもあなたが納得できる答えを一緒に見つけるために、対話しながら整理していきましょう。
        </p>
        <button class="start-button" id="start-diagnosis-btn">診断を始める</button>
      </div>
    </div>
  `
  elements.emptyState.style.display = 'block'
  
  // 診断開始ボタンのイベントリスナー
  const startBtn = document.getElementById('start-diagnosis-btn')
  if (startBtn) {
    startBtn.addEventListener('click', renderDiagnosisForm)
  }
}

function renderDiagnosisForm() {
  if (!elements.emptyState) return
  
  let formHTML = '<div class="diagnosis-form-container">'
  formHTML += '<h2 style="margin-bottom: 1.5rem;">働き方の価値観診断</h2>'
  
  DIAGNOSIS_QUESTIONS.forEach((item, index) => {
    const qNum = index + 1
    formHTML += `
      <div class="question-block">
        <p class="question-text"><strong>質問${qNum}:</strong> ${item.question}</p>
        <textarea id="q${qNum}" rows="3" placeholder="回答を入力してください..." style="width: 100%; padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; font-family: inherit; resize: vertical;"></textarea>
        <p class="answer-example" style="font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem;">${item.example}</p>
      </div>
    `
  })
  
  formHTML += `
    <button class="start-button" id="submit-diagnosis-btn" style="margin-top: 2rem; width: 100%;">診断結果を見る</button>
  `
  formHTML += '</div>'
  
  elements.emptyState.innerHTML = formHTML
  elements.emptyState.style.display = 'block'
  
  // 診断結果送信ボタンのイベントリスナー
  const submitBtn = document.getElementById('submit-diagnosis-btn')
  if (submitBtn) {
    submitBtn.addEventListener('click', handleDiagnosisSubmit)
  }
}

async function handleDiagnosisSubmit() {
  const submitBtn = document.getElementById('submit-diagnosis-btn')
  if (!submitBtn) return
  
  // 回答を収集
  const answers = []
  for (let i = 1; i <= 10; i++) {
    const textarea = document.getElementById(`q${i}`)
    if (textarea) {
      answers.push(textarea.value.trim())
    }
  }
  
  // バリデーション
  const filledAnswers = answers.filter(a => a.length > 0)
  if (filledAnswers.length === 0) {
    showError('1つ以上の質問に答えてください')
    return
  }
  
  // 送信中はボタンを無効化
  submitBtn.disabled = true
  submitBtn.textContent = '診断中...'
  
  try {
    await sendDiagnosis(answers)
  } catch (err) {
    console.error('handleDiagnosisSubmit error:', err)
    showError(err.message || '診断の送信に失敗しました')
  } finally {
    submitBtn.disabled = false
    submitBtn.textContent = '診断結果を見る'
  }
}

function hideEmptyState() {
  if (elements.emptyState) {
    elements.emptyState.style.display = 'none'
  }
}

function scrollToBottom() {
  if (!elements.chatContainer) return
  requestAnimationFrame(() => {
    elements.chatContainer.scrollTop = elements.chatContainer.scrollHeight
  })
}

function clearMessages() {
  if (!elements.chatContainer) return
  const existingMessages = elements.chatContainer.querySelectorAll(
    '.message, .error-message, .loading-indicator'
  )
  existingMessages.forEach((node) => node.remove())
}

function adjustTextareaHeight() {
  if (!elements.input) return
  elements.input.style.height = 'auto'
  elements.input.style.height = `${Math.min(elements.input.scrollHeight, 120)}px`
}

// ============================================================================
// メッセージ表示
// ============================================================================

function createMessageElement(message) {
  const messageDiv = document.createElement('div')
  messageDiv.className = `message ${message.role}`
  messageDiv.dataset.id = message.id

  const bubble = document.createElement('div')
  bubble.className = 'message-bubble'
  // 改行を保持するためにtextContentを使用（CSSのwhite-space: pre-wrapで改行が反映される）
  bubble.textContent = message.content

  const time = document.createElement('div')
  time.className = 'message-time'
  time.textContent = formatTime(message.created_at)

  messageDiv.appendChild(bubble)
  messageDiv.appendChild(time)

  return messageDiv
}

function displayMessage(message) {
  if (!elements.chatContainer) return
  
  const messageElement = createMessageElement(message)
  elements.chatContainer.appendChild(messageElement)
  hideEmptyState()
  
  if (elements.inputSection) {
    elements.inputSection.style.display = 'flex'
  }
  
  scrollToBottom()
}

function removeTempMessage(tempId) {
  if (!elements.chatContainer) return
  const tempMsg = elements.chatContainer.querySelector(`[data-id="${tempId}"]`)
  if (tempMsg) tempMsg.remove()
}

// ============================================================================
// メッセージ管理
// ============================================================================

async function loadMessages(conversationId) {
  // 履歴は一切取得せず、起動時は診断スタート画面のみ表示する
  clearMessages()
  hideLoading()

  if (state.mode === 'diagnosis') {
    showDiagnosisStartScreen()
    if (elements.inputSection) {
      elements.inputSection.style.display = 'none'
    }
  } else {
    showEmptyState(false)
  }
}

async function saveMessage(conversationId, role, content) {
  // Supabaseには保存せず、その場でdisplayMessageに渡せる形のオブジェクトだけ返す
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    role,
    content,
    created_at: now,
  }
}

async function callAI(message, conversationId) {
  // 診断結果がなければエラー
  if (!state.diagnosis) {
    throw new Error('診断結果がありません。先に診断を完了してください。')
  }

  const response = await fetch(CONSULT_API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      diagnosis: state.diagnosis,
      message,
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      errorData.error || `AIからの返答を取得できませんでした (${response.status})`
    )
  }

  const data = await response.json()
  const reply = data.reply

  if (!reply) {
    throw new Error('AIからの返答が空でした')
  }

  return reply
}

async function sendMessage() {
  if (!state.currentConversationId) {
    showError('会話IDが設定されていません')
    return
  }

  // 相談モードでない場合は送信不可
  if (state.mode !== 'consult') {
    showError('診断を完了してから相談できます')
    return
  }

  const text = elements.input?.value.trim()
  if (!text || state.isLoading) return

  state.isLoading = true
  if (elements.sendBtn) {
    elements.sendBtn.disabled = true
  }

  const userMessage = text
  if (elements.input) {
    elements.input.value = ''
    adjustTextareaHeight()
  }

  // 一時的なユーザーメッセージを表示
  const tempUserMessage = {
    id: `temp-${Date.now()}`,
    role: 'user',
    content: userMessage,
    created_at: new Date().toISOString(),
  }
  displayMessage(tempUserMessage)
  showLoading()

  try {
    // ユーザーメッセージを保存
    const userMsgData = await saveMessage(state.currentConversationId, 'user', userMessage)
    removeTempMessage(tempUserMessage.id)
    displayMessage(userMsgData)

    // AIを呼び出し
    const reply = await callAI(userMessage, state.currentConversationId)

    // AIメッセージを保存
    try {
      const aiMsgData = await saveMessage(state.currentConversationId, 'ai', reply)
      displayMessage(aiMsgData)
    } catch (saveError) {
      console.error('saveAIMessage error:', saveError)
      // 保存に失敗しても表示はする
      displayMessage({
        id: `temp-ai-${Date.now()}`,
        role: 'ai',
        content: reply,
        created_at: new Date().toISOString(),
      })
    }

    await loadMessages(state.currentConversationId)
  } catch (err) {
    console.error('sendMessage error:', err)
    removeTempMessage(tempUserMessage.id)
    showError(err.message || 'メッセージの送信に失敗しました')
  } finally {
    state.isLoading = false
    if (elements.sendBtn) {
      elements.sendBtn.disabled = false
    }
    hideLoading()
    if (elements.input) {
      elements.input.focus()
    }
  }
}

// ============================================================================
// 初期化
// ============================================================================

async function init() {
  // conversation_idを取得または作成
  const conversationId = getOrCreateConversationId()
  state.currentConversationId = conversationId
  
  // 起動時は診断モードで開始
  state.mode = 'diagnosis'

  // メッセージを読み込む
  await loadMessages(conversationId)
}

// ============================================================================
// イベントリスナーの設定
// ============================================================================

function setupEventListeners() {
  if (elements.sendBtn) {
    elements.sendBtn.addEventListener('click', sendMessage)
  }

  if (elements.input) {
    elements.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        sendMessage()
      }
    })
    elements.input.addEventListener('input', adjustTextareaHeight)
  }

  if (elements.newConversationBtn) {
    elements.newConversationBtn.addEventListener('click', startNewConversation)
  }
}

// ============================================================================
// 診断機能
// ============================================================================

function formatDiagnosisResult(data) {
  const { type, scores, summary, nextAdvice, consultStyle } = data

  let text = `【診断結果】\n\n`
  text += `タイプ: ${type}\n\n`

  text += `スコア一覧（自分のタイプを数字で把握）\n`
  Object.entries(scores).forEach(([key, value]) => {
    text += `${key}: ${value}％\n`
  })
  text += `\n`

  text += `あなたはこんな人です（自分の全体像をつかむ）\n`
  text += `${summary}\n\n`

  text += `あなたに合った働き方（方向性の理解）\n`
  consultStyle.priorities.forEach((priority) => {
    text += `- ${priority}\n`
  })
  text += `\n`

  text += `あなたに合わない働き方（避けるべき誤り）\n`
  consultStyle.taboo.forEach((taboo) => {
    text += `- ${taboo}\n`
  })
  text += `\n`

  text += `ひとことアドバイス（感情に寄り添う）\n`
  text += `${nextAdvice}\n\n`

  text += `相談時のトーン: ${consultStyle.tone}`

  return text
}

async function sendDiagnosis(answers) {
  if (!state.currentConversationId) {
    showError('会話IDが設定されていません')
    return
  }

  state.isLoading = true
  showLoading()

  try {
    const res = await fetch(DIAGNOSIS_API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      throw new Error(data.error || '診断の取得に失敗しました')
    }

    const diagnosisData = await res.json()

    // 診断結果をstateに保存
    state.diagnosis = diagnosisData

    // 診断結果を整形して表示用テキストに変換
    const diagnosisText = formatDiagnosisResult(diagnosisData)

    // 診断結果を表示
    const aiMsgData = await saveMessage(
      state.currentConversationId,
      'ai',
      diagnosisText,
    )
    displayMessage(aiMsgData)

    // 相談を促すメッセージを追加
    const consultationPrompt = `このあとは、もし今モヤモヤしてることや、仕事についての悩みがあれば何でも相談してください。
あなたの価値観に合わせて、少しでもあなたが納得できる答え見つけるために、対話しながら一緒に考えましょう。

相談内容は具体的に書いてもらえるほど、答えの精度がぐっと上がります。

相談の例：

・どの会社に転職するべきか迷っている
・今の職場を続けるか辞めるか悩んでいる
・自分に向いている働き方がわからない
・やりたいことと現実のバランスが難しい
・家庭・収入・成長… 何を優先すべきか整理したい

まずは気になっていることから、ゆっくり話してみましょう。`

    const consultationMsgData = await saveMessage(
      state.currentConversationId,
      'ai',
      consultationPrompt,
    )
    displayMessage(consultationMsgData)

    // 相談モードに切り替え
    state.mode = 'consult'
    
    // 診断フォームを非表示にし、チャット入力欄を表示
    hideEmptyState()
    if (elements.inputSection) {
      elements.inputSection.style.display = 'flex'
    }

  } catch (err) {
    console.error('sendDiagnosis error:', err)
    showError(err.message || '診断の送信に失敗しました')
    throw err
  } finally {
    state.isLoading = false
    hideLoading()
  }
}

// ============================================================================
// アプリケーション起動
// ============================================================================

setupEventListeners()
init()
if (elements.input) {
  adjustTextareaHeight()
}

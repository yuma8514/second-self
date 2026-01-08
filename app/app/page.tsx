'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabase/client'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  created_at: string
}

export default function AppPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [insightLoading, setInsightLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    loadMessages()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const checkAuth = async () => {
    const { data: { session } } = await supabaseClient.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }

  const loadMessages = async () => {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser()
      if (!user) return

      const { data, error } = await supabaseClient
        .from('messages')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      if (data) setMessages(data)
    } catch (err: any) {
      setError(err.message || 'メッセージの読み込みに失敗しました')
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('メッセージの送信に失敗しました')
      }

      const { reply } = await response.json()
      
      // メッセージを再読み込み
      await loadMessages()
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setLoading(false)
    }
  }

  const handleInsight = async (mode: 'observe' | 'deep' | 'future') => {
    setInsightLoading(mode)
    setError(null)

    try {
      const response = await fetch('/api/insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode }),
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('インサイトの取得に失敗しました')
      }

      const { reply } = await response.json()
      
      // インサイト結果をメッセージとして表示（DBには保存しない）
      const insightMessage: Message = {
        id: `insight-${Date.now()}`,
        role: 'ai',
        content: reply,
        created_at: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, insightMessage])
    } catch (err: any) {
      setError(err.message || 'エラーが発生しました')
    } finally {
      setInsightLoading(null)
    }
  }

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 relative">
      {/* 背景画像（プレースホルダー - 画像がない場合はグラデーション） */}
      <div 
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: 'url(/shadows.png), linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* ヘッダー */}
      <header className="relative z-10 flex justify-between items-center p-4 bg-white border-b border-gray-200">
        <h1 className="text-xl font-bold">第二の自分</h1>
        <button
          onClick={handleLogout}
          className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          ログアウト
        </button>
      </header>

      {/* チャット表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-10">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            メッセージを送信して会話を始めましょう
          </div>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-2">
              <div className="text-gray-500">考えています...</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="relative z-10 mx-4 mb-2 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* インサイトボタン */}
      <div className="relative z-10 px-4 py-2 flex gap-2 bg-white border-t border-gray-200">
        <button
          onClick={() => handleInsight('observe')}
          disabled={insightLoading !== null}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {insightLoading === 'observe' ? '処理中...' : '自己観察モード'}
        </button>
        <button
          onClick={() => handleInsight('deep')}
          disabled={insightLoading !== null}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {insightLoading === 'deep' ? '処理中...' : '深層モード'}
        </button>
        <button
          onClick={() => handleInsight('future')}
          disabled={insightLoading !== null}
          className="flex-1 px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {insightLoading === 'future' ? '処理中...' : '未来モード'}
        </button>
      </div>

      {/* 入力欄 */}
      <div className="relative z-10 p-4 bg-white border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSend()
              }
            }}
            placeholder="メッセージを入力..."
            disabled={loading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            送信
          </button>
        </div>
      </div>
    </div>
  )
}


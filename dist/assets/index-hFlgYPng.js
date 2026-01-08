(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const i of document.querySelectorAll('link[rel="modulepreload"]'))o(i);new MutationObserver(i=>{for(const r of i)if(r.type==="childList")for(const c of r.addedNodes)c.tagName==="LINK"&&c.rel==="modulepreload"&&o(c)}).observe(document,{childList:!0,subtree:!0});function s(i){const r={};return i.integrity&&(r.integrity=i.integrity),i.referrerPolicy&&(r.referrerPolicy=i.referrerPolicy),i.crossOrigin==="use-credentials"?r.credentials="include":i.crossOrigin==="anonymous"?r.credentials="omit":r.credentials="same-origin",r}function o(i){if(i.ep)return;i.ep=!0;const r=s(i);fetch(i.href,r)}})();const I="http://localhost:3001",x=`${I}/api/diagnosis`,D=`${I}/api/consult`,m="second-self-conversation-id",B=[{question:"いままでの仕事やアルバイトで、「ちょっとだけ嬉しかった」「褒められてうれしかった」出来事を教えてください。",example:"例）請求書の処理を担当していて、締切ギリギリの案件をミスなく処理できて、上司に「助かった」と言ってもらえたとき"},{question:"逆に、「がっかりした」「実力不足を突き付けられた」と感じた経験はありますか？",example:"例）プレゼンで準備不足が露呈して、先輩から「もっと調べてから来て」と言われたとき"},{question:"仕事や学校で、「人よりできる」と感じることは何ですか？",example:"例）細かい作業を集中して続けられる、人と話すのが得意、数字を扱うのが好き など"},{question:"「なぜあの人はこれができないのだろう」と思うことはありますか？",example:"例）期限を守れない、報告が雑、チームワークが苦手 など"},{question:"やるなと言われても、ついやってしまうことはありますか？",example:"例）完璧に仕上げようとして時間をかけすぎる、人の仕事を手伝ってしまう など"},{question:"仕事で「嬉しかった」「幸せだな」と感じる瞬間はどんなときですか？",example:"例）成果が認められたとき、チームで目標を達成したとき、自分の成長を感じたとき など"},{question:"仕事で「つらい」「嫌だな」と感じる瞬間はどんなときですか？",example:"例）残業が続く、人間関係がうまくいかない、成長を感じられない など"},{question:"10年後、どんな働き方をしていたら満足ですか？",example:"例）安定した職場で働いている、自由に働ける、家庭とのバランスが取れている など"},{question:"働くうえで「これは避けたい」と思う条件を教えてください。",example:"例）長時間労働、厳しいノルマ、人間関係が複雑 など"},{question:"これまでの経験で、「続かなかった理由」や「続いた理由」があれば教えてください。",example:"例）忙しすぎて無理だった、自由度が高い職場は合っていた など"}],e={chatContainer:document.getElementById("chat-container"),emptyState:document.getElementById("empty-state"),input:document.getElementById("message-input"),sendBtn:document.getElementById("send-btn"),newConversationBtn:document.getElementById("new-conversation-btn"),inputSection:document.getElementById("input-section")},a={isLoading:!1,currentConversationId:null,mode:"diagnosis"};function L(){let t=localStorage.getItem(m);return t||(t=crypto.randomUUID(),localStorage.setItem(m,t)),t}function M(){const t=crypto.randomUUID();localStorage.setItem(m,t),a.currentConversationId=t,a.mode="diagnosis",C(),e.inputSection&&(e.inputSection.style.display="none"),f()}function O(t){const n=new Date(t);return`${n.getHours().toString().padStart(2,"0")}:${n.getMinutes().toString().padStart(2,"0")}`}function S(){if(!e.chatContainer)return;const t=document.createElement("div");t.className="loading-indicator",t.id="loading-indicator",t.innerHTML=`
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
    <div class="loading-dot"></div>
  `,e.chatContainer.appendChild(t),g()}function p(){const t=document.getElementById("loading-indicator");t&&t.remove()}function d(t){if(!e.chatContainer)return;const n=document.createElement("div");n.className="error-message",n.textContent=t,e.chatContainer.appendChild(n),g(),setTimeout(()=>{n.remove()},3e3)}function N(t=!1){e.emptyState&&(t?f():(e.emptyState.textContent="メッセージを送信して会話を始めましょう",e.emptyState.style.display="block"))}function f(){if(!e.emptyState)return;e.emptyState.innerHTML=`
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
  `,e.emptyState.style.display="block";const t=document.getElementById("start-diagnosis-btn");t&&t.addEventListener("click",T)}function T(){if(!e.emptyState)return;let t='<div class="diagnosis-form-container">';t+='<h2 style="margin-bottom: 1.5rem;">働き方の価値観診断</h2>',B.forEach((s,o)=>{const i=o+1;t+=`
      <div class="question-block">
        <p class="question-text"><strong>質問${i}:</strong> ${s.question}</p>
        <textarea id="q${i}" rows="3" placeholder="回答を入力してください..." style="width: 100%; padding: 0.75rem; border: 1px solid #e0e0e0; border-radius: 8px; font-size: 0.95rem; font-family: inherit; resize: vertical;"></textarea>
        <p class="answer-example" style="font-size: 0.8rem; color: #6b7280; margin-top: 0.5rem;">${s.example}</p>
      </div>
    `}),t+=`
    <button class="start-button" id="submit-diagnosis-btn" style="margin-top: 2rem; width: 100%;">診断結果を見る</button>
  `,t+="</div>",e.emptyState.innerHTML=t,e.emptyState.style.display="block";const n=document.getElementById("submit-diagnosis-btn");n&&n.addEventListener("click",q)}async function q(){const t=document.getElementById("submit-diagnosis-btn");if(!t)return;const n=[];for(let o=1;o<=10;o++){const i=document.getElementById(`q${o}`);i&&n.push(i.value.trim())}if(n.filter(o=>o.length>0).length===0){d("1つ以上の質問に答えてください");return}t.disabled=!0,t.textContent="診断中...";try{await U(n)}catch(o){console.error("handleDiagnosisSubmit error:",o),d(o.message||"診断の送信に失敗しました")}finally{t.disabled=!1,t.textContent="診断結果を見る"}}function b(){e.emptyState&&(e.emptyState.style.display="none")}function g(){e.chatContainer&&requestAnimationFrame(()=>{e.chatContainer.scrollTop=e.chatContainer.scrollHeight})}function C(){if(!e.chatContainer)return;e.chatContainer.querySelectorAll(".message, .error-message, .loading-indicator").forEach(n=>n.remove())}function y(){e.input&&(e.input.style.height="auto",e.input.style.height=`${Math.min(e.input.scrollHeight,120)}px`)}function A(t){const n=document.createElement("div");n.className=`message ${t.role}`,n.dataset.id=t.id;const s=document.createElement("div");s.className="message-bubble",s.textContent=t.content;const o=document.createElement("div");return o.className="message-time",o.textContent=O(t.created_at),n.appendChild(s),n.appendChild(o),n}function l(t){if(!e.chatContainer)return;const n=A(t);e.chatContainer.appendChild(n),b(),e.inputSection&&(e.inputSection.style.display="flex"),g()}function h(t){if(!e.chatContainer)return;const n=e.chatContainer.querySelector(`[data-id="${t}"]`);n&&n.remove()}async function w(t){C(),p(),a.mode==="diagnosis"?(f(),e.inputSection&&(e.inputSection.style.display="none")):N(!1)}async function u(t,n,s){const o=new Date().toISOString();return{id:crypto.randomUUID(),conversation_id:t,role:n,content:s,created_at:o}}async function $(t,n){const s=await fetch(D,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:t,conversationId:n})});if(!s.ok){const r=await s.json().catch(()=>({}));throw new Error(r.error||`AIからの返答を取得できませんでした (${s.status})`)}const i=(await s.json()).reply;if(!i)throw new Error("AIからの返答が空でした");return i}async function v(){var o;if(!a.currentConversationId){d("会話IDが設定されていません");return}if(a.mode!=="consult"){d("診断を完了してから相談できます");return}const t=(o=e.input)==null?void 0:o.value.trim();if(!t||a.isLoading)return;a.isLoading=!0,e.sendBtn&&(e.sendBtn.disabled=!0);const n=t;e.input&&(e.input.value="",y());const s={id:`temp-${Date.now()}`,role:"user",content:n,created_at:new Date().toISOString()};l(s),S();try{const i=await u(a.currentConversationId,"user",n);h(s.id),l(i);const r=await $(n,a.currentConversationId);try{const c=await u(a.currentConversationId,"ai",r);l(c)}catch(c){console.error("saveAIMessage error:",c),l({id:`temp-ai-${Date.now()}`,role:"ai",content:r,created_at:new Date().toISOString()})}await w(a.currentConversationId)}catch(i){console.error("sendMessage error:",i),h(s.id),d(i.message||"メッセージの送信に失敗しました")}finally{a.isLoading=!1,e.sendBtn&&(e.sendBtn.disabled=!1),p(),e.input&&e.input.focus()}}async function _(){const t=L();a.currentConversationId=t,a.mode="diagnosis",await w()}function P(){e.sendBtn&&e.sendBtn.addEventListener("click",v),e.input&&(e.input.addEventListener("keydown",t=>{t.key==="Enter"&&!t.shiftKey&&(t.preventDefault(),v())}),e.input.addEventListener("input",y)),e.newConversationBtn&&e.newConversationBtn.addEventListener("click",M)}async function U(t){if(!a.currentConversationId){d("会話IDが設定されていません");return}a.isLoading=!0,S();try{const n=await fetch(x,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({conversationId:a.currentConversationId,answers:t})});if(!n.ok){const E=await n.json().catch(()=>({}));throw new Error(E.error||"診断の取得に失敗しました")}const o=(await n.json()).diagnosis,i=await u(a.currentConversationId,"ai",o);l(i);const c=await u(a.currentConversationId,"ai",`このあとは、もし今モヤモヤしてることや、仕事についての悩みがあれば何でも相談してください。
あなたの価値観に合わせて、少しでもあなたが納得できる答え見つけるために、対話しながら一緒に考えましょう。

相談内容は具体的に書いてもらえるほど、答えの精度がぐっと上がります。

相談の例：

・どの会社に転職するべきか迷っている
・今の職場を続けるか辞めるか悩んでいる
・自分に向いている働き方がわからない
・やりたいことと現実のバランスが難しい
・家庭・収入・成長… 何を優先すべきか整理したい

まずは気になっていることから、ゆっくり話してみましょう。`);l(c),a.mode="consult",b(),e.inputSection&&(e.inputSection.style.display="flex")}catch(n){throw console.error("sendDiagnosis error:",n),d(n.message||"診断の送信に失敗しました"),n}finally{a.isLoading=!1,p()}}P();_();e.input&&y();

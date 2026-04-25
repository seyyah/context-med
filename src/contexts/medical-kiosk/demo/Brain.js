/**
 * Brain.js - AI Brain Katmanı v2.0
 * PRIMARY: Groq (Llama-3.1) | FALLBACK: Gemini Flash
 * Persona: Dr. Context - Context-Med Akıllı Medikal Kiosk Asistanı
 */

import Voice from './Voice';

// === PRIMARY: GROQ ===
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.1-8b-instant";

// === FALLBACK: GEMINI ===
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-latest";

const SYSTEM_PROMPT = `Sen Context-Med akıllı sağlık kioskosunun yapay zeka doktoru "Dr. Context"sin.
Kullanıcılara empatik, profesyonel ve Türkçe olarak yardım et.

ÇIKTI KURALI: Sadece ve sadece aşağıdaki JSON formatında yanıt ver. Başka hiçbir şey yazma:
{"speech":"[Kullanıcıya söylenecek doğal Türkçe metin]","action":"IDLE","target":"general","emotion":"professional"}

action seçenekleri: OPEN_PANEL, ANALYZE_VITAL, IDLE, INITIALIZE_SCENE
target seçenekleri: blood_pressure, heart_rate, body_temp, bmi, general
emotion seçenekleri: happy, professional, empathetic, neutral

Örnek: {"speech":"Merhaba! Size nasıl yardımcı olabilirim?","action":"IDLE","target":"general","emotion":"happy"}`;

class MedicalBrain {
  constructor() {
    this.systemPrompt = SYSTEM_PROMPT;
    this.history = [];
  }

  async sendMessage(message, onSpeechEnd = null) {
    console.log("🧠 Brain.sendMessage çağrıldı:", message);
    let text = "";

    // === PRIMARY: GROQ ===
    try {
      console.log("🔷 Groq API'ye istek gönderiliyor...");

      const groqHistory = this.history.map(msg => ({
        role: msg.role === 'model' ? 'assistant' : 'user',
        content: msg.parts.map(p => p.text).join('')
      }));

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: this.systemPrompt },
            ...groqHistory,
            { role: "user", content: message }
          ],
          temperature: 0.7,
          max_tokens: 512
        })
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Groq HTTP ${response.status}: ${errBody}`);
      }

      const data = await response.json();
      text = data.choices[0].message.content;
      console.log("✅ Groq yanıt verdi:", text);

    } catch (groqError) {
      console.warn("⚠️ Groq başarısız, Gemini'ye geçiliyor...", groqError.message);

      // === FALLBACK: GEMINI ===
      try {
        const geminiHistory = this.history.map(msg => ({
          role: msg.role === 'model' ? 'model' : 'user',
          parts: msg.parts
        }));

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                role: "system",
                parts: [{ text: this.systemPrompt }]
              },
              contents: [
                ...geminiHistory,
                { role: 'user', parts: [{ text: message }] }
              ],
              generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 512,
                responseMimeType: "application/json"
              }
            })
          }
        );

        if (!response.ok) {
          const errBody = await response.text();
          throw new Error(`Gemini HTTP ${response.status}: ${errBody}`);
        }

        const data = await response.json();
        text = data.candidates[0].content.parts[0].text;
        console.log("✅ Gemini yanıt verdi:", text);

      } catch (geminiError) {
        console.error("❌ Her iki API da başarısız!", {
          groq: groqError.message,
          gemini: geminiError.message
        });

        // Demo modu için akıllı sabit yanıt
        const lowerMsg = message.toLowerCase();
        let demoReply;
        if (lowerMsg.includes('merhaba') || lowerMsg.includes('selam')) {
          demoReply = { speech: "Merhaba! Ben Dr. Context, sizin akıllı sağlık asistanınızım. Nasıl yardımcı olabilirim?", action: "IDLE", target: "general", emotion: "happy" };
        } else if (lowerMsg.includes('kalp') || lowerMsg.includes('nabız') || lowerMsg.includes('çarpıntı')) {
          demoReply = { speech: "Kalp ritminizle ilgili endişeleriniz için nabız panelini açıyorum. Lütfen parmağınızı sensöre koyun.", action: "OPEN_PANEL", target: "heart_rate", emotion: "professional" };
        } else if (lowerMsg.includes('tansiyon') || lowerMsg.includes('basınç')) {
          demoReply = { speech: "Tansiyonunuzu ölçmek için kolunuzu manşona yerleştirin. Ölçüm başlıyor.", action: "OPEN_PANEL", target: "blood_pressure", emotion: "professional" };
        } else if (lowerMsg.includes('ateş') || lowerMsg.includes('sıcaklık')) {
          demoReply = { speech: "Vücut sıcaklığınızı kontrol ediyorum. Termometreyi ağız ya da kulak bölgesine yaklaştırın.", action: "ANALYZE_VITAL", target: "body_temp", emotion: "empathetic" };
        } else {
          demoReply = { speech: "Şikayetinizi anlıyorum. Size daha iyi yardımcı olabilmem için birkaç sorum var. Semptomlarınız ne zamandır devam ediyor?", action: "IDLE", target: "general", emotion: "empathetic" };
        }
        text = JSON.stringify(demoReply);
      }
    }

    // Geçmişe ekle
    this.history.push({ role: 'user', parts: [{ text: message }] });
    this.history.push({ role: 'model', parts: [{ text: text }] });

    // Geçmişi 10 çift (20 mesaj) ile sınırla
    if (this.history.length > 20) {
      this.history = this.history.slice(this.history.length - 20);
    }

    // JSON'dan speech kısmını çıkar ve seslendir
    let speechText = text;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.speech) speechText = parsed.speech;
      }
    } catch (e) {
      console.warn("JSON parse hatası, ham metin seslendirilecek");
    }

    console.log("🔊 Seslendirilecek:", speechText);
    Voice.speak(speechText, onSpeechEnd);

    return text;
  }
}

// Singleton - KioskFrame'deki `import Brain from './Brain'` ile uyumlu
export default new MedicalBrain();

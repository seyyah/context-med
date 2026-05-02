// API Test Script - Keys should be set in environment variables
// Bu dosyayı çalıştırmak için .env'den key'leri alın
// Usage: GROQ_API_KEY=xxx GEMINI_API_KEY=yyy node test-apis.mjs

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_KEY_HERE";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_KEY_HERE";

async function testGemini() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { role: 'system', parts: [{ text: 'You are a medical kiosk assistant. Reply ONLY with JSON.' }] },
      contents: [{ role: 'user', parts: [{ text: 'Kalbim hizli atiyor' }] }]
    })
  });
  const data = await res.json();
  console.log('Gemini Status:', res.status);
  if (data.candidates) {
    console.log('GEMINI WORKS! Reply:', data.candidates[0].content.parts[0].text);
  } else {
    console.log('Gemini error:', JSON.stringify(data));
  }
}

async function testGroq() {
  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'You are a medical kiosk. Reply ONLY with JSON: {"speech":"...","action":"IDLE","target":"general","emotion":"professional"}' },
        { role: 'user', content: 'Kalbim hizli atiyor' }
      ]
    })
  });
  const data = await res.json();
  console.log('Groq Status:', res.status);
  if (data.choices) {
    console.log('GROQ WORKS! Reply:', data.choices[0].message.content);
  } else {
    console.log('Groq error:', JSON.stringify(data));
  }
}

testGemini();
testGroq();

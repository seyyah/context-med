// API Test Script - Use environment variables for keys
// Usage: GROQ_API_KEY=xxx node test-apis.js

const GROQ_API_KEY = process.env.GROQ_API_KEY || "YOUR_GROQ_KEY_HERE";
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "YOUR_GEMINI_KEY_HERE";

async function testGemini() {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
    })
  });
  console.log('Gemini Status:', res.status, await res.json());
}
testGemini();

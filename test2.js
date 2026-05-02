const fetch = require('node-fetch');
async function testGemini() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=AIzaSyBddEYueYkjZmIdwGcls1rhmm6WNtIeKV4`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: {
          role: 'system',
          parts: [{ text: 'You are a test.' }]
        },
        contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
      })
    });
    const data = await res.json();
    console.log('Gemini Status:', res.status);
    console.log('Gemini Response:', JSON.stringify(data, null, 2));
  } catch (e) { console.error('Gemini err:', e); }
}
testGemini();

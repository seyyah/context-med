const https = require('https');

class PatientAgent {
  constructor(scenario, apiKey) {
    this.scenario = scenario;
    this.apiKey = apiKey || 'e26febbb9c264085b5f531a1de284a5d.GjLCWyAt_VmDYhpA4rWdwUHL'; // Yeni anahtar
    this.messages = [
      {
        role: 'system',
        content: this.generateSystemPrompt()
      }
    ];
  }

  generateSystemPrompt() {
    const persona = this.scenario.patient_persona || {};
    const complaint = this.scenario.presenting_complaint || {};
    
    return `Sen ${persona.name || 'Mehmet'}'sin, ${persona.age || 58} yaşında bir ${persona.occupation || 'hasta'}. Tıp bilgin yoktur.
Öğrenci sormadıkça bilgi vermezsin. Maksimum 2 kısa cümleyle cevap verirsin.
Tıbbi terim kullanmazsın. Kendin teşhis koymazsın, doktor gibi konuşmazsın.
Eğer öğrenci karmaşık bir terim kullanırsa, "onu anlamadım doktor, basitçe söyler misiniz?" dersin.
Şikayetin: ${complaint.chief || 'Şikayetim var'}.
Başlangıç: ${complaint.onset_min_ago || ''} dakika önce.`;
  }

  async getReply(studentInput) {
    this.messages.push({ role: 'user', content: studentInput });

    try {
      // Trying Groq API endpoint first for Llama-3
      const response = await this.callLLMAPI('api.groq.com', '/openai/v1/chat/completions', 'llama3-70b-8192');
      this.messages.push({ role: 'assistant', content: response });
      return response;
    } catch (err) {
      // Fallback if the API key format is actually for another provider or invalid
      console.log(`[API Hatası: ${err.message}] -> Fallback Mock Yanıtı Kullanılıyor...`);
      const fallbackResponse = this.getMockReply(studentInput);
      this.messages.push({ role: 'assistant', content: fallbackResponse });
      return fallbackResponse;
    }
  }

  callLLMAPI(hostname, path, model) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: model,
        messages: this.messages,
        temperature: 0.7,
        max_tokens: 100
      });

      const options = {
        hostname: hostname,
        path: path,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const parsed = JSON.parse(body);
              resolve(parsed.choices[0].message.content);
            } catch (e) {
              reject(new Error('Invalid JSON response'));
            }
          } else {
            reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          }
        });
      });

      req.on('error', (e) => reject(e));
      req.write(data);
      req.end();
    });
  }

  getMockReply(input) {
    const text = input.toLowerCase();
    if (text.includes('merhaba') || text.includes('hoşgeldiniz')) {
      return `Merhaba doktor bey, ${this.scenario.presenting_complaint?.chief || 'iyi değilim'}.`;
    }
    if (text.includes('ağrı') || text.includes('nereye') || text.includes('yayılıyor')) {
      return 'Evet, sol kolumda da hissediyorum.';
    }
    if (text.includes('kalp') || text.includes('stemi') || text.includes('kriz')) {
      return 'Onu anlamadım doktor, sadece göğsüm ağrıyor.';
    }
    return 'Anladım doktor, başka ne sormak istersiniz?';
  }
}

module.exports = { PatientAgent };

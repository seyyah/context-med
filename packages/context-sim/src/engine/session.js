const readline = require('readline');
const { PatientAgent } = require('../agents/PatientAgent');

async function startTextSession(scenario, studentId) {
  console.log(`\n======================================================`);
  console.log(`[OTURUM BAŞLADI] Öğrenci ID: ${studentId}`);
  console.log(`Senaryo: ${scenario.diagnosis || 'Bilinmiyor'} Mod: Yazılı (Fallback)`);
  console.log(`======================================================\n`);
  
  const persona = scenario.patient_persona || {};
  console.log(`Hasta Profil Bilgisi: ${persona.name || 'Mehmet'}, ${persona.age || 58} yaşında, ${persona.occupation || 'Meslek bilinmiyor'}.`);
  console.log(`(Simülasyondan çıkmak için 'exit' veya 'çıkış' yazın)\n`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const agent = new PatientAgent(scenario);

  const askQuestion = () => {
    rl.question('\x1b[36mÖĞRENCİ:\x1b[0m ', async (answer) => {
      if (answer.toLowerCase() === 'exit' || answer.toLowerCase() === 'çıkış') {
        console.log('Oturum sonlandırıldı.');
        rl.close();
        return;
      }

      try {
        process.stdout.write('\x1b[32mHASTA:\x1b[0m yazıyor...');
        const reply = await agent.getReply(answer);
        
        // Satırı temizle ve cevabı yaz
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.log(`\x1b[32mHASTA:\x1b[0m ${reply}\n`);
      } catch (error) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        console.error(`\x1b[31m[SİSTEM HATASI]:\x1b[0m ${error.message}\n`);
      }

      askQuestion();
    });
  };

  askQuestion();
}

module.exports = { startTextSession };

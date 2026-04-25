const https = require('https');
const fs = require('fs');
const path = require('path');

async function generateAudio({ segments, outputPath, provider, voice, dryRun }) {
    let activeProvider = provider || 'mock';
    let activeVoice = voice || 'alloy';

    if (activeProvider === 'openai' && !process.env.OPENAI_API_KEY) {
        activeProvider = 'mock';
    }

    if (dryRun) {
        console.log(`[DRY-RUN] Will create following files in ${path.dirname(outputPath)}:`);
        console.log(`  - narration.json`);
        console.log(`  - transcript.md`);
        console.log(`  - show-notes.md`);
        console.log(`  - segments.json`);
        console.log(`  - run-report.md`);
        console.log(`  - ${path.basename(outputPath)}`);
        console.log(`[DRY-RUN] TTS Provider would be: ${activeProvider}`);
        return { mode: 'skipped-dry-run', provider: activeProvider, voice: activeVoice };
    }

    if (activeProvider === 'openai') {
        const fullText = segments.map(s => s.text).join(' ');

        try {
            await new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'api.openai.com',
                    port: 443,
                    path: '/v1/audio/speech',
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }, (res) => {
                    if (res.statusCode !== 200) {
                        reject(new Error(`OpenAI API failed with status ${res.statusCode}`));
                        return;
                    }
                    const file = fs.createWriteStream(outputPath);
                    res.pipe(file);
                    file.on('finish', resolve);
                    file.on('error', reject);
                });

                req.on('error', reject);

                req.write(JSON.stringify({
                    model: 'tts-1',
                    input: fullText,
                    voice: activeVoice
                }));
                req.end();
            });

            return { mode: 'real', provider: 'openai', voice: activeVoice };
        } catch (err) {
            console.warn(`[WARN] OpenAI TTS Error: ${err.message}. Falling back to mock audio.`);
            activeProvider = 'mock';
        }
    }

    // Default / fallback mock
    fs.writeFileSync(outputPath, 'Mock Audio Stream');
    return { mode: 'mock', provider: 'mock', voice: activeVoice };
}

module.exports = { generateAudio };

/**
 * Voice.js - TTS ve Lip Sync Yöneticisi v2.0
 * PRIMARY: Web Speech API (browser built-in, güvenilir)
 * LIP SYNC: Konuşma süresi boyunca simulated audio level (0.0-1.0)
 * OPTIONAL: ElevenLabs (API bağlıysa daha doğal ses için)
 */

const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY || "";
const USE_ELEVENLABS = ELEVENLABS_API_KEY.length > 0; // API Key varsa otomatik aktif et

const ELEVENLABS_FEMALE_VOICE = import.meta.env.VITE_ELEVENLABS_FEMALE_VOICE || "21m00Tcm4TlvDq8ikWAM"; // Rachel
const ELEVENLABS_MALE_VOICE = import.meta.env.VITE_ELEVENLABS_MALE_VOICE || "pNInz6obbf5pNrq8294p"; // Adam

class MedicalVoice {
  constructor() {
    this.isPlaying = false;
    this._simulatedLevel = 0;
    this._lipSyncInterval = null;
    this._currentUtterance = null;
    this.gender = 'female'; // Varsayılan cinsiyet
  }

  setGender(gender) {
    this.gender = gender;
    console.log(`🎙️ Ses Cinsiyeti Değişti: ${gender}`);
  }

  /**
   * Ana konuşma metodu - hem sesli çalar hem lip sync başlatır
   * @param {string} text Konuşulacak metin
   * @param {function} onEndCallback Konuşma bitince tetiklenecek fonksiyon
   */
  async speak(text, onEndCallback = null) {
    if (!text || text.trim() === '') {
      if(onEndCallback) onEndCallback();
      return;
    }

    // Önceki konuşmayı durdur
    this.stop();

    // Sadece kadın sesinde ElevenLabs kullan, erkek sesinde ise yerel Windows TTS'i (Web Speech) kullan
    if (USE_ELEVENLABS && ELEVENLABS_API_KEY && this.gender === 'female') {
      await this._speakElevenLabs(text, onEndCallback);
    } else {
      this._speakWebSpeech(text, onEndCallback);
    }
  }

  /**
   * Web Speech API ile sesli okuma + simulated lip sync
   */
  _speakWebSpeech(text, onEndCallback = null) {
    if (!window.speechSynthesis) {
      console.warn('❌ Bu tarayıcı Web Speech API desteklemiyor!');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'tr-TR';
    utterance.rate = 0.95;
    utterance.volume = 1.0;

    const voices = window.speechSynthesis.getVoices();
    const trVoices = voices.filter(v => v.lang.startsWith('tr'));
    
    // Windows/Chrome için olası kadın/erkek isimleri
    const femaleKeywords = ['female', 'ayşe', 'emel', 'yelda', 'kız', 'kadın'];
    const maleKeywords = ['male', 'tolga', 'erkek'];

    if (this.gender === 'female') {
      utterance.pitch = 1.5; // Kadın sesi için pitchi biraz daha artıralım (Eğer Tolga seçilirse daha ince çıksın)
      const turkishFemale = trVoices.find(v => femaleKeywords.some(keyword => v.name.toLowerCase().includes(keyword)));
      
      if (turkishFemale) {
        utterance.voice = turkishFemale;
        console.log(`🎙️ Kadın Sesi Seçildi: ${turkishFemale.name}`);
      } else if (trVoices.length > 0) {
        utterance.voice = trVoices[0]; // Bulunamazsa ilk türkçe sesi al (Muhtemelen Tolga)
        console.log(`⚠️ Kadın sesi bulunamadı, mevcut ses pitch ile inceltildi: ${trVoices[0].name}`);
        console.log("Mevcut TR sesler:", trVoices.map(v=>v.name).join(', '));
      }
    } else {
      utterance.pitch = 0.95; // Erkek sesi daha doğal bir ton
      const turkishMale = trVoices.find(v => maleKeywords.some(keyword => v.name.toLowerCase().includes(keyword)));
      
      if (turkishMale) {
        utterance.voice = turkishMale;
        console.log(`🎙️ Erkek Sesi Seçildi: ${turkishMale.name}`);
      } else if (trVoices.length > 0) {
        // Genelde varsayılan erkek (Tolga) olur
        utterance.voice = trVoices[trVoices.length - 1]; 
        console.log(`⚠️ Erkek sesi bulunamadı, varsayılan TR sesi seçildi: ${utterance.voice.name}`);
      }
    }

    utterance.onstart = () => {
      console.log('🔊 Web Speech başladı:', text.substring(0, 30) + '...');
      this.isPlaying = true;
      this._startLipSync();
    };

    utterance.onend = () => {
      console.log('🔊 Web Speech bitti.');
      this.isPlaying = false;
      this._stopLipSync();
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      console.error('❌ Web Speech hatası:', e.error);
      this.isPlaying = false;
      this._stopLipSync();
      if (onEndCallback) onEndCallback();
    };

    this._currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  /**
   * Lip Sync için simulated audio level - konuşurken wave pattern üretir
   */
  _startLipSync() {
    this._stopLipSync(); // Öncekini temizle

    let t = 0;
    this._lipSyncInterval = setInterval(() => {
      if (this.isPlaying) {
        // Doğal konuşma dalgası: sinüs + rastgele gürültü
        t += 0.15;
        const base = 0.3 + Math.sin(t * 3) * 0.2 + Math.sin(t * 7) * 0.1;
        const noise = (Math.random() - 0.5) * 0.15;
        this._simulatedLevel = Math.max(0, Math.min(1, base + noise));
      } else {
        // Konuşma bitti, level'i yumuşakça 0'a indirgeliyoruz
        this._simulatedLevel = Math.max(0, this._simulatedLevel - 0.08);
        if (this._simulatedLevel <= 0) {
          this._stopLipSync();
        }
      }
    }, 50); // 20fps lip sync
  }

  _stopLipSync() {
    if (this._lipSyncInterval) {
      clearInterval(this._lipSyncInterval);
      this._lipSyncInterval = null;
    }
    this._simulatedLevel = 0;
  }

  /**
   * Konuşmayı durdur
   */
  stop() {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this._stopLipSync();
  }

  /**
   * Avatar'ın useFrame hook'u tarafından her frame'de çağrılır
   * returns: 0.0 - 1.0 arası ses seviyesi
   */
  getAudioLevel() {
    return this._simulatedLevel;
  }

  /**
   * ElevenLabs WebSocket (opsiyonel, yüksek kalite)
   */
  async _speakElevenLabs(text, onEndCallback = null) {
    console.log('🎙️ ElevenLabs deneniyor...');
    try {
      const voiceId = this.gender === 'female' ? ELEVENLABS_FEMALE_VOICE : ELEVENLABS_MALE_VOICE;
      const wsUrl = `wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input?model_id=eleven_multilingual_v2&xi-api-key=${ELEVENLABS_API_KEY}`;
      const socket = new WebSocket(wsUrl);

      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      analyser.connect(audioCtx.destination);

      socket.onopen = () => {
        socket.send(JSON.stringify({
          text: " ",
          voice_settings: { stability: 0.5, similarity_boost: 0.8 },
          xi_api_key: ELEVENLABS_API_KEY,
        }));
        socket.send(JSON.stringify({ text: text, try_trigger_generation: true }));
        socket.send(JSON.stringify({ text: "" }));
      };

      socket.onmessage = async (event) => {
        const data = JSON.parse(event.data);
        if (data.audio) {
          const bytes = Uint8Array.from(atob(data.audio), c => c.charCodeAt(0));
          const decoded = await audioCtx.decodeAudioData(bytes.buffer);
          const src = audioCtx.createBufferSource();
          src.buffer = decoded;
          src.connect(analyser);
          src.start();
          this.isPlaying = true;
          this._startLipSync();
          src.onended = () => { 
            this.isPlaying = false; 
            if (onEndCallback) onEndCallback();
          };
        }
      };

      socket.onerror = (e) => {
        console.warn('⚠️ ElevenLabs WebSocket hatası, Web Speech fallback yapılıyor...');
        this._speakWebSpeech(text, onEndCallback);
      };

      // 3 saniye içinde bağlanamazsa fallback
      setTimeout(() => {
        if (!this.isPlaying && socket.readyState !== WebSocket.OPEN) {
          console.warn('⚠️ ElevenLabs timeout, Web Speech fallback yapılıyor...');
          socket.close();
          this._speakWebSpeech(text, onEndCallback);
        }
      }, 3000);

    } catch (e) {
      console.error('ElevenLabs hatası:', e);
      this._speakWebSpeech(text, onEndCallback);
    }
  }
}

// Singleton export
export default new MedicalVoice();

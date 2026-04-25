import React, { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Activity, Thermometer, Heart, Wind, AlertCircle, RotateCcw, Globe, HelpCircle, Send, Mic, MicOff, MessageSquare, X, ChevronDown, User } from 'lucide-react';
import Avatar from './Avatar';
import AvatarWidget from './AvatarWidget';
import Brain from './Brain';
import ActionManager from './ActionManager';
import Voice from './Voice';
import IdleManager from './IdleManager';
import ErrorBoundary from './ErrorBoundary';

/**
 * KioskFrame (V2 - Desktop Kiosk Layout)
 * 1920x1080 yatay çözünürlük ve Kiosk Modu standartlarına göre güncellenmiştir.
 */
const KioskFrame = ({ userName = "Ziyaretçi", onLogout, children }) => {
  // Medical Stats State
  const [vitals, setVitals] = useState({
    hr: 76,
    temp: 36.7,
    bp: "118/79",
    spo2: 99
  });

  // 3D Scene Config State (Görsel Düzeltme Protokolü)
  const [sceneConfig, setSceneConfig] = useState({
    lights: true,      // Başlangıçtan itibaren aydınlık
    camera_y: 0.2,     // Sevimli robot kafasına odaklı
    avatar_y: -0.2     // Avatarı tam ekran ortasına konumlandır
  });

  const [chatHistory, setChatHistory] = useState([
    { role: 'ai', text: `Sistem aktif. Ben Dr. Context, medikal asistanınızım. ${userName}, bugün hangi şikayetiniz için buradasınız?` }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMode, setVoiceMode] = useState(true); // Varsayılan: sesli mod
  const [showTranscript, setShowTranscript] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState('Konuşmak için mikrofona basın');
  const [gender, setGender] = useState('female'); // Varsayılan cinsiyet
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const voiceModeRef = useRef(voiceMode);

  // Cinsiyet değiştiğinde Voice API'yi güncelle
  useEffect(() => {
    Voice.setGender(gender);
  }, [gender]);

  useEffect(() => {
    voiceModeRef.current = voiceMode;
  }, [voiceMode]);

  // Global Action Listener
  useEffect(() => {
    const handleAction = (event) => {
      const { type, data, target, emotion } = event.detail;

      switch (type) {
        case 'INITIALIZE_SCENE':
          console.log(`UI: Sahne Başlatılıyor...`);
          setSceneConfig({ lights: true, camera_y: 0.2, avatar_y: -0.2 });
          break;
        case 'OPEN_PANEL':
          console.log(`UI: Vurgulanacak Panel -> ${target}`);
          break;
        case 'ANALYZE_VITAL':
          console.log(`UI: Analiz Edilen Değer -> ${target}`);
          break;
        case 'UPDATE_STATS':
          if (data) setVitals(prev => ({ ...prev, ...data }));
          break;
        case 'NAVIGATE':
          console.log("Navigating to:", data?.target || target);
          break;
        case 'UI_EVENT':
          if (data?.type === 'OPEN_MODAL') alert(`Opening Modal: ${data.target}`);
          break;
        default:
          console.log("Unknown action type:", type);
      }
    };

    document.addEventListener('kiosk:action', handleAction);

    // Sağ tık engelleme
    const preventContext = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventContext);

    return () => {
      document.removeEventListener('kiosk:action', handleAction);
      document.removeEventListener('contextmenu', preventContext);
      IdleManager.stop();
    };
  }, []);

  // Kullanıcı değiştiğinde Prompt'u güncelle ve IdleManager'ı kur
  useEffect(() => {
    // Prompt'ta ismi güncelle
    Brain.systemPrompt = Brain.systemPrompt.replace(/Ziyaretçi \(Hasta\)/g, userName);

    // Idle Management (Kullanıcı etkileşimsiz kalırsa)
    IdleManager.init(() => {
      if (onLogout) {
        onLogout(); // Çıkış yap (Login ekranına dön)
      } else {
        window.location.reload();
      }
      Brain.history = []; // Geçmişi temizle
    });

    return () => IdleManager.stop();
  }, [userName, onLogout]);


  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  // --- Sesli Mod: Speech Recognition ---
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus('❌ Tarayıcınız mikrofonu desteklemiyor!');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceStatus('🎤 Dinliyorum...');
    };

    recognition.onresult = async (event) => {
      const transcript = event.results[0][0].transcript;
      console.log('🎙️ Tanınan ses:', transcript);
      setVoiceStatus(`Anladım: "${transcript}"`);
      setIsListening(false);

      // Transcript'e ekle
      setChatHistory(prev => [...prev, { role: 'user', text: transcript }]);
      setIsTyping(true);
      setVoiceStatus('💭 Dr. Context düşünüyor...');

      try {
        const rawResponse = await Brain.sendMessage(transcript, () => {
          // AI konuşmayı bitirdiğinde otomatik dinlemeyi başlat
          if (voiceModeRef.current) {
            setTimeout(() => {
              if (voiceModeRef.current) {
                startListening();
              }
            }, 300); // UI'ın güncellenmesi için küçük bir bekleme
          } else {
            setVoiceStatus('Konuşmak için mikrofona basın');
          }
        });
        const cleanText = ActionManager.processResponse(rawResponse);
        setChatHistory(prev => [...prev, { role: 'ai', text: cleanText }]);
        setVoiceStatus('Sesli yanıt veriliyor...');
      } catch (err) {
        console.error('Sesli mod hatası:', err);
        setVoiceStatus('Hata oluştu. Tekrar deneyin.');
      } finally {
        setIsTyping(false);
      }
    };

    recognition.onerror = (e) => {
      console.error('STT Hatası:', e.error);
      setIsListening(false);
      if (e.error === 'not-allowed') {
        setVoiceStatus('❌ Mikrofon izni reddedildi!');
      } else {
        setVoiceStatus('Hata oluştu. Tekrar deneyin.');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    setVoiceStatus('Konuşmak için mikrofona basın');
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const userMessage = inputValue;
    setChatHistory(prev => [...prev, { role: 'user', text: userMessage }]);
    setInputValue("");
    setIsTyping(true);
    try {
      const rawResponse = await Brain.sendMessage(userMessage);
      console.log('Raw AI Response:', rawResponse);
      const cleanText = ActionManager.processResponse(rawResponse);
      setChatHistory(prev => [...prev, { role: 'ai', text: cleanText }]);
    } catch (err) {
      console.error('handleSendMessage HATA:', err);
      setChatHistory(prev => [...prev, { role: 'ai', text: 'Üzgünüm, bir hata oluştu. Lütfen tekrar deneyin.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="relative w-screen h-screen bg-[#ffffff] overflow-hidden font-['Inter'] text-[#18181b] flex flex-col">
      {/* Arkaplan Grid Deseni - Daha ince ve profesyonel */}
      <div
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#003CBD 1px, transparent 1px), linear-gradient(90deg, #003CBD 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* Üst Header - Desktop Genişliği */}
      <header className="h-24 px-12 flex items-center justify-between bg-white border-b border-[#e5e7eb] z-30 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-12 h-12 bg-[#003CBD] rounded-xl flex items-center justify-center shadow-lg shadow-[#003CBD]/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter text-[#003CBD] leading-none">
              CONTEXT-MEDKIOSK
            </h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#71717a] mt-1 font-bold">
              Otonom Medikal Kiosk Asistanı
            </p>
          </div>
        </div>

        {/* System Monitoring */}
        <div className="flex items-center gap-8">
          <div className="h-12 w-[1px] bg-[#e5e7eb]" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-[#71717a] font-bold">Konum</span>
            <span className="text-sm font-semibold">Ana Hol - İstasyon A1</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-widest text-[#71717a] font-bold">Durum</span>
            <span className="text-sm font-bold text-[#19C480] flex items-center gap-2">
              <span className="w-2 h-2 bg-[#19C480] rounded-full animate-pulse"></span>
              AKTİF
            </span>
          </div>
        </div>
      </header>

      {/* Main Cockpit Layout (Grid) */}
      <main className="flex-1 grid grid-cols-[1fr_3fr_1fr] gap-0 relative overflow-hidden">

        {/* SOL PANEL: Vital Signs & Diagnostic Data (20%) */}
        <aside className="p-8 bg-white/50 backdrop-blur-md border-r border-[#e5e7eb] flex flex-col gap-6 z-20 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#71717a]">Tanı Merkezi</h3>
            <span className="px-2 py-0.5 bg-[#EBF7F2] text-[#0A7C5C] text-[10px] font-bold rounded-full">CANLI</span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <StatCard label="Nabız" value={vitals.hr} unit="BPM" trend="stabil" color="#003CBD" icon="pulse" />
            <StatCard label="Vücut Isısı" value={vitals.temp} unit="°C" trend="stabil" color="#19C480" icon="temp" />
            <StatCard label="Kan Basıncı" value={vitals.bp} unit="mmHg" trend="düşük" color="#003CBD" icon="bp" />
            <StatCard label="SpO2" value={vitals.spo2} unit="%" trend="yüksek" color="#19C480" icon="o2" />
          </div>

          <div className="mt-auto p-4 bg-[#f5f6f9] rounded-xl border border-[#e5e7eb]">
            <p className="text-[10px] text-[#71717a] font-bold uppercase mb-2">Hasta Güvenliği</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-[#19C480]">
                <AlertCircle size={16} strokeWidth={2.5} />
              </div>
              <span className="text-xs font-semibold text-[#18181b]">HIPAA Uyumlu Oturum</span>
            </div>
          </div>
        </aside>

        {/* MERKEZİ ALAN: 3D Avatar (60%) */}
        <section className="relative flex flex-col items-center justify-center bg-[#fcfdfe]">
          {/* Avatar Area Depth Shadow */}
          <div className="absolute inset-0 bg-radial-gradient from-transparent via-transparent to-[#003CBD]/5 pointer-events-none" />

          <div
            id="avatar-container"
            className="w-full h-full relative z-10 flex items-center justify-center"
            style={{ minHeight: '600px' }}
          >
            {/* R3F Canvas - Performance Protocol: frameloop="demand" */}
            <AvatarWidget>
              <div style={{
                position: 'absolute',
                top: '96px', // Header height
                left: '20%', // Sidebar width
                width: '60%', // Central section width
                height: 'calc(100% - 96px)',
                pointerEvents: 'none'
              }}>
                <ErrorBoundary>
                    <Canvas
                      frameloop="always"
                      shadows
                      camera={{ position: [0, sceneConfig.camera_y, 2.5], fov: 35 }}
                      gl={{ antialias: true, stencil: false, depth: true, preserveDrawingBuffer: true }}
                      style={{ pointerEvents: 'auto' }}
                    >
                    <Suspense fallback={null}>
                      <Avatar position={[0, sceneConfig.avatar_y, 0]} gender={gender} />
                    </Suspense>
                    {sceneConfig.lights ? (
                      <>
                        <ambientLight intensity={0.8} />
                        <pointLight position={[10, 10, 10]} intensity={1.5} />
                        <directionalLight position={[-5, 5, 5]} intensity={1.0} color="#ffffff" />
                      </>
                    ) : (
                      <>
                        <ambientLight intensity={0.3} />
                        <pointLight position={[10, 10, 10]} intensity={0.5} />
                      </>
                    )}
                  </Canvas>
                </ErrorBoundary>
              </div>
            </AvatarWidget>

            {/* Placeholder / Loading State for fallback */}
            <div className="absolute inset-0 flex flex-col items-center justify-center opacity-5 pointer-events-none">
              <div className="w-64 h-64 border-4 border-dashed border-[#003CBD] rounded-full animate-spin-slow" />
            </div>
          </div>

          {/* Chat Interface - Floating at Bottom Center */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 w-[800px] z-30">

            {/* === TRANSCRIPT PANELİ (Yumuşak animasyonlu) === */}
            <div 
              className={`absolute bottom-full mb-4 left-0 right-0 bg-white/95 backdrop-blur-3xl rounded-3xl border border-white shadow-[0_32px_64px_-16px_rgba(0,60,189,0.25)] overflow-hidden transition-all duration-300 ease-out origin-bottom ${
                showTranscript ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
              }`}
              style={{ maxHeight: '320px' }}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
                  <span className="text-xs font-black uppercase tracking-widest text-[#71717a]">Konuşma Geçmişi</span>
                  <button onClick={() => setShowTranscript(false)} className="p-1.5 rounded-lg hover:bg-[#f5f6f9] text-[#71717a]">
                    <X size={16} />
                  </button>
                </div>
                <div className="overflow-y-auto p-6 space-y-4" style={{ maxHeight: '260px' }}>
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${msg.role === 'user' ? 'bg-[#19C480]' : 'bg-[#003CBD]'}`}>
                        {msg.role === 'user' ? 'S' : 'AI'}
                      </div>
                      <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                        <p className={`text-[9px] font-black uppercase mb-1 ${msg.role === 'user' ? 'text-[#19C480]' : 'text-[#003CBD]'}`}>
                          {msg.role === 'user' ? userName : 'Dr. Context'}
                        </p>
                        <p className="text-sm text-[#18181b] leading-relaxed bg-[#f5f6f9] rounded-2xl px-4 py-2 inline-block max-w-[85%] text-left">
                          {msg.text}
                        </p>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-[#003CBD]/20" />
                      <div className="h-8 w-28 bg-[#003CBD]/10 rounded-2xl" />
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
            </div>

            <div className="bg-white/85 backdrop-blur-3xl rounded-3xl border border-white shadow-[0_32px_64px_-16px_rgba(0,60,189,0.2)] overflow-hidden">

              {/* === SESLİ MOD === */}
              {voiceMode ? (
                <div className="p-6 flex items-center gap-6">
                  {/* Mikrofon Butonu */}
                  <div className="relative shrink-0">
                    {isListening && (
                      <>
                        <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping scale-150" />
                        <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping scale-125" style={{ animationDelay: '0.15s' }} />
                      </>
                    )}
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isTyping}
                      className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-95
                        ${isListening
                          ? 'bg-red-500 shadow-red-500/40 scale-110'
                          : isTyping
                            ? 'bg-[#71717a] cursor-not-allowed'
                            : 'bg-[#003CBD] shadow-[#003CBD]/30 hover:scale-105'
                        }`}
                    >
                      {isListening
                        ? <MicOff size={32} className="text-white" />
                        : <Mic size={32} className="text-white" />
                      }
                    </button>
                  </div>

                  {/* Durum Metni */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#71717a] mb-1">Sesli Asistan</p>
                    <p className={`text-lg font-semibold truncate ${isListening ? 'text-red-500' : isTyping ? 'text-[#003CBD]' : 'text-[#18181b]'}`}>
                      {voiceStatus}
                    </p>
                    {isListening && (
                      <div className="flex gap-0.5 mt-2">
                        {[...Array(12)].map((_, i) => (
                          <div key={i} className="w-1.5 bg-red-400 rounded-full animate-pulse"
                            style={{ height: `${8 + Math.random() * 20}px`, animationDelay: `${i * 0.08}s` }} />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sağ Butonlar */}
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Transcript Butonu */}
                    <button
                      onClick={() => setShowTranscript(!showTranscript)}
                      className={`p-3 rounded-2xl border flex items-center gap-2 transition-all hover:scale-105 active:scale-95 relative
                        ${showTranscript ? 'bg-[#003CBD] border-[#003CBD] text-white' : 'bg-white border-[#e5e7eb] text-[#71717a] hover:border-[#003CBD]/30'}`}
                    >
                      <MessageSquare size={20} />
                      {chatHistory.length > 1 && (
                        <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-[#19C480] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                          {chatHistory.length}
                        </span>
                      )}
                    </button>
                    {/* Yazı Modu Geç */}
                    <button
                      onClick={() => setVoiceMode(false)}
                      className="p-3 rounded-2xl border border-[#e5e7eb] bg-white text-[#71717a] hover:border-[#003CBD]/30 transition-all hover:scale-105 active:scale-95"
                      title="Yazarak devam et"
                    >
                      <ChevronDown size={20} />
                    </button>
                  </div>
                </div>
              ) : (
                /* === YAZI MODU === */
                <>
                  <div className="max-h-[180px] overflow-y-auto p-6 space-y-4" id="chat-history">
                    {chatHistory.map((msg, i) => (
                      <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${msg.role === 'user' ? 'bg-[#19C480]' : 'bg-[#003CBD]'}`}>
                          {msg.role === 'user' ? 'U' : 'AI'}
                        </div>
                        <div className={`space-y-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                          <p className={`text-[10px] font-bold uppercase ${msg.role === 'user' ? 'text-[#19C480]' : 'text-[#003CBD]'}`}>
                            {msg.role === 'user' ? 'Hasta' : 'Asistan'}
                          </p>
                          <p className="text-base text-[#18181b] leading-relaxed">{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {isTyping && (
                      <div className="flex gap-4 animate-pulse">
                        <div className="w-10 h-10 rounded-full bg-[#003CBD]/20" />
                        <div className="h-10 w-32 bg-[#003CBD]/10 rounded-2xl" />
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="p-4 bg-white/50 border-t border-[#e5e7eb] flex items-center gap-3">
                    {/* Sesli Mod'a geri dön */}
                    <button
                      onClick={() => setVoiceMode(true)}
                      className="h-16 w-16 rounded-2xl bg-[#f5f6f9] border border-[#e5e7eb] text-[#71717a] flex items-center justify-center hover:bg-[#003CBD]/10 hover:border-[#003CBD]/30 transition-all shrink-0"
                      title="Sesli moda geç"
                    >
                      <Mic size={24} />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Şikayetinizi yazın..."
                        className="w-full bg-white border border-[#e5e7eb] focus:border-[#003CBD] focus:ring-4 focus:ring-[#003CBD]/10 rounded-2xl px-6 py-5 text-lg outline-none transition-all min-h-[64px]"
                      />
                    </div>
                    <button
                      onClick={handleSendMessage}
                      className="h-16 w-16 rounded-2xl bg-[#003CBD] text-white flex items-center justify-center shadow-lg shadow-[#003CBD]/30 hover:scale-105 active:scale-95 transition-all shrink-0"
                    >
                      <Send size={28} strokeWidth={2.5} className="ml-1" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>

        {/* SAĞ PANEL: Insights & Controls (20%) */}
        <aside className="p-8 bg-white/50 backdrop-blur-md border-l border-[#e5e7eb] flex flex-col gap-8 z-20 overflow-y-auto">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#71717a] mb-6">Yapay Zeka Analizi</h3>
            <div className="space-y-4">
              <InsightCard title="Bulgu Analizi" status="Normal" content="Tüm hayati değerler referans aralığında seyrediyor." />
              <InsightCard title="Risk Değerlendirmesi" status="Düşük" content="Kardiyovasküler risk faktörleri minimum düzeyde." />
            </div>
          </div>

          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-[#71717a] mb-6">Sistem Kontrolleri</h3>
            <div className="grid grid-cols-2 gap-3">
              <ControlButton label="Acil Çağrı" icon="alert" danger onClick={() => ActionManager.dispatch({ action: 'UI_EVENT', data: { type: 'OPEN_MODAL', target: 'Emergency' } })} />
              <ControlButton label="Çıkış" icon="reset" onClick={() => { if(onLogout) onLogout(); else window.location.reload(); }} />
              <ControlButton label="Dil" icon="globe" onClick={() => alert("Dil seçenekleri modalı açıldı")} />
              <ControlButton 
                label={gender === 'female' ? "Kadın Asistan" : "Erkek Asistan"} 
                icon="user" 
                onClick={() => setGender(g => g === 'female' ? 'male' : 'female')} 
              />
            </div>
          </div>
        </aside>

      </main>

      {/* Full-screen children (Modals, Portals) */}
      {children}

      <style dangerouslySetInnerHTML={{
        __html: `
        html, body {
          overscroll-behavior: none;
          touch-action: manipulation;
          -webkit-user-select: none;
          user-select: none;
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
        .bg-radial-gradient {
          background-image: radial-gradient(circle at center, var(--tw-gradient-from), var(--tw-gradient-to));
        }
      `}} />
    </div>
  );
};

const StatCard = ({ label, value, unit, trend, color, icon }) => (
  <div className="p-5 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm hover:border-[#003CBD]/30 transition-all group">
    <div className="flex justify-between items-start mb-3">
      <span className="text-[10px] font-black text-[#71717a] uppercase tracking-tighter">{label}</span>
      <div className="p-1.5 rounded-lg bg-[#f5f6f9] group-hover:bg-[#003CBD]/10 transition-colors">
        <div style={{ color }}>
          {icon === 'pulse' && <Activity size={16} strokeWidth={2.5} />}
          {icon === 'temp' && <Thermometer size={16} strokeWidth={2.5} />}
          {icon === 'bp' && <Heart size={16} strokeWidth={2.5} />}
          {icon === 'o2' && <Wind size={16} strokeWidth={2.5} />}
        </div>
      </div>
    </div>
    <div className="flex items-baseline gap-1.5">
      <span className="text-2xl font-black tabular-nums" style={{ color }}>{value}</span>
      <span className="text-[10px] font-bold text-[#71717a]">{unit}</span>
    </div>
    <div className="mt-3 flex items-center gap-2">
      <div className="flex-1 h-1 bg-[#f5f6f9] rounded-full overflow-hidden">
        <div className="h-full bg-current opacity-40 rounded-full" style={{ width: '65%', color }} />
      </div>
      <span className={`text-[9px] font-black uppercase ${trend === 'stabil' ? 'text-[#19C480]' : trend === 'düşük' ? 'text-[#003CBD]' : 'text-orange-500'}`}>
        {trend}
      </span>
    </div>
  </div>
);

const InsightCard = ({ title, status, content }) => (
  <div className="p-4 bg-[#EBF2FF] rounded-2xl border border-[#003CBD]/10">
    <div className="flex justify-between items-center mb-2">
      <span className="text-[10px] font-black text-[#003CBD] uppercase">{title}</span>
      <span className="px-2 py-0.5 bg-white/50 text-[9px] font-bold rounded-md">{status}</span>
    </div>
    <p className="text-xs text-[#1E3A8A] font-medium leading-relaxed">{content}</p>
  </div>
);

const ControlButton = ({ label, icon, danger, onClick }) => (
  <button
    onClick={onClick}
    className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all hover:scale-105 active:scale-95 ${danger ? 'bg-red-50 border-red-100 text-red-600' : 'bg-white border-[#e5e7eb] text-[#18181b]'}`}
  >
    <div className="w-6 h-6 flex items-center justify-center opacity-80">
      {icon === 'alert' && <AlertCircle size={20} strokeWidth={2.5} />}
      {icon === 'reset' && <RotateCcw size={20} strokeWidth={2.5} />}
      {icon === 'globe' && <Globe size={20} strokeWidth={2.5} />}
      {icon === 'help' && <HelpCircle size={20} strokeWidth={2.5} />}
      {icon === 'user' && <User size={20} strokeWidth={2.5} />}
    </div>
    <span className="text-[10px] font-black uppercase tracking-tighter">{label}</span>
  </button>
);

export default KioskFrame;

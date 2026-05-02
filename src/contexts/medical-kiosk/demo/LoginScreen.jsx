import React, { useState } from 'react';
import { Activity, ShieldCheck, ChevronRight } from 'lucide-react';

const LoginScreen = ({ onLogin }) => {
  const [userNameInput, setUserNameInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleScan = (e) => {
    e.preventDefault();
    if (userNameInput.trim().length < 2) {
      setError('Lütfen geçerli bir isim girin.');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate Login processing
    setTimeout(() => {
      onLogin(userNameInput.trim());
    }, 800);
  };

  return (
    <div className="w-screen h-screen bg-[#ffffff] font-['Inter'] flex overflow-hidden">
      {/* Sol Taraf: Görsel ve Marka */}
      <div className="w-1/2 relative bg-[#003CBD] flex flex-col justify-between p-16 text-white overflow-hidden">
        {/* Dekoratif Arka Plan Desenleri */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_1px,transparent_1px)] bg-[length:24px_24px]" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3" />
        
        <div className="relative z-10">
          <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
            <Activity size={32} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter leading-tight mb-4">
            Geleceğin <br/> Sağlık Deneyimi
          </h1>
          <p className="text-white/70 text-lg max-w-md">
            Yapay zeka destekli otonom asistanınız "Dr. Context" ile check-in işlemlerinizi saniyeler içinde tamamlayın.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-white/50 text-sm font-medium">
          <ShieldCheck size={20} />
          <span>KVKK ve HIPAA uyumlu, uçtan uca şifreli oturum.</span>
        </div>
      </div>

      {/* Sağ Taraf: Login Formu */}
      <div className="w-1/2 bg-[#fcfdfe] flex items-center justify-center p-16 relative">
        <div className="w-full max-w-md">
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-[#18181b] tracking-tight mb-2">Hoş Geldiniz</h2>
            <p className="text-[#71717a] font-medium">Lütfen kimlik doğrulaması için bilgilerinizi girin veya kartınızı okutun.</p>
          </div>

          <form onSubmit={handleScan} className="space-y-6">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-[#71717a] mb-2 ml-1">
                İsim Soyisim
              </label>
              <input
                type="text"
                value={userNameInput}
                onChange={(e) => setUserNameInput(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                className="w-full px-6 py-4 bg-white border border-[#e5e7eb] rounded-2xl text-lg font-medium text-[#18181b] focus:outline-none focus:border-[#003CBD] focus:ring-4 focus:ring-[#003CBD]/10 transition-all placeholder:text-[#a1a1aa]"
                autoFocus
              />
              {error && <p className="text-red-500 text-sm mt-2 ml-1 font-medium">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-16 bg-[#003CBD] text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-[#002b8a] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:hover:scale-100 shadow-xl shadow-[#003CBD]/20"
            >
              {isLoading ? (
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sisteme Giriş Yap
                  <ChevronRight size={20} strokeWidth={3} />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-8 flex items-center justify-center gap-4 opacity-50">
            <div className="w-12 h-px bg-[#71717a]" />
            <span className="text-[10px] font-black uppercase tracking-widest text-[#71717a]">veya</span>
            <div className="w-12 h-px bg-[#71717a]" />
          </div>
          
          <div className="mt-8 text-center animate-pulse">
            <p className="text-sm font-bold text-[#003CBD]">Kiosk Kartınızı Okuyucuya Yaklaştırın</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;

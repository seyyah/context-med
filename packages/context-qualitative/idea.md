Med-AgentLab: Dağıtık Yapay Zeka Ajanları İçin Maliyet-Etkin MapReduce Orkestrasyon Altyapısı

Bu belge IDEA (Idea Definition for Engineering Artifacts) standardını takip etmektedir. Med-AgentLab, donanım kısıtlı ortamlarda (4GB VRAM) büyük ölçekli ve hassas veri setlerini işlemek üzere tasarlanmış, asenkron bir çoklu-ajan orkestrasyon framework'üdür.

1. Temel Tez ve Mühendislik Kimliği (The Thesis)

Bu projenin birincil mühendislik katkısı; heterojen modellerden oluşan bir ajan filosunu, asenkron bir MapReduce boru hattında, düşük donanım kaynaklarıyla koordine edebilen bir orkestrasyon katmanı inşa etmektir. Tıp dikeyindeki nitel veri analizi, bu altyapının "yüksek gizlilik", "bağlam yönetimi" ve "doğrulama (validation) disiplini" yeteneklerini kanıtlamak için seçilmiş en yüksek standartlı uygulama (benchmark) alanıdır. Proje, "zekanın tekil devasa modellerde değil, rasyonel ve dağıtık mimarilerde olduğunu" savunur.

2. Problem Analizi ve Stratejik İhtiyaç

Bağlam Parçalanması (Context Fragmentation): Uzun hasta mülakatları veya klinik notlar tekil LLM'lere yüklendiğinde "bağlam penceresi çöküşü" ve bilgi kaybı yaşanır. Mevcut RAG sistemleri ise nitel analizin gerektirdiği "bütüncül tematik akışı" yakalamakta yetersiz kalır.
Maliyet ve Erişim Tekeli: Nitel veri analizi için kullanılan profesyonel araçlar (MAXQDA vb.) yüksek lisans maliyetlerine sahiptir. Öte yandan, hassas verilerin doğrudan genel bulut API'lerine (GPT-4) gönderilmesi KVKK/HIPAA açısından kabul edilemez bir risk teşkil eder.
Doğrulanmayan "Slop" Enflasyonu: Denetlenmeyen AI çıktıları akademik geçerliliği yok eder. Mevcut sistemlerde "halüsinasyon" sadece bir hata olarak görülürken, Med-AgentLab'de halüsinasyon, sistemin operasyonel metrikleriyle (precision/recall) denetlenen bir unsurdur.

3. Mimari Katmanlar ve İş Akış Kontratları (Pipeline Contracts)

Katman
İşlev
Girdi (Input)
Çıktı (Output)
Birincil Model
 
1. Ingestion

Dynamic Chunking
Ham Klinik Metin
%15 Örtüşen Chunklar
Python / Asyncio

2. Privacy Guard

Yerel Redaksiyon
Hassas Verili Metin
PII-Redacted Metin
Ollama (Local)

3. Map Phase

Tematik Extraction
Maskelenmiş Metin
Tema Listesi (JSON)
Groq (Llama-3-70B)

4. Validation

RAG & Verification
Ham Temalar
Filtrelenmiş Temalar
Gemini 1.5 Flash

5. Reduce Phase

Akademik Sentez
Doğrulanmış Temalar
Final Raporu
GPT-4o-mini

4. Teknik Spesifikasyonlar ve Metodolojik Derinlik

4.1. Nitel Analiz Metodolojisi

Sistem, akademik nitel araştırmalarda kullanılan "Tematik Analiz" (Thematic Analysis) metodolojisini simüle eder. Ajanlar, veriyi sadece özetlemez; "anlam kodları" üretir ve bu kodları Master Reducer aşamasında hiyerarşik bir tema ağacına (codebook) dönüştürür.

4.2. Bağlam Koruma (Sliding Window Chunking)

Metinler parçalanırken 3000 tokenlik pencereler ve 450 tokenlik (%15) örtüşme (overlap) kullanılır.
Neden: Bir paragrafın veya mülakat sorusunun tam ortadan bölünmesi durumunda oluşacak anlam kaybını ve dolayısıyla "false negative" tema çıkarımını engellemek.

4.3. Yerel Gizlilik Denetimi (PII Redaction)

Bulut API'lerine veri çıkmadan önce Ollama tabanlı yerel model metni tarar.
Hedef Metrik: Türkçe tıbbi metinlerde PII (İsim, TC, Adres, Tanı) tespiti için Recall ≥ 0.95.
Risk Yönetimi: Yerel modelin kaçırdığı veriler için ikincil bir regex tabanlı "Pattern Guard" katmanı uygulanır.

4.4. Tıbbi Doğrulama (The Validator) Mekanizması

Bu katman, sistemin sıradan bir MapReduce wrapper'ı olmadığını kanıtlayan "akıllı denetçi"dir.
Çalışma Prensibi: Çıkarılan her bir tema/kod, PubMed ve tıp ontolojileri (MeSH) üzerinde koşan bir RAG (Retrieval-Augmented Generation) ajanı tarafından sorgulanır.
Karar: Eğer AI tarafından çıkarılan bir semptom-ilişki tıp literatüründe karşılık bulmuyorsa, sistem bunu "Potansiyel Halüsinasyon" olarak işaretler ve sentez raporuna dahil etmez.

5. Ölçülebilir Başarı Kriterleri (Evaluation & Ratchet)

Thematic Recall: AI tarafından yakalanan temaların, uzman bir akademisyen tarafından manuel kodlanan metne oranı (Hedef: F1-Score ≥ 0.85).
Privacy Precision: Redaksiyon sırasında tıbbi terimlerin yanlışlıkla "gizli veri" olarak maskelenme oranı (Hedef: Precision ≥ 0.90).
Maliyet-Etkinlik: Aynı hacimdeki verinin GPT-4 tekil çağrısı ile işlenmesine kıyasla sağlanan tasarruf (Hedef: %70+ tasarruf).

6. Operasyonel Riskler ve Mitigasyon (What Might Fail)

Risk: Rate-Limiting (429 Hatası): Onlarca ajanın aynı anda API çağrısı yapması sistemin kilitlenmesine yol açabilir.
Çözüm: Tenacity kütüphanesi ile "Exponential Backoff" ve asenkron kuyruk yönetimi (semaphore) uygulanacaktır.
Risk: Metadata Sızıntısı: Maskelenmiş metinlerin içinde dolaylı kimlik bilgilerinin (contextual PII) kalması.
Çözüm: Redaksiyon sonrası entropi tabanlı veri sızıntı testleri uygulanacaktır.

7. Yol Haritası ve SDLC Fazları (Roadmap)

Faz 1 (Altyapı): asyncio ve LiteLLM tabanlı temel MapReduce motorunun inşası.

Faz 2 (Güvenlik): Yerel redaksiyon katmanının Türkçe tıbbi PII benchmark testleri.

Faz 3 (Doğrulama): Tıbbi teyit ajanı için RAG boru hattı ve literatür entegrasyonu.

Faz 4 (Gözlemlenebilirlik): Streamlit üzerinden ajan çalışma durumlarının (observability) ve performans metriklerinin yayına alınması.

Önemli Not: Bu belgede tanımlanan tüm mimari ve hedefler SDLC'nin Tasarım aşamasına aittir. Henüz kodlama aşamasına geçilmemiştir. Kodlama aşaması Google Stitch prototip onayından sonra başlayacaktır.
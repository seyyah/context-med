@echo off
TITLE context-med Kiosk Launcher
echo Starting context-med Otonom 3D Kiosk Assistant...

:: Chrome Kiosk Modu Parametreleri:
:: --kiosk: Tam ekran kiosk modu
:: --use-fake-ui-for-media-stream: Mikrofon iznini otomatik onaylar
:: --noerrdialogs: Hata pencerelerini gizler
:: --incognito: Gizli sekme (çerez temizliği)
:: --disable-pinch: Zoom engelleme

start chrome "http://localhost:3000" --kiosk --use-fake-ui-for-media-stream --noerrdialogs --incognito --disable-pinch --overscroll-history-navigation=0

echo Kiosk mode activated.
pause

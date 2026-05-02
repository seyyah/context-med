/**
 * ActionManager.js - Gemini'den gelen aksiyonları yöneten modül.
 * JSON verilerini ayıklar ve document üzerinden CustomEvent fırlatır.
 */

export const ActionManager = {
  processResponse: (text) => {
    // Metin içindeki JSON bloklarını bul
    try {
      const jsonMatch = text.match(/\{[\s\S]*?\}/);
      if (jsonMatch) {
        const actionData = JSON.parse(jsonMatch[0]);
        
        // Eğer yeni JSON formatı (speech, action, target) kullanılmışsa
        if (actionData.speech !== undefined) {
          ActionManager.dispatch(actionData);
          return actionData.speech;
        }

        // Geriye dönük uyumluluk (eski format: {action: "...", data: {...}})
        ActionManager.dispatch(actionData);
        return text.replace(jsonMatch[0], '').trim();
      }
    } catch (e) {
      console.warn("Action parsing failed:", e);
    }
    return text; // JSON yoksa ham metni döndür
  },

  dispatch: (actionData) => {
    console.log("🚀 Dispatching Action:", actionData);
    
    const event = new CustomEvent('kiosk:action', {
      detail: {
        type: actionData.action, // OPEN_PANEL, ANALYZE_VITAL vb.
        target: actionData.target, // blood_pressure, heart_rate vb.
        emotion: actionData.emotion, // happy, professional vb.
        data: actionData.data, // Geriye dönük eski data objesi uyumluluğu
        timestamp: Date.now()
      }
    });

    document.dispatchEvent(event);
  }
};

export default ActionManager;

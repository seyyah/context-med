import React from 'react';
import { createPortal } from 'react-dom';

/**
 * AvatarWidget - Portal İzolasyonu
 * Avatar bileşenini document.body üzerine taşıyarak ana CSS'den izole eder.
 */
const AvatarWidget = ({ children }) => {
  // SSR kontrolü (Eğer Next.js vb. kullanılırsa)
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div 
      id="avatar-portal-root"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 10 // UI'ın arkasında (Sidebar z-20, Chat z-30) kalması için düşürüldü
      }}
    >
      {children}
    </div>,
    document.body
  );
};

export default AvatarWidget;

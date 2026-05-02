'use client';

import React, { useState } from 'react';
import { ContextMedShell } from '../../src/pixel-office3D/ContextMedShell';

/**
 * Comprehensive Demo Page
 * This demo showcases the ContextMedShell integration.
 */
export default function DemoPage() {
  const [isDemoActive, setIsDemoActive] = useState(true);

  if (!isDemoActive) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h1>Demo Paused</h1>
        <button onClick={() => setIsDemoActive(true)} style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}>
          Resume Demo
        </button>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      {/* Header for the demo */}
      <header style={{ 
        padding: '0.5rem 1rem', 
        background: '#111827', 
        color: 'white', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #374151'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>Context-Med</span>
          <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>Pixel-Office 3D Demo</span>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => alert('Demo control: Sending test event...')} 
            style={{ 
              background: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              padding: '0.3rem 0.8rem', 
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Send Test Event
          </button>
          <button 
            onClick={() => setIsDemoActive(false)} 
            style={{ 
              background: '#ef4444', 
              color: 'white', 
              border: 'none', 
              padding: '0.3rem 0.8rem', 
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}
          >
            Stop Demo
          </button>
        </div>
      </header>

      {/* Main Content: The Shell */}
      <div style={{ flex: 1, position: 'relative' }}>
        <ContextMedShell />
      </div>
    </div>
  );
}

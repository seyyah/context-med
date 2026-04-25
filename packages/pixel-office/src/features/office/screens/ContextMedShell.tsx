"use client";

import { useState } from "react";
import { RetroOffice3D } from "@/features/retro-office/RetroOffice3D";
import { Folder, Plus, CheckCircle, Video, FileText, PieChart, Activity, Briefcase, Mic } from "lucide-react";

export function ContextMedShell() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100%', backgroundColor: '#ffffff', color: '#1f2937', fontFamily: 'sans-serif' }}>
      {/* Top Header */}
      <header style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem 1.5rem', borderBottom: '1px solid #e5e7eb', backgroundColor: '#ffffff' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '0.25rem', backgroundColor: '#16a34a', color: '#ffffff', fontWeight: 'bold' }}>S</div>
        <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold', color: '#1f2937' }}>Studio Agent</h1>
      </header>
      
      {/* 3-Panel Layout */}
      <div style={{ display: 'flex', flexDirection: 'row', flex: 1, overflow: 'hidden', width: '100%', height: '100%', backgroundColor: '#f9fafb' }}>
        
        {/* LEFT PANEL: Kaynaklar */}
        <aside style={{ display: 'flex', flexDirection: 'column', width: '280px', flexShrink: 0, borderRight: '1px solid #e5e7eb', padding: '1rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
            <h2 style={{ margin: 0, fontWeight: 600, color: '#374151' }}>Kaynaklar</h2>
            <button style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', backgroundColor: '#16a34a', color: '#ffffff', padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.875rem', fontWeight: 500, border: 'none', cursor: 'pointer' }}>
              <Plus size={16} />
              Kaynak Ekle
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, textAlign: 'center', opacity: 0.6 }}>
            <Folder size={48} color="#facc15" style={{ marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.875rem', color: '#4b5563', margin: 0 }}>Henüz kaynak yok.<br />Bir dosya yükleyerek başlayın.</p>
          </div>
        </aside>

        {/* CENTER PANEL: Context-Med Chat & 3D Office */}
        <main style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, position: 'relative', backgroundColor: '#000000' }}>
          
          {/* Pixel Office Area (Fills Entire Center Panel) */}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 0 }}>
            <RetroOffice3D agents={[]} readOnly={true} />
          </div>

          {/* Top-Left Badge */}
          <div style={{ position: 'absolute', top: '1rem', left: '1rem', zIndex: 10, backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(4px)', borderRadius: '0.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '0.25rem 0.75rem', fontSize: '0.875rem', fontWeight: 500, color: '#374151', border: '1px solid #e5e7eb' }}>
            Context-Med Karargahı
          </div>
          
          {/* Bottom Chat Overlay */}
          <div style={{ position: 'absolute', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, width: '100%', maxWidth: '48rem', padding: '0 1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', borderRadius: '9999px', padding: '0.5rem 1rem', width: '100%' }}>
              <input type="text" placeholder="Ajanlara veya sisteme soru sorun..." style={{ flex: 1, backgroundColor: 'transparent', border: 'none', outline: 'none', fontSize: '0.875rem', color: '#1f2937' }} />
              <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '2rem', height: '2rem', borderRadius: '9999px', backgroundColor: '#16a34a', color: '#ffffff', border: 'none', cursor: 'pointer', marginLeft: '0.5rem', flexShrink: 0 }}>
                <CheckCircle size={16} />
              </button>
            </div>
          </div>
        </main>

        {/* RIGHT PANEL: Studio Tasks */}
        <aside style={{ display: 'flex', flexDirection: 'column', width: '320px', flexShrink: 0, borderLeft: '1px solid #e5e7eb', padding: '1rem', backgroundColor: '#f9fafb', overflowY: 'auto' }}>
          <h2 style={{ margin: 0, marginBottom: '1rem', fontWeight: 600, color: '#374151' }}>Studio</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {[
              { id: 1, label: "Sesli Özet", icon: <Mic size={20} color="#a855f7" /> },
              { id: 2, label: "Slayt Sunusu", icon: <FileText size={20} color="#3b82f6" /> },
              { id: 3, label: "Video Özeti", icon: <Video size={20} color="#ef4444" />, beta: true },
              { id: 4, label: "İnfografik", icon: <PieChart size={20} color="#f97316" />, beta: true },
              { id: 5, label: "Yönetici Raporu", icon: <Briefcase size={20} color="#6b7280" /> },
              { id: 6, label: "Özet Notlar", icon: <FileText size={20} color="#9ca3af" /> },
              { id: 7, label: "Test", icon: <Activity size={20} color="#fb923c" /> },
              { id: 8, label: "SSS", icon: <CheckCircle size={20} color="#f87171" /> },
              { id: 9, label: "Grafik Özet", icon: <PieChart size={20} color="#60a5fa" />, beta: true },
              { id: 10, label: "Çalışma Kağıdı", icon: <FileText size={20} color="#22c55e" /> },
              { id: 11, label: "Ses Scripti", icon: <Mic size={20} color="#c084fc" /> },
              { id: 12, label: "Öğretim Planı", icon: <Briefcase size={20} color="#ca8a04" /> },
              { id: 13, label: "Karar Kartı", icon: <Activity size={20} color="#ef4444" /> },
              { id: 14, label: "Video Paketi", icon: <Video size={20} color="#ea580c" /> }
            ].map(task => (
              <button key={task.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '0.375rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', cursor: 'pointer', position: 'relative' }}>
                {task.beta && <span style={{ position: 'absolute', top: '0.25rem', right: '0.25rem', fontSize: '10px', backgroundColor: '#ffedd5', color: '#ea580c', padding: '0 0.25rem', borderRadius: '0.25rem', fontWeight: 600 }}>BETA</span>}
                {task.icon}
                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#374151', textAlign: 'center' }}>{task.label}</span>
              </button>
            ))}
          </div>
        </aside>

      </div>
    </div>
  );
}

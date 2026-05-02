"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { RetroOffice3D } from "@/features/retro-office/RetroOffice3D";
import { X, UserPlus, Send, Server, Phone } from "lucide-react";
import type { OfficeAgent } from "@/features/retro-office/core/types";
import {
  createAgentAvatarProfileFromSeed,
  type AgentAvatarProfile,
} from "@/lib/avatars/profile";

/* ─── Types ─────────────────────────────────────── */
type StaffStatus = "active" | "idle" | "busy" | "offline";

type Staff = {
  id: string;
  name: string;
  role: string;
  purpose: string;
  emoji: string;
  creature: string;
  vibe: string;
  responsibilities: string[];
  status: StaffStatus;
  avatarProfile: AgentAvatarProfile;
  color: string;
};

type ChatMsg = {
  id: string;
  from: string;
  to: string;
  text: string;
  ts: string;
};

type Resource = { id: string; name: string; type: string; size: string };

/* ─── Constants ─────────────────────────────────── */
const ROLES = [
  "Araştırma Ajanı", "Analiz Ajanı", "Koordinatör", "QA Ajanı",
  "Veri İşleyici", "Geliştirici", "Sosyal Medya", "Pazarlama",
];
const VIBES = ["Analitik", "Yaratıcı", "Sistematik", "Hızlı", "Detaycı", "Sakin", "Enerjik"];
const CREATURES = ["robot", "ghost", "familiar", "sentinel", "oracle", "specialist"];
const EMOJIS = ["🤖", "🧠", "⚡", "🔬", "🛡️", "🎯", "🔭", "🧬", "🦊", "🐉"];
const STATUSES: StaffStatus[] = ["active", "idle", "busy", "offline"];
const STATUS_COLOR: Record<StaffStatus, string> = {
  active: "#22c55e",
  idle: "#f59e0b",
  busy: "#ef4444",
  offline: "#6b7280",
};
const STAFF_COLORS = [
  "#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444",
  "#10b981", "#ec4899", "#f97316", "#6366f1", "#14b8a6",
];
const DESK_ITEMS = [
  "globe", "books", "coffee", "palette", "camera",
  "waveform", "shield", "fire", "plant", "laptop",
];

const RANDOM_NAMES = [
  "Ara-7", "Nexus", "Vela", "Orionis", "Cygnus", "Lyra", "Draco", "Sigma",
];

const stringToColor = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return "#" + "00000".substring(0, 6 - c.length) + c;
};

const getDeterministicItem = (id: string) => {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = id.charCodeAt(i) + ((hash << 5) - hash);
  return DESK_ITEMS[Math.abs(hash) % DESK_ITEMS.length];
};

/** Map Staff → Claw3D OfficeAgent for 3D scene rendering */
const mapStaffToOfficeAgent = (s: Staff): OfficeAgent => ({
  id: s.id,
  name: s.name,
  subtitle: s.role,
  status: s.status === "active" || s.status === "busy" ? "working" : s.status === "offline" ? "error" : "idle",
  color: s.color || stringToColor(s.id),
  item: getDeterministicItem(s.id),
  // avatarProfile is intentionally omitted to prevent 3D renderer crashes
  avatarProfile: null,
});

const createStaffMember = (overrides: Partial<Staff> & { name: string }): Staff => {
  const id = Math.random().toString(36).slice(2, 9);
  const name = overrides.name || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
  return {
    id,
    name,
    role: overrides.role || ROLES[Math.floor(Math.random() * ROLES.length)],
    purpose: overrides.purpose || "",
    emoji: overrides.emoji || EMOJIS[Math.floor(Math.random() * EMOJIS.length)],
    creature: overrides.creature || CREATURES[Math.floor(Math.random() * CREATURES.length)],
    vibe: overrides.vibe || VIBES[Math.floor(Math.random() * VIBES.length)],
    responsibilities: overrides.responsibilities || [],
    status: overrides.status || "active",
    avatarProfile: overrides.avatarProfile || createAgentAvatarProfileFromSeed(name),
    color: overrides.color || STAFF_COLORS[Math.floor(Math.random() * STAFF_COLORS.length)],
  };
};

const MOCK_RESOURCES: Resource[] = [
  { id: "r1", name: "dataset_q1_2025.csv", type: "CSV", size: "2.4 MB" },
  { id: "r2", name: "medical_guidelines.pdf", type: "PDF", size: "8.1 MB" },
  { id: "r3", name: "agent_config.json", type: "JSON", size: "12 KB" },
];

const MOCK_STAFF: Staff[] = [
  createStaffMember({ name: "Ara-7", role: "Araştırma Ajanı", emoji: "🤖", vibe: "Analitik", creature: "robot", status: "active", purpose: "Veri setlerini analiz eder ve anomali tespit eder." }),
  createStaffMember({ name: "Nexus", role: "Koordinatör", emoji: "⚡", vibe: "Hızlı", creature: "sentinel", status: "busy", purpose: "Ajanlar arası iletişimi yönetir." }),
  createStaffMember({ name: "Vela", role: "QA Ajanı", emoji: "🔬", vibe: "Detaycı", creature: "oracle", status: "idle", purpose: "Test ve kalite kontrol süreçlerini yürütür." }),
];

const MOCK_CHAT: ChatMsg[] = [
  { id: "c1", from: "Ara-7", to: "Nexus", text: "Veri setini analiz ettim, anomali tespit edildi.", ts: "14:32" },
  { id: "c2", from: "Nexus", to: "Ara-7", text: "Hangi modülde? Detay ver.", ts: "14:33" },
  { id: "c3", from: "Vela", to: "Ara-7", text: "QA testleri tamamlandı. Rapor hazır.", ts: "14:35" },
  { id: "c4", from: "Ara-7", to: "Vela", text: "Anormallik skoru %87. Kritik seviye.", ts: "14:36" },
  { id: "c5", from: "Nexus", to: "Genel", text: "Tüm ajanlar toplantı odasına raporlayın.", ts: "14:38" },
];

const MEETING_MOCKUP: { name: string; partner: string; status: StaffStatus }[] = [
  { name: "Ara-7", partner: "Nexus", status: "active" },
  { name: "Nexus", partner: "Ara-7 & Vela", status: "busy" },
  { name: "Vela", partner: "Nexus", status: "idle" },
  { name: "Sigma", partner: "Draco", status: "active" },
  { name: "Draco", partner: "Sigma", status: "idle" },
];

function randomId() {
  return Math.random().toString(36).slice(2, 9);
}

/* ─── Modal Base ─────────────────────────────────── */
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      <div style={{
        background: "linear-gradient(135deg,#0d1117 0%,#161b22 100%)",
        border: "1px solid rgba(99,179,237,0.25)",
        borderRadius: "1rem", width: "min(560px,92vw)", maxHeight: "80vh",
        overflow: "hidden", display: "flex", flexDirection: "column",
        boxShadow: "0 25px 60px rgba(0,0,0,0.6)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 1.5rem", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <span style={{ fontWeight: 700, fontSize: "1.05rem", color: "#e2e8f0", letterSpacing: "0.02em" }}>{title}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: "0.25rem" }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ overflowY: "auto", flex: 1, padding: "1.5rem" }}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Staff Add Modal ────────────────────────────── */
function StaffAddModal({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Staff) => void }) {
  const [name, setName] = useState("");
  const [role, setRole] = useState(ROLES[0]);
  const [purpose, setPurpose] = useState("");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [creature, setCreature] = useState(CREATURES[0]);
  const [vibe, setVibe] = useState(VIBES[0]);
  const [status, setStatus] = useState<StaffStatus>("active");

  const previewProfile = useMemo(
    () => createAgentAvatarProfileFromSeed(name.trim() || "preview"),
    [name],
  );

  const handleAdd = () => {
    const finalName = name.trim() || RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    onAdd(createStaffMember({
      name: finalName,
      role,
      purpose: purpose.trim(),
      emoji,
      creature,
      vibe,
      status,
      avatarProfile: createAgentAvatarProfileFromSeed(finalName),
    }));
    onClose();
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: "#0d1117", border: "1px solid rgba(99,179,237,0.2)",
    borderRadius: "0.5rem", padding: "0.6rem 0.875rem", color: "#e2e8f0",
    fontSize: "0.875rem", outline: "none", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = { color: "#94a3b8", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.08em", marginBottom: "0.4rem", display: "block", textTransform: "uppercase" };

  return (
    <Modal title="Yeni Personel Ekle" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
        {/* Avatar Preview */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.75rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "0.75rem" }}>
          <div style={{ width: "3rem", height: "3rem", borderRadius: "50%", background: `linear-gradient(135deg, ${previewProfile.clothing.topColor}, ${previewProfile.hair.color})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.4rem", border: "2px solid rgba(255,255,255,0.1)" }}>
            {emoji}
          </div>
          <div>
            <div style={{ color: "#e2e8f0", fontWeight: 600, fontSize: "0.9rem" }}>{name.trim() || "Yeni Personel"}</div>
            <div style={{ color: "#64748b", fontSize: "0.75rem" }}>{role} · {creature} · {vibe}</div>
          </div>
        </div>

        <div>
          <label style={labelStyle}>Personel İsmi</label>
          <input style={inputStyle} placeholder="Boş bırakılırsa rastgele atanır..." value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Rol</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={role} onChange={e => setRole(e.target.value)}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Kişilik (Vibe)</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={vibe} onChange={e => setVibe(e.target.value)}>
              {VIBES.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Görev Tanımı (Purpose)</label>
          <input style={inputStyle} placeholder="Bu ajanın temel amacı nedir?" value={purpose} onChange={e => setPurpose(e.target.value)} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
          <div>
            <label style={labelStyle}>Tür (Creature)</label>
            <select style={{ ...inputStyle, cursor: "pointer" }} value={creature} onChange={e => setCreature(e.target.value)}>
              {CREATURES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Emoji</label>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {EMOJIS.map(e => (
                <button key={e} onClick={() => setEmoji(e)} style={{
                  width: "2rem", height: "2rem", borderRadius: "0.4rem", fontSize: "1rem",
                  border: `2px solid ${emoji === e ? "#3b82f6" : "rgba(255,255,255,0.08)"}`,
                  background: emoji === e ? "rgba(59,130,246,0.15)" : "transparent",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                }}>{e}</button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Statü</label>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {STATUSES.map(s => (
              <button key={s} onClick={() => setStatus(s)} style={{
                padding: "0.35rem 0.875rem", borderRadius: "9999px", fontSize: "0.78rem", fontWeight: 600,
                border: `2px solid ${status === s ? STATUS_COLOR[s] : "rgba(255,255,255,0.1)"}`,
                background: status === s ? STATUS_COLOR[s] + "22" : "transparent",
                color: status === s ? STATUS_COLOR[s] : "#94a3b8", cursor: "pointer",
              }}>{s.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <button onClick={handleAdd} style={{
          marginTop: "0.5rem", padding: "0.75rem", borderRadius: "0.5rem",
          background: "linear-gradient(90deg,#3b82f6,#06b6d4)", color: "#fff",
          fontWeight: 700, fontSize: "0.9rem", border: "none", cursor: "pointer",
        }}>Personeli Ekle</button>
      </div>
    </Modal>
  );
}

/* ─── Phone Modal ────────────────────────────────── */
function PhoneModal({ onClose }: { onClose: () => void }) {
  return (
    <Modal title="📞 Telefon Kulübesi" onClose={onClose}>
      <div style={{ color: "#94a3b8", fontSize: "0.875rem" }}>
        <div style={{ background: "rgba(59,130,246,0.08)", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "0.75rem", padding: "1.25rem", marginBottom: "1rem" }}>
          <p style={{ margin: 0, color: "#93c5fd", fontWeight: 600, marginBottom: "0.5rem" }}>🔧 Yakında Aktif</p>
          <p style={{ margin: 0 }}>Telefon kulübesi ajanların sesli iletişim kurabileceği bir nokta olacak. Şu anlık mockup modda.</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {["Ara-7 → Nexus (bağlantı bekleniyor)", "Vela → Draco (çevrimdışı)", "Sigma → Koordinatör (aktif çağrı)"].map((line, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.5rem", padding: "0.5rem 0.75rem", background: "rgba(255,255,255,0.04)", borderRadius: "0.5rem" }}>
              <Phone size={14} color="#60a5fa" />
              <span style={{ color: "#e2e8f0", fontSize: "0.82rem" }}>{line}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Meeting Modal ──────────────────────────────── */
function MeetingModal({ staff, onClose }: { staff: Staff[]; onClose: () => void }) {
  const allMembers = [...MEETING_MOCKUP];
  return (
    <Modal title="👥 Toplantı Masası — Çalışma Sıralaması" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
        {allMembers.map((m, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: "0.875rem",
            padding: "0.75rem 1rem", background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.65rem",
          }}>
            <span style={{ fontWeight: 700, color: "#94a3b8", minWidth: "1.5rem", fontSize: "0.85rem" }}>#{i + 1}</span>
            <span style={{
              width: "0.6rem", height: "0.6rem", borderRadius: "50%",
              background: STATUS_COLOR[m.status], flexShrink: 0,
            }} />
            <span style={{ flex: 1, fontWeight: 600, color: "#e2e8f0", fontSize: "0.9rem" }}>{m.name}</span>
            <span style={{ color: "#64748b", fontSize: "0.8rem" }}>ile çalışıyor:</span>
            <span style={{ color: "#38bdf8", fontSize: "0.82rem", fontWeight: 500 }}>{m.partner}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}

/* ─── Server Modal ───────────────────────────────── */
function ServerModal({ onClose }: { onClose: () => void }) {
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [newName, setNewName] = useState("");

  const addResource = () => {
    if (!newName.trim()) return;
    setResources(r => [...r, { id: randomId(), name: newName.trim(), type: "Dosya", size: "—" }]);
    setNewName("");
  };

  return (
    <Modal title="🖥️ Sunucu Odası — Kaynaklar" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Yeni kaynak adı..."
            style={{ flex: 1, background: "#0d1117", border: "1px solid rgba(99,179,237,0.2)", borderRadius: "0.5rem", padding: "0.55rem 0.75rem", color: "#e2e8f0", fontSize: "0.875rem", outline: "none" }}
            onKeyDown={e => e.key === "Enter" && addResource()}
          />
          <button onClick={addResource} style={{ padding: "0.55rem 1rem", background: "#3b82f6", color: "#fff", borderRadius: "0.5rem", border: "none", cursor: "pointer", fontWeight: 600 }}>Ekle</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          {resources.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 0.875rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "0.6rem" }}>
              <Server size={14} color="#60a5fa" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1, color: "#e2e8f0", fontSize: "0.85rem" }}>{r.name}</span>
              <span style={{ color: "#64748b", fontSize: "0.75rem" }}>{r.type}</span>
              <span style={{ color: "#94a3b8", fontSize: "0.75rem" }}>{r.size}</span>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}

/* ─── Staff Detail Panel ─────────────────────────── */
function StaffDetailPanel({ staff, onClose, onStatusChange, onDelete }: {
  staff: Staff;
  onClose: () => void;
  onStatusChange: (id: string, status: StaffStatus) => void;
  onDelete: (id: string) => void;
}) {
  const s = staff;
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Reset confirm state when staff changes
  const staffId = s.id;
  useState(() => { setConfirmDelete(false); });

  return (
    <div style={{
      position: "fixed", top: "4.5rem", left: "252px", zIndex: 30,
      width: "280px", background: "rgba(13,17,23,0.92)", backdropFilter: "blur(14px)",
      border: "1px solid rgba(99,179,237,0.18)", borderRadius: "0.875rem",
      padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Personel Detayı</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "0.15rem" }}>
          <X size={14} />
        </button>
      </div>

      {/* Avatar & Name */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.6rem", background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)", borderRadius: "0.6rem" }}>
        <div style={{
          width: "2.5rem", height: "2.5rem", borderRadius: "50%",
          background: `linear-gradient(135deg, ${s.avatarProfile.clothing.topColor}, ${s.avatarProfile.hair.color})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.1rem", border: `2px solid ${STATUS_COLOR[s.status]}`, flexShrink: 0,
        }}>{s.emoji}</div>
        <div>
          <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#e2e8f0" }}>{s.name}</div>
          <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>{s.role}</div>
        </div>
      </div>

      {/* Info rows */}
      {s.purpose && (
        <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.5rem" }}>
          <div style={{ fontSize: "0.65rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.2rem" }}>Görev</div>
          <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.4 }}>{s.purpose}</div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
        <div style={{ padding: "0.4rem 0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.4rem" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Tür</div>
          <div style={{ fontSize: "0.78rem", color: "#e2e8f0" }}>{s.creature}</div>
        </div>
        <div style={{ padding: "0.4rem 0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.4rem" }}>
          <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em" }}>Kişilik</div>
          <div style={{ fontSize: "0.78rem", color: "#e2e8f0" }}>{s.vibe}</div>
        </div>
      </div>

      {/* Avatar detail */}
      <div style={{ padding: "0.5rem", background: "rgba(255,255,255,0.03)", borderRadius: "0.5rem" }}>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Avatar Profili</div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { label: "Saç", color: s.avatarProfile.hair.color },
            { label: "Üst", color: s.avatarProfile.clothing.topColor },
            { label: "Alt", color: s.avatarProfile.clothing.bottomColor },
            { label: "Ten", color: s.avatarProfile.body.skinTone },
          ].map(c => (
            <div key={c.label} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              <div style={{ width: "0.7rem", height: "0.7rem", borderRadius: "50%", background: c.color, border: "1px solid rgba(255,255,255,0.15)" }} />
              <span style={{ fontSize: "0.65rem", color: "#94a3b8" }}>{c.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Status change */}
      <div>
        <div style={{ fontSize: "0.6rem", fontWeight: 600, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.3rem" }}>Statü Değiştir</div>
        <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
          {STATUSES.map(st => (
            <button key={st} onClick={() => onStatusChange(s.id, st)} style={{
              padding: "0.25rem 0.6rem", borderRadius: "9999px", fontSize: "0.68rem", fontWeight: 600,
              border: `1.5px solid ${s.status === st ? STATUS_COLOR[st] : "rgba(255,255,255,0.08)"}`,
              background: s.status === st ? STATUS_COLOR[st] + "22" : "transparent",
              color: s.status === st ? STATUS_COLOR[st] : "#64748b", cursor: "pointer",
            }}>{st.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Delete — two-step inline confirmation (no confirm dialog) */}
      {confirmDelete ? (
        <div style={{ display: "flex", gap: "0.4rem" }}>
          <button
            onClick={() => { onDelete(staffId); }}
            style={{
              flex: 1, padding: "0.5rem", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 700,
              background: "rgba(239,68,68,0.25)", border: "1px solid rgba(239,68,68,0.6)",
              color: "#fca5a5", cursor: "pointer",
            }}
          >
            Evet, Sil
          </button>
          <button
            onClick={() => setConfirmDelete(false)}
            style={{
              flex: 1, padding: "0.5rem", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 600,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#94a3b8", cursor: "pointer",
            }}
          >
            Vazgeç
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConfirmDelete(true)}
          style={{
            padding: "0.5rem", borderRadius: "0.5rem", fontSize: "0.78rem", fontWeight: 600,
            background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
            color: "#f87171", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.35rem",
          }}
        >
          <X size={13} /> Personeli Sil
        </button>
      )}
    </div>
  );
}

/* ─── Staff List Sidebar ─────────────────────────── */
function StaffList({ staff, selectedId, onSelect, onAddClick }: {
  staff: Staff[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onAddClick: () => void;
}) {
  return (
    <div style={{
      position: "absolute", top: "4.5rem", left: "1rem", zIndex: 20,
      width: "220px", background: "rgba(13,17,23,0.88)", backdropFilter: "blur(12px)",
      border: "1px solid rgba(99,179,237,0.15)", borderRadius: "0.875rem",
      padding: "0.875rem", display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.25rem" }}>
        <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase" }}>Personeller</span>
        <button onClick={onAddClick} style={{ display: "flex", alignItems: "center", gap: "0.25rem", background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", borderRadius: "0.4rem", padding: "0.25rem 0.5rem", color: "#60a5fa", cursor: "pointer", fontSize: "0.7rem", fontWeight: 600 }}>
          <UserPlus size={12} /> Ekle
        </button>
      </div>
      {staff.map(s => (
        <div
          key={s.id}
          onClick={() => onSelect(selectedId === s.id ? null : s.id)}
          style={{
            display: "flex", alignItems: "center", gap: "0.6rem",
            padding: "0.4rem 0.5rem",
            background: selectedId === s.id ? "rgba(59,130,246,0.12)" : "rgba(255,255,255,0.04)",
            border: selectedId === s.id ? "1px solid rgba(59,130,246,0.25)" : "1px solid transparent",
            borderRadius: "0.5rem", cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ width: "1.6rem", height: "1.6rem", borderRadius: "50%", background: `linear-gradient(135deg, ${s.avatarProfile.clothing.topColor}, ${s.avatarProfile.hair.color})`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", flexShrink: 0, border: `1.5px solid ${STATUS_COLOR[s.status]}` }}>
            {s.emoji}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>{s.role}</div>
          </div>
          <span style={{ width: "0.5rem", height: "0.5rem", borderRadius: "50%", background: STATUS_COLOR[s.status], flexShrink: 0 }} />
        </div>
      ))}
      {staff.length === 0 && <div style={{ color: "#475569", fontSize: "0.78rem", textAlign: "center", padding: "0.5rem" }}>Henüz personel yok</div>}
    </div>
  );
}

/* ─── Chat Panel ─────────────────────────────────── */
function AgentChatOverlay({ staff }: { staff: Staff[] }) {
  const [msgs, setMsgs] = useState<ChatMsg[]>(MOCK_CHAT);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { id: randomId(), from: "Sen", to: "Genel", text: input.trim(), ts: new Date().toLocaleTimeString("tr", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div style={{
      position: "absolute", bottom: "1.5rem", right: "1rem", zIndex: 20,
      width: "320px", display: "flex", flexDirection: "column", gap: "0.5rem",
    }}>
      {/* Conversation area */}
      <div style={{
        background: "rgba(13,17,23,0.72)", backdropFilter: "blur(14px)",
        border: "1px solid rgba(99,179,237,0.15)", borderRadius: "0.875rem",
        padding: "0.875rem", maxHeight: "260px", overflowY: "auto",
        display: "flex", flexDirection: "column", gap: "0.5rem",
      }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>💬 Ajan Konuşmaları</span>
        {msgs.map(m => (
          <div key={m.id} style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ display: "flex", gap: "0.4rem", alignItems: "baseline" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: m.from === "Sen" ? "#38bdf8" : "#a78bfa" }}>{m.from}</span>
                <span style={{ fontSize: "0.65rem", color: "#475569" }}>{m.ts}</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#cbd5e1", lineHeight: 1.4, marginTop: "0.1rem" }}>{m.text}</div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {/* Query input */}
      <div style={{
        display: "flex", alignItems: "center", gap: "0.5rem",
        background: "rgba(13,17,23,0.88)", backdropFilter: "blur(14px)",
        border: "1px solid rgba(99,179,237,0.2)", borderRadius: "9999px",
        padding: "0.5rem 0.75rem",
      }}>
        <input
          value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ajanlara veya sisteme soru sor..."
          style={{ flex: 1, background: "transparent", border: "none", outline: "none", fontSize: "0.82rem", color: "#e2e8f0" }}
        />
        <button onClick={send} style={{ background: "#3b82f6", border: "none", borderRadius: "50%", width: "1.75rem", height: "1.75rem", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
          <Send size={13} color="#fff" />
        </button>
      </div>
    </div>
  );
}


/* ─── Main Shell ─────────────────────────────────── */
export function ContextMedShell() {
  const [staff, setStaff] = useState<Staff[]>(MOCK_STAFF);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showMeeting, setShowMeeting] = useState(false);
  const [showServer, setShowServer] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string | null>(null);

  /** Map all staff members to Claw3D OfficeAgent[] for 3D scene rendering */
  const officeAgents: OfficeAgent[] = useMemo(
    () => staff.map(mapStaffToOfficeAgent),
    [staff],
  );

  const selectedStaff = useMemo(
    () => staff.find(s => s.id === selectedStaffId) ?? null,
    [staff, selectedStaffId],
  );

  const handleStatusChange = (id: string, status: StaffStatus) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, status } : s));
  };

  const handleDelete = (id: string) => {
    setStaff(prev => prev.filter(s => s.id !== id));
    setSelectedStaffId(null);
  };

  return (
    // Outermost: position context for all overlays
    <div style={{ position: "relative", width: "100%", height: "100vh", overflow: "hidden", background: "#000" }}>

      {/* ── 3D Office fills the entire screen ── */}
      {/* avatarProfile=null in mapping prevents 3D renderer crashes; deletion works via sidebar UI */}
      <RetroOffice3D
        agents={officeAgents}
        taskManagerEnabled={false}
        onPhoneBoothClick={() => setShowPhone(true)}
        onServerRackClick={() => setShowServer(true)}
        onStandupStartRequested={() => setShowMeeting(true)}
        onKanbanInteract={() => { /* kanban devre dışı */ }}
        onJukeboxInteract={() => { /* jukebox devre dışı */ }}
        onAgentChatSelect={() => { /* agent chat devre dışı */ }}
      />

      {/* ── Overlay layer: pointer-events:none so clicks pass through to 3D, children opt-in ── */}
      <div style={{ position: "absolute", inset: 0, zIndex: 20, pointerEvents: "none" }}>

        {/* Top bar — pointer-events:auto so buttons work */}
        <header style={{
          position: "absolute", top: 0, left: 0, right: 0,
          display: "flex", alignItems: "center", gap: "0.75rem",
          padding: "0.75rem 1.25rem",
          background: "rgba(13,17,23,0.8)", backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(99,179,237,0.12)",
          pointerEvents: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "2rem", height: "2rem", borderRadius: "0.4rem", background: "linear-gradient(135deg,#3b82f6,#06b6d4)", fontWeight: 800, fontSize: "0.9rem", color: "#fff" }}>C</div>
          <h1 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: "#e2e8f0" }}>Context-Med Karargahı</h1>
          <div style={{ flex: 1 }} />
          {/* Personnel count badge */}
          <div style={{ fontSize: "0.72rem", color: "#94a3b8", fontWeight: 500 }}>
            {staff.filter(s => s.status === "active" || s.status === "busy").length}/{staff.length} aktif
          </div>
          <button onClick={() => setShowAddModal(true)} style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.35)",
            borderRadius: "0.5rem", padding: "0.4rem 0.875rem", color: "#60a5fa",
            fontSize: "0.82rem", fontWeight: 600, cursor: "pointer",
          }}>
            <UserPlus size={15} /> Personel Ekle
          </button>
          <div style={{ display: "flex", gap: "0.35rem" }}>
            {staff.slice(0, 5).map(s => (
              <div key={s.id} title={`${s.name} — ${s.role}`} style={{
                width: "1.85rem", height: "1.85rem", borderRadius: "50%",
                background: `linear-gradient(135deg, ${s.avatarProfile.clothing.topColor}, ${s.avatarProfile.hair.color})`,
                border: `2px solid ${STATUS_COLOR[s.status]}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", cursor: "pointer",
              }} onClick={() => setSelectedStaffId(s.id)}>
                {s.emoji}
              </div>
            ))}
            {staff.length > 5 && (
              <div style={{ width: "1.85rem", height: "1.85rem", borderRadius: "50%", background: "rgba(30,41,59,0.9)", border: "2px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", color: "#94a3b8", cursor: "default" }}>
                +{staff.length - 5}
              </div>
            )}
          </div>
        </header>

        {/* Staff list — pointer-events:auto */}
        <div style={{ pointerEvents: "auto" }}>
          <StaffList
            staff={staff}
            selectedId={selectedStaffId}
            onSelect={setSelectedStaffId}
            onAddClick={() => setShowAddModal(true)}
          />
        </div>

        {/* Staff detail panel — pointer-events:auto */}
        {selectedStaff && (
          <div style={{ pointerEvents: "auto" }}>
            <StaffDetailPanel
              staff={selectedStaff}
              onClose={() => setSelectedStaffId(null)}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          </div>
        )}

        {/* Agent chat — pointer-events:auto */}
        <div style={{ pointerEvents: "auto" }}>
          <AgentChatOverlay staff={staff} />
        </div>

      </div>

      {/* ── Modals (full-screen, must sit above everything) ── */}
      {showAddModal && (
        <StaffAddModal
          onClose={() => setShowAddModal(false)}
          onAdd={s => setStaff(prev => [...prev, s])}
        />
      )}
      {showPhone && <PhoneModal onClose={() => setShowPhone(false)} />}
      {showMeeting && <MeetingModal staff={staff} onClose={() => setShowMeeting(false)} />}
      {showServer && <ServerModal onClose={() => setShowServer(false)} />}
    </div>
  );
}


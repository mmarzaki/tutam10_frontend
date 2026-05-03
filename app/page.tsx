"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface User {
  _id: string;
  name: string;
  email: string;
}

interface Note {
  _id: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  updatedAt: string;
}

const API = process.env.NEXT_PUBLIC_API_URL;

const NOTE_COLORS = [
  "#f5f0e8", "#e8f0e8", "#e8eaf5", "#f5e8e8",
  "#f5f5e8", "#e8f5f5", "#f0e8f5", "#f5ebe8",
];

const apiFetch = async (path: string, options: RequestInit = {}) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> || {}),
  };
  
  const res = await fetch(`${API}${path}`, { 
    ...options, 
    headers, 
    credentials: "include" 
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: "Network error" }));
    throw new Error(err.message || "Request failed");
  }
  return res.json();
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #ddd",
  borderRadius: "8px",
  fontSize: "15px",
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
  color: "#1a1a1a",
  background: "#fff",
};

function AuthPage({ onAuth }: { onAuth: (user: User) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const endpoint = tab === "login" ? "/auth/login" : "/auth/register";
      const body = tab === "login" ? { email, password } : { name, email, password };
      
      const res = await apiFetch(endpoint, {
        method: "POST",
        body: JSON.stringify(body),
      });
      
      onAuth(res.data.user || res.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f0f0f0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        width: "460px",
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      }}>
        <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5" }}>
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex: 1,
              padding: "18px",
              border: "none",
              background: "none",
              cursor: "pointer",
              fontSize: "15px",
              fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "#1a4fa0" : "#888",
              borderBottom: tab === t ? "2px solid #1a4fa0" : "2px solid transparent",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            }}>
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        <div style={{ padding: "36px 40px 40px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "26px", fontWeight: 700, color: "#1a1a1a", textAlign: "center" }}>
            {tab === "login" ? "Welcome back" : "Create account"}
          </h2>
          <p style={{ margin: "0 0 28px", fontSize: "14px", color: "#888", textAlign: "center" }}>
            {tab === "login" ? "Sign in to your account" : "Get started for free"}
          </p>

          {tab === "register" && (
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#444", marginBottom: "6px" }}>NAME</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle} />
            </div>
          )}

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#444", marginBottom: "6px" }}>EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          </div>

          <div style={{ marginBottom: "8px" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#444", marginBottom: "6px" }}>PASSWORD</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
          </div>

          {error && (
            <div style={{ background: "#fff0f0", border: "1px solid #fcc", borderRadius: "6px", padding: "10px 14px", color: "#c00", fontSize: "13px", marginBottom: "16px", marginTop: "10px" }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%",
            padding: "14px",
            background: "#1a4fa0",
            color: "#fff",
            border: "none",
            borderRadius: "30px",
            fontSize: "16px",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.7 : 1,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            marginTop: "20px",
          }}>
            {loading ? "Please wait..." : tab === "login" ? "Sign in" : "Create account"}
          </button>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#666" }}>
            {tab === "login" ? (
              <>Didn't have an account?{" "}
                <span onClick={() => setTab("register")} style={{ color: "#1a4fa0", fontWeight: 600, cursor: "pointer" }}>Create account</span>
              </>
            ) : (
              <>Already have an account?{" "}
                <span onClick={() => setTab("login")} style={{ color: "#1a4fa0", fontWeight: 600, cursor: "pointer" }}>Sign in</span>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function NotesApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<NodeJS.Timeout | null>(null);

  const loadNotes = useCallback(async () => {
    try {
      const res = await apiFetch("/notes");
      setNotes(res.data);
      if (res.data.length > 0) setActiveNote(res.data[0]);
    } catch { }
    setLoading(false);
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const createNote = async () => {
    if (notes.length >= 10) { alert("Maximum 10 notes allowed."); return; }
    try {
      const res = await apiFetch("/notes", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled", content: "" }),
      });
      setNotes((prev) => [res.data, ...prev]);
      setActiveNote(res.data);
    } catch (e: any) { alert(e.message); }
  };

  const deleteNote = async (id: string) => {
    if (!confirm("Delete this note?")) return;
    try {
      await apiFetch(`/notes/${id}`, { method: "DELETE" });
      setNotes((prev) => {
        const remaining = prev.filter((n) => n._id !== id);
        setActiveNote(remaining[0] || null);
        return remaining;
      });
    } catch (e: any) { alert(e.message); }
  };

  const updateActive = (field: "title" | "content", value: string) => {
    if (!activeNote) return;
    const updated = { ...activeNote, [field]: value };
    setActiveNote(updated);
    setNotes((prev) => prev.map((n) => n._id === updated._id ? updated : n));
    setSaved(false);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        await apiFetch(`/notes/${updated._id}`, {
          method: "PUT",
          body: JSON.stringify({ title: updated.title, content: updated.content }),
        });
        setSaved(true);
      } catch { }
    }, 800);
  };

  const setColor = async (note: Note, color: string) => {
    try {
      await apiFetch(`/notes/${note._id}`, { method: "PUT", body: JSON.stringify({ color }) });
      setNotes((prev) => prev.map((n) => n._id === note._id ? { ...n, color } : n));
      if (activeNote?._id === note._id) setActiveNote((prev) => prev ? { ...prev, color } : prev);
    } catch { }
  };

  const togglePin = async (note: Note) => {
    try {
      const res = await apiFetch(`/notes/${note._id}`, {
        method: "PUT",
        body: JSON.stringify({ isPinned: !note.isPinned }),
      });
      setNotes((prev) => {
        const updated = prev.map((n) => n._id === note._id ? res.data : n);
        return [...updated].sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
      });
      if (activeNote?._id === note._id) setActiveNote(res.data);
    } catch { }
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      background: "#1a1a1a",
      overflow: "hidden",
    }}>
      <div style={{
        width: "240px",
        background: "#1a1a1a",
        borderRight: "1px solid #2a2a2a",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}>
        <div style={{
          padding: "18px 16px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #2a2a2a",
        }}>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Notes
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={createNote} title="New note" style={{
              background: "none", border: "none", color: "#888", cursor: "pointer",
              fontSize: "22px", lineHeight: 1, padding: "2px 6px", borderRadius: "6px",
            }}>+</button>
            <button onClick={onLogout} title={`Logout (${user.name})`} style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "#2d4a3e", border: "none", cursor: "pointer",
              color: "#8bc4a0", fontSize: "12px", fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>

        <div style={{ padding: "12px 14px 8px" }}>
          <div style={{ background: "#2d4a3e", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "11px", color: "#6aaa80" }}>Hi, {user.name.split(" ")[0]}!</div>
            <div style={{ fontSize: "10px", color: "#4a7a5a", marginTop: "2px" }}>
              {notes.length}/10 pages used
            </div>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {loading ? (
            <div style={{ padding: "20px 8px", color: "#555", fontSize: "13px" }}>Loading...</div>
          ) : notes.length === 0 ? (
            <div style={{ padding: "20px 8px", color: "#555", fontSize: "13px", lineHeight: 1.5 }}>
              No notes yet.<br />Click + to create one.
            </div>
          ) : (
            notes.map((note) => {
              const isActive = activeNote?._id === note._id;
              return (
                <div
                  key={note._id}
                  onClick={() => setActiveNote(note)}
                  style={{
                    padding: "10px 12px",
                    cursor: "pointer",
                    background: isActive ? note.color : "transparent",
                    borderRadius: "8px",
                    marginBottom: "2px",
                    transition: "background 0.15s",
                    position: "relative",
                  }}
                >
                  {note.isPinned && (
                    <span style={{ position: "absolute", top: "8px", right: "10px", fontSize: "10px", color: isActive ? "#888" : "#555" }}>📌</span>
                  )}
                  <div style={{
                    fontSize: "13px", fontWeight: 600,
                    color: isActive ? "#1a1a1a" : "#ccc",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                    paddingRight: note.isPinned ? "16px" : "0",
                  }}>
                    {note.title || "Untitled"}
                  </div>
                  <div style={{
                    fontSize: "11px", color: isActive ? "#666" : "#555",
                    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: "2px",
                  }}>
                    {note.content?.slice(0, 36) || "No additional text"}
                  </div>
                  <div style={{ fontSize: "10px", color: isActive ? "#999" : "#444", marginTop: "4px" }}>
                    {formatDate(note.updatedAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {activeNote ? (
        <div style={{ flex: 1, background: activeNote.color, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{
            padding: "10px 20px",
            borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.2)",
          }}>
            {NOTE_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(activeNote, c)} style={{
                width: "18px", height: "18px", borderRadius: "50%", background: c,
                border: activeNote.color === c ? "2px solid #333" : "1px solid rgba(0,0,0,0.18)",
                cursor: "pointer", padding: 0, flexShrink: 0,
              }} />
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: "11px", color: "#999" }}>{saved ? "Saved" : "Saving..."}</span>
            <button onClick={() => togglePin(activeNote)} style={{
              background: activeNote.isPinned ? "rgba(0,0,0,0.1)" : "none",
              border: "1px solid rgba(0,0,0,0.12)", borderRadius: "6px",
              padding: "4px 8px", cursor: "pointer", fontSize: "13px", color: "#555",
            }}>
              {activeNote.isPinned ? "📌 Pinned" : "📌 Pin"}
            </button>
            <button onClick={() => deleteNote(activeNote._id)} style={{
              background: "none", border: "1px solid rgba(180,0,0,0.2)",
              borderRadius: "6px", padding: "4px 10px", cursor: "pointer", fontSize: "12px", color: "#c00",
            }}>
              Delete
            </button>
          </div>

          <input
            value={activeNote.title}
            onChange={(e) => updateActive("title", e.target.value)}
            placeholder="Title"
            style={{
              padding: "22px 32px 8px", fontSize: "24px", fontWeight: 700,
              border: "none", background: "transparent", outline: "none",
              color: "#1a1a1a", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              letterSpacing: "-0.02em",
            }}
          />

          <textarea
            value={activeNote.content}
            onChange={(e) => updateActive("content", e.target.value)}
            placeholder="Start writing..."
            style={{
              flex: 1, padding: "4px 32px 32px", fontSize: "15px", lineHeight: 1.75,
              border: "none", background: "transparent", outline: "none", resize: "none",
              color: "#333", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            }}
          />
        </div>
      ) : (
        <div style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          flexDirection: "column", gap: "14px", background: "#1e1e1e",
        }}>
          <div style={{ fontSize: "48px", opacity: 0.3 }}>📝</div>
          <div style={{ fontSize: "15px", color: "#555" }}>Select a note or create a new one</div>
          <button onClick={createNote} style={{
            padding: "10px 22px", background: "#2d4a3e", color: "#8bc4a0",
            border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "14px",
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          }}>
            + New Note
          </button>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiFetch("/auth/me");
        setUser(res.data);
      } catch {
        setUser(null);
      }
      setReady(true);
    };
    checkAuth();
  }, []);

  const handleAuth = (u: User) => {
    setUser(u);
  };

  const handleLogout = async () => {
    try {
      await apiFetch("/auth/logout");
    } catch {}
    setUser(null);
  };

  if (!ready) return null;
  if (!user) return <AuthPage onAuth={handleAuth} />;
  return <NotesApp user={user} onLogout={handleLogout} />;
}
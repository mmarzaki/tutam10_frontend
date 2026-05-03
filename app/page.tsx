"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// Types 

interface User {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  color: string;
  isPinned: boolean;
  updatedAt: string;
  createdAt: string;
}

// LocalStorage DB

const DB = {
  getUsers: (): User[] => {
    try { return JSON.parse(localStorage.getItem("notesapp_users") || "[]"); } catch { return []; }
  },
  saveUsers: (users: User[]) => {
    localStorage.setItem("notesapp_users", JSON.stringify(users));
  },
  getNotes: (): Note[] => {
    try { return JSON.parse(localStorage.getItem("notesapp_notes") || "[]"); } catch { return []; }
  },
  saveNotes: (notes: Note[]) => {
    localStorage.setItem("notesapp_notes", JSON.stringify(notes));
  },
  getSession: (): string | null => localStorage.getItem("notesapp_session"),
  setSession: (userId: string) => localStorage.setItem("notesapp_session", userId),
  clearSession: () => localStorage.removeItem("notesapp_session"),
};

// Simple hash 
const simpleHash = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
};

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

// Auth logic

const authRegister = (name: string, email: string, password: string): User => {
  const users = DB.getUsers();
  if (users.find((u) => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error("Email already registered");
  }
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  const user: User = { id: uid(), name, email: email.toLowerCase(), passwordHash: simpleHash(password) };
  DB.saveUsers([...users, user]);
  return user;
};

const authLogin = (email: string, password: string): User => {
  const users = DB.getUsers();
  const user = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (!user || user.passwordHash !== simpleHash(password)) {
    throw new Error("Invalid email or password");
  }
  return user;
};

// Notes logic

const getNotesByUser = (userId: string): Note[] =>
  DB.getNotes()
    .filter((n) => n.userId === userId)
    .sort((a, b) => {
      if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

const createNote = (userId: string): Note => {
  const notes = getNotesByUser(userId);
  if (notes.length >= 10) throw new Error("Maximum 10 notes allowed");
  const note: Note = {
    id: uid(), userId, title: "Untitled", content: "",
    color: "#f5f0e8", isPinned: false,
    updatedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
  };
  DB.saveNotes([...DB.getNotes(), note]);
  return note;
};

const updateNote = (id: string, fields: Partial<Note>): Note => {
  const all = DB.getNotes();
  const idx = all.findIndex((n) => n.id === id);
  if (idx === -1) throw new Error("Note not found");
  all[idx] = { ...all[idx], ...fields, updatedAt: new Date().toISOString() };
  DB.saveNotes(all);
  return all[idx];
};

const deleteNote = (id: string) => {
  DB.saveNotes(DB.getNotes().filter((n) => n.id !== id));
};

// Cosntants

const NOTE_COLORS = [
  "#f5f0e8", "#e8f0e8", "#e8eaf5", "#f5e8e8",
  "#f5f5e8", "#e8f5f5", "#f0e8f5", "#f5ebe8",
];

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

// Auth page

function AuthPage({ onAuth }: { onAuth: (user: User) => void }) {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = () => {
    setError("");
    if (!email || !password || (tab === "register" && !name)) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    // Small timeout so button state renders
    setTimeout(() => {
      try {
        const user = tab === "login"
          ? authLogin(email, password)
          : authRegister(name, email, password);
        DB.setSession(user.id);
        onAuth(user);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }, 50);
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
        {/* Tab headers */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e5e5" }}>
          {(["login", "register"] as const).map((t) => (
            <button key={t} onClick={() => { setTab(t); setError(""); }} style={{
              flex: 1, padding: "18px", border: "none", background: "none", cursor: "pointer",
              fontSize: "15px", fontWeight: tab === t ? 700 : 400,
              color: tab === t ? "#1a4fa0" : "#888",
              borderBottom: tab === t ? "2px solid #1a4fa0" : "2px solid transparent",
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            }}>
              {t === "login" ? "Sign In" : "Create Account"}
            </button>
          ))}
        </div>

        {/* Form */}
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
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" style={inputStyle} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
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

          {tab === "login" && (
            <div style={{ textAlign: "right", marginBottom: "20px" }}>
              <span style={{ fontSize: "13px", color: "#1a4fa0", cursor: "pointer" }}>Forgot password?</span>
            </div>
          )}

          {error && (
            <div style={{
              background: "#fff0f0", border: "1px solid #fcc", borderRadius: "6px",
              padding: "10px 14px", color: "#c00", fontSize: "13px",
              marginBottom: "16px", marginTop: tab === "login" ? 0 : "8px",
            }}>
              {error}
            </div>
          )}

          <button onClick={handleSubmit} disabled={loading} style={{
            width: "100%", padding: "14px", background: "#1a4fa0", color: "#fff",
            border: "none", borderRadius: "30px", fontSize: "16px", fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif", marginTop: "16px",
          }}>
            {loading ? "Please wait..." : tab === "login" ? "Sign in" : "Create account"}
          </button>

          <p style={{ textAlign: "center", marginTop: "20px", fontSize: "13px", color: "#666" }}>
            {tab === "login" ? (
              <>Didn&apos;t have an account?{" "}
                <span onClick={() => { setTab("register"); setError(""); }} style={{ color: "#1a4fa0", fontWeight: 600, cursor: "pointer" }}>Create account</span>
              </>
            ) : (
              <>Already have an account?{" "}
                <span onClick={() => { setTab("login"); setError(""); }} style={{ color: "#1a4fa0", fontWeight: 600, cursor: "pointer" }}>Sign in</span>
              </>
            )}
          </p>

          {/* Local storage notice */}
          <p style={{ textAlign: "center", marginTop: "16px", fontSize: "11px", color: "#bbb" }}>
            💾 Data disimpan di browser ini secara lokal
          </p>
        </div>
      </div>
    </div>
  );
}

// Notes

function NotesApp({ user, onLogout }: { user: User; onLogout: () => void }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [saved, setSaved] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load notes from localStorage
  const refreshNotes = useCallback((keepActiveId?: string) => {
    const loaded = getNotesByUser(user.id);
    setNotes(loaded);
    if (keepActiveId) {
      const found = loaded.find((n) => n.id === keepActiveId);
      setActiveNote(found || loaded[0] || null);
    } else {
      setActiveNote((prev) => {
        if (!prev) return loaded[0] || null;
        return loaded.find((n) => n.id === prev.id) || loaded[0] || null;
      });
    }
  }, [user.id]);

  useEffect(() => { refreshNotes(); }, [refreshNotes]);

  const handleCreate = () => {
    try {
      const note = createNote(user.id);
      setNotes((prev) => [note, ...prev]);
      setActiveNote(note);
    } catch (e: any) { alert(e.message); }
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this note?")) return;
    deleteNote(id);
    refreshNotes();
  };

  const handleUpdateField = (field: "title" | "content", value: string) => {
    if (!activeNote) return;
    // Optimistic update UI immediately
    const optimistic = { ...activeNote, [field]: value, updatedAt: new Date().toISOString() };
    setActiveNote(optimistic);
    setNotes((prev) => prev.map((n) => n.id === activeNote.id ? optimistic : n));
    setSaved(false);

    // Debounced save
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateNote(activeNote.id, { [field]: value });
      setSaved(true);
    }, 600);
  };

  const handleColor = (color: string) => {
    if (!activeNote) return;
    const updated = updateNote(activeNote.id, { color });
    setActiveNote(updated);
    setNotes((prev) => prev.map((n) => n.id === updated.id ? updated : n));
  };

  const handlePin = () => {
    if (!activeNote) return;
    const updated = updateNote(activeNote.id, { isPinned: !activeNote.isPinned });
    setActiveNote(updated);
    refreshNotes(updated.id);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div style={{
      height: "100vh", display: "flex", overflow: "hidden",
      fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
      background: "#1a1a1a",
    }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: "240px", background: "#1a1a1a",
        borderRight: "1px solid #2a2a2a",
        display: "flex", flexDirection: "column", flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: "18px 16px 12px", display: "flex", alignItems: "center",
          justifyContent: "space-between", borderBottom: "1px solid #2a2a2a",
        }}>
          <span style={{ fontSize: "17px", fontWeight: 700, color: "#fff", letterSpacing: "-0.02em" }}>
            Notes
          </span>
          <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
            <button onClick={handleCreate} title="New note" style={{
              background: "none", border: "none", color: "#888", cursor: "pointer",
              fontSize: "22px", lineHeight: 1, padding: "2px 6px", borderRadius: "6px",
            }}>+</button>
            <button
              onClick={onLogout}
              title={`Logout (${user.name})`}
              style={{
                width: "28px", height: "28px", borderRadius: "50%",
                background: "#2d4a3e", border: "none", cursor: "pointer",
                color: "#8bc4a0", fontSize: "12px", fontWeight: 700,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>

        {/* Greeting */}
        <div style={{ padding: "12px 14px 8px" }}>
          <div style={{ background: "#2d4a3e", borderRadius: "8px", padding: "10px 12px" }}>
            <div style={{ fontSize: "11px", color: "#6aaa80" }}>Hi, {user.name.split(" ")[0]}!</div>
            <div style={{ fontSize: "10px", color: "#4a7a5a", marginTop: "2px" }}>
              {notes.length}/10 pages used
            </div>
          </div>
        </div>

        {/* Note list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 8px" }}>
          {notes.length === 0 ? (
            <div style={{ padding: "20px 8px", color: "#555", fontSize: "13px", lineHeight: 1.5 }}>
              No notes yet.<br />Click + to create one.
            </div>
          ) : (
            notes.map((note) => {
              const isActive = activeNote?.id === note.id;
              return (
                <div
                  key={note.id}
                  onClick={() => setActiveNote(note)}
                  style={{
                    padding: "10px 12px", cursor: "pointer",
                    background: isActive ? note.color : "transparent",
                    borderRadius: "8px", marginBottom: "2px",
                    transition: "background 0.15s", position: "relative",
                  }}
                >
                  {note.isPinned && (
                    <span style={{ position: "absolute", top: "8px", right: "10px", fontSize: "10px", color: isActive ? "#888" : "#555" }}>
                      📌
                    </span>
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

      {/* ── Editor ── */}
      {activeNote ? (
        <div style={{ flex: 1, background: activeNote.color, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Toolbar */}
          <div style={{
            padding: "10px 20px", borderBottom: "1px solid rgba(0,0,0,0.08)",
            display: "flex", alignItems: "center", gap: "8px",
            background: "rgba(255,255,255,0.25)", flexWrap: "wrap",
          }}>
            {NOTE_COLORS.map((c) => (
              <button key={c} onClick={() => handleColor(c)} style={{
                width: "18px", height: "18px", borderRadius: "50%", background: c,
                border: activeNote.color === c ? "2px solid #333" : "1px solid rgba(0,0,0,0.18)",
                cursor: "pointer", padding: 0, flexShrink: 0,
              }} />
            ))}
            <div style={{ flex: 1 }} />
            <span style={{ fontSize: "11px", color: "#888" }}>
              {saved ? "✓ Saved" : "Saving..."}
            </span>
            <button onClick={handlePin} style={{
              background: activeNote.isPinned ? "rgba(0,0,0,0.1)" : "none",
              border: "1px solid rgba(0,0,0,0.12)", borderRadius: "6px",
              padding: "4px 10px", cursor: "pointer", fontSize: "12px", color: "#555",
            }}>
              {activeNote.isPinned ? "📌 Pinned" : "📌 Pin"}
            </button>
            <button onClick={() => handleDelete(activeNote.id)} style={{
              background: "none", border: "1px solid rgba(180,0,0,0.25)",
              borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
              fontSize: "12px", color: "#c00",
            }}>
              Delete
            </button>
          </div>

          {/* Title */}
          <input
            value={activeNote.title}
            onChange={(e) => handleUpdateField("title", e.target.value)}
            placeholder="Title"
            style={{
              padding: "22px 32px 8px", fontSize: "24px", fontWeight: 700,
              border: "none", background: "transparent", outline: "none",
              color: "#1a1a1a", fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              letterSpacing: "-0.02em",
            }}
          />

          {/* Content */}
          <textarea
            value={activeNote.content}
            onChange={(e) => handleUpdateField("content", e.target.value)}
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
          <button onClick={handleCreate} style={{
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
    // Restore session from localStorage
    const sessionUserId = DB.getSession();
    if (sessionUserId) {
      const users = DB.getUsers();
      const found = users.find((u) => u.id === sessionUserId);
      if (found) setUser(found);
    }
    setReady(true);
  }, []);

  const handleAuth = (u: User) => setUser(u);

  const handleLogout = () => {
    DB.clearSession();
    setUser(null);
  };

  if (!ready) return null;
  if (!user) return <AuthPage onAuth={handleAuth} />;
  return <NotesApp user={user} onLogout={handleLogout} />;
}
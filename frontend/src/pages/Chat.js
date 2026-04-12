import React, { useState, useRef, useEffect } from "react";
import { askAgent } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ ...styles.msgRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && <div style={styles.avatar}>🤖</div>}
      <div style={{ ...styles.bubble, ...(isUser ? styles.userBubble : styles.aiBubble) }}>
        <p style={styles.msgText}>{msg.content}</p>
        <span style={styles.time}>{msg.time}</span>
      </div>
      {isUser && <div style={styles.userAvatar}>👤</div>}
    </div>
  );
}

export default function Chat() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    {
      role: "ai",
      content: `Hi ${user?.username || "there"}! I'm your Agentic AI assistant. I can search the web for current news or search through your documents. Ask me anything!`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const query = input.trim();
    if (!query || loading) return;
    setInput("");

    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages((prev) => [...prev, { role: "user", content: query, time }]);
    setLoading(true);

    try {
      const res = await askAgent(query);
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: res.data.answer,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", content: "Sorry, something went wrong. Please try again.", time },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const suggestions = [
    "What's the latest AI news today?",
    "What is your refund policy?",
    "What are your office hours?",
    "Tell me about recent tech updates",
  ];

  return (
    <div style={styles.shell}>
      {/* Sidebar */}
      <div style={{ ...styles.sidebar, transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)" }}>
        <div style={styles.sidebarHeader}>
          <span style={styles.sidebarLogo}>🤖 Agentic AI</span>
          <button style={styles.closeBtn} onClick={() => setSidebarOpen(false)}>✕</button>
        </div>
        <div style={styles.sidebarUser}>
          <div style={styles.userIcon}>👤</div>
          <div>
            <div style={styles.userName}>{user?.username}</div>
            <div style={styles.userRole}>{user?.role || "user"}</div>
          </div>
        </div>
        <nav style={styles.nav}>
          <a href="/chat" style={styles.navItem}>💬 Chat</a>
          <a href="/upload" style={styles.navItem}>📄 Upload Docs</a>
          {user?.role === "admin" && <a href="/users" style={styles.navItem}>👥 Users</a>}
        </nav>
        <button className="btn btn-danger" style={{ margin: "auto 16px 24px", width: "calc(100% - 32px)" }} onClick={handleLogout}>
          Sign Out
        </button>
      </div>

      {/* Overlay */}
      {sidebarOpen && <div style={styles.overlay} onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <div style={styles.main}>
        {/* Topbar */}
        <div style={styles.topbar}>
          <button style={styles.menuBtn} onClick={() => setSidebarOpen(true)}>☰</button>
          <div style={styles.topbarTitle}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <span style={{ fontWeight: 600 }}>Agentic AI</span>
            <span style={styles.onlineDot} />
            <span style={{ fontSize: 12, color: "#4ade80" }}>Online</span>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: "6px 12px" }} onClick={handleLogout}>
            Logout
          </button>
        </div>

        {/* Messages */}
        <div style={styles.messages}>
          {messages.map((msg, i) => <Message key={i} msg={msg} />)}

          {loading && (
            <div style={{ ...styles.msgRow, justifyContent: "flex-start" }}>
              <div style={styles.avatar}>🤖</div>
              <div style={{ ...styles.bubble, ...styles.aiBubble, display: "flex", gap: 6, alignItems: "center" }}>
                <div style={styles.dot} /><div style={{ ...styles.dot, animationDelay: "0.2s" }} /><div style={{ ...styles.dot, animationDelay: "0.4s" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggestions */}
        {messages.length <= 1 && (
          <div style={styles.suggestions}>
            {suggestions.map((s) => (
              <button key={s} style={styles.chip} onClick={() => { setInput(s); }}>
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div style={styles.inputRow}>
          <textarea
            rows={1}
            placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            style={styles.textarea}
          />
          <button
            className="btn btn-primary"
            onClick={send}
            disabled={loading || !input.trim()}
            style={{ flexShrink: 0, height: 44 }}
          >
            {loading ? <span className="spinner" /> : "Send ➤"}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  shell: { display: "flex", height: "100vh", overflow: "hidden", position: "relative" },
  sidebar: {
    position: "fixed", left: 0, top: 0, bottom: 0, width: 260,
    background: "#13151f", borderRight: "1px solid #2d3148",
    display: "flex", flexDirection: "column", zIndex: 100,
    transition: "transform 0.25s ease",
  },
  sidebarHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 16px", borderBottom: "1px solid #2d3148" },
  sidebarLogo: { fontWeight: 700, fontSize: 16, color: "#e2e8f0" },
  closeBtn: { background: "none", border: "none", color: "#64748b", fontSize: 18, cursor: "pointer" },
  sidebarUser: { display: "flex", alignItems: "center", gap: 12, padding: 16, borderBottom: "1px solid #2d3148" },
  userIcon: { fontSize: 32, background: "#1e2235", borderRadius: 8, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" },
  userName: { fontWeight: 600, fontSize: 14, color: "#e2e8f0" },
  userRole: { fontSize: 12, color: "#4f46e5", textTransform: "capitalize" },
  nav: { display: "flex", flexDirection: "column", gap: 4, padding: "12px 8px", flex: 1 },
  navItem: { padding: "10px 12px", borderRadius: 8, color: "#94a3b8", textDecoration: "none", fontSize: 14, display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" },
  overlay: { position: "fixed", inset: 0, background: "#00000060", zIndex: 99 },
  main: { flex: 1, display: "flex", flexDirection: "column", minWidth: 0 },
  topbar: { display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", borderBottom: "1px solid #2d3148", background: "#13151f" },
  menuBtn: { background: "none", border: "none", color: "#94a3b8", fontSize: 22, cursor: "pointer", padding: 4 },
  topbarTitle: { display: "flex", alignItems: "center", gap: 8, flex: 1, fontWeight: 600, fontSize: 16 },
  onlineDot: { width: 8, height: 8, borderRadius: "50%", background: "#4ade80" },
  messages: { flex: 1, overflowY: "auto", padding: "20px 16px", display: "flex", flexDirection: "column", gap: 16 },
  msgRow: { display: "flex", gap: 10, alignItems: "flex-end" },
  avatar: { fontSize: 28, flexShrink: 0 },
  userAvatar: { fontSize: 24, flexShrink: 0 },
  bubble: { maxWidth: "72%", padding: "12px 16px", borderRadius: 16, lineHeight: 1.6 },
  aiBubble: { background: "#1e2235", borderBottomLeftRadius: 4, border: "1px solid #2d3148" },
  userBubble: { background: "#4f46e5", borderBottomRightRadius: 4 },
  msgText: { fontSize: 14, color: "#e2e8f0", whiteSpace: "pre-wrap" },
  time: { fontSize: 11, color: "#475569", display: "block", marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: "50%", background: "#4f46e5", animation: "bounce 1s infinite" },
  suggestions: { padding: "0 16px 12px", display: "flex", flexWrap: "wrap", gap: 8 },
  chip: { background: "#1e2235", border: "1px solid #2d3148", color: "#94a3b8", borderRadius: 20, padding: "6px 14px", fontSize: 12, cursor: "pointer", transition: "all 0.2s" },
  inputRow: { display: "flex", gap: 10, padding: "12px 16px", borderTop: "1px solid #2d3148", background: "#13151f" },
  textarea: { flex: 1, resize: "none", borderRadius: 10, padding: "10px 14px", fontSize: 14, lineHeight: 1.5, maxHeight: 120 },
};

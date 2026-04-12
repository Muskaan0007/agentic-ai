import React, { useState } from "react";
import { uploadDoc } from "../services/api";
import { useNavigate } from "react-router-dom";

export default function Upload() {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) {
      setError("Provide text or upload a file.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("");

    const fd = new FormData();
    if (text.trim()) fd.append("text", text);
    if (file) fd.append("file", file);

    try {
      const res = await uploadDoc(fd);
      setStatus(res.data.message);
      setText("");
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <button onClick={() => navigate("/chat")} style={styles.back}>← Back to Chat</button>
          <h1 style={styles.title}>📄 Upload Documents</h1>
          <p style={styles.sub}>Add documents to the knowledge base for RAG-powered answers</p>
        </div>

        <div className="card">
          {status && (
            <div style={styles.success}>{status}</div>
          )}
          {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Paste Text</label>
              <textarea
                rows={6}
                placeholder="Paste document content here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            <div style={styles.divider}><span>or</span></div>

            <div style={styles.field}>
              <label style={styles.label}>Upload File (.txt)</label>
              <div style={styles.fileBox}>
                <input
                  type="file"
                  accept=".txt,.pdf,.docx"
                  id="fileInput"
                  style={{ display: "none" }}
                  onChange={(e) => setFile(e.target.files[0])}
                />
                <label htmlFor="fileInput" style={styles.fileLabel}>
                  {file ? `📎 ${file.name}` : "Click to select a file"}
                </label>
              </div>
            </div>

            <button
              className="btn btn-primary"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : "Upload to Knowledge Base"}
            </button>
          </form>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ color: "#94a3b8", fontSize: 14, marginBottom: 10 }}>ℹ️ How it works</h3>
          <ul style={styles.infoList}>
            <li>Documents are stored in ChromaDB vector store</li>
            <li>The AI agent searches them for non-web queries</li>
            <li>Supports pasting text or uploading .txt files</li>
            <li>Queries with "latest", "news", "today" → web search</li>
            <li>All other queries → document search</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: 24, minHeight: "100vh", display: "flex", justifyContent: "center" },
  container: { width: "100%", maxWidth: 600 },
  header: { marginBottom: 24 },
  back: { background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 14, marginBottom: 16, padding: 0 },
  title: { fontSize: 24, fontWeight: 700, color: "#e2e8f0", marginBottom: 6 },
  sub: { color: "#64748b", fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#94a3b8" },
  divider: { textAlign: "center", color: "#475569", fontSize: 13, position: "relative", margin: "4px 0" },
  fileBox: { border: "1px dashed #2d3148", borderRadius: 8, padding: 24, textAlign: "center" },
  fileLabel: { cursor: "pointer", color: "#818cf8", fontSize: 14 },
  success: { background: "#052e16", border: "1px solid #16a34a", color: "#4ade80", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 },
  infoList: { color: "#64748b", fontSize: 13, paddingLeft: 18, lineHeight: 2 },
};

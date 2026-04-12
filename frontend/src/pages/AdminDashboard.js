import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import API from "../services/api";

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [documentTitle, setDocumentTitle] = useState("");
  const [documentContent, setDocumentContent] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/chat");
      return;
    }
    fetchDocuments();
  }, [user, navigate]);

  const fetchDocuments = async () => {
    try {
      const res = await API.get("/admin/documents/");
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to fetch documents:", err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!documentTitle.trim() || !documentContent.trim()) {
      setError("Title and content are required.");
      return;
    }

    setLoading(true);
    try {
      await API.post("/admin/documents/", {
        title: documentTitle,
        content: documentContent,
      });
      setSuccess("Document uploaded successfully!");
      setDocumentTitle("");
      setDocumentContent("");
      fetchDocuments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm("Are you sure you want to delete this document?"))
      return;

    try {
      await API.delete("/admin/documents/", {
        data: { id: docId },
      });
      setSuccess("Document deleted successfully!");
      fetchDocuments();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.response?.data?.error || "Delete failed.");
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Admin Dashboard</h1>
          <p style={styles.welcome}>Welcome, {user?.username}! 👨‍💼</p>
        </div>
        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div style={styles.content}>
        {/* Upload Section */}
        <div style={styles.uploadSection}>
          <h2 style={styles.sectionTitle}>📄 Upload Company Document</h2>
          <p style={styles.description}>
            Upload documents that will be added to the knowledge base. Users
            will be able to ask questions about these documents.
          </p>

          {error && <div style={styles.error}>{error}</div>}
          {success && <div style={styles.success}>{success}</div>}

          <form onSubmit={handleUpload} style={styles.form}>
            <div style={styles.field}>
              <label style={styles.label}>Document Title *</label>
              <input
                type="text"
                placeholder="e.g., Company Policies, FAQ, Product Info"
                value={documentTitle}
                onChange={(e) => setDocumentTitle(e.target.value)}
                required
              />
            </div>

            <div style={styles.field}>
              <label style={styles.label}>Document Content *</label>
              <textarea
                placeholder="Paste the document content here..."
                value={documentContent}
                onChange={(e) => setDocumentContent(e.target.value)}
                required
                style={styles.textarea}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.button,
                opacity: loading ? 0.6 : 1,
                cursor: loading ? "not-allowed" : "pointer",
              }}
            >
              {loading ? "Uploading..." : "Upload Document"}
            </button>
          </form>
        </div>

        {/* Documents List */}
        <div style={styles.documentsSection}>
          <h2 style={styles.sectionTitle}>📚 Company Knowledge Base</h2>
          <p style={styles.description}>
            {documents.length} document{documents.length !== 1 ? "s" : ""} in
            the knowledge base
          </p>

          {documents.length === 0 ? (
            <p style={styles.noDocuments}>No documents uploaded yet.</p>
          ) : (
            <div style={styles.documentsList}>
              {documents.map((doc) => (
                <div key={doc.id} style={styles.documentCard}>
                  <div style={styles.docHeader}>
                    <h3 style={styles.docTitle}>{doc.title}</h3>
                    <span style={styles.docDate}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={styles.docContent}>
                    {doc.content.substring(0, 150)}...
                  </p>
                  <div style={styles.docFooter}>
                    <span style={styles.docUploader}>
                      By: {doc.uploaded_by__username}
                    </span>
                    <button
                      style={styles.deleteBtn}
                      onClick={() => handleDelete(doc.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: { minHeight: "100vh", background: "#0f172a", color: "#e2e8f0" },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "24px 32px",
    borderBottom: "1px solid #334155",
    background: "#1e293b",
  },
  title: { margin: 0, fontSize: 28, fontWeight: 700, color: "#e2e8f0" },
  welcome: { margin: "8px 0 0 0", fontSize: 14, color: "#94a3b8" },
  logoutBtn: {
    padding: "10px 20px",
    background: "#ef4444",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontWeight: 600,
  },
  content: { maxWidth: 1200, margin: "0 auto", padding: "32px 16px" },
  uploadSection: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: 24,
    marginBottom: 32,
  },
  documentsSection: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 700,
    margin: "0 0 8px 0",
    color: "#e2e8f0",
  },
  description: { color: "#94a3b8", margin: "0 0 24px 0", fontSize: 14 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 14, fontWeight: 600, color: "#cbd5e1" },
  textarea: {
    padding: 12,
    borderRadius: 6,
    border: "1px solid #475569",
    background: "#0f172a",
    color: "#e2e8f0",
    fontSize: 14,
    fontFamily: "inherit",
    minHeight: 200,
    resize: "vertical",
  },
  button: {
    padding: "12px 24px",
    borderRadius: 6,
    border: "none",
    background: "#818cf8",
    color: "white",
    fontWeight: 600,
    fontSize: 14,
    cursor: "pointer",
  },
  error: {
    padding: 12,
    borderRadius: 6,
    background: "#7f1d1d",
    color: "#fca5a5",
    marginBottom: 16,
    fontSize: 14,
  },
  success: {
    padding: 12,
    borderRadius: 6,
    background: "#1f2937",
    color: "#86efac",
    marginBottom: 16,
    fontSize: 14,
  },
  documentsList: { display: "grid", gap: 16 },
  documentCard: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: 16,
  },
  docHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "start",
    marginBottom: 12,
  },
  docTitle: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: "#e2e8f0",
    flex: 1,
  },
  docDate: {
    color: "#64748b",
    fontSize: 12,
    whiteSpace: "nowrap",
    marginLeft: 12,
  },
  docContent: {
    color: "#94a3b8",
    fontSize: 13,
    margin: "0 0 12px 0",
    lineHeight: 1.5,
  },
  docFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  docUploader: { color: "#64748b", fontSize: 12 },
  deleteBtn: {
    padding: "6px 12px",
    background: "#7f1d1d",
    color: "#fca5a5",
    border: "none",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
  },
  noDocuments: {
    color: "#64748b",
    textAlign: "center",
    padding: "32px",
    fontSize: 14,
  },
};

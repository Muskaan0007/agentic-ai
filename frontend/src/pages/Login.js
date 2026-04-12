import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login as loginAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState(null); // 'admin', 'user', or null
  const [form, setForm] = useState({ username: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginAPI(form);

      // Check role matches selected mode
      if (mode === "admin" && res.data.user.role !== "admin") {
        setError("This account is not an admin account.");
        setLoading(false);
        return;
      }
      if (mode === "user" && res.data.user.role === "admin") {
        setError("Please use the admin login for this account.");
        setLoading(false);
        return;
      }

      login(res.data.user, res.data.access, res.data.refresh);
      navigate(res.data.user.role === "admin" ? "/admin-dashboard" : "/chat");
    } catch (err) {
      setError(err.response?.data?.error || "Login failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.logo}>🤖</div>
        <h1 style={styles.title}>Agentic AI</h1>

        {!mode ? (
          <>
            <p style={styles.sub}>Choose login type</p>
            <div style={styles.modeSelection}>
              <button style={styles.modeBtn} onClick={() => setMode("admin")}>
                👨‍💼 <br /> Admin Login
              </button>
              <button style={styles.modeBtn} onClick={() => setMode("user")}>
                👤 <br /> User Login
              </button>
            </div>
          </>
        ) : (
          <>
            <p style={styles.sub}>
              Sign in as {mode === "admin" ? "Admin" : "User"}
              <button
                style={styles.backBtn}
                onClick={() => {
                  setMode(null);
                  setError("");
                  setForm({ username: "", password: "" });
                }}
              >
                ← Back
              </button>
            </p>

            {error && (
              <div className="error-msg" style={{ marginBottom: 16 }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input
                  type="text"
                  placeholder="Enter username"
                  value={form.username}
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                  required
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  placeholder="Enter password"
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  required
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
                disabled={loading}
              >
                {loading ? <span className="spinner" /> : "Sign In"}
              </button>
            </form>

            <p style={styles.footer}>
              Don't have an account?{" "}
              <Link to="/register" style={styles.link}>
                Register
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "100vh",
    padding: 20,
  },
  box: { width: "100%", maxWidth: 400 },
  logo: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  title: {
    fontSize: 28,
    fontWeight: 700,
    textAlign: "center",
    color: "#e2e8f0",
  },
  sub: {
    color: "#64748b",
    textAlign: "center",
    marginBottom: 28,
    marginTop: 6,
    position: "relative",
  },
  backBtn: {
    position: "absolute",
    right: 0,
    top: 0,
    background: "none",
    border: "none",
    color: "#818cf8",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  modeSelection: { display: "flex", gap: 16, marginBottom: 20 },
  modeBtn: {
    flex: 1,
    padding: "24px 16px",
    borderRadius: 8,
    border: "2px solid #334155",
    background: "#0f172a",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.3s",
  },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#94a3b8" },
  footer: {
    textAlign: "center",
    marginTop: 24,
    fontSize: 13,
    color: "#64748b",
  },
  link: { color: "#818cf8", textDecoration: "none", fontWeight: 500 },
};

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register as registerAPI } from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await registerAPI(form);
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.box}>
        <div style={styles.logo}>🤖</div>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.sub}>Join Agentic AI today</p>

        {error && <div className="error-msg" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { key: "username", label: "Username", type: "text", placeholder: "Choose a username" },
            { key: "email", label: "Email", type: "email", placeholder: "Enter your email" },
            { key: "password", label: "Password", type: "password", placeholder: "Create a password" },
          ].map(({ key, label, type, placeholder }) => (
            <div key={key} style={styles.field}>
              <label style={styles.label}>{label}</label>
              <input
                type={type}
                placeholder={placeholder}
                value={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                required
              />
            </div>
          ))}
          <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }} disabled={loading}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 },
  box: { width: "100%", maxWidth: 400 },
  logo: { fontSize: 48, textAlign: "center", marginBottom: 12 },
  title: { fontSize: 28, fontWeight: 700, textAlign: "center", color: "#e2e8f0" },
  sub: { color: "#64748b", textAlign: "center", marginBottom: 28, marginTop: 6 },
  form: { display: "flex", flexDirection: "column", gap: 16 },
  field: { display: "flex", flexDirection: "column", gap: 6 },
  label: { fontSize: 13, fontWeight: 500, color: "#94a3b8" },
  footer: { textAlign: "center", marginTop: 24, fontSize: 13, color: "#64748b" },
  link: { color: "#818cf8", textDecoration: "none", fontWeight: 500 },
};

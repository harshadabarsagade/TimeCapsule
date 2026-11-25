import { useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import api from "./services/api";
import { connectSocket, disconnectSocket } from "./services/socket";

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("timecapsule_user")); }
    catch { return null; }
  });
  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [capsules, setCapsules] = useState([]);
  const [form, setForm] = useState({
    recipientName: "", recipientEmail: "", subject: "", message: "", deliveryDate: ""
  });
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    loadCapsules();
    const socket = connectSocket(user.id);
    const refresh = () => loadCapsules();
    socket.on("capsule-created", refresh);
    socket.on("capsule-deleted", refresh);
    socket.on("capsule-status-updated", refresh);
    return () => {
      socket.off("capsule-created", refresh);
      socket.off("capsule-deleted", refresh);
      socket.off("capsule-status-updated", refresh);
    };
  }, [user]);

  async function loadCapsules() {
    try {
      const { data } = await api.get("/capsules");
      setCapsules(data.capsules);
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not load capsules.");
    }
  }

  async function handleAuth(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      const endpoint = authMode === "login" ? "/auth/login" : "/auth/register";
      const { data } = await api.post(endpoint, authForm);
      localStorage.setItem("timecapsule_token", data.token);
      localStorage.setItem("timecapsule_user", JSON.stringify(data.user));
      setUser(data.user);
      setAuthForm({ name: "", email: "", password: "" });
      navigate("/");
    } catch (error) {
      setNotice(error.response?.data?.message || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreate(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    try {
      await api.post("/capsules", form);
      setForm({ recipientName: "", recipientEmail: "", subject: "", message: "", deliveryDate: "" });
      setNotice("Your capsule is safely scheduled. ✨");
      await loadCapsules();
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not schedule capsule.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this scheduled capsule?")) return;
    try {
      await api.delete(`/capsules/${id}`);
      setNotice("Capsule deleted.");
      await loadCapsules();
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not delete capsule.");
    }
  }

  function logout() {
    localStorage.removeItem("timecapsule_token");
    localStorage.removeItem("timecapsule_user");
    disconnectSocket();
    setUser(null);
    setCapsules([]);
    navigate("/");
  }

  const scheduled = capsules.filter((item) => item.status === "scheduled").length;
  const sent = capsules.filter((item) => item.status === "sent").length;

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/"> <span className="brand-icon">⌛</span> TimeCapsule</Link>
        <nav>
          {user ? (
            <>
              <span className="welcome">Hi, {user.name}</span>
              <button className="button button-ghost" onClick={logout}>Log out</button>
            </>
          ) : <a href="#auth" className="nav-link">Sign in</a>}
        </nav>
      </header>

      <main className="container">
        <Routes>
          <Route path="/" element={user ? (
            <Dashboard
              user={user} capsules={capsules} form={form} setForm={setForm}
              handleCreate={handleCreate} handleDelete={handleDelete}
              notice={notice} busy={busy} scheduled={scheduled} sent={sent}
            />
          ) : (
            <section className="hero-layout">
              <div className="hero-copy">
                <span className="eyebrow">A LITTLE NOTE TO TOMORROW</span>
                <h1>Your words.<br /><span>Their future.</span></h1>
                <p>Write a message today. Choose a future moment. Let TimeCapsule deliver it when the time is right.</p>
                <div className="hero-points">
                  <span>✦ Thoughtful messages</span><span>✦ Scheduled delivery</span><span>✦ A little time travel</span>
                </div>
              </div>
              <AuthCard
                authMode={authMode} setAuthMode={setAuthMode}
                authForm={authForm} setAuthForm={setAuthForm}
                handleAuth={handleAuth} busy={busy} notice={notice}
              />
            </section>
          )} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer>Made for the moments that matter · TimeCapsule</footer>
    </div>
  );
}

function AuthCard({ authMode, setAuthMode, authForm, setAuthForm, handleAuth, busy, notice }) {
  const isLogin = authMode === "login";
  return (
    <section className="panel auth-panel" id="auth">
      <div className="panel-heading">
        <span className="mini-icon">✉</span>
        <div><h2>{isLogin ? "Welcome back" : "Create your account"}</h2><p>{isLogin ? "Open your time-travel desk." : "Start sending words into the future."}</p></div>
      </div>
      <form onSubmit={handleAuth} className="form-stack">
        {!isLogin && <Field label="Your name"><input required maxLength="60" value={authForm.name} onChange={(e) => setAuthForm({ ...authForm, name: e.target.value })} placeholder="Alex Morgan" /></Field>}
        <Field label="Email"><input required type="email" value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="you@example.com" /></Field>
        <Field label="Password"><input required minLength="6" type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="At least 6 characters" /></Field>
        {notice && <p className="notice">{notice}</p>}
        <button className="button button-primary full" disabled={busy}>{busy ? "Please wait..." : isLogin ? "Sign in" : "Create account"}</button>
      </form>
      <p className="switch-auth">{isLogin ? "New to TimeCapsule?" : "Already have an account?"} <button onClick={() => setAuthMode(isLogin ? "register" : "login")}>{isLogin ? "Create an account" : "Sign in"}</button></p>
    </section>
  );
}

function Dashboard({ user, capsules, form, setForm, handleCreate, handleDelete, notice, busy, scheduled, sent }) {
  const minTime = new Date(Date.now() + 60000);
  const localOffset = minTime.getTimezoneOffset() * 60000;
  const minDate = new Date(minTime.getTime() - localOffset).toISOString().slice(0, 16);
  return (
    <>
      <section className="dashboard-heading">
        <div><span className="eyebrow">YOUR PERSONAL TIME DESK</span><h1>Make a moment <span>last.</span></h1><p>Hi {user.name}, what would you like someone to read in the future?</p></div>
        <div className="stats">
          <div className="stat-card"><strong>{scheduled}</strong><span>Scheduled</span></div>
          <div className="stat-card"><strong>{sent}</strong><span>Delivered</span></div>
        </div>
      </section>

      <section className="dashboard-grid">
        <section className="panel create-panel">
          <div className="section-title"><div><span className="mini-icon">✎</span><h2>Create a capsule</h2></div><span className="step-label">01 / WRITE</span></div>
          <form className="form-stack" onSubmit={handleCreate}>
            <div className="two-cols">
              <Field label="Recipient name"><input required maxLength="80" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} placeholder="Who is it for?" /></Field>
              <Field label="Recipient email"><input required type="email" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} placeholder="friend@example.com" /></Field>
            </div>
            <Field label="Email subject"><input required maxLength="120" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="A note from the past..." /></Field>
            <Field label="Your message"><textarea required maxLength="10000" rows="6" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Write something worth waiting for..." /></Field>
            <Field label="Delivery date & time"><input required type="datetime-local" min={minDate} value={form.deliveryDate} onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })} /></Field>
            <p className="helper-text">Your message will be emailed automatically at the selected time. Keep the backend server running for scheduled delivery.</p>
            {notice && <p className="notice">{notice}</p>}
            <button className="button button-primary" disabled={busy}>{busy ? "Scheduling..." : "Schedule my capsule →"}</button>
          </form>
        </section>

        <section className="panel list-panel">
          <div className="section-title"><div><span className="mini-icon">◷</span><h2>Your capsules</h2></div><span className="step-label">02 / WAIT</span></div>
          {capsules.length === 0 ? (
            <div className="empty-state"><div className="empty-art">⌛</div><h3>Your future is unwritten.</h3><p>Create your first capsule and it will appear here.</p></div>
          ) : (
            <div className="capsule-list">
              {capsules.map((capsule) => (
                <article className="capsule-card" key={capsule._id}>
                  <div className="capsule-card-top">
                    <span className={`status status-${capsule.status}`}>{capsule.status}</span>
                    <span className="date-label">{new Date(capsule.deliveryDate).toLocaleString()}</span>
                  </div>
                  <h3>{capsule.subject}</h3>
                  <p className="recipient-line">To {capsule.recipientName} · {capsule.recipientEmail}</p>
                  <p className="message-preview">{capsule.message}</p>
                  {capsule.status === "scheduled" && <button className="delete-link" onClick={() => handleDelete(capsule._id)}>Delete scheduled capsule</button>}
                  {capsule.status === "failed" && <p className="error-line">Email delivery failed. Check backend email settings.</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      </section>
    </>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

export default App;

import { useReducer, useState, useMemo, useContext, createContext, useEffect } from "react";

const API_BASE = "http://localhost:8080/api/applications";

const ViewContext = createContext({ compact: false });

const STAGES = [
  { key: "applied", label: "Applied", color: "#5B6B8C" },
  { key: "interview", label: "Interview", color: "#B4842D" },
  { key: "offer", label: "Offer", color: "#3E7A55" },
  { key: "rejected", label: "Rejected", color: "#9C6B6B" },
];

// The reducer now ONLY updates what's already in memory.
// The actual source of truth is the Java backend -- every action here
// runs AFTER the server confirms the change (see the dispatch* functions below).
function appsReducer(state, action) {
  switch (action.type) {
    case "set":
      return action.payload; // replace everything with what the server sent
    case "add":
      return [action.payload, ...state];
    case "move":
      return state.map((a) => (a.id === action.id ? { ...a, stage: action.stage } : a));
    case "remove":
      return state.filter((a) => a.id !== action.id);
    case "note":
      return state.map((a) => (a.id === action.id ? { ...a, notes: action.notes } : a));
    default:
      return state;
  }
}

function stageIndex(stage) {
  return STAGES.findIndex((s) => s.key === stage);
}

export default function JobTracker() {
  const [apps, dispatch] = useReducer(appsReducer, []);
  const [compact, setCompact] = useState(false);
  const [form, setForm] = useState({ company: "", role: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load everything from the Java backend once, when the component first mounts
  useEffect(() => {
    fetch(API_BASE)
      .then((res) => {
        if (!res.ok) throw new Error("Server responded with " + res.status);
        return res.json();
      })
      .then((data) => {
        dispatch({ type: "set", payload: data });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const columns = useMemo(() => {
    return STAGES.map((s) => ({ ...s, items: apps.filter((a) => a.stage === s.key) }));
  }, [apps]);

  const stats = useMemo(() => {
    const total = apps.length;
    const active = apps.filter((a) => a.stage !== "rejected").length;
    return { total, active };
  }, [apps]);

  // ---- Actions: each one calls the Java API, then updates local state to match ----

  async function handleAdd(e) {
    e.preventDefault();
    if (!form.company.trim() || !form.role.trim()) return;
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company: form.company.trim(), role: form.role.trim() }),
    });
    const saved = await res.json(); // the server sends back the saved row, including its new id
    dispatch({ type: "add", payload: saved });
    setForm({ company: "", role: "" });
  }

  async function moveStage(id, stage) {
    await fetch(`${API_BASE}/${id}/stage`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    dispatch({ type: "move", id, stage });
  }

  async function removeApp(id) {
    await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    dispatch({ type: "remove", id });
  }

  if (loading) return <Centered>Loading applications…</Centered>;
  if (error)
    return (
      <Centered>
        Couldn't reach the backend ({error}). <br />
        Make sure the Spring Boot server is running on port 8080.
      </Centered>
    );

  return (
    <ViewContext.Provider value={{ compact }}>
      <div style={{ fontFamily: "'Inter', -apple-system, sans-serif", background: "#EFEDE6", minHeight: "100%", padding: "28px 16px", color: "#232323" }}>
        <div style={{ maxWidth: 920, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.3 }}>Pipeline</div>
              <div style={{ fontSize: 12, opacity: 0.55 }}>job tracker · React + Java Spring Boot</div>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 11, opacity: 0.55, textTransform: "uppercase", letterSpacing: 1 }}>Active / Total</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{stats.active} / {stats.total}</div>
              </div>
              <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <input type="checkbox" checked={compact} onChange={(e) => setCompact(e.target.checked)} />
                compact
              </label>
            </div>
          </div>

          <form onSubmit={handleAdd} style={{ display: "flex", gap: 8, marginBottom: 20, background: "#FCFBF8", border: "1px solid #23232322", borderRadius: 8, padding: 10 }}>
            <input value={form.company} onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))} placeholder="Company" style={inputStyle} />
            <input value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))} placeholder="Role" style={inputStyle} />
            <button type="submit" style={buttonStyle}>+ add application</button>
          </form>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {columns.map((col) => (
              <Column key={col.key} col={col} moveStage={moveStage} removeApp={removeApp} />
            ))}
          </div>
        </div>
      </div>
    </ViewContext.Provider>
  );
}

function Centered({ children }) {
  return <div style={{ padding: 40, textAlign: "center", fontFamily: "sans-serif", color: "#555" }}>{children}</div>;
}

function Column({ col, moveStage, removeApp }) {
  const { compact } = useContext(ViewContext);
  return (
    <div style={{ background: "#FCFBF8", borderRadius: 8, border: "1px solid #23232318", minHeight: 200 }}>
      <div style={{ padding: "10px 12px", borderBottom: `2px solid ${col.color}`, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: col.color, display: "flex", justifyContent: "space-between" }}>
        <span>{col.label}</span>
        <span>{col.items.length}</span>
      </div>
      <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 8 }}>
        {col.items.length === 0 && <div style={{ fontSize: 11, opacity: 0.4, padding: "8px 4px" }}>Nothing here</div>}
        {col.items.map((app) => (
          <Card key={app.id} app={app} compact={compact} moveStage={moveStage} removeApp={removeApp} />
        ))}
      </div>
    </div>
  );
}

function Card({ app, compact, moveStage, removeApp }) {
  const idx = stageIndex(app.stage);
  const canBack = idx > 0;
  const canForward = idx < STAGES.length - 2;

  return (
    <div style={{ background: "#fff", border: "1px solid #23232318", borderRadius: 6, padding: compact ? "6px 8px" : "10px 10px", fontSize: 13 }}>
      <div style={{ fontWeight: 700 }}>{app.company}</div>
      <div style={{ fontSize: 12, opacity: 0.65, marginBottom: compact ? 0 : 4 }}>{app.role}</div>
      {!compact && app.notes && <div style={{ fontSize: 11, opacity: 0.5, marginBottom: 6, fontStyle: "italic" }}>{app.notes}</div>}
      {!compact && (
        <div style={{ display: "flex", gap: 4, marginTop: 6 }}>
          <button disabled={!canBack} onClick={() => moveStage(app.id, STAGES[idx - 1]?.key)} style={miniBtn(canBack)}>←</button>
          {app.stage !== "rejected" && (
            <button onClick={() => moveStage(app.id, "rejected")} style={{ ...miniBtn(true), color: "#9C6B6B" }}>reject</button>
          )}
          <button disabled={!canForward} onClick={() => moveStage(app.id, STAGES[idx + 1]?.key)} style={miniBtn(canForward)}>→</button>
          <button onClick={() => removeApp(app.id)} style={{ ...miniBtn(true), marginLeft: "auto", color: "#9C6B6B" }}>✕</button>
        </div>
      )}
    </div>
  );
}

const inputStyle = { flex: 1, border: "1px solid #23232322", borderRadius: 6, padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "inherit" };
const buttonStyle = { background: "#232323", color: "#EFEDE6", border: "none", borderRadius: 6, padding: "8px 14px", fontSize: 13, cursor: "pointer", whiteSpace: "nowrap" };
function miniBtn(enabled) {
  return { border: "1px solid #23232322", background: enabled ? "#fff" : "#f2f2f0", borderRadius: 4, padding: "3px 8px", fontSize: 11, cursor: enabled ? "pointer" : "not-allowed", opacity: enabled ? 1 : 0.4 };
}

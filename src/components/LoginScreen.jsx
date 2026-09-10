import { useState } from "react";
import Icon from "./Icon.jsx";
import logo from "../assets/logo.png";

export default function LoginScreen({ onLogin, loginError, loggingIn }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLogin = () => {
    if (!email.trim() || !password.trim()) return;
    onLogin(email.trim(), password);
  };

  return (
    <div className="dos-login-wrap">
      <div className="dos-login-card">
        <div className="dos-login-logo">
          <div className="dos-logo-mark"><img src={logo} alt="Diagnostic OS" /></div>
          <div>
            <p className="dos-login-title">Diagnostic OS</p>
            <p className="dos-login-sub">Acceso para centros diagnósticos</p>
          </div>
        </div>

        <div>
          <div className="dos-field"><label>Correo</label><input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tucorreo@centro.com" /></div>
          <div className="dos-field"><label>Contraseña</label><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" onKeyDown={(e) => e.key === "Enter" && submitLogin()} /></div>
          {loginError && <div style={{ color: "var(--red)", fontSize: 12.5, marginBottom: 8 }}>{loginError}</div>}
          <button className="dos-btn dos-btn-primary" style={{ width: "100%", justifyContent: "center" }} onClick={submitLogin} disabled={loggingIn}>
            {loggingIn ? "Ingresando…" : "Ingresar"}
          </button>
          <div className="dos-login-hint">
            Cuentas de demostración (misma contraseña <code>demo123</code>):<br />
            <code>pandrade@sanrafael.demo</code> — Dueño, Lab San Rafael<br />
            <code>rcedeno@mantasalud.demo</code> — Dueño, Manta Salud<br />
            <code>ksolorzano@mantasalud.demo</code> — Radióloga, Manta Salud
          </div>
        </div>

        <div className="dos-isolation-note">
          <Icon name="Building2" size={13} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>Las cuentas de los centros y sus colaboradores son creadas por el administrador de la plataforma. Si tu centro todavía no tiene acceso, contáctalo para que lo registre.</span>
        </div>
      </div>
    </div>
  );
}

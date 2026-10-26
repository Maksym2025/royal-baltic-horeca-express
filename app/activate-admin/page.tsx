"use client";
import { useEffect, useState } from "react";
export default function ActivateAdmin() {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    setToken(new URLSearchParams(window.location.hash.slice(1)).get("token") || "");
    window.history.replaceState(null, "", window.location.pathname);
  }, []);
  async function activate(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirm) { setMessage("Пароли не совпадают."); return; }
    setBusy(true);
    try {
      const response = await fetch("/api/admin-invitation", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const result = await response.json();
      setMessage(result.message);
      if (response.ok) { setDone(true); setToken(""); setPassword(""); setConfirm(""); }
    } catch { setMessage("Нет соединения. Попробуйте ещё раз."); }
    finally { setBusy(false); }
  }
  return <main style={{maxWidth:480,margin:"60px auto",padding:24}}>
    <p>ROYAL BALTIC · HORECA EXPRESS</p>
    <h1>Доступ администратора</h1>
    <p>Подтвердите адрес из приглашения и создайте личный пароль. Ссылка одноразовая.</p>
    {message && <p role={done ? "status" : "alert"}>{message}</p>}
    {done ? <a className="rb-primary" href="https://royal-baltic-horeca-express-git-main-maksym2025s-projects.vercel.app/live">Войти в приложение</a> :
    <form onSubmit={activate} style={{display:"grid",gap:16}}>
      <label>Новый пароль (12–128 символов)<input style={{display:"block",width:"100%",padding:12}} type={visible ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} value={password} onChange={e=>setPassword(e.target.value)}/></label>
      <label>Повторите пароль<input style={{display:"block",width:"100%",padding:12}} type={visible ? "text" : "password"} autoComplete="new-password" required minLength={12} maxLength={128} value={confirm} onChange={e=>setConfirm(e.target.value)}/></label>
      <label><input type="checkbox" checked={visible} onChange={e=>setVisible(e.target.checked)}/> Показать пароль</label>
      <button className="rb-primary" disabled={busy || !token}>{busy ? "Сохраняем…" : "Подтвердить почту и создать пароль"}</button>
      {!token && <p>Откройте персональную ссылку из письма.</p>}
    </form>}
  </main>;
}

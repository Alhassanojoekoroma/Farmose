"use client";

import { type FormEvent, useState } from "react";
import Link from "next/link";
import { authClient } from "../../lib/auth/client";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return <button type="button" disabled={busy} onClick={async () => {
    setBusy(true);
    await authClient.signOut();
    window.location.assign("/");
  }}>Sign out</button>;
}

export function AdminLogin({ initialEmail = "", verificationRequired = false }: { initialEmail?: string; verificationRequired?: boolean }) {
  const [mode, setMode] = useState<"sign-in" | "register" | "verify">(verificationRequired ? "verify" : "sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      if (mode === "verify") {
        const result = await authClient.emailOtp.verifyEmail({ email, otp: code.trim() });
        if (result.error) throw new Error(result.error.message);
        window.location.assign("/admin");
        return;
      }
      if (mode === "register") {
        const result = await authClient.signUp.email({
          email: email.trim().toLowerCase(),
          password,
          name: name.trim() || email.trim().split("@")[0],
        });
        if (result.error) throw new Error(result.error.message);
        if (result.data?.user && !result.data.user.emailVerified) {
          const sent = await authClient.sendVerificationEmail({
            email: email.trim().toLowerCase(),
            callbackURL: window.location.origin + "/admin",
          });
          if (sent.error) throw new Error(sent.error.message);
          setMode("verify");
          setMessage("Enter the verification code sent to your email.");
          return;
        }
        window.location.assign("/admin");
        return;
      }
      const result = await authClient.signIn.email({ email: email.trim().toLowerCase(), password });
      if (result.error) throw new Error(result.error.message);
      window.location.assign("/admin");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Sign-in failed. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendCode() {
    setBusy(true);
    setError("");
    try {
      const result = await authClient.sendVerificationEmail({ email, callbackURL: window.location.origin + "/admin" });
      if (result.error) throw new Error(result.error.message);
      setMessage("A new verification code has been sent.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "The code could not be sent.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-denied">
      <div className="admin-login-card">
        <img src="/farmose/img/logo.png" alt="Farmose" width={80} height={61} />
        <p>PRIVATE FARMOSE WORKSPACE</p>
        <h1>{mode === "register" ? "Create your Farmose login." : mode === "verify" ? "Verify your email." : "Sign in to manage Farmose."}</h1>
        <p>Only the owner and approved staff can access this area.</p>
        <form className="admin-login-form" onSubmit={submit}>
          {mode === "register" && <label>Full name<input required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>}
          <label>Email<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {mode === "verify"
            ? <label>Verification code<input required inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(event) => setCode(event.target.value)} /></label>
            : <label>Password<input required type="password" minLength={8} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={(event) => setPassword(event.target.value)} /></label>}
          {error && <p className="admin-login-error" role="alert">{error}</p>}
          {message && <p className="admin-login-message" role="status">{message}</p>}
          <button className="primary" disabled={busy} type="submit">{busy ? "Please wait…" : mode === "register" ? "Create account" : mode === "verify" ? "Verify email" : "Sign in"}</button>
        </form>
        {mode === "verify"
          ? <button className="admin-login-link" type="button" disabled={busy} onClick={() => void sendCode()}>Send another code</button>
          : <button className="admin-login-link" type="button" onClick={() => { setMode(mode === "sign-in" ? "register" : "sign-in"); setError(""); setMessage(""); }}>{mode === "sign-in" ? "First time? Create your Farmose login" : "Already registered? Sign in"}</button>}
        {verificationRequired && <SignOutButton />}
        <Link href="/">Return to the storefront</Link>
      </div>
    </main>
  );
}

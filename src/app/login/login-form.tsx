"use client";

import { useActionState } from "react";
import { signIn } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState(signIn, { error: null });
  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="label" htmlFor="email">E-Mail</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div>
        <label className="label" htmlFor="password">Passwort</label>
        <input className="input" id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-primary w-full py-2" disabled={pending}>
        {pending ? "Anmelden…" : "Anmelden"}
      </button>
    </form>
  );
}

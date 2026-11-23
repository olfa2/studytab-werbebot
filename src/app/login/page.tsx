import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="card w-full max-w-sm">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-kapy text-lg">🦫</span>
          <h1 className="text-lg font-bold">studytab Werbebot</h1>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginComercioContent />
    </Suspense>
  );
}

function LoginComercioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/comercio/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password.trim(),
          slug,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data?.error || "Credenciales inválidas");
        return;
      }

      /* Limpiar valores viejos */
      localStorage.removeItem("comercio_id");
      localStorage.removeItem("current_comercio_id");

      /* Guardar comercio activo */
      localStorage.setItem("comercio_id", data.comercio.id);
      localStorage.setItem("current_comercio_id", data.comercio.id);

      router.push("/comercio/promociones");
          } catch (err) {
      console.error(err);
      setError("Ocurrió un error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  }

  return (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f7fb',
      padding: 20,
    }}
  >
    <form
      onSubmit={handleLogin}
      style={{
        width: '100%',
        maxWidth: 360,
        padding: 30,
        borderRadius: 12,
        background: '#fff',
        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
      }}
    >
      <h2
        style={{
          marginBottom: 20,
          fontSize: 22,
          fontWeight: 700,
          color: '#0f172a',
        }}
      >
        Login Comercio
      </h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        style={{
          width: '100%',
          padding: 12,
          marginBottom: 12,
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          outline: 'none',
          fontSize: 14,
        }}
      />

      <div
        style={{
          position: 'relative',
          marginBottom: 12,
        }}
      >
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{
            width: '100%',
            padding: '12px 44px 12px 12px',
            border: '1px solid #cbd5e1',
            borderRadius: 8,
            outline: 'none',
            fontSize: 14,
          }}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          aria-label={
            showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'
          }
          title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            border: 'none',
            background: 'transparent',
            color: '#64748b',
            cursor: 'pointer',
          }}
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 12,
            padding: 10,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#b91c1c',
            fontSize: 14,
          }}
        >
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          background: loading ? '#94a3b8' : '#1e3a8a',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: 14,
          fontWeight: 600,
          transition: 'background 0.2s ease',
        }}
      >
        {loading ? 'Ingresando...' : 'Ingresar'}
      </button>
    </form>
  </div>
  );
}
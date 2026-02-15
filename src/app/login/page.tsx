'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [mode, setMode] = useState<'login' | 'register'>('login')
    const router = useRouter()
    const [message, setMessage] = useState('')

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setMessage('')

        if (mode === 'register') {
            const { error } = await supabase.auth.signUp({
                email,
                password,
            })
            if (error) setMessage(error.message)
            else setMessage('Revisa tu email para confirmar tu cuenta.')
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            if (error) setMessage(error.message)
            else {
                router.push('/')
                router.refresh()
            }
        }
        setLoading(false)
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
            <div className="bg-slate-900 p-8 rounded-lg shadow-xl w-full max-w-md border border-slate-800">
                <h1 className="text-2xl font-bold mb-6 text-center text-white">{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</h1>
                <form onSubmit={handleAuth} className="flex flex-col gap-4">
                    <input
                        type="email"
                        placeholder="Email"
                        className="p-3 rounded bg-slate-800 text-white border border-slate-700 focus:border-red-500 outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        className="p-3 rounded bg-slate-800 text-white border border-slate-700 focus:border-red-500 outline-none"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-red-600 hover:bg-red-700 text-white p-3 rounded font-bold transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Procesando...' : (mode === 'login' ? 'Entrar' : 'Registrarse')}
                    </button>
                </form>
                {message && <p className="mt-4 text-center text-yellow-400 text-sm">{message}</p>}
                <div className="mt-6 text-center text-sm text-slate-400">
                    {mode === 'login' ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
                    <button
                        onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage('') }}
                        className="text-red-500 hover:underline"
                    >
                        {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
                    </button>
                </div>
            </div>
        </div>
    )
}

'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { useEffect, useState } from 'react'

export default function Navbar() {
    const [user, setUser] = useState<any>(null)
    const pathname = usePathname()

    useEffect(() => {
        const getUser = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            setUser(session?.user ?? null)
        }
        getUser()

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
        })

        return () => subscription.unsubscribe()
    }, [])

    const handleLogout = async () => {
        await supabase.auth.signOut()
        setUser(null)
        window.location.href = '/login'
    }

    const links = [
        { href: '/', label: 'Dashboard' },
        { href: '/social', label: 'Social' },
        { href: '/logger', label: 'Registrar Visionado' },
    ]

    return (
        <nav className="bg-slate-900 border-b border-slate-800 text-white p-4 shadow-md sticky top-0 z-50">
            <div className="container mx-auto flex justify-between items-center">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">CineLog</Link>
                <div className="flex gap-6 items-center">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`text-sm font-medium transition-colors hover:text-red-400 ${pathname === link.href ? 'text-red-500' : 'text-slate-300'}`}
                        >
                            {link.label}
                        </Link>
                    ))}
                    {user ? (
                        <div className="flex gap-4 items-center pl-4 border-l border-slate-700">
                            <span className="text-xs text-slate-400 hidden md:block">{user.email}</span>
                            <button onClick={handleLogout} className="bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-600/20 px-4 py-1.5 rounded-full text-sm font-medium transition-all">
                                Salir
                            </button>
                        </div>
                    ) : (
                        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full text-sm font-medium transition-all shadow-lg shadow-blue-900/20">
                            Entrar
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    )
}

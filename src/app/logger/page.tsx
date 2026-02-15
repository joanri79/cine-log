'use client'
import { useState } from 'react'
import { searchMulti, getDetails } from '@/lib/tmdb'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoggerPage() {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<any[]>([])
    const [selected, setSelected] = useState<any>(null)
    const [form, setForm] = useState({ platform: 'Netflix', note: 5, comment: '' })
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!query) return
        try {
            const data = await searchMulti(query)
            setResults(data.results || [])
            setSelected(null)
            setError('')
        } catch (err) {
            setError('Error al buscar en TMDB')
        }
    }

    const handleSelect = async (item: any) => {
        try {
            const details = await getDetails(item.id, item.media_type)
            setSelected({ ...item, ...details })
            setResults([])
        } catch (err) {
            setError('Error al obtener detalles')
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            setError('Debes iniciar sesión')
            setLoading(false)
            return
        }

        const contentData = {
            tmdb_id: selected.id,
            titulo: selected.title || selected.name,
            tipo: selected.media_type,
            año: parseInt((selected.release_date || selected.first_air_date || '0').substring(0, 4)),
            genero: selected.genres?.map((g: any) => g.name).join(', ') || '',
            duracion: selected.runtime || (selected.episode_run_time ? selected.episode_run_time[0] : 0) || 0
        }

        const { data: content, error: contentError } = await supabase
            .from('contenidos')
            .upsert(contentData, { onConflict: 'tmdb_id' })
            .select()
            .single()

        if (contentError) {
            console.error(contentError)
            setError('Error al guardar el contenido')
            setLoading(false)
            return
        }

        const { error: visionError } = await supabase.from('visionados').insert({
            usuario_id: user.id,
            contenido_id: content.id,
            plataforma_id: form.platform,
            nota: form.note,
            comentarios: form.comment
        })

        if (visionError) {
            console.error(visionError)
            setError('Error al guardar el visionado')
        } else {
            router.push('/')
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <div className="max-w-2xl mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Registrar Visionado</h1>

            {error && <div className="bg-red-500/10 text-red-500 p-4 rounded mb-6 border border-red-500/20">{error}</div>}

            {!selected ? (
                <div className="space-y-6">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Buscar película o serie..."
                            className="flex-1 p-3 rounded bg-slate-800 border border-slate-700 text-white focus:border-red-500 outline-none placeholder:text-slate-500"
                        />
                        <button type="submit" className="bg-red-600 px-6 py-3 rounded text-white font-bold hover:bg-red-700 transition-colors">Buscar</button>
                    </form>

                    <div className="grid gap-4">
                        {results.filter((i: any) => i.media_type === 'movie' || i.media_type === 'tv').map((item: any) => (
                            <div key={item.id} onClick={() => handleSelect(item)} className="p-4 bg-slate-900 rounded border border-slate-800 hover:border-red-500 cursor-pointer flex gap-4 transition-all group">
                                {item.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w92${item.poster_path}`} alt={item.title || item.name} className="w-16 h-24 object-cover rounded" />
                                ) : (
                                    <div className="w-16 h-24 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-500">No Image</div>
                                )}
                                <div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-red-400 transition-colors">{item.title || item.name}</h3>
                                    <p className="text-slate-400">{item.release_date || item.first_air_date} • {item.media_type === 'movie' ? 'Película' : 'Serie'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 animate-in fade-in zoom-in duration-300">
                    <div className="flex gap-4 mb-6">
                        {selected.poster_path && (
                            <img src={`https://image.tmdb.org/t/p/w154${selected.poster_path}`} alt={selected.title || selected.name} className="w-32 h-48 object-cover rounded shadow-lg" />
                        )}
                        <div>
                            <h2 className="text-2xl font-bold text-white mb-2">{selected.title || selected.name}</h2>
                            <p className="text-slate-300 mb-1">{selected.genres?.map((g: any) => g.name).join(', ')}</p>
                            <div className="flex gap-2 text-sm text-slate-400">
                                <span>{selected.release_date || selected.first_air_date}</span>
                                <span>•</span>
                                <span>{selected.runtime || (selected.episode_run_time ? selected.episode_run_time[0] : '?')} min</span>
                            </div>
                            <button onClick={() => setSelected(null)} className="mt-4 text-sm text-red-500 hover:text-red-400 underline">Cambiar selección</button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Plataforma</label>
                            <select
                                className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500"
                                value={form.platform}
                                onChange={e => setForm({ ...form, platform: e.target.value })}
                            >
                                {['Cine', 'Netflix', 'Prime Video', 'Disney+', 'HBO Max', 'Apple TV', 'Sky Showtime', 'Televisión'].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Nota (0-10)</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500"
                                value={form.note}
                                onChange={e => setForm({ ...form, note: parseInt(e.target.value) })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-1">Comentario</label>
                            <textarea
                                className="w-full p-3 rounded bg-slate-800 border border-slate-700 text-white outline-none focus:border-red-500 min-h-[100px]"
                                value={form.comment}
                                onChange={e => setForm({ ...form, comment: e.target.value })}
                            />
                        </div>

                        <button type="submit" disabled={loading} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold p-3 rounded transition-colors disabled:opacity-50">
                            {loading ? 'Guardando...' : 'Guardar Visionado'}
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}

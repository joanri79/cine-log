'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import EditLogModal from '@/components/EditLogModal'

export default function HistoryPage() {
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [editingLog, setEditingLog] = useState<any>(null)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    useEffect(() => {
        fetchLogs()
    }, [])

    const fetchLogs = async () => {
        setLoading(true)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase
            .from('visionados')
            .select(`
                *,
                contenidos (
                    titulo,
                    genero,
                    año,
                    tipo,
                    poster_path,
                    duracion
                )
            `)
            .eq('usuario_id', user.id)
            .order('fecha_hora', { ascending: false })

        if (data) setLogs(data)
        setLoading(false)
    }

    const handleDelete = async (id: number) => {
        if (!confirm('¿Estás seguro de que quieres eliminar este registro?')) return

        const { error } = await supabase
            .from('visionados')
            .delete()
            .eq('id', id)

        if (!error) {
            setLogs(prev => prev.filter(l => l.id !== id))
        } else {
            alert('Error al eliminar')
        }
    }

    const handleEditClick = (log: any) => {
        setEditingLog(log)
        setIsEditModalOpen(true)
    }

    const handleUpdateLog = async (updatedLog: any) => {
        const { error } = await supabase
            .from('visionados')
            .update({
                nota: updatedLog.nota,
                fecha_hora: updatedLog.fecha_hora,
                plataforma_id: updatedLog.plataforma_id,
                comentarios: updatedLog.comentarios
            })
            .eq('id', updatedLog.id)

        if (error) {
            throw error
        }

        // Update local state and close
        setLogs(prev => prev.map(l => l.id === updatedLog.id ? updatedLog : l))
        setEditingLog(null)
    }

    const filteredLogs = logs.filter(log =>
        log.contenidos?.titulo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.plataforma_id?.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) return <div className="p-10 text-center text-white">Cargando historial...</div>

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-white">Historial Completo</h1>
                <div className="text-slate-400 text-sm">
                    Total: <span className="text-white font-bold">{logs.length}</span>
                </div>
            </div>

            <div className="mb-6 relative">
                <input
                    type="text"
                    placeholder="Buscar por título o plataforma..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-red-500"
                />
                <span className="absolute left-3 top-3.5 text-slate-500">🔍</span>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="p-10 text-center text-slate-500">No se encontraron registros.</div>
                ) : (
                    <div className="divide-y divide-slate-800">
                        {filteredLogs.map(log => (
                            <div key={log.id} className="p-4 flex gap-4 items-center hover:bg-slate-800/50 transition-colors group">
                                {log.contenidos?.poster_path ? (
                                    <img src={`https://image.tmdb.org/t/p/w92${log.contenidos.poster_path}`} alt={log.contenidos.titulo} className="w-16 h-24 object-cover rounded shadow-md" />
                                ) : (
                                    <div className="w-16 h-24 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-500">No Img</div>
                                )}

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-lg text-white truncate">{log.contenidos?.titulo}</h3>
                                    <div className="flex flex-wrap gap-2 text-sm text-slate-400 mt-1">
                                        <span className="text-white font-medium">{new Date(log.fecha_hora).toLocaleDateString()}</span>
                                        <span>•</span>
                                        <span className="px-2 py-0.5 bg-slate-800 rounded text-xs border border-slate-700">{log.plataforma_id}</span>
                                        <span>•</span>
                                        <span className={log.nota >= 8 ? 'text-green-500 font-bold' : log.nota >= 5 ? 'text-yellow-500 font-bold' : 'text-red-500 font-bold'}>
                                            {log.nota}/10
                                        </span>
                                    </div>
                                    {log.comentarios && (
                                        <p className="text-sm text-slate-500 mt-2 italic line-clamp-2">"{log.comentarios}"</p>
                                    )}
                                </div>

                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => handleEditClick(log)}
                                        className="p-2 hover:bg-slate-700 rounded text-blue-400 hover:text-blue-300 transition-colors"
                                        title="Editar"
                                    >
                                        ✏️
                                    </button>
                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        className="p-2 hover:bg-red-900/30 rounded text-red-500 hover:text-red-400 transition-colors"
                                        title="Eliminar"
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <EditLogModal
                log={editingLog}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleUpdateLog}
            />
        </div>
    )
}

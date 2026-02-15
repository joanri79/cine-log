'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

interface EditLogModalProps {
    log: any
    isOpen: boolean
    onClose: () => void
    onSave: (updatedLog: any) => Promise<void>
}

export default function EditLogModal({ log, isOpen, onClose, onSave }: EditLogModalProps) {
    const [formData, setFormData] = useState({
        nota: 0,
        fecha_hora: '',
        plataforma_id: '',
        comentarios: ''
    })

    const [platforms, setPlatforms] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (log) {
            setFormData({
                nota: log.nota,
                fecha_hora: new Date(log.fecha_hora).toISOString().split('T')[0],
                plataforma_id: log.plataforma_id,
                comentarios: log.comentarios || ''
            })
        }
    }, [log])

    useEffect(() => {
        const fetchPlatforms = async () => {
            const { data } = await supabase.from('plataformas').select('*').order('descripcion')
            if (data) setPlatforms(data)
        }
        if (isOpen) fetchPlatforms()
    }, [isOpen])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            await onSave({
                ...log,
                ...formData,
                fecha_hora: new Date(formData.fecha_hora).toISOString()
            })
            onClose()
        } catch (error) {
            console.error(error)
            alert('Error al guardar')
        } finally {
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
                <h2 className="text-xl font-bold text-white mb-4">Editar Visionado</h2>
                <h3 className="text-purple-400 text-sm mb-6">{log.contenidos?.titulo}</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Plataforma</label>
                        <select
                            value={formData.plataforma_id}
                            onChange={e => setFormData({ ...formData, plataforma_id: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        >
                            {platforms.map(p => (
                                <option key={p.codigo} value={p.codigo}>{p.descripcion || p.codigo}</option>
                            ))}
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={formData.fecha_hora}
                                onChange={e => setFormData({ ...formData, fecha_hora: e.target.value })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1">Nota (0-10)</label>
                            <input
                                type="number"
                                min="0"
                                max="10"
                                value={formData.nota}
                                onChange={e => setFormData({ ...formData, nota: Number(e.target.value) })}
                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-slate-400 mb-1">Comentario</label>
                        <textarea
                            value={formData.comentarios}
                            onChange={e => setFormData({ ...formData, comentarios: e.target.value })}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-purple-500 h-24"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg font-medium transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-bold transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

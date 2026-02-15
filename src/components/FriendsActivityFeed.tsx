import { ActivityLog } from '@/lib/social'

interface FriendsActivityFeedProps {
    activities: ActivityLog[]
}

export default function FriendsActivityFeed({ activities }: FriendsActivityFeedProps) {
    if (!activities || activities.length === 0) {
        return (
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 shadow-lg mb-6">
                <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                    Actividad de Amigos
                </h2>
                <div className="text-center text-slate-500 py-8">
                    <p>No hay actividad reciente.</p>
                    <p className="text-xs mt-2">¡Añade amigos para ver qué están viendo!</p>
                </div>
            </div>
        )
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'hace un momento'
        if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} min`
        if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} h`
        return date.toLocaleDateString()
    }

    const getInitials = (name: string, surname: string) => {
        return `${name?.charAt(0) || ''}${surname?.charAt(0) || ''}`.toUpperCase()
    }

    return (
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
                Actividad de Amigos
            </h2>

            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                {activities.map((activity) => (
                    <div key={activity.id} className="relative pl-4 border-l border-slate-800 hover:border-purple-500/50 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0">
                                {getInitials(activity.usuarios.nombre, activity.usuarios.apellido1)}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-slate-300">
                                    <span className="font-bold text-white hover:text-purple-400 cursor-pointer transition-colors">
                                        {activity.usuarios.nickname || activity.usuarios.nombre}
                                    </span>
                                    {' '}vio{' '}
                                    <span className="font-bold text-white">
                                        {activity.contenidos.titulo}
                                    </span>
                                </p>

                                <div className="flex items-center gap-2 mt-1">
                                    <div className="flex items-center text-yellow-500 text-xs">
                                        <span>★</span>
                                        <span className="font-bold ml-1">{activity.nota}</span>
                                    </div>
                                    <span className="text-xs text-slate-500">• {formatTimeAgo(activity.fecha_hora)}</span>
                                </div>

                                {activity.comentarios && (
                                    <p className="text-xs text-slate-500 mt-2 italic bg-slate-800/50 p-2 rounded border border-slate-800/50 line-clamp-2">
                                        "{activity.comentarios}"
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import {
    searchUsers,
    sendFriendRequest,
    getFriendRequests,
    respondToFriendRequest,
    getFriends,
    removeFriend,
    Profile,
    FriendRequest
} from '@/lib/social'

export default function SocialPage() {
    const [user, setUser] = useState<any>(null)
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends')
    const [friends, setFriends] = useState<Profile[]>([])
    const [requests, setRequests] = useState<FriendRequest[]>([])
    const [searchResults, setSearchResults] = useState<Profile[]>([])
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)

    // Setup & Fetch Data
    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (user) {
                setUser(user)
                await loadData(user.id)
            }
            setLoading(false)
        }
        init()
    }, [])

    const loadData = async (userId: string) => {
        const [f, r] = await Promise.all([
            getFriends(userId),
            getFriendRequests(userId)
        ])
        setFriends(f)
        setRequests(r)
    }

    // Handlers
    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || searchQuery.length < 3) return
        const results = await searchUsers(searchQuery, user.id)
        setSearchResults(results)
    }

    const handleSendRequest = async (targetId: string) => {
        if (!user) return
        await sendFriendRequest(user.id, targetId)
        // Optimization: Remove from search results to indicate sent
        setSearchResults(prev => prev.filter(u => u.id !== targetId))
        alert('Solicitud enviada!')
    }

    const handleRespond = async (requestId: string, accept: boolean) => {
        if (!user) return
        await respondToFriendRequest(requestId, accept)
        await loadData(user.id) // Reload to update lists
    }

    const handleRemoveFriend = async (friendId: string) => {
        if (!user || !confirm('¿Seguro que quieres eliminar a este amigo?')) return
        await removeFriend(user.id, friendId)
        await loadData(user.id)
    }

    if (loading) return <div className="p-10 text-center">Cargando...</div>

    return (
        <div className="max-w-4xl mx-auto py-8 px-4 animate-in fade-in">
            <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
                <span className="text-purple-500">👥</span> Social
            </h1>

            {/* Tabs */}
            <div className="flex gap-4 mb-8 border-b border-slate-700 pb-1">
                <button
                    onClick={() => setActiveTab('friends')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'friends' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                >
                    Amigos ({friends.length})
                </button>
                <button
                    onClick={() => setActiveTab('requests')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'requests' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                >
                    Solicitudes {requests.length > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{requests.length}</span>}
                </button>
                <button
                    onClick={() => setActiveTab('search')}
                    className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'search' ? 'text-purple-400 border-b-2 border-purple-400' : 'text-slate-400 hover:text-white'}`}
                >
                    Buscar
                </button>
            </div>

            {/* Content */}
            <div className="bg-slate-900/50 backdrop-blur-md rounded-xl border border-slate-800 min-h-[400px] p-6">

                {/* 1. Friends List */}
                {activeTab === 'friends' && (
                    <div className="space-y-4">
                        {friends.length === 0 ? (
                            <div className="text-center text-slate-500 py-10">
                                <p>No tienes amigos aún.</p>
                                <button onClick={() => setActiveTab('search')} className="text-purple-400 hover:underline mt-2">Buscar gente</button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {friends.map(friend => (
                                    <div key={friend.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-lg border border-slate-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white">
                                                {friend.nombre?.[0]}{friend.apellido1?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{friend.nickname || friend.nombre}</p>
                                                <p className="text-xs text-slate-400">{friend.nombre} {friend.apellido1}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveFriend(friend.id)}
                                            className="text-red-400 hover:text-red-300 text-sm px-3 py-1 rounded hover:bg-red-900/20"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* 2. Requests List */}
                {activeTab === 'requests' && (
                    <div className="space-y-4">
                        {requests.length === 0 ? (
                            <p className="text-center text-slate-500 py-10">No tienes solicitudes pendientes.</p>
                        ) : (
                            requests.map(req => (
                                <div key={req.id} className="flex justify-between items-center p-4 bg-slate-800 rounded-lg border border-slate-700 animate-in fade-in slide-in-from-left-4">
                                    <div className="flex items-center gap-3">
                                        {/* Note: 'usuarios' is the sender object from the join */}
                                        <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                            ?
                                        </div>
                                        <div>
                                            {/* We need to cast or access properly based on the join query structure */}
                                            <p className="font-bold text-white">Solicitud de Amistad</p>
                                            <p className="text-xs text-slate-400">Quiere ser tu amigo</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRespond(req.id, true)}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Aceptar
                                        </button>
                                        <button
                                            onClick={() => handleRespond(req.id, false)}
                                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Rechazar
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* 3. Search */}
                {activeTab === 'search' && (
                    <div>
                        <form onSubmit={handleSearch} className="flex gap-4 mb-8">
                            <input
                                type="text"
                                placeholder="Buscar por nickname o email..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors"
                            />
                            <button
                                type="submit"
                                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-bold transition-colors"
                            >
                                Buscar
                            </button>
                        </form>

                        <div className="space-y-4">
                            {searchResults.length > 0 ? (
                                searchResults.map(result => (
                                    <div key={result.id} className="flex justify-between items-center p-4 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-purple-500/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                                {result.nickname?.[0] || result.nombre?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-white">{result.nickname}</p>
                                                <p className="text-xs text-slate-400">{result.nombre} {result.apellido1}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleSendRequest(result.id)}
                                            className="text-purple-400 hover:text-white border border-purple-500 hover:bg-purple-600 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                                        >
                                            Enviar Solicitud
                                        </button>
                                    </div>
                                ))
                            ) : searchQuery && (
                                <p className="text-center text-slate-500">No se encontraron usuarios.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

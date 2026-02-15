import { supabase } from '@/lib/supabaseClient'

export interface ActivityLog {
    id: number
    fecha_hora: string
    nota: number
    comentarios: string
    usuarios: {
        nombre: string
        nickname: string
        apellido1: string
    }
    contenidos: {
        titulo: string
        tipo: string
        poster_path: string
    }
}

export interface Profile {
    id: string
    nickname: string
    nombre: string
    apellido1: string
    mail: string
}

export interface FriendRequest {
    id: string
    user_id: string
    friend_id: string
    status: string
    created_at: string
    usuarios: Profile // The sender
}

export async function getFriendsActivity(userId: string): Promise<ActivityLog[]> {
    // 1. Get list of friend IDs
    const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .eq('status', 'accepted')
        .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (friendsError || !friendships) {
        console.error('Error fetching friends:', friendsError)
        return []
    }

    // Extract friend IDs
    const friendIds = friendships.map(f =>
        f.user_id === userId ? f.friend_id : f.user_id
    )

    if (friendIds.length === 0) return []

    // 2. Fetch activity from these friends
    const { data: activity, error: activityError } = await supabase
        .from('visionados')
        .select(`
      id,
      fecha_hora,
      nota,
      comentarios,
      usuarios (
        nombre,
        nickname,
        apellido1
      ),
      contenidos (
        titulo,
        tipo,
        poster_path
      )
    `)
        .in('usuario_id', friendIds)
        .order('fecha_hora', { ascending: false })
        .limit(10)

    if (activityError) {
        console.error('Error fetching activity:', activityError)
        return []
    }

    return activity as any[]
}

// --- New Functions ---

export async function searchUsers(query: string, currentUserId: string): Promise<Profile[]> {
    if (!query || query.length < 3) return []

    // 1. Find users matching query
    const { data: users, error } = await supabase
        .from('usuarios')
        .select('id, nickname, nombre, apellido1, mail')
        .or(`nickname.ilike.%${query}%,mail.ilike.%${query}%`)
        .neq('id', currentUserId)
        .limit(10)

    if (error) {
        console.error('Error searching users:', error)
        return []
    }

    if (!users || users.length === 0) return []

    // 2. Filter out existing friends or pending requests
    // Fetch my connections
    const { data: connections } = await supabase
        .from('friendships')
        .select('user_id, friend_id')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)

    const connectedIds = new Set<string>()
    if (connections) {
        connections.forEach(c => {
            connectedIds.add(c.user_id === currentUserId ? c.friend_id : c.user_id)
        })
    }

    return users.filter(u => !connectedIds.has(u.id))
}

export async function sendFriendRequest(currentUserId: string, targetId: string) {
    const { error } = await supabase
        .from('friendships')
        .insert({
            user_id: currentUserId,
            friend_id: targetId,
            status: 'pending'
        })

    return { error }
}

export async function getFriendRequests(currentUserId: string): Promise<FriendRequest[]> {
    // Fetch requests where I am the friend_id (receiver) and status is pending
    const { data, error } = await supabase
        .from('friendships')
        .select(`
      *,
      usuarios:user_id (
        id, nickname, nombre, apellido1, mail
      )
    `)
        .eq('friend_id', currentUserId)
        .eq('status', 'pending')

    if (error) {
        console.error('Error fetching requests:', error)
        return []
    }

    // Transform to flatten the 'usuarios' object if needed or keep as is
    // Using 'usuarios' alias in select to map the sender profile
    return data as any[]
}

export async function respondToFriendRequest(requestId: string, accept: boolean) {
    if (accept) {
        const { error } = await supabase
            .from('friendships')
            .update({ status: 'accepted' })
            .eq('id', requestId)
        return { error }
    } else {
        const { error } = await supabase
            .from('friendships')
            .delete()
            .eq('id', requestId)
        return { error }
    }
}

export async function getFriends(currentUserId: string): Promise<Profile[]> {
    const { data: friendships, error } = await supabase
        .from('friendships')
        .select(`
      user_id, 
      friend_id,
      user:user_id (id, nickname, nombre, apellido1, mail),
      friend:friend_id (id, nickname, nombre, apellido1, mail)
    `)
        .eq('status', 'accepted')
        .or(`user_id.eq.${currentUserId},friend_id.eq.${currentUserId}`)

    if (error || !friendships) return []

    // Map to a single list of profiles
    return friendships.map((f: any) => {
        return f.user_id === currentUserId ? f.friend : f.user
    })
}

export async function removeFriend(currentUserId: string, friendId: string) {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(user_id.eq.${currentUserId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${currentUserId})`)

    return { error }
}

'use server'

const TMDB_API_KEY = process.env.TMDB_API_KEY!;
const BASE_URL = 'https://api.themoviedb.org/3';

export async function searchMulti(query: string) {
    const res = await fetch(`${BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=es-ES`);
    if (!res.ok) throw new Error('Failed to fetch from TMDB');
    return res.json();
}

export async function getDetails(id: number, type: 'movie' | 'tv') {
    const res = await fetch(`${BASE_URL}/${type}/${id}?api_key=${TMDB_API_KEY}&language=es-ES`);
    if (!res.ok) throw new Error('Failed to fetch details');
    return res.json();
}

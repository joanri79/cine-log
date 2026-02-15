'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [logs, setLogs] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      if (!user) {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('visionados')
        .select(`
          *,
          contenidos (
            titulo,
            genero,
            año,
            tipo
          )
        `)
        .eq('usuario_id', user.id)
        .order('fecha_hora', { ascending: false })

      if (data) setLogs(data)
      setLoading(false)
    }
    getData()
  }, [])

  if (loading) return <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500"></div></div>
  if (!user) return (
    <div className="text-center py-20 animate-in fade-in zoom-in">
      <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-4">Bienvenido a CineLog</h1>
      <p className="text-slate-400 mb-8 max-w-md mx-auto">Tu diario personal de películas y series. Inicia sesión para comenzar a registrar lo que has visto.</p>
      <a href="/login" className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg shadow-red-900/20">Comenzar</a>
    </div>
  )

  // Process Data
  const logsByYearMonth = logs.reduce((acc: any, log: any) => {
    const date = new Date(log.fecha_hora)
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  const dataYearMonth = Object.entries(logsByYearMonth)
    .sort((a: any, b: any) => a[0].localeCompare(b[0]))
    .map(([key, value]) => ({ name: key, count: value }))

  const logsByPlatform = logs.reduce((acc: any, log: any) => {
    const p = log.plataforma_id || 'Desconocido'
    acc[p] = (acc[p] || 0) + 1
    return acc
  }, {})

  const dataPlatform = Object.entries(logsByPlatform).map(([key, value]) => ({ name: key, value }))

  const logsByGenre = logs.reduce((acc: any, log: any) => {
    const genres = log.contenidos?.genero?.split(', ') || ['Desconocido']
    genres.forEach((g: string) => {
      acc[g] = (acc[g] || 0) + 1
    })
    return acc
  }, {})

  const dataGenre = Object.entries(logsByGenre)
    .map(([key, value]) => ({ name: key, value }))
    .sort((a: any, b: any) => b.value - a.value)
    .slice(0, 5)

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899', '#6366f1'];

  return (
    <div className="space-y-8 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Mi Dashboard</h1>
        <div className="bg-slate-900 px-4 py-2 rounded-full border border-slate-800 text-sm font-medium text-slate-300">
          Total visto: <span className="text-white font-bold ml-1">{logs.length}</span> titles
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Visionados por Mes</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataYearMonth}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="count" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Por Plataforma</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataPlatform}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {dataPlatform.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} formatter={(value) => <span style={{ color: '#94a3b8' }}>{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 md:col-span-2 shadow-xl">
          <h2 className="text-xl font-bold text-white mb-4">Top Géneros</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataGenre} layout="vertical">
                <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={120} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#1e293b' }} />
                <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-lg border border-slate-800 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-4">Últimos Visionados</h2>
        <div className="space-y-4">
          {logs.slice(0, 5).map((log: any) => (
            <div key={log.id} className="flex justify-between items-center border-b border-slate-800 pb-2 last:border-0 hover:bg-slate-800/50 p-2 rounded transition-colors">
              <div>
                <h3 className="font-bold text-white">{log.contenidos?.titulo}</h3>
                <p className="text-sm text-slate-400">
                  <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: COLORS[Object.keys(logsByPlatform).indexOf(log.plataforma_id) % COLORS.length] || '#ccc' }}></span>
                  {log.plataforma_id} • {new Date(log.fecha_hora).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                <span className={`text-xl font-bold ${log.nota >= 7 ? 'text-green-500' : log.nota >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {log.nota}
                </span>
              </div>
            </div>
          ))}
        </div>
        {logs.length > 5 && (
          <div className="mt-4 text-center">
            <button className="text-sm text-slate-400 hover:text-white transition-colors">Ver todos</button>
          </div>
        )}
      </div>
    </div>
  )
}

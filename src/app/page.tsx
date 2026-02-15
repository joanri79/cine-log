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
  const totalRuntime = logs.reduce((acc, log) => acc + (log.contenidos?.duracion || 0), 0)
  const totalHours = Math.round(totalRuntime / 60)
  const movieCount = logs.filter(l => l.contenidos?.tipo === 'movie').length
  const showCount = logs.filter(l => l.contenidos?.tipo === 'tv').length

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
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-600 to-orange-600 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-4xl font-extrabold text-white mb-2">Mi Dashboard</h1>
          <p className="text-red-100/90 text-lg">Resumen de tu actividad cinéfila</p>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 hover:border-red-500/50 transition-all group">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Películas</p>
          <p className="text-3xl font-bold text-white mt-1 group-hover:text-red-400 transition-colors">{movieCount}</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 hover:border-orange-500/50 transition-all group">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Series</p>
          <p className="text-3xl font-bold text-white mt-1 group-hover:text-orange-400 transition-colors">{showCount}</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 hover:border-yellow-500/50 transition-all group">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Horas Totales</p>
          <p className="text-3xl font-bold text-white mt-1 group-hover:text-yellow-400 transition-colors">{totalHours}h</p>
        </div>
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 hover:border-green-500/50 transition-all group">
          <p className="text-slate-400 text-sm font-medium uppercase tracking-wider">Género Top</p>
          <p className="text-xl font-bold text-white mt-2 truncate group-hover:text-green-400 transition-colors">
            {dataGenre.length > 0 ? dataGenre[0].name : '-'}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Charts Column */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 shadow-lg">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-red-500 rounded-full"></span>
              Actividad Reciente
            </h2>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataYearMonth}>
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '12px', color: '#fff', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)' }}
                    cursor={{ fill: '#1e293b' }}
                  />
                  <Bar dataKey="count" fill="#ef4444" radius={[6, 6, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                Plataformas
              </h2>
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
                      stroke="none"
                    >
                      {dataPlatform.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} itemStyle={{ color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-yellow-500 rounded-full"></span>
                Géneros
              </h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dataGenre} layout="vertical">
                    <XAxis type="number" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={100} stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#fff' }} cursor={{ fill: '#1e293b' }} />
                    <Bar dataKey="value" fill="#eab308" radius={[0, 4, 4, 0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Logs Column */}
        <div className="bg-slate-900/50 backdrop-blur-md p-6 rounded-xl border border-slate-800 shadow-lg h-fit">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
            Últimos Visionados
          </h2>
          <div className="space-y-4">
            {logs.slice(0, 5).map((log: any) => (
              <div key={log.id} className="flex gap-4 items-center group p-3 rounded-lg hover:bg-slate-800 transition-all border border-transparent hover:border-slate-700">
                {log.contenidos?.poster_path ? (
                  <img src={`https://image.tmdb.org/t/p/w92${log.contenidos.poster_path}`} alt={log.contenidos.titulo} className="w-12 h-18 object-cover rounded shadow-md group-hover:scale-105 transition-transform" />
                ) : (
                  <div className="w-12 h-18 bg-slate-800 rounded flex items-center justify-center text-xs text-slate-500">No img</div>
                )}

                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white truncate group-hover:text-blue-400 transition-colors">{log.contenidos?.titulo}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                      {log.plataforma_id}
                    </span>
                    <span>{new Date(log.fecha_hora).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`text-lg font-bold ${log.nota >= 8 ? 'text-green-500' : log.nota >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                    {log.nota}
                  </span>
                  <span className="text-[10px] text-slate-500">/10</span>
                </div>
              </div>
            ))}
          </div>
          {logs.length > 5 && (
            <div className="mt-6 text-center">
              <button className="text-sm font-medium text-slate-400 hover:text-white transition-colors border-b border-dashed border-slate-600 hover:border-white pb-0.5">
                Ver historial completo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

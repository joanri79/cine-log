'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getDetails } from '@/lib/tmdb'

export default function FixImagesPage() {
    const [logs, setLogs] = useState<string[]>([])
    const [progress, setProgress] = useState(0)
    const [total, setTotal] = useState(0)
    const [fixing, setFixing] = useState(false)

    const addLog = (msg: string) => setLogs(prev => [...prev, msg])

    const runFix = async () => {
        setFixing(true)
        setLogs([])
        addLog('Starting fix process...')

        // 1. Get contents with missing poster_path
        // Note: checking for null or empty string
        const { data: contents, error } = await supabase
            .from('contenidos')
            .select('*')
            .or('poster_path.is.null,poster_path.eq.""')

        if (error) {
            addLog(`Error fetching contents: ${error.message}`)
            setFixing(false)
            return
        }

        if (!contents || contents.length === 0) {
            addLog('No contents found with missing posters.')
            setFixing(false)
            return
        }

        setTotal(contents.length)
        addLog(`Found ${contents.length} items to fix.`)

        for (let i = 0; i < contents.length; i++) {
            const item = contents[i]
            setProgress(i + 1)
            addLog(`Processing: ${item.titulo} (${item.tmdb_id})...`)

            try {
                // 2. Fetch details from TMDB
                const details = await getDetails(item.tmdb_id, item.tipo)

                if (details && details.poster_path) {
                    // 3. Update Supabase
                    const { error: updateError } = await supabase
                        .from('contenidos')
                        .update({ poster_path: details.poster_path })
                        .eq('id', item.id)

                    if (updateError) {
                        addLog(`Failed to update ${item.titulo}: ${updateError.message}`)
                    } else {
                        addLog(`Updated ${item.titulo} => ${details.poster_path}`)
                    }
                } else {
                    addLog(`No poster found for ${item.titulo}`)
                }
            } catch (err: any) {
                addLog(`Error processing ${item.titulo}: ${err.message}`)
            }

            // Small delay to avoid hitting rate limits too hard
            await new Promise(r => setTimeout(r, 200))
        }

        addLog('Finished!')
        setFixing(false)
    }

    return (
        <div className="max-w-2xl mx-auto py-10 px-4">
            <h1 className="text-3xl font-bold mb-6 text-white">Fix Missing Images</h1>

            {!fixing && progress === 0 && (
                <button
                    onClick={runFix}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold"
                >
                    Start Backfill
                </button>
            )}

            {fixing && (
                <div className="mb-6">
                    <div className="flex justify-between text-slate-400 mb-2">
                        <span>Progress</span>
                        <span>{progress} / {total}</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden">
                        <div
                            className="bg-blue-500 h-full transition-all duration-300"
                            style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
                        ></div>
                    </div>
                </div>
            )}

            <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm h-96 overflow-y-auto border border-slate-800 text-slate-300">
                {logs.length === 0 ? (
                    <span className="text-slate-500">Logs will appear here...</span>
                ) : (
                    logs.map((log, i) => <div key={i}>{log}</div>)
                )}
            </div>

            {!fixing && progress > 0 && (
                <div className="mt-6 text-center">
                    <p className="text-green-500 font-bold mb-4">Process Completed!</p>
                    <a href="/" className="text-blue-400 hover:underline">Return to Dashboard</a>
                </div>
            )}
        </div>
    )
}

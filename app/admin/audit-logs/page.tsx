'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface AuditLog {
  id: string
  actor_email: string
  action_type: string
  target_resource: string
  target_id: string
  metadata: any
  timestamp: string
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function loadLogs() {
      setLoading(true)
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .select('*')
        .order('timestamp', { ascending: false })

      if (!error && data) {
        setLogs(data as AuditLog[])
      }
      setLoading(false)
    }

    loadLogs()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">
            Immutable System Audit Logs
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Read-only system trace of all administrative status overrides and privilege updates
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              Fetching audit records from Supabase...
            </div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              No audit records logged yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">Timestamp</th>
                    <th className="py-4 px-6">Actor</th>
                    <th className="py-4 px-6">Action</th>
                    <th className="py-4 px-6">Resource / Target</th>
                    <th className="py-4 px-6">Metadata Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs font-mono text-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition">
                      <td className="py-4 px-6 text-gray-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-bold text-emerald-600">{log.actor_email}</td>
                      <td className="py-4 px-6">
                        <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-bold">
                          {log.action_type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {log.target_resource} ({log.target_id.slice(0, 8)}...)
                      </td>
                      <td className="py-4 px-6 text-[11px] text-gray-500 max-w-xs truncate">
                        {JSON.stringify(log.metadata)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

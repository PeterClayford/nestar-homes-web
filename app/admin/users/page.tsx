'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  phone_number: string | null
  role: 'client' | 'landlord' | 'property_manager' | 'broker' | 'admin' | 'tech_auditor'
  status: 'active' | 'under_review' | 'frozen' | 'banned'
  is_verified: boolean
  created_at: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null)

  const supabase = createClient()

  const loadUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      setMessage({ type: 'error', text: `Failed to fetch users: ${error.message}` })
    } else if (data) {
      setUsers(data as UserProfile[])
    }
    setLoading(false)
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const updateUser = async (
    userId: string,
    newRole: UserProfile['role'],
    newStatus: UserProfile['status'],
    isVerified: boolean
  ) => {
    setUpdatingId(userId)
    setMessage(null)

    const { error } = await supabase
      .from('profiles')
      .update({
        role: newRole,
        status: newStatus,
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      setMessage({ type: 'error', text: `Update failed: ${error.message}` })
    } else {
      setMessage({ type: 'success', text: 'Account governance policy updated successfully.' })
      await loadUsers()
    }
    setUpdatingId(null)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Account Governance & Moderation
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Manage user roles, verify ownership accounts, and enforce platform restrictions
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition self-start md:self-auto"
          >
            Refresh Users
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl text-xs font-semibold ${
              message.type === 'error'
                ? 'bg-red-50 text-red-700 border border-red-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              Loading user registry...
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-xs font-semibold text-gray-400">
              No registered accounts found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">User / Identity</th>
                    <th className="py-4 px-6">System Role</th>
                    <th className="py-4 px-6">Account Status</th>
                    <th className="py-4 px-6">Verification</th>
                    <th className="py-4 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition">
                      
                      <td className="py-4 px-6">
                        <div className="font-bold text-gray-900">{u.full_name || 'Unnamed User'}</div>
                        <div className="text-[11px] text-gray-400 font-mono mt-0.5">{u.email}</div>
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={u.role}
                          disabled={updatingId === u.id}
                          onChange={(e) =>
                            updateUser(u.id, e.target.value as UserProfile['role'], u.status, u.is_verified)
                          }
                          className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        >
                          <option value="client">Client</option>
                          <option value="landlord">Landlord</option>
                          <option value="property_manager">Property Manager</option>
                          <option value="broker">Broker</option>
                          <option value="admin">Admin</option>
                          <option value="tech_auditor">Tech Auditor</option>
                        </select>
                      </td>

                      <td className="py-4 px-6">
                        <select
                          value={u.status}
                          disabled={updatingId === u.id}
                          onChange={(e) =>
                            updateUser(u.id, u.role, e.target.value as UserProfile['status'], u.is_verified)
                          }
                          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                            u.status === 'active'
                              ? 'border-emerald-200 text-emerald-700 bg-emerald-50/30'
                              : u.status === 'under_review'
                              ? 'border-amber-200 text-amber-700 bg-amber-50/30'
                              : 'border-red-200 text-red-700 bg-red-50/30'
                          }`}
                        >
                          <option value="active">Active</option>
                          <option value="under_review">Under Review</option>
                          <option value="frozen">Frozen</option>
                          <option value="banned">Banned</option>
                        </select>
                      </td>

                      <td className="py-4 px-6">
                        <button
                          onClick={() => updateUser(u.id, u.role, u.status, !u.is_verified)}
                          disabled={updatingId === u.id}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition ${
                            u.is_verified
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right">
                        <span className="text-[10px] text-gray-400 font-mono">
                          {new Date(u.created_at).toLocaleDateString()}
                        </span>
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

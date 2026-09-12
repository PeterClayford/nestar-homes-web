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
  verification_documents?: {
    requested_role?: string
    notes?: string
    submitted_at?: string
  }
  created_at: string
}

export default function UserManagementPage() {
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
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
      setSelectedUser(null)
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
              Account Governance & Partner Verification
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Review partner upgrade applications, assign system privileges, and moderate accounts
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition self-start md:self-auto cursor-pointer"
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
                    <th className="py-4 px-6">Application</th>
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
                        {u.verification_documents?.notes ? (
                          <button
                            onClick={() => setSelectedUser(u)}
                            className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            Review App
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400">None</span>
                        )}
                      </td>

                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => updateUser(u.id, u.role, u.status, !u.is_verified)}
                          disabled={updatingId === u.id}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase transition cursor-pointer ${
                            u.is_verified
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          }`}
                        >
                          {u.is_verified ? 'Verified' : 'Unverified'}
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* Verification Review Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4">
            <h3 className="text-lg font-extrabold text-gray-900">Partner Application Review</h3>
            
            <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
              <div><strong>Applicant:</strong> {selectedUser.full_name} ({selectedUser.email})</div>
              <div><strong>Requested Role:</strong> <span className="uppercase text-emerald-600 font-bold">{selectedUser.verification_documents?.requested_role}</span></div>
              <div><strong>Submission Date:</strong> {new Date(selectedUser.verification_documents?.submitted_at || '').toLocaleString()}</div>
              <div className="pt-2 border-t border-gray-200 mt-2">
                <strong>Property References & Notes:</strong>
                <p className="mt-1 text-gray-800 font-mono text-[11px]">{selectedUser.verification_documents?.notes}</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateUser(
                    selectedUser.id,
                    (selectedUser.verification_documents?.requested_role as UserProfile['role']) || 'landlord',
                    'active',
                    true
                  )
                }
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Approve & Elevate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

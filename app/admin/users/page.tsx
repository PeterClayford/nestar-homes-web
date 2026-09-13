'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
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
    nin_number?: string
    nin_front_url?: string
    nin_back_url?: string
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
    <div className="min-h-screen bg-gray-50 font-sans">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header Block */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              Account Governance & Partner Verification
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Review partner upgrade applications, inspect National ID (NIN) photos, and grant verified status
            </p>
          </div>
          <button
            onClick={loadUsers}
            className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition self-start md:self-auto cursor-pointer"
          >
            Refresh Registry
          </button>
        </div>

        {message && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold ${
              message.type === 'error'
                ? 'bg-rose-50 text-rose-700 border border-rose-100'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* User Table */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
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
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    <th className="py-4 px-6">User / Contact</th>
                    <th className="py-4 px-6">System Role</th>
                    <th className="py-4 px-6">Account Status</th>
                    <th className="py-4 px-6">NIN Document</th>
                    <th className="py-4 px-6 text-right">Verification Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {users.map((u) => {
                    const hasDocs = u.verification_documents?.nin_number || u.verification_documents?.nin_front_url || u.verification_documents?.notes

                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition">

                        {/* User Identity */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-gray-900">{u.full_name || 'Unnamed User'}</div>
                          <div className="text-[11px] text-gray-400 font-mono mt-0.5">
                            {u.email} • {u.phone_number || 'No Phone'}
                          </div>
                        </td>

                        {/* Role Selector */}
                        <td className="py-4 px-6">
                          <select
                            value={u.role}
                            disabled={updatingId === u.id}
                            onChange={(e) =>
                              updateUser(u.id, e.target.value as UserProfile['role'], u.status, u.is_verified)
                            }
                            className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                          >
                            <option value="client">Client</option>
                            <option value="landlord">Landlord</option>
                            <option value="property_manager">Property Manager</option>
                            <option value="broker">Broker</option>
                            <option value="admin">Admin</option>
                            <option value="tech_auditor">Tech Auditor</option>
                          </select>
                        </td>

                        {/* Status Selector */}
                        <td className="py-4 px-6">
                          <select
                            value={u.status}
                            disabled={updatingId === u.id}
                            onChange={(e) =>
                              updateUser(u.id, u.role, e.target.value as UserProfile['status'], u.is_verified)
                            }
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${
                              u.status === 'active'
                                ? 'border-emerald-200 text-emerald-700 bg-emerald-50/30'
                                : u.status === 'under_review'
                                ? 'border-amber-200 text-amber-700 bg-amber-50/30'
                                : 'border-rose-200 text-rose-700 bg-rose-50/30'
                            }`}
                          >
                            <option value="active">Active</option>
                            <option value="under_review">Under Review</option>
                            <option value="frozen">Frozen</option>
                            <option value="banned">Banned</option>
                          </select>
                        </td>

                        {/* NIN Document Indicator */}
                        <td className="py-4 px-6">
                          {hasDocs ? (
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-[11px] font-bold transition cursor-pointer"
                            >
                              Inspect NIN Data
                            </button>
                          ) : (
                            <span className="text-[11px] text-gray-400 italic">No NIN Docs</span>
                          )}
                        </td>

                        {/* Verified Toggle */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => updateUser(u.id, u.role, u.status, !u.is_verified)}
                            disabled={updatingId === u.id}
                            className={`px-3.5 py-1.5 rounded-full text-[10px] font-black tracking-wide uppercase transition cursor-pointer ${
                              u.is_verified
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                          >
                            {u.is_verified ? '✓ Verified Partner' : 'Unverified'}
                          </button>
                        </td>

                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>

      {/* National ID Inspection Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-black text-gray-900">
                  National ID Verification Inspector
                </h3>
                <p className="text-xs text-gray-500">
                  {selectedUser.full_name} ({selectedUser.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Application Data Card */}
            <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 text-xs">
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Assigned System Role</div>
                <div className="font-extrabold text-emerald-700 uppercase">{selectedUser.role}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Typed NIN Number</div>
                <div className="font-mono font-bold text-gray-900">
                  {selectedUser.verification_documents?.nin_number || 'N/A'}
                </div>
              </div>
            </div>

            {/* Photos Display */}
            <div className="space-y-3">
              <div className="text-xs font-black text-gray-900 uppercase tracking-wider">
                Uploaded Identification Snapshots
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50 space-y-2">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">NIN Card Front Photo</div>
                  {selectedUser.verification_documents?.nin_front_url ? (
                    <img
                      src={selectedUser.verification_documents.nin_front_url}
                      alt="NIN Front"
                      className="w-full h-44 object-cover rounded-xl border border-gray-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-44 flex items-center justify-center text-[11px] text-gray-400 italic">
                      No Front Image Uploaded
                    </div>
                  )}
                </div>

                <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/50 space-y-2">
                  <div className="text-[10px] font-bold text-gray-500 uppercase">NIN Card Back Photo</div>
                  {selectedUser.verification_documents?.nin_back_url ? (
                    <img
                      src={selectedUser.verification_documents.nin_back_url}
                      alt="NIN Back"
                      className="w-full h-44 object-cover rounded-xl border border-gray-200 shadow-xs"
                    />
                  ) : (
                    <div className="h-44 flex items-center justify-center text-[11px] text-gray-400 italic">
                      No Back Image Uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
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
                    selectedUser.role,
                    'active',
                    !selectedUser.is_verified
                  )
                }
                className={`px-5 py-2.5 text-white rounded-xl text-xs font-extrabold transition cursor-pointer ${
                  selectedUser.is_verified
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {selectedUser.is_verified ? 'Revoke Verification' : 'Approve & Elevate Partner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

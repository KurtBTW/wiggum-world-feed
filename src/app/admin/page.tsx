'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, Clock, CheckCircle, XCircle, AlertCircle, 
  FileText, ChevronRight, Users, Shield, User
} from 'lucide-react';

interface Application {
  id: string;
  projectName: string;
  website: string;
  category: string;
  stage: string;
  status: string;
  aiScore: number | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface UserRecord {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  createdAt: string;
  _count: {
    applications: number;
  };
}

const STATUS_FILTERS = [
  { id: 'all', label: 'All', icon: FileText },
  { id: 'SUBMITTED', label: 'Submitted', icon: Clock },
  { id: 'UNDER_REVIEW', label: 'Under Review', icon: Clock },
  { id: 'APPROVED', label: 'Approved', icon: CheckCircle },
  { id: 'REJECTED', label: 'Rejected', icon: XCircle },
  { id: 'NEEDS_INFO', label: 'Needs Info', icon: AlertCircle },
];

const STATUS_COLORS: Record<string, string> = {
  DRAFT: 'text-zinc-400 bg-zinc-500/10',
  SUBMITTED: 'text-blue-400 bg-blue-500/10',
  AI_SCREENING: 'text-purple-400 bg-purple-500/10',
  UNDER_REVIEW: 'text-yellow-400 bg-yellow-500/10',
  NEEDS_INFO: 'text-orange-400 bg-orange-500/10',
  APPROVED: 'text-[#50e2c3] bg-[#50e2c3]/10',
  REJECTED: 'text-red-400 bg-red-500/10',
};

const ROLE_COLORS: Record<string, string> = {
  APPLICANT: 'text-zinc-400 bg-zinc-500/10',
  MEMBER: 'text-blue-400 bg-blue-500/10',
  ADMIN: 'text-[#50e2c3] bg-[#50e2c3]/10',
};

export default function AdminDashboard() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'applications' | 'users'>('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin');
    } else if (authStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/unauthorized?reason=admins_only');
    }
  }, [authStatus, session, router]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'ADMIN') {
      if (activeTab === 'applications') {
        fetchApplications();
      } else {
        fetchUsers();
      }
    }
  }, [authStatus, session, filter, activeTab]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' 
        ? '/api/admin/applications'
        : `/api/admin/applications?status=${filter}`;
      
      const res = await fetch(url);
      const data = await res.json();
      
      setApplications(data.applications || []);
      setCounts(data.counts || {});
    } catch (err) {
      console.error('Failed to fetch applications:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    setUpdatingRole(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update role');
        return;
      }
      
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
    } catch (err) {
      console.error('Failed to update role:', err);
      alert('Failed to update role');
    } finally {
      setUpdatingRole(null);
    }
  };

  if (authStatus === 'loading' || (loading && applications.length === 0 && users.length === 0)) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-zinc-400 mt-1">Manage applications and users</p>
          </div>
          <Link
            href="/"
            className="text-zinc-400 hover:text-white text-sm transition-colors"
          >
            Back to Home
          </Link>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('applications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'applications'
                ? 'bg-[#50e2c3] text-black'
                : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            Applications
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-[#50e2c3] text-black'
                : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Users
          </button>
        </div>

        {activeTab === 'applications' ? (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {STATUS_FILTERS.map((s) => {
                const count = s.id === 'all' ? totalCount : (counts[s.id] || 0);
                const isActive = filter === s.id;
                
                return (
                  <button
                    key={s.id}
                    onClick={() => setFilter(s.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-white/[0.1] text-white'
                        : 'bg-white/[0.05] text-zinc-400 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <s.icon className="w-4 h-4" />
                    {s.label}
                    <span className={`px-1.5 py-0.5 rounded text-xs ${
                      isActive ? 'bg-white/[0.1]' : 'bg-white/[0.1]'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
              </div>
            ) : applications.length === 0 ? (
              <div className="text-center py-20">
                <FileText className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">No applications found</p>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Project
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Category
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Status
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        AI Score
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Submitted
                      </th>
                      <th className="px-6 py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr 
                        key={app.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-white">{app.projectName}</div>
                            <div className="text-sm text-zinc-500">{app.user.email}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-300 capitalize">{app.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[app.status] || STATUS_COLORS.SUBMITTED}`}>
                            {app.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {app.aiScore !== null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-16 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-purple-500 rounded-full"
                                  style={{ width: `${app.aiScore}%` }}
                                />
                              </div>
                              <span className="text-sm text-purple-400">{app.aiScore}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-zinc-600">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {new Date(app.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <Link
                            href={`/admin/applications/${app.id}`}
                            className="flex items-center gap-1 text-[#50e2c3] hover:underline text-sm"
                          >
                            Review
                            <ChevronRight className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        ) : (
          <>
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-20">
                <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-500">No users found</p>
              </div>
            ) : (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/[0.06]">
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        User
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Role
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Applications
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Joined
                      </th>
                      <th className="text-left text-xs font-medium text-zinc-500 uppercase tracking-wider px-6 py-4">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr 
                        key={user.id}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-white/[0.1] flex items-center justify-center">
                              {user.role === 'ADMIN' ? (
                                <Shield className="w-5 h-5 text-[#50e2c3]" />
                              ) : (
                                <User className="w-5 h-5 text-zinc-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium text-white">{user.name || 'No name'}</div>
                              <div className="text-sm text-zinc-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-300">{user._count.applications}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-zinc-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={user.role}
                            onChange={(e) => updateUserRole(user.id, e.target.value)}
                            disabled={updatingRole === user.id}
                            className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#50e2c3] disabled:opacity-50 cursor-pointer"
                          >
                            <option value="APPLICANT">Applicant</option>
                            <option value="MEMBER">Member</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {updatingRole === user.id && (
                            <Loader2 className="w-4 h-4 text-[#50e2c3] animate-spin inline ml-2" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

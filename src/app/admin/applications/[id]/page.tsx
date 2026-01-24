'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, ArrowLeft, CheckCircle, XCircle, AlertCircle,
  Globe, Twitter, MessageCircle, Github, ExternalLink,
  Sparkles, User, Calendar, Building2
} from 'lucide-react';

interface Application {
  id: string;
  projectName: string;
  website: string;
  contactEmail: string;
  twitter: string | null;
  discord: string | null;
  github: string | null;
  description: string;
  teamInfo: string;
  category: string;
  stage: string;
  seekingListing: boolean;
  seekingLPIntros: boolean;
  seekingDistribution: boolean;
  seekingOther: string | null;
  offeringLiquidity: boolean;
  offeringIntegration: boolean;
  offeringOther: string | null;
  proofOfWork: string | null;
  logoUrl: string | null;
  status: string;
  aiScore: number | null;
  aiSummary: string | null;
  aiFlags: string[];
  reviewerNotes: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

export default function ApplicationDetailPage() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/admin');
    } else if (authStatus === 'authenticated' && session?.user?.role !== 'ADMIN') {
      router.push('/unauthorized?reason=admins_only');
    }
  }, [authStatus, session, router]);

  useEffect(() => {
    if (authStatus === 'authenticated' && session?.user?.role === 'ADMIN' && id) {
      fetchApplication();
    }
  }, [authStatus, session, id]);

  const fetchApplication = async () => {
    try {
      const res = await fetch(`/api/admin/applications/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setApplication(data.application);
      setReviewNotes(data.application?.reviewerNotes || '');
    } catch (err) {
      setError('Failed to load application');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: 'approve' | 'reject' | 'request_info') => {
    if (!application) return;
    
    setActionLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/applications/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: reviewNotes }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Action failed');
      }

      router.push('/admin?action=' + action);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setActionLoading(false);
    }
  };

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Application not found</p>
          <Link href="/admin" className="text-[#50e2c3] hover:underline">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Applications
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            {application.logoUrl ? (
              <img 
                src={application.logoUrl} 
                alt={application.projectName}
                className="w-16 h-16 rounded-xl object-contain bg-white/[0.05]"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-white/[0.05] flex items-center justify-center">
                <Building2 className="w-8 h-8 text-zinc-600" />
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{application.projectName}</h1>
              <div className="flex items-center gap-3 mt-1 text-sm text-zinc-500">
                <span className="capitalize">{application.category}</span>
                <span>•</span>
                <span className="capitalize">{application.stage}</span>
              </div>
            </div>
          </div>
          <StatusBadge status={application.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Section title="About">
              <p className="text-zinc-300 whitespace-pre-wrap">{application.description}</p>
            </Section>

            {application.teamInfo && (
              <Section title="Team">
                <p className="text-zinc-300 whitespace-pre-wrap">{application.teamInfo}</p>
              </Section>
            )}

            <Section title="Seeking">
              <div className="flex flex-wrap gap-2">
                {application.seekingListing && <Tag>Listing</Tag>}
                {application.seekingLPIntros && <Tag>LP Intros</Tag>}
                {application.seekingDistribution && <Tag>Distribution</Tag>}
                {application.seekingOther && <Tag>{application.seekingOther}</Tag>}
              </div>
            </Section>

            <Section title="Offering">
              <div className="flex flex-wrap gap-2">
                {application.offeringLiquidity && <Tag>Liquidity</Tag>}
                {application.offeringIntegration && <Tag>Integration</Tag>}
                {application.offeringOther && <Tag>{application.offeringOther}</Tag>}
              </div>
            </Section>

            {application.proofOfWork && (
              <Section title="Proof of Work">
                <p className="text-zinc-300 whitespace-pre-wrap">{application.proofOfWork}</p>
              </Section>
            )}

            {application.aiScore !== null && (
              <Section title="AI Assessment">
                <div className="p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-purple-400">Score: {application.aiScore}/100</span>
                  </div>
                  {application.aiSummary && (
                    <p className="text-zinc-300 text-sm">{application.aiSummary}</p>
                  )}
                  {application.aiFlags && application.aiFlags.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-purple-500/20">
                      <p className="text-sm text-purple-400 mb-2">Flags:</p>
                      <ul className="list-disc list-inside text-sm text-zinc-400">
                        {application.aiFlags.map((flag, i) => (
                          <li key={i}>{flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-6">
            <Section title="Links">
              <div className="space-y-2">
                <LinkItem icon={Globe} href={application.website} label="Website" />
                {application.twitter && (
                  <LinkItem icon={Twitter} href={`https://twitter.com/${application.twitter.replace('@', '')}`} label={application.twitter} />
                )}
                {application.discord && (
                  <LinkItem icon={MessageCircle} href={application.discord} label="Discord" />
                )}
                {application.github && (
                  <LinkItem icon={Github} href={application.github} label="GitHub" />
                )}
              </div>
            </Section>

            <Section title="Applicant">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/[0.05] flex items-center justify-center">
                  <User className="w-5 h-5 text-zinc-500" />
                </div>
                <div>
                  <p className="text-white font-medium">{application.user.name || 'Anonymous'}</p>
                  <p className="text-sm text-zinc-500">{application.user.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 text-sm text-zinc-500">
                <Calendar className="w-4 h-4" />
                <span>Applied {new Date(application.createdAt).toLocaleDateString()}</span>
              </div>
            </Section>

            {application.status !== 'APPROVED' && application.status !== 'REJECTED' && (
              <Section title="Review Actions">
                <div className="space-y-3">
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add notes (optional for approve, required for reject/request info)"
                    rows={3}
                    className="w-full px-3 py-2 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 resize-none"
                  />

                  {error && (
                    <p className="text-red-400 text-sm">{error}</p>
                  )}

                  <button
                    onClick={() => handleAction('approve')}
                    disabled={actionLoading}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-[#50e2c3] text-black font-medium rounded-lg hover:bg-[#3fcbac] disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Approve
                  </button>
                  
                  <button
                    onClick={() => handleAction('request_info')}
                    disabled={actionLoading || !reviewNotes.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
                  >
                    <AlertCircle className="w-4 h-4" />
                    Request More Info
                  </button>
                  
                  <button
                    onClick={() => handleAction('reject')}
                    disabled={actionLoading || !reviewNotes.trim()}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white font-medium rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
                  >
                    <XCircle className="w-4 h-4" />
                    Reject
                  </button>
                </div>
              </Section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">{title}</h2>
      {children}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-1 text-xs font-medium rounded bg-[#50e2c3]/20 text-[#50e2c3]">
      {children}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { color: string; bg: string }> = {
    SUBMITTED: { color: 'text-blue-400', bg: 'bg-blue-500/10' },
    UNDER_REVIEW: { color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
    APPROVED: { color: 'text-[#50e2c3]', bg: 'bg-[#50e2c3]/10' },
    REJECTED: { color: 'text-red-400', bg: 'bg-red-500/10' },
    NEEDS_INFO: { color: 'text-orange-400', bg: 'bg-orange-500/10' },
  };
  const { color, bg } = config[status] || config.SUBMITTED;
  
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${color} ${bg}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

function LinkItem({ icon: Icon, href, label }: { icon: typeof Globe; href: string; label: string }) {
  const url = href.startsWith('http') ? href : `https://${href}`;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-zinc-400 hover:text-[#50e2c3] transition-colors"
    >
      <Icon className="w-4 h-4" />
      <span className="truncate">{label}</span>
      <ExternalLink className="w-3 h-3 ml-auto flex-shrink-0" />
    </a>
  );
}

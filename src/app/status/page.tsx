'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, CheckCircle, Clock, AlertCircle, XCircle, 
  ArrowRight, FileText, Sparkles, Network
} from 'lucide-react';

interface Application {
  id: string;
  projectName: string;
  status: string;
  aiScore: number | null;
  aiSummary: string | null;
  reviewerNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const STATUS_CONFIG: Record<string, { 
  label: string; 
  icon: typeof Clock; 
  color: string;
  bgColor: string;
  description: string;
}> = {
  DRAFT: {
    label: 'Draft',
    icon: FileText,
    color: 'text-zinc-400',
    bgColor: 'bg-zinc-500/10',
    description: 'Your application is saved as a draft.',
  },
  SUBMITTED: {
    label: 'Submitted',
    icon: Clock,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
    description: 'Your application has been received and is in queue for review.',
  },
  AI_SCREENING: {
    label: 'AI Screening',
    icon: Sparkles,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/10',
    description: 'Our AI is analyzing your application.',
  },
  UNDER_REVIEW: {
    label: 'Under Review',
    icon: Clock,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/10',
    description: 'A human reviewer is evaluating your application.',
  },
  NEEDS_INFO: {
    label: 'More Info Needed',
    icon: AlertCircle,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/10',
    description: 'We need additional information to process your application.',
  },
  APPROVED: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'text-[#50e2c3]',
    bgColor: 'bg-[#50e2c3]/10',
    description: 'Congratulations! Your application has been approved.',
  },
  REJECTED: {
    label: 'Not Approved',
    icon: XCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
    description: 'Unfortunately, your application was not approved at this time.',
  },
};

function StatusContent() {
  const { data: session, status: authStatus } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const justSubmitted = searchParams.get('submitted') === 'true';
  
  const [application, setApplication] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/status');
    }
  }, [authStatus, router]);

  useEffect(() => {
    if (authStatus === 'authenticated') {
      fetchApplication();
    }
  }, [authStatus]);

  const fetchApplication = async () => {
    try {
      const res = await fetch('/api/applications');
      const data = await res.json();
      
      if (data.application) {
        setApplication(data.application);
      }
    } catch (err) {
      setError('Failed to load application status');
    } finally {
      setLoading(false);
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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/[0.05] mb-6">
            <FileText className="w-8 h-8 text-zinc-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">No Application Found</h1>
          <p className="text-zinc-400 mb-8">You haven't submitted an application yet.</p>
          <Link
            href="/apply"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors"
          >
            Start Application
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[application.status] || STATUS_CONFIG.SUBMITTED;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {justSubmitted && (
          <div className="mb-6 p-4 bg-[#50e2c3]/10 border border-[#50e2c3]/20 rounded-lg flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-[#50e2c3] flex-shrink-0" />
            <div>
              <p className="text-[#50e2c3] font-medium">Application Submitted!</p>
              <p className="text-zinc-400 text-sm">We'll review your application and get back to you soon.</p>
            </div>
          </div>
        )}

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white">{application.projectName}</h1>
              <p className="text-zinc-500 text-sm mt-1">
                Submitted {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${statusConfig.bgColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusConfig.color}`} />
              <span className={`text-sm font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          <div className={`p-4 rounded-lg ${statusConfig.bgColor} mb-6`}>
            <p className={`${statusConfig.color}`}>{statusConfig.description}</p>
          </div>

          {application.aiScore !== null && (
            <div className="mb-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-medium text-purple-400">AI Assessment</span>
              </div>
              <div className="flex items-center gap-4 mb-2">
                <span className="text-zinc-400 text-sm">Score:</span>
                <div className="flex items-center gap-2">
                  <div className="w-32 h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-purple-500 rounded-full"
                      style={{ width: `${application.aiScore}%` }}
                    />
                  </div>
                  <span className="text-purple-400 font-medium">{application.aiScore}/100</span>
                </div>
              </div>
              {application.aiSummary && (
                <p className="text-zinc-300 text-sm">{application.aiSummary}</p>
              )}
            </div>
          )}

          {application.reviewerNotes && (
            <div className="mb-6 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]">
              <h3 className="text-sm font-medium text-zinc-300 mb-2">Reviewer Feedback</h3>
              <p className="text-zinc-400 text-sm">{application.reviewerNotes}</p>
            </div>
          )}

          {application.status === 'APPROVED' && (
            session?.user?.role === 'MEMBER' || session?.user?.role === 'ADMIN' ? (
              <Link
                href="/network"
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors"
              >
                <Network className="w-5 h-5" />
                Enter the Network
              </Link>
            ) : (
              <button
                onClick={() => signIn(undefined, { callbackUrl: '/network' })}
                className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors"
              >
                <Network className="w-5 h-5" />
                Enter the Network
              </button>
            )
          )}

          {application.status === 'NEEDS_INFO' && (
            <Link
              href="/apply"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-orange-500 text-white font-semibold rounded-lg hover:bg-orange-600 transition-colors"
            >
              Update Application
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-zinc-500 animate-spin" />
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <StatusContent />
    </Suspense>
  );
}

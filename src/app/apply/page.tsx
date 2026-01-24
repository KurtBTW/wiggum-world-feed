'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft, ArrowRight, Check, Loader2, 
  Globe, Twitter, MessageCircle, Github,
  Building2, Users, Rocket, HandshakeIcon
} from 'lucide-react';
import { FileUpload } from '@/components/FileUpload';

const CATEGORIES = [
  { id: 'lending', label: 'Lending', desc: 'Lending and borrowing protocols' },
  { id: 'dex', label: 'DEX', desc: 'Decentralized exchanges' },
  { id: 'derivatives', label: 'Derivatives', desc: 'Perpetuals, options, futures' },
  { id: 'infrastructure', label: 'Infrastructure', desc: 'Core infra and tooling' },
  { id: 'analytics', label: 'Analytics', desc: 'Data and analytics' },
  { id: 'tooling', label: 'Tooling', desc: 'Developer and user tools' },
];

const STAGES = [
  { id: 'live', label: 'Live', desc: 'Deployed and operational' },
  { id: 'testnet', label: 'Testnet', desc: 'Testing on testnet' },
  { id: 'building', label: 'Building', desc: 'In development' },
];

interface FormData {
  projectName: string;
  website: string;
  contactEmail: string;
  twitter: string;
  discord: string;
  github: string;
  description: string;
  teamInfo: string;
  category: string;
  stage: string;
  seekingListing: boolean;
  seekingLPIntros: boolean;
  seekingDistribution: boolean;
  seekingOther: string;
  offeringLiquidity: boolean;
  offeringIntegration: boolean;
  offeringOther: string;
  proofOfWork: string;
  logoUrl: string;
  attachmentUrls: string[];
}

const initialFormData: FormData = {
  projectName: '',
  website: '',
  contactEmail: '',
  twitter: '',
  discord: '',
  github: '',
  description: '',
  teamInfo: '',
  category: '',
  stage: '',
  seekingListing: false,
  seekingLPIntros: false,
  seekingDistribution: false,
  seekingOther: '',
  offeringLiquidity: false,
  offeringIntegration: false,
  offeringOther: '',
  proofOfWork: '',
  logoUrl: '',
  attachmentUrls: [],
};

const STEPS = [
  { id: 1, title: 'Project Basics', icon: Building2 },
  { id: 2, title: 'About', icon: Users },
  { id: 3, title: 'Seeking', icon: Rocket },
  { id: 4, title: 'Offering', icon: HandshakeIcon },
  { id: 5, title: 'Proof of Work', icon: Check },
  { id: 6, title: 'Review', icon: Check },
];

export default function ApplyPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/apply');
    }
  }, [status, router]);

  useEffect(() => {
    const saved = localStorage.getItem('lastnetwork-application-draft');
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lastnetwork-application-draft', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (session?.user?.email && !form.contactEmail) {
      setForm(f => ({ ...f, contactEmail: session.user.email || '' }));
    }
  }, [session]);

  const updateForm = (updates: Partial<FormData>) => {
    setForm(f => ({ ...f, ...updates }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return form.projectName && form.website && form.contactEmail;
      case 2:
        return form.description && form.category && form.stage;
      case 3:
        return form.seekingListing || form.seekingLPIntros || form.seekingDistribution || form.seekingOther;
      case 4:
        return form.offeringLiquidity || form.offeringIntegration || form.offeringOther;
      case 5:
        return form.proofOfWork;
      default:
        return true;
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit application');
      }

      localStorage.removeItem('lastnetwork-application-draft');
      router.push('/status?submitted=true');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Apply to Last Network</h1>
          <p className="text-zinc-400">Tell us about your project</p>
        </div>

        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center">
              <button
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  s.id === step
                    ? 'bg-[#50e2c3] text-black'
                    : s.id < step
                    ? 'bg-[#50e2c3]/20 text-[#50e2c3] hover:bg-[#50e2c3]/30'
                    : 'bg-white/[0.05] text-zinc-500'
                }`}
              >
                <s.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{s.title}</span>
                <span className="sm:hidden">{s.id}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={`w-8 h-0.5 mx-1 ${s.id < step ? 'bg-[#50e2c3]' : 'bg-white/[0.1]'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-6">
          {step === 1 && (
            <Step1 form={form} updateForm={updateForm} />
          )}
          {step === 2 && (
            <Step2 form={form} updateForm={updateForm} />
          )}
          {step === 3 && (
            <Step3 form={form} updateForm={updateForm} />
          )}
          {step === 4 && (
            <Step4 form={form} updateForm={updateForm} />
          )}
          {step === 5 && (
            <Step5 form={form} updateForm={updateForm} />
          )}
          {step === 6 && (
            <Step6 form={form} />
          )}

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/[0.06]">
            <button
              onClick={() => setStep(s => s - 1)}
              disabled={step === 1}
              className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>

            {step < 6 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canProceed()}
                className="flex items-center gap-2 px-6 py-2 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    Submit Application
                    <Check className="w-4 h-4" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Step1({ form, updateForm }: { form: FormData; updateForm: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Project Basics</h2>
      
      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Project Name *
        </label>
        <input
          type="text"
          value={form.projectName}
          onChange={e => updateForm({ projectName: e.target.value })}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
          placeholder="e.g., HypurrFi"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Website *
        </label>
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
          <input
            type="url"
            value={form.website}
            onChange={e => updateForm({ website: e.target.value })}
            className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
            placeholder="https://yourproject.xyz"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Contact Email *
        </label>
        <input
          type="email"
          value={form.contactEmail}
          onChange={e => updateForm({ contactEmail: e.target.value })}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
          placeholder="team@yourproject.xyz"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Twitter</label>
          <div className="relative">
            <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={form.twitter}
              onChange={e => updateForm({ twitter: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
              placeholder="@handle"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Discord</label>
          <div className="relative">
            <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={form.discord}
              onChange={e => updateForm({ discord: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
              placeholder="discord.gg/..."
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">GitHub</label>
          <div className="relative">
            <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              type="text"
              value={form.github}
              onChange={e => updateForm({ github: e.target.value })}
              className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
              placeholder="github.com/..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Step2({ form, updateForm }: { form: FormData; updateForm: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">About Your Project</h2>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Description *
        </label>
        <textarea
          value={form.description}
          onChange={e => updateForm({ description: e.target.value })}
          rows={4}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 resize-none"
          placeholder="What does your project do? What problem does it solve?"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Team Info
        </label>
        <textarea
          value={form.teamInfo}
          onChange={e => updateForm({ teamInfo: e.target.value })}
          rows={3}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 resize-none"
          placeholder="Tell us about your team (size, background, experience)"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Category *</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              type="button"
              onClick={() => updateForm({ category: cat.id })}
              className={`p-3 rounded-lg border text-left transition-colors ${
                form.category === cat.id
                  ? 'border-[#50e2c3] bg-[#50e2c3]/10'
                  : 'border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <div className={`font-medium ${form.category === cat.id ? 'text-[#50e2c3]' : 'text-white'}`}>
                {cat.label}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{cat.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-3">Stage *</label>
        <div className="grid grid-cols-3 gap-3">
          {STAGES.map(s => (
            <button
              key={s.id}
              type="button"
              onClick={() => updateForm({ stage: s.id })}
              className={`p-3 rounded-lg border text-left transition-colors ${
                form.stage === s.id
                  ? 'border-[#50e2c3] bg-[#50e2c3]/10'
                  : 'border-white/[0.08] hover:border-white/[0.15]'
              }`}
            >
              <div className={`font-medium ${form.stage === s.id ? 'text-[#50e2c3]' : 'text-white'}`}>
                {s.label}
              </div>
              <div className="text-xs text-zinc-500 mt-0.5">{s.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Step3({ form, updateForm }: { form: FormData; updateForm: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">What are you seeking?</h2>
        <p className="text-zinc-400 text-sm mt-1">Select all that apply</p>
      </div>

      <div className="space-y-3">
        <CheckboxOption
          checked={form.seekingListing}
          onChange={v => updateForm({ seekingListing: v })}
          label="Listing / Exposure"
          description="Get listed on Hyperliquid or partner platforms"
        />
        <CheckboxOption
          checked={form.seekingLPIntros}
          onChange={v => updateForm({ seekingLPIntros: v })}
          label="LP Introductions"
          description="Connect with liquidity providers"
        />
        <CheckboxOption
          checked={form.seekingDistribution}
          onChange={v => updateForm({ seekingDistribution: v })}
          label="Distribution Partners"
          description="Find partners to help distribute your product"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Other (please specify)
        </label>
        <input
          type="text"
          value={form.seekingOther}
          onChange={e => updateForm({ seekingOther: e.target.value })}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
          placeholder="Anything else you're looking for?"
        />
      </div>
    </div>
  );
}

function Step4({ form, updateForm }: { form: FormData; updateForm: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">What can you offer?</h2>
        <p className="text-zinc-400 text-sm mt-1">Select all that apply</p>
      </div>

      <div className="space-y-3">
        <CheckboxOption
          checked={form.offeringLiquidity}
          onChange={v => updateForm({ offeringLiquidity: v })}
          label="Liquidity"
          description="Provide liquidity to partner protocols"
        />
        <CheckboxOption
          checked={form.offeringIntegration}
          onChange={v => updateForm({ offeringIntegration: v })}
          label="Integration"
          description="Integrate other protocols into your product"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Other (please specify)
        </label>
        <input
          type="text"
          value={form.offeringOther}
          onChange={e => updateForm({ offeringOther: e.target.value })}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
          placeholder="What else can you bring to the network?"
        />
      </div>
    </div>
  );
}

function Step5({ form, updateForm }: { form: FormData; updateForm: (u: Partial<FormData>) => void }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Proof of Work</h2>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Project Logo
        </label>
        <FileUpload
          type="logo"
          value={form.logoUrl}
          onChange={url => updateForm({ logoUrl: url || '' })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-300 mb-1.5">
          Tell us about your traction *
        </label>
        <textarea
          value={form.proofOfWork}
          onChange={e => updateForm({ proofOfWork: e.target.value })}
          rows={5}
          className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 resize-none"
          placeholder="Share metrics, achievements, milestones, partnerships, TVL, users, or anything else that demonstrates your project's progress..."
        />
      </div>
    </div>
  );
}

function Step6({ form }: { form: FormData }) {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Review Your Application</h2>

      <div className="space-y-4">
        <ReviewSection title="Project Basics">
          <ReviewItem label="Name" value={form.projectName} />
          <ReviewItem label="Website" value={form.website} />
          <ReviewItem label="Contact" value={form.contactEmail} />
          {form.twitter && <ReviewItem label="Twitter" value={form.twitter} />}
          {form.discord && <ReviewItem label="Discord" value={form.discord} />}
          {form.github && <ReviewItem label="GitHub" value={form.github} />}
        </ReviewSection>

        <ReviewSection title="About">
          <ReviewItem label="Category" value={CATEGORIES.find(c => c.id === form.category)?.label || form.category} />
          <ReviewItem label="Stage" value={STAGES.find(s => s.id === form.stage)?.label || form.stage} />
          <ReviewItem label="Description" value={form.description} />
          {form.teamInfo && <ReviewItem label="Team" value={form.teamInfo} />}
        </ReviewSection>

        <ReviewSection title="Seeking">
          <div className="flex flex-wrap gap-2">
            {form.seekingListing && <Tag>Listing</Tag>}
            {form.seekingLPIntros && <Tag>LP Intros</Tag>}
            {form.seekingDistribution && <Tag>Distribution</Tag>}
            {form.seekingOther && <Tag>{form.seekingOther}</Tag>}
          </div>
        </ReviewSection>

        <ReviewSection title="Offering">
          <div className="flex flex-wrap gap-2">
            {form.offeringLiquidity && <Tag>Liquidity</Tag>}
            {form.offeringIntegration && <Tag>Integration</Tag>}
            {form.offeringOther && <Tag>{form.offeringOther}</Tag>}
          </div>
        </ReviewSection>

        <ReviewSection title="Proof of Work">
          {form.logoUrl && (
            <div className="mb-3">
              <img src={form.logoUrl} alt="Logo" className="w-16 h-16 rounded-lg object-contain bg-white/[0.05]" />
            </div>
          )}
          <p className="text-zinc-300 text-sm whitespace-pre-wrap">{form.proofOfWork}</p>
        </ReviewSection>
      </div>
    </div>
  );
}

function CheckboxOption({ 
  checked, 
  onChange, 
  label, 
  description 
}: { 
  checked: boolean; 
  onChange: (v: boolean) => void; 
  label: string; 
  description: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-full flex items-start gap-3 p-4 rounded-lg border text-left transition-colors ${
        checked
          ? 'border-[#50e2c3] bg-[#50e2c3]/10'
          : 'border-white/[0.08] hover:border-white/[0.15]'
      }`}
    >
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
        checked ? 'border-[#50e2c3] bg-[#50e2c3]' : 'border-zinc-600'
      }`}>
        {checked && <Check className="w-3 h-3 text-black" />}
      </div>
      <div>
        <div className={`font-medium ${checked ? 'text-[#50e2c3]' : 'text-white'}`}>{label}</div>
        <div className="text-sm text-zinc-500">{description}</div>
      </div>
    </button>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <h3 className="text-sm font-semibold text-[#50e2c3] mb-3">{title}</h3>
      {children}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 mb-2 last:mb-0">
      <span className="text-xs text-zinc-500 sm:w-24 flex-shrink-0">{label}</span>
      <span className="text-sm text-zinc-300">{value}</span>
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

'use client';

import { useEffect, useState } from 'react';
import { Loader2, Search, Users, Plus, X, ArrowRight, ArrowLeft, Check, Globe, Twitter, MessageCircle, Github, Building2, Rocket, HandshakeIcon } from 'lucide-react';
import { MemberCard } from '@/components/MemberCard';
import { FileUpload } from '@/components/FileUpload';

interface Member {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  website: string;
  description: string;
  category: string;
  stage: string;
  seeking: string[];
  offering: string[];
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'lending', label: 'Lending' },
  { id: 'dex', label: 'DEX' },
  { id: 'derivatives', label: 'Derivatives' },
  { id: 'infrastructure', label: 'Infrastructure' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'tooling', label: 'Tooling' },
];

const STAGES = [
  { id: 'all', label: 'All Stages' },
  { id: 'live', label: 'Live' },
  { id: 'testnet', label: 'Testnet' },
  { id: 'building', label: 'Building' },
];

const FORM_CATEGORIES = [
  { id: 'lending', label: 'Lending', desc: 'Lending and borrowing protocols' },
  { id: 'dex', label: 'DEX', desc: 'Decentralized exchanges' },
  { id: 'derivatives', label: 'Derivatives', desc: 'Perpetuals, options, futures' },
  { id: 'infrastructure', label: 'Infrastructure', desc: 'Core infra and tooling' },
  { id: 'analytics', label: 'Analytics', desc: 'Data and analytics' },
  { id: 'tooling', label: 'Tooling', desc: 'Developer and user tools' },
];

const FORM_STAGES = [
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
};

export default function NetworkPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [stage, setStage] = useState('all');
  
  // Application form state
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [form, setForm] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, [category, stage]);

  useEffect(() => {
    const saved = localStorage.getItem('lastnetwork-application-draft');
    if (saved) {
      try {
        setForm(JSON.parse(saved));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (showApplyForm) {
      localStorage.setItem('lastnetwork-application-draft', JSON.stringify(form));
    }
  }, [form, showApplyForm]);

  const fetchMembers = async () => {
    try {
      const params = new URLSearchParams();
      if (category !== 'all') params.set('category', category);
      if (stage !== 'all') params.set('stage', stage);
      
      const res = await fetch(`/api/network/members?${params}`);
      const data = await res.json();
      
      setMembers(data.members || []);
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateForm = (updates: Partial<FormData>) => {
    setForm(f => ({ ...f, ...updates }));
  };

  const canProceed = () => {
    switch (formStep) {
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
    setSubmitError('');

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
      setSubmitSuccess(true);
      setForm(initialFormData);
      setFormStep(1);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredMembers = search
    ? members.filter(m => 
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      )
    : members;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#50e2c3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.06] sticky top-0 bg-[#0a0a0a]/95 backdrop-blur-sm z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-[#50e2c3]" />
              <div>
                <h1 className="text-xl font-bold text-white">Member Directory</h1>
                <p className="text-xs text-zinc-500">Browse network members</p>
              </div>
            </div>
            <button
              onClick={() => {
                setShowApplyForm(true);
                setSubmitSuccess(false);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Apply to Join
            </button>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
            />
          </div>
          
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#50e2c3]/50 appearance-none cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#1a1a1a]">
                  {c.label}
                </option>
              ))}
            </select>
            
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white focus:outline-none focus:border-[#50e2c3]/50 appearance-none cursor-pointer"
            >
              {STAGES.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#1a1a1a]">
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          <Users className="w-5 h-5 text-zinc-500" />
          <span className="text-zinc-400">
            {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'}
          </span>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="text-center py-20">
            <Users className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-zinc-500">No members found</p>
            {search && (
              <button
                onClick={() => setSearch('')}
                className="mt-2 text-[#50e2c3] hover:underline text-sm"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        )}
      </main>

      {/* Application Form Modal */}
      {showApplyForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/[0.08] rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-[#0a0a0a] border-b border-white/[0.06] p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">Apply to Last Network</h2>
              <button
                onClick={() => setShowApplyForm(false)}
                className="p-2 hover:bg-white/[0.05] rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-zinc-400" />
              </button>
            </div>

            {submitSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-[#50e2c3]/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-8 h-8 text-[#50e2c3]" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">Application Submitted!</h3>
                <p className="text-zinc-400 mb-6">
                  We&apos;ll review your application and get back to you within 48 hours.
                </p>
                <button
                  onClick={() => setShowApplyForm(false)}
                  className="px-6 py-2 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="p-6">
                {/* Progress Steps */}
                <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                  {[
                    { id: 1, title: 'Basics', icon: Building2 },
                    { id: 2, title: 'About', icon: Users },
                    { id: 3, title: 'Seeking', icon: Rocket },
                    { id: 4, title: 'Offering', icon: HandshakeIcon },
                    { id: 5, title: 'Proof', icon: Check },
                    { id: 6, title: 'Review', icon: Check },
                  ].map((s, i, arr) => (
                    <div key={s.id} className="flex items-center">
                      <button
                        onClick={() => s.id < formStep && setFormStep(s.id)}
                        disabled={s.id > formStep}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                          s.id === formStep
                            ? 'bg-[#50e2c3] text-black'
                            : s.id < formStep
                            ? 'bg-[#50e2c3]/20 text-[#50e2c3] hover:bg-[#50e2c3]/30'
                            : 'bg-white/[0.05] text-zinc-500'
                        }`}
                      >
                        <s.icon className="w-3.5 h-3.5" />
                        {s.title}
                      </button>
                      {i < arr.length - 1 && (
                        <div className={`w-4 h-0.5 mx-1 ${s.id < formStep ? 'bg-[#50e2c3]' : 'bg-white/[0.1]'}`} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Form Steps */}
                {formStep === 1 && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold text-white">Project Basics</h3>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Project Name *</label>
                      <input
                        type="text"
                        value={form.projectName}
                        onChange={e => updateForm({ projectName: e.target.value })}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
                        placeholder="e.g., HypurrFi"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Website *</label>
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
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Contact Email *</label>
                      <input
                        type="email"
                        value={form.contactEmail}
                        onChange={e => updateForm({ contactEmail: e.target.value })}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
                        placeholder="team@yourproject.xyz"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-zinc-300 mb-1.5">Twitter</label>
                        <div className="relative">
                          <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                          <input
                            type="text"
                            value={form.twitter}
                            onChange={e => updateForm({ twitter: e.target.value })}
                            className="w-full pl-10 pr-3 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 text-sm"
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
                            className="w-full pl-10 pr-3 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 text-sm"
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
                            className="w-full pl-10 pr-3 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 text-sm"
                            placeholder="github.com/..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 2 && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold text-white">About Your Project</h3>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Description *</label>
                      <textarea
                        value={form.description}
                        onChange={e => updateForm({ description: e.target.value })}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 resize-none"
                        placeholder="What does your project do?"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Team Info</label>
                      <textarea
                        value={form.teamInfo}
                        onChange={e => updateForm({ teamInfo: e.target.value })}
                        rows={2}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 resize-none"
                        placeholder="Team size, background, experience"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Category *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {FORM_CATEGORIES.map(cat => (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => updateForm({ category: cat.id })}
                            className={`p-2.5 rounded-lg border text-left transition-colors ${
                              form.category === cat.id
                                ? 'border-[#50e2c3] bg-[#50e2c3]/10'
                                : 'border-white/[0.08] hover:border-white/[0.15]'
                            }`}
                          >
                            <div className={`text-sm font-medium ${form.category === cat.id ? 'text-[#50e2c3]' : 'text-white'}`}>
                              {cat.label}
                            </div>
                            <div className="text-xs text-zinc-500 truncate">{cat.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Stage *</label>
                      <div className="grid grid-cols-3 gap-2">
                        {FORM_STAGES.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => updateForm({ stage: s.id })}
                            className={`p-2.5 rounded-lg border text-left transition-colors ${
                              form.stage === s.id
                                ? 'border-[#50e2c3] bg-[#50e2c3]/10'
                                : 'border-white/[0.08] hover:border-white/[0.15]'
                            }`}
                          >
                            <div className={`text-sm font-medium ${form.stage === s.id ? 'text-[#50e2c3]' : 'text-white'}`}>
                              {s.label}
                            </div>
                            <div className="text-xs text-zinc-500">{s.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {formStep === 3 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">What are you seeking?</h3>
                      <p className="text-zinc-400 text-sm">Select all that apply</p>
                    </div>
                    <div className="space-y-2">
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
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Other</label>
                      <input
                        type="text"
                        value={form.seekingOther}
                        onChange={e => updateForm({ seekingOther: e.target.value })}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
                        placeholder="Anything else?"
                      />
                    </div>
                  </div>
                )}

                {formStep === 4 && (
                  <div className="space-y-5">
                    <div>
                      <h3 className="text-lg font-semibold text-white">What can you offer?</h3>
                      <p className="text-zinc-400 text-sm">Select all that apply</p>
                    </div>
                    <div className="space-y-2">
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
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Other</label>
                      <input
                        type="text"
                        value={form.offeringOther}
                        onChange={e => updateForm({ offeringOther: e.target.value })}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50"
                        placeholder="What else can you bring?"
                      />
                    </div>
                  </div>
                )}

                {formStep === 5 && (
                  <div className="space-y-5">
                    <h3 className="text-lg font-semibold text-white">Proof of Work</h3>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Project Logo</label>
                      <FileUpload
                        type="logo"
                        value={form.logoUrl}
                        onChange={url => updateForm({ logoUrl: url || '' })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-1.5">Tell us about your traction *</label>
                      <textarea
                        value={form.proofOfWork}
                        onChange={e => updateForm({ proofOfWork: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-lg text-white placeholder-zinc-500 focus:outline-none focus:border-[#50e2c3]/50 resize-none"
                        placeholder="Metrics, achievements, milestones, TVL, users..."
                      />
                    </div>
                  </div>
                )}

                {formStep === 6 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-white">Review Your Application</h3>
                    
                    <ReviewSection title="Project Basics">
                      <ReviewItem label="Name" value={form.projectName} />
                      <ReviewItem label="Website" value={form.website} />
                      <ReviewItem label="Contact" value={form.contactEmail} />
                      {form.twitter && <ReviewItem label="Twitter" value={form.twitter} />}
                    </ReviewSection>

                    <ReviewSection title="About">
                      <ReviewItem label="Category" value={FORM_CATEGORIES.find(c => c.id === form.category)?.label || form.category} />
                      <ReviewItem label="Stage" value={FORM_STAGES.find(s => s.id === form.stage)?.label || form.stage} />
                      <ReviewItem label="Description" value={form.description} />
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
                        <div className="mb-2">
                          <img src={form.logoUrl} alt="Logo" className="w-12 h-12 rounded-lg object-contain bg-white/[0.05]" />
                        </div>
                      )}
                      <p className="text-zinc-300 text-sm whitespace-pre-wrap line-clamp-3">{form.proofOfWork}</p>
                    </ReviewSection>
                  </div>
                )}

                {submitError && (
                  <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                    {submitError}
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/[0.06]">
                  <button
                    onClick={() => setFormStep(s => s - 1)}
                    disabled={formStep === 1}
                    className="flex items-center gap-2 px-4 py-2 text-zinc-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                  </button>

                  {formStep < 6 ? (
                    <button
                      onClick={() => setFormStep(s => s + 1)}
                      disabled={!canProceed()}
                      className="flex items-center gap-2 px-5 py-2 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitting}
                      className="flex items-center gap-2 px-5 py-2 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          Submit
                          <Check className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
      className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
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
        <div className={`font-medium text-sm ${checked ? 'text-[#50e2c3]' : 'text-white'}`}>{label}</div>
        <div className="text-xs text-zinc-500">{description}</div>
      </div>
    </button>
  );
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <h4 className="text-xs font-semibold text-[#50e2c3] mb-2">{title}</h4>
      {children}
    </div>
  );
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-2 mb-1 last:mb-0">
      <span className="text-xs text-zinc-500 w-20 flex-shrink-0">{label}</span>
      <span className="text-xs text-zinc-300">{value}</span>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 text-xs font-medium rounded bg-[#50e2c3]/20 text-[#50e2c3]">
      {children}
    </span>
  );
}

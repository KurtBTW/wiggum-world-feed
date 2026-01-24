'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { ArrowRight, Shield, Users, Zap, CheckCircle, Network, LogOut } from 'lucide-react';

const CATEGORIES = [
  { name: 'Lending', description: 'Lending and borrowing protocols' },
  { name: 'DEX', description: 'Decentralized exchanges' },
  { name: 'Derivatives', description: 'Perpetuals and options' },
  { name: 'Infrastructure', description: 'Core infrastructure and tooling' },
  { name: 'Analytics', description: 'Data and analytics platforms' },
  { name: 'Tooling', description: 'Developer and user tools' },
];

const PROCESS_STEPS = [
  {
    step: '01',
    title: 'Apply',
    description: 'Submit your project details, team info, and what you\'re building on Hyperliquid.',
    icon: ArrowRight,
  },
  {
    step: '02',
    title: 'AI Screening',
    description: 'Our AI reviews your application for completeness and fit with the network.',
    icon: Zap,
  },
  {
    step: '03',
    title: 'Human Review',
    description: 'Network admins review AI-screened applications and make final decisions.',
    icon: Shield,
  },
  {
    step: '04',
    title: 'Join Network',
    description: 'Get access to the member directory, connect with other projects, and grow together.',
    icon: Users,
  },
];

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <header className="border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="w-8 h-8 text-[#50e2c3]" />
            <span className="text-xl font-bold text-white">Last Network</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <>
                {session.user.role === 'ADMIN' && (
                  <Link
                    href="/admin"
                    className="text-sm text-yellow-400 hover:underline"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/status"
                  className="text-sm text-[#50e2c3] hover:underline"
                >
                  My Application
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-1 text-sm text-zinc-400 hover:text-white transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="text-sm text-zinc-300 hover:text-white transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#50e2c3]/10 text-[#50e2c3] text-sm font-medium mb-6">
              <span className="w-2 h-2 rounded-full bg-[#50e2c3] animate-pulse" />
              Now accepting applications
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              The Network for{' '}
              <span className="text-[#50e2c3]">DeFi on Hyperliquid</span>
            </h1>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto mb-10">
              Connect with other protocols, find partnerships, and grow together. 
              A curated network of builders shipping on HyperEVM.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={session ? "/apply" : "/auth/signup"}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors text-lg"
              >
                {session ? "Start Application" : "Apply to Join"}
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border border-white/[0.15] text-white rounded-lg hover:bg-white/[0.05] transition-colors text-lg"
              >
                Learn More
              </Link>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">Who's Building?</h2>
              <p className="text-zinc-400">Projects across the Hyperliquid ecosystem</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {CATEGORIES.map((cat) => (
                <div
                  key={cat.name}
                  className="p-4 rounded-lg bg-white/[0.02] border border-white/[0.06] hover:border-[#50e2c3]/30 transition-colors text-center"
                >
                  <h3 className="font-semibold text-white mb-1">{cat.name}</h3>
                  <p className="text-xs text-zinc-500">{cat.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="py-20 px-4 border-t border-white/[0.06]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-white mb-4">How It Works</h2>
              <p className="text-zinc-400">From application to network membership</p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {PROCESS_STEPS.map((step, i) => (
                <div
                  key={step.step}
                  className="relative p-6 rounded-lg bg-white/[0.02] border border-white/[0.06]"
                >
                  <span className="text-5xl font-bold text-white/[0.05] absolute top-4 right-4">
                    {step.step}
                  </span>
                  <step.icon className="w-10 h-10 text-[#50e2c3] mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                  <p className="text-sm text-zinc-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-white/[0.06]">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-white mb-4">What Members Get</h2>
              <p className="text-zinc-400">Benefits of joining the network</p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: 'Member Directory', desc: 'Browse and connect with other verified projects in the ecosystem.' },
                { title: 'Partnership Matching', desc: 'Find projects looking for the same things you\'re offering.' },
                { title: 'Curated News Feed', desc: 'Stay updated with relevant DeFi and AI news filtered for Hyperliquid.' },
                { title: 'Network Events', desc: 'Access to member-only calls, AMAs, and collaboration opportunities.' },
              ].map((benefit) => (
                <div key={benefit.title} className="flex gap-4 p-4">
                  <CheckCircle className="w-6 h-6 text-[#50e2c3] flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-white mb-1">{benefit.title}</h3>
                    <p className="text-sm text-zinc-400">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-white/[0.06]">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to Join?</h2>
            <p className="text-zinc-400 mb-8">
              Applications are reviewed within 48 hours. 
              Join the network of builders shaping DeFi on Hyperliquid.
            </p>
            <Link
              href={session ? "/apply" : "/auth/signup"}
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#50e2c3] text-black font-semibold rounded-lg hover:bg-[#3fcbac] transition-colors text-lg"
            >
              {session ? "Start Application" : "Apply to Join"}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-zinc-500">
            <div className="flex items-center gap-2">
              <Network className="w-5 h-5 text-[#50e2c3]" />
              <span>Last Network</span>
            </div>
            <p>A curated network for DeFi protocols on Hyperliquid</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

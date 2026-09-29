import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  Activity,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clipboard,
  Eye,
  EyeOff,
  Gauge,
  Info,
  KeyRound,
  LockKeyhole,
  Menu,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  TriangleAlert,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import {
  useAnalyzePassword,
  useGeneratePassword,
  useGetDashboardStats,
  useGetWeaknessAnalytics,
  useHealthCheck,
} from '@workspace/api-client-react';
import type {
  PasswordAnalysis,
  PasswordPolicy,
} from '@workspace/api-client-react';
import { Link, Route, Switch, Router as WouterRouter, useLocation } from 'wouter';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

type NavItem = { href: string; label: string; icon: typeof Gauge };

const navItems: NavItem[] = [
  { href: '/', label: 'Analyzer', icon: Gauge },
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/learn', label: 'Learn', icon: BookOpen },
];

const policyDefaults: PasswordPolicy = {
  minimumLength: 14,
  rejectCommonPasswords: true,
  checkPersonalInfo: true,
  allowSpaces: true,
};

function getErrorMessage(error: unknown, fallback = 'Something went wrong. Try again.') {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }
  if (error && typeof error === 'object' && 'error' in error) {
    return String((error as { error: string }).error);
  }
  return fallback;
}

function LogoMark() {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-primary text-primary-foreground shadow-[0_6px_12px_rgba(24,112,105,.22)]">
      <LockKeyhole size={18} strokeWidth={2.4} />
    </div>
  );
}

function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const health = useHealthCheck();
  const healthReady = health.data?.status?.toLowerCase() === 'ok' || health.data?.status?.toLowerCase() === 'healthy';

  return (
    <div className="noise min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-5 lg:px-10">
          <Link href="/" className="flex items-center gap-3" data-testid="link-brand">
            <LogoMark />
            <div className="leading-none">
              <div className="font-display text-[15px] font-bold tracking-[-.02em]">Password Strength</div>
              <div className="mt-1 font-mono-app text-[9px] uppercase tracking-[.18em] text-muted-foreground">Analyzer / defensive lab</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 rounded-full border border-border bg-card/70 p-1 md:flex" aria-label="Primary navigation">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = location === href;
              return (
                <Link
                  key={href}
                  href={href}
                  data-testid={`link-nav-${label.toLowerCase()}`}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
                >
                  <Icon size={15} />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-[11px] font-semibold text-muted-foreground sm:flex" data-testid="status-service-health">
              <span className={`h-2 w-2 rounded-full ${health.isLoading ? 'bg-accent' : healthReady ? 'bg-primary' : 'bg-destructive'}`} />
              {health.isLoading ? 'Checking service' : healthReady ? 'Service operational' : 'Service unavailable'}
            </div>
            <button
              type="button"
              className="rounded-lg border border-border bg-card p-2 text-muted-foreground md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Open navigation"
              data-testid="button-open-navigation"
            >
              {menuOpen ? <X size={19} /> : <Menu size={19} />}
            </button>
          </div>
        </div>
        {menuOpen && (
          <nav className="border-t border-border px-5 py-3 md:hidden" aria-label="Mobile navigation">
            <div className="mx-auto flex max-w-[1440px] flex-col gap-1">
              {navItems.map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  data-testid={`link-mobile-nav-${label.toLowerCase()}`}
                  className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${location === href ? 'bg-secondary text-primary' : 'text-muted-foreground'}`}
                >
                  <Icon size={17} /> {label}
                </Link>
              ))}
            </div>
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 border-t border-border px-5 py-7 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between lg:px-10">
        <div className="flex items-center gap-2"><ShieldCheck size={15} className="text-primary" /> Passwords are analyzed in memory and never returned or stored.</div>
        <div className="font-mono-app text-[10px] uppercase tracking-[.14em]">Instrument build 0.1 / privacy first</div>
      </footer>
    </div>
  );
}

function PageIntro({ eyebrow, title, detail, action }: { eyebrow: string; title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <div className="mb-3 flex items-center gap-2 font-mono-app text-[10px] font-bold uppercase tracking-[.18em] text-primary"><span className="h-1.5 w-1.5 rounded-full bg-accent" /> {eyebrow}</div>
        <h1 className="font-display max-w-3xl text-3xl font-bold tracking-[-.045em] text-foreground sm:text-4xl lg:text-[46px] lg:leading-[1.05]">{title}</h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-7 text-muted-foreground">{detail}</p>
      </div>
      {action}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return <div className="mb-3 flex items-center gap-2 font-mono-app text-[10px] font-bold uppercase tracking-[.16em] text-muted-foreground">{children}</div>;
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-secondary ${className}`} />;
}

function ScoreGauge({ score, classification }: { score: number; classification: string }) {
  const color = score >= 80 ? 'hsl(var(--primary))' : score >= 55 ? 'hsl(var(--accent))' : 'hsl(var(--destructive))';
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative h-48 w-48 rounded-full p-[11px]" style={{ background: `conic-gradient(${color} ${Math.max(0, Math.min(score, 100)) * 3.6}deg, hsl(var(--secondary)) 0deg)` }}>
        <div className="flex h-full w-full flex-col items-center justify-center rounded-full bg-card">
          <div className="font-mono-app text-5xl font-bold tracking-[-.08em]" style={{ color }}>{score}</div>
          <div className="font-mono-app text-[10px] uppercase tracking-[.12em] text-muted-foreground">out of 100</div>
        </div>
      </div>
      <div className="mt-4 rounded-full px-3 py-1 font-mono-app text-[10px] font-bold uppercase tracking-[.13em]" style={{ color, backgroundColor: `${color}18` }} data-testid="status-password-classification">{classification}</div>
    </div>
  );
}

function AnalysisPanel({ result }: { result: PasswordAnalysis }) {
  const { metrics } = result;
  return (
    <section className="animate-rise space-y-4" aria-live="polite">
      <div className="card-surface grid gap-7 rounded-2xl p-6 sm:p-8 lg:grid-cols-[220px_1fr]">
        <ScoreGauge score={result.score} classification={result.classification} />
        <div className="space-y-6">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5">
            <div>
              <SectionLabel><Activity size={13} /> Instrument reading</SectionLabel>
              <h2 className="font-display text-2xl font-bold tracking-[-.035em]">Your password has a signal.</h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">The score reflects resistance to common attack patterns. Policy compliance is measured separately below.</p>
            </div>
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold ${metrics.policyPass ? 'border-primary/30 bg-primary/10 text-primary' : 'border-destructive/25 bg-destructive/10 text-destructive'}`} data-testid="status-policy-result">
              {metrics.policyPass ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              Policy {metrics.policyPass ? 'passes' : 'needs work'}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ['Length', `${metrics.length}`, metrics.lengthBand],
              ['Unique chars', `${metrics.uniqueCharacterCount}`, `${Math.round(metrics.uniqueCharacterRatio * 100)}% variety`],
              ['Character pool', `${metrics.characterPool}`, `${metrics.characterTypes} types`],
              ['Est. entropy', `${Math.round(metrics.estimatedEntropy)} bits`, `${metrics.patternCount} patterns`],
            ].map(([label, value, note]) => (
              <div className="rounded-xl border border-border bg-background/60 p-3" key={label} data-testid={`metric-${label.toLowerCase().replaceAll(' ', '-')}`}>
                <div className="font-mono-app text-[9px] uppercase tracking-[.12em] text-muted-foreground">{label}</div>
                <div className="mt-2 font-display text-xl font-bold">{value}</div>
                <div className="mt-1 text-[11px] text-muted-foreground">{note}</div>
              </div>
            ))}
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between text-xs font-semibold"><span>Signal quality</span><span className="font-mono-app text-muted-foreground">{result.score}/100</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="animate-sweep h-full rounded-full bg-primary" style={{ width: `${result.score}%` }} /></div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="card-surface rounded-2xl p-6">
          <SectionLabel><TriangleAlert size={13} /> Findings</SectionLabel>
          <div className="space-y-2">
            {result.findings.length === 0 ? (
              <div className="rounded-xl border border-primary/25 bg-primary/5 p-5 text-sm text-primary">No material weaknesses were identified in this pass.</div>
            ) : result.findings.map((finding, index) => (
              <div key={`${finding.type}-${index}`} className="flex gap-3 rounded-xl border border-border bg-background/45 p-4" data-testid={`finding-${index}`}>
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${finding.severity === 'critical' ? 'bg-destructive/10 text-destructive' : finding.severity === 'caution' ? 'bg-accent/20 text-foreground' : 'bg-primary/10 text-primary'}`}>
                  {finding.severity === 'critical' ? <TriangleAlert size={15} /> : finding.severity === 'caution' ? <Info size={15} /> : <Check size={15} />}
                </div>
                <div><div className="text-sm font-bold">{finding.title}</div><p className="mt-1 text-xs leading-5 text-muted-foreground">{finding.detail}</p></div>
              </div>
            ))}
          </div>
        </div>
        <div className="card-surface rounded-2xl p-6">
          <SectionLabel><Sparkles size={13} /> Security recommendations</SectionLabel>
          <div className="space-y-4">
            {result.suggestions.length === 0 ? <p className="text-sm text-muted-foreground">No further recommendations for this reading.</p> : result.suggestions.map((suggestion, index) => (
              <div key={`${suggestion.title}-${index}`} className="border-b border-border pb-4 last:border-0 last:pb-0" data-testid={`suggestion-${index}`}>
                <div className="flex gap-2 text-sm font-bold"><span className="font-mono-app text-primary">0{index + 1}</span>{suggestion.title}</div>
                <p className="mt-1 pl-7 text-xs leading-5 text-muted-foreground">{suggestion.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-surface rounded-2xl p-6">
        <SectionLabel><ShieldCheck size={13} /> Explicit policy checks</SectionLabel>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.policyChecks.map((check, index) => (
            <div key={`${check.label}-${index}`} className="flex items-center gap-3 rounded-lg border border-border bg-background/40 px-3 py-3 text-sm" data-testid={`policy-check-${index}`}>
              {check.passed ? <CheckCircle2 className="text-primary" size={17} /> : <XCircle className="text-destructive" size={17} />}
              <span className={check.passed ? 'text-foreground' : 'text-muted-foreground'}>{check.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function GeneratorCard({ onUse }: { onUse: (value: string) => void }) {
  const generate = useGeneratePassword();
  const [length, setLength] = useState<16 | 20 | 24>(20);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [generated, setGenerated] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = () => {
    generate.mutate({ data: { length, uppercase, lowercase, numbers, symbols } }, {
      onSuccess: (result) => { setGenerated(result.password); setCopied(false); },
    });
  };

  const copyGenerated = async () => {
    if (!generated) return;
    await navigator.clipboard?.writeText(generated);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const toggles = [
    ['Uppercase', uppercase, setUppercase],
    ['Lowercase', lowercase, setLowercase],
    ['Numbers', numbers, setNumbers],
    ['Symbols', symbols, setSymbols],
  ] as const;

  return (
    <div className="card-surface rounded-2xl p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div><SectionLabel><Zap size={13} /> Secure generator</SectionLabel><h2 className="font-display text-xl font-bold tracking-[-.03em]">Create a clean starting point</h2></div>
        <div className="rounded-lg bg-accent/15 p-2 text-foreground"><KeyRound size={18} /></div>
      </div>
      <div className="space-y-4">
        <div>
          <div className="mb-2 flex justify-between text-xs font-semibold"><span>Length</span><span className="font-mono-app text-primary">{length} chars</span></div>
          <div className="grid grid-cols-3 gap-2">
            {[16, 20, 24].map((value) => <button key={value} type="button" onClick={() => setLength(value as 16 | 20 | 24)} className={`rounded-lg border px-2 py-2 text-sm font-bold transition-colors ${length === value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary'}`} data-testid={`button-generator-length-${value}`}>{value}</button>)}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {toggles.map(([label, value, setValue]) => <button key={label} type="button" onClick={() => setValue(!value)} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs font-semibold ${value ? 'border-primary/30 bg-primary/5 text-foreground' : 'border-border text-muted-foreground'}`} data-testid={`button-generator-${label.toLowerCase()}`}><span>{label}</span><span className={`h-4 w-4 rounded-full border ${value ? 'border-primary bg-primary' : 'border-muted-foreground'}`}>{value && <Check size={12} className="text-primary-foreground" />}</span></button>)}
        </div>
        <button type="button" onClick={handleGenerate} disabled={generate.isPending} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-60" data-testid="button-generate-password">
          {generate.isPending ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />} {generate.isPending ? 'Generating securely' : 'Generate password'}
        </button>
        {generate.isError && <p className="text-xs text-destructive" data-testid="status-generator-error">{getErrorMessage(generate.error)}</p>}
        {generated && (
          <div className="animate-rise rounded-xl border border-primary/25 bg-primary/5 p-3">
            <div className="mb-2 font-mono-app text-[9px] uppercase tracking-[.14em] text-primary">Generated locally for this session</div>
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1 overflow-hidden text-ellipsis whitespace-nowrap rounded-lg border border-border bg-card px-3 py-2 font-mono-app text-xs" data-testid="text-generated-password">{generated}</div>
              <button type="button" onClick={copyGenerated} className="rounded-lg border border-border bg-card p-2 text-muted-foreground hover:text-primary" aria-label="Copy generated password" data-testid="button-copy-generated">{copied ? <Check size={16} /> : <Clipboard size={16} />}</button>
            </div>
            <button type="button" onClick={() => onUse(generated)} className="mt-3 flex items-center gap-1 text-xs font-bold text-primary hover:underline" data-testid="button-use-generated">Use in analyzer <ArrowUpRight size={13} /></button>
          </div>
        )}
      </div>
    </div>
  );
}

function AnalyzerPage() {
  const analyze = useAnalyzePassword();
  const [password, setPassword] = useState('');
  const [revealed, setRevealed] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [context, setContext] = useState({ firstName: '', birthYear: '', organization: '' });
  const [policy, setPolicy] = useState<PasswordPolicy>(policyDefaults);
  const [result, setResult] = useState<PasswordAnalysis | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    analyze.mutate({
      data: {
        password,
        personalContext: contextOpen && Object.values(context).some(Boolean) ? context : undefined,
        policy: policyOpen ? policy : undefined,
      },
    }, { onSuccess: setResult });
  };

  const useGenerated = (value: string) => {
    setPassword(value);
    setResult(null);
  };

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-12">
      <PageIntro eyebrow="Live analysis workspace" title="Read the signal. Improve the secret." detail="A private, defensive password instrument for students and application-security teams. Nothing you submit is saved, returned, or displayed in aggregate views." action={<div className="hidden items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-muted-foreground lg:flex"><ShieldCheck size={16} className="text-primary" /> Input stays in memory only</div>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,.72fr)]">
        <div className="space-y-5">
          <form onSubmit={handleSubmit} className="card-surface rounded-2xl p-5 sm:p-7">
            <div className="mb-6 flex items-center justify-between gap-3">
              <div><SectionLabel><Target size={13} /> Primary instrument</SectionLabel><h2 className="font-display text-2xl font-bold tracking-[-.035em]">Analyze a password</h2></div>
              <div className="font-mono-app text-[10px] uppercase tracking-[.12em] text-muted-foreground">No retention</div>
            </div>
            <label htmlFor="password-input" className="mb-2 block text-sm font-bold">Password under review</label>
            <div className="relative">
              <input id="password-input" type={revealed ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} maxLength={256} placeholder="Type or paste a password to inspect" className="h-14 w-full rounded-xl border border-input bg-background px-4 pr-12 font-mono-app text-sm outline-none transition-colors placeholder:font-sans placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15" data-testid="input-password" />
              <button type="button" onClick={() => setRevealed((show) => !show)} className="absolute right-2 top-2 rounded-lg p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground" aria-label={revealed ? 'Hide password' : 'Reveal password'} data-testid="button-toggle-password-visibility">{revealed ? <EyeOff size={18} /> : <Eye size={18} />}</button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><span>Never send a real production credential.</span><span className="font-mono-app">{password.length}/256</span></div>

            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <button type="button" onClick={() => setContextOpen((open) => !open)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold ${contextOpen ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/40'}`} data-testid="button-toggle-demo-context"><span className="flex items-center gap-2"><Info size={16} className="text-primary" /> Demo context</span><ChevronDown size={16} className={`transition-transform ${contextOpen ? 'rotate-180' : ''}`} /></button>
              <button type="button" onClick={() => setPolicyOpen((open) => !open)} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-semibold ${policyOpen ? 'border-primary/40 bg-primary/5' : 'border-border bg-background/40'}`} data-testid="button-toggle-policy-controls"><span className="flex items-center gap-2"><ShieldCheck size={16} className="text-primary" /> Policy controls</span><ChevronDown size={16} className={`transition-transform ${policyOpen ? 'rotate-180' : ''}`} /></button>
            </div>
            {contextOpen && (
              <div className="mt-3 grid gap-3 rounded-xl border border-border bg-secondary/35 p-4 sm:grid-cols-3">
                {([['firstName', 'First name', 'e.g. Sam'], ['birthYear', 'Birth year', 'e.g. 2002'], ['organization', 'Organization', 'e.g. Northstar Labs']] as const).map(([key, label, placeholder]) => <label key={key} className="text-xs font-semibold text-muted-foreground">{label}<input value={context[key]} onChange={(event) => setContext({ ...context, [key]: event.target.value })} placeholder={placeholder} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm font-normal text-foreground outline-none focus:border-primary" data-testid={`input-context-${key}`} /></label>)}
              </div>
            )}
            {policyOpen && (
              <div className="mt-3 rounded-xl border border-border bg-secondary/35 p-4">
                <div className="mb-3 text-xs font-bold text-muted-foreground">Evaluate against this local policy</div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-semibold text-muted-foreground">Minimum length<input type="number" min={1} max={128} value={policy.minimumLength} onChange={(event) => setPolicy({ ...policy, minimumLength: Number(event.target.value) })} className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm font-normal text-foreground outline-none focus:border-primary" data-testid="input-policy-minimum-length" /></label>
                  {([['rejectCommonPasswords', 'Reject common passwords'], ['checkPersonalInfo', 'Check demo context'], ['allowSpaces', 'Allow spaces']] as const).map(([key, label]) => <label key={key} className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2.5 text-xs font-semibold"><input type="checkbox" checked={policy[key]} onChange={(event) => setPolicy({ ...policy, [key]: event.target.checked })} className="h-4 w-4 accent-[hsl(var(--primary))]" data-testid={`input-policy-${key}`} /> {label}</label>)}
                </div>
              </div>
            )}
            <button type="submit" disabled={!password || analyze.isPending} className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55" data-testid="button-analyze-password">{analyze.isPending ? <RefreshCw className="animate-spin" size={17} /> : <Activity size={17} />} {analyze.isPending ? 'Reading password signal' : 'Analyze password'}</button>
            {analyze.isError && <div className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive" data-testid="status-analyze-error"><TriangleAlert size={15} className="mt-0.5 shrink-0" /> {getErrorMessage(analyze.error)}</div>}
          </form>
          {result ? <AnalysisPanel result={result} /> : <div className="card-surface flex min-h-[238px] flex-col items-center justify-center rounded-2xl border-dashed px-6 py-12 text-center"><div className="mb-4 rounded-2xl bg-secondary p-4 text-primary"><Gauge size={28} /></div><h2 className="font-display text-xl font-bold">Your reading will appear here</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">Submit a password to see strength, pattern findings, explicit policy checks, and practical next steps.</p></div>}
        </div>
        <div className="space-y-5">
          <GeneratorCard onUse={useGenerated} />
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
            <div className="mb-3 flex items-center gap-2 font-mono-app text-[10px] font-bold uppercase tracking-[.16em] text-primary"><ShieldCheck size={14} /> Why this is safe</div>
            <p className="text-sm leading-6 text-foreground/80">The API returns analysis metadata only. Your password is not echoed back, stored, or included in dashboard statistics.</p>
            <Link href="/learn" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" data-testid="link-learn-privacy">Read the privacy model <ChevronRight size={14} /></Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function DashboardPage() {
  const stats = useGetDashboardStats();
  const weaknesses = useGetWeaknessAnalytics();
  const classificationTotal = useMemo(() => stats.data?.classificationCounts?.reduce((sum, item) => sum + item.count, 0) || 0, [stats.data?.classificationCounts]);
  const maxWeakness = Math.max(...(weaknesses.data?.weaknesses?.map((item) => item.count) || [1]));
  const statCards: { label: string; value: string | number; note: string; Icon: typeof Activity }[] = [
    { label: 'Analyses observed', value: stats.data?.totalAnalyses ?? 0, note: 'since service start', Icon: Activity },
    { label: 'Average signal', value: stats.data ? `${Math.round(stats.data.averageScore)}/100` : '—', note: 'strength score', Icon: Gauge },
    { label: 'Average length', value: stats.data ? `${stats.data.averageLength.toFixed(1)} chars` : '—', note: 'per analysis', Icon: KeyRound },
    { label: 'Strong or better', value: classificationTotal ? `${Math.round((((stats.data?.classificationCounts.find((item) => item.classification === 'STRONG')?.count || 0) + (stats.data?.classificationCounts.find((item) => item.classification === 'VERY STRONG')?.count || 0)) / classificationTotal) * 100)}%` : '—', note: 'of classifications', Icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-12">
      <PageIntro eyebrow="Aggregate metadata" title="See the shape of your practice." detail="A privacy-safe operational view of analysis activity. Only counts, scores, and weakness categories are shown — never passwords or personal context." action={<button type="button" onClick={() => { void stats.refetch(); void weaknesses.refetch(); }} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-bold text-foreground hover:bg-secondary" data-testid="button-refresh-dashboard"><RefreshCw size={15} /> Refresh data</button>} />
      {(stats.isError || weaknesses.isError) ? <div className="mb-5 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/10 p-4 text-sm text-destructive" data-testid="status-dashboard-error"><TriangleAlert size={17} /> <div><div className="font-bold">Dashboard data could not be loaded.</div><div className="mt-1 text-xs">{getErrorMessage(stats.error || weaknesses.error)} Use refresh to retry.</div></div></div> : null}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ label, value, note, Icon }, index) => <div className="card-surface rounded-2xl p-5" key={label} data-testid={`dashboard-stat-${index}`}><div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">{label}</span><Icon size={17} className="text-primary" /></div>{stats.isLoading ? <Skeleton className="mt-4 h-8 w-24" /> : <div className="mt-3 font-display text-3xl font-bold tracking-[-.05em]">{value}</div>}<div className="mt-2 font-mono-app text-[9px] uppercase tracking-[.12em] text-muted-foreground">{note}</div></div>)}
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
        <div className="card-surface rounded-2xl p-6">
          <div className="mb-6 flex items-start justify-between"><div><SectionLabel><Activity size={13} /> Recent signal</SectionLabel><h2 className="font-display text-xl font-bold">Score movement</h2></div><span className="rounded-full bg-secondary px-3 py-1 font-mono-app text-[10px] text-muted-foreground">latest {stats.data?.recentScores?.length || 0}</span></div>
          {stats.isLoading ? <Skeleton className="h-52 w-full" /> : stats.data?.recentScores?.length ? <div className="flex h-52 items-end gap-2 border-b border-l border-border px-3 pb-0 pt-5 sm:gap-4">{stats.data.recentScores.map((score, index) => <div key={`${score}-${index}`} className="group flex h-full flex-1 flex-col items-center justify-end gap-2"><span className="font-mono-app text-[10px] text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">{score}</span><div className="w-full max-w-[44px] rounded-t-md bg-primary transition-all group-hover:bg-accent" style={{ height: `${Math.max(8, score)}%` }} data-testid={`bar-score-${index}`} /><span className="font-mono-app text-[9px] text-muted-foreground">{index + 1}</span></div>)}</div> : <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">No aggregate readings yet.</div>}
          <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground"><span>Older</span><span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> score / 100</span><span>Recent</span></div>
        </div>
        <div className="card-surface rounded-2xl p-6">
          <SectionLabel><BarChart3 size={13} /> Classification mix</SectionLabel><h2 className="font-display text-xl font-bold">Where the signals land</h2>
          <div className="mt-5 space-y-4">
            {stats.isLoading ? [1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-9 w-full" />) : stats.data?.classificationCounts?.length ? stats.data.classificationCounts.map((item, index) => <div key={item.classification} data-testid={`classification-row-${index}`}><div className="mb-1.5 flex justify-between text-xs"><span className="font-semibold">{item.classification}</span><span className="font-mono-app text-muted-foreground">{item.count}</span></div><div className="h-2 rounded-full bg-secondary"><div className={`h-2 rounded-full ${item.classification.includes('VERY STRONG') ? 'bg-primary' : item.classification.includes('STRONG') ? 'bg-primary/70' : item.classification.includes('MODERATE') ? 'bg-accent' : 'bg-destructive/70'}`} style={{ width: `${classificationTotal ? (item.count / classificationTotal) * 100 : 0}%` }} /></div></div>) : <p className="text-sm text-muted-foreground">No classifications have been recorded yet.</p>}
          </div>
        </div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6"><SectionLabel><LockKeyhole size={13} /> Data boundary</SectionLabel><h2 className="font-display text-xl font-bold">Useful without exposure.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">This dashboard is deliberately unable to display passwords, generated values, or personal context. It receives aggregate metadata only.</p><Link href="/learn" className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline" data-testid="link-dashboard-learn">Understand the model <ArrowUpRight size={13} /></Link></div>
        <div className="card-surface rounded-2xl p-6"><SectionLabel><TriangleAlert size={13} /> Weakness analytics</SectionLabel><h2 className="font-display text-xl font-bold">Recurring patterns to teach against</h2><div className="mt-6 space-y-4">{weaknesses.isLoading ? [1, 2, 3].map((item) => <Skeleton key={item} className="h-8 w-full" />) : weaknesses.data?.weaknesses?.length ? weaknesses.data.weaknesses.map((item, index) => <div key={item.type} className="flex items-center gap-3" data-testid={`weakness-row-${index}`}><div className="w-32 shrink-0 text-xs font-semibold text-muted-foreground sm:w-44">{item.label}</div><div className="h-2 flex-1 rounded-full bg-secondary"><div className="h-2 rounded-full bg-accent" style={{ width: `${(item.count / maxWeakness) * 100}%` }} /></div><div className="w-8 text-right font-mono-app text-xs">{item.count}</div></div>) : <p className="text-sm text-muted-foreground">No weakness categories are available yet.</p>}</div></div>
      </div>
    </div>
  );
}

const lessons = [
  { number: '01', title: 'Length is leverage', summary: 'Every extra character expands the work an attacker must do.', detail: 'Aim for 14 characters or more. A long passphrase made from unrelated words is often easier to remember and harder to guess than a short string with cosmetic substitutions.' },
  { number: '02', title: 'Patterns leave fingerprints', summary: 'Names, dates, keyboard walks, and repeated fragments are fast to test.', detail: 'Attackers do not only try dictionaries. They mutate common words, append years, swap letters for symbols, and test sequences that humans favor.' },
  { number: '03', title: 'Uniqueness beats rotation', summary: 'One password reused across services creates a blast radius.', detail: 'Use a password manager to generate and store a different secret for every service. Rotation is useful after exposure, not as a substitute for uniqueness.' },
  { number: '04', title: 'Policy is not strength', summary: 'A password can be strong and still fail your application policy.', detail: 'Keep the two measurements distinct: strength estimates resistance to guessing, while policy checks enforce the requirements your team selected.' },
];

function LearnPage() {
  const [openLesson, setOpenLesson] = useState(0);
  return (
    <div className="mx-auto max-w-[1440px] px-5 py-8 lg:px-10 lg:py-12">
      <PageIntro eyebrow="Security learning center" title="Make better secrets feel obvious." detail="Short, practical guidance for students and builders. Learn the mechanics behind the instrument, then test a harmless example in the analyzer." action={<Link href="/" className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:-translate-y-0.5" data-testid="link-learn-analyzer"><Activity size={15} /> Open analyzer</Link>} />
      <div className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="hairline-grid relative overflow-hidden rounded-2xl border border-border bg-card p-7 sm:p-10"><div className="absolute -right-20 -top-20 h-56 w-56 rounded-full border-[22px] border-accent/20" /><div className="relative max-w-xl"><div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck size={24} /></div><div className="font-mono-app text-[10px] uppercase tracking-[.18em] text-primary">Field note / 001</div><h2 className="mt-3 font-display text-3xl font-bold leading-tight tracking-[-.05em] sm:text-4xl">A password is not a mood. It is an attack surface.</h2><p className="mt-5 max-w-lg text-sm leading-7 text-muted-foreground">The goal is not to make secrets complicated. The goal is to remove the shortcuts that make guessing cheap.</p></div></div>
        <div className="rounded-2xl border border-primary/20 bg-primary p-7 text-primary-foreground sm:p-9"><div className="flex items-center justify-between"><span className="font-mono-app text-[10px] uppercase tracking-[.18em] opacity-75">Quick protocol</span><Sparkles size={18} /></div><h2 className="mt-12 font-display text-2xl font-bold tracking-[-.04em]">The three moves that matter</h2><div className="mt-6 space-y-4">{['Use a unique secret for each service.', 'Prefer 14+ characters or an unrelated passphrase.', 'Store it in a reputable password manager.'].map((item, index) => <div className="flex gap-3 border-t border-primary-foreground/20 pt-4 text-sm" key={item}><span className="font-mono-app text-accent">0{index + 1}</span><span>{item}</span></div>)}</div></div>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-[.75fr_1.25fr]">
        <div className="card-surface rounded-2xl p-6"><SectionLabel><Target size={13} /> Operator checklist</SectionLabel><h2 className="font-display text-xl font-bold">Before you ship auth</h2><div className="mt-5 space-y-3">{['Never log raw password values.', 'Compare policy status separately from score.', 'Keep generated secrets out of URLs and analytics.', 'Teach recovery without weakening the secret.'].map((item) => <div key={item} className="flex items-start gap-3 text-sm"><CheckCircle2 size={17} className="mt-0.5 shrink-0 text-primary" /> <span className="text-muted-foreground">{item}</span></div>)}</div></div>
        <div className="card-surface rounded-2xl p-6"><SectionLabel><BookOpen size={13} /> Core concepts</SectionLabel><div className="mt-1 divide-y divide-border">{lessons.map((lesson, index) => <div key={lesson.number} className="py-4 first:pt-1"><button type="button" onClick={() => setOpenLesson(openLesson === index ? -1 : index)} className="flex w-full items-start justify-between gap-4 text-left" data-testid={`button-lesson-${index}`}><span className="flex gap-4"><span className="font-mono-app text-xs text-primary">{lesson.number}</span><span><span className="block font-display text-lg font-bold">{lesson.title}</span><span className="mt-1 block text-sm text-muted-foreground">{lesson.summary}</span></span></span><ChevronDown size={17} className={`mt-1 shrink-0 text-muted-foreground transition-transform ${openLesson === index ? 'rotate-180' : ''}`} /></button>{openLesson === index && <p className="animate-rise ml-9 mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">{lesson.detail}</p>}</div>)}</div></div>
      </div>
      <div className="mt-5 flex flex-col items-start justify-between gap-5 rounded-2xl border border-border bg-secondary/55 p-6 sm:flex-row sm:items-center sm:p-8"><div><div className="font-mono-app text-[10px] uppercase tracking-[.17em] text-primary">Ready to practice?</div><h2 className="mt-2 font-display text-2xl font-bold tracking-[-.04em]">Bring a harmless example. Leave with a stronger habit.</h2></div><Link href="/" className="flex shrink-0 items-center gap-2 rounded-lg bg-foreground px-4 py-3 text-sm font-bold text-background hover:-translate-y-0.5" data-testid="link-learn-practice">Practice in analyzer <ArrowUpRight size={15} /></Link></div>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}><Switch><Route path="/" component={AnalyzerPage} /><Route path="/dashboard" component={DashboardPage} /><Route path="/learn" component={LearnPage} /><Route component={NotFound} /></Switch></ErrorBoundary>;
}

function App() {
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><AppShell><Router /></AppShell></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;
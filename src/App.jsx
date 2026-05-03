import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Globe, Lock, ExternalLink, PartyPopper, Sparkles, Wifi, WifiOff, Radio } from 'lucide-react';

// ============================
// 설정
// ============================
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzPtdKQtyibcPb0UXiYgYxZKjT8Cbbo_I1mYnXkt1IG4Ap0mbv6l4KGvlOts03qSCDAgw/exec';
const POLL_INTERVAL_MS = 5000;

const TASK_GROUPS = {
  G3: { label: '전개 시작',    sub: 'Web방화벽 / DNS / OS 중지', color: '#FF5E9F', glow: 'rgba(255,94,159,0.7)' },
  G4: { label: 'vMotion 이관', sub: '데이터 / 서버 이전',         color: '#A78BFA', glow: 'rgba(167,139,250,0.7)' },
  G5: { label: '서비스 전환',  sub: 'DB / WAS / WEB 재기동',     color: '#22D3EE', glow: 'rgba(34,211,238,0.7)' },
  G6: { label: 'AP 테스트',    sub: 'DNS 변경 · 점검',           color: '#34D399', glow: 'rgba(52,211,153,0.7)' },
  G7: { label: '사용자 검증',  sub: 'URL 4종 동작 확인',         color: '#FBBF24', glow: 'rgba(251,191,36,0.7)' },
  G8: { label: '전환 종료',    sub: '종료 선언 / 공지 제거',     color: '#FB923C', glow: 'rgba(251,146,60,0.7)' }
};

// ============================
// 메인 컴포넌트
// ============================
export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [tick, setTick] = useState(0);
  const [now, setNow] = useState(new Date());
  const [verifiedUrls, setVerifiedUrls] = useState(new Set());
  const [verifyingId, setVerifyingId] = useState(null);
  const [celebrating, setCelebrating] = useState(false);
  const [connStatus, setConnStatus] = useState(SHEETS_API_URL ? 'connecting' : 'demo');
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(SHEETS_API_URL);
        const json = await res.json();
        if (json.ok && Array.isArray(json.tasks)) {
          setTasks(json.tasks);
          setConnStatus('connected');
          setLastSync(new Date());
        }
      } catch (err) {
        setConnStatus('error');
      }
    };
    fetchData();
    const poll = setInterval(fetchData, POLL_INTERVAL_MS);
    const tickT = setInterval(() => setTick(x => x + 1), 600);
    return () => { clearInterval(poll); clearInterval(tickT); };
  }, []);

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.status === 'done').length;
    const prog = tasks.filter(t => t.status === 'progress').length;
    const wait = tasks.filter(t => t.status === 'wait').length;
    const total = tasks.length;
    const overall = total ? Math.round(tasks.reduce((s, t) => s + (t.status === 'done' ? 100 : (t.status === 'progress' ? 50 : 0)), 0) / total) : 0;
    return { done, prog, wait, total, overall };
  }, [tasks]);

  const dnsTask = tasks.find(t => t.isDns);
  const dnsReady = dnsTask && dnsTask.status === 'done';
  const urlTasks = tasks.filter(t => t.isUrlCheck).sort((a, b) => Number(a.id) - Number(b.id));
  const flowingTasks = tasks.filter(t => t.status === 'progress');

  const handleUrlClick = (id) => {
    if (!dnsReady || verifiedUrls.has(id) || verifyingId) return;
    setVerifyingId(id);
    setTimeout(() => {
      setVerifiedUrls(prev => { const n = new Set(prev); n.add(id); return n; });
      setVerifyingId(null);
    }, 1400);
  };

  useEffect(() => {
    if (urlTasks.length > 0 && verifiedUrls.size === urlTasks.length && !celebrating) {
      setTimeout(() => setCelebrating(true), 400);
    }
  }, [verifiedUrls, celebrating, urlTasks.length]);

  return (
    <div className="min-h-screen w-full overflow-x-hidden text-white relative" style={{
      background: 'linear-gradient(180deg, #0A0E27 0%, #050818 100%)',
      fontFamily: '"Pretendard", sans-serif'
    }}>
      <BinaryRain />
      <Header now={now} stats={stats} connStatus={connStatus} lastSync={lastSync} />

      <main className="relative px-4 sm:px-8 pb-12 flex flex-col gap-8 max-w-7xl mx-auto">
        {/* Top Panels: AS-IS & TO-BE */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Panel title="AS-IS SOURCE" subtitle="기존 환경" color="#64748B">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {tasks.map((task, i) => <ServerNode key={'asis-'+task.id} task={task} mode="asis" index={i} />)}
            </div>
          </Panel>
          <Panel title="TO-BE TARGET" subtitle="신규 환경" color="#34D399">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {tasks.map((task, i) => <ServerNode key={'tobe-'+task.id} task={task} mode="tobe" index={i} />)}
            </div>
          </Panel>
        </div>

        {/* Central Visualization */}
        <div className="relative h-[200px] md:h-[300px] rounded-3xl overflow-hidden bg-slate-950/40 border border-white/5 backdrop-blur-sm">
          <DataMigrationVisual tasks={tasks} flowingTasks={flowingTasks} tick={tick} />
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
             <div className="px-6 py-3 rounded-2xl bg-slate-900/80 border border-emerald-500/30 backdrop-blur-xl text-center">
                <div className="text-[10px] tracking-[0.4em] text-emerald-400/70 mb-1 font-bold uppercase">Active Transfers</div>
                <div className="text-4xl font-black text-emerald-400">{flowingTasks.length}</div>
             </div>
          </div>
        </div>

        {/* Bottom Gauges & DNS */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-7"><CapsuleGauges tasks={tasks} /></div>
          <div className="xl:col-span-5">
            <DnsPanel dnsTask={dnsTask} dnsReady={dnsReady} urlTasks={urlTasks} verifiedUrls={verifiedUrls} verifyingId={verifyingId} onUrlClick={handleUrlClick} />
          </div>
        </div>
      </main>

      {celebrating && <CelebrationOverlay onClose={() => setCelebrating(false)} />}
      <Styles />
    </div>
  );
}

// ============================
// 하위 컴포넌트들
// ============================

function Panel({ title, subtitle, color, children }) {
  return (
    <div className="bg-slate-900/50 rounded-3xl p-6 border border-white/5 backdrop-blur-xl relative">
      <div className="absolute top-0 left-8 -translate-y-1/2 px-4 py-1 rounded-full bg-slate-800 border border-white/10 text-[10px] tracking-[0.4em] font-black" style={{ color }}>
        {title}
      </div>
      <div className="mb-4 flex items-center justify-between">
        <div className="text-xs font-bold text-white/40 uppercase tracking-widest">{subtitle}</div>
      </div>
      {children}
    </div>
  );
}

function ServerNode({ task, mode, index }) {
  const meta = TASK_GROUPS[task.group] || { color: '#888', glow: 'rgba(136,136,136,0.5)' };
  const isAsIs = mode === 'asis';
  let active, blinking, deactivated;
  
  if (isAsIs) {
    deactivated = task.status === 'done';
    blinking = task.status === 'progress';
    active = task.status === 'wait';
  } else {
    deactivated = task.status === 'wait';
    blinking = task.status === 'progress';
    active = task.status === 'done';
  }

  const cleanName = task.name.replace(/^\d+\.\d+\s*/, '');

  return (
    <div className={`relative rounded-xl p-3 backdrop-blur-md transition-all duration-700 ${blinking ? 'node-blink' : ''}`}
      style={{
        background: deactivated ? 'rgba(15, 23, 42, 0.4)' : `linear-gradient(90deg, ${meta.color}15 0%, rgba(30, 41, 59, 0.6) 100%)`,
        border: `1px solid ${deactivated ? 'rgba(100, 116, 139, 0.15)' : meta.color + '50'}`,
        opacity: deactivated ? 0.4 : 1
      }}>
      <div className="flex items-center gap-3">
        <div className="relative shrink-0">
          <div className="w-2.5 h-2.5 rounded-full" style={{
            background: deactivated ? '#475569' : meta.color,
            boxShadow: !deactivated && (blinking || active) ? `0 0 10px ${meta.color}` : 'none'
          }} />
          {blinking && <div className="absolute inset-0 rounded-full animate-ping bg-current" style={{ color: meta.color }} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[9px] font-mono opacity-50 uppercase tracking-wider mb-0.5" style={{ color: meta.color }}>{task.id}</div>
          <div className={`text-[11px] font-bold truncate ${deactivated ? 'text-slate-500' : 'text-slate-100'}`}>{cleanName}</div>
        </div>
        {blinking && (
          <div className="w-12 h-0.5 rounded-full bg-white/10 overflow-hidden hidden sm:block">
            <div className="h-full bg-cyan-400 animate-[shimmer_2s_infinite]" style={{ width: '100%' }} />
          </div>
        )}
      </div>
    </div>
  );
}

function Header({ now, stats, connStatus, lastSync }) {
  return (
    <header className="pt-10 pb-6 px-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-4 text-[10px] tracking-widest font-bold text-white/40">
        <span className="text-rose-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> LIVE</span>
        <span>·</span>
        <span>{now.toLocaleTimeString('ko-KR', { hour12: false })}</span>
        <span>·</span>
        <span style={{ color: connStatus === 'connected' ? '#34D399' : '#FBBF24' }}>{connStatus.toUpperCase()}</span>
      </div>
      <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-2" style={{
        background: 'linear-gradient(90deg, #34D399, #22D3EE, #34D399)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'titleShine 8s linear infinite'
      }}>경기도교육청 중앙도서관 이전</h1>
      <div className="text-lg md:text-xl font-light tracking-[0.4em] text-white/60 uppercase">Real-time Migration Monitor</div>
      
      <div className="mt-8 flex items-center justify-center gap-12">
        <div className="text-center">
           <div className="text-5xl font-black tabular-nums text-emerald-400">{stats.overall}%</div>
           <div className="text-[10px] tracking-[0.3em] text-white/30 mt-1 uppercase">Total Progress</div>
        </div>
        <div className="flex gap-8 border-l border-white/10 pl-12">
           <MiniStat label="DONE" val={stats.done} color="#34D399" />
           <MiniStat label="LIVE" val={stats.prog} color="#FBBF24" />
           <MiniStat label="WAIT" val={stats.wait} color="#64748B" />
        </div>
      </div>
    </header>
  );
}

function MiniStat({ label, val, color }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-black tabular-nums" style={{ color }}>{val}</div>
      <div className="text-[9px] tracking-widest text-white/30 uppercase">{label}</div>
    </div>
  );
}

function DataMigrationVisual({ tasks, flowingTasks, tick }) {
  return (
    <svg className="w-full h-full" viewBox="0 0 1200 300" preserveAspectRatio="xMidYMid slice">
      <defs>
        <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
      </defs>
      {Array.from({ length: 20 }).map((_, i) => {
        const y = 50 + (i * 12);
        const path = `M 100,${y} C 400,${y} 800,${300-y} 1100,${300-y}`;
        const duration = 15;
        const delay = (i / 20) * -duration;
        const color = ['#34D399', '#22D3EE', '#A78BFA'][i % 3];
        return (
          <g key={i}>
            <path d={path} stroke={color} strokeWidth="1" fill="none" opacity="0.1" />
            <path d={path} stroke={color} strokeWidth="2" fill="none" opacity="0.6" strokeDasharray="50 150" filter="url(#glow)"
              style={{ animation: `flowLaser ${duration}s ${delay}s linear infinite` }} />
          </g>
        );
      })}
    </svg>
  );
}

function CapsuleGauges({ tasks }) {
  const byGroup = useMemo(() => {
    const r = {};
    Object.keys(TASK_GROUPS).forEach(g => {
      const f = tasks.filter(t => t.group === g);
      const done = f.filter(t => t.status === 'done').length;
      const pct = f.length ? Math.round((done / f.length) * 100) : 0;
      r[g] = { total: f.length, done, pct };
    });
    return r;
  }, [tasks]);

  return (
    <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5">
      <div className="text-[10px] tracking-[0.4em] text-white/30 mb-6 text-center uppercase font-bold">Process Group Progress</div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(TASK_GROUPS).map(([key, g]) => {
          const data = byGroup[key];
          return (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-bold" style={{ color: g.color }}>{g.label}</span>
                <span className="text-sm font-black tabular-nums" style={{ color: g.color }}>{data.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div className="h-full transition-all duration-1000" style={{ width: `${data.pct}%`, background: g.color, boxShadow: `0 0 10px ${g.color}` }} />
              </div>
              <div className="text-[8px] text-white/20 uppercase tracking-tighter">{g.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DnsPanel({ dnsTask, dnsReady, urlTasks, verifiedUrls, verifyingId, onUrlClick }) {
  return (
    <div className="bg-slate-900/40 rounded-3xl p-6 border border-white/5 h-full">
      <div className="flex items-center gap-3 mb-6">
        <Globe className={`w-5 h-5 ${dnsReady ? 'text-emerald-400' : 'text-slate-600'}`} />
        <div className="text-[10px] tracking-[0.3em] font-black text-white/40 uppercase">Verification Hub</div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {urlTasks.map((task, i) => {
          const verified = verifiedUrls.has(task.id) || task.status === 'done';
          const verifying = verifyingId === task.id;
          const u = task.urlInfo || { label: task.name, url: '-' };
          return (
            <button key={task.id} disabled={!dnsReady || verified || verifyingId} onClick={() => onUrlClick(task.id)}
              className={`p-3 rounded-2xl text-left transition-all duration-500 border ${verified ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/30 border-white/5'}`}>
              <div className="text-[9px] font-mono mb-1 opacity-40">{task.id}</div>
              <div className="text-[10px] font-bold truncate mb-1">{u.label}</div>
              <div className={`text-[9px] font-black tracking-widest ${verified ? 'text-emerald-400' : 'text-slate-500'}`}>
                {verified ? 'VERIFIED ✓' : verifying ? 'CHECKING...' : 'PENDING'}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function BinaryRain() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-[0.03] overflow-hidden">
      {Array.from({ length: 20 }).map((_, i) => (
        <div key={i} className="absolute text-[10px] font-mono text-cyan-400" style={{
          left: `${(i/20)*100}%`, top: '-20%', animation: `binaryFall ${10 + Math.random()*15}s ${Math.random()*10}s linear infinite`
        }}>
          {Array.from({ length: 30 }).map(() => Math.random() > 0.5 ? '1' : '0').join('\n')}
        </div>
      ))}
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      @keyframes titleShine { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
      @keyframes flowLaser { from { stroke-dashoffset: 200; } to { stroke-dashoffset: 0; } }
      @keyframes binaryFall { from { transform: translateY(0); } to { transform: translateY(100vh); } }
      @keyframes shimmer { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
      @keyframes nodeBlink { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(0.98); opacity: 0.8; } }
      .node-blink { animation: nodeBlink 2s ease-in-out infinite; }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }
      .celebrate-in { animation: celebrateIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards; }
      @keyframes celebrateIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    `}</style>
  );
}

function CelebrationOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
      <div className="text-center celebrate-in">
        <Sparkles className="w-16 h-16 text-emerald-400 mx-auto mb-6 animate-bounce" />
        <h1 className="text-6xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">SUCCESS!</h1>
        <p className="text-xl text-white/70 mb-8">모든 서비스가 신규 환경으로 완벽히 이전되었습니다.</p>
        <button onClick={onClose} className="px-8 py-3 rounded-full bg-emerald-500 text-slate-950 font-bold hover:scale-105 transition-all">확인</button>
      </div>
    </div>
  );
}

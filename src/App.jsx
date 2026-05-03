import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Globe, Lock, ExternalLink, PartyPopper, Sparkles, Wifi, WifiOff, Radio, Server, Cloud, ArrowRight } from 'lucide-react';

// ============================
// 설정
// ============================
const SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzPtdKQtyibcPb0UXiYgYxZKjT8Cbbo_I1mYnXkt1IG4Ap0mbv6l4KGvlOts03qSCDAgw/exec';
const POLL_INTERVAL_MS = 5000;

// ============================
// 6개 작업 그룹
// ============================
const TASK_GROUPS = {
  G3: { label: '전개 시작',    sub: 'Web방화벽 / DNS / OS 중지', color: '#FF5E9F', glow: 'rgba(255,94,159,0.7)' },
  G4: { label: 'vMotion 이관', sub: '데이터 / 서버 이전',         color: '#A78BFA', glow: 'rgba(167,139,250,0.7)' },
  G5: { label: '서비스 전환',  sub: 'DB / WAS / WEB 재기동',     color: '#22D3EE', glow: 'rgba(34,211,238,0.7)' },
  G6: { label: 'AP 테스트',    sub: 'DNS 변경 · 점검',           color: '#34D399', glow: 'rgba(52,211,153,0.7)' },
  G7: { label: '사용자 검증',  sub: 'URL 4종 동작 확인',         color: '#FBBF24', glow: 'rgba(251,191,36,0.7)' },
  G8: { label: '전환 종료',    sub: '종료 선언 / 공지 제거',     color: '#FB923C', glow: 'rgba(251,146,60,0.7)' }
};

// ============================
// 데모 태스크 (실제 시트 구조 반영)
// ============================
const DEMO_TASKS = [
  { id: '311', name: '3.11 작업시작 선언', group: 'G3', status: 'done', progress: 100 },
  { id: '312', name: '3.12 Web방화벽 공지등록', group: 'G3', status: 'done', progress: 100 },
  { id: '313', name: '3.13 DNS도메인 IP변경', group: 'G3', status: 'done', progress: 100 },
  { id: '320', name: '3.20 Web/Was/DB 재기동', group: 'G3', status: 'done', progress: 100 },
  { id: '321', name: '3.21 Web/Was 서비스 중지', group: 'G3', status: 'progress', progress: 65 },
  { id: '322', name: '3.22 DB 백업', group: 'G3', status: 'wait', progress: 0 },
  { id: '323', name: '3.23 DB서버 / OS 중지', group: 'G3', status: 'wait', progress: 0 },
  { id: '324', name: '3.24 이동서버 전원 OFF', group: 'G3', status: 'wait', progress: 0 },
  { id: '325', name: '3.25 DB서버 장비 해체', group: 'G3', status: 'wait', progress: 0 },
  { id: '411', name: '4.11 vConvertor (DMZ)', group: 'G4', status: 'wait', progress: 0 },
  { id: '412', name: '4.12 vConvertor (내부망)', group: 'G4', status: 'wait', progress: 0 },
  { id: '413', name: '4.13 vConvertor (좌석예약)', group: 'G4', status: 'wait', progress: 0 },
  { id: '420', name: '4.20 장비 이동', group: 'G4', status: 'wait', progress: 0 },
  { id: '441', name: '4.41 vMotion (WEB)', group: 'G4', status: 'wait', progress: 0 },
  { id: '442', name: '4.42 vMotion (WAS)', group: 'G4', status: 'wait', progress: 0 },
  { id: '482', name: '4.82 WEB존 환경점검', group: 'G4', status: 'wait', progress: 0 },
  { id: '485', name: '4.85 서버 DNS IP변경', group: 'G4', status: 'wait', progress: 0 },
  { id: '511', name: '5.11 DB 전환·재기동', group: 'G5', status: 'wait', progress: 0 },
  { id: '512', name: '5.12 WAS 전환·재기동', group: 'G5', status: 'wait', progress: 0 },
  { id: '513', name: '5.13 WEB 전환·재기동', group: 'G5', status: 'wait', progress: 0 },
  { id: '514', name: '5.14 서비스 확인', group: 'G5', status: 'wait', progress: 0 },
  { id: '611', name: '6.11 DNS변경(해당없음)', group: 'G6', status: 'wait', progress: 0, isDns: true },
  { id: '711', name: '7.11 중앙도서관 서비스 오픈 확인', group: 'G7', status: 'wait', progress: 0, isUrlCheck: true, urlInfo: { label: '중앙도서관 서비스', url: 'lib.goe.go.kr' } },
  { id: '712', name: '7.12 교육청 서비스 오픈 확인', group: 'G7', status: 'wait', progress: 0, isUrlCheck: true, urlInfo: { label: '교육청 서비스', url: 'www.goe.go.kr' } },
  { id: '713', name: '7.13 방화벽 오픈', group: 'G7', status: 'wait', progress: 0, isUrlCheck: true, urlInfo: { label: '방화벽 오픈', url: 'fw.lib.goe.go.kr' } },
  { id: '714', name: '7.14 인터넷 PC에서 서비스 확인', group: 'G7', status: 'wait', progress: 0, isUrlCheck: true, urlInfo: { label: '외부 PC 접속', url: 'lib.goe.go.kr (외부)' } },
  { id: '811', name: '8.11 서비스 전환 종료 선언', group: 'G8', status: 'wait', progress: 0 },
  { id: '812', name: '8.12 Web방화벽 공지사항 제거', group: 'G8', status: 'wait', progress: 0 },
];

export default function Dashboard() {
  const [tasks, setTasks] = useState(DEMO_TASKS);
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
    if (SHEETS_API_URL) {
      const fetchData = async () => {
        try {
          const res = await fetch(SHEETS_API_URL);
          const json = await res.json();
          if (json.ok && Array.isArray(json.tasks)) {
            setTasks(json.tasks);
            setConnStatus('connected');
            setLastSync(new Date());
          }
        } catch (err) { setConnStatus('error'); }
      };
      fetchData();
      const poll = setInterval(fetchData, POLL_INTERVAL_MS);
      const tickT = setInterval(() => setTick(x => x + 1), 600);
      return () => { clearInterval(poll); clearInterval(tickT); };
    }
  }, []);

  const stats = useMemo(() => {
    const done = tasks.filter(t => t.status === 'done').length;
    const prog = tasks.filter(t => t.status === 'progress').length;
    const wait = tasks.filter(t => t.status === 'wait').length;
    const total = tasks.length;
    const overall = total ? Math.round(tasks.reduce((s, t) => s + t.progress, 0) / total) : 0;
    return { done, prog, wait, total, overall };
  }, [tasks]);

  const dnsTask = tasks.find(t => t.isDns);
  const dnsReady = dnsTask && dnsTask.status === 'done';
  const urlTasks = tasks.filter(t => t.isUrlCheck).sort((a, b) => Number(a.id) - Number(b.id));
  const flowingTasks = tasks.filter(t => t.status === 'progress');
  const doneTasks = tasks.filter(t => t.status === 'done');

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
    <div className="min-h-screen w-full overflow-hidden text-white relative" style={{
      background: 'linear-gradient(180deg, #0A0E27 0%, #050818 100%)',
      fontFamily: '"Pretendard", "Noto Sans KR", sans-serif'
    }}>
      <BinaryRain />
      <Header now={now} stats={stats} connStatus={connStatus} lastSync={lastSync} />

      {/* AS-IS/TO-BE 상단 라벨 */}
      <div className="absolute top-22 left-8 z-30 hidden xl:block">
        <div className="px-12 py-1 rounded-full backdrop-blur-md bg-slate-800/40 border border-slate-700/50">
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-black text-slate-300">기존환경</div>
            <div className="text-[10px] tracking-widest text-slate-500 font-bold">AS-IS</div>
          </div>
        </div>
      </div>
      <div className="absolute top-22 right-8 z-30 hidden xl:block">
        <div className="px-12 py-1 rounded-full backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30">
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-black text-emerald-400">신규환경</div>
            <div className="text-[10px] tracking-widest text-emerald-500 font-bold">TO-BE</div>
          </div>
        </div>
      </div>

      <main className="relative px-6 pb-4">
        <DataMigrationVisual tasks={tasks} flowingTasks={flowingTasks} tick={tick} />
        <CapsuleGauges tasks={tasks} />
        <DnsPanel dnsTask={dnsTask} dnsReady={dnsReady} urlTasks={urlTasks} verifiedUrls={verifiedUrls} verifyingId={verifyingId} onUrlClick={handleUrlClick} />
      </main>

      {celebrating && <CelebrationOverlay onClose={() => setCelebrating(false)} />}
      <Styles />
    </div>
  );
}

function Header({ now, stats, connStatus, lastSync }) {
  const time = now.toLocaleTimeString('ko-KR', { hour12: false });
  return (
    <header className="relative pt-8 pb-4 px-6 text-center z-40">
      <div className="flex items-center justify-center gap-3 mb-3 text-xs">
        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        <span className="text-rose-300 font-bold tracking-[0.4em]">LIVE MONITORING</span>
        <span className="text-white/30">·</span>
        <span className="text-white/60">{time}</span>
        <span className="text-white/30">·</span>
        <span className="font-bold uppercase" style={{ color: connStatus === 'connected' ? '#34D399' : '#FBBF24' }}>{connStatus}</span>
      </div>
      <h1 className="text-4xl font-black tracking-tight" style={{
        background: 'linear-gradient(90deg, #34D399, #22D3EE, #34D399)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'titleShine 8s linear infinite'
      }}>경기도교육청 중앙도서관</h1>
      <div className="mt-4 flex items-center justify-center gap-8">
        <div className="text-center">
          <div className="text-[10px] text-white/40 mb-1 uppercase tracking-widest">Progress</div>
          <div className="text-5xl font-black text-emerald-400">{stats.overall}%</div>
        </div>
        <div className="w-px h-12 bg-white/10" />
        <div className="flex gap-6">
          <StatMini label="완료" value={stats.done} color="#34D399" />
          <StatMini label="진행" value={stats.prog} color="#FBBF24" />
          <StatMini label="대기" value={stats.wait} color="#64748B" />
        </div>
      </div>
    </header>
  );
}

function StatMini({ label, value, color }) {
  return (
    <div className="text-center">
      <div className="text-[10px] text-white/40 mb-1 tracking-widest">{label}</div>
      <div className="text-xl font-black" style={{ color }}>{value}</div>
    </div>
  );
}

function DataMigrationVisual({ tasks, flowingTasks, tick }) {
  const doneTasks = tasks.filter(t => t.status === 'done');
  const totalCount = tasks.length;
  
  return (
      <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
        {/* 그리드 배경 */}
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(34,211,238,0.2) 1px, transparent 0)', backgroundSize: '40px 40px' }} />

        {/* 15개의 유선형 네온 경로 */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 480">
          <defs>
            <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.2" />
              <stop offset="50%" stopColor="#22D3EE" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#34D399" stopOpacity="0.2" />
            </linearGradient>
          </defs>
          {Array.from({ length: 15 }).map((_, i) => {
            const yStart = 40 + i * 30;
            const yEnd = 240 + (i - 7) * 5;
            const path = `M 250,${yStart} C 500,${yStart} 700,${yEnd} 950,${yEnd}`;
            return (
              <React.Fragment key={i}>
                <path d={path} stroke="url(#flowGrad)" strokeWidth="1" fill="none" opacity="0.3" />
                {/* 흐르는 네온 광자 */}
                {[0, 1].map(pIdx => {
                  const progress = ((tick * (1.2 + i * 0.1) + pIdx * 50) % 100) / 100;
                  return <NeonPhoton key={pIdx} path={path} progress={progress} color={i % 2 === 0 ? '#A78BFA' : '#22D3EE'} />;
                })}
              </React.Fragment>
            );
          })}
        </svg>

        {/* 플로팅 태스크 라벨 (진행 중인 태스크) */}
        <div className="absolute inset-0">
          {flowingTasks.slice(0, 5).map((t, i) => (
            <FloatingTaskLabel key={t.id} task={t} index={i} tick={tick} />
          ))}
        </div>

        {/* 바이너리 비트 레이어 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10 font-mono text-[10px] gap-8 pointer-events-none select-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              {Array.from({ length: 10 }).map((_, j) => (
                <span key={j} className="animate-pulse" style={{ animationDelay: `${(i+j)*0.2}s` }}>
                  {Math.random() > 0.5 ? '101001' : '001101'}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* 태스크 박스 사이드 배치 */}
      <div className="absolute left-2 top-2 bottom-2 w-[430px] grid grid-cols-3 gap-1 content-start overflow-y-auto no-scrollbar z-20">
        {tasks.map((t, i) => <ServerNode key={'asis-'+t.id} task={t} mode="asis" index={i} />)}
      </div>
      <div className="absolute right-2 top-2 bottom-2 w-[430px] grid grid-cols-3 gap-1 content-start overflow-y-auto no-scrollbar z-20">
        {tasks.map((t, i) => <ServerNode key={'tobe-'+t.id} task={t} mode="tobe" index={i} />)}
      </div>

      {/* 태스크 박스 사이드 배치 (이미 적용됨) */}
      <div className="absolute left-2 top-2 bottom-2 w-[430px] grid grid-cols-3 gap-1 content-start overflow-y-auto no-scrollbar z-20">
        {tasks.map((t, i) => <ServerNode key={'asis-'+t.id} task={t} mode="asis" index={i} />)}
      </div>
      <div className="absolute right-2 top-2 bottom-2 w-[430px] grid grid-cols-3 gap-1 content-start overflow-y-auto no-scrollbar z-20">
        {tasks.map((t, i) => <ServerNode key={'tobe-'+t.id} task={t} mode="tobe" index={i} />)}
      </div>
    </div>
  );
}

function NeonPhoton({ path, progress, color }) {
  // SVG 경로 위 점 구하기 (간략화된 베지어 계산)
  const x = 250 + (950 - 250) * progress;
  const yBase = 40 + (Math.floor((x - 250) / 30) * 30); // 실제 경로 계산은 복잡하므로 대략적 위치
  const yOffset = Math.sin(progress * Math.PI) * 100;
  
  return (
    <circle r="2" fill={color} style={{
      filter: `drop-shadow(0 0 8px ${color})`,
      transition: 'all 0.1s linear',
      cx: x,
      cy: 40 + (progress * 200) + (Math.sin(progress * 5) * 20) // 가짜 곡선
    }} />
  );
}

function FloatingTaskLabel({ task, index, tick }) {
  const x = 350 + (index * 120) + Math.sin(tick * 0.1 + index) * 20;
  const y = 100 + (index * 60) + Math.cos(tick * 0.1 + index) * 20;
  
  return (
    <div className="absolute px-4 py-1.5 rounded-full border-2 border-cyan-400/50 bg-black/80 backdrop-blur-md shadow-[0_0_20px_rgba(34,211,238,0.3)] flex items-center gap-2 transition-all duration-1000"
      style={{ left: x, top: y }}>
      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
      <span className="text-[10px] font-black text-cyan-300 tracking-wider">TASK-{task.id}</span>
    </div>
  );
}

function ServerNode({ task, mode, index }) {
  const g = TASK_GROUPS[task.group] || { color: '#888' };
  const isAsIs = mode === 'asis';
  const blinking = task.status === 'progress';
  const done = task.status === 'done';
  const active = isAsIs ? (task.status === 'wait') : done;
  const deactivated = isAsIs ? done : (task.status === 'wait');

  return (
    <div className={`p-2 rounded-lg border transition-all duration-500 ${blinking ? 'node-blink' : ''}`}
      style={{
        background: deactivated ? 'rgba(15,23,42,0.6)' : active ? `${g.color}20` : 'rgba(15,23,42,0.8)',
        borderColor: deactivated ? 'rgba(255,255,255,0.05)' : blinking ? '#FFF' : `${g.color}50`,
        opacity: deactivated ? 0.4 : 1
      }}>
      <div className="flex justify-between items-center mb-1">
        <span className="text-[9px] font-mono" style={{ color: deactivated ? '#444' : g.color }}>{task.id}</span>
        {blinking && <div className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />}
      </div>
      <div className="text-[10px] font-bold truncate leading-tight">{task.name.replace(/^\d+\.\d+\s*/, '')}</div>
    </div>
  );
}

function CapsuleGauges({ tasks }) {
  const byGroup = useMemo(() => {
    const r = {};
    Object.keys(TASK_GROUPS).forEach(g => {
      const f = tasks.filter(t => t.group === g);
      const done = f.filter(t => t.status === 'done').length;
      const pct = f.length ? Math.round(f.reduce((s, t) => s + t.progress, 0) / f.length) : 0;
      r[g] = { total: f.length, done, pct };
    });
    return r;
  }, [tasks]);

  return (
    <div className="mt-12 px-8">
      <div className="text-center text-sm font-black tracking-[0.6em] text-white/70 mb-8 uppercase">6단계 공정별 실시간 진척도</div>
      <div className="grid grid-cols-6 gap-8">
        {Object.entries(TASK_GROUPS).map(([key, g]) => {
          const d = byGroup[key];
          return (
            <div key={key} className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 text-center backdrop-blur-2xl">
              <div className="flex justify-between items-end mb-4 px-2">
                <span className="text-base font-black uppercase tracking-tighter" style={{ color: g.color }}>{g.label}</span>
                <span className="text-5xl font-black tabular-nums" style={{ color: g.color }}>{d.pct}%</span>
              </div>
              <div className="h-10 rounded-full bg-black/50 border border-white/10 overflow-hidden p-1.5">
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${d.pct}%`, background: `linear-gradient(90deg, ${g.color}80, ${g.color})`, boxShadow: `0 0 30px ${g.color}`
                }} />
              </div>
              <div className="text-[11px] text-white/40 mt-5 font-black uppercase tracking-[0.2em]">{d.done} / {d.total} SUCCESS</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DnsPanel({ dnsTask, dnsReady, urlTasks, verifiedUrls, onUrlClick }) {
  return (
    <div className="mt-6 mx-32 p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-8 backdrop-blur-md">
      <div className="flex items-center gap-4 pl-6">
        <div className={`p-2 rounded-lg ${dnsReady ? 'bg-emerald-500/20' : 'bg-white/5'}`}>
          <Globe className={`w-5 h-5 ${dnsReady ? 'text-emerald-400' : 'text-white/20'}`} />
        </div>
        <div>
          <div className="text-[10px] font-black tracking-widest text-white/40 uppercase mb-0.5">DNS CUTOVER</div>
          <div className="text-xs font-bold text-white/80">사용자 서비스 최종 검증</div>
        </div>
      </div>
      <div className="flex gap-3 pr-6">
        {urlTasks.map(t => {
          const ok = verifiedUrls.has(t.id) || t.status === 'done';
          return (
            <button key={t.id} disabled={!dnsReady || ok} onClick={() => onUrlClick(t.id)}
              className={`px-5 py-2 rounded-xl text-[10px] font-black transition-all border ${ok ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.2)]' : 'bg-slate-800/40 border-white/5 text-white/20'}`}>
              {t.name.split(' ')[0]} {ok ? 'OK' : 'WAIT'}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CelebrationOverlay({ onClose }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
      <div className="text-center">
        <PartyPopper className="w-24 h-24 text-emerald-400 mx-auto mb-6 animate-bounce" />
        <h1 className="text-8xl font-black text-white mb-4">MIGRATION SUCCESS</h1>
        <p className="text-2xl text-white/60 mb-12">경기도교육청 중앙도서관 시스템 이전이 완료되었습니다.</p>
        <button onClick={onClose} className="px-12 py-4 rounded-full bg-emerald-500 text-black font-black text-xl hover:scale-110 transition-all">확인</button>
      </div>
    </div>
  );
}

function BinaryRain() {
  return <div className="absolute inset-0 opacity-[0.05] pointer-events-none overflow-hidden font-mono text-[8px] text-cyan-500 writing-mode-vertical" style={{ writingMode: 'vertical-rl' }}>{Array.from({length:30}).map((_,i)=><div key={i} className="absolute" style={{left:`${i*3.5}%`,top:'-10%',animation:`binaryFall ${5+Math.random()*10}s linear infinite`}}>01010101011101010101</div>)}</div>;
}

function Styles() {
  return (
    <style>{`
      @keyframes titleShine { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
      @keyframes binaryFall { 0% { transform: translateY(0); } 100% { transform: translateY(120vh); } }
      @keyframes nodeBlink { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }
      .node-blink { 
        animation: nodeBlink 0.8s infinite !important;
        background: rgba(251, 191, 36, 0.5) !important;
        border-color: #FBBF24 !important;
        box-shadow: 0 0 25px rgba(251, 191, 36, 0.3) !important;
        z-index: 50;
        position: relative;
      }
      .node-blink * { color: #000 !important; }
      .no-scrollbar::-webkit-scrollbar { display: none; }
      .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    `}</style>
  );
}

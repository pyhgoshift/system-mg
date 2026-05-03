import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, Globe, Lock, ExternalLink, PartyPopper, Sparkles, Wifi, WifiOff, Radio } from 'lucide-react';

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
// 데모 태스크 (실제 시트 구조 반영, 모든 태스크가 AS-IS↔TO-BE 양쪽 표시)
// ============================
const DEMO_TASKS = [
  // G3 전개 시작
  { id: '311', name: '3.11 작업시작 선언', group: 'G3', status: 'done', progress: 100 },
  { id: '312', name: '3.12 Web방화벽 공지등록', group: 'G3', status: 'done', progress: 100 },
  { id: '313', name: '3.13 DNS도메인 IP변경', group: 'G3', status: 'done', progress: 100 },
  { id: '320', name: '3.20 Web/Was/DB 재기동', group: 'G3', status: 'done', progress: 100 },
  { id: '321', name: '3.21 Web/Was 서비스 중지', group: 'G3', status: 'progress', progress: 65 },
  { id: '322', name: '3.22 DB 백업', group: 'G3', status: 'wait', progress: 0 },
  { id: '323', name: '3.23 DB서버 / OS 중지', group: 'G3', status: 'wait', progress: 0 },
  { id: '324', name: '3.24 이동서버 전원 OFF', group: 'G3', status: 'wait', progress: 0 },
  { id: '325', name: '3.25 DB서버 장비 해체', group: 'G3', status: 'wait', progress: 0 },
  // G4 vMotion 이관
  { id: '411', name: '4.11 vConvertor (DMZ)', group: 'G4', status: 'wait', progress: 0 },
  { id: '412', name: '4.12 vConvertor (내부망)', group: 'G4', status: 'wait', progress: 0 },
  { id: '413', name: '4.13 vConvertor (좌석예약)', group: 'G4', status: 'wait', progress: 0 },
  { id: '420', name: '4.20 장비 이동', group: 'G4', status: 'wait', progress: 0 },
  { id: '441', name: '4.41 vMotion (WEB)', group: 'G4', status: 'wait', progress: 0 },
  { id: '442', name: '4.42 vMotion (WAS)', group: 'G4', status: 'wait', progress: 0 },
  { id: '482', name: '4.82 WEB존 환경점검', group: 'G4', status: 'wait', progress: 0 },
  { id: '485', name: '4.85 서버 DNS IP변경', group: 'G4', status: 'wait', progress: 0 },
  // G5 서비스 전환
  { id: '511', name: '5.11 DB 전환·재기동', group: 'G5', status: 'wait', progress: 0 },
  { id: '512', name: '5.12 WAS 전환·재기동', group: 'G5', status: 'wait', progress: 0 },
  { id: '513', name: '5.13 WEB 전환·재기동', group: 'G5', status: 'wait', progress: 0 },
  { id: '514', name: '5.14 서비스 확인', group: 'G5', status: 'wait', progress: 0 },
  // G6 DNS
  { id: '611', name: '6.11 DNS변경(해당없음)', group: 'G6', status: 'wait', progress: 0, isDns: true },
  // G7 사용자 검증 (URL 4개)
  { id: '711', name: '7.11 중앙도서관 서비스 오픈 확인', group: 'G7', status: 'wait', progress: 0,
    isUrlCheck: true, urlInfo: { label: '중앙도서관 서비스', url: 'lib.goe.go.kr' } },
  { id: '712', name: '7.12 교육청 서비스 오픈 확인', group: 'G7', status: 'wait', progress: 0,
    isUrlCheck: true, urlInfo: { label: '교육청 서비스', url: 'www.goe.go.kr' } },
  { id: '713', name: '7.13 방화벽 오픈', group: 'G7', status: 'wait', progress: 0,
    isUrlCheck: true, urlInfo: { label: '방화벽 오픈', url: 'fw.lib.goe.go.kr' } },
  { id: '714', name: '7.14 인터넷 PC에서 서비스 확인', group: 'G7', status: 'wait', progress: 0,
    isUrlCheck: true, urlInfo: { label: '외부 PC 접속', url: 'lib.goe.go.kr (외부)' } },
  // G8 전환 종료
  { id: '811', name: '8.11 서비스 전환 종료 선언', group: 'G8', status: 'wait', progress: 0 },
  { id: '812', name: '8.12 Web방화벽 공지사항 제거', group: 'G8', status: 'wait', progress: 0 },
];

// ============================
// 메인 컴포넌트
// ============================
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
        } catch (err) {
          setConnStatus('error');
        }
      };
      fetchData();
      const poll = setInterval(fetchData, POLL_INTERVAL_MS);
      const tickT = setInterval(() => setTick(x => x + 1), 600);
      return () => { clearInterval(poll); clearInterval(tickT); };
    } else {
      const t = setInterval(() => {
        setTick(x => x + 1);
        setTasks(prev => {
          let next = prev.map(task => {
            if (task.status === 'done') return task;
            if (task.status === 'progress') {
              const np = Math.min(100, task.progress + Math.random() * 1.6);
              return { ...task, progress: np, status: np >= 100 ? 'done' : 'progress' };
            }
            return task;
          });
          const inProg = next.filter(t => t.status === 'progress').length;
          if (inProg < 2) {
            const sorted = [...next].sort((a, b) => Number(a.id) - Number(b.id));
            const waiting = sorted.find(t => t.status === 'wait' && !t.isUrlCheck);
            if (waiting) {
              next = next.map(t => t.id === waiting.id ? { ...t, status: 'progress', progress: 0.5 } : t);
            }
          }
          return next;
        });
      }, 600);
      return () => clearInterval(t);
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

  const handleUrlClick = (id) => {
    if (!dnsReady || verifiedUrls.has(id) || verifyingId) return;
    setVerifyingId(id);
    setTimeout(() => {
      setVerifiedUrls(prev => { const n = new Set(prev); n.add(id); return n; });
      if (!SHEETS_API_URL) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done', progress: 100 } : t));
      }
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
      background: `
        radial-gradient(ellipse at 20% 30%, rgba(96,40,140,0.25) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 30%, rgba(20,120,140,0.25) 0%, transparent 50%),
        linear-gradient(180deg, #0A0E27 0%, #050818 100%)
      `,
      fontFamily: '"Pretendard", "Noto Sans KR", -apple-system, sans-serif'
    }}>
      <BinaryRain />
      <Header now={now} stats={stats} connStatus={connStatus} lastSync={lastSync} />

      {/* AS-IS/TO-BE 최상단 라벨 (경기도교육청 타이틀 라인 정렬) */}
      <div className="absolute top-22 left-8 z-30 hidden xl:block">
        <div className="px-12 py-1 rounded-full backdrop-blur-md" style={{
          background: 'linear-gradient(135deg, rgba(100,116,139,0.3) 0%, rgba(30,41,59,0.5) 100%)',
          border: '1px solid rgba(148,163,184,0.3)',
          boxShadow: '0 0 20px rgba(100,116,139,0.2)'
        }}>
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-black tracking-tighter text-slate-300">AS-IS</div>
            <div className="text-[10px] tracking-widest text-slate-400 font-bold">기존환경</div>
          </div>
        </div>
      </div>
      <div className="absolute top-22 right-8 z-30 hidden xl:block">
        <div className="px-12 py-1 rounded-full backdrop-blur-md" style={{
          background: 'linear-gradient(135deg, rgba(34,211,238,0.2) 0%, rgba(167,139,250,0.2) 100%)',
          border: '1px solid rgba(52,211,153,0.4)',
          boxShadow: '0 0 30px rgba(52,211,153,0.3)'
        }}>
          <div className="flex items-baseline gap-3">
            <div className="text-xl font-black tracking-tighter" style={{
              background: 'linear-gradient(90deg, #34D399, #22D3EE)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>TO-BE</div>
            <div className="text-[10px] tracking-widest text-emerald-300 font-bold">신규환경</div>
          </div>
        </div>
      </div>

      <main className="relative px-6 pb-4">
        <DataMigrationVisual tasks={tasks} flowingTasks={flowingTasks} tick={tick} />
        <CapsuleGauges tasks={tasks} />
        <DnsPanel
          dnsTask={dnsTask}
          dnsReady={dnsReady}
          urlTasks={urlTasks}
          verifiedUrls={verifiedUrls}
          verifyingId={verifyingId}
          onUrlClick={handleUrlClick}
        />
      </main>

      {celebrating && <CelebrationOverlay onClose={() => setCelebrating(false)} />}
      <Styles />
    </div>
  );
}

// ============================
// 헤더 (에메랄드 그라디언트)
// ============================
function Header({ now, stats, connStatus, lastSync }) {
  const time = now.toLocaleTimeString('ko-KR', { hour12: false });
  const date = now.toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit', weekday: 'short' });

  const conn = {
    connected: { color: '#34D399', label: 'SHEET CONNECTED', Icon: Wifi },
    connecting: { color: '#FBBF24', label: 'CONNECTING…', Icon: Wifi },
    error: { color: '#FF5E9F', label: 'SHEET ERROR', Icon: WifiOff },
    demo: { color: '#22D3EE', label: 'DEMO MODE', Icon: Radio }
  }[connStatus] || { color: '#888', label: '—', Icon: WifiOff };
  const ConnIcon = conn.Icon;

  return (
    <header className="relative pt-8 pb-4 px-6 text-center">
      <div className="flex items-center justify-center gap-3 mb-3 text-xs">
        <div className="relative w-2 h-2">
          <div className="absolute inset-0 rounded-full bg-rose-500 animate-pulse" />
          <div className="absolute inset-0 rounded-full bg-rose-500 animate-ping opacity-75" />
        </div>
        <span className="text-rose-300 font-bold tracking-[0.4em]">LIVE</span>
        <span className="text-white/30">·</span>
        <span className="text-white/60 tracking-wider">{date} {time}</span>
        <span className="text-white/30">·</span>
        <ConnIcon className="w-3 h-3 animate-pulse" style={{ color: conn.color }} />
        <span className="tracking-widest font-bold" style={{ color: conn.color }}>{conn.label}</span>
        {lastSync && (
          <>
            <span className="text-white/30">·</span>
            <span className="text-white/40 font-mono text-[10px]">
              {lastSync.toLocaleTimeString('ko-KR', { hour12: false })} 동기화
            </span>
          </>
        )}
      </div>

      {/* 헤드라인 - 에메랄드 그라디언트 (#34D399 → #22D3EE) */}
      <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-none" style={{
        background: 'linear-gradient(90deg, #34D399 0%, #22D3EE 50%, #34D399 100%)',
        backgroundSize: '200% auto',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        animation: 'titleShine 8s linear infinite',
        filter: 'drop-shadow(0 0 30px rgba(52,211,153,0.5)) drop-shadow(0 0 60px rgba(34,211,238,0.3))'
      }}>
        경기도교육청 중앙도서관
      </h1>
      <h2 className="text-xl md:text-2xl font-light tracking-[0.3em] mt-2 text-white/80">
        시스템 이전 실시간 모니터링
      </h2>

      <div className="mt-5 flex items-center justify-center gap-6">
        <Stat label="완료" value={stats.done} total={stats.total} color="#34D399" />
        <Stat label="진행" value={stats.prog} total={stats.total} color="#FBBF24" pulse />
        <Stat label="대기" value={stats.wait} total={stats.total} color="#64748B" />
        <div className="w-px h-10 bg-white/10" />
        <div className="text-center">
          <div className="text-[10px] tracking-[0.3em] text-white/40 mb-1">전체 진척률</div>
          <div className="text-5xl font-black tabular-nums" style={{
            background: 'linear-gradient(180deg, #34D399 0%, #22D3EE 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(52,211,153,0.6))'
          }}>{stats.overall}<span className="text-2xl">%</span></div>
        </div>
      </div>

      <div className="mt-3 mx-auto max-w-3xl h-1.5 rounded-full overflow-hidden bg-white/5 relative">
        <div className="h-full transition-all duration-700 relative" style={{
          width: `${stats.overall}%`,
          background: 'linear-gradient(90deg, #34D399 0%, #22D3EE 50%, #A78BFA 100%)',
          boxShadow: '0 0 30px rgba(52,211,153,0.6)'
        }}>
          <div className="absolute inset-0 shimmer" />
        </div>
      </div>

      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/5 h-px" style={{
        background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)'
      }} />
    </header>
  );
}

function Stat({ label, value, total, color, pulse }) {
  return (
    <div className="text-center">
      <div className="text-[10px] tracking-[0.3em] text-white/40 mb-1">{label}</div>
      <div className={`text-2xl font-black tabular-nums ${pulse ? 'animate-pulse' : ''}`}
        style={{ color, textShadow: `0 0 15px ${color}80` }}>
        {value}<span className="text-sm text-white/30">/{total}</span>
      </div>
    </div>
  );
}

// ============================
// 메인 시각화 - 모든 태스크가 양쪽 표시
// ============================
function DataMigrationVisual({ tasks, flowingTasks, tick }) {
  // 모든 작업이 AS-IS → TO-BE로 이동: 양쪽에 동일한 태스크 목록
  const allTasks = tasks;

  return (
    <div className="relative h-[480px] mt-4">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 480" preserveAspectRatio="none">
        <defs>
          <radialGradient id="coreGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="15%" stopColor="#22D3EE" stopOpacity="0.9" />
            <stop offset="40%" stopColor="#A78BFA" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#050818" stopOpacity="0" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="intenseGlow">
            <feGaussianBlur stdDeviation="8" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* 광섬유(Fiber Optic) 빔 이펙트 */}
        {Array.from({ length: 24 }).map((_, i) => {
          const yStart = 40 + i * 16;
          const yEnd = 60 + (i % 8) * 45;
          const cx1 = 400 + (i % 3) * 50;
          const cx2 = 650 + (i % 2) * 50;
          const path = `M 280,${yStart} C ${cx1},${yStart} ${cx2},240 850,240 C 880,240 900,${yEnd} 920,${yEnd}`;
          
          const colors = ['#22D3EE', '#A78BFA', '#34D399', '#FF5E9F', '#3B82F6'];
          const color = colors[i % colors.length];
          const duration = 30; // 훨씬 더 느린 속도 (12s -> 30s)
          const delay = (i / 24) * -duration; // 골고루 퍼지도록 간격 조절

          return (
            <g key={i}>
              {/* 베이스 흐릿한 라인 */}
              <path d={path} stroke={color} strokeWidth={2} fill="none" opacity="0.15" />
              
              {/* 일정한 간격으로 매우 천천히 흐르는 데이터 빛 */}
              <path 
                d={path} 
                stroke={color} 
                strokeWidth={3} 
                fill="none" 
                opacity="0.85" 
                filter="url(#glow)"
                strokeDasharray="60 180"
                style={{
                  animation: `flowLaser ${duration}s ${delay}s linear infinite`
                }}
              />
            </g>
          );
        })}

        {/* 배경에 떠다니는 이진수 */}
        {Array.from({ length: 15 }).map((_, i) => {
          const x = 350 + (i % 5) * 120;
          const y = 80 + Math.floor(i / 5) * 140 + Math.sin(tick * 0.05 + i) * 8;
          const text = ['010110', '110011', '001101', '101010', '011001', '110100'][i % 6];
          return (
            <text key={i} x={x} y={y} fill="#A78BFA" fontSize="10" fontFamily="monospace" opacity="0.3"
              style={{ textShadow: '0 0 5px rgba(167,139,250,0.5)' }}>
              {text}
            </text>
          );
        })}
      </svg>

      {/* AS-IS 좌측: 모든 태스크 (3열 배치, 더 상단으로 이동, 스크롤바 숨김) */}
      <div className="absolute left-2 top-16 bottom-2 w-[410px] grid grid-cols-3 gap-1.5 content-start overflow-y-auto pr-1 no-scrollbar z-20">
        {allTasks.map((task, i) => (
          <ServerNode key={'asis-' + task.id} task={task} mode="asis" index={i} />
        ))}
      </div>

      {/* TO-BE 우측: 모든 태스크 (3열 배치, 더 상단으로 이동, 스크롤바 숨김) */}
      <div className="absolute right-2 top-16 bottom-2 w-[410px] grid grid-cols-3 gap-1.5 content-start overflow-y-auto pl-1 no-scrollbar z-20">
        {allTasks.map((task, i) => (
          <ServerNode key={'tobe-' + task.id} task={task} mode="tobe" index={i} />
        ))}
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="px-4 py-2 rounded-full backdrop-blur-md text-center" style={{
          background: 'rgba(15,23,42,0.7)',
          border: '1px solid rgba(52,211,153,0.4)',
          boxShadow: '0 0 30px rgba(52,211,153,0.4)'
        }}>
          <div className="text-[10px] tracking-[0.3em] text-emerald-300 mb-0.5">ACTIVE TRANSFERS</div>
          <div className="text-3xl font-black tabular-nums" style={{
            color: '#34D399',
            textShadow: '0 0 20px rgba(52,211,153,0.7)'
          }}>{flowingTasks.length}</div>
        </div>
      </div>
    </div>
  );
}

function ServerNode({ task, mode, index }) {
  const meta = TASK_GROUPS[task.group] || { color: '#888', glow: 'rgba(136,136,136,0.5)' };
  const isAsIs = mode === 'asis';

  // 모든 태스크가 AS-IS→TO-BE로 이동
  // wait: AS-IS 켜짐 / TO-BE 꺼짐
  // progress: 양쪽 모두 깜박임 (이동 중)
  // done: AS-IS 꺼짐 / TO-BE 켜짐
  let active, blinking, deactivated;
  if (isAsIs) {
    deactivated = task.status === 'done';      // 이동 완료된 자리
    blinking = task.status === 'progress';      // 이동 중
    active = task.status === 'wait';            // 아직 안 옮김 (켜짐)
  } else {
    deactivated = task.status === 'wait';       // 아직 안 옴
    blinking = task.status === 'progress';      // 도착 중
    active = task.status === 'done';            // 도착 완료
  }

  const cleanName = task.name.replace(/^\d+\.\d+\s*/, '');

  return (
    <div className={`relative rounded-md p-2 backdrop-blur-sm transition-all duration-700 ${blinking ? 'node-blink' : ''} ${active && !isAsIs ? 'node-fadein' : ''}`}
      style={{
        background: deactivated
          ? 'linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.7) 100%)'
          : `linear-gradient(135deg, ${meta.color}20 0%, rgba(15,23,42,0.85) 100%)`,
        border: `1px solid ${deactivated ? 'rgba(100,116,139,0.2)' : meta.color + '70'}`,
        boxShadow: active
          ? `0 0 15px ${meta.glow}, inset 0 0 8px ${meta.color}30`
          : 'none',
        opacity: deactivated ? 0.4 : 1,
        animationDelay: `${index * 50}ms`
      }}>
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-mono tracking-wider"
          style={{ color: deactivated ? '#64748B' : meta.color }}>
          {task.id}
        </span>
        <div className="w-1.5 h-1.5 rounded-full" style={{
          background: deactivated ? '#475569' : (blinking ? meta.color : (active ? meta.color : '#64748B')),
          boxShadow: !deactivated && (blinking || active) ? `0 0 4px ${meta.color}` : 'none',
          animation: blinking ? 'pulse 1.2s ease-in-out infinite' : 'none'
        }} />
      </div>
      <div className={`text-[10px] font-bold mt-0.5 leading-tight truncate ${deactivated ? 'text-white/40' : 'text-white'}`}
        title={cleanName}>
        {cleanName}
      </div>
      {blinking && (
        <div className="mt-1 h-0.5 rounded-full bg-black/40 overflow-hidden">
          <div className="h-full transition-all duration-500" style={{
            width: `${task.progress}%`,
            background: meta.color,
            boxShadow: `0 0 4px ${meta.color}`
          }} />
        </div>
      )}
    </div>
  );
}

// ============================
// 캡슐 게이지 (그룹별)
// ============================
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
    <div className="mt-4 px-4">
      <div className="text-center text-xs tracking-[0.4em] text-white/50 mb-3 flex items-center justify-center gap-3">
        <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.5))' }} />
        6단계 작업 그룹 진행률
        <div className="h-px w-12" style={{ background: 'linear-gradient(90deg, rgba(52,211,153,0.5), transparent)' }} />
      </div>

      <div className="grid grid-cols-6 gap-3">
        {Object.entries(TASK_GROUPS).map(([key, g]) => {
          const data = byGroup[key];
          const isComplete = data.pct >= 100 && data.total > 0;
          return (
            <div key={key} className="text-center">
              <div className="flex items-baseline justify-between mb-1.5 px-1">
                <div className="text-xs font-bold" style={{ color: g.color }}>{g.label}</div>
                <div className="text-base font-black tabular-nums" style={{
                  color: g.color,
                  textShadow: `0 0 10px ${g.glow}`
                }}>{data.pct}%</div>
              </div>

              <div className="relative h-3 rounded-full overflow-hidden" style={{
                background: 'rgba(15,23,42,0.8)',
                border: `1px solid ${g.color}30`,
                boxShadow: `inset 0 1px 3px rgba(0,0,0,0.5)`
              }}>
                <div className="absolute inset-0 opacity-40" style={{
                  backgroundImage: `linear-gradient(90deg, transparent 0%, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 5px)`,
                  backgroundSize: '5px 100%'
                }} />
                <div className="absolute inset-y-0 left-0 transition-all duration-700 rounded-full" style={{
                  width: `${data.pct}%`,
                  background: `linear-gradient(90deg, ${g.color}80 0%, ${g.color} 100%)`,
                  boxShadow: `0 0 12px ${g.glow}, inset 0 1px 1px rgba(255,255,255,0.4)`
                }}>
                  {data.pct < 100 && data.pct > 5 && (
                    <div className="absolute inset-0 shimmer rounded-full" />
                  )}
                </div>
                {data.pct > 0 && data.pct < 100 && (
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full" style={{
                    left: `${data.pct}%`,
                    background: '#FFFFFF',
                    boxShadow: `0 0 8px ${g.color}, 0 0 16px ${g.color}`
                  }} />
                )}
              </div>

              <div className="text-[9px] text-white/40 mt-1.5 truncate">{g.sub}</div>
              <div className="text-[10px] mt-0.5" style={{ color: g.color }}>
                {data.done} / {data.total} {isComplete && '✓'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================
// DNS → URL 4종 검증
// ============================
function DnsPanel({ dnsTask, dnsReady, urlTasks, verifiedUrls, verifyingId, onUrlClick }) {
  const dnsProg = dnsTask ? dnsTask.progress : 0;
  const allDone = urlTasks.length > 0 && verifiedUrls.size === urlTasks.length;
  const palette = ['#FF5E9F', '#A78BFA', '#22D3EE', '#34D399'];

  return (
    <div className="mt-4 mx-4 rounded-2xl p-4 relative overflow-hidden transition-all duration-700" style={{
      background: dnsReady
        ? 'linear-gradient(135deg, rgba(52,211,153,0.1) 0%, rgba(34,211,238,0.08) 50%, rgba(167,139,250,0.1) 100%)'
        : 'linear-gradient(135deg, rgba(15,23,42,0.7) 0%, rgba(30,41,59,0.5) 100%)',
      border: dnsReady ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(100,116,139,0.2)',
      boxShadow: dnsReady ? '0 0 40px rgba(52,211,153,0.2)' : 'none'
    }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Globe className={`w-7 h-7 ${dnsReady ? 'text-emerald-300' : 'text-slate-500'}`} />
            {dnsReady && <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(52,211,153,0.3)' }} />}
          </div>
          <div>
            <div className="text-sm tracking-[0.3em] font-bold" style={{ color: dnsReady ? '#34D399' : '#64748B' }}>
              {dnsTask ? dnsTask.id : '6.11'} · DNS CUTOVER → 사용자 검증
            </div>
            <div className="text-xs text-white/50 mt-0.5">
              {dnsReady
                ? `🎯 ${urlTasks.length}개 URL을 클릭하여 정상 동작 확인  ·  ${verifiedUrls.size}/${urlTasks.length} 완료`
                : `🔒 6.11 DNS 변경 작업 진행 중 (${Math.round(dnsProg)}%)`}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] tracking-widest text-white/40">VERIFIED</div>
          <div className="text-3xl font-black tabular-nums" style={{
            color: allDone ? '#34D399' : dnsReady ? '#22D3EE' : '#64748B',
            textShadow: dnsReady ? `0 0 15px ${allDone ? 'rgba(52,211,153,0.7)' : 'rgba(34,211,238,0.7)'}` : 'none'
          }}>
            {verifiedUrls.size}<span className="text-base text-white/30">/{urlTasks.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.max(urlTasks.length, 1)}, minmax(0,1fr))` }}>
        {urlTasks.map((task, idx) => {
          const color = palette[idx % palette.length];
          const verified = verifiedUrls.has(task.id) || task.status === 'done';
          const verifying = verifyingId === task.id;
          const locked = !dnsReady;
          const clickable = dnsReady && !verified && !verifyingId;
          const u = task.urlInfo || { label: task.name, url: '-' };

          return (
            <button
              key={task.id}
              disabled={!clickable}
              onClick={() => onUrlClick(task.id)}
              className={`relative rounded-xl p-3 text-left overflow-hidden transition-all duration-500 ${
                clickable ? 'cursor-pointer hover:scale-105 url-pulse' : 'cursor-not-allowed'
              } ${verified ? 'url-verified' : ''}`}
              style={{
                background: locked
                  ? 'linear-gradient(135deg, rgba(30,41,59,0.5) 0%, rgba(15,23,42,0.8) 100%)'
                  : verified
                    ? `linear-gradient(135deg, ${color}40 0%, ${color}10 100%)`
                    : `linear-gradient(135deg, ${color}25 0%, rgba(15,23,42,0.85) 100%)`,
                border: `1px solid ${locked ? 'rgba(100,116,139,0.15)' : verified ? color : color + '70'}`,
                boxShadow: verified ? `0 0 25px ${color}80` : clickable ? `0 0 12px ${color}40` : 'none',
                opacity: locked ? 0.4 : 1,
                animationDelay: `${idx * 100}ms`
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono tracking-wider" style={{ color: locked ? '#64748B' : color }}>
                  {task.id}
                </span>
                {locked && <Lock className="w-3 h-3 text-slate-500" />}
                {verifying && <div className="w-3 h-3 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                {verified && <CheckCircle2 className="w-4 h-4" style={{ color }} />}
                {clickable && !verifying && <ExternalLink className="w-3 h-3" style={{ color }} />}
              </div>
              <div className={`text-xs font-bold leading-tight ${locked ? 'text-white/40' : 'text-white'}`}>
                {u.label}
              </div>
              <div className="text-[10px] font-mono mt-0.5 truncate" style={{ color: locked ? '#475569' : color }}>
                {locked ? '— — — — —' : u.url}
              </div>
              <div className="mt-2 text-[9px] tracking-widest text-center py-1 rounded-md" style={{
                background: verified ? `${color}30` : 'rgba(255,255,255,0.05)',
                color: locked ? '#475569' : verified ? color : verifying ? '#FBBF24' : '#FFF'
              }}>
                {locked ? 'LOCKED' : verifying ? 'CHECKING…' : verified ? '✓ VERIFIED' : '▶ CLICK'}
              </div>
              {verifying && (
                <div className="absolute inset-0 pointer-events-none rounded-xl overflow-hidden">
                  <div className="absolute inset-0" style={{
                    background: `linear-gradient(90deg, transparent, ${color}50, transparent)`,
                    animation: 'sweep 1.4s ease-in-out'
                  }} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ============================
// 축포 오버레이
// ============================
function CelebrationOverlay({ onClose }) {
  const [show, setShow] = useState(false);
  useEffect(() => { setTimeout(() => setShow(true), 50); }, []);

  const confetti = useMemo(() => {
    const colors = ['#34D399', '#22D3EE', '#A78BFA', '#FBBF24', '#FF5E9F', '#FB923C', '#FFFFFF'];
    return Array.from({ length: 160 }).map((_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 2.5 + Math.random() * 3,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 6 + Math.random() * 12,
      rotate: Math.random() * 360,
      shape: Math.random() > 0.5 ? 'square' : 'circle'
    }));
  }, []);

  const fireworks = useMemo(() => Array.from({ length: 60 }).map((_, i) => ({
    id: i,
    angle: (i / 60) * 360,
    delay: Math.random() * 0.6,
    distance: 220 + Math.random() * 320,
    color: ['#34D399', '#22D3EE', '#A78BFA', '#FBBF24', '#FF5E9F'][i % 5]
  })), []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{
      background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.85) 0%, rgba(0,0,0,0.95) 100%)',
      backdropFilter: 'blur(10px)',
      animation: 'fadeIn 0.6s ease-out'
    }}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {confetti.map(c => (
          <div key={c.id} className="absolute" style={{
            left: `${c.left}%`, top: '-20px',
            width: c.size, height: c.size,
            background: c.color,
            borderRadius: c.shape === 'circle' ? '50%' : '2px',
            animation: `confettiFall ${c.duration}s ${c.delay}s linear forwards`,
            transform: `rotate(${c.rotate}deg)`,
            boxShadow: `0 0 10px ${c.color}`
          }} />
        ))}
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {fireworks.map(f => (
          <div key={f.id} className="absolute w-2 h-2 rounded-full" style={{
            background: f.color,
            boxShadow: `0 0 14px ${f.color}, 0 0 28px ${f.color}`,
            animation: `firework 1.6s ${f.delay}s ease-out forwards`,
            '--angle': `${f.angle}deg`,
            '--distance': `${f.distance}px`,
          }} />
        ))}
      </div>

      <div className={`relative z-10 text-center px-8 ${show ? 'celebrate-in' : 'opacity-0'}`}>
        <div className="flex items-center justify-center gap-3 mb-4">
          <Sparkles className="w-12 h-12 text-emerald-300 animate-spin" style={{ animationDuration: '3s' }} />
          <PartyPopper className="w-14 h-14 text-cyan-400" style={{ animation: 'wiggle 0.6s ease-in-out infinite' }} />
          <Sparkles className="w-12 h-12 text-emerald-300 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }} />
        </div>

        <div className="text-sm tracking-[0.6em] text-emerald-300 mb-3 font-bold">
          ★  MIGRATION COMPLETE  ★
        </div>

        <h1 className="text-7xl md:text-8xl font-black leading-none mb-4" style={{
          background: 'linear-gradient(90deg, #34D399 0%, #22D3EE 50%, #34D399 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          filter: 'drop-shadow(0 0 40px rgba(52,211,153,0.6))'
        }}>
          시스템 이전 성공!
        </h1>

        <div className="text-2xl font-bold text-white mb-2">경기도교육청 중앙도서관</div>
        <div className="text-lg text-white/70 mb-6">모든 사용자 서비스가 신규 환경에서 정상 동작합니다</div>

        <div className="flex items-center justify-center gap-3 mb-8 flex-wrap">
          {[
            { label: '✓ 전개 / 이관 / 전환 완료', color: '#34D399' },
            { label: '✓ DNS 변경 완료', color: '#22D3EE' },
            { label: '✓ 사용자 URL 4종 검증', color: '#A78BFA' }
          ].map(b => (
            <div key={b.label} className="px-4 py-2 rounded-full text-sm font-bold" style={{
              background: `${b.color}20`, border: `1px solid ${b.color}`, color: b.color
            }}>{b.label}</div>
          ))}
        </div>

        <button onClick={onClose} className="px-8 py-3 rounded-full text-sm font-bold tracking-widest transition-all hover:scale-105" style={{
          background: 'linear-gradient(90deg, #34D399, #22D3EE)',
          color: '#000',
          boxShadow: '0 0 30px rgba(52,211,153,0.6)'
        }}>
          대시보드로 돌아가기
        </button>
      </div>
    </div>
  );
}

function BinaryRain() {
  const cols = useMemo(() =>
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: (i / 25) * 100,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 8,
      chars: Array.from({ length: 15 }).map(() => Math.random() > 0.5 ? '1' : '0').join('')
    }))
  , []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07]">
      {cols.map(c => (
        <div key={c.id} className="absolute font-mono text-xs leading-tight" style={{
          left: `${c.left}%`,
          top: '-100%',
          color: '#22D3EE',
          writingMode: 'vertical-rl',
          animation: `binaryFall ${c.duration}s ${c.delay}s linear infinite`
        }}>
          {c.chars}
        </div>
      ))}
    </div>
  );
}

function Styles() {
  return (
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
      @keyframes nodeBlink {
        0%, 100% { 
          transform: scale(1); 
          filter: brightness(1);
          box-shadow: 0 0 0px rgba(255,255,255,0);
        }
        50% { 
          transform: scale(1.08); 
          filter: brightness(1.8);
          background: rgba(251, 191, 36, 0.5) !important;
          border-color: #FBBF24 !important;
          box-shadow: 0 0 30px #FBBF24, 0 0 60px rgba(251, 191, 36, 0.4);
        }
      }
      .node-blink { 
        animation: nodeBlink 0.6s cubic-bezier(0.4, 0, 0.2, 1) infinite !important;
        position: relative;
        z-index: 50;
      }

      @keyframes fadein {
        from { opacity: 0; transform: translateY(6px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .node-fadein { animation: fadein 0.8s ease-out both; }

      @keyframes shimmer {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
      .shimmer {
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent);
        animation: shimmer 2s infinite;
      }

      @keyframes urlPulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.02); }
      }
      .url-pulse { animation: urlPulse 1.6s ease-in-out infinite; }

      @keyframes verifiedGlow {
        0% { transform: scale(1); }
        50% { transform: scale(1.08); }
        100% { transform: scale(1); }
      }
      .url-verified { animation: verifiedGlow 0.8s ease-out; }

      @keyframes sweep {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }

      @keyframes confettiFall {
        0% { transform: translateY(0) rotate(0deg); opacity: 1; }
        100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
      }

      @keyframes firework {
        0% { transform: translate(0,0) scale(0); opacity: 1; }
        100% {
          transform: translate(
            calc(cos(var(--angle)) * var(--distance)),
            calc(sin(var(--angle)) * var(--distance))
          ) scale(0);
          opacity: 0;
        }
      }

      @keyframes wiggle {
        0%, 100% { transform: rotate(-15deg); }
        50% { transform: rotate(15deg); }
      }

      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes celebrateIn {
        0% { opacity: 0; transform: scale(0.5) translateY(40px); }
        60% { opacity: 1; transform: scale(1.05) translateY(-10px); }
        100% { opacity: 1; transform: scale(1) translateY(0); }
      }
      .celebrate-in {
        animation: celebrateIn 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
      }

      @keyframes titleShine {
        0% { background-position: 0% center; }
        100% { background-position: 200% center; }
      }

      @keyframes binaryFall {
        0% { transform: translateY(0); }
        100% { transform: translateY(200vh); }
      }

      @keyframes flowLaser {
        from { stroke-dashoffset: 1000; }
        to { stroke-dashoffset: 0; }
      }
    `}</style>
  );
}

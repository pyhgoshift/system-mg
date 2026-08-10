import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { CheckCircle2, Globe, Lock, ExternalLink, PartyPopper, Sparkles, Wifi, WifiOff, Radio, Server, Cloud, ArrowRight, Send, Settings } from 'lucide-react';

// ============================
// 설정 (Config)
// ============================
const DEFAULT_SHEETS_API_URL = 'https://script.google.com/macros/s/AKfycbzPtdKQtyibcPb0UXiYgYxZKjT8Cbbo_I1mYnXkt1IG4Ap0mbv6l4KGvlOts03qSCDAgw/exec';
const POLL_INTERVAL_MS = 5000;
const SITE_NAME = "경기도교육청";
const SITE_TARGET = "중앙도서관";
const PROJECT_NAME = "이전 통합 모니터링";
const APP_VERSION = "v3.0";

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
  const [connStatus, setConnStatus] = useState('demo');
  const [lastSync, setLastSync] = useState(null);
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEETS_API_URL);
  const [titleConfig, setTitleConfig] = useState({
    org1: SITE_NAME,
    org2: SITE_TARGET,
    subtitle: PROJECT_NAME
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (sheetUrl) {
      setConnStatus('connecting');
      const fetchData = async () => {
        try {
          const res = await fetch(sheetUrl);
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
      return () => clearInterval(poll);
    }
  }, [sheetUrl]);

  const stats = useMemo(() => {
    const visibleTasks = tasks.filter(t => TASK_GROUPS[t.group] && !t.id.startsWith('T'));
    const done = visibleTasks.filter(t => t.status === 'done').length;
    const prog = visibleTasks.filter(t => t.status === 'progress').length;
    const wait = visibleTasks.filter(t => t.status === 'wait').length;
    const total = visibleTasks.length;
    const overall = total ? Math.round(visibleTasks.reduce((s, t) => s + t.progress, 0) / total) : 0;
    return { done, prog, wait, total, overall };
  }, [tasks]);

  useEffect(() => {
    if (stats.overall < 100) {
      const tickT = setInterval(() => setTick(x => x + 1), 600);
      return () => clearInterval(tickT);
    }
  }, [stats.overall]);

  const dnsTask = tasks.find(t => t.isDns);
  const dnsReady = dnsTask && dnsTask.status === 'done';
  const urlTasks = tasks.filter(t => t.isUrlCheck).sort((a, b) => Number(a.id) - Number(b.id));
  const flowingTasks = tasks.filter(t => t.status === 'progress').sort((a, b) => Number(a.id) - Number(b.id));

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
    <div className="min-h-screen w-full bg-[#020617] flex justify-center items-start overflow-x-hidden">
      <div className="w-full max-w-[1920px] min-h-screen overflow-hidden text-white relative shadow-2xl" style={{
        background: 'linear-gradient(180deg, #0A0E27 0%, #050818 100%)',
        fontFamily: '"Pretendard", "Noto Sans KR", sans-serif'
      }}>
        <BinaryRain />
        <Header now={now} stats={stats} connStatus={connStatus} lastSync={lastSync} titleConfig={titleConfig} />

      <main className="relative px-2 md:px-6 pb-4">
        <div className="flex justify-between w-full px-2 md:px-8 mb-2 z-30 relative">
          <div className="px-3 md:px-12 py-0.5 md:py-1 rounded-full backdrop-blur-md bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-baseline gap-1 md:gap-3">
              <div className="text-xs md:text-xl font-black text-slate-300">기존환경</div>
              <div className="text-[6px] md:text-[10px] tracking-widest text-slate-500 font-bold uppercase">AS-IS</div>
            </div>
          </div>
          <div className="px-3 md:px-12 py-0.5 md:py-1 rounded-full backdrop-blur-md bg-emerald-500/10 border border-emerald-500/30">
            <div className="flex items-baseline gap-1 md:gap-3">
              <div className="text-xs md:text-xl font-black text-emerald-400">신규환경</div>
              <div className="text-[6px] md:text-[10px] tracking-widest text-emerald-500 font-bold uppercase">TO-BE</div>
            </div>
          </div>
        </div>
        <DataMigrationVisual tasks={tasks} flowingTasks={flowingTasks} tick={tick} overall={stats.overall} />
        <div className="hidden md:block" style={{ zoom: 0.95 }}>
          <CapsuleGauges tasks={tasks} />
        </div>
        <div className="md:hidden" style={{ zoom: 0.95 }}>
          <MobileGauges tasks={tasks} />
        </div>
        <SyncPanel 
          dnsTask={dnsTask} dnsReady={dnsReady} urlTasks={urlTasks} 
          verifiedUrls={verifiedUrls} onUrlClick={handleUrlClick} 
          sheetUrl={sheetUrl} setSheetUrl={setSheetUrl} 
          lastSync={lastSync} connStatus={connStatus}
          onSettingsClick={() => setIsSettingsOpen(true)}
        />
      </main>

      {celebrating && <CelebrationOverlay onClose={() => setCelebrating(false)} titleConfig={titleConfig} />}
      {isSettingsOpen && <SettingsModal titleConfig={titleConfig} setTitleConfig={setTitleConfig} onClose={() => setIsSettingsOpen(false)} />}
      <Styles />
      </div>
    </div>
  );
}

function Header({ now, stats, connStatus, titleConfig }) {
  const time = now.toLocaleTimeString('ko-KR', { hour12: false });
  return (
    <header className="relative pt-6 md:pt-6 pb-4 px-4 md:px-10 text-center z-40 flex flex-col items-center">
      <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 mb-4 md:mb-6 text-[10px] md:text-sm">
        <div className="px-2 py-0.5 rounded bg-white/10 text-[8px] md:text-[10px] font-black tracking-tighter">{APP_VERSION}</div>
        {stats.overall === 100 ? (
          <>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
            <span className="text-blue-300 font-black tracking-[0.2em] md:tracking-[0.5em] text-[10px] md:text-xs">MIGRATION COMPLETED</span>
          </>
        ) : (
          <>
            <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-rose-500 animate-pulse shadow-[0_0_15px_rgba(244,63,94,0.8)]" />
            <span className="text-rose-300 font-black tracking-[0.2em] md:tracking-[0.5em] text-[10px] md:text-xs">LIVE MONITORING</span>
          </>
        )}
        <span className="hidden md:inline text-white/30">·</span>
        <span className="text-white/80 font-black text-sm md:text-base tabular-nums tracking-widest">{time}</span>
        <span className="hidden md:inline text-white/30">·</span>
        <span className="font-black uppercase text-[10px] md:text-xs tracking-widest" style={{ color: connStatus === 'connected' ? '#34D399' : '#FBBF24' }}>{connStatus}</span>
      </div>
      
      {/* 4. 타이틀 박스 디자인 적용 (상하 30% 축소) */}
      <div className="inline-block bg-white/5 border border-white/10 rounded-[1.5rem] px-6 py-3 md:px-12 md:py-5 backdrop-blur-md mb-4 md:mb-6 shadow-[0_0_50px_rgba(255,255,255,0.03)]">
        <h1 className="text-xl md:text-4xl font-black tracking-[0.1em] md:tracking-[0.3em] text-transparent bg-clip-text bg-gradient-to-r from-slate-200 via-white to-slate-200 drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] leading-tight md:leading-tight" style={{
          fontFamily: '"Pretendard", sans-serif'
        }}>
          {titleConfig.org1} <span className="text-emerald-400">{titleConfig.org2}</span> <br className="md:hidden" /> {titleConfig.subtitle}
        </h1>
      </div>
      
      {/* 5. 통계(OVERALL, 완료/진행/대기) 1-Line 테이블 형태 */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6 scale-90 md:scale-100 w-full max-w-4xl">
        <div className="flex items-center justify-center gap-4 bg-emerald-900/40 border border-emerald-500/50 rounded-xl px-6 py-3 shadow-[0_0_20px_rgba(52,211,153,0.2)]">
          <div className="text-[10px] md:text-sm text-emerald-400/80 uppercase tracking-[0.2em] font-black">Overall Progress</div>
          <div className="text-2xl md:text-3xl font-black text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] leading-none">{stats.overall}%</div>
        </div>
        
        <div className="flex bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm shadow-lg overflow-hidden">
          <StatTableRow label="완료" value={stats.done} color="#34D399" />
          <div className="w-px bg-white/10" />
          <StatTableRow label="진행" value={stats.prog} color="#FBBF24" />
          <div className="w-px bg-white/10" />
          <StatTableRow label="대기" value={stats.wait} color="#64748B" />
        </div>
      </div>
    </header>
  );
}

function StatTableRow({ label, value, color }) {
  return (
    <div className="flex items-center gap-3 px-4 md:px-8 py-2 md:py-3 transition-all" style={{ boxShadow: `inset 0 0 20px ${color}05` }}>
      <div className="text-[10px] md:text-sm text-white/50 tracking-[0.2em] font-black uppercase">{label}</div>
      <div className="text-2xl md:text-3xl font-black drop-shadow-md leading-none" style={{ color }}>{value}</div>
    </div>
  );
}

function DataMigrationVisual({ tasks, flowingTasks, tick, overall }) {
  const [isMobile, setIsMobile] = React.useState(typeof window !== 'undefined' && window.innerWidth < 768);
  
  React.useEffect(() => {
    if (overall === 100) {
      // 리얼한 웅장한 폭죽(Confetti) 연출
      const duration = 15 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };
      
      const randomInRange = (min, max) => Math.random() * (max - min) + min;

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) {
          return clearInterval(interval);
        }
        const particleCount = 50 * (timeLeft / duration);
        // 왼쪽에서 터짐
        confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } 
        }));
        // 오른쪽에서 터짐
        confetti(Object.assign({}, defaults, { 
          particleCount, 
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } 
        }));
      }, 250);
      
      return () => clearInterval(interval);
    }
  }, [overall]);

  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const endX = isMobile ? 1000 : 1200;

  // 완료된 타스크 추적 (종이비행기 애니메이션용)
  const [completedAnims, setCompletedAnims] = React.useState([]);
  const prevTasksRef = useRef(tasks);

  React.useEffect(() => {
    const prevTasks = prevTasksRef.current;
    const prevFlowing = prevTasks.filter(p => p.status === 'progress').sort((a, b) => Number(a.id) - Number(b.id));
    
    const newCompleted = [];
    tasks.forEach(t => {
      const prev = prevTasks.find(p => p.id === t.id);
      if (prev && prev.status === 'progress' && t.status === 'done') {
        const index = prevFlowing.findIndex(p => p.id === t.id);
        newCompleted.push({ ...t, animId: Date.now() + Math.random(), index: index >= 0 ? index : 0 });
      }
    });

    if (newCompleted.length > 0) {
      setCompletedAnims(prev => [...prev, ...newCompleted]);
      // 서서히 이동하며 사라지도록 3초 후 제거
      setTimeout(() => {
        setCompletedAnims(prev => prev.filter(c => !newCompleted.find(n => n.id === c.id)));
      }, 3000);
    }
    prevTasksRef.current = tasks;
  }, [tasks]);

  // 컨셉 2: 글래스모피즘 기반의 부드러운 광섬유(파이프라인) 데이터 스트림
  const packets = React.useMemo(() => {
    const numLanes = 10; // 파이프라인 10개로 증가
    const numPackets = 80; // 빛 구슬 개수 2배 증가
    return Array.from({ length: numPackets }).map((_, i) => {
      const lane = i % numLanes;
      const yBase = 25 + (lane * (50 / (numLanes - 1))); // 25% ~ 75% 구간에 균일 배치
      
      return {
        id: i,
        yBase,
        delay: - (i * (20 / numPackets)) - Math.random(), // 균일한 간격 배치로 끊김 방지
        duration: 4 + Math.random() * 2, // 4~6초 사이로 속도 편차 축소 (안정적인 흐름)
        size: Math.random() > 0.5 ? 6 : 10,
        color: ['#34D399', '#22D3EE', '#818CF8', '#A78BFA'][Math.floor(Math.random() * 4)],
      };
    });
  }, []);

  const asisOpacity = Math.max(0.1, 1 - (overall / 100));
  const tobeOpacity = Math.max(0.1, (overall / 100));
  const isMigrating = overall < 100;

  return (
    <div className="relative h-[300px] md:h-[55vh] md:min-h-[500px] md:max-h-[600px] w-full overflow-hidden flex justify-center bg-white/[0.03] border border-white/10 rounded-[2rem] shadow-[inset_0_0_50px_rgba(255,255,255,0.02)]">
      
      {/* 블랙홀 중력장 배경 이펙트 */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* 마이그레이션 이펙트 레이어 */}
      <div className="absolute inset-0 z-10 pointer-events-none flex items-center justify-between px-[60px] md:px-[300px]">
        {/* AS-IS 시스템 (데이터의 발원지) */}
        <div className="relative flex flex-col items-center justify-center transition-all duration-1000 z-20" style={{ opacity: asisOpacity, filter: `blur(${overall/20}px)` }}>
          <div className="w-10 h-28 md:w-20 md:h-56 border border-white/10 bg-slate-900/90 rounded-l-2xl shadow-[0_0_30px_rgba(255,255,255,0.05)] flex flex-col items-center justify-evenly p-2 relative overflow-hidden">
             <div className="w-full h-full absolute right-0 bg-gradient-to-l from-white/5 to-transparent" />
          </div>
          <div className="mt-2 md:mt-4 text-[8px] md:text-xs font-black text-white/30 tracking-widest">AS-IS</div>
        </div>

        {/* 데이터 흐름 (Concept 2: Glassmorphism Pipelines) */}
        <div 
          className="absolute top-0 bottom-0 overflow-hidden pointer-events-none z-10"
          style={{ 
            left: isMobile ? '134px' : '476px', 
            right: isMobile ? '134px' : '476px',
            containerType: 'inline-size' 
          }}
        >
          {isMigrating && (
            <>
              {/* 반투명 유리 트랙 (가이드라인) - 10개 */}
              {Array.from({ length: 10 }).map((_, lane) => (
                <div key={`lane-${lane}`} className="absolute left-0 right-0 h-px bg-gradient-to-r from-white/0 via-white/10 to-white/0" style={{ top: `${25 + (lane * (50 / 9))}%` }} />
              ))}
              
              {/* 빛 구슬 (데이터 패킷) */}
              {packets.map(p => (
                <div key={p.id} className="absolute rounded-full" style={{
                  top: `calc(${p.yBase}% - ${p.size / 2}px)`,
                  backgroundColor: p.color,
                  boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
                  width: `${p.size}px`, height: `${p.size}px`,
                  animation: `glassFlow ${p.duration}s ${p.delay}s linear infinite`,
                  opacity: 0,
                }}>
                  {/* 코어 글로우 효과 */}
                  <div className="absolute inset-1 bg-white rounded-full opacity-80" />
                </div>
              ))}
            </>
          )}
        </div>

        {/* TO-BE 시스템 (블랙홀 / 응집점) */}
        <div className="relative flex flex-col items-center justify-center transition-all duration-1000 z-20" style={{ opacity: Math.max(0.3, tobeOpacity) }}>
          <div className="relative flex items-center justify-center w-24 h-24 md:w-48 md:h-48">
            {/* 블랙홀 이벤트 호라이즌(Event Horizon) 회전 효과 */}
            <div className={`absolute inset-0 rounded-full border-t-2 border-r-2 border-emerald-400/40 shadow-[0_0_50px_rgba(52,211,153,0.3)] ${isMigrating ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
            <div className={`absolute inset-2 rounded-full border-b-2 border-l-2 border-cyan-400/40 shadow-[0_0_30px_rgba(34,211,238,0.2)] ${isMigrating ? 'animate-spin' : ''}`} style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
            
            {/* 코어 (블랙홀 중심점) */}
            <div className="w-8 h-8 md:w-16 md:h-16 bg-black rounded-full border border-emerald-500/50 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.8)_inset,0_0_40px_rgba(52,211,153,0.5)] relative">
               <div className="absolute text-[5px] md:text-[8px] font-black text-emerald-300 tracking-widest drop-shadow-[0_0_5px_rgba(0,0,0,1)] text-center leading-tight z-10 bg-black/60 px-1 py-0.5 rounded-full whitespace-nowrap">TO-BE<br/>CORE</div>
               <div className="w-2 h-2 md:w-4 md:h-4 bg-white rounded-full animate-pulse shadow-[0_0_20px_white]" />
            </div>
          </div>
        </div>
      </div>

      {/* 플로팅 태스크 - 순서대로 정렬 */}
      <div className="absolute inset-0 w-full z-30 pointer-events-none">
        {flowingTasks.map((t, i) => (
          <FloatingTaskLabel key={t.id} task={t} index={i} tick={tick} isMobile={isMobile} />
        ))}
        {/* 완료 시 종이비행기 날아가는 이펙트 */}
        {completedAnims.map(c => (
          <PaperPlaneAnim key={c.animId} task={c} index={c.index} isMobile={isMobile} />
        ))}
      </div>

      {/* 100% 달성 시 축하 오버레이 */}
      {overall === 100 && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center pointer-events-none">
          <div className="px-6 py-4 md:px-10 md:py-6 bg-black/60 backdrop-blur-xl rounded-3xl border border-emerald-500/40 shadow-[0_0_50px_rgba(52,211,153,0.2)] flex flex-col items-center gap-2 md:gap-4 animate-in zoom-in duration-500">
            <PartyPopper className="w-10 h-10 md:w-16 md:h-16 text-emerald-400 animate-bounce" />
            <h2 className="text-xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)] text-center tracking-tighter">
              성공적인 이전통합을<br className="md:hidden" /> 축하 합니다.
            </h2>
          </div>
        </div>
      )}

      {/* 태스크 그리드 (스크롤바 표시 및 10% 축소) */}
      <div className="absolute left-1 md:left-4 top-0 bottom-2 w-[130px] md:w-[460px] flex flex-col overflow-y-auto custom-scrollbar pr-1 md:pr-2 z-20">
        <div className="flex-grow shrink-0" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 md:gap-1.5 w-full shrink-0 py-2">
          {tasks.map((t, i) => <ServerNode key={'asis-'+t.id} task={t} mode="asis" index={i} />)}
        </div>
        <div className="flex-grow shrink-0" />
      </div>
      <div className="absolute right-1 md:right-4 top-0 bottom-2 w-[130px] md:w-[460px] flex flex-col overflow-y-auto custom-scrollbar pr-1 md:pr-2 z-20">
        <div className="flex-grow shrink-0" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0.5 md:gap-1.5 w-full shrink-0 py-2">
          {tasks.map((t, i) => <ServerNode key={'tobe-'+t.id} task={t} mode="tobe" index={i} />)}
        </div>
        <div className="flex-grow shrink-0" />
      </div>
    </div>
  );
}

function FloatingTaskLabel({ task, index, tick, isMobile }) {
  // 절대 겹치지 않는 3x4(최대 12개) 그리드(격자) 시스템 도입
  const riverRight = isMobile ? 900 : 1050; 
  const riverLeft = isMobile ? 700 : 600;   
  
  // 기존 대비 크기를 20% 줄여(scale 0.8) 더 많은 슬롯 확보 (4x5 = 20개 슬롯)
  const cols = 4;
  const rows = 5;
  const xStep = (riverRight - riverLeft) / (cols - 1); 
  const yStep = (380 - 100) / (rows - 1); 
  
  const slot = index % (cols * rows);
  const c = Math.floor(slot / rows); // 0(우), 1(중), 2(좌)
  const r = slot % rows; // 0(상) ~ 3(하)
  
  const xCenter = riverRight - (c * xStep);
  const yBase = 100 + (r * yStep);
  
  // 상하좌우 부유(Wobble) 반경을 그리드 간격보다 훨씬 작게 설정하여 절대 겹치지 않게 보장
  const x = xCenter + (Math.sin(tick * 0.02 + index) * 20); 
  const y = yBase + (Math.cos(tick * 0.02 + index) * 15); 
  
  return (
    <div className="absolute px-3 md:px-6 py-1 md:py-2 rounded-full border-2 border-emerald-400/80 bg-black/95 backdrop-blur-3xl shadow-[0_0_50px_rgba(52,211,153,0.6)] flex items-center gap-2 md:gap-4 transition-all duration-1000 whitespace-nowrap origin-center"
      style={{ 
        left: `${(x / 1600) * 100}%`, 
        top: `${(y / 480) * 100}%`,
        transform: `translate(-50%, -50%) scale(${isMobile ? 0.48 : 0.8})`, // 20% 축소
        zIndex: 100 - index // 먼저 진행된 타스크(index가 낮을수록)가 겹칠 때 항상 위로 오게 함
      }}>
      <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_15px_rgba(52,211,153,1)]" />
      <div className="flex flex-col">
        <span className="text-[8px] md:text-xs font-black text-emerald-400/70 tracking-tighter uppercase leading-none mb-0.5 md:mb-1">진행중 작업번호</span>
        <span className="text-sm md:text-xl font-black text-white tracking-tighter drop-shadow-md leading-none">#{task.id}</span>
      </div>
    </div>
  );
}

function PaperPlaneAnim({ task, index, isMobile }) {
  const riverRight = isMobile ? 900 : 1050;
  const riverLeft = isMobile ? 700 : 600;
  
  const cols = 4;
  const rows = 5;
  const xStep = (riverRight - riverLeft) / (cols - 1);
  const yStep = (380 - 100) / (rows - 1);
  
  const slot = index % (cols * rows);
  const c = Math.floor(slot / rows);
  const r = slot % rows;
  
  const xStart = riverRight - (c * xStep);
  const yStart = 100 + (r * yStep);

  return (
    <div className="absolute px-6 py-2 rounded-full border-2 flex items-center gap-3 whitespace-nowrap origin-center animate-paperPlaneFly"
      style={{ 
        left: `${(xStart / 1600) * 100}%`, 
        top: `${(yStart / 480) * 100}%`,
        '--planeScale': isMobile ? 0.48 : 0.8,
        '--destX': isMobile ? 'calc(100% - 60px)' : 'calc(100% - 300px)',
        zIndex: 100 - index
      }}>
      <Send className="w-5 h-5 plane-icon" />
      <span className="text-xl font-black tracking-tighter drop-shadow-md leading-none plane-text">#{task.id} 완료!</span>
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

  const isDoneTobe = !isAsIs && done;

  return (
    <div 
      className={`px-1 py-0.5 md:px-1.5 md:py-1 rounded border transition-all duration-500 flex items-center gap-1 md:gap-1.5 ${blinking ? 'node-blink' : ''}`}
      title={task.name}
      style={{
        background: isDoneTobe ? 'rgba(59, 130, 246, 0.5)' : deactivated ? 'rgba(15,23,42,0.6)' : active ? `${g.color}15` : 'rgba(15,23,42,0.8)',
        borderColor: isDoneTobe ? '#3B82F6' : deactivated ? 'rgba(255,255,255,0.05)' : blinking ? '#FBBF24' : `${g.color}40`,
        opacity: deactivated ? 0.4 : 1,
        boxShadow: isDoneTobe ? '0 0 15px rgba(59, 130, 246, 0.3)' : 'none'
      }}>
      <span className="text-[9px] md:text-[11px] font-black shrink-0" style={{ color: deactivated ? '#444' : g.color }}>
        #{task.id}
      </span>
      {/* 타스크 명 (크기 2단계 업, 넘치면 ...) */}
      <span className="text-[9px] md:text-[11px] font-bold truncate flex-1 leading-none text-white/90">
        {task.name.replace(/^\d+\.\d+\s*/, '')}
      </span>
      {/* 깜빡임 인디케이터 (크기 업) */}
      {blinking && <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white animate-ping shrink-0" />}
    </div>
  );
}

function MobileGauges({ tasks }) {
  const byGroup = useMemo(() => {
    const r = {};
    Object.keys(TASK_GROUPS).forEach(g => {
      const f = tasks.filter(t => t.group === g && !t.id.startsWith('T'));
      const pct = f.length ? Math.round(f.reduce((s, t) => s + t.progress, 0) / f.length) : 0;
      r[g] = { pct };
    });
    return r;
  }, [tasks]);

  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {Object.entries(TASK_GROUPS).map(([key, g]) => (
        <div key={key} className="p-2 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-[8px] font-black uppercase text-white/40 mb-1">{g.label}</div>
          <div className="text-sm font-black" style={{ color: g.color }}>{byGroup[key].pct}%</div>
        </div>
      ))}
    </div>
  );
}

function CapsuleGauges({ tasks }) {
  const byGroup = useMemo(() => {
    const r = {};
    Object.keys(TASK_GROUPS).forEach(g => {
      const f = tasks.filter(t => t.group === g && !t.id.startsWith('T'));
      const done = f.filter(t => t.status === 'done').length;
      const pct = f.length ? Math.round(f.reduce((s, t) => s + t.progress, 0) / f.length) : 0;
      r[g] = { total: f.length, done, pct };
    });
    return r;
  }, [tasks]);

  return (
    <div className="mt-4 px-4">
      <div className="text-center text-xl md:text-2xl font-black tracking-[0.6em] text-white/50 mb-6 uppercase">6단계 공정별 마이그레이션 진척</div>
      <div className="grid grid-cols-6 gap-2 md:gap-4">
        {Object.entries(TASK_GROUPS).map(([key, g]) => {
          const d = byGroup[key];
          return (
            <div key={key} className="px-3 py-2 md:px-4 md:py-3 rounded-[1rem] bg-white/5 border border-white/10 flex flex-col justify-center backdrop-blur-xl relative overflow-hidden">
              <div className="flex items-center justify-center gap-2 mb-2 w-full truncate">
                <span className="text-[10px] md:text-[13px] font-black uppercase tracking-wider opacity-80" style={{ color: g.color }}>{key}. {g.label}</span>
                <span className="text-[10px] md:text-[13px] font-black text-white/40">:</span>
                <span className="text-sm md:text-lg font-black tabular-nums" style={{ color: g.color }}>{d.pct}%</span>
              </div>
              <div className="h-2 md:h-2.5 w-full rounded-full bg-black/40 border border-white/5 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000" style={{
                  width: `${d.pct}%`, background: `linear-gradient(90deg, ${g.color}60, ${g.color})`, boxShadow: `0 0 15px ${g.color}60`
                }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SyncPanel({ dnsTask, dnsReady, urlTasks, verifiedUrls, onUrlClick, sheetUrl, setSheetUrl, lastSync, connStatus, onSettingsClick }) {
  const isOk = connStatus === 'connected';
  return (
    <div className="mt-4 md:mt-6 w-full flex flex-col gap-4">
      <div className="w-full py-2 px-3 md:py-2 md:px-4 rounded-[1.5rem] bg-white/5 border border-white/10 flex flex-col gap-2 backdrop-blur-md shadow-2xl relative">
        
        {/* 파이프라인 및 시트 URL 입력 */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 relative">
          
          {/* 파이프라인 시각화 */}
          <div className="flex items-center gap-2 md:gap-4 bg-black/40 px-4 py-2 rounded-full border border-white/10 flex-shrink-0 z-10">
          <PipelineNode label="Google Sheet" icon={<Cloud className="w-3 h-3" />} active={isOk} />
          <ArrowRight className={`w-3 h-3 ${isOk ? 'text-emerald-400' : 'text-slate-600'}`} />
          <PipelineNode label="Github" icon={<Server className="w-3 h-3" />} active={isOk} />
          <ArrowRight className={`w-3 h-3 ${isOk ? 'text-emerald-400' : 'text-slate-600'}`} />
          <PipelineNode label="Vercel" icon={<Globe className="w-3 h-3" />} active={isOk} />
          
          <button 
            onClick={onSettingsClick} 
            className="ml-1 md:ml-2 w-7 h-7 md:w-8 md:h-8 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center hover:bg-emerald-900/50 hover:border-emerald-500 hover:text-emerald-400 transition-colors group"
            title="타이틀 관리 설정"
          >
            <Settings className="w-3 h-3 md:w-4 md:h-4 text-slate-400 group-hover:text-emerald-400 group-hover:animate-spin" style={{ animationDuration: '3s' }} />
          </button>
        </div>

        {/* URL 정보 영역 */}
        <div className="flex flex-col gap-1.5 w-full">
          <div className="flex items-center w-full bg-black/40 border border-white/10 rounded-full px-4 py-1.5">
            <span className="text-[10px] md:text-xs font-black text-white/40 mr-3 w-16">SHEET</span>
            <input 
              type="text" 
              value={sheetUrl} 
              onChange={e => setSheetUrl(e.target.value)}
              className="bg-transparent w-full outline-none text-[10px] md:text-xs text-emerald-400/80 font-mono"
              placeholder="Google Sheet API URL 입력..."
            />
            <div className={`w-2 h-2 rounded-full shrink-0 ml-3 ${isOk ? 'bg-emerald-400 shadow-[0_0_10px_#34D399]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-1.5">
            <div className="flex items-center w-full bg-black/40 border border-white/10 rounded-full px-4 py-1.5">
              <span className="text-[10px] md:text-xs font-black text-white/40 mr-3 w-16">GITHUB</span>
              <span className="text-[9px] md:text-[11px] text-white/60 font-mono truncate">github.com/your-repo/pyhgoshift</span>
            </div>
            <div className="flex items-center w-full bg-black/40 border border-white/10 rounded-full px-4 py-1.5">
              <span className="text-[10px] md:text-xs font-black text-white/40 mr-3 w-16">VERCEL</span>
              <span className="text-[9px] md:text-[11px] text-white/60 font-mono truncate">system-mg.vercel.app</span>
            </div>
          </div>
          
          {lastSync && (
            <div className="text-[9px] md:text-[10px] font-mono text-white/40 tracking-widest px-2 text-right mt-1">
              Last Deployed: {lastSync.toLocaleString('ko-KR')} (Vercel)
            </div>
          )}
        </div>

        {/* 완벽한 정중앙 하단 로고 배치 */}
        <div className="absolute left-1/2 -bottom-1 md:-bottom-1.5 -translate-x-1/2 pointer-events-none z-20">
          <img 
            src="/pyhgoshift_mg_logo.png" 
            alt="PYHGOSHIFT" 
            className="h-5 md:h-6 object-contain opacity-90 drop-shadow-md" 
          />
        </div>
      </div>
      </div>
    </div>
  );
}

function PipelineNode({ label, icon, active }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`flex items-center justify-center w-6 h-6 rounded-full border ${active ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.4)]' : 'bg-slate-800 border-slate-600 text-slate-500'}`}>
        {icon}
      </div>
      <span className={`text-[9px] md:text-[11px] font-black uppercase tracking-widest ${active ? 'text-emerald-400' : 'text-slate-500'}`}>{label}</span>
    </div>
  );
}

function CelebrationOverlay({ onClose, titleConfig }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
      <div className="text-center animate-in zoom-in duration-500">
        <PartyPopper className="w-24 h-24 text-emerald-400 mx-auto mb-6 animate-bounce" />
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 drop-shadow-[0_0_30px_rgba(52,211,153,0.8)] mb-4">MIGRATION SUCCESS</h1>
        <p className="text-xl md:text-2xl text-white/60 mb-12">{titleConfig.org1} {titleConfig.org2} {titleConfig.subtitle} 시스템 이전이 완료되었습니다.</p>
        <button onClick={onClose} className="px-12 py-4 rounded-full bg-emerald-500 text-black font-black text-xl hover:scale-110 shadow-[0_0_20px_rgba(52,211,153,0.6)] transition-all">확인</button>
      </div>
    </div>
  );
}

function SettingsModal({ titleConfig, setTitleConfig, onClose }) {
  const [local, setLocal] = React.useState(titleConfig);
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="bg-[#0f172a] border border-emerald-500/30 p-6 md:p-8 rounded-[2rem] w-full max-w-md shadow-[0_0_50px_rgba(52,211,153,0.15)] animate-in slide-in-from-bottom-10 fade-in duration-300">
        <h2 className="text-2xl font-black text-white mb-6 flex items-center gap-3">
          <Settings className="w-6 h-6 text-emerald-400" />
          타이틀 설정 관리
        </h2>
        
        <div className="flex flex-col gap-5">
          <div>
            <label className="text-xs text-emerald-400/80 font-bold mb-1 block uppercase tracking-widest">상위 기관명</label>
            <input 
              type="text" 
              value={local.org1} 
              onChange={e => setLocal({...local, org1: e.target.value})} 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 focus:bg-emerald-900/10 transition-colors" 
              placeholder="예: 경기도교육청"
            />
          </div>
          <div>
            <label className="text-xs text-emerald-400/80 font-bold mb-1 block uppercase tracking-widest">하위 기관명/목표</label>
            <input 
              type="text" 
              value={local.org2} 
              onChange={e => setLocal({...local, org2: e.target.value})} 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 focus:bg-emerald-900/10 transition-colors" 
              placeholder="예: 중앙도서관"
            />
          </div>
          <div>
            <label className="text-xs text-emerald-400/80 font-bold mb-1 block uppercase tracking-widest">서브타이틀</label>
            <input 
              type="text" 
              value={local.subtitle} 
              onChange={e => setLocal({...local, subtitle: e.target.value})} 
              className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-emerald-500 focus:bg-emerald-900/10 transition-colors" 
              placeholder="예: 이전통합 모니터링 (V.3.0)"
            />
          </div>
        </div>
        
        <div className="mt-8 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 rounded-full bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white font-bold transition-colors">취소</button>
          <button onClick={() => { setTitleConfig(local); onClose(); }} className="px-6 py-2.5 rounded-full bg-emerald-500 text-black font-black hover:bg-emerald-400 hover:scale-105 shadow-[0_0_15px_rgba(52,211,153,0.4)] transition-all">설정 저장</button>
        </div>
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
      @keyframes glassFlow {
        0% { transform: translateX(0cqw) scale(0.5); opacity: 0; }
        5% { opacity: 1; transform: translateX(5cqw) scale(1); }
        95% { opacity: 1; transform: translateX(95cqw) scale(1); }
        100% { transform: translateX(100cqw) scale(0.5); opacity: 0; }
      }
      @keyframes paperPlaneFly {
        0% { transform: translate(-50%, -50%) scale(var(--planeScale, 0.8)); opacity: 1; }
        20% { transform: translate(calc(-50% - 30px), calc(-50% - 50px)) scale(calc(var(--planeScale, 0.8) * 1.05)) rotate(5deg); opacity: 1; }
        100% { 
          left: var(--destX);
          top: 50%;
          transform: translate(-50%, -50%) scale(0.1) rotate(0deg); 
          opacity: 0; 
        }
      }
      .animate-paperPlaneFly {
        animation: paperPlaneFly 3s ease-out forwards;
      }
      @keyframes planeIconAnim {
        0%, 20% { fill: #fca5a5; color: #fca5a5; }
        100% { fill: #9ca3af; color: #9ca3af; }
      }
      .plane-icon { animation: planeIconAnim 3s ease-out forwards; }
      @keyframes planeTextAnim {
        0%, 20% { color: #ffffff; }
        100% { color: #9ca3af; }
      }
      .plane-text { animation: planeTextAnim 3s ease-out forwards; }
      .node-blink { 
        animation: nodeBlink 1.6s infinite !important;
        background: rgba(251, 191, 36, 0.4) !important;
        border-color: #FBBF24 !important;
        box-shadow: 0 0 25px rgba(251, 191, 36, 0.2) !important;
        z-index: 50;
        position: relative;
      }
      .node-blink * { color: #000 !important; }
      .custom-scrollbar::-webkit-scrollbar { width: 4px; }
      .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.02); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.15); border-radius: 10px; }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
    `}</style>
  );
}

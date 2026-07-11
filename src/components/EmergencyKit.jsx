import React, { useState, useEffect } from 'react';
import {
  ClipboardList, CheckSquare, Square, ShieldCheck,
  Heart, AlertTriangle, RefreshCw, Zap, Droplets,
  Home, Activity, ChevronRight, Award, Info
} from 'lucide-react';

/* ─── Static Survival Kit Items ────────────────────────────── */
const INITIAL_KIT_ITEMS = [
  { id: 'water',      emoji: '💧', label: 'Clean Drinking Water (15 liters per person)' },
  { id: 'flashlight', emoji: '🔦', label: 'Flashlight / Torch with extra batteries' },
  { id: 'powerbank',  emoji: '🔋', label: 'Charged Power Bank & charging cables' },
  { id: 'firstaid',   emoji: '🩹', label: 'First Aid Kit (Antiseptic, cotton, pain killers, band-aids)' },
  { id: 'meds',       emoji: '💊', label: 'Emergency prescription medicines (7-day supply)' },
  { id: 'dryfood',    emoji: '🥫', label: 'Non-perishable food (biscuits, dates, canned foods)' },
  { id: 'chlorine',   emoji: '🧴', label: 'Chlorine purification tablets OR liquid bleach' },
  { id: 'docs',       emoji: '📄', label: 'Photocopies of important documents in waterproof bag' },
  { id: 'whistle',    emoji: '📢', label: 'Whistle (to signal for emergency rescue)' },
  { id: 'raincoat',   emoji: '🧥', label: 'Raincoat / Waterproof boots for each family member' },
  { id: 'radio',      emoji: '📻', label: 'Battery-powered or hand-crank emergency radio' },
  { id: 'cash',       emoji: '💵', label: 'Emergency cash (ATMs may fail during power outages)' },
];

/* ─── Phase Checklists (Before / During / After) ───────────── */
const PHASE_ITEMS = {
  before: [
    { id: 'b1', emoji: '🏠', label: 'Check roof tiles, ceilings and structural cracks to prevent leakages.' },
    { id: 'b2', emoji: '🌊', label: 'Clear domestic drainage outlets, rain gutters, and pipe blocks.' },
    { id: 'b3', emoji: '🌳', label: 'Trim weak, overhanging tree branches located close to the residence.' },
    { id: 'b4', emoji: '📍', label: 'Note coordinates of nearest high-ground shelters and disaster centers.' },
    { id: 'b5', emoji: '⚡', label: 'Inspect electrical wiring; move appliances above potential flood line.' },
    { id: 'b6', emoji: '🛡️', label: 'Prepare a go-bag with documents, medicines & 3-day food supply.' },
  ],
  during: [
    { id: 'd1', emoji: '🏠', label: 'Stay indoors. Avoid venturing into waist-deep water under any conditions.' },
    { id: 'd2', emoji: '⚡', label: 'Unplug electrical units. Disconnect master circuit if water levels approach sockets.' },
    { id: 'd3', emoji: '🐾', label: 'Keep household pets inside the main room. Do not leave them chained outdoors.' },
    { id: 'd4', emoji: '📻', label: 'Stay tuned to regional radio bulletins or emergency alert notifications.' },
    { id: 'd5', emoji: '📞', label: 'Keep emergency numbers saved offline. Conserve phone battery life.' },
    { id: 'd6', emoji: '🚫', label: 'Do not walk / drive through flooded roads or touch fallen power lines.' },
  ],
  after: [
    { id: 'a1', emoji: '⚡', label: 'Inspect electrical lines thoroughly before reactivating heavy appliances.' },
    { id: 'a2', emoji: '🦠', label: 'Disinfect household items. Leptospirosis infection hazards rise in damp mud.' },
    { id: 'a3', emoji: '🦟', label: 'Clear standing puddles in pots, coolers, and tires to eradicate mosquito larvae.' },
    { id: 'a4', emoji: '💧', label: 'Consume only boiled or chlorine-purified drinking water for 7 days.' },
    { id: 'a5', emoji: '📸', label: 'Document property damage with photos for insurance / relief applications.' },
    { id: 'a6', emoji: '🏥', label: 'Monitor family for fever, skin rashes, or respiratory distress — see a doctor immediately.' },
  ]
};

/* ─── Hindi translations (sample) ─────────────────────────── */
const TRANSLATIONS = {
  hi: {
    water:      'साफ पीने का पानी (15 लीटर प्रति व्यक्ति)',
    flashlight: 'फ्लैशलाइट / टॉर्च (अतिरिक्त बैटरी के साथ)',
    powerbank:  'चार्ज किया हुआ पावर बैंक और चार्जिंग केबल',
    firstaid:   'प्राथमिक चिकित्सा किट (एंटीसेप्टिक, पट्टी, दर्द निवारक)',
    meds:       'आवश्यक दवाएं (7 दिनों की खुराक)',
    dryfood:    'सूखा भोजन (बिस्कुट, सूखे मेवे, ओट्स)',
    chlorine:   'क्लोरीन गोलियां (पानी साफ करने के लिए)',
    docs:       'महत्वपूर्ण दस्तावेजों की प्रतियां (वॉटरप्रूफ लिफाफे में)',
    whistle:    'सीटी (आपातकालीन बचाव संकेत के लिए)',
    raincoat:   'रेनकोट / वॉटरप्रूफ जूते (प्रत्येक सदस्य के लिए)',
    radio:      'बैटरी से चलने वाला आपातकालीन रेडियो',
    cash:       'आपातकालीन नकदी (बिजली कटौती में ATM काम नहीं करते)',
    b1: 'छत, दीवारों और दरारों की जांच करें ताकि रिसाव से बचा जा सके।',
    b2: 'घर की नालियों, बरसाती गटरों और पाइप ब्लॉकों को साफ करें।',
    b3: 'घर के पास स्थित पेड़ों की कमजोर, लटकती टहनियों को काटें।',
    b4: 'निकटतम सुरक्षित आश्रयों और आपदा केंद्रों के नंबर नोट करें।',
    b5: 'बिजली के तारों की जांच करें; उपकरणों को संभावित बाढ़ रेखा से ऊपर रखें।',
    b6: 'दस्तावेज, दवाइयाँ और 3 दिन का खाना लेकर "गो-बैग" तैयार करें।',
    d1: 'घर के अंदर रहें। किसी भी परिस्थिति में कमर तक गहरे पानी में न जाएं।',
    d2: 'बिजली के उपकरणों को अनप्लग करें। यदि पानी सॉकेट के स्तर तक पहुंचे तो मेन सर्किट बंद करें।',
    d3: 'पालतू जानवरों को मुख्य कमरे के अंदर रखें। उन्हें बाहर जंजीर से बांधकर न छोड़ें।',
    d4: 'स्थानीय रेडियो बुलेटिन या अलर्ट सूचनाओं से जुड़े रहें।',
    d5: 'आपातकालीन नंबर ऑफलाइन सेव करें। मोबाइल की बैटरी बचाएं।',
    d6: 'जलभराव वाली सड़कों पर न चलें/गाड़ी चलाएं और गिरे हुए बिजली के तारों को न छुएं।',
    a1: 'बिजली उपकरणों को दोबारा चालू करने से पहले बिजली लाइनों की अच्छी तरह जांच करें।',
    a2: 'घरेलू सामानों को कीटाणुरहित करें। नमी वाली मिट्टी में संक्रमण का खतरा बढ़ जाता है।',
    a3: 'मच्छरों के लार्वा को खत्म करने के लिए गमलों, कूलरों और टायरों में जमा पानी हटाएं।',
    a4: '7 दिनों तक केवल उबला हुआ या क्लोरीन से शुद्ध किया हुआ पीने का पानी पिएं।',
    a5: 'बीमा/राहत आवेदन के लिए संपत्ति के नुकसान की तस्वीरें लें।',
    a6: 'बुखार, त्वचा पर चकत्ते या सांस लेने में तकलीफ होने पर तुरंत डॉक्टर से मिलें।',
  }
};

/* ─── Circular SVG Progress Ring ───────────────────────────── */
function ProgressRing({ percent, color, size = 80 }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (circ * Math.min(percent, 100)) / 100;
  return (
    <svg width={size} height={size} aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill="#fff" fontSize={size < 70 ? '11' : '14'} fontWeight="700">
        {percent}%
      </text>
    </svg>
  );
}

/* ─── Checklist Item Row ────────────────────────────────────── */
function CheckItem({ item, checked, onToggle, lang, getLabel }) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      className={`checklist-item${checked ? ' checked' : ''}`}
      onClick={() => onToggle(item.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle(item.id); } }}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
        padding: '0.75rem 1rem',
        background: checked ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${checked ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.07)'}`,
        borderRadius: '0.5rem', cursor: 'pointer', userSelect: 'none',
        transition: 'all 0.2s ease', marginBottom: '0.5rem',
        animation: 'fadeIn 0.3s ease',
      }}
    >
      <span style={{ color: checked ? 'var(--success-color)' : 'var(--text-muted)', flexShrink: 0, marginTop: 2 }}>
        {checked ? <CheckSquare size={18} /> : <Square size={18} />}
      </span>
      <span style={{ fontSize: '0.88rem', lineHeight: 1.5, color: checked ? 'var(--text-muted)' : 'var(--text-main)',
        textDecoration: checked ? 'line-through' : 'none', flex: 1 }}>
        {item.emoji && <span style={{ marginRight: '0.4rem' }}>{item.emoji}</span>}
        {getLabel(item)}
      </span>
    </div>
  );
}

/* ─── Phase Section with progress ──────────────────────────── */
function PhaseSection({ title, icon: Icon, items, phaseChecked, onToggle, lang, accentColor, getPhaseLabel }) {
  const done  = items.filter(i => phaseChecked[i.id]).length;
  const total = items.length;
  const pct   = Math.round((done / total) * 100);

  return (
    <div style={{
      background: 'rgba(255,255,255,0.015)',
      border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: '0.75rem', padding: '1.25rem', marginBottom: '1rem'
    }}>
      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ color: accentColor }}><Icon size={18} /></span>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: accentColor, margin: 0 }}>{title}</h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{done}/{total} done</span>
          <ProgressRing percent={pct} color={accentColor} size={46} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', height: '4px', marginBottom: '1rem', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: accentColor, borderRadius: '1rem',
          transition: 'width 0.5s ease', boxShadow: `0 0 8px ${accentColor}55` }} />
      </div>

      {/* Items */}
      <div>
        {items.map(item => (
          <CheckItem
            key={item.id}
            item={item}
            checked={!!phaseChecked[item.id]}
            onToggle={onToggle}
            lang={lang}
            getLabel={(i) => getPhaseLabel(i)}
          />
        ))}
      </div>
    </div>
  );
}

/* ─── Main Export ──────────────────────────────────────────── */
export default function EmergencyKit({ t, lang }) {
  const [kitChecked,   setKitChecked]   = useState({});
  const [phaseChecked, setPhaseChecked] = useState({});
  const [activePhaseTab, setActivePhaseTab] = useState('before'); // before | during | after

  /* Persist to localStorage */
  useEffect(() => {
    try {
      const savedKit    = localStorage.getItem('monsoonsafe_kit_checked');
      const savedPhases = localStorage.getItem('monsoonsafe_phase_checked');
      if (savedKit)    setKitChecked(JSON.parse(savedKit));
      if (savedPhases) setPhaseChecked(JSON.parse(savedPhases));
    } catch (_) {}
  }, []);

  const saveKitState = (next) => {
    setKitChecked(next);
    try { localStorage.setItem('monsoonsafe_kit_checked', JSON.stringify(next)); } catch (_) {}
  };

  const savePhaseState = (next) => {
    setPhaseChecked(next);
    try { localStorage.setItem('monsoonsafe_phase_checked', JSON.stringify(next)); } catch (_) {}
  };

  const toggleKit   = (id) => saveKitState({ ...kitChecked,   [id]: !kitChecked[id] });
  const togglePhase = (id) => savePhaseState({ ...phaseChecked, [id]: !phaseChecked[id] });

  const resetAll = () => {
    saveKitState({});
    savePhaseState({});
  };

  /* Progress calculations */
  const kitTotal    = INITIAL_KIT_ITEMS.length;
  const kitDone     = INITIAL_KIT_ITEMS.filter(i => kitChecked[i.id]).length;
  const kitProgress = Math.round((kitDone / kitTotal) * 100);

  const allPhaseItems = [...PHASE_ITEMS.before, ...PHASE_ITEMS.during, ...PHASE_ITEMS.after];
  const phaseDone  = allPhaseItems.filter(i => phaseChecked[i.id]).length;
  const phaseTotal = allPhaseItems.length;
  const phaseProgress = Math.round((phaseDone / phaseTotal) * 100);
  const overallProgress = Math.round(((kitDone + phaseDone) / (kitTotal + phaseTotal)) * 100);

  /* Label resolvers */
  const getKitLabel   = (item) => TRANSLATIONS[lang]?.[item.id]   || item.label;
  const getPhaseLabel = (item) => TRANSLATIONS[lang]?.[item.id]   || item.label;

  /* Phase tab config */
  const PHASE_TABS = [
    {
      key: 'before',
      label: t('phaseBefore') || 'Before Monsoon',
      icon: ShieldCheck,
      color: 'var(--success-color)',
      items: PHASE_ITEMS.before
    },
    {
      key: 'during',
      label: t('phaseDuring') || 'During Monsoon',
      icon: AlertTriangle,
      color: 'var(--warning-color)',
      items: PHASE_ITEMS.during
    },
    {
      key: 'after',
      label: t('phaseAfter') || 'After Monsoon',
      icon: RefreshCw,
      color: 'var(--primary-color)',
      items: PHASE_ITEMS.after
    }
  ];

  const activePhase = PHASE_TABS.find(p => p.key === activePhaseTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* ── Overall Readiness Banner ─────────────────────────── */}
      <div className="glass-panel" style={{
        display: 'flex', alignItems: 'center', gap: '1.25rem',
        padding: '1rem 1.5rem',
        background: overallProgress >= 75
          ? 'rgba(16,185,129,0.08)'
          : overallProgress >= 40
          ? 'rgba(245,158,11,0.08)'
          : 'rgba(244,63,94,0.08)',
        border: `1px solid ${overallProgress >= 75
          ? 'rgba(16,185,129,0.25)'
          : overallProgress >= 40
          ? 'rgba(245,158,11,0.25)'
          : 'rgba(244,63,94,0.25)'}`,
        borderRadius: '0.75rem',
        flexWrap: 'wrap'
      }}>
        <ProgressRing
          percent={overallProgress}
          color={overallProgress >= 75 ? 'var(--success-color)' : overallProgress >= 40 ? '#f59e0b' : 'var(--danger-color)'}
          size={72}
        />
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.25rem' }}>
            {overallProgress >= 75
              ? '✅ Well Prepared — Keep it up!'
              : overallProgress >= 40
              ? '⚠️ Partially Prepared — Complete more tasks'
              : '🚨 Not Ready — Take action now!'}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Survival Kit: <strong>{kitDone}/{kitTotal}</strong> &nbsp;|&nbsp;
            Phase Checklists: <strong>{phaseDone}/{phaseTotal}</strong> &nbsp;|&nbsp;
            Overall Readiness: <strong>{overallProgress}%</strong>
          </div>
        </div>
        <button
          onClick={resetAll}
          title="Reset all checklist items"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            padding: '0.4rem 0.75rem', borderRadius: '0.375rem',
            border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.78rem'
          }}
        >
          <RefreshCw size={13} /> Reset
        </button>
      </div>

      {/* ── 2-Column grid ───────────────────────────────────── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '1.5rem',
        alignItems: 'start'
      }}>

        {/* ── LEFT: Emergency Survival Kit ──────────────────── */}
        <div className="glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Heart size={22} color="var(--danger-color)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              {t('emergencyKit') || 'Emergency Survival Kit'}
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', marginBottom: '1rem', lineHeight: 1.5 }}>
            {t('checklistDesc') || 'Complete these essential actions to keep your family safe.'}
          </p>

          {/* Kit progress bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <ProgressRing percent={kitProgress} color="var(--danger-color)" size={52} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{t('kitProgress') || 'Kit Completion'}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{kitDone} of {kitTotal} items ready</div>
            </div>
          </div>

          <div>
            {INITIAL_KIT_ITEMS.map(item => (
              <CheckItem
                key={item.id}
                item={item}
                checked={!!kitChecked[item.id]}
                onToggle={toggleKit}
                lang={lang}
                getLabel={getKitLabel}
              />
            ))}
          </div>
        </div>

        {/* ── RIGHT: Phase Checklists with tabs ─────────────── */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <ClipboardList size={22} color="var(--primary-color)" />
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
              {t('checklistTitle') || 'Monsoon Phase Checklists'}
            </h2>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.83rem', lineHeight: 1.5, margin: 0 }}>
            Track preparedness actions across all three monsoon phases.
          </p>

          {/* Phase tab switcher */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {PHASE_TABS.map(tab => {
              const isActive = activePhaseTab === tab.key;
              const phaseDoneCount = tab.items.filter(i => phaseChecked[i.id]).length;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActivePhaseTab(tab.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.35rem',
                    padding: '0.5rem 0.875rem',
                    borderRadius: '0.5rem',
                    border: `1px solid ${isActive ? tab.color : 'rgba(255,255,255,0.1)'}`,
                    background: isActive ? `${tab.color}18` : 'transparent',
                    color: isActive ? tab.color : 'var(--text-secondary)',
                    cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                  aria-pressed={isActive}
                >
                  <tab.icon size={14} />
                  {tab.key === 'before' ? 'Before' : tab.key === 'during' ? 'During' : 'After'}
                  <span style={{
                    background: isActive ? tab.color : 'rgba(255,255,255,0.1)',
                    color: isActive ? '#000' : 'var(--text-secondary)',
                    borderRadius: '1rem', padding: '0 0.4rem', fontSize: '0.7rem', fontWeight: 700
                  }}>
                    {phaseDoneCount}/{tab.items.length}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active phase content */}
          {activePhase && (
            <div key={activePhase.key} style={{ animation: 'fadeIn 0.3s ease' }}>
              {/* Phase header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                background: `${activePhase.color}10`,
                border: `1px solid ${activePhase.color}30`,
                borderRadius: '0.625rem', marginBottom: '0.875rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <activePhase.icon size={16} color={activePhase.color} />
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: activePhase.color }}>
                    {activePhase.label}
                  </span>
                </div>
                <ProgressRing
                  percent={Math.round((activePhase.items.filter(i => phaseChecked[i.id]).length / activePhase.items.length) * 100)}
                  color={activePhase.color}
                  size={44}
                />
              </div>

              {/* Phase items */}
              <div>
                {activePhase.items.map(item => (
                  <CheckItem
                    key={item.id}
                    item={item}
                    checked={!!phaseChecked[item.id]}
                    onToggle={togglePhase}
                    lang={lang}
                    getLabel={getPhaseLabel}
                  />
                ))}
              </div>

              {/* Phase tip */}
              <div style={{
                marginTop: '0.875rem', padding: '0.625rem 0.875rem',
                background: 'rgba(56,189,248,0.06)',
                border: '1px solid rgba(56,189,248,0.15)',
                borderRadius: '0.5rem', fontSize: '0.78rem', color: '#7dd3fc',
                display: 'flex', alignItems: 'flex-start', gap: '0.5rem', lineHeight: 1.5
              }}>
                <Info size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                <span>
                  {activePhase.key === 'before'
                    ? '💡 AI Tip: Start at least 2 weeks before the monsoon season for full preparedness.'
                    : activePhase.key === 'during'
                    ? '💡 AI Tip: If evacuation is ordered, leave immediately — do not wait for water to rise further.'
                    : '💡 AI Tip: Watch for dengue and leptospirosis symptoms for 2 weeks after flooding.'}
                </span>
              </div>
            </div>
          )}

          {/* Overall phase progress bar */}
          <div style={{ paddingTop: '0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem',
              color: 'var(--text-secondary)', marginBottom: '0.375rem' }}>
              <span>All Phase Progress</span>
              <span style={{ fontWeight: 700, color: 'var(--primary-color)' }}>{phaseProgress}%</span>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '1rem', height: '6px', overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${phaseProgress}%`,
                background: 'linear-gradient(90deg, var(--primary-color), #818cf8)',
                borderRadius: '1rem', transition: 'width 0.5s ease'
              }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── GenAI Tip Card ────────────────────────────────────── */}
      <div className="glass-panel" style={{
        background: 'rgba(99,102,241,0.06)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: '0.75rem', padding: '1rem 1.25rem',
        display: 'flex', alignItems: 'flex-start', gap: '0.875rem'
      }}>
        <Zap size={20} color="var(--primary-color)" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.25rem', color: 'var(--primary-color)' }}>
            🤖 GenAI Monsoon Preparedness Insight
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
            Based on real-time risk analysis, <strong style={{ color: '#a5b4fc' }}>families in ground-floor residences</strong> should prioritize waterproofing documents, identifying evacuation routes, and stocking at least 15 litres of clean water per person. Use the <strong style={{ color: '#a5b4fc' }}>AI Planner tab</strong> to get a fully personalized monsoon blueprint customized to your city, family size, and housing type.
          </p>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { ClipboardList, CheckSquare, Square, ShieldCheck, Heart } from 'lucide-react';

const INITIAL_KIT_ITEMS = [
  { id: 'water', label: 'Clean Drinking Water (15 liters per person)' },
  { id: 'flashlight', label: 'Flashlight / Torch with extra batteries' },
  { id: 'powerbank', label: 'Charged Power Bank & charging cables' },
  { id: 'firstaid', label: 'First Aid Kit (Antiseptic, cotton, pain killers, band-aids)' },
  { id: 'meds', label: 'Emergency prescription medicines (7-day supply)' },
  { id: 'dryfood', label: 'Non-perishable food (biscuits, dates, canned foods)' },
  { id: 'chlorine', label: 'Chlorine purification tablets OR liquid bleach' },
  { id: 'docs', label: 'Photocopies of important documents in waterproof bag' },
  { id: 'whistle', label: 'Whistle (to signal for emergency rescue)' }
];

export default function EmergencyKit({ t, lang }) {
  const [kitChecked, setKitChecked] = useState({});
  const [phaseChecked, setPhaseChecked] = useState({});

  useEffect(() => {
    // Read state from localStorage
    const savedKit = localStorage.getItem('monsoonsafe_kit_checked');
    const savedPhases = localStorage.getItem('monsoonsafe_phase_checked');
    if (savedKit) setKitChecked(JSON.parse(savedKit));
    if (savedPhases) setPhaseChecked(JSON.parse(savedPhases));
  }, []);

  const saveKitState = (newKit) => {
    setKitChecked(newKit);
    localStorage.setItem('monsoonsafe_kit_checked', JSON.stringify(newKit));
  };

  const savePhaseState = (newPhases) => {
    setPhaseChecked(newPhases);
    localStorage.setItem('monsoonsafe_phase_checked', JSON.stringify(newPhases));
  };

  const toggleKitItem = (id) => {
    const next = { ...kitChecked, [id]: !kitChecked[id] };
    saveKitState(next);
  };

  const togglePhaseItem = (id) => {
    const next = { ...phaseChecked, [id]: !phaseChecked[id] };
    savePhaseState(next);
  };

  // Calculate Survival Kit progress percentage
  const totalKit = INITIAL_KIT_ITEMS.length;
  const checkedKit = INITIAL_KIT_ITEMS.filter(item => kitChecked[item.id]).length;
  const kitProgress = Math.round((checkedKit / totalKit) * 100);

  // Localization adjustments for Emergency Kit item labels
  const getKitItemLabel = (item) => {
    // Simplified translations for survival kit elements
    const translations = {
      hi: {
        water: 'साफ पीने का पानी (15 लीटर प्रति व्यक्ति)',
        flashlight: 'फ्लैशलाइट / टॉर्च (अतिरिक्त बैटरी के साथ)',
        powerbank: 'चार्ज किया हुआ पावर बैंक और चार्जिंग केबल',
        firstaid: 'प्राथमिक चिकित्सा किट (एंटीसेप्टिक, पट्टी, दर्द निवारक)',
        meds: 'आवश्यक दवाएं (7 दिनों की खुराक)',
        dryfood: 'सूखा भोजन (बिस्कुट, सूखे मेवे, ओट्स)',
        chlorine: 'क्लोरीन गोलियां (पानी साफ करने के लिए)',
        docs: 'महत्वपूर्ण दस्तावेजों की प्रतियां (वॉटरप्रूफ लिफाफे में)',
        whistle: 'सीटी (आपातकालीन बचाव संकेत के लिए)'
      }
    };
    return translations[lang]?.[item.id] || item.label;
  };

  const phaseItems = {
    before: [
      { id: 'b1', label: 'Check roof tiles, ceilings and structural cracks to prevent leakages.' },
      { id: 'b2', label: 'Clear domestic drainage outlets, rain gutters, and pipe blocks.' },
      { id: 'b3', label: 'Trim weak, overhanging tree branches located close to the residence.' },
      { id: 'b4', label: 'Note down coordinates of nearest high-ground shelters and disaster centers.' }
    ],
    during: [
      { id: 'd1', label: 'Stay indoors. Avoid venturing into waist-deep water under any conditions.' },
      { id: 'd2', label: 'Unplug electrical units. Disconnect master circuit if water levels approach sockets.' },
      { id: 'd3', label: 'Keep household pets inside the main room. Do not leave them chained outdoors.' },
      { id: 'd4', label: 'Stay tuned to regional radio bulletins or alert notifications.' }
    ],
    after: [
      { id: 'a1', label: 'Inspect electrical lines thoroughly before reactivating heavy machinery/appliances.' },
      { id: 'a2', label: 'Disinfect household items. Leptospirosis infection hazards rise in damp mud.' },
      { id: 'a3', label: 'Clear standing puddles in pots, coolers, and tires to eradicate mosquito larvae.' },
      { id: 'a4', label: 'Consume only boiled or chlorine-purified drinking water.' }
    ]
  };

  // Localized Phase item labels
  const getPhaseItemLabel = (item, phase) => {
    const translations = {
      hi: {
        b1: 'छत, छतों और दीवारों की दरारों की जांच करें ताकि रिसाव से बचा जा सके।',
        b2: 'घर की नालियों, बरसाती गटरों और पाइप ब्लॉकों को साफ करें।',
        b3: 'घर के पास स्थित पेड़ों की कमजोर, लटकती टहनियों को काटें।',
        b4: 'निकटतम ऊंचे सुरक्षित आश्रयों और आपदा केंद्रों के नंबर नोट करें।',
        d1: 'घर के अंदर रहें। किसी भी परिस्थिति में कमर तक गहरे पानी में न जाएं।',
        d2: 'बिजली के उपकरणों को अनप्लग करें। यदि पानी सॉकेट के स्तर तक पहुंचे तो मेन सर्किट बंद करें।',
        d3: 'पालतू जानवरों को मुख्य कमरे के अंदर रखें। उन्हें बाहर जंजीर से बांधकर न छोड़ें।',
        d4: 'स्थानीय रेडियो बुलेटिन या अलर्ट सूचनाओं से जुड़े रहें।',
        a1: 'बिजली उपकरणों को दोबारा चालू करने से पहले बिजली लाइनों की अच्छी तरह जांच करें।',
        a2: 'घरेलू सामानों को कीटाणुरहित करें। नमी वाली मिट्टी में संक्रमण का खतरा बढ़ जाता है।',
        a3: 'मच्छरों के लार्वा को खत्म करने के लिए गमलों, कूलरों और टायरों में जमा पानी को हटा दें।',
        a4: 'केवल उबला हुआ या क्लोरीन से शुद्ध किया हुआ पीने का पानी ही पिएं।'
      }
    };
    return translations[lang]?.[item.id] || item.label;
  };

  return (
    <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
      {/* 2 column layout for wide screens */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem', ...({ '@media (min-width: 768px)': { gridTemplateColumns: '1fr 1fr' } }) }} className="kit-grid-container">
        
        {/* Left Column: Emergency Kit Builder */}
        <div className="glass-panel">
          <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Heart size={24} color="var(--danger-color)" />
            {t('emergencyKit')}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
            {t('checklistDesc')}
          </p>

          {/* Progress bar */}
          <div className="risk-meter-container" style={{ marginBottom: '1.5rem' }}>
            <div className="risk-header">
              <span style={{ fontWeight: 500 }}>{t('kitProgress')}</span>
              <span style={{ fontWeight: 700, color: 'var(--success-color)' }}>{kitProgress}%</span>
            </div>
            <div className="risk-bar-outer">
              <div
                className="risk-bar-inner"
                style={{
                  width: `${kitProgress}%`,
                  backgroundColor: 'var(--success-color)',
                  boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)'
                }}
              />
            </div>
          </div>

          <div className="checklist-items">
            {INITIAL_KIT_ITEMS.map((item) => {
              const checked = !!kitChecked[item.id];
              return (
                <div
                  key={item.id}
                  className={`checklist-item ${checked ? 'checked' : ''}`}
                  onClick={() => toggleKitItem(item.id)}
                >
                  <span className="checkbox-btn">
                    {checked ? <CheckSquare size={18} /> : <Square size={18} />}
                  </span>
                  <span>{getKitItemLabel(item)}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Phase check lists */}
        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardList size={24} color="var(--primary-color)" />
            {t('checklistTitle')}
          </h2>

          {/* BEFORE MONSOON */}
          <div className="checklist-section">
            <h3 className="checklist-header" style={{ fontSize: '1rem' }}>
              <ShieldCheck size={18} />
              {t('phaseBefore')}
            </h3>
            <div className="checklist-items">
              {phaseItems.before.map((item) => {
                const checked = !!phaseChecked[item.id];
                return (
                  <div
                    key={item.id}
                    className={`checklist-item ${checked ? 'checked' : ''}`}
                    onClick={() => togglePhaseItem(item.id)}
                  >
                    <span className="checkbox-btn">
                      {checked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </span>
                    <span style={{ fontSize: '0.85rem' }}>{getPhaseItemLabel(item, 'before')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DURING MONSOON */}
          <div className="checklist-section">
            <h3 className="checklist-header" style={{ fontSize: '1rem', color: 'var(--warning-color)' }}>
              <AlertTriangle size={18} />
              {t('phaseDuring')}
            </h3>
            <div className="checklist-items">
              {phaseItems.during.map((item) => {
                const checked = !!phaseChecked[item.id];
                return (
                  <div
                    key={item.id}
                    className={`checklist-item ${checked ? 'checked' : ''}`}
                    onClick={() => togglePhaseItem(item.id)}
                  >
                    <span className="checkbox-btn">
                      {checked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </span>
                    <span style={{ fontSize: '0.85rem' }}>{getPhaseItemLabel(item, 'during')}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AFTER MONSOON */}
          <div className="checklist-section">
            <h3 className="checklist-header" style={{ fontSize: '1rem', color: 'var(--success-color)' }}>
              <ShieldCheck size={18} />
              {t('phaseAfter')}
            </h3>
            <div className="checklist-items">
              {phaseItems.after.map((item) => {
                const checked = !!phaseChecked[item.id];
                return (
                  <div
                    key={item.id}
                    className={`checklist-item ${checked ? 'checked' : ''}`}
                    onClick={() => togglePhaseItem(item.id)}
                  >
                    <span className="checkbox-btn">
                      {checked ? <CheckSquare size={16} /> : <Square size={16} />}
                    </span>
                    <span style={{ fontSize: '0.85rem' }}>{getPhaseItemLabel(item, 'after')}</span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

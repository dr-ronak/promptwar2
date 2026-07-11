import React, { useState, useEffect } from 'react';
import { Sparkles, Users, Home, AlertTriangle, ShieldCheck, Volume2, Square, Copy } from 'lucide-react';
import { aiService } from '../services/aiService';
import { speechService } from '../utils/speech';

// Simple client-side Markdown rendering helper to avoid external dependency issues
function renderMarkdown(mdText) {
  if (!mdText) return null;
  const lines = mdText.split('\n');
  let inList = false;
  const listItems = [];
  const elements = [];

  const parseInlineFormatting = (text) => {
    // Basic bold parser **text**
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index}>{part}</strong>;
      }
      return part;
    });
  };

  const flushList = (key) => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`ul-${key}`} style={{ marginBottom: '1rem', marginLeft: '1.5rem' }}>
          {[...listItems]}
        </ul>
      );
      listItems.length = 0;
      inList = false;
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('## ')) {
      flushList(index);
      elements.push(<h2 key={index} style={{ fontSize: '1.25rem', color: 'var(--primary-color)', marginTop: '1.25rem', marginBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '0.25rem' }}>{parseInlineFormatting(trimmed.substring(3))}</h2>);
    } else if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(<h3 key={index} style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '1rem', marginBottom: '0.5rem' }}>{parseInlineFormatting(trimmed.substring(4))}</h3>);
    } else if (trimmed.startsWith('#### ')) {
      flushList(index);
      elements.push(<h4 key={index} style={{ fontSize: '0.95rem', color: 'var(--warning-color)', marginTop: '0.75rem', marginBottom: '0.25rem' }}>{parseInlineFormatting(trimmed.substring(5))}</h4>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(<li key={`li-${index}`} style={{ marginBottom: '0.35rem', color: '#e2e8f0', fontSize: '0.9rem' }}>{parseInlineFormatting(trimmed.substring(2))}</li>);
    } else if (trimmed === '') {
      flushList(index);
    } else {
      flushList(index);
      elements.push(<p key={index} style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>{parseInlineFormatting(trimmed)}</p>);
    }
  });

  flushList('final');
  return <div className="markdown-body">{elements}</div>;
}

export default function AIPlanner({ weatherData, t, lang }) {
  const [familyCount, setFamilyCount] = useState(4);
  const [specialNeeds, setSpecialNeeds] = useState({
    elderly: false,
    infants: false,
    pets: false,
    disabled: false
  });
  const [residenceType, setResidenceType] = useState('groundFloor');
  const [vehicle, setVehicle] = useState('twoWheeler');
  const [loading, setLoading] = useState(false);
  const [planOutput, setPlanOutput] = useState('');
  const [isReading, setIsReading] = useState(false);

  // Load previously generated plan from localstorage on mount
  useEffect(() => {
    const savedPlan = localStorage.getItem(`saved_plan_${lang}`);
    if (savedPlan) {
      setPlanOutput(savedPlan);
    } else {
      setPlanOutput('');
    }
  }, [lang]);

  const handleCheckboxChange = (key) => {
    setSpecialNeeds(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    speechService.stop();
    setIsReading(false);
    
    try {
      const plan = await aiService.generatePreparednessPlan({
        city: weatherData.city,
        familyCount,
        specialNeeds,
        residenceType,
        vehicle,
        weatherData,
        langCode: lang
      });
      setPlanOutput(plan);
      localStorage.setItem(`saved_plan_${lang}`, plan);
    } catch (error) {
      console.error('Plan generation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(planOutput);
    alert('Plan copied to clipboard!');
  };

  const handleTTS = () => {
    if (isReading) {
      speechService.stop();
      setIsReading(false);
    } else {
      setIsReading(true);
      speechService.speak(
        planOutput,
        lang,
        () => setIsReading(true),
        () => setIsReading(false),
        () => setIsReading(false)
      );
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div className="glass-panel">
        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Sparkles size={24} color="#38bdf8" />
          {t('plannerTitle')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {t('plannerDesc')}
        </p>

        {/* Config Form */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
          {/* Family Count */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={16} />
              {t('familyMembers')}
            </label>
            <input
              type="number"
              className="form-input"
              min="1"
              max="20"
              value={familyCount}
              onChange={(e) => setFamilyCount(parseInt(e.target.value) || 1)}
            />
          </div>

          {/* Special Needs Checklist */}
          <div className="form-group">
            <label className="form-label">{t('specialNeeds')}</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.25rem' }}>
              {Object.keys(specialNeeds).map((key) => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={specialNeeds[key]}
                    onChange={() => handleCheckboxChange(key)}
                    style={{ accentColor: 'var(--primary-color)' }}
                  />
                  <span>{t(key)}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Residence Type Selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Home size={16} />
              {t('residenceType')}
            </label>
            <select
              className="form-select"
              value={residenceType}
              onChange={(e) => setResidenceType(e.target.value)}
            >
              <option value="groundFloor">{t('groundFloor')}</option>
              <option value="upperFloor">{t('upperFloor')}</option>
              <option value="independentHouse">{t('independentHouse')}</option>
              <option value="slumKutcha">{t('slumKutcha')}</option>
            </select>
          </div>

          {/* Vehicles selector */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={16} />
              {t('vehicleOwned')}
            </label>
            <select
              className="form-select"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
            >
              <option value="twoWheeler">{t('twoWheeler')}</option>
              <option value="fourWheeler">{t('fourWheeler')}</option>
              <option value="noVehicle">{t('noVehicle')}</option>
            </select>
          </div>
        </div>

        {/* Generate Trigger */}
        <button
          className="btn btn-primary"
          style={{ width: '100%', marginTop: '1rem', padding: '0.875rem' }}
          onClick={handleGenerate}
          disabled={loading}
        >
          <Sparkles size={18} className={loading ? 'alert-pulse' : ''} />
          {loading ? t('generating') : t('generatePlan')}
        </button>
      </div>

      {/* Blueprint output */}
      {planOutput && (
        <div className="glass-panel" style={{ border: '1px solid var(--primary-hover)' }}>
          <div className="ai-output-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={20} color="#10b981" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('planResultTitle')}</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '0.375rem' }}>
              <button
                className="btn btn-outline"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                onClick={handleTTS}
              >
                {isReading ? <Square size={12} style={{ marginRight: '0.25rem' }} /> : <Volume2 size={12} style={{ marginRight: '0.25rem' }} />}
                {isReading ? 'Stop' : t('ttsControl')}
              </button>
              <button
                className="btn btn-outline"
                style={{ padding: '0.4rem', borderRadius: '0.375rem' }}
                onClick={handleCopy}
                title="Copy markdown content"
              >
                <Copy size={12} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {renderMarkdown(planOutput)}
          </div>
        </div>
      )}
    </div>
  );
}

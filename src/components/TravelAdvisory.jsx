import React, { useState, useEffect } from 'react';
import { Navigation, Bike, Car, Footprints, AlertTriangle, ShieldCheck, Volume2, Square } from 'lucide-react';
import { aiService } from '../services/aiService';
import { speechService } from '../utils/speech';

// Safe markdown parser helper
function renderMarkdown(mdText) {
  if (!mdText) return null;
  const lines = mdText.split('\n');
  let inList = false;
  const listItems = [];
  const elements = [];

  const parseInlineFormatting = (text) => {
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
    
    if (trimmed.startsWith('### ')) {
      flushList(index);
      elements.push(<h3 key={index} style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '1rem', marginBottom: '0.5rem' }}>{parseInlineFormatting(trimmed.substring(4))}</h3>);
    } else if (trimmed.startsWith('#### ')) {
      flushList(index);
      elements.push(<h4 key={index} style={{ fontSize: '0.95rem', color: 'var(--primary-color)', marginTop: '0.75rem', marginBottom: '0.25rem' }}>{parseInlineFormatting(trimmed.substring(5))}</h4>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(<li key={`li-${index}`} style={{ marginBottom: '0.35rem', color: '#e2e8f0', fontSize: '0.9rem' }}>{parseInlineFormatting(trimmed.substring(2))}</li>);
    } else if (trimmed.match(/^\d+\.\s/)) {
      flushList(index);
      const dotIndex = trimmed.indexOf('.');
      elements.push(<p key={index} style={{ marginBottom: '0.5rem', fontSize: '0.9rem', color: '#cbd5e1', paddingLeft: '0.5rem' }}><strong>{trimmed.substring(0, dotIndex + 1)}</strong> {parseInlineFormatting(trimmed.substring(dotIndex + 1).trim())}</p>);
    } else if (trimmed === '') {
      flushList(index);
    } else {
      flushList(index);
      // Highlight safety indexes specifically
      if (trimmed.includes('Safety Index:') || trimmed.includes('सुरक्षा सूचकांक:')) {
        elements.push(<div key={index} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '0.5rem', padding: '0.75rem', marginBottom: '1rem', fontSize: '1.05rem' }}>{parseInlineFormatting(trimmed)}</div>);
      } else {
        elements.push(<p key={index} style={{ marginBottom: '0.75rem', fontSize: '0.9rem', color: '#cbd5e1' }}>{parseInlineFormatting(trimmed)}</p>);
      }
    }
  });

  flushList('final');
  return <div className="markdown-body">{elements}</div>;
}

export default function TravelAdvisory({ weatherData, t, lang }) {
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [travelMode, setTravelMode] = useState('twoWheeler');
  const [loading, setLoading] = useState(false);
  const [advisoryOutput, setAdvisoryOutput] = useState('');
  const [isReading, setIsReading] = useState(false);

  useEffect(() => {
    setAdvisoryOutput('');
    speechService.stop();
    setIsReading(false);
  }, [lang]);

  const handleCheckRoute = async (e) => {
    e.preventDefault();
    if (!source.trim() || !destination.trim()) {
      alert('Please enter both start location and destination.');
      return;
    }

    setLoading(true);
    speechService.stop();
    setIsReading(false);

    try {
      const guidance = await aiService.generateTravelAdvisory({
        source: source.trim(),
        destination: destination.trim(),
        travelMode,
        weatherData,
        langCode: lang
      });
      setAdvisoryOutput(guidance);
    } catch (error) {
      console.error('Advisory failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = () => {
    if (isReading) {
      speechService.stop();
      setIsReading(false);
    } else {
      setIsReading(true);
      speechService.speak(
        advisoryOutput,
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
          <Navigation size={24} color="#38bdf8" />
          {t('travelTitle')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
          {t('travelDesc')}
        </p>

        <form onSubmit={handleCheckRoute} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Starting Location */}
          <div className="form-group">
            <label className="form-label">{t('startLocation')}</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Bandra West / Connaught Place"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>

          {/* Destination Location */}
          <div className="form-group">
            <label className="form-label">{t('destination')}</label>
            <input
              type="text"
              className="form-input"
              required
              placeholder="e.g. Lower Parel / Noida Sector 62"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>

          {/* Transit Mode buttons */}
          <div className="form-group">
            <label className="form-label">{t('travelMode')}</label>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
              <button
                type="button"
                className={`btn btn-icon ${travelMode === 'twoWheeler' ? 'active' : ''}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', height: '60px' }}
                onClick={() => setTravelMode('twoWheeler')}
              >
                <Bike size={18} />
                <span style={{ fontSize: '0.75rem' }}>Two-Wheeler</span>
              </button>
              <button
                type="button"
                className={`btn btn-icon ${travelMode === 'fourWheeler' ? 'active' : ''}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', height: '60px' }}
                onClick={() => setTravelMode('fourWheeler')}
              >
                <Car size={18} />
                <span style={{ fontSize: '0.75rem' }}>Car / Auto</span>
              </button>
              <button
                type="button"
                className={`btn btn-icon ${travelMode === 'walking' ? 'active' : ''}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem', height: '60px' }}
                onClick={() => setTravelMode('walking')}
              >
                <Footprints size={18} />
                <span style={{ fontSize: '0.75rem' }}>Walk / Transit</span>
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ padding: '0.8rem', marginTop: '0.5rem' }} disabled={loading}>
            <Navigation size={18} className={loading ? 'alert-pulse' : ''} />
            {loading ? t('generating') : t('checkRoute')}
          </button>
        </form>
      </div>

      {/* Advisory Output */}
      {advisoryOutput && (
        <div className="glass-panel" style={{ border: '1px solid var(--border-hover)' }}>
          <div className="ai-output-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={20} color="var(--warning-color)" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>{t('safetyRating')}</h3>
            </div>
            
            <button
              className="btn btn-outline"
              style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
              onClick={handleTTS}
            >
              {isReading ? <Square size={12} style={{ marginRight: '0.25rem' }} /> : <Volume2 size={12} style={{ marginRight: '0.25rem' }} />}
              {isReading ? 'Stop' : t('ttsControl')}
            </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {renderMarkdown(advisoryOutput)}
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { CloudRain, Key, Settings, VolumeX, Type, ShieldAlert } from 'lucide-react';
import { translations, LANGUAGES } from './utils/translations';
import { weatherService } from './services/weatherService';
import { aiService } from './services/aiService';
import { speechService } from './utils/speech';

// Import views
import WeatherAlerts from './components/WeatherAlerts';
import AIPlanner from './components/AIPlanner';
import EmergencyKit from './components/EmergencyKit';
import TravelAdvisory from './components/TravelAdvisory';
import CommunityHub from './components/CommunityHub';
import HelpCenter from './components/HelpCenter';

export default function App() {
  // Locale State
  const [lang, setLang] = useState('en');
  
  // Weather Context State
  const [city, setCity] = useState('Mumbai');
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(true);

  // Key Configuration UI State
  const [showKeyPanel, setShowKeyPanel] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [hasKey, setHasKey] = useState(false);

  // Layout Tab State
  const [activeTab, setActiveTab] = useState('planner');

  // Accessibility Font Level
  const [fontSizeLevel, setFontSizeLevel] = useState('normal'); // normal, large, xlarge

  // Load language, API Key states and initial weather on mount
  useEffect(() => {
    // 1. Initial Local Key Check
    const keyExists = aiService.hasKey();
    setHasKey(keyExists);
    if (keyExists) {
      setApiKeyInput('••••••••••••••••••••••••••••••••');
    }

    // 2. Fetch Initial Weather
    loadWeather(city);
  }, []);

  const loadWeather = async (cityName) => {
    setWeatherLoading(true);
    try {
      const data = await weatherService.fetchWeather(cityName);
      setWeatherData(data);
      // Synchronize city name with capitalized output from service
      setCity(data.city);
    } catch (error) {
      console.error('Failed to load weather data:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  const handleSearchCity = (cityName) => {
    loadWeather(cityName);
  };

  // Translation helper
  const t = (key) => {
    return translations[lang]?.[key] || translations.en?.[key] || key;
  };

  // Font Size Scaler
  const cycleFontSize = () => {
    let nextLevel = 'normal';
    if (fontSizeLevel === 'normal') nextLevel = 'large';
    else if (fontSizeLevel === 'large') nextLevel = 'xlarge';
    
    setFontSizeLevel(nextLevel);
    
    // Apply body class
    const body = document.body;
    body.classList.remove('font-size-large', 'font-size-xlarge');
    if (nextLevel === 'large') body.classList.add('font-size-large');
    if (nextLevel === 'xlarge') body.classList.add('font-size-xlarge');
  };

  // Save API Key handler
  const handleSaveKey = () => {
    if (apiKeyInput.trim() && !apiKeyInput.includes('•••')) {
      aiService.setKey(apiKeyInput.trim());
      setHasKey(true);
      alert('API Key saved successfully in local storage.');
    } else if (!apiKeyInput.trim()) {
      aiService.clearKey();
      setHasKey(false);
      alert('API Key removed.');
    }
    setShowKeyPanel(false);
  };

  const handleClearKey = () => {
    aiService.clearKey();
    setApiKeyInput('');
    setHasKey(false);
    alert('API Key cleared.');
    setShowKeyPanel(false);
  };

  const handleStopSpeech = () => {
    speechService.stop();
  };

  return (
    <div className="app-container">
      {/* Top Header bar */}
      <header className="app-header glass-panel">
        <div className="brand-section">
          <CloudRain className="brand-icon" size={36} />
          <div>
            <h1 className="app-title">{t('title')}</h1>
            <p className="app-subtitle">{t('subtitle')}</p>
          </div>
        </div>

        <div className="settings-bar">
          {/* Language selector toggle */}
          <select
            className="form-select"
            style={{ width: '150px', height: '38px', padding: '0 0.5rem' }}
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            title={t('langSelect')}
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>{l.label}</option>
            ))}
          </select>

          {/* Font scale accessibility toggle */}
          <button
            className="btn btn-outline"
            style={{ padding: '0.5rem', height: '38px' }}
            onClick={cycleFontSize}
            title="Adjust Font Size (A+, A-)"
          >
            <Type size={18} style={{ marginRight: '0.25rem' }} />
            {fontSizeLevel === 'normal' ? 'A' : fontSizeLevel === 'large' ? 'A+' : 'A++'}
          </button>

          {/* Global Mute Speech button */}
          <button
            className="btn btn-outline"
            style={{ padding: '0.5rem', height: '38px' }}
            onClick={handleStopSpeech}
            title="Stop Speech Playback"
          >
            <VolumeX size={18} />
          </button>

          {/* Config key trigger button */}
          <button
            className={`btn ${hasKey ? 'btn-primary' : 'btn-outline'}`}
            style={{ padding: '0.5rem 1rem', height: '38px' }}
            onClick={() => setShowKeyPanel(!showKeyPanel)}
          >
            <Key size={16} />
            {hasKey ? 'AI Active' : 'Setup AI'}
          </button>
        </div>
      </header>

      {/* Expanded API key manager drawer */}
      {showKeyPanel && (
        <div className="glass-panel" style={{ marginBottom: '1.5rem', border: '1px solid var(--primary-color)', animation: 'slideIn 0.3s ease' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Key size={18} color="var(--primary-color)" />
            {t('enterApiKey')}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            {t('apiKeyHelp')}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <input
              type="password"
              className="form-input"
              style={{ flex: 1, minWidth: '250px' }}
              placeholder={t('apiKeyPlaceholder')}
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <button className="btn btn-primary" onClick={handleSaveKey}>{t('save')}</button>
            {hasKey && <button className="btn btn-danger" onClick={handleClearKey}>Clear Key</button>}
          </div>
        </div>
      )}

      {/* Core Application Grid */}
      {weatherLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '300px', gap: '1rem' }}>
          <CloudRain size={48} className="alert-pulse" color="var(--primary-color)" />
          <p style={{ color: 'var(--text-secondary)' }}>Gathering local monsoon reports...</p>
        </div>
      ) : (
        <div className="dashboard-grid">
          
          {/* Left Pinned Pane: Weather Alerts Dashboard */}
          <aside>
            <WeatherAlerts
              weatherData={weatherData}
              onSearchCity={handleSearchCity}
              t={t}
              lang={lang}
            />
          </aside>

          {/* Right Fluid Tabbed Pane: Safety Services & GenAI Actions */}
          <main>
            {/* View Switching Tab navigation bar */}
            <nav className="nav-tabs">
              <button
                className={`nav-tab ${activeTab === 'planner' ? 'active' : ''}`}
                onClick={() => { setActiveTab('planner'); handleStopSpeech(); }}
              >
                {t('navPlanner')}
              </button>
              <button
                className={`nav-tab ${activeTab === 'checklist' ? 'active' : ''}`}
                onClick={() => { setActiveTab('checklist'); handleStopSpeech(); }}
              >
                {t('navChecklist')}
              </button>
              <button
                className={`nav-tab ${activeTab === 'travel' ? 'active' : ''}`}
                onClick={() => { setActiveTab('travel'); handleStopSpeech(); }}
              >
                {t('navTravel')}
              </button>
              <button
                className={`nav-tab ${activeTab === 'community' ? 'active' : ''}`}
                onClick={() => { setActiveTab('community'); handleStopSpeech(); }}
              >
                {t('navCommunity')}
              </button>
              <button
                className={`nav-tab ${activeTab === 'safety' ? 'active' : ''}`}
                onClick={() => { setActiveTab('safety'); handleStopSpeech(); }}
              >
                {t('navSafety')}
              </button>
            </nav>

            {/* Render selected view component */}
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              {activeTab === 'planner' && (
                <AIPlanner weatherData={weatherData} t={t} lang={lang} />
              )}
              {activeTab === 'checklist' && (
                <EmergencyKit t={t} lang={lang} />
              )}
              {activeTab === 'travel' && (
                <TravelAdvisory weatherData={weatherData} t={t} lang={lang} />
              )}
              {activeTab === 'community' && (
                <CommunityHub weatherData={weatherData} t={t} lang={lang} />
              )}
              {activeTab === 'safety' && (
                <HelpCenter weatherData={weatherData} t={t} lang={lang} />
              )}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}

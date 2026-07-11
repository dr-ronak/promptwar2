import React, { useState } from 'react';
import { Search, Thermometer, CloudRain, Wind, Droplets, AlertTriangle, Volume2, MapPin, ShieldAlert } from 'lucide-react';
import { speechService } from '../utils/speech';

export default function WeatherAlerts({ weatherData, onSearchCity, t, lang }) {
  const [searchInput, setSearchInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      onSearchCity(searchInput.trim());
    }
  };

  const handleSpeakAlerts = () => {
    if (!weatherData.alerts || weatherData.alerts.length === 0) {
      speechService.speak(t('noAlerts'), lang);
      return;
    }

    const textToRead = weatherData.alerts
      .map(alertKey => {
        if (alertKey === 'HEAVY_RAIN') return t('heavyRainAlert');
        if (alertKey === 'LIGHTNING') return t('lightningAlert');
        if (alertKey === 'HIGH_WIND') return t('windAlert');
        if (alertKey === 'WATERLOGGING') return t('waterloggingAlert');
        return '';
      })
      .join('. ');

    speechService.speak(textToRead, lang);
  };

  // Get color class for the flood risk index meter
  const getRiskMeterColor = (score) => {
    if (score > 6) return '#f43f5e'; // red
    if (score > 3) return '#f59e0b'; // orange
    return '#10b981'; // green
  };

  const floodRiskColor = getRiskMeterColor(weatherData.floodRiskIndex);

  return (
    <div className="glass-panel" style={{ height: 'fit-content' }}>
      <h2 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ShieldAlert size={24} color="#38bdf8" />
        {t('weatherTitle')}
      </h2>

      {/* City search form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748b' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.25rem' }}
            placeholder={t('searchCity')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-primary">{t('save')}</button>
      </form>

      {/* Active City Information */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
        <MapPin size={18} color="#38bdf8" />
        <span style={{ fontWeight: 600 }}>
          {weatherData.city}, {weatherData.state}
        </span>
        <span style={{ fontSize: '0.8rem', color: '#64748b', marginLeft: 'auto' }}>
          {weatherData.isSimulated ? '(Simulated)' : ''}
        </span>
      </div>

      {/* Weather Metrics */}
      <div className="weather-metrics-container">
        <div className="metric-card">
          <div className="metric-card-icon"><Thermometer size={20} /></div>
          <div>
            <div className="metric-value">{weatherData.temp}°C</div>
            <div className="metric-label">{t('temp')}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-icon"><CloudRain size={20} /></div>
          <div>
            <div className="metric-value">{weatherData.rain} mm/h</div>
            <div className="metric-label">{t('rain')}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-icon"><Wind size={20} /></div>
          <div>
            <div className="metric-value">{weatherData.wind} km/h</div>
            <div className="metric-label">{t('wind')}</div>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-card-icon"><Droplets size={20} /></div>
          <div>
            <div className="metric-value">{weatherData.humidity}%</div>
            <div className="metric-label">{t('humidity')}</div>
          </div>
        </div>
      </div>

      {/* Risk index meter */}
      <div className="risk-meter-container">
        <div className="risk-header">
          <span style={{ fontWeight: 500 }}>{t('floodRisk')}</span>
          <span style={{ fontWeight: 700, color: floodRiskColor }}>{weatherData.floodRiskIndex} / 10</span>
        </div>
        <div className="risk-bar-outer">
          <div
            className="risk-bar-inner"
            style={{
              width: `${weatherData.floodRiskIndex * 10}%`,
              backgroundColor: floodRiskColor,
              boxShadow: `0 0 10px ${floodRiskColor}`
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '1.5rem', color: '#94a3b8' }}>
        <span>{t('waterloggingRisk')}: <strong style={{ color: weatherData.waterloggingRisk === 'High' ? '#f43f5e' : weatherData.waterloggingRisk === 'Medium' ? '#f59e0b' : '#10b981' }}>{weatherData.waterloggingRisk}</strong></span>
        <span>Lightning Prob: <strong>{weatherData.lightningProbability}%</strong></span>
      </div>

      {/* Active Alerts Banners */}
      <div style={{ marginBottom: '1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>{t('activeAlerts')}</h3>
          <button className="btn btn-outline" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={handleSpeakAlerts}>
            <Volume2 size={14} style={{ marginRight: '0.25rem' }} />
            {t('ttsControl')}
          </button>
        </div>

        {weatherData.alerts.length === 0 ? (
          <div style={{ padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '0.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.875rem' }}>
            {t('noAlerts')}
          </div>
        ) : (
          weatherData.alerts.map((alertKey) => (
            <div key={alertKey} className={`alert-banner ${alertKey}`}>
              <AlertTriangle size={20} className="alert-pulse" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                  {alertKey.replace('_', ' ')} ALERT
                </strong>
                <span>
                  {alertKey === 'HEAVY_RAIN' && t('heavyRainAlert')}
                  {alertKey === 'LIGHTNING' && t('lightningAlert')}
                  {alertKey === 'HIGH_WIND' && t('windAlert')}
                  {alertKey === 'WATERLOGGING' && t('waterloggingAlert')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Waterlogging Hotspots list */}
      <div>
        <h3 style={{ fontSize: '0.9rem', color: '#94a3b8', marginBottom: '0.5rem' }}>{t('waterloggingHotspots')}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap' }}>
          {weatherData.hotspots.map((spot, i) => (
            <span key={i} className="hotspot-chip">
              <span className="hotspot-chip-icon">⚠️ {spot}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

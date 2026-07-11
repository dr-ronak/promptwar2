import React, { useState, useEffect } from 'react';
import { Users, AlertCircle, MessageSquarePlus, ThumbsUp, CheckCircle, MapPin } from 'lucide-react';

const STATIC_REPORTS_BY_CITY = {
  'Mumbai': [
    { id: 'm1', type: 'waterlogging', landmark: 'Hindmata Junction Near Cinema', upvotes: 18, resolved: false, time: '20 mins ago' },
    { id: 'm2', type: 'fallenTree', landmark: 'Linking Road, opposite KFC Bandra', upvotes: 9, resolved: false, time: '1 hour ago' },
    { id: 'm3', type: 'powerLine', landmark: 'Dharavi Sector 3 main lane', upvotes: 32, resolved: false, time: '5 mins ago' }
  ],
  'Delhi': [
    { id: 'd1', type: 'waterlogging', landmark: 'Minto Bridge Underpass', upvotes: 24, resolved: false, time: '15 mins ago' },
    { id: 'd2', type: 'cloggedDrain', landmark: 'Connaught Place Outer Circle Block G', upvotes: 7, resolved: false, time: '40 mins ago' }
  ],
  'Guwahati': [
    { id: 'g1', type: 'waterlogging', landmark: 'Rukminigaon G.S. Road (Near Mall)', upvotes: 14, resolved: false, time: '30 mins ago' },
    { id: 'g2', type: 'fallenTree', landmark: 'Zoo Road, near state zoo gate', upvotes: 5, resolved: false, time: '2 hours ago' }
  ]
};

export default function CommunityHub({ weatherData, t, lang }) {
  const [reports, setReports] = useState([]);
  const [landmark, setLandmark] = useState('');
  const [hazardType, setHazardType] = useState('waterlogging');

  useEffect(() => {
    // Merge city specific mock reports with custom reports stored in local session
    const key = weatherData.city;
    const staticReports = STATIC_REPORTS_BY_CITY[key] || [
      { id: 'def1', type: 'waterlogging', landmark: 'Low-lying market street junction', upvotes: 3, resolved: false, time: '45 mins ago' }
    ];
    
    // Check if there are user created reports saved in session for this city
    const saved = localStorage.getItem(`custom_reports_${key}`);
    const customList = saved ? JSON.parse(saved) : [];
    
    setReports([...customList, ...staticReports]);
  }, [weatherData.city]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!landmark.trim()) return;

    const newReport = {
      id: `custom_${Date.now()}`,
      type: hazardType,
      landmark: landmark.trim(),
      upvotes: 1,
      resolved: false,
      time: 'Just now',
      isCustom: true
    };

    const key = weatherData.city;
    const saved = localStorage.getItem(`custom_reports_${key}`);
    const customList = saved ? JSON.parse(saved) : [];
    const updatedCustom = [newReport, ...customList];
    
    localStorage.setItem(`custom_reports_${key}`, JSON.stringify(updatedCustom));
    
    // Merge with static reports for UI refresh
    const staticReports = STATIC_REPORTS_BY_CITY[key] || [
      { id: 'def1', type: 'waterlogging', landmark: 'Low-lying market street junction', upvotes: 3, resolved: false, time: '45 mins ago' }
    ];
    setReports([...updatedCustom, ...staticReports]);
    setLandmark('');
  };

  const handleUpvote = (id) => {
    setReports(prev => prev.map(report => {
      if (report.id === id) {
        return { ...report, upvotes: report.upvotes + 1, hasUpvoted: true };
      }
      return report;
    }));
  };

  const handleResolve = (id) => {
    setReports(prev => prev.map(report => {
      if (report.id === id) {
        return { ...report, resolved: true };
      }
      return report;
    }));
  };

  const getBadgeClass = (type) => {
    if (type === 'cloggedDrain') return 'badge-warning';
    if (type === 'waterlogging') return 'badge-danger';
    if (type === 'fallenTree') return 'badge-info';
    if (type === 'powerLine') return 'badge-purple';
    return 'badge-outline';
  };

  const getHazardLabel = (type) => {
    const labels = {
      cloggedDrain: t('cloggedDrain'),
      waterlogging: t('waterlogging'),
      fallenTree: t('fallenTree'),
      powerLine: t('powerLine'),
      other: t('other')
    };
    return labels[type] || type;
  };

  return (
    <div className="dashboard-grid">
      {/* Left Pane: Report Hazard form */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <MessageSquarePlus size={24} color="#38bdf8" />
          {t('reportHazard')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          Help emergency services and fellow citizens bypass dangerous roads.
        </p>

        <form onSubmit={handleSubmit}>
          {/* Hazard Type Selector */}
          <div className="form-group">
            <label className="form-label">{t('hazardType')}</label>
            <select
              className="form-select"
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value)}
            >
              <option value="waterlogging">{t('waterlogging')}</option>
              <option value="cloggedDrain">{t('cloggedDrain')}</option>
              <option value="fallenTree">{t('fallenTree')}</option>
              <option value="powerLine">{t('powerLine')}</option>
              <option value="other">{t('other')}</option>
            </select>
          </div>

          {/* Landmark Input */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">{t('landmark')}</label>
            <div style={{ position: 'relative' }}>
              <MapPin size={18} style={{ position: 'absolute', left: '10px', top: '12px', color: '#64748b' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.25rem' }}
                required
                placeholder="e.g. Near Metro Pillar 142 / Opp Police Station"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-danger" style={{ width: '100%', padding: '0.75rem' }}>
            <AlertCircle size={18} />
            {t('submitReport')}
          </button>
        </form>
      </div>

      {/* Right Pane: Active local hazard bulletins list */}
      <div className="glass-panel">
        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={24} color="var(--primary-color)" />
          {t('activeReports')} ({weatherData.city})
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
          {t('communityDesc')}
        </p>

        <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '0.25rem' }}>
          {reports.length === 0 ? (
            <div style={{ padding: '2rem', border: '1px dashed var(--border-color)', borderRadius: '0.75rem', textAlign: 'center', color: '#64748b' }}>
              {t('noReports')}
            </div>
          ) : (
            reports.map((report) => (
              <div
                key={report.id}
                className="report-card"
                style={{
                  opacity: report.resolved ? 0.5 : 1,
                  borderLeft: report.resolved ? '4px solid var(--success-color)' : `4px solid ${report.type === 'powerLine' ? '#a855f7' : report.type === 'waterlogging' ? '#f43f5e' : '#f59e0b'}`
                }}
              >
                <div className="report-card-header">
                  <div>
                    <span className={`badge ${getBadgeClass(report.type)}`} style={{ marginRight: '0.5rem' }}>
                      {getHazardLabel(report.type)}
                    </span>
                    {report.resolved && (
                      <span className="badge badge-info" style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', border: '1px solid #10b981' }}>
                        RESOLVED
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{report.time}</span>
                </div>

                <p style={{ fontSize: '0.9rem', fontWeight: 600, margin: '0.5rem 0', color: '#f1f5f9' }}>
                  {report.landmark}
                </p>

                <div className="report-card-footer">
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.75rem' }}>
                    👍 {report.upvotes} citizens verified
                  </span>

                  {!report.resolved && (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', height: 'auto' }}
                        disabled={report.hasUpvoted}
                        onClick={() => handleUpvote(report.id)}
                      >
                        <ThumbsUp size={12} style={{ marginRight: '0.25rem' }} />
                        {t('upvote')}
                      </button>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem', height: 'auto', color: 'var(--success-color)' }}
                        onClick={() => handleResolve(report.id)}
                      >
                        <CheckCircle size={12} style={{ marginRight: '0.25rem' }} />
                        {t('resolved')}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

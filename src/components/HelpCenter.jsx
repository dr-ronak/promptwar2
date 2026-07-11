import React, { useState, useEffect } from 'react';
import { HelpCircle, PhoneCall, Send, HelpCircle as BotIcon, Volume2, Square } from 'lucide-react';
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
        <ul key={`ul-${key}`} style={{ marginBottom: '0.75rem', marginLeft: '1.25rem' }}>
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
      elements.push(<h3 key={index} style={{ fontSize: '1rem', color: 'var(--primary-color)', marginTop: '0.75rem', marginBottom: '0.25rem' }}>{parseInlineFormatting(trimmed.substring(4))}</h3>);
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      inList = true;
      listItems.push(<li key={`li-${index}`} style={{ marginBottom: '0.25rem', color: '#f1f5f9', fontSize: '0.85rem' }}>{parseInlineFormatting(trimmed.substring(2))}</li>);
    } else if (trimmed.match(/^\d+\.\s/)) {
      flushList(index);
      const dotIndex = trimmed.indexOf('.');
      elements.push(<p key={index} style={{ marginBottom: '0.35rem', fontSize: '0.85rem', color: '#cbd5e1', paddingLeft: '0.25rem' }}><strong>{trimmed.substring(0, dotIndex + 1)}</strong> {parseInlineFormatting(trimmed.substring(dotIndex + 1).trim())}</p>);
    } else if (trimmed === '') {
      flushList(index);
    } else {
      flushList(index);
      elements.push(<p key={index} style={{ marginBottom: '0.5rem', fontSize: '0.85rem', color: '#e2e8f0' }}>{parseInlineFormatting(trimmed)}</p>);
    }
  });

  flushList('final');
  return <div className="markdown-body">{elements}</div>;
}

export default function HelpCenter({ weatherData, t, lang }) {
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [activeSpeechId, setActiveSpeechId] = useState(null);

  // Initialize bot greeting based on active language
  useEffect(() => {
    const greetings = {
      en: 'Hello! I am your AI safety assistant. Ask me questions about first aid, electrical shocks, water safety, or mosquito disease control during the monsoon.',
      hi: 'नमस्ते! मैं आपका एआई सुरक्षा सहायक हूं। मुझसे मानसून के दौरान प्राथमिक चिकित्सा, बिजली के झटके, जल सुरक्षा, या मच्छर जनित बीमारियों से बचाव के बारे में प्रश्न पूछें।',
      bn: 'হ্যালো! আমি আপনার এআই নিরাপত্তা সহকারী। বর্ষাকালে প্রাথমিক চিকিৎসা, বৈদ্যুतिक শক, জলের নিরাপত্তা বা মশা বাহিত রোগ প্রতিরোধ সম্পর্কে প্রশ্ন জিজ্ঞাসা করুন।',
      mr: 'नमस्कार! मी आपला AI सुरक्षा सहाय्यक आहे. पावसाळ्यातील प्रथमोपचार, विजेचा धक्का, पाण्याचे धोके किंवा डासांच्या आजारांबद्दल प्रश्न विचारा.',
      ta: 'வணக்கம்! நான் உங்கள் AI பாதுகாப்பு உதவியாளர். பருவமழையின் போது முதலுதவி, மின்சார அதிர்ச்சி, நீர் பாதுகாப்பு அல்லது கொசுக்களால் பரவும் நோய்கள் பற்றி கேளுங்கள்.',
      te: 'నమస్తే! నేను మీ AI రక్షణ సహాయకుడిని. వర్షాకాలంలో ప్రథమ చికిత్స, కరెంట్ షాక్, నీటి భద్రత లేదా దోమల నివారణ గురించి నన్ను అడగండి.',
      gu: 'નમસ્તે! હું તમારો AI સુરક્ષા સહાયક છું. ચોમાસા દરમિયાન પ્રાથમિક સારવાર, વીજળીના ઝાટકા, પાણીની સુરક્ષા અથવા મચ્છરોના રોગો વિશે પૂછો.'
    };
    
    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: greetings[lang] || greetings.en
      }
    ]);
    speechService.stop();
    setIsReading(false);
    setActiveSpeechId(null);
  }, [lang]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || loading) return;

    const userText = chatInput.trim();
    const userMsg = { id: `u_${Date.now()}`, sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setLoading(true);

    try {
      const botReply = await aiService.askSafetyQuestion({
        question: userText,
        weatherData,
        langCode: lang
      });
      const botMsg = { id: `b_${Date.now()}`, sender: 'bot', text: botReply };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Safety Chat failed:', error);
      const errMsg = { id: `err_${Date.now()}`, sender: 'bot', text: 'I encountered an error trying to connect to the safety base. Please call the helpline numbers below for critical emergencies.' };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleTTS = (msgId, text) => {
    if (isReading && activeSpeechId === msgId) {
      speechService.stop();
      setIsReading(false);
      setActiveSpeechId(null);
    } else {
      setIsReading(true);
      setActiveSpeechId(msgId);
      speechService.speak(
        text,
        lang,
        () => {
          setIsReading(true);
          setActiveSpeechId(msgId);
        },
        () => {
          setIsReading(false);
          setActiveSpeechId(null);
        },
        () => {
          setIsReading(false);
          setActiveSpeechId(null);
        }
      );
    }
  };

  const contactList = [
    { label: t('ndrf'), number: '1078' },
    { label: t('police'), number: '112' },
    { label: t('ambulance'), number: '108' },
    { label: t('fire'), number: '101' },
    { label: t('stateHelpline'), number: '1070' }
  ];

  return (
    <div className="dashboard-grid">
      {/* Left Column: AI Chatbot */}
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <h2 style={{ marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BotIcon size={24} color="#38bdf8" />
          {t('emergencyBotTitle')}
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          {t('emergencyBotDesc')}
        </p>

        {/* Chat Window */}
        <div className="chat-window" style={{ flex: 1 }}>
          <div className="chat-history">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-message ${msg.sender}`}
                style={{ position: 'relative' }}
              >
                {msg.sender === 'bot' ? (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', borderBottom: '1px solid rgba(255,255,255,0.03)', paddingBottom: '0.25rem' }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 600 }}>MONSOONSAFE AI</span>
                      <button
                        className="btn btn-outline"
                        style={{ padding: '0.1rem 0.25rem', fontSize: '0.65rem', height: 'auto' }}
                        onClick={() => handleTTS(msg.id, msg.text)}
                      >
                        {isReading && activeSpeechId === msg.id ? (
                          <Square size={10} style={{ marginRight: '0.15rem' }} />
                        ) : (
                          <Volume2 size={10} style={{ marginRight: '0.15rem' }} />
                        )}
                        Speak
                      </button>
                    </div>
                    {renderMarkdown(msg.text)}
                  </>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {loading && (
              <div className="chat-message bot alert-pulse" style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {t('botAnswering')}
              </div>
            )}
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-bar">
            <input
              type="text"
              className="form-input"
              style={{ flex: 1, height: '40px' }}
              placeholder={t('askBotPlaceholder')}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem', height: '40px' }} disabled={loading}>
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: Helpline Numbers */}
      <div className="glass-panel" style={{ height: 'fit-content' }}>
        <h2 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <PhoneCall size={24} color="var(--danger-color)" />
          {t('emergencyNumbers')}
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {contactList.map((contact, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-color)',
                borderRadius: '0.5rem'
              }}
            >
              <div>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{contact.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Emergency Line</div>
              </div>
              <a
                href={`tel:${contact.number}`}
                className="btn btn-danger"
                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', display: 'inline-flex', gap: '0.25rem' }}
              >
                <PhoneCall size={14} />
                {contact.number}
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

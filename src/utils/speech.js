// Utility to handle Text-to-Speech using Web Speech API

let currentUtterance = null;

// Map language codes to approximate SpeechSynthesis BCP-47 tags
const langVoiceMap = {
  en: ['en-IN', 'en-US', 'en-GB'],
  hi: ['hi-IN', 'hi'],
  bn: ['bn-IN', 'bn-BD', 'bn'],
  mr: ['mr-IN', 'mr'],
  ta: ['ta-IN', 'ta'],
  te: ['te-IN', 'te'],
  gu: ['gu-IN', 'gu']
};

export const speechService = {
  isSupported() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  },

  stop() {
    if (this.isSupported()) {
      window.speechSynthesis.cancel();
    }
  },

  speak(text, langCode = 'en', onStart = null, onEnd = null, onError = null) {
    if (!this.isSupported()) {
      if (onError) onError('Speech synthesis not supported');
      return;
    }

    // Cancel current reading
    this.stop();

    if (!text) return;

    // Remove markdown symbols for cleaner voice speech
    const cleanText = text
      .replace(/[*#_`~]/g, '')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // remove markdown links
      .replace(/-\s+/g, ' ')
      .trim();

    try {
      const utterance = new SpeechSynthesisUtterance(cleanText);
      currentUtterance = utterance;

      // Find best available voice for language
      const voices = window.speechSynthesis.getVoices();
      const preferredCodes = langVoiceMap[langCode] || [langCode];

      let voice = null;
      for (const pref of preferredCodes) {
        voice = voices.find(v => v.lang.toLowerCase() === pref.toLowerCase() || v.lang.toLowerCase().startsWith(pref.toLowerCase()));
        if (voice) break;
      }

      if (voice) {
        utterance.voice = voice;
      }
      
      utterance.lang = preferredCodes[0];
      utterance.rate = 0.95; // slightly slower for better clarity in alerts
      utterance.pitch = 1.0;

      if (onStart) utterance.onstart = onStart;
      
      utterance.onend = () => {
        if (currentUtterance === utterance) {
          currentUtterance = null;
        }
        if (onEnd) onEnd();
      };

      utterance.onerror = (e) => {
        if (currentUtterance === utterance) {
          currentUtterance = null;
        }
        if (onError) onError(e);
      };

      window.speechSynthesis.speak(utterance);
    } catch (error) {
      console.error('Speech synthesis failed:', error);
      if (onError) onError(error);
    }
  }
};

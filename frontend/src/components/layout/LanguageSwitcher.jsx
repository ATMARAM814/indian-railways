import React, { useState, useEffect } from 'react';
import { Globe } from 'lucide-react';

const LanguageSwitcher = ({ theme = 'light' }) => {
  const [lang, setLang] = useState('en');

  useEffect(() => {
    // Sync state with google translate cookie if present
    const checkLangInterval = setInterval(() => {
      const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
      if (match && match[1]) {
        setLang(match[1]);
      }
    }, 1000);
    return () => clearInterval(checkLangInterval);
  }, []);

  const changeLanguage = (langCode) => {
    setLang(langCode);
    const selectEl = document.querySelector('.goog-te-combo');
    if (selectEl) {
      selectEl.value = langCode;
      selectEl.dispatchEvent(new Event('change'));
    } else {
      // Direct cookie injection fallback
      document.cookie = `googtrans=/en/${langCode}; path=/; domain=${window.location.hostname}`;
      document.cookie = `googtrans=/en/${langCode}; path=/;`;
      window.location.reload();
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="lang-switcher-container" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <Globe size={15} style={{ color: isDark ? '#93C5FD' : '#64748B' }} />
      <select 
        value={lang} 
        onChange={(e) => changeLanguage(e.target.value)}
        className="lang-switcher-select"
        style={{
          border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid #D7E3EF',
          borderRadius: '6px',
          padding: '4px 8px',
          fontSize: '12.5px',
          fontWeight: 600,
          color: isDark ? '#FFFFFF' : '#0B2341',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF',
          cursor: 'pointer',
          outline: 'none',
          colorScheme: isDark ? 'dark' : 'light'
        }}
      >
        <option value="en" style={{ color: '#000000' }}>English</option>
        <option value="hi" style={{ color: '#000000' }}>हिन्दी (Hindi)</option>
      </select>
    </div>
  );
};

export default LanguageSwitcher;

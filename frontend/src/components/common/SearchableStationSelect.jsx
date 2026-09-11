import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

/**
 * SearchableStationSelect
 * 
 * Dropdown with an integrated real-time search bar that filters stations immediately as the user types.
 * Supports single-character instant prefix matching (e.g. typing "N" shows only stations starting with N),
 * multi-character search, keyboard navigation, clear button, and "All Stations" option.
 */
const SearchableStationSelect = ({
  stations = [],
  value = '',
  onChange,
  placeholder = 'Select Station',
  allowAll = false,
  allLabel = 'All Stations',
  name = 'stationId',
  id = 'stationId',
  disabled = false,
  required = false,
  style = {},
  className = '',
  backgroundColor = '#F8FAFC',
  borderColor = '#D7E3EF'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const containerRef = useRef(null);
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Normalize station data
  const normalizedStations = useMemo(() => {
    if (!Array.isArray(stations)) return [];
    return stations.map(st => ({
      id: String(st.id ?? ''),
      name: String(st.station_name || st.name || ''),
      code: String(st.station_code || st.code || ''),
      raw: st
    }));
  }, [stations]);

  // Selected station object
  const selectedStation = useMemo(() => {
    if (!value && value !== 0) return null;
    return normalizedStations.find(s => String(s.id) === String(value)) || null;
  }, [value, normalizedStations]);

  // Real-time instant filtering
  const filteredStations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return normalizedStations;

    // Single-character search: strictly match stations starting with that character
    if (term.length === 1) {
      return normalizedStations.filter(st => {
        const code = st.code.toLowerCase();
        const name = st.name.toLowerCase();
        if (code.startsWith(term)) return true;
        if (name.startsWith(term)) return true;
        const words = name.split(/\s+/);
        return words.some(w => w.startsWith(term));
      });
    }

    // Multi-character search: prioritize startsWith, then includes
    const startsWithCode = [];
    const startsWithName = [];
    const startsWithWord = [];
    const containsCode = [];
    const containsName = [];

    normalizedStations.forEach(st => {
      const code = st.code.toLowerCase();
      const name = st.name.toLowerCase();

      if (code.startsWith(term)) {
        startsWithCode.push(st);
      } else if (name.startsWith(term)) {
        startsWithName.push(st);
      } else if (name.split(/\s+/).some(w => w.startsWith(term))) {
        startsWithWord.push(st);
      } else if (code.includes(term)) {
        containsCode.push(st);
      } else if (name.includes(term)) {
        containsName.push(st);
      }
    });

    return [
      ...startsWithCode,
      ...startsWithName,
      ...startsWithWord,
      ...containsCode,
      ...containsName
    ];
  }, [normalizedStations, searchTerm]);

  // Total selectable items count including "All Stations" if applicable
  const showAllOption = allowAll && (!searchTerm || allLabel.toLowerCase().includes(searchTerm.toLowerCase()));
  const totalOptionsCount = (showAllOption ? 1 : 0) + filteredStations.length;

  // Auto-focus search input whenever dropdown opens
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(-1);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 30);
    } else {
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const highlightedEl = listRef.current.querySelector(`[data-index="${highlightedIndex}"]`);
      if (highlightedEl) {
        highlightedEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const triggerChange = (newVal) => {
    if (disabled) return;
    if (onChange) {
      const syntheticEvent = {
        target: { name: name || id || 'stationId', value: newVal, id },
        currentTarget: { name: name || id || 'stationId', value: newVal, id }
      };
      // Pass both synthetic event and direct value to accommodate all handler styles
      onChange(syntheticEvent, newVal);
    }
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleSelectStation = (stId) => {
    triggerChange(stId);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    triggerChange('');
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev < totalOptionsCount - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => (prev > 0 ? prev - 1 : totalOptionsCount - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        if (showAllOption && highlightedIndex === 0) {
          handleSelectStation('');
        } else {
          const stationIdx = showAllOption ? highlightedIndex - 1 : highlightedIndex;
          if (filteredStations[stationIdx]) {
            handleSelectStation(filteredStations[stationIdx].id);
          }
        }
      } else if (filteredStations.length === 1) {
        handleSelectStation(filteredStations[0].id);
      }
    }
  };

  // Helper to highlight matching text
  const renderHighlighted = (text, term) => {
    if (!term || !text) return text;
    const cleanTerm = term.trim().toLowerCase();
    if (!cleanTerm) return text;

    const lower = text.toLowerCase();
    const idx = lower.indexOf(cleanTerm);
    if (idx === -1) return text;

    return (
      <>
        {text.substring(0, idx)}
        <span style={{ color: '#0284C7', backgroundColor: '#E0F2FE', fontWeight: 700, borderRadius: '2px', padding: '0 1px' }}>
          {text.substring(idx, idx + cleanTerm.length)}
        </span>
        {text.substring(idx + cleanTerm.length)}
      </>
    );
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-station-select ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        userSelect: 'none',
        ...style
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden Native Input for standard forms and accessibility */}
      <input
        type="hidden"
        id={id}
        name={name}
        value={value || ''}
        required={required}
      />

      {/* Select Box Trigger */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => {
          if (!disabled) setIsOpen(prev => !prev);
        }}
        style={{
          width: '100%',
          minHeight: '41px',
          padding: '9px 12px',
          fontSize: '13.5px',
          borderRadius: '8px',
          border: isOpen ? '1px solid #0284C7' : `1px solid ${borderColor}`,
          boxShadow: isOpen ? '0 0 0 3px rgba(2, 132, 199, 0.15)' : 'none',
          backgroundColor: disabled ? '#F1F5F9' : backgroundColor,
          color: disabled ? '#94A3B8' : '#0F172A',
          cursor: disabled ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          boxSizing: 'border-box',
          transition: 'all 0.15s ease'
        }}
      >
        {/* Selected Label Display */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1 }}>
          {selectedStation ? (
            <>
              <span style={{ fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedStation.name}
              </span>
              {selectedStation.code && (
                <span
                  style={{
                    backgroundColor: '#EFF6FF',
                    color: '#1D4ED8',
                    border: '1px solid #BFDBFE',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'monospace',
                    letterSpacing: '0.5px'
                  }}
                >
                  {selectedStation.code}
                </span>
              )}
            </>
          ) : allowAll && (!value || value === '') ? (
            <span style={{ color: '#0F172A', fontWeight: 500 }}>
              {allLabel}
            </span>
          ) : (
            <span style={{ color: '#94A3B8' }}>
              {placeholder}
            </span>
          )}
        </div>

        {/* Right action icons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          {/* Clear button if station is selected */}
          {selectedStation && !disabled && (
            <button
              type="button"
              title="Clear selection"
              onClick={handleClear}
              style={{
                background: 'none',
                border: 'none',
                padding: '2px',
                cursor: 'pointer',
                color: '#94A3B8',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#EF4444'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#94A3B8'}
            >
              <X size={14} />
            </button>
          )}

          <ChevronDown
            size={16}
            style={{
              color: '#64748B',
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </div>
      </div>

      {/* Dropdown Menu Popup */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            zIndex: 1050,
            backgroundColor: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '10px',
            boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.15), 0 8px 10px -6px rgba(15, 23, 42, 0.1)',
            overflow: 'hidden',
            minWidth: '260px'
          }}
        >
          {/* Top Search Input Header */}
          <div
            style={{
              padding: '8px 10px',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              position: 'relative'
            }}
          >
            <Search size={15} style={{ color: '#64748B', flexShrink: 0 }} />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search station code or name (e.g. N, BPQ)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                backgroundColor: 'transparent',
                fontSize: '13px',
                color: '#0F172A',
                padding: '2px 0'
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                title="Clear search"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94A3B8',
                  padding: '2px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Counter / Helper Text */}
          {searchTerm.trim() && (
            <div
              style={{
                padding: '4px 12px',
                backgroundColor: '#F1F5F9',
                fontSize: '11px',
                color: '#64748B',
                fontWeight: 600,
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <span>Filtering for "{searchTerm.trim()}"</span>
              <span>{filteredStations.length} station{filteredStations.length === 1 ? '' : 's'}</span>
            </div>
          )}

          {/* Station List */}
          <div
            ref={listRef}
            role="listbox"
            style={{
              maxHeight: '230px',
              overflowY: 'auto',
              padding: '4px 0'
            }}
          >
            {/* "All Stations" Option */}
            {showAllOption && (
              <div
                data-index={0}
                role="option"
                aria-selected={!value || value === ''}
                onClick={() => handleSelectStation('')}
                onMouseEnter={() => setHighlightedIndex(0)}
                style={{
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: !value || value === '' ? 600 : 400,
                  color: !value || value === '' ? '#0284C7' : '#334155',
                  backgroundColor:
                    highlightedIndex === 0
                      ? '#F1F5F9'
                      : !value || value === ''
                      ? '#F0F9FF'
                      : 'transparent',
                  transition: 'background-color 0.1s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{renderHighlighted(allLabel, searchTerm)}</span>
                </div>
                {(!value || value === '') && (
                  <Check size={14} style={{ color: '#0284C7' }} />
                )}
              </div>
            )}

            {/* Empty State */}
            {filteredStations.length === 0 && !showAllOption && (
              <div style={{ padding: '20px 16px', textAlign: 'center', color: '#64748B' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  No stations found
                </div>
                <div style={{ fontSize: '12px' }}>
                  No station matching "{searchTerm}". Try a different code or name.
                </div>
              </div>
            )}

            {/* List of Stations */}
            {filteredStations.map((st, idx) => {
              const optionIndex = (showAllOption ? 1 : 0) + idx;
              const isSelected = String(st.id) === String(value);
              const isHighlighted = highlightedIndex === optionIndex;

              return (
                <div
                  key={st.id}
                  data-index={optionIndex}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelectStation(st.id)}
                  onMouseEnter={() => setHighlightedIndex(optionIndex)}
                  style={{
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: isSelected ? '#0369A1' : '#1E293B',
                    fontWeight: isSelected ? 600 : 400,
                    backgroundColor: isHighlighted
                      ? '#F1F5F9'
                      : isSelected
                      ? '#EFF6FF'
                      : 'transparent',
                    borderLeft: isSelected ? '3px solid #0284C7' : '3px solid transparent',
                    transition: 'background-color 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span>{renderHighlighted(st.name, searchTerm)}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {st.code && (
                      <span
                        style={{
                          backgroundColor: isSelected ? '#DBEAFE' : '#F1F5F9',
                          color: isSelected ? '#1E40AF' : '#475569',
                          border: isSelected ? '1px solid #93C5FD' : '1px solid #CBD5E1',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 700,
                          fontFamily: 'monospace',
                          letterSpacing: '0.5px'
                        }}
                      >
                        {renderHighlighted(st.code, searchTerm)}
                      </span>
                    )}
                    {isSelected && <Check size={14} style={{ color: '#0284C7' }} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableStationSelect;

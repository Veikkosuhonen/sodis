import { useMemo, useState, useEffect, useRef } from 'react';
import scheduleData from './schedule.json';

const LOCATIONS = [
  { id: 'Lapinsuu', label: 'Lapinsuu', match: 'Lapinsuu' },
  { id: 'Iso Teltta', label: 'Iso teltta', match: 'Iso teltta / Big tent' },
  { id: 'Koulu', label: 'Koulu', match: 'Koulu / School' },
  { id: 'Punainen teltta', label: 'Punainen teltta', match: 'Punainen teltta / Red tent' }
];

const DAYS_MAP: { [key: string]: number } = {
  'Keskiviikko / Wednesday': 0,
  'Torstai / Thursday': 1,
  'Perjantai / Friday': 2,
  'Lauantai / Saturday': 3,
  'Sunnuntai / Sunday': 4
};

const MINUTE_HEIGHT = 1.4; 
const HOUR_HEIGHT = 60 * MINUTE_HEIGHT;
const FESTIVAL_START_MINUTES = 11 * 60; 

function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [myScreenings, setMyScreenings] = useState<string[]>([]);
  const [selectedScreening, setSelectedScreening] = useState<any>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('sodis_planner');
    if (saved) {
      try {
        setMyScreenings(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load planner state", e);
      }
    }

    const handleResize = () => setIsMobile(window.innerWidth < 768);
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setSelectedScreening(null);
      }
    };

    window.addEventListener('resize', handleResize);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleScreening = (movie: string, time: string, day: string) => {
    const id = `${day}-${time}-${movie}`;
    const newMyScreenings = myScreenings.includes(id) 
      ? myScreenings.filter(s => s !== id) 
      : [...myScreenings, id];
    
    setMyScreenings(newMyScreenings);
    localStorage.setItem('sodis_planner', JSON.stringify(newMyScreenings));
  };

  const processedScreenings = useMemo(() => {
    return scheduleData.map(s => {
      const timeParts = s.time.split(/[:.]/);
      let hours = parseInt(timeParts[0]);
      const minutes = parseInt(timeParts[1] || '0');
      if (hours < 6) hours += 24;

      const dayOffset = (DAYS_MAP[s.day] || 0) * 1440;
      const startMinutes = dayOffset + (hours * 60) + minutes;

      const durationMatch = s.details.match(/(\d)\.(\d{2})/);
      let durationMinutes = 90; 
      if (durationMatch) {
        durationMinutes = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
      }

      const id = `${s.day}-${s.time}-${s.movie}`;
      const isPlanned = myScreenings.includes(id);

      const isVisible = (s.movie.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        s.filmmaker.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return {
        ...s,
        id,
        startMinutes,
        durationMinutes,
        isPlanned,
        isVisible
      };
    });
  }, [searchQuery, myScreenings]);

  const maxEndMinutes = Math.max(...processedScreenings.map(s => s.startMinutes + s.durationMinutes));
  const totalHeight = (maxEndMinutes - FESTIVAL_START_MINUTES) * MINUTE_HEIGHT + 200;

  const timeMarkers = [];
  const startHour = 11;
  const endHour = Math.ceil(maxEndMinutes / 60);
  for (let i = startHour; i <= endHour; i++) {
    timeMarkers.push(i);
  }

  const dayTracks = useMemo(() => {
    return Object.keys(DAYS_MAP).map(dayName => {
      const dayIdx = DAYS_MAP[dayName];
      let start = dayIdx * 1440;
      if (dayIdx === 0) start = FESTIVAL_START_MINUTES;
      const nextDayStart = (dayIdx + 1) * 1440;
      const end = Math.min(nextDayStart, maxEndMinutes + 60);
      return {
        name: dayName.split(' / ')[0],
        start,
        end,
        height: (end - start) * MINUTE_HEIGHT
      };
    });
  }, [maxEndMinutes]);

  // Ultra-compact heights
  const MAIN_HEADER_HEIGHT = isMobile ? 50 : 50;
  const DAY_HEADER_HEIGHT = isMobile ? 26 : 30;
  const LOC_HEADER_HEIGHT = isMobile ? 24 : 30;

  const columnWidth = isMobile ? '85px' : '300px';
  const timeAxisWidth = isMobile ? '45px' : '75px';
  const totalColumnsWidth = LOCATIONS.length * (parseInt(columnWidth) + 1);

  return (
    <div style={{ 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
      backgroundColor: '#ffffff', 
      color: '#000000',
      minHeight: '100vh',
      width: 'max-content',
      minWidth: '100%'
    }}>
      <style>{`
        html, body { background-color: #ffffff !important; color: #000000 !important; margin: 0; padding: 0; }
        * { color: #000000; box-sizing: border-box; }
        .screening-card { transition: all 0.1s ease; cursor: pointer; }
        .screening-card:hover { z-index: 200 !important; transform: scale(1.01); box-shadow: 6px 6px 0px #000 !important; }
        ::-webkit-scrollbar { height: 10px; width: 10px; }
        ::-webkit-scrollbar-thumb { background: #000; border: 2px solid #fff; }
        ::-webkit-scrollbar-track { background: #eee; }
        a { color: inherit; text-decoration: none; }
      `}</style>
      
      {/* Main Sticky Header - sticks to viewport top-left */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        left: 0,
        backgroundColor: '#ffffff', 
        padding: '0 15px', 
        zIndex: 1000, 
        borderBottom: '3px solid #000000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: `${MAIN_HEADER_HEIGHT}px`,
        width: '100vw'
      }}>
        <h1 style={{ fontSize: isMobile ? '1.2em' : '1.5em', margin: 0, fontWeight: 900, whiteSpace: 'nowrap', color: '#000000' }}>SODANKYLÄ 2026</h1>
        
        <input
          type="text"
          placeholder={isMobile ? "Hae..." : "Hae elokuvia..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: isMobile ? '140px' : '300px',
            padding: '6px 12px',
            border: '3px solid #000000',
            fontSize: '14px',
            fontWeight: 800,
            outline: 'none',
            backgroundColor: '#ffffff',
            color: '#000000'
          }}
        />
      </header>

      <div style={{ display: 'flex', position: 'relative' }}>
        
        {/* Time Axis - sticks to left */}
        <div style={{ 
          width: timeAxisWidth, 
          flexShrink: 0, 
          position: 'sticky', 
          left: 0, 
          backgroundColor: '#ffffff', 
          zIndex: 800,
          borderRight: '3px solid #000000',
          paddingTop: `${DAY_HEADER_HEIGHT + LOC_HEADER_HEIGHT}px`
        }}>
          {timeMarkers.map(h => (
            <div key={h} style={{ 
              height: `${HOUR_HEIGHT}px`, 
              borderBottom: '1px solid #eeeeee',
              position: 'relative'
            }}>
              <span style={{ 
                position: 'absolute', 
                top: '-8px', 
                right: '5px', 
                fontSize: isMobile ? '10px' : '12px', 
                fontWeight: 900,
                color: h % 24 === 0 ? '#ff0000' : '#000000',
                whiteSpace: 'nowrap'
              }}>
                {h % 24}:00
              </span>
            </div>
          ))}
        </div>

        {/* Timeline Body */}
        <div style={{ position: 'relative', height: `${totalHeight}px`, width: `${totalColumnsWidth}px` }}>
          
          {/* Day Tracks (Sticky Day Headers inside) */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, pointerEvents: 'none', zIndex: 600 }}>
            {dayTracks.map(track => (
              <div key={track.name} style={{
                position: 'absolute',
                top: `${(track.start - FESTIVAL_START_MINUTES) * MINUTE_HEIGHT}px`,
                height: `${track.height}px`,
                width: '100%'
              }}>
                <div 
                  style={{
                    position: 'sticky',
                    top: `${MAIN_HEADER_HEIGHT}px`,
                    backgroundColor: '#ffffff',
                    padding: '0 15px',
                    fontWeight: 900,
                    fontSize: isMobile ? '12px' : '15px',
                    borderBottom: '2px solid #000000',
                    textTransform: 'uppercase',
                    letterSpacing: '3px',
                    pointerEvents: 'auto',
                    height: `${DAY_HEADER_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    color: '#000000'
                  }}
                >
                  {track.name}
                </div>
              </div>
            ))}
          </div>

          {/* Columns Container */}
          <div style={{ display: 'flex', width: '100%', height: '100%' }}>
            {LOCATIONS.map((loc) => (
              <div key={loc.id} style={{ 
                width: columnWidth, 
                borderRight: '1px solid #000000',
                position: 'relative',
                backgroundColor: '#ffffff',
                flexShrink: 0
              }}>
                {/* Sticky Location Header */}
                <div 
                  style={{ 
                    position: 'sticky', 
                    top: `${MAIN_HEADER_HEIGHT + DAY_HEADER_HEIGHT}px`, 
                    backgroundColor: '#000000', 
                    padding: '0 4px', 
                    textAlign: 'center', 
                    fontWeight: 900,
                    zIndex: 700,
                    textTransform: 'uppercase',
                    fontSize: isMobile ? '10px' : '13px',
                    height: `${LOC_HEADER_HEIGHT}px`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff'
                  }}
                >
                  <span style={{ color: '#ffffff' }}>{isMobile ? loc.label.split(' ')[0] : loc.label}</span>
                </div>

                {/* Screenings */}
                {processedScreenings.filter(s => s.location === loc.match).map((s) => (
                  <div
                    key={s.id}
                    className="screening-card"
                    onClick={() => setSelectedScreening(s)}
                    style={{
                      position: 'absolute',
                      top: `${(s.startMinutes - FESTIVAL_START_MINUTES) * MINUTE_HEIGHT}px`,
                      height: `${s.durationMinutes * MINUTE_HEIGHT}px`,
                      left: isMobile ? '2px' : '6px',
                      right: isMobile ? '2px' : '6px',
                      backgroundColor: s.isPlanned ? '#fff9db' : '#ffffff',
                      border: s.id === selectedScreening?.id ? '4px solid #000' : (s.isVisible ? (isMobile ? '2px solid #000' : '3px solid #000') : '1px solid #dddddd'),
                      padding: isMobile ? '4px' : '10px',
                      borderRadius: '0',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow: s.isVisible ? (isMobile ? '3px 3px 0px #000' : '6px 6px 0px #000') : 'none',
                      zIndex: s.id === selectedScreening?.id ? 500 : (s.isVisible ? 100 : 1),
                      opacity: s.isVisible ? 1 : 0.15,
                    }}
                  >
                    <div style={{ fontWeight: 900, fontSize: isMobile ? '10px' : '13px', color: '#ff0000', marginBottom: '2px' }}>{s.time}</div>
                    <div style={{ fontWeight: 900, fontSize: isMobile ? '11px' : '15px', lineHeight: '1.1', marginBottom: '4px' }}>
                      {s.movie}
                    </div>
                    {!isMobile && <div style={{ fontSize: '12px', fontWeight: 800 }}>{s.filmmaker}</div>}
                    {s.isPlanned && <div style={{ position: 'absolute', bottom: 4, left: 4, fontSize: '14px' }}>⭐</div>}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Selection Tooltip */}
      {selectedScreening && (
        <div 
          ref={tooltipRef}
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50vw',
            transform: 'translateX(-50%)',
            backgroundColor: '#fff',
            color: '#000',
            padding: '20px',
            zIndex: 2000,
            width: isMobile ? '92vw' : '420px',
            boxShadow: '10px 10px 0px #ff0000',
            border: '3px solid #000'
          }}
        >
          <div style={{ fontWeight: 900, fontSize: '1.5em', marginBottom: '5px' }}>{selectedScreening.movie}</div>
          {selectedScreening.filmmaker && (
            <div style={{ fontWeight: 800, fontSize: '1.1em', marginBottom: '10px', color: '#ff0000' }}>
              {selectedScreening.filmmaker}
            </div>
          )}
          <div style={{ marginBottom: '20px', fontSize: '16px', fontWeight: 600, lineHeight: '1.4', color: '#000' }}>
            <div style={{ color: '#000' }}>📅 {selectedScreening.day.split(' / ')[0]}</div>
            <div style={{ color: '#000' }}>⏰ {selectedScreening.time} ({selectedScreening.durationMinutes} min)</div>
            <div style={{ color: '#000' }}>📍 {selectedScreening.location}</div>
            <div style={{ marginTop: '8px', fontSize: '13px', opacity: 0.8, fontWeight: 500, color: '#000' }}>{selectedScreening.details}</div>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexDirection: isMobile ? 'column' : 'row' }}>
            <button
              onClick={() => {
                toggleScreening(selectedScreening.movie, selectedScreening.time, selectedScreening.day);
                setSelectedScreening(null);
              }}
              style={{
                flexGrow: 1,
                padding: '14px',
                backgroundColor: selectedScreening.isPlanned ? '#ffffff' : '#ff0000',
                color: selectedScreening.isPlanned ? '#000000' : '#ffffff',
                border: 'none',
                fontWeight: 900,
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: '14px'
              }}
            >
              {selectedScreening.isPlanned ? '❌ Poista merkintä' : '⭐ Merkitse'}
            </button>
            <a 
              href={selectedScreening.link} 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                flexGrow: 1,
                padding: '14px',
                backgroundColor: '#ffffff',
                color: '#000000',
                border: 'none',
                fontWeight: 900,
                cursor: 'pointer',
                textDecoration: 'none',
                textAlign: 'center',
                textTransform: 'uppercase',
                fontSize: '14px'
              }}
            >
              🌐 INFO
            </a>
            <button
              onClick={() => setSelectedScreening(null)}
              style={{
                padding: '14px',
                backgroundColor: '#333333',
                color: '#ffffff',
                border: 'none',
                fontWeight: 900,
                cursor: 'pointer',
                textTransform: 'uppercase',
                fontSize: '14px'
              }}
            >
              SULJE
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

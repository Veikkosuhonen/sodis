import { useState, useMemo } from 'react';
import scheduleData from './schedule.json';

function App() {
  const [selectedDay, setSelectedDay] = useState<string>(scheduleData[0].day);
  const [searchQuery, setSearchQuery] = useState('');

  const days = useMemo(() => Array.from(new Set(scheduleData.map(s => s.day))), []);

  const filteredScreenings = useMemo(() => {
    return scheduleData.filter(s => {
      const matchesDay = s.day === selectedDay;
      const matchesSearch = s.movie.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            s.filmmaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            s.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDay && matchesSearch;
    });
  }, [selectedDay, searchQuery]);

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px', textAlign: 'center' }}>
        <h1>Midnight Sun Film Festival 2026</h1>
        <p>Movie Screening Schedule</p>
      </header>

      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            style={{
              padding: '10px 15px',
              cursor: 'pointer',
              backgroundColor: selectedDay === day ? '#007bff' : '#f8f9fa',
              color: selectedDay === day ? 'white' : 'black',
              border: '1px solid #ddd',
              borderRadius: '5px'
            }}
          >
            {day.split('/')[0].trim()}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search movies, filmmakers, or locations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            fontSize: '16px'
          }}
        />
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        {filteredScreenings.length > 0 ? (
          filteredScreenings.map((s, idx) => (
            <div key={idx} style={{ 
              border: '1px solid #eee', 
              borderRadius: '8px', 
              padding: '15px',
              backgroundColor: '#fff',
              boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                <span style={{ fontWeight: 'bold', fontSize: '1.1em', color: '#007bff' }}>{s.time}</span>
                <span style={{ backgroundColor: '#e9ecef', padding: '2px 8px', borderRadius: '4px', fontSize: '0.85em' }}>{s.location}</span>
              </div>
              <h3 style={{ margin: '0 0 5px 0' }}>
                <a href={s.link} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#333' }}>
                  {s.movie}
                </a>
              </h3>
              <p style={{ margin: '0', fontStyle: 'italic', color: '#666' }}>{s.filmmaker}</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '0.9em', color: '#888' }}>{s.details}</p>
            </div>
          ))
        ) : (
          <p style={{ textAlign: 'center', color: '#666' }}>No screenings found matching your search.</p>
        )}
      </div>
    </div>
  );
}

export default App;

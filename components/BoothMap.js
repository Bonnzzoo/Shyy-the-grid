import { useState } from 'react';

// Mock data for a sample bazaar floor plan
const DEMO_BAZAAR = {
  id: 'ramadan-bazaar-2026',
  name: 'Ramadan Night Bazaar',
  date: 'July 15-17, 2026',
  location: 'The Waterway, New Cairo',
  rows: 8,
  cols: 10,
  zones: {
    food: { label: 'Food Zone', color: '#FF6B6B', priceEGP: 5000 },
    fashion: { label: 'Fashion Zone', color: '#6C5CE7', priceEGP: 3500 },
    handmade: { label: 'Handmade Zone', color: '#00B894', priceEGP: 3000 },
    beauty: { label: 'Beauty Zone', color: '#FDCB6E', priceEGP: 4000 },
  },
  // Grid layout: each cell is either a booth object or null (empty/walkway)
  // status: 'available' | 'reserved' | 'sold'
  grid: generateDemoGrid(),
};

function generateDemoGrid() {
  const grid = [];
  const zones = ['food', 'food', 'food', 'fashion', 'fashion', 'fashion', 'handmade', 'handmade', 'beauty', 'beauty'];
  const statuses = ['available', 'available', 'available', 'available', 'sold', 'available', 'reserved'];
  const vendorNames = ['', '', '', '', 'Sweet Treats', '', 'Nora Jewelry'];

  let boothNum = 1;
  for (let row = 0; row < 8; row++) {
    const rowData = [];
    for (let col = 0; col < 10; col++) {
      // Create walkways (row 3 is a horizontal walkway, col 4 is a vertical walkway)
      if (row === 3 || col === 4) {
        rowData.push({ type: 'walkway' });
      } else {
        const zone = zones[col] || 'handmade';
        const statusIdx = (row * 10 + col) % statuses.length;
        const status = statuses[statusIdx];
        const vendor = status === 'sold' ? vendorNames[statusIdx] || 'Vendor' : 
                       status === 'reserved' ? vendorNames[statusIdx] || '' : '';
        rowData.push({
          type: 'booth',
          id: `B${String(boothNum).padStart(2, '0')}`,
          zone: zone,
          status: status,
          vendor: vendor,
        });
        boothNum++;
      }
    }
    grid.push(rowData);
  }
  return grid;
}

export default function BoothMap({ bazaar = DEMO_BAZAAR, onBoothSelect, selectedBooth, isEditor = false, onBoothEdit }) {
  const [hoveredBooth, setHoveredBooth] = useState(null);

  const getBoothClass = (cell) => {
    if (cell.type === 'walkway') return 'booth booth-walkway';
    if (selectedBooth && selectedBooth.id === cell.id) return 'booth booth-selected';
    return `booth booth-${cell.status}`;
  };

  const getZoneColor = (zone) => {
    return bazaar.zones[zone]?.color || '#666';
  };

  const getBoothPrice = (zone) => {
    return bazaar.zones[zone]?.priceEGP || 0;
  };

  const handleBoothClick = (cell, rowIdx, colIdx) => {
    if (cell.type === 'walkway') return;
    
    if (isEditor && onBoothEdit) {
      onBoothEdit(cell, rowIdx, colIdx);
      return;
    }
    
    if (cell.status === 'available' && onBoothSelect) {
      onBoothSelect(cell);
    }
  };

  return (
    <div>
      {/* Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--booth-available)' }}></div>
          Available
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--booth-reserved)' }}></div>
          Reserved (15 min hold)
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--booth-sold)' }}></div>
          Sold
        </div>
        <div className="legend-item">
          <div className="legend-dot" style={{ background: 'var(--booth-selected)' }}></div>
          Your Selection
        </div>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginLeft: 'auto' }}>
          🚶 Dashed = Walkway
        </span>
      </div>

      {/* Zone Labels */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
        {Object.entries(bazaar.zones).map(([key, zone]) => (
          <div key={key} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 12px', borderRadius: '20px',
            background: `${zone.color}15`, border: `1px solid ${zone.color}40`,
            fontSize: '0.78rem', fontWeight: 600, color: zone.color,
          }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: zone.color }}></span>
            {zone.label} — {zone.priceEGP.toLocaleString()} EGP
          </div>
        ))}
      </div>

      {/* The Interactive Grid */}
      <div className="map-container">
        {/* Entrance Label */}
        <div style={{ textAlign: 'center', marginBottom: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' }}>
          ⬆ Entrance ⬆
        </div>

        <div className="booth-grid" style={{ gridTemplateColumns: `repeat(${bazaar.cols}, 1fr)` }}>
          {bazaar.grid.map((row, rowIdx) =>
            row.map((cell, colIdx) => (
              <div
                key={`${rowIdx}-${colIdx}`}
                className={getBoothClass(cell)}
                style={cell.type === 'booth' ? { borderLeftColor: getZoneColor(cell.zone) } : {}}
                onClick={() => handleBoothClick(cell, rowIdx, colIdx)}
                onMouseEnter={() => cell.type === 'booth' && setHoveredBooth(cell)}
                onMouseLeave={() => setHoveredBooth(null)}
                title={cell.type === 'booth' ? `${cell.id} — ${bazaar.zones[cell.zone]?.label || ''} — ${cell.status}` : 'Walkway'}
              >
                {cell.type === 'walkway' ? (
                  <span style={{ opacity: 0.4 }}>···</span>
                ) : (
                  <>
                    <span className="booth-label">{cell.id}</span>
                    {cell.status === 'sold' && cell.vendor ? (
                      <span className="booth-price" style={{ opacity: 1 }}>{cell.vendor}</span>
                    ) : cell.status === 'available' ? (
                      <span className="booth-price">{getBoothPrice(cell.zone).toLocaleString()}</span>
                    ) : (
                      <span className="booth-price">held</span>
                    )}
                  </>
                )}
              </div>
            ))
          )}
        </div>

        {/* Stage / Back Wall Label */}
        <div style={{ textAlign: 'center', marginTop: '12px', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase' }}>
          ⬇ Stage / Back Wall ⬇
        </div>
      </div>

      {/* Hover Tooltip Info */}
      {hoveredBooth && hoveredBooth.status === 'available' && (
        <div style={{
          marginTop: '12px', padding: '10px 16px',
          background: 'var(--bg-card)', border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)', fontSize: '0.85rem',
          display: 'flex', gap: '16px', alignItems: 'center',
        }}>
          <span style={{ fontWeight: 700, color: getZoneColor(hoveredBooth.zone) }}>{hoveredBooth.id}</span>
          <span style={{ color: 'var(--text-secondary)' }}>{bazaar.zones[hoveredBooth.zone]?.label}</span>
          <span style={{ color: 'var(--color-success)', fontWeight: 600, marginLeft: 'auto' }}>
            {getBoothPrice(hoveredBooth.zone).toLocaleString()} EGP
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>Click to book →</span>
        </div>
      )}
    </div>
  );
}

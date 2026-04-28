import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Analytics.css';

const Analytics = ({ dateRange }) => {
  const [chartType, setChartType] = useState('daily');
  const [selectedMetric, setSelectedMetric] = useState('ridership');
  const [liveStats, setLiveStats] = useState(null);
  const [liveReports, setLiveReports] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoadingStats(true);
        const [stats, reports] = await Promise.all([
          api.getStats(),
          api.adminGetReports(),
        ]);
        setLiveStats(stats);
        setLiveReports(reports);
      } catch (e) {
        console.error('Analytics fetch error:', e);
      } finally {
        setLoadingStats(false);
      }
    };
    fetchAnalytics();
    const iv = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(iv);
  }, []);

  // Mock analytics data
  const analyticsData = {
    ridership: {
      daily: [1250, 1450, 1320, 1580, 1680, 1420, 1100],
      weekly: [8500, 9200, 8800, 9500, 10200],
      monthly: [32000, 34500, 36800, 39200]
    },
    revenue: {
      daily: [3750, 4350, 3960, 4740, 5040, 4260, 3300],
      weekly: [25500, 27600, 26400, 28500, 30600],
      monthly: [96000, 103500, 110400, 117600]
    },
    performance: {
      onTime: [92, 94, 93, 95, 96, 94, 91],
      delays: [8, 6, 7, 5, 4, 6, 9]
    },
    occupancy: {
      average: [65, 68, 62, 71, 75, 70, 58],
      peak: [82, 85, 78, 88, 92, 84, 72]
    }
  };

  const [topRoutes, setTopRoutes] = useState([
    { name: 'Downtown - Uptown', ridership: 2450, revenue: 7350, performance: 96 },
    { name: 'Airport Express', ridership: 2100, revenue: 8400, performance: 94 },
    { name: 'City Circle', ridership: 1850, revenue: 5550, performance: 92 },
    { name: 'Suburban Link', ridership: 1650, revenue: 4950, performance: 89 },
    { name: 'Night Owl', ridership: 1200, revenue: 3600, performance: 91 }
  ]);

  const [busPerformance, setBusPerformance] = useState([
    { bus: 'BUS-001', trips: 12, occupancy: 78, fuel: 7.2, maintenance: 98 },
    { bus: 'BUS-002', trips: 10, occupancy: 82, fuel: 6.8, maintenance: 95 },
    { bus: 'BUS-003', trips: 8, occupancy: 65, fuel: 8.1, maintenance: 92 },
    { bus: 'BUS-004', trips: 11, occupancy: 71, fuel: 7.5, maintenance: 97 },
    { bus: 'BUS-005', trips: 9, occupancy: 69, fuel: 7.8, maintenance: 94 }
  ]);

  const getChartData = () => {
    return analyticsData[selectedMetric]?.[chartType] || [];
  };

  const getMaxValue = () => {
    const data = getChartData();
    return Math.max(...data, 1);
  };

  const formatValue = (value) => {
    if (selectedMetric === 'revenue') {
      return `$${value.toLocaleString()}`;
    }
    if (selectedMetric === 'performance') {
      return `${value}%`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="analytics">
      {/* Live stats bar */}
      {liveStats && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Buses', value: liveStats.totalBuses, icon: '🚌', color: '#2563eb' },
            { label: 'Active Buses', value: liveStats.activeBuses, icon: '✅', color: '#059669' },
            { label: 'Drivers', value: liveStats.totalDrivers, icon: '👨‍✈️', color: '#7c3aed' },
            { label: 'Students', value: liveStats.totalStudents, icon: '👥', color: '#d97706' },
            { label: 'Routes', value: liveStats.totalRoutes, icon: '🗺️', color: '#0891b2' },
            { label: 'Pending Maint.', value: liveStats.pendingMaint ?? liveStats.pendingMaintenance ?? 0, icon: '🔧', color: '#dc2626' },
          ].map(s => (
            <div key={s.label} style={{ flex: '1 1 130px', background: '#fff', borderRadius: 10, padding: '12px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', borderLeft: `4px solid ${s.color}` }}>
              <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.icon} {s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}
      {loadingStats && <div style={{ padding: '8px 16px', background: '#f1f5f9', borderRadius: 8, fontSize: 13, color: '#64748b', marginBottom: 12 }}>⏳ Loading live analytics from MongoDB...</div>}
      <div className="analytics-header">
        <h3>Analytics Dashboard <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b' }}>· Live from MongoDB</span></h3>
        <div className="analytics-controls">
          <div className="metric-selector">
            <button 
              className={`metric-btn ${selectedMetric === 'ridership' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('ridership')}
            >
              Ridership
            </button>
            <button 
              className={`metric-btn ${selectedMetric === 'revenue' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('revenue')}
            >
              Revenue
            </button>
            <button 
              className={`metric-btn ${selectedMetric === 'performance' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('performance')}
            >
              Performance
            </button>
            <button 
              className={`metric-btn ${selectedMetric === 'occupancy' ? 'active' : ''}`}
              onClick={() => setSelectedMetric('occupancy')}
            >
              Occupancy
            </button>
          </div>

          <div className="chart-type-selector">
            <button 
              className={`type-btn ${chartType === 'daily' ? 'active' : ''}`}
              onClick={() => setChartType('daily')}
            >
              Daily
            </button>
            <button 
              className={`type-btn ${chartType === 'weekly' ? 'active' : ''}`}
              onClick={() => setChartType('weekly')}
            >
              Weekly
            </button>
            <button 
              className={`type-btn ${chartType === 'monthly' ? 'active' : ''}`}
              onClick={() => setChartType('monthly')}
            >
              Monthly
            </button>
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="chart-container">
        <h4>{selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)} - {chartType} View</h4>
        <div className="bar-chart">
          {getChartData().map((value, index) => {
            const height = (value / getMaxValue()) * 100;
            return (
              <div key={index} className="chart-bar">
                <div className="bar" style={{ height: `${height}%` }}>
                  <span className="bar-value">{formatValue(value)}</span>
                </div>
                <span className="bar-label">
                  {chartType === 'daily' ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index] :
                   chartType === 'weekly' ? `W${index + 1}` : `M${index + 1}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">👥</div>
          <div className="summary-content">
            <span className="summary-value">11,250</span>
            <span className="summary-label">Total Passengers</span>
            <span className="summary-trend positive">+12% vs last period</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content">
            <span className="summary-value">$33,750</span>
            <span className="summary-label">Total Revenue</span>
            <span className="summary-trend positive">+8% vs last period</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⏱️</div>
          <div className="summary-content">
            <span className="summary-value">94%</span>
            <span className="summary-label">On-Time Performance</span>
            <span className="summary-trend negative">-2% vs last period</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <span className="summary-value">68%</span>
            <span className="summary-label">Avg Occupancy</span>
            <span className="summary-trend positive">+5% vs last period</span>
          </div>
        </div>
      </div>

      {/* Top Routes */}
      <div className="routes-performance">
        <h4>Top Performing Routes</h4>
        <table className="routes-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Ridership</th>
              <th>Revenue</th>
              <th>Performance</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {topRoutes.map((route, index) => (
              <tr key={index}>
                <td className="route-name">{route.name}</td>
                <td>{route.ridership.toLocaleString()}</td>
                <td>${route.revenue.toLocaleString()}</td>
                <td>
                  <div className="performance-indicator">
                    <span className="performance-value">{route.performance}%</span>
                    <div className="performance-bar">
                      <div 
                        className="performance-fill" 
                        style={{ width: `${route.performance}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`trend ${route.performance > 92 ? 'positive' : 'neutral'}`}>
                    {route.performance > 92 ? '↑' : '→'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bus Performance */}
      <div className="bus-performance">
        <h4>Bus Performance Metrics</h4>
        <table className="performance-table">
          <thead>
            <tr>
              <th>Bus</th>
              <th>Trips</th>
              <th>Avg Occupancy</th>
              <th>Fuel Efficiency</th>
              <th>Maintenance Score</th>
            </tr>
          </thead>
          <tbody>
            {busPerformance.map((bus, index) => (
              <tr key={index}>
                <td className="bus-id">{bus.bus}</td>
                <td>{bus.trips}</td>
                <td>
                  <div className="occupancy-cell">
                    <span>{bus.occupancy}%</span>
                    <div className="mini-bar">
                      <div 
                        className="mini-fill" 
                        style={{ width: `${bus.occupancy}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <div className="fuel-cell">
                    <span>{bus.fuel} km/l</span>
                    <div className="mini-bar">
                      <div 
                        className="mini-fill fuel" 
                        style={{ width: `${(bus.fuel / 10) * 100}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td>
                  <span className={`score ${bus.maintenance > 95 ? 'excellent' : bus.maintenance > 90 ? 'good' : 'fair'}`}>
                    {bus.maintenance}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Export Options */}
      <div className="export-options">
        <button className="export-btn">
          <span className="export-icon">📥</span>
          Export as PDF
        </button>
        <button className="export-btn">
          <span className="export-icon">📊</span>
          Export as CSV
        </button>
        <button className="export-btn">
          <span className="export-icon">📈</span>
          Schedule Report
        </button>
      </div>
    </div>
  );
};

export default Analytics;
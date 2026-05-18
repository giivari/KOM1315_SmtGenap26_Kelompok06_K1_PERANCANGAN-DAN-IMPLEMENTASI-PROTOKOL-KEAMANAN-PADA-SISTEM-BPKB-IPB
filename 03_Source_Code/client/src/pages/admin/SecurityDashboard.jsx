import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { securityAPI } from '../../services/api';
import './SecurityDashboard.css';

// Register ChartJS components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
  Title, Tooltip, Legend, Filler
);

export default function SecurityDashboard() {
  const [summary, setSummary] = useState(null);
  const [authStats, setAuthStats] = useState(null);
  const [authzStats, setAuthzStats] = useState(null);
  const [auditLogs, setAuditLogs] = useState({ logs: [], totalPages: 1, page: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, authRes, authzRes, auditRes] = await Promise.all([
        securityAPI.getSummary(),
        securityAPI.getAuthStats(),
        securityAPI.getAuthzStats(),
        securityAPI.getAuditLogs(1, 10)
      ]);
      setSummary(sumRes.data);
      setAuthStats(authRes.data);
      setAuthzStats(authzRes.data);
      setAuditLogs(auditRes.data);
    } catch (error) {
      console.error('Failed to load security dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchLogs = async (e) => {
    e.preventDefault();
    try {
      const res = await securityAPI.getAuditLogs(1, 10, search);
      setAuditLogs(res.data);
    } catch (error) {
      console.error('Failed to search logs');
    }
  };

  const loadPage = async (page) => {
    if (page < 1 || page > auditLogs.totalPages) return;
    try {
      const res = await securityAPI.getAuditLogs(page, 10, search);
      setAuditLogs(res.data);
    } catch (error) {
      console.error('Failed to load page');
    }
  };

  if (loading || !summary) {
    return <div className="loading-container"><div className="spinner"></div><p>Loading Security Data...</p></div>;
  }

  // ===== CHART DATA CONFIGURATION =====

  // 1. Line Chart: Authentication Trends (Success vs Failed)
  const authTrendData = {
    labels: authStats.daily.map(d => d.date),
    datasets: [
      {
        label: 'Successful Logins',
        data: authStats.daily.map(d => d.LOGIN_SUCCESS || 0),
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Failed Logins',
        data: authStats.daily.map(d => d.LOGIN_FAILED || 0),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
      }
    ]
  };

  // 2. Bar Chart: Authorization Denials by Route
  const topDeniedRoutes = [...authzStats.byRoute]
    .sort((a, b) => b.denied - a.denied)
    .slice(0, 5);

  const authzDenialData = {
    labels: topDeniedRoutes.map(d => d.route),
    datasets: [
      {
        label: 'Denied Access Attempts',
        data: topDeniedRoutes.map(d => d.denied),
        backgroundColor: 'rgba(245, 158, 11, 0.8)',
        borderRadius: 4,
      }
    ]
  };

  // 3. Doughnut Chart: Auth Event Breakdown
  const eventTypes = Object.keys(authStats.totals);
  const eventColors = ['#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#64748b', '#0ea5e9'];
  const authBreakdownData = {
    labels: eventTypes,
    datasets: [
      {
        data: eventTypes.map(t => authStats.totals[t]),
        backgroundColor: eventColors.slice(0, eventTypes.length),
        borderWidth: 0,
      }
    ]
  };

  return (
    <div className="admin-page security-dashboard">
      <div className="admin-header">
        <h1>Security Dashboard (AAA)</h1>
        <p>Monitor Authentication, Authorization, and Accounting events.</p>
      </div>

      {/* SUMMARY STATS */}
      <div className="dashboard-grid mb-32">
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6'}}>👥</div>
          <div>
            <div className="stat-value">{summary.totalUsers}</div>
            <div className="stat-label">Total Users</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e'}}>🔐</div>
          <div>
            <div className="stat-value">{summary.todayAuthEvents}</div>
            <div className="stat-label">Auth Events Today</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444'}}>⛔</div>
          <div>
            <div className="stat-value">{summary.deniedAuthzEvents}</div>
            <div className="stat-label">Blocked Access (30d)</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{background: 'rgba(139, 92, 246, 0.15)', color: '#8b5cf6'}}>📋</div>
          <div>
            <div className="stat-value">{summary.todayAuditLogs}</div>
            <div className="stat-label">API Requests Today</div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW 1 */}
      <div className="charts-grid mb-32">
        <div className="chart-card card col-span-2">
          <h3>Authentication Trends (30 Days)</h3>
          <div className="chart-container">
            <Line data={authTrendData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
          </div>
        </div>
        <div className="chart-card card">
          <h3>Authentication Events</h3>
          <div className="chart-container">
            <Doughnut data={authBreakdownData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } }, cutout: '70%' }} />
          </div>
        </div>
      </div>

      {/* CHARTS ROW 2 */}
      <div className="charts-grid mb-32">
        <div className="chart-card card col-span-2">
          <h3>Top Unauthorized Access Targets</h3>
          <div className="chart-container">
            <Bar data={authzDenialData} options={{ maintainAspectRatio: false, indexAxis: 'y', plugins: { legend: { display: false } } }} />
          </div>
        </div>
        <div className="chart-card card">
          <h3>Recent Auth Alerts</h3>
          <div className="recent-list">
            {authStats.recentEvents.filter(e => e.eventType.includes('FAILED')).slice(0, 5).map(e => (
              <div key={e.id} className="recent-item">
                <div className={`status-dot ${e.eventType.includes('FAILED') ? 'bg-danger' : 'bg-success'}`}></div>
                <div className="recent-content">
                  <div className="recent-title">{e.email || 'Unknown User'}</div>
                  <div className="recent-meta">{e.eventType} - {new Date(e.timestamp).toLocaleString()}</div>
                  <div className="recent-meta">IP: {e.ipAddress}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AUDIT LOGS (ACCOUNTING) */}
      <div className="card">
        <div className="card-header-flex">
          <h3>Audit Logs (Accounting)</h3>
          <form onSubmit={handleSearchLogs} className="search-form">
            <input 
              type="text" 
              placeholder="Search resource, action, IP..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-input form-input-sm"
            />
            <button type="submit" className="btn btn-primary btn-sm">Search</button>
          </form>
        </div>
        
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Time</th>
                <th>User</th>
                <th>Action</th>
                <th>Resource</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.logs.map(log => {
                const details = JSON.parse(log.details || '{}');
                const isError = details.statusCode >= 400;
                return (
                  <tr key={log.id}>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{log.user ? log.user.email : 'Anonymous'}</td>
                    <td><span className="badge badge-info">{log.action.split(' ')[0]}</span></td>
                    <td>{log.resource}</td>
                    <td>{log.ipAddress}</td>
                    <td>
                      <span className={`badge ${isError ? 'badge-danger' : 'badge-success'}`}>
                        {details.statusCode}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        {auditLogs.totalPages > 1 && (
          <div className="pagination">
            <button disabled={auditLogs.page === 1} onClick={() => loadPage(auditLogs.page - 1)}>Prev</button>
            <span>Page {auditLogs.page} of {auditLogs.totalPages}</span>
            <button disabled={auditLogs.page === auditLogs.totalPages} onClick={() => loadPage(auditLogs.page + 1)}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
}

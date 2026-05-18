import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './Auth.css';

export default function VerifyOTP() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes

  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const tempToken = location.state?.tempToken;
  const email = location.state?.email;

  useEffect(() => {
    if (!tempToken) {
      navigate('/login');
    }
  }, [tempToken, navigate]);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(t => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.verifyOTP(tempToken, code);
      // Login successful, save token and user
      login(response.data.user, response.data.accessToken);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResending(true);
    try {
      await authAPI.resendOTP(tempToken);
      setTimer(300); // Reset timer to 5 minutes
      alert('A new OTP has been sent to your email.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-header">
          <h2>Two-Step Verification</h2>
          <p>
            We've sent a 6-digit verification code to<br/>
            <strong>{email}</strong>
          </p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group otp-group">
            <label className="form-label text-center">Enter Verification Code</label>
            <input
              type="text"
              className="form-input text-center otp-input"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength="6"
              required
              autoFocus
            />
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading || code.length < 6}>
            {loading ? 'Verifying...' : 'Verify Login'}
          </button>
        </form>

        <div className="auth-footer">
          {timer > 0 ? (
            <p>Code expires in <strong className="text-primary">{formatTime(timer)}</strong></p>
          ) : (
            <p className="text-danger">Code has expired.</p>
          )}
          
          <button 
            type="button" 
            className="btn-link" 
            onClick={handleResend}
            disabled={resending || timer > 270} // Can only resend after 30s
          >
            {resending ? 'Sending...' : 'Resend Code'}
          </button>
          
          <div style={{ marginTop: '16px' }}>
            <Link to="/login" className="btn-link text-muted">Back to Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// components/Dashboard/AdminDashboard/Profile/MyProfile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../../utils/api';
import styles from './MyProfile.module.css';

function Skeleton({ rows = 3 }) {
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.skeletonRow} />
      ))}
    </div>
  );
}

function Stat({ icon, label, value }) {
  return (
    <div className={styles.stat}>
      <div className={styles.statIcon}><i className={icon} /></div>
      <div className={styles.statInfo}>
        <div className={styles.statValue}>{value ?? '—'}</div>
        <div className={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

function Field({ label, value, copyable }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={styles.field}>
      <div className={styles.fieldLabel}>{label}</div>
      <div className={styles.fieldValue}>
        <span>{value ?? '—'}</span>
        {copyable && value && (
          <button
            type="button"
            className={styles.copyBtn}
            onClick={async () => {
              try { await navigator.clipboard.writeText(String(value)); setCopied(true); setTimeout(()=>setCopied(false), 1500);} catch {}
            }}
            title={copied ? 'Copied!' : 'Copy'}
          >
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} />
          </button>
        )}
      </div>
    </div>
  );
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const canSubmit = useMemo(() => {
    return currentPassword && newPassword && confirmPassword && newPassword === confirmPassword && newPassword.length >= 6;
  }, [currentPassword, newPassword, confirmPassword]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true); setMessage(null); setError(null);
    try {
      const { data } = await api.put('/api/auth/change-password', { currentPassword, newPassword });
      setMessage(data?.message || 'Password changed successfully');
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Unable to change password';
      setError(msg);
    } finally { setLoading(false); }
  };

  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <h2 className={styles.cardTitle}><i className="fas fa-key"/> Change Password</h2>
        <p className={styles.cardHint}>Minimum 6 characters. Make it unique and strong.</p>
      </div>

      <form onSubmit={onSubmit} className={styles.form}>
        <label className={styles.inputGroup}>
          <span>Current password</span>
          <input type="password" value={currentPassword} onChange={(e)=>setCurrentPassword(e.target.value)} placeholder="••••••••" required />
        </label>
        <label className={styles.inputGroup}>
          <span>New password</span>
          <input type="password" value={newPassword} onChange={(e)=>setNewPassword(e.target.value)} placeholder="At least 6 characters" required />
        </label>
        <label className={styles.inputGroup}>
          <span>Confirm new password</span>
          <input type="password" value={confirmPassword} onChange={(e)=>setConfirmPassword(e.target.value)} placeholder="Repeat new password" required />
        </label>

        {newPassword && confirmPassword && newPassword !== confirmPassword && (
          <div className={styles.inlineError}><i className="fas fa-exclamation-triangle"/> Passwords do not match</div>
        )}

        {error && <div className={styles.alertError}><i className="fas fa-times-circle"/> {error}</div>}
        {message && <div className={styles.alertSuccess}><i className="fas fa-check-circle"/> {message}</div>}

        <div className={styles.actions}>
          <button className={styles.primaryBtn} type="submit" disabled={!canSubmit || loading}>
            {loading ? (<><i className="fas fa-spinner fa-spin"/> Saving...</>) : (<><i className="fas fa-save"/> Update Password</>)}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function MyProfile() {
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data } = await api.get('/api/auth/me');
        if (!mounted) return;
        setMe(data?.data || null);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load profile');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  const initials = useMemo(() => {
    const f = me?.prenom?.[0] || me?.nom?.[0] || 'A';
    const l = me?.nom?.[0] || me?.prenom?.[0] || 'D';
    return `${String(f)}${String(l)}`.toUpperCase();
  }, [me]);

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}><h1>My Profile</h1></div>
        <div className={styles.grid}>
          <div className={styles.card}><Skeleton rows={5} /></div>
          <div className={styles.card}><Skeleton rows={7} /></div>
          <div className={styles.card}><Skeleton rows={6} /></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.header}><h1>My Profile</h1></div>
        <div className={styles.errorBox}>
          <i className="fas fa-exclamation-triangle"/> {error}
          <div className={styles.actions}>
            <button className={styles.secondaryBtn} onClick={() => window.location.reload()}><i className="fas fa-sync"/> Retry</button>
            <Link to="/login" className={styles.linkBtn}><i className="fas fa-sign-in-alt"/> Log in</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>My Profile</h1>
        <p className={styles.subtitle}>Manage your admin account details and security.</p>
      </div>

      <div className={styles.grid}>
        {/* Overview */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><i className="fas fa-user-circle"/> Overview</h2>
          </div>
          <div className={styles.avatarRow}>
            <div className={styles.avatar}>{initials}</div>
            <div>
              <div className={styles.nameLine}>{me?.prenom} {me?.nom}</div>
              <div className={styles.roleLine}><i className="fas fa-shield-alt"/> {me?.role ? String(me.role).charAt(0).toUpperCase() + String(me.role).slice(1) : 'Administrator'}</div>
            </div>
          </div>
          <div className={styles.meta}>
            <Stat icon="fas fa-check-circle" label="Verification" value={me?.statut_verification ? 'Verified' : 'Not verified'} />
            <Stat icon="fas fa-user-lock" label="Account Status" value={me?.statut_compte || '—'} />
            <Stat icon="fas fa-sign-in-alt" label="Last Login" value={me?.derniere_connexion ? new Date(me.derniere_connexion).toLocaleString() : '—'} />
          </div>
        </div>

        {/* Contact details */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}><i className="fas fa-id-card"/> Contact & Profile</h2>
            <span className={styles.badgeSoon}>Edit Coming Soon</span>
          </div>
          <div className={styles.fields}>
            <Field label="Email" value={me?.email} copyable />
            <Field label="Phone" value={me?.telephone} />
            <Field label="Country" value={me?.pays} />
            <Field label="City" value={me?.ville} />
            <Field label="Address" value={me?.adresse} />
            <Field label="Postal Code" value={me?.code_postal} />
            <Field label="Gender" value={me?.genre} />
            <Field label="Date of Birth" value={me?.date_naissance ? new Date(me.date_naissance).toLocaleDateString() : '—'} />
            <Field label="Bio" value={me?.bio} />
            <Field label="Profession" value={me?.profession} />
          </div>
        </div>

        {/* Security */}
        <ChangePasswordCard />
      </div>
    </div>
  );
}



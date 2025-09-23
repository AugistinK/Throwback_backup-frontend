// components/Dashboard/AdminDashboard/Comments/CommentStats.jsx
import React, { useState } from 'react';
import styles from './CommentStats.module.css';

const toAbsoluteUrl = (url) => {
  if (!url) return '/images/default-avatar.jpg';
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = process.env.REACT_APP_API_URL || 'https://throwback-backup-backend.onrender.com';
  return url.startsWith('/') ? base + url : `${base}/${url}`;
};

const CommentStats = ({ stats }) => {
  const [showDetailed, setShowDetailed] = useState(false);
  if (!stats) return null;

  // Normalisation des données issues de l’API
  const processed = {
    total: stats.total?.[0]?.count || 0,
    byStatus: {},
    byType: {},
    reported: 0,
    notReported: 0,
    // activité 7j : accepte stats.last7Days (API) ou stats.byDate (ancien nom)
    last7Days: Array.isArray(stats.last7Days)
      ? stats.last7Days
      : (Array.isArray(stats.byDate) ? stats.byDate : []),
    // top commentateurs : [{ user, count }]
    topCommenters: Array.isArray(stats.topCommenters) ? stats.topCommenters : []
  };

  if (Array.isArray(stats.byStatus)) {
    stats.byStatus.forEach(i => { processed.byStatus[i._id || 'UNKNOWN'] = i.count; });
  }
  if (Array.isArray(stats.byType)) {
    stats.byType.forEach(i => { processed.byType[i._id || 'other'] = i.count; });
  }
  if (Array.isArray(stats.reported)) {
    stats.reported.forEach(i => {
      if (i._id === 1) processed.reported = i.count;
      if (i._id === 0) processed.notReported = i.count;
    });
  }

  const activePct = processed.total ? (((processed.byStatus.ACTIF || 0) / processed.total) * 100).toFixed(1) : 0;
  const reportedPct = processed.total ? ((processed.reported / processed.total) * 100).toFixed(1) : 0;

  // max pour la barre d’activité
  const maxActivity = processed.last7Days.length
    ? Math.max(...processed.last7Days.map(d => d.count || 0))
    : 0;

  return (
    <div className={styles.statsContainer}>
      {/* Stats principales */}
      <div className={styles.mainStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><i className="fas fa-comments"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{processed.total.toLocaleString()}</div>
            <div className={styles.statLabel}>Total Commentaires</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><i className="fas fa-check-circle" style={{ color: '#28a745' }}></i></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{(processed.byStatus.ACTIF || 0).toLocaleString()}</div>
            <div className={styles.statLabel}>Actifs</div>
            <div className={styles.statPercentage}>{activePct}%</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><i className="fas fa-exclamation-triangle" style={{ color: '#ffc107' }}></i></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{(processed.byStatus.MODERE || 0).toLocaleString()}</div>
            <div className={styles.statLabel}>En Modération</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><i className="fas fa-trash" style={{ color: '#6c757d' }}></i></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{(processed.byStatus.SUPPRIME || 0).toLocaleString()}</div>
            <div className={styles.statLabel}>Supprimés</div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.statsActions}>
        <button
          className={`${styles.toggleBtn} ${showDetailed ? styles.active : ''}`}
          onClick={() => setShowDetailed(v => !v)}
        >
          <i className={`fas fa-chevron-${showDetailed ? 'up' : 'down'}`}></i>
          {showDetailed ? 'Masquer les détails' : 'Afficher les détails'}
        </button>
      </div>

      {/* Détails */}
      {showDetailed && (
        <div className={styles.detailedStats}>
          <div className={styles.statsRow}>
            {/* Répartition par type */}
            <div className={styles.statsSection}>
              <h4>Répartition par Type</h4>
              <div className={styles.pieStats}>
                <div className={styles.pieItem}>
                  <div className={styles.pieColor} style={{ backgroundColor: '#007bff' }}></div>
                  <span>Commentaires Vidéos: {processed.byType.video || 0}</span>
                </div>
                <div className={styles.pieItem}>
                  <div className={styles.pieColor} style={{ backgroundColor: '#28a745' }}></div>
                  <span>Commentaires Posts: {processed.byType.post || 0}</span>
                </div>
                <div className={styles.pieItem}>
                  <div className={styles.pieColor} style={{ backgroundColor: '#ffc107' }}></div>
                  <span>Souvenirs: {processed.byType.memory || 0}</span>
                </div>
              </div>
            </div>

            {/* Activité récente (7 jours) */}
            <div className={styles.statsSection}>
              <h4>Activité (7 derniers jours)</h4>
              {processed.last7Days.length ? (
                <div className={styles.activityChart}>
                  {processed.last7Days.map((day, idx) => {
                    const date = day._id || day.date;
                    const count = day.count || 0;
                    const widthPct = maxActivity ? (count / maxActivity) * 100 : 0;
                    return (
                      <div key={idx} className={styles.activityDay}>
                        <div className={styles.activityDate}>
                          {new Date(date).toLocaleDateString('fr-FR', {
                            weekday: 'short', day: '2-digit', month: '2-digit'
                          })}
                        </div>
                        <div className={styles.activityBar}>
                          <div className={styles.activityFill} style={{ width: `${widthPct}%` }}></div>
                        </div>
                        <div className={styles.activityCount}>{count}</div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className={styles.noData}>Aucune donnée d'activité disponible</p>
              )}
            </div>
          </div>

          {/* Top commentateurs */}
          {processed.topCommenters.length > 0 && (
            <div className={styles.statsSection}>
              <h4>Commentateurs les Plus Actifs</h4>
              <div className={styles.topCommenters}>
                {processed.topCommenters.slice(0, 5).map((item, idx) => {
                  const u = item.user || {};
                  const count = item.count ?? item.commentCount ?? 0; // fallback au cas où
                  const name = `${u?.prenom || ''} ${u?.nom || ''}`.trim() || 'Utilisateur';
                  return (
                    <div key={idx} className={styles.commenterItem}>
                      <div className={styles.commenterRank}>#{idx + 1}</div>
                      <img
                        src={toAbsoluteUrl(u?.photo_profil)}
                        alt="Avatar"
                        className={styles.commenterAvatar}
                        onError={(e) => { e.currentTarget.src = '/images/default-avatar.jpg'; }}
                      />
                      <div className={styles.commenterInfo}>
                        <div className={styles.commenterName}>{name}</div>
                        <div className={styles.commenterCount}>
                          {count} commentaire{count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentStats;

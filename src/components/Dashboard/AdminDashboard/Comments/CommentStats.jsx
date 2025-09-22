// components/Dashboard/AdminDashboard/Comments/CommentStats.jsx
import React, { useState } from 'react';
import styles from './CommentStats.module.css';

const CommentStats = ({ stats }) => {
  const [showDetailed, setShowDetailed] = useState(false);
  if (!stats) return null;

  const processStats = () => {
    const processed = {
      total: stats.total?.[0]?.count || 0,
      byStatus: {},
      byType: {},
      reported: 0,
      notReported: 0
    };

    // par statut
    if (stats.byStatus) {
      stats.byStatus.forEach(item => {
        processed.byStatus[item._id || 'UNKNOWN'] = item.count;
      });
    }

    // par type (video / post / other)
    if (stats.byType) {
      stats.byType.forEach(item => {
        processed.byType[item._id || 'other'] = item.count;
      });
    }

    // signalements
    if (stats.reported) {
      stats.reported.forEach(item => {
        if (item._id === 1) processed.reported = item.count;
        else processed.notReported = item.count;
      });
    }

    return processed;
  };

  const processedStats = processStats();

  const activePercentage = processedStats.total > 0
    ? (((processedStats.byStatus.ACTIF || 0) / processedStats.total) * 100).toFixed(1)
    : 0;

  // source d'activité : le back renvoie last7Days
  const activity = Array.isArray(stats.last7Days) ? stats.last7Days : (stats.byDate || []);
  const maxActivity = activity.length > 0 ? Math.max(...activity.map(d => d.count)) : 0;

  return (
    <div className={styles.statsContainer}>
      <div className={styles.mainStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><i className="fas fa-comments"></i></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{processedStats.total.toLocaleString()}</div>
            <div className={styles.statLabel}>Total Commentaires</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-check-circle" style={{ color: '#28a745' }}></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{(processedStats.byStatus.ACTIF || 0).toLocaleString()}</div>
            <div className={styles.statLabel}>Actifs</div>
            <div className={styles.statPercentage}>{activePercentage}%</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><i className="fas fa-trash" style={{ color: '#6c757d' }}></i></div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{(processedStats.byStatus.SUPPRIME || 0).toLocaleString()}</div>
            <div className={styles.statLabel}>Supprimés</div>
          </div>
        </div>
      </div>

      <div className={styles.statsActions}>
        <button
          className={`${styles.toggleBtn} ${showDetailed ? styles.active : ''}`}
          onClick={() => setShowDetailed(!showDetailed)}
        >
          <i className={`fas fa-chevron-${showDetailed ? 'up' : 'down'}`}></i>
          {showDetailed ? 'Masquer les détails' : 'Afficher les détails'}
        </button>
      </div>

      {showDetailed && (
        <div className={styles.detailedStats}>
          <div className={styles.statsRow}>
            {/* Répartition par type */}
            <div className={styles.statsSection}>
              <h4>Répartition par Type</h4>
              <div className={styles.pieStats}>
                <div className={styles.pieItem}>
                  <div className={styles.pieColor} style={{ backgroundColor: '#007bff' }}></div>
                  <span>Commentaires Vidéos: {processedStats.byType.video || 0}</span>
                </div>
                <div className={styles.pieItem}>
                  <div className={styles.pieColor} style={{ backgroundColor: '#28a745' }}></div>
                  <span>Commentaires Posts: {processedStats.byType.post || 0}</span>
                </div>
                <div className={styles.pieItem}>
                  <div className={styles.pieColor} style={{ backgroundColor: '#ffc107' }}></div>
                  <span>Autres: {processedStats.byType.other || 0}</span>
                </div>
              </div>
            </div>

            {/* Activité 7 jours */}
            <div className={styles.statsSection}>
              <h4>Activité (7 derniers jours)</h4>
              {activity.length > 0 ? (
                <div className={styles.activityChart}>
                  {activity.map((day, idx) => (
                    <div key={idx} className={styles.activityDay}>
                      <div className={styles.activityDate}>
                        {new Date(day._id).toLocaleDateString('fr-FR', {
                          weekday: 'short', day: '2-digit', month: '2-digit'
                        })}
                      </div>
                      <div className={styles.activityBar}>
                        <div
                          className={styles.activityFill}
                          style={{ width: `${maxActivity ? (day.count / maxActivity) * 100 : 0}%` }}
                        ></div>
                      </div>
                      <div className={styles.activityCount}>{day.count}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className={styles.noData}>Aucune donnée d'activité disponible</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CommentStats;

// components/Dashboard/AdminDashboard/Comments/CommentStats.jsx
import React, { useState } from 'react';
import styles from './CommentStats.module.css';

const CommentStats = ({ stats }) => {
  const [showDetailed, setShowDetailed] = useState(false);

  if (!stats) return null;

  // Traiter les données de statistiques
  const processStats = () => {
    const processed = {
      total: stats.total?.[0]?.count || 0,
      byStatus: {},
      byType: {},
      reported: 0,
      notReported: 0
    };

    // Traiter les stats par statut
    if (stats.byStatus) {
      stats.byStatus.forEach(item => {
        processed.byStatus[item._id || 'UNKNOWN'] = item.count;
      });
    }

    // Traiter les stats par type  
    if (stats.byType) {
      stats.byType.forEach(item => {
        processed.byType[item._id || 'other'] = item.count;
      });
    }

    // Traiter les stats de signalement
    if (stats.reported) {
      stats.reported.forEach(item => {
        if (item._id === 1) {
          processed.reported = item.count;
        } else {
          processed.notReported = item.count;
        }
      });
    }

    return processed;
  };

  const processedStats = processStats();

  // Calculs dérivés
  const reportedPercentage = processedStats.total > 0 
    ? ((processedStats.reported / processedStats.total) * 100).toFixed(1)
    : 0;

  const activePercentage = processedStats.total > 0
    ? (((processedStats.byStatus.ACTIF || 0) / processedStats.total) * 100).toFixed(1)
    : 0;

  return (
    <div className={styles.statsContainer}>
      {/* Stats principales */}
      <div className={styles.mainStats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-comments"></i>
          </div>
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
          <div className={styles.statIcon}>
            <i className="fas fa-flag" style={{ color: '#dc3545' }}></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{processedStats.reported.toLocaleString()}</div>
            <div className={styles.statLabel}>Signalés</div>
            <div className={styles.statPercentage}>{reportedPercentage}%</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-exclamation-triangle" style={{ color: '#ffc107' }}></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{(processedStats.byStatus.MODERE || 0).toLocaleString()}</div>
            <div className={styles.statLabel}>En Modération</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-trash" style={{ color: '#6c757d' }}></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statNumber}>{(processedStats.byStatus.SUPPRIME || 0).toLocaleString()}</div>
            <div className={styles.statLabel}>Supprimés</div>
          </div>
        </div>
      </div>

      {/* Bouton pour afficher les détails */}
      <div className={styles.statsActions}>
        <button
          className={`${styles.toggleBtn} ${showDetailed ? styles.active : ''}`}
          onClick={() => setShowDetailed(!showDetailed)}
        >
          <i className={`fas fa-chevron-${showDetailed ? 'up' : 'down'}`}></i>
          {showDetailed ? 'Masquer les détails' : 'Afficher les détails'}
        </button>
      </div>

      {/* Stats détaillées */}
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
                  <span>Souvenirs: {processedStats.byType.memory || 0}</span>
                </div>
              </div>
            </div>

            {/* Activité récente */}
            <div className={styles.statsSection}>
              <h4>Activité (7 derniers jours)</h4>
              {stats.byDate && stats.byDate.length > 0 ? (
                <div className={styles.activityChart}>
                  {stats.byDate.map((day, index) => (
                    <div key={index} className={styles.activityDay}>
                      <div className={styles.activityDate}>
                        {new Date(day._id).toLocaleDateString('fr-FR', { 
                          weekday: 'short',
                          day: '2-digit',
                          month: '2-digit'
                        })}
                      </div>
                      <div className={styles.activityBar}>
                        <div 
                          className={styles.activityFill}
                          style={{ 
                            width: `${(day.count / Math.max(...stats.byDate.map(d => d.count))) * 100}%` 
                          }}
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

          {/* Top commentateurs */}
          {stats.topCommenters && stats.topCommenters.length > 0 && (
            <div className={styles.statsSection}>
              <h4>Commentateurs les Plus Actifs</h4>
              <div className={styles.topCommenters}>
                {stats.topCommenters.slice(0, 5).map((commenter, index) => (
                  <div key={index} className={styles.commenterItem}>
                    <div className={styles.commenterRank}>#{index + 1}</div>
                    <img
                      src={commenter.user?.photo_profil || '/images/default-avatar.jpg'}
                      alt="Avatar"
                      className={styles.commenterAvatar}
                      onError={(e) => {
                        e.target.src = '/images/default-avatar.jpg';
                      }}
                    />
                    <div className={styles.commenterInfo}>
                      <div className={styles.commenterName}>
                        {`${commenter.user?.prenom || ''} ${commenter.user?.nom || ''}`.trim() || 'Utilisateur'}
                      </div>
                      <div className={styles.commenterCount}>
                        {commenter.commentCount} commentaire{commenter.commentCount > 1 ? 's' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Commentaires les plus signalés */}
          {stats.mostReported && stats.mostReported.length > 0 && (
            <div className={styles.statsSection}>
              <h4>Commentaires les Plus Signalés</h4>
              <div className={styles.reportedComments}>
                {stats.mostReported.slice(0, 3).map((comment, index) => (
                  <div key={index} className={styles.reportedItem}>
                    <div className={styles.reportedContent}>
                      <p>{comment.contenu.substring(0, 100)}...</p>
                      <div className={styles.reportedMeta}>
                        <span>Par: {comment.auteur?.prenom} {comment.auteur?.nom}</span>
                        <span className={styles.reportedCount}>
                          <i className="fas fa-flag"></i>
                          {comment.reportCount} signalement{comment.reportCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentStats;
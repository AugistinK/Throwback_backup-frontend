// components/Dashboard/AdminDashboard/Comments/ModerationModal.jsx
import React, { useState } from 'react';
import styles from './ModerationModal.module.css';

const ModerationModal = ({ comment, onModerate, onClose }) => {
  const [selectedAction, setSelectedAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const actions = [
    {
      id: 'approve',
      label: 'Approuver',
      icon: 'fas fa-check',
      color: 'success',
      description: 'Approuver ce commentaire et le rendre visible'
    },
    {
      id: 'reject',
      label: 'Rejeter',
      icon: 'fas fa-times',
      color: 'warning', 
      description: 'Rejeter ce commentaire (modération)'
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: 'fas fa-trash',
      color: 'danger',
      description: 'Supprimer définitivement ce commentaire'
    }
  ];

  const predefinedReasons = {
    reject: [
      'Contenu inapproprié',
      'Spam ou publicité',
      'Harcèlement',
      'Contenu haineux',
      'Violation des règles communautaires',
      'Contenu hors sujet'
    ],
    delete: [
      'Violation grave des règles',
      'Contenu illégal',
      'Spam répétitif',
      'Harcèlement grave',
      'Contenu extrêmement inapproprié'
    ]
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await onModerate(selectedAction, reason);
    } catch (error) {
      console.error('Erreur lors de la modération:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedActionData = actions.find(a => a.id === selectedAction);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Modérer le Commentaire</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Aperçu du commentaire */}
          <div className={styles.commentPreview}>
            <div className={styles.commentContent}>
              <p>"{comment.contenu}"</p>
            </div>
            <div className={styles.commentMeta}>
              <span>
                <i className="fas fa-user"></i>
                {comment.auteur ? `${comment.auteur.prenom} ${comment.auteur.nom}` : 'Utilisateur supprimé'}
              </span>
              <span>
                <i className="fas fa-clock"></i>
                {new Date(comment.creation_date).toLocaleDateString('fr-FR')}
              </span>
              {comment.signale_par && comment.signale_par.length > 0 && (
                <span className={styles.reported}>
                  <i className="fas fa-flag"></i>
                  {comment.signale_par.length} signalement{comment.signale_par.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Sélection de l'action */}
            <div className={styles.actionSelection}>
              <label>Action à effectuer :</label>
              <div className={styles.actionButtons}>
                {actions.map(action => (
                  <button
                    key={action.id}
                    type="button"
                    className={`${styles.actionBtn} ${styles[action.color]} ${
                      selectedAction === action.id ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <i className={action.icon}></i>
                    {action.label}
                  </button>
                ))}
              </div>
              {selectedActionData && (
                <p className={styles.actionDescription}>
                  {selectedActionData.description}
                </p>
              )}
            </div>

            {/* Raison */}
            {(selectedAction === 'reject' || selectedAction === 'delete') && (
              <div className={styles.reasonSection}>
                <label htmlFor="reason">
                  Raison {selectedAction === 'delete' ? '(recommandée)' : '(optionnelle)'}
                </label>
                
                {predefinedReasons[selectedAction] && (
                  <div className={styles.predefinedReasons}>
                    {predefinedReasons[selectedAction].map((predefinedReason, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`${styles.reasonBtn} ${
                          reason === predefinedReason ? styles.selected : ''
                        }`}
                        onClick={() => setReason(reason === predefinedReason ? '' : predefinedReason)}
                      >
                        {predefinedReason}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Saisissez une raison personnalisée..."
                  className={styles.reasonTextarea}
                  rows="3"
                />
              </div>
            )}

            {/* Avertissement pour suppression */}
            {selectedAction === 'delete' && (
              <div className={styles.warningBox}>
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <strong>Attention :</strong> Cette action est irréversible. 
                  Le commentaire supprimé ne pourra pas être récupéré.
                </div>
              </div>
            )}

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isProcessing}
              >
                Annuler
              </button>
              
              <button
                type="submit"
                className={`${styles.submitBtn} ${selectedActionData ? styles[selectedActionData.color] : ''}`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Traitement...
                  </>
                ) : (
                  <>
                    <i className={selectedActionData?.icon}></i>
                    {selectedActionData?.label}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// components/Dashboard/AdminDashboard/Comments/ReplyModal.jsx
const ReplyModal = ({ comment, onReply, onClose }) => {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      await onReply(content.trim());
    } catch (error) {
      console.error('Erreur lors de la réponse:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Répondre au Commentaire</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Commentaire original */}
          <div className={styles.commentPreview}>
            <div className={styles.originalComment}>
              <div className={styles.commentHeader}>
                <i className="fas fa-quote-left"></i>
                <span>Commentaire original :</span>
              </div>
              <p>"{comment.contenu}"</p>
              <div className={styles.commentMeta}>
                <span>
                  <i className="fas fa-user"></i>
                  {comment.auteur ? `${comment.auteur.prenom} ${comment.auteur.nom}` : 'Utilisateur supprimé'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.replySection}>
              <label htmlFor="replyContent">Votre réponse (en tant qu'administrateur) :</label>
              <textarea
                id="replyContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Écrivez votre réponse..."
                className={styles.replyTextarea}
                rows="4"
                maxLength="500"
                required
              />
              <div className={styles.charCount}>
                {content.length}/500 caractères
              </div>
            </div>

            <div className={styles.replyInfo}>
              <i className="fas fa-info-circle"></i>
              <p>
                Cette réponse sera visible publiquement et identifiée comme une réponse administrative.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isProcessing}
              >
                Annuler
              </button>
              
              <button
                type="submit"
                className={styles.replyBtn}
                disabled={isProcessing || !content.trim()}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Envoi...
                  </>
                ) : (
                  <>
                    <i className="fas fa-reply"></i>
                    Envoyer la réponse
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { ModerationModal, ReplyModal };
export default ModerationModal;
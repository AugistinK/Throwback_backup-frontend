// components/Dashboard/AdminDashboard/Comments/ReplyModal.jsx
import React, { useState } from 'react';
import styles from './ModerationModal.module.css';

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

export default ReplyModal;
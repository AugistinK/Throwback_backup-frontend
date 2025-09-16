// components/Dashboard/AdminDashboard/Comments/BulkActions.jsx
import React, { useState } from 'react';
import styles from './BulkActions.module.css';

const BulkActions = ({ selectedCount, onBulkModerate, onCancel }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Actions disponibles
  const actions = [
    {
      id: 'approve',
      label: 'Approuver',
      icon: 'fas fa-check',
      color: 'success',
      description: 'Approuver tous les commentaires sélectionnés'
    },
    {
      id: 'reject',
      label: 'Rejeter',
      icon: 'fas fa-times',
      color: 'warning',
      description: 'Rejeter les commentaires sélectionnés (modération)'
    },
    {
      id: 'delete',
      label: 'Supprimer',
      icon: 'fas fa-trash',
      color: 'danger',
      description: 'Supprimer définitivement les commentaires sélectionnés'
    }
  ];

  // Gérer la sélection d'action
  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setShowConfirmation(true);
    setReason('');
  };

  // Confirmer l'action
  const handleConfirm = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      await onBulkModerate(selectedAction.id, reason);
      setShowConfirmation(false);
      setSelectedAction(null);
      setReason('');
    } catch (error) {
      console.error('Erreur lors de l\'action en lot:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Annuler
  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
      setSelectedAction(null);
      setReason('');
    } else {
      onCancel();
    }
  };

  // Messages de confirmation
  const getConfirmationMessage = () => {
    if (!selectedAction) return '';

    const actionMessages = {
      approve: `Êtes-vous sûr de vouloir approuver ${selectedCount} commentaire${selectedCount > 1 ? 's' : ''} ?`,
      reject: `Êtes-vous sûr de vouloir rejeter ${selectedCount} commentaire${selectedCount > 1 ? 's' : ''} ?`,
      delete: `Êtes-vous sûr de vouloir supprimer définitivement ${selectedCount} commentaire${selectedCount > 1 ? 's' : ''} ?`
    };

    return actionMessages[selectedAction.id];
  };

  // Raisons prédéfinies
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

  return (
    <>
      <div className={styles.bulkActionsBar}>
        <div className={styles.selectionInfo}>
          <i className="fas fa-check-square"></i>
          <span className={styles.selectedCount}>
            {selectedCount} commentaire{selectedCount > 1 ? 's' : ''} sélectionné{selectedCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className={styles.actionButtons}>
          {actions.map(action => (
            <button
              key={action.id}
              className={`${styles.actionBtn} ${styles[action.color]}`}
              onClick={() => handleActionSelect(action)}
              title={action.description}
              disabled={isProcessing}
            >
              <i className={action.icon}></i>
              {action.label}
            </button>
          ))}
        </div>

        <div className={styles.cancelContainer}>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={isProcessing}
          >
            <i className="fas fa-times"></i>
            Annuler
          </button>
        </div>
      </div>

      {/* Modal de confirmation */}
      {showConfirmation && selectedAction && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationModal}>
            <div className={styles.modalHeader}>
              <h3>
                <i className={selectedAction.icon}></i>
                Confirmer l'action
              </h3>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.confirmationMessage}>
                <div className={`${styles.actionIcon} ${styles[selectedAction.color]}`}>
                  <i className={selectedAction.icon}></i>
                </div>
                <p>{getConfirmationMessage()}</p>
              </div>

              {/* Raison (optionnelle pour approve, recommandée pour reject/delete) */}
              {(selectedAction.id === 'reject' || selectedAction.id === 'delete') && (
                <div className={styles.reasonSection}>
                  <label htmlFor="reason">
                    Raison {selectedAction.id === 'delete' ? '(recommandée)' : '(optionnelle)'}
                  </label>
                  
                  {/* Raisons prédéfinies */}
                  {predefinedReasons[selectedAction.id] && (
                    <div className={styles.predefinedReasons}>
                      {predefinedReasons[selectedAction.id].map((predefinedReason, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`${styles.reasonBtn} ${reason === predefinedReason ? styles.selected : ''}`}
                          onClick={() => setReason(reason === predefinedReason ? '' : predefinedReason)}
                        >
                          {predefinedReason}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Champ de saisie personnalisé */}
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
              {selectedAction.id === 'delete' && (
                <div className={styles.warningBox}>
                  <i className="fas fa-exclamation-triangle"></i>
                  <div>
                    <strong>Attention :</strong> Cette action est irréversible. 
                    Les commentaires supprimés ne pourront pas être récupérés.
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelModalBtn}
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Annuler
              </button>
              
              <button
                className={`${styles.confirmBtn} ${styles[selectedAction.color]}`}
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Traitement...
                  </>
                ) : (
                  <>
                    <i className={selectedAction.icon}></i>
                    Confirmer {selectedAction.label.toLowerCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;
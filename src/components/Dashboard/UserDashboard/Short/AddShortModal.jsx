// components/Shorts/AddShortModal.jsx
import React from 'react';
import { FaTimes, FaCloudUploadAlt, FaExclamationTriangle } from 'react-icons/fa';
import styles from './Shorts.module.css';

const AddShortModal = ({
  showModal,
  onClose,
  form,
  errDuree,
  isUploading,
  uploadProgress,
  dragActive,
  videoRef,
  handleChange,
  handleFileChange,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleSubmit
}) => {
  if (!showModal) return null;

  const handleInputEvent = (e) => handleChange(e);
  const handleKeyDown = (e) => {
    if (e.key === ' ') {
      // Autoriser l'espace dans les champs
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={() => !isUploading && onClose()}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>Add a Short</h2>
          <button
            className={styles.closeBtn}
            onClick={() => !isUploading && onClose()}
            disabled={isUploading}
            aria-label="Close modal"
          >
            <FaTimes />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="titre">Title</label>
            <input
              id="titre"
              name="titre"
              type="text"
              value={form.titre}
              onChange={handleChange}
              onInput={handleInputEvent}
              onKeyDown={handleKeyDown}
              required
              disabled={isUploading}
              placeholder="Give your short a title"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="artiste">Artist</label>
            <input
              id="artiste"
              name="artiste"
              type="text"
              value={form.artiste}
              onChange={handleChange}
              onInput={handleInputEvent}
              onKeyDown={handleKeyDown}
              required
              disabled={isUploading}
              placeholder="Artist name"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description (optional)</label>
            <input
              id="description"
              name="description"
              type="text"
              value={form.description}
              onChange={handleChange}
              onInput={handleInputEvent}
              onKeyDown={handleKeyDown}
              disabled={isUploading}
              placeholder="Describe your short (optional)"
              autoComplete="off"
              spellCheck="false"
            />
          </div>

          <div className={styles.formGroup}>
            <label>Video (10–30 s)</label>
            <div
              className={`${styles.fileUploadContainer} ${dragActive ? styles.dragActive : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <div className={styles.fileUploadIcon}>
                <FaCloudUploadAlt />
              </div>
              <div className={styles.fileUploadText}>
                Drag and drop your video file or click to select
              </div>
              <div className={styles.fileUploadSubtext}>
                MP4, WebM, MOV or AVI • 10-30 seconds • 100 MB maximum
              </div>
              <input
                id="videoFile"
                name="videoFile"
                type="file"
                accept="video/*"
                className={styles.fileInput}
                onChange={handleFileChange}
                ref={videoRef}
                disabled={isUploading}
                aria-label="Select a video"
              />
            </div>

            {form.video && (
              <div className={styles.filePreview}>
                <video
                  src={URL.createObjectURL(form.video)}
                  controls={true}
                  muted
                  playsInline
                />
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{form.video.name}</div>
                  <div className={styles.fileSize}>
                    {(form.video.size / (1024 * 1024)).toFixed(2)} MB • {form.duree || '?'} seconds
                  </div>
                </div>
              </div>
            )}

            {errDuree && (
              <div className={styles.errDuree}>
                <FaExclamationTriangle /> {errDuree}
              </div>
            )}

            {isUploading && (
              <div className={styles.uploadProgressContainer}>
                <div
                  className={styles.uploadProgressBar}
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <span className={styles.uploadProgressText}>{uploadProgress}% Uploading...</span>
              </div>
            )}
          </div>
        </form>

        <div className={styles.modalFooter}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={() => !isUploading && onClose()}
            disabled={isUploading}
            aria-label="Cancel"
          >
            Cancel
          </button>
          <button
            type="button"
            className={styles.uploadBtn}
            onClick={handleSubmit}
            disabled={isUploading || !form.video || !form.titre.trim() || !form.artiste.trim()}
            aria-label="Upload"
          >
            {isUploading ? (
              <>
                <div className={styles.smallSpinner}></div>
                <span>Uploading...</span>
              </>
            ) : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(AddShortModal);
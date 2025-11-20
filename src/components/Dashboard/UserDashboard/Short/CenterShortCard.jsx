// components/Shorts/CenterShortCard.jsx
import React from 'react';
import VideoControls from './VideoControls';
import ProgressBar from './ProgressBar';
import ShortActions from './ShortActions';
import CommentSection from './CommentSection';
import styles from './Shorts.module.css';

const CenterShortCard = ({
  short,
  videoRef,
  isCenterPlaying,
  isMuted,
  progress,
  duration,
  showControls,
  setShowControls,
  onPlayPause,
  onMuteToggle,
  onProgressChange,
  isCommentsVisible,
  comments,
  commentInput,
  setCommentInput,
  onAddComment,
  onToggleComments,
  isLikeLoading,
  isShareLoading,
  onLike,
  onShare
}) => {
  return (
    <div className={styles.centerCard}>
      <div
        className={styles.centerImgWrap}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          key={short._id}
          ref={videoRef}
          src={short.youtubeUrl}
          controls={false}
          className={styles.centerImg}
          autoPlay={false}
          muted={isMuted}
          loop
          playsInline
          crossOrigin="anonymous"
          onError={(e) => {
            console.error('Video loading error:', e);
            e.target.src = '/images/video-error.jpg';
          }}
        />
        <div className={styles.centerOverlay}></div>

        <VideoControls
          isPlaying={isCenterPlaying}
          isMuted={isMuted}
          showControls={showControls}
          onPlayPause={onPlayPause}
          onMuteToggle={onMuteToggle}
        />
      </div>

      <ProgressBar
        progress={progress}
        duration={duration}
        onProgressChange={onProgressChange}
      />

      <div className={styles.centerInfo}>
        <div className={styles.centerUserRow}>
          <span className={styles.title}>{short.titre || 'Untitled'}</span>
        </div>

        {short.description && (
          <div className={styles.centerDesc}>{short.description}</div>
        )}

        <div className={styles.centerMusic}>🎵 {short.artiste || 'Unknown artist'}</div>

        <ShortActions
          short={short}
          isLikeLoading={isLikeLoading}
          isShareLoading={isShareLoading}
          onLike={onLike}
          onShare={onShare}
          onToggleComments={onToggleComments}
          isCommentsVisible={isCommentsVisible}
        />
      </div>

      {isCommentsVisible && (
        <CommentSection
          comments={comments}
          commentInput={commentInput}
          setCommentInput={setCommentInput}
          onAddComment={onAddComment}
          onToggleComments={onToggleComments}
        />
      )}
    </div>
  );
};

export default React.memo(CenterShortCard);
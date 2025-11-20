// components/Shorts/CommentSection.jsx
import React from 'react';
import { FaChevronDown } from 'react-icons/fa';
import styles from './Shorts.module.css';

const CommentSection = ({ 
  comments, 
  commentInput, 
  setCommentInput, 
  onAddComment, 
  onToggleComments 
}) => {
  return (
    <div className={styles.commentsSection}>
      <div className={styles.commentsHeader}>
        <h3>Comments</h3>
        <button
          className={styles.collapseBtn}
          onClick={onToggleComments}
          aria-label="Close comments"
        >
          <FaChevronDown />
        </button>
      </div>

      <div className={styles.commentsList}>
        {comments.length === 0 ? (
          <p className={styles.noComments}>No comments yet.</p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className={styles.commentItem}>
              <img
                src={comment.imageUrl || '/images/default-avatar.jpg'}
                alt={comment.username}
                onError={(e) => {
                  e.target.src = '/images/default-avatar.jpg';
                }}
                crossOrigin="anonymous"
              />
              <div>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>{comment.username}</span>
                  <span className={styles.commentDate}>
                    {new Date(comment.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className={styles.commentContent}>{comment.content}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className={styles.addCommentSection}>
        <input
          type="text"
          value={commentInput}
          onChange={e => setCommentInput(e.target.value)}
          placeholder="Add a comment..."
          onKeyPress={e => e.key === 'Enter' && onAddComment()}
          aria-label="Add comment"
        />
        <button
          onClick={onAddComment}
          disabled={!commentInput.trim()}
          aria-label="Send comment"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default React.memo(CommentSection);
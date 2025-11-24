// components/Dashboard/AdminDashboard/Posts/PostDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './PostDetails.module.css';
import socialAPI from '../../../../utils/socialAPI';

const apiBase = process.env.REACT_APP_API_URL || '';

/**
 * Accepts:
 *  - string: '/uploads/...' or 'https://...'
 *  - object with common keys: { url, path, secure_url, Location, location, href, src }
 * Returns absolute url or null.
 */
const toAbsoluteUrl = (value) => {
  if (!value) return null;

  let s = null;
  if (typeof value === 'string') {
    s = value;
  } else if (typeof value === 'object') {
    s =
      value.url ??
      value.path ??
      value.secure_url ??
      value.Location ??
      value.location ??
      value.href ??
      value.src ??
      null;
  }

  if (!s) return null;
  s = String(s);

  try {
    return s.startsWith('/') ? `${apiBase}${s}` : s;
  } catch {
    return null;
  }
};

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();

  // Main states
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Tabs
  const [tab, setTab] = useState('details');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Actions
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Auto clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch post details
  const fetchPostDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await socialAPI.getPostById(postId, true);
      setPost(response.data);
    } catch (err) {
      console.error('Error loading post:', err);
      const formattedError = socialAPI.formatApiError(err);
      if (formattedError.status === 404) {
        setError('Post not found. It may have been deleted.');
      } else {
        setError(
          formattedError.message || 'Unable to load post details.'
        );
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Fetch comments (with pagination)
  const fetchComments = useCallback(async () => {
    try {
      setCommentLoading(true);
      const response = await socialAPI.getPostComments(postId, {
        page: currentPage,
        limit: 10,
        includeReplies: true
      });
      setComments(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentLoading(false);
    }
  }, [postId, currentPage]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await socialAPI.getPostAnalytics(postId, '30d');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [postId]);

  // Delete post
  const deletePost = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);
      await socialAPI.adminDeletePost(postId);
      navigate('/admin/posts', {
        state: { message: 'Post deleted successfully' }
      });
    } catch (err) {
      console.error('Error deleting post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(
        formattedError.message ||
          'An error occurred while deleting the post'
      );
      setConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
  }, [postId, navigate]);

  // Delete a comment (or reply)
  const deleteComment = useCallback(
    async (commentId) => {
      try {
        await socialAPI.deleteComment(commentId);
        setSuccessMessage('Comment deleted successfully');
        fetchComments();
      } catch (err) {
        console.error('Error deleting comment:', err);
        const formattedError = socialAPI.formatApiError(err);
        setError(
          formattedError.message ||
            'An error occurred while deleting the comment'
        );
      }
    },
    [fetchComments]
  );

  // Export post data (post + comments + analytics)
  const exportPostData = useCallback(async () => {
    try {
      const exportData = {
        post,
        comments,
        analytics,
        exportDate: new Date().toISOString()
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(dataBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `post-${postId}-export.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccessMessage('Export generated successfully');
    } catch (err) {
      console.error('Error exporting post data:', err);
      setError('Unable to export post data.');
    }
  }, [post, comments, analytics, postId]);

  // Initial load
  useEffect(() => {
    if (postId) {
      fetchPostDetails();
      // preload comments for first tab switch
      fetchComments();
    }
  }, [postId, fetchPostDetails, fetchComments]);

  // Load comments when page or tab changes
  useEffect(() => {
    if (tab === 'comments') {
      fetchComments();
    }
  }, [tab, currentPage, fetchComments]);

  // Load analytics on first visit of analytics tab
  useEffect(() => {
    if (tab === 'analytics' && !analytics && !analyticsLoading) {
      fetchAnalytics();
    }
  }, [tab, analytics, analyticsLoading, fetchAnalytics]);

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return dateString;
    }
  };

  const handlePageChange = (direction) => {
    if (direction === 'prev') {
      setCurrentPage((prev) => Math.max(prev - 1, 1));
    } else if (direction === 'next') {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    }
  };

  const renderAuthorAvatar = (user) => {
    const fullName = `${user?.prenom || ''} ${user?.nom || ''}`.trim();
    const initials =
      (user?.prenom?.[0] || '') + (user?.nom?.[0] || '');

    const src =
      toAbsoluteUrl(user?.photo_profil) ||
      '/images/default-avatar.jpg';

    return (
      <div className={styles.authorAvatar}>
        <img
          src={src}
          alt={fullName || 'User avatar'}
          onError={(e) => {
            e.currentTarget.src = '/images/default-avatar.jpg';
          }}
        />
        {!user?.photo_profil && (
          <div className={styles.defaultAvatarOverlay}>{initials}</div>
        )}
      </div>
    );
  };

  const renderMedia = () => {
    if (!post?.media) return null;

    const mediaUrl = toAbsoluteUrl(post.media);
    if (!mediaUrl) return null;

    if (post.type_media === 'IMAGE') {
      return (
        <img
          src={mediaUrl}
          alt="Post media"
          className={styles.mediaImage}
        />
      );
    }

    if (post.type_media === 'VIDEO') {
      return (
        <video
          src={mediaUrl}
          controls
          className={styles.mediaVideo}
        />
      );
    }

    if (post.type_media === 'AUDIO') {
      return (
        <audio
          src={mediaUrl}
          controls
          className={styles.mediaAudio}
        />
      );
    }

    return (
      <a
        href={mediaUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.mediaLink}
      >
        View attached media
      </a>
    );
  };

  if (loading && !post) {
    return (
      <div className={styles.postDetails}>
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading post...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.postDetails}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumbs}>
          <Link to="/admin/posts">Posts of user</Link>
          <i className="fas fa-chevron-right"></i>
          <span>Details</span>
        </div>
        <div className={styles.actions}>
          <button
            className={styles.backButton}
            onClick={() => navigate('/admin/posts')}
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </button>
          <button
            className={styles.exportButton}
            onClick={exportPostData}
            disabled={actionLoading}
          >
            <i className="fas fa-download"></i>
            Export
          </button>
          <button
            className={styles.deleteButton}
            onClick={() => setConfirmDelete(true)}
            disabled={actionLoading}
          >
            <i className="fas fa-trash"></i>
            Delete
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className={styles.successMessage}>
          <i className="fas fa-check-circle"></i>
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {!post ? (
        <div className={styles.noDataContainer}>
          <p>Post not found.</p>
        </div>
      ) : (
        <>
          {/* Post header */}
          <div className={styles.postHeader}>
            <div className={styles.postId}>
              <span>ID:</span> {post._id}
            </div>
            <div className={styles.postStatus}>
              {post.epingle && (
                <span
                  className={`${styles.statusBadge} ${styles.status_pinned}`}
                >
                  <i className="fas fa-thumbtack"></i>
                  Pinned
                </span>
              )}
              <span
                className={`${styles.statusBadge} ${
                  styles[
                    `status_${post.modere ? 'moderated' : 'active'}`
                  ]
                }`}
              >
                {/* On ne parle plus de "Moderated" dans l'UI */}
                {post.modere ? 'Hidden' : 'Active'}
              </span>
              <span
                className={`${styles.visibilityBadge} ${
                  styles[
                    `visibility_${post.visibilite?.toLowerCase()}`
                  ]
                }`}
              >
                {post.visibilite}
              </span>
            </div>
          </div>

          {/* Tabs (NO Reports tab) */}
          <div className={styles.tabs}>
            <button
              className={`${styles.tabButton} ${
                tab === 'details' ? styles.activeTab : ''
              }`}
              onClick={() => setTab('details')}
            >
              Details
            </button>
            <button
              className={`${styles.tabButton} ${
                tab === 'comments' ? styles.activeTab : ''
              }`}
              onClick={() => setTab('comments')}
            >
              Comments ({post.commentaires?.length || 0})
            </button>
            <button
              className={`${styles.tabButton} ${
                tab === 'analytics' ? styles.activeTab : ''
              }`}
              onClick={() => setTab('analytics')}
            >
              Analytics
            </button>
          </div>

          {/* Tab content */}
          <div className={styles.tabContent}>
            {/* Details tab */}
            {tab === 'details' && (
              <div className={styles.detailsTab}>
                <div className={styles.postContent}>
                  {/* Author */}
                  <div className={styles.authorSection}>
                    <div className={styles.authorInfo}>
                      {post.auteur ? (
                        <>
                          {renderAuthorAvatar(post.auteur)}
                          <div className={styles.authorText}>
                            <Link
                              to={`/admin/users/${post.auteur._id}`}
                              className={styles.authorName}
                            >
                              {post.auteur.prenom} {post.auteur.nom}
                            </Link>
                            <span className={styles.authorEmail}>
                              {post.auteur.email}
                            </span>
                          </div>
                        </>
                      ) : (
                        <span className={styles.unknownAuthor}>
                          Unknown user
                        </span>
                      )}
                    </div>
                    <div className={styles.postDates}>
                      <div className={styles.dateItem}>
                        <i className="fas fa-calendar-alt"></i>
                        <span>
                          Created on: {formatDate(post.createdAt)}
                        </span>
                      </div>
                      {post.updatedAt &&
                        post.updatedAt !== post.createdAt && (
                          <div className={styles.dateItem}>
                            <i className="fas fa-edit"></i>
                            <span>
                              Updated on: {formatDate(post.updatedAt)}
                            </span>
                          </div>
                        )}
                    </div>
                  </div>

                  {/* Main content */}
                  <div className={styles.mainContent}>
                    {post.contenu && (
                      <div className={styles.postText}>
                        {post.contenu}
                      </div>
                    )}
                    {renderMedia()}
                  </div>

                  {/* Stats / meta */}
                  <div className={styles.metaSection}>
                    <div className={styles.metaItem}>
                      <i className="fas fa-heart"></i>
                      <span>
                        {post.likes?.length || 0} likes
                      </span>
                    </div>
                    <div className={styles.metaItem}>
                      <i className="fas fa-comment"></i>
                      <span>
                        {post.commentaires?.length ||
                          post.commentCount ||
                          0}{' '}
                        comments
                      </span>
                    </div>
                    {post.partages != null && (
                      <div className={styles.metaItem}>
                        <i className="fas fa-share"></i>
                        <span>{post.partages} shares</span>
                      </div>
                    )}
                  </div>

                  {/* Mentions */}
                  {post.mentions && post.mentions.length > 0 && (
                    <div className={styles.mentionsSection}>
                      <h3>Mentions</h3>
                      <div className={styles.mentionsList}>
                        {post.mentions.map((mention, index) => {
                          const src =
                            toAbsoluteUrl(mention.photo_profil) ||
                            '/images/default-avatar.jpg';
                          const fullName = `${mention.prenom} ${mention.nom}`;

                          return (
                            <Link
                              key={index}
                              to={`/admin/users/${mention._id}`}
                              className={styles.mentionItem}
                            >
                              <div className={styles.mentionAvatar}>
                                <img
                                  src={src}
                                  alt={fullName}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      '/images/default-avatar.jpg';
                                  }}
                                />
                              </div>
                              <span>{fullName}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Comments tab (without moderation actions) */}
            {tab === 'comments' && (
              <div className={styles.commentsTab}>
                {commentLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className={styles.noCommentsContainer}>
                    <div className={styles.noCommentsIcon}>
                      <i className="fas fa-comments"></i>
                    </div>
                    <p>No comments on this post</p>
                  </div>
                ) : (
                  <div className={styles.commentsList}>
                    {comments.map((comment) => (
                      <div
                        key={comment._id}
                        className={styles.commentItem}
                      >
                        <div className={styles.commentHeader}>
                          <div className={styles.commentAuthor}>
                            <div className={styles.authorAvatar}>
                              {comment.auteur ? (
                                <img
                                  src={
                                    toAbsoluteUrl(
                                      comment.auteur.photo_profil
                                    ) ||
                                    '/images/default-avatar.jpg'
                                  }
                                  alt={`${comment.auteur?.prenom || ''} ${
                                    comment.auteur?.nom || ''
                                  }`}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      '/images/default-avatar.jpg';
                                  }}
                                />
                              ) : (
                                <div
                                  className={styles.defaultAvatar}
                                >
                                  ??
                                </div>
                              )}
                            </div>
                            <div className={styles.authorInfo}>
                              <span
                                className={styles.authorName}
                              >
                                {comment.auteur?.prenom}{' '}
                                {comment.auteur?.nom}
                              </span>
                              <span
                                className={styles.commentDate}
                              >
                                {formatDate(comment.creation_date)}
                              </span>
                            </div>
                          </div>
                          <div className={styles.commentActions}>
                            <button
                              className={styles.commentActionButton}
                              title="Delete comment"
                              onClick={() => {
                                if (
                                  window.confirm(
                                    'Are you sure you want to delete this comment?'
                                  )
                                ) {
                                  deleteComment(comment._id);
                                }
                              }}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                            <Link
                              to={`/admin/users/${comment.auteur?._id}`}
                              className={styles.commentActionButton}
                              title="View profile"
                            >
                              <i className="fas fa-user"></i>
                            </Link>
                          </div>
                        </div>
                        <div className={styles.commentContent}>
                          {comment.contenu}
                        </div>
                        <div className={styles.commentFooter}>
                          <div className={styles.commentStats}>
                            <span
                              className={styles.commentStat}
                            >
                              <i className="fas fa-heart"></i>
                              {comment.likes || 0}
                            </span>
                            <span
                              className={styles.commentStat}
                            >
                              <i className="fas fa-thumbs-down"></i>
                              {comment.dislikes || 0}
                            </span>
                            <span
                              className={styles.commentStat}
                            >
                              <i className="fas fa-reply"></i>
                              {comment.totalReplies || 0}
                            </span>
                          </div>
                          <span
                            className={`${styles.commentStatus} ${
                              comment.statut !== 'ACTIF'
                                ? styles.commentModerated
                                : ''
                            }`}
                          >
                            {comment.statut === 'ACTIF'
                              ? 'Active'
                              : comment.statut === 'MODERE'
                              ? 'Hidden'
                              : comment.statut === 'SUPPRIME'
                              ? 'Deleted'
                              : comment.statut}
                          </span>
                        </div>

                        {/* Replies */}
                        {comment.replies &&
                          comment.replies.length > 0 && (
                            <div className={styles.commentReplies}>
                              {comment.replies.map((reply) => (
                                <div
                                  key={reply._id}
                                  className={styles.replyItem}
                                >
                                  <div
                                    className={styles.replyHeader}
                                  >
                                    <div
                                      className={
                                        styles.replyAuthor
                                      }
                                    >
                                      <div
                                        className={
                                          styles.authorAvatar
                                        }
                                      >
                                        {reply.auteur ? (
                                          <img
                                            src={
                                              toAbsoluteUrl(
                                                reply.auteur
                                                  .photo_profil
                                              ) ||
                                              '/images/default-avatar.jpg'
                                            }
                                            alt={`${
                                              reply.auteur
                                                ?.prenom || ''
                                            } ${
                                              reply.auteur?.nom ||
                                              ''
                                            }`}
                                            onError={(e) => {
                                              e.currentTarget.src =
                                                '/images/default-avatar.jpg';
                                            }}
                                          />
                                        ) : (
                                          <div
                                            className={
                                              styles.defaultAvatar
                                            }
                                          >
                                            ??
                                          </div>
                                        )}
                                      </div>
                                      <div
                                        className={
                                          styles.authorInfo
                                        }
                                      >
                                        <span
                                          className={
                                            styles.authorName
                                          }
                                        >
                                          {reply.auteur?.prenom}{' '}
                                          {reply.auteur?.nom}
                                        </span>
                                        <span
                                          className={
                                            styles.commentDate
                                          }
                                        >
                                          {formatDate(
                                            reply.creation_date
                                          )}
                                        </span>
                                      </div>
                                    </div>
                                    <button
                                      className={
                                        styles.commentActionButton
                                      }
                                      title="Delete reply"
                                      onClick={() => {
                                        if (
                                          window.confirm(
                                            'Are you sure you want to delete this reply?'
                                          )
                                        ) {
                                          deleteComment(reply._id);
                                        }
                                      }}
                                    >
                                      <i className="fas fa-trash"></i>
                                    </button>
                                  </div>
                                  <div
                                    className={styles.replyContent}
                                  >
                                    {reply.contenu}
                                  </div>
                                </div>
                              ))}

                              {comment.hasMoreReplies && (
                                <button
                                  className={
                                    styles.loadMoreReplies
                                  }
                                >
                                  View more replies (
                                  {comment.totalReplies -
                                    comment.replies.length}
                                  )
                                </button>
                              )}
                            </div>
                          )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Comments pagination */}
                {totalPages > 1 && (
                  <div className={styles.commentsPagination}>
                    <button
                      className={styles.paginationButton}
                      onClick={() => handlePageChange('prev')}
                      disabled={currentPage === 1}
                    >
                      <i className="fas fa-chevron-left"></i>
                    </button>
                    <span className={styles.paginationInfo}>
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      className={styles.paginationButton}
                      onClick={() => handlePageChange('next')}
                      disabled={currentPage === totalPages}
                    >
                      <i className="fas fa-chevron-right"></i>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Analytics tab (unchanged conceptually, no reports) */}
            {tab === 'analytics' && (
              <div className={styles.analyticsTab}>
                {analyticsLoading ? (
                  <div className={styles.loadingContainer}>
                    <div className={styles.loadingSpinner}></div>
                    <p>Loading analytics...</p>
                  </div>
                ) : analytics ? (
                  <div className={styles.analyticsContent}>
                    <div className={styles.analyticsGrid}>
                      <div className={styles.analyticsCard}>
                        <h4>Views</h4>
                        <div className={styles.analyticsValue}>
                          {analytics.vues || 0}
                        </div>
                      </div>
                      <div className={styles.analyticsCard}>
                        <h4>Engagements</h4>
                        <div className={styles.analyticsValue}>
                          {analytics.engagements || 0}
                        </div>
                      </div>
                      <div className={styles.analyticsCard}>
                        <h4>Reach</h4>
                        <div className={styles.analyticsValue}>
                          {analytics.portee || 0}
                        </div>
                      </div>
                      <div className={styles.analyticsCard}>
                        <h4>Engagement rate</h4>
                        <div className={styles.analyticsValue}>
                          {analytics.tauxEngagement || 0}%
                        </div>
                      </div>
                    </div>

                    {analytics.graphiques && (
                      <div className={styles.chartsSection}>
                        <h4>Performance over time</h4>
                        <div className={styles.chartPlaceholder}>
                          <p>30-day performance charts</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={styles.noAnalyticsContainer}>
                    <div className={styles.noAnalyticsIcon}>
                      <i className="fas fa-chart-bar"></i>
                    </div>
                    <p>No analytics data available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Delete modal only (no moderate / restore) */}
          {confirmDelete && (
            <div className={styles.modalOverlay}>
              <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                  <h3>Confirm deletion</h3>
                  <button
                    className={styles.modalCloseButton}
                    onClick={() => setConfirmDelete(false)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                <div className={styles.modalBody}>
                  <p>
                    Are you sure you want to delete this post? This
                    action is irreversible.
                  </p>
                </div>
                <div className={styles.modalFooter}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className={styles.deleteConfirmButton}
                    onClick={deletePost}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PostDetails;

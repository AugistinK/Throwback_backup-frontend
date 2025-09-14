// pages/ThrowbackWall.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PostList from './PostList';
import CreatePostForm from './CreatePostForm';
import WallSidebar from './WallSidebar';
import ErrorBoundary from './././Common/ErrorBoundary';
import { useAuth } from '././././contexts/AuthContext';
import socialAPI from '././././utils/socialAPI';
import styles from './ThrowbackWall.module.css';

const ThrowbackWall = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all'); // 'all' | 'personal'
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAuthenticated, token, loadUser } = useAuth();

  const getUserId = useCallback(() => {
    if (!user) return null;
    if (typeof user === 'string') return user;
    return user.id || user._id || user.userId || user.user_id || null;
  }, [user]);

  const fetchPosts = useCallback(
    async (page = 1, filter = 'all') => {
      try {
        setLoading(true);
        setError(null);

        const params = { page, limit: 10, sort: 'recent' };
        if (filter === 'personal') {
          const uid = getUserId();
          if (!isAuthenticated || !token || !uid) {
            setCurrentFilter('all');
          } else {
            params.userId = uid;
          }
        }

        const { data } = await socialAPI.get('/api/posts', { params });
        const list = data?.data || [];
        const pagination = data?.pagination || { page, totalPages: 1 };

        setPosts((prev) => (page === 1 ? list : [...prev, ...list]));
        setHasMore(pagination.page < pagination.totalPages);
        setCurrentPage(pagination.page);
      } catch (e) {
        console.error('Error fetching posts:', e);
        setError("Impossible de charger les posts. Réessayez.");
      } finally {
        setLoading(false);
      }
    },
    [getUserId, isAuthenticated, token]
  );

  useEffect(() => {
    fetchPosts(1, currentFilter);
  }, [currentFilter, refreshTrigger, fetchPosts]);

  const changeFilter = async (filter) => {
    if (filter === 'personal') {
      if (!isAuthenticated || !token) {
        alert('Veuillez vous connecter pour voir vos posts personnels');
        return;
      }
      if (!getUserId()) {
        await loadUser().catch(() => {});
        if (!getUserId()) {
          alert('Votre profil utilisateur est incomplet. Veuillez vous reconnecter.');
          return;
        }
      }
    }

    setCurrentFilter(filter);
    setCurrentPage(1);
    setPosts([]);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(currentPage + 1, currentFilter);
    }
  };

  const refreshPosts = () => setRefreshTrigger((n) => n + 1);

  const addPost = (newPost) => {
    if (newPost && (newPost._id || newPost.id)) {
      setPosts((prev) => [newPost, ...prev]);
    }
  };

  const updatePost = (updated) => {
    if (!updated || (!updated._id && !updated.id)) return;
    const id = updated._id || updated.id;
    setPosts((prev) => prev.map((p) => (String(p._id || p.id) === String(id) ? updated : p)));
  };

  const deletePost = (postId) => {
    setPosts((prev) => prev.filter((p) => String(p._id || p.id) !== String(postId)));
  };

  return (
    <ErrorBoundary fallback={<div className={styles.errorState}>Une erreur est survenue dans l'affichage du mur.</div>}>
      <div className={styles.wallContainer}>
        <div className={styles.wallContent}>
          <div className={styles.mainContent}>
            <div className={styles.createPostContainer}>
              <CreatePostForm onPostCreated={addPost} />
            </div>

            <div className={styles.filterBar}>
              <button
                className={`${styles.filterButton} ${currentFilter === 'all' ? styles.active : ''}`}
                onClick={() => changeFilter('all')}
                data-filter="all"
              >
                Tous les posts
                {posts.length > 0 && currentFilter === 'all' && (
                  <span className={styles.filterCount}>{posts.length}</span>
                )}
              </button>

              {isAuthenticated && token ? (
                <button
                  className={`${styles.filterButton} ${currentFilter === 'personal' ? styles.active : ''}`}
                  onClick={() => changeFilter('personal')}
                  data-filter="personal"
                  disabled={!getUserId()}
                >
                  Mes posts
                  {posts.length > 0 && currentFilter === 'personal' && (
                    <span className={styles.filterCount}>{posts.length}</span>
                  )}
                </button>
              ) : (
                <button
                  className={`${styles.filterButton} ${styles.disabled}`}
                  onClick={() => alert('Veuillez vous connecter pour voir vos posts')}
                >
                  Mes posts <span className={styles.loginRequired}>(Connexion requise)</span>
                </button>
              )}
            </div>

            {error && (
              <div className={styles.errorMessage}>
                {error}
                <button className={styles.retryButton} onClick={refreshPosts}>
                  Réessayer
                </button>
              </div>
            )}

            <PostList
              posts={posts}
              loading={loading}
              onLoadMore={loadMore}
              hasMore={hasMore}
              onUpdatePost={updatePost}
              onDeletePost={deletePost}
            />
          </div>

          <div className={styles.sidebar}>
            <WallSidebar onRefresh={refreshPosts} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ThrowbackWall;

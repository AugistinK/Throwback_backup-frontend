// pages/ThrowbackWall.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PostList from './PostList';
import CreatePostForm from './CreatePostForm';
import WallSidebar from './WallSidebar';
import ErrorBoundary from '../../../Common/ErrorBoundary';
import { useAuth } from '../../../../contexts/AuthContext';
import socialAPI from '../../../../utils/socialAPI';
import styles from './ThrowbackWall.module.css';

const ThrowbackWall = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all'); 
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAuthenticated, token } = useAuth();

  // Fonction simplifiée pour obtenir l'ID utilisateur
  const getUserId = useCallback(() => {
    if (!user) return null;
    
    // Essayer d'abord les propriétés standards
    const userId = user.id || user._id;
    
    // Convertir en string si c'est un ObjectId
    if (userId) {
      return typeof userId === 'string' ? userId : userId.toString();
    }
    
    return null;
  }, [user]);

  // Fonction pour récupérer les posts
  const fetchPosts = useCallback(async (page = 1, filter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📥 Fetching posts - Page: ${page}, Filter: ${filter}`);
      
      // Construire les paramètres de requête
      let params = { page, limit: 10 };
      
      // Pour le filtre personnel, ajouter l'ID de l'utilisateur
      if (filter === 'personal') {
        const userId = getUserId();
        
        if (!userId) {
          console.warn('⚠️ Cannot filter by user - ID not available');
          setError('Unable to identify your user account. Please try logging in again.');
          setCurrentFilter('all');
          return;
        }
        
        params.auteur = userId;
        console.log(`👤 Filtering by user ID: ${userId}`);
      }
      
      console.log('📤 Request params:', params);
      
      // Récupérer les posts via l'API
      const response = await socialAPI.getAllPosts(params);
      
      // Extraire les posts de la réponse
      const newPosts = response.data || (Array.isArray(response) ? response : []);
      console.log(`✅ Received ${newPosts.length} posts`);
      
      const pagination = response.pagination || {
        page: page,
        totalPages: Math.ceil(newPosts.length / 10),
        total: newPosts.length
      };
      
      // Si c'est la première page, remplacer les posts
      // Sinon, ajouter les nouveaux posts à la liste existante
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      
      // Vérifier s'il y a plus de pages à charger
      setHasMore(pagination.page < pagination.totalPages);
      setCurrentPage(pagination.page);
      
      console.log(`📊 Pagination: Page ${pagination.page}/${pagination.totalPages}, Total: ${pagination.total}`);
      
    } catch (err) {
      console.error('❌ Error loading posts:', err);
      
      // Message d'erreur spécifique selon le type d'erreur
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err.response?.status === 403) {
        setError('You do not have permission to view these posts.');
      } else {
        setError('Unable to load posts. Please try again later.');
      }
      
      // Initialiser un tableau vide en cas d'erreur sur la première page
      if (page === 1) {
        setPosts([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [getUserId]);

  // Recharger les posts lorsque le filtre change
  useEffect(() => {
    console.log(`🔄 Effect triggered - Filter: ${currentFilter}, Trigger: ${refreshTrigger}`);
    fetchPosts(1, currentFilter);
  }, [currentFilter, refreshTrigger, fetchPosts]);

  // Fonction pour charger plus de posts
  const loadMore = () => {
    if (!loading && hasMore) {
      console.log(`⏬ Loading more posts - Page ${currentPage + 1}`);
      fetchPosts(currentPage + 1, currentFilter);
    }
  };

  // Fonction pour rafraîchir les posts
  const refreshPosts = () => {
    console.log('🔄 Refreshing posts');
    setRefreshTrigger(prev => prev + 1);
  };

  // Fonction pour changer le filtre
  const changeFilter = (filter) => {
    console.log(`🔀 Changing filter from ${currentFilter} to ${filter}`);
    
    // Si on essaie de passer au filtre personnel sans être authentifié
    if (filter === 'personal' && !isAuthenticated) {
      console.log('⚠️ Cannot switch to personal filter - Not authenticated');
      alert('Please sign in to view your personal posts');
      return;
    }
    
    // Si on essaie de passer au filtre personnel sans ID utilisateur
    if (filter === 'personal' && !getUserId()) {
      console.log('⚠️ Cannot switch to personal filter - User ID not available');
      alert('Your user profile is incomplete. Please sign in again.');
      return;
    }
    
    if (filter !== currentFilter) {
      setCurrentFilter(filter);
      setCurrentPage(1);
      setPosts([]); // Vider les posts lors du changement de filtre
    }
  };

  // Fonction pour ajouter un nouveau post à la liste
  const addPost = (newPost) => {
    if (newPost && (newPost._id || newPost.id)) {
      console.log('➕ Adding new post:', newPost._id || newPost.id);
      setPosts(prevPosts => [newPost, ...prevPosts]);
    }
  };

  // Fonction pour mettre à jour un post
  const updatePost = (updatedPost) => {
    if (!updatedPost || (!updatedPost._id && !updatedPost.id)) {
      console.error('❌ Invalid post update received');
      return;
    }
    
    const postId = updatedPost._id || updatedPost.id;
    console.log('✏️ Updating post:', postId);
    
    setPosts(prevPosts => 
      prevPosts.map(post => {
        const currentId = post._id || post.id;
        return currentId === postId ? updatedPost : post;
      })
    );
  };

  // Fonction pour supprimer un post
  const deletePost = (postId) => {
    if (!postId) return;
    
    console.log('🗑️ Deleting post:', postId);
    
    setPosts(prevPosts => prevPosts.filter(post => {
      const currentId = post._id || post.id;
      return currentId !== postId;
    }));
  };

  return (
    <ErrorBoundary fallback={<div className={styles.errorState}>An error occurred while displaying the wall.</div>}>
      <div className={styles.wallContainer}>
        <div className={styles.wallContent}>
          <div className={styles.mainContent}>
            <div className={styles.createPostContainer}>
              <CreatePostForm onPostCreated={addPost} />
            </div>
            
            {/* Barre de filtres */}
            <div className={styles.filterBar}>
              <button 
                className={`${styles.filterButton} ${currentFilter === 'all' ? styles.active : ''}`}
                onClick={() => changeFilter('all')}
                data-filter="all"
              >
                All posts
                {posts.length > 0 && currentFilter === 'all' && (
                  <span className={styles.filterCount}>{posts.length}</span>
                )}
              </button>
              
              <button 
                className={`${styles.filterButton} ${currentFilter === 'personal' ? styles.active : ''} ${!isAuthenticated || !getUserId() ? styles.disabled : ''}`}
                onClick={() => changeFilter('personal')}
                data-filter="personal"
                disabled={!isAuthenticated || !getUserId()}
                title={!isAuthenticated ? 'Please sign in to view your posts' : ''}
              >
                My posts
                {posts.length > 0 && currentFilter === 'personal' && (
                  <span className={styles.filterCount}>{posts.length}</span>
                )}
                {(!isAuthenticated || !getUserId()) && (
                  <span className={styles.loginRequired}>(Login required)</span>
                )}
              </button>
            </div>
                      
            {error && (
              <div className={styles.errorMessage}>
                {error}
                <button 
                  className={styles.retryButton}
                  onClick={refreshPosts}
                >
                  Retry
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
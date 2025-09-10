// pages/ThrowbackWall.jsx
import React, { useState, useEffect } from 'react';
import PostList from './PostList';
import CreatePostForm from './CreatePostForm';
import WallSidebar from './WallSidebar';
import ErrorBoundary from '../../../Common/ErrorBoundary';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import styles from './ThrowbackWall.module.css';

const ThrowbackWall = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all'); // all, trending, personal
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user } = useAuth();

  // Fonction pour récupérer les posts avec gestion d'erreur améliorée
  const fetchPosts = async (page = 1, filter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      // Construire les paramètres de requête
      let params = { page, limit: 10 };
      
      if (filter === 'personal' && user) {
        params.userId = user.id;
      } else if (filter === 'trending') {
        params.sort = 'popular';
      }
      
      const response = await api.get('/api/posts', { params });
      
      // Gestion plus robuste des données de réponse
      const newPosts = response.data.data || 
                      (Array.isArray(response.data) ? response.data : []);
      
      const pagination = response.data.pagination || {
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
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      setError('Impossible de charger les posts. Veuillez réessayer plus tard.');
      
      // Initialiser un tableau vide en cas d'erreur sur la première page
      if (page === 1) {
        setPosts([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les posts au montage du composant ou lors d'un changement de filtre
  useEffect(() => {
    fetchPosts(1, currentFilter);
  }, [currentFilter, refreshTrigger, user]);

  // Fonction pour charger plus de posts
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(currentPage + 1, currentFilter);
    }
  };

  // Fonction pour rafraîchir les posts
  const refreshPosts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fonction pour changer le filtre
  const changeFilter = (filter) => {
    if (filter !== currentFilter) {
      setCurrentFilter(filter);
      setCurrentPage(1);
    }
  };

  // Fonction pour ajouter un nouveau post à la liste
  const addPost = (newPost) => {
    if (newPost && (newPost._id || newPost.id)) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    }
  };

  // Fonction pour mettre à jour un post
  const updatePost = (updatedPost) => {
    if (!updatedPost || (!updatedPost._id && !updatedPost.id)) {
      console.error('Invalid post update received');
      return;
    }
    
    const postId = updatedPost._id || updatedPost.id;
    
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
    
    setPosts(prevPosts => prevPosts.filter(post => {
      const currentId = post._id || post.id;
      return currentId !== postId;
    }));
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
              >
                Tous les posts
              </button>
              {/* <button 
                className={`${styles.filterButton} ${currentFilter === 'trending' ? styles.active : ''}`}
                onClick={() => changeFilter('trending')}
              >
                Tendances
              </button> */}
              {user && (
                <button 
                  className={`${styles.filterButton} ${currentFilter === 'personal' ? styles.active : ''}`}
                  onClick={() => changeFilter('personal')}
                >
                  Mes posts
                </button>
              )}
            </div>
            
            {error && (
              <div className={styles.errorMessage}>
                {error}
                <button 
                  className={styles.retryButton}
                  onClick={refreshPosts}
                >
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
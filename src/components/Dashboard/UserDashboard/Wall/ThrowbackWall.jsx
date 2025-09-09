// pages/ThrowbackWall.jsx
import React, { useState, useEffect } from 'react';
import PostList from './PostList';
import CreatePostForm from './CreatePostForm';
import WallSidebar from './WallSidebar';
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

  // Fonction pour récupérer les posts
  const fetchPosts = async (page = 1, filter = 'all') => {
    try {
      setLoading(true);
      
      // Construire les paramètres de requête
      let params = { page, limit: 10 };
      
      if (filter === 'personal' && user) {
        params.userId = user.id;
      } else if (filter === 'trending') {
        params.sort = 'popular';
      }
      
      const response = await api.get('/api/posts', { params });
      
      const newPosts = response.data.data;
      const pagination = response.data.pagination;
      
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
      setError(null);
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      setError('Impossible de charger les posts. Veuillez réessayer plus tard.');
    } finally {
      setLoading(false);
    }
  };

  // Charger les posts au montage du composant
  useEffect(() => {
    fetchPosts(1, currentFilter);
  }, [currentFilter, refreshTrigger]);

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
    setCurrentFilter(filter);
  };

  // Fonction pour ajouter un nouveau post à la liste
  const addPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Fonction pour mettre à jour un post
  const updatePost = (updatedPost) => {
    setPosts(prevPosts => 
      prevPosts.map(post => 
        post._id === updatedPost._id ? updatedPost : post
      )
    );
  };

  // Fonction pour supprimer un post
  const deletePost = (postId) => {
    setPosts(prevPosts => prevPosts.filter(post => post._id !== postId));
  };

  return (
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
            <button 
              className={`${styles.filterButton} ${currentFilter === 'trending' ? styles.active : ''}`}
              onClick={() => changeFilter('trending')}
            >
              Tendances
            </button>
            {user && (
              <button 
                className={`${styles.filterButton} ${currentFilter === 'personal' ? styles.active : ''}`}
                onClick={() => changeFilter('personal')}
              >
                Mes posts
              </button>
            )}
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}
          
          <PostList 
            posts={posts} 
            loading={loading} 
            onLoadMore={loadMore} 
            hasMore={hasMore}
            onUpdatePost={updatePost}
            onDeletePost={deletePost}
          />
        </div>
        
        {/* <div className={styles.sidebar}>
          <WallSidebar onRefresh={refreshPosts} />
        </div> */}
      </div>
    </div>
  );
};

export default ThrowbackWall;
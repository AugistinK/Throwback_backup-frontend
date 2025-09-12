// pages/ThrowbackWall.jsx
import React, { useState, useEffect } from 'react';
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
  const [currentFilter, setCurrentFilter] = useState('all'); // all, trending, personal
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAuthenticated, token } = useAuth();

  // Fonction améliorée pour récupérer les posts avec meilleure gestion des erreurs
  const fetchPosts = async (page = 1, filter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier l'authentification pour le filtre personnel
      if (filter === 'personal') {
        if (!isAuthenticated || !token) {
          console.log('Utilisateur non authentifié, basculement vers tous les posts');
          setCurrentFilter('all');
          filter = 'all'; // Forcer le filtre à 'all'
        } else if (!user) {
          console.log('Objet utilisateur non disponible, basculement vers tous les posts');
          setCurrentFilter('all');
          filter = 'all'; // Forcer le filtre à 'all'
        }
      }
      
      // Construire les paramètres de requête
      let params = { page, limit: 10 };
      
      // Extraction sécurisée de l'ID utilisateur pour le filtre personnel
      if (filter === 'personal') {
        // Vérifier toutes les possibilités d'emplacement de l'ID
        const userId = user?.id || user?._id || 
                      (typeof user === 'object' && user !== null && Object.prototype.hasOwnProperty.call(user, 'userData') ? 
                       (user.userData?.id || user.userData?._id) : null);
        
        if (!userId) {
          console.warn('ID utilisateur introuvable', user);
          throw new Error("Impossible d'identifier votre compte utilisateur");
        }
        
        params.auteur = userId;
        console.log(`Filtrage des posts par utilisateur: ${userId}`);
      }
      
      console.log('Paramètres de requête:', params);
      
      // Utiliser socialAPI au lieu de api directement
      const response = await socialAPI.getAllPosts(params);
      
      // Vérification des résultats
      const newPosts = response.data || (Array.isArray(response) ? response : []);
      console.log(`Posts reçus: ${newPosts.length}`);
      
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
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      
      // Message d'erreur spécifique selon le type d'erreur
      if (err.response?.status === 401) {
        setError('Votre session a expiré. Veuillez vous reconnecter.');
      } else if (err.message.includes("identifier votre compte")) {
        setError(err.message);
      } else {
        setError('Impossible de charger les posts. Veuillez réessayer plus tard.');
      }
      
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
  }, [currentFilter, refreshTrigger, isAuthenticated]);

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

  // Fonction améliorée pour changer le filtre avec vérification d'authentification
  const changeFilter = (filter) => {
    // Si on essaie de passer au filtre personnel sans être authentifié
    if (filter === 'personal' && (!isAuthenticated || !token)) {
      console.log('Tentative de filtrage personnel sans authentification');
      alert('Veuillez vous connecter pour voir vos posts personnels');
      return;
    }
    
    if (filter !== currentFilter) {
      console.log(`Changement de filtre: ${currentFilter} -> ${filter}`);
      setCurrentFilter(filter);
      setCurrentPage(1);
      setPosts([]); // Vider les posts lors du changement de filtre
      
      // Forcer un petit délai pour éviter les problèmes de rendu
      setTimeout(() => {
        fetchPosts(1, filter);
      }, 10);
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
            
            {/* Barre de filtres améliorée avec état d'authentification */}
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
                  Mes posts
                  <span className={styles.loginRequired}>(Connexion requise)</span>
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
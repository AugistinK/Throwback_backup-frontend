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
  const [currentFilter, setCurrentFilter] = useState('all'); // all, trending, personal
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAuthenticated, token } = useAuth();

  // Fonction pour extraire l'ID utilisateur de façon sécurisée
  const getUserId = useCallback(() => {
    // Debug: Afficher l'objet utilisateur complet pour comprendre sa structure
    console.log("Objet utilisateur complet:", JSON.stringify(user, null, 2));
    
    if (!user) return null;
    
    // Essayer toutes les possibilités connues
    return user.id || user._id || 
           (user.data && (user.data.id || user.data._id)) ||
           (user.userData && (user.userData.id || user.userData._id)) ||
           // Recherche récursive des champs id ou _id dans l'objet
           (function findId(obj) {
             if (!obj || typeof obj !== 'object') return null;
             
             // Vérifier les propriétés directes
             if (obj.id) return obj.id;
             if (obj._id) return obj._id;
             
             // Rechercher dans les sous-objets
             for (const key in obj) {
               if (typeof obj[key] === 'object' && obj[key] !== null) {
                 const foundId = findId(obj[key]);
                 if (foundId) return foundId;
               }
             }
             
             return null;
           })(user);
  }, [user]);

  // Fonction améliorée pour récupérer les posts avec meilleure gestion des erreurs
  const fetchPosts = async (page = 1, filter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      // Construire les paramètres de requête
      let params = { page, limit: 10 };
      
      // Vérification spéciale pour le filtre personnel
      if (filter === 'personal') {
        // Vérifier si l'utilisateur est authentifié
        if (!isAuthenticated || !token) {
          console.warn('Utilisateur non authentifié pour filtre personnel');
          setCurrentFilter('all');
          setTimeout(() => fetchPosts(1, 'all'), 10);
          return;
        }
        
        // Obtenir l'ID utilisateur
        const userId = getUserId();
        
        if (!userId) {
          console.warn('ID utilisateur introuvable:', user);
          setError("Impossible d'identifier votre compte utilisateur");
          setLoading(false);
          setPosts([]);
          return;
        }
        
        params.auteur = userId;
        console.log(`Filtrage des posts par utilisateur: ${userId}`);
      }
      
      console.log('Paramètres de requête:', params);
      
      // Utiliser socialAPI pour la cohérence
      const response = await socialAPI.getAllPosts(params);
      
      // Vérification des résultats
      const newPosts = response.data || (Array.isArray(response) ? response : []);
      console.log(`Posts reçus: ${newPosts.length}`);
      
      const pagination = response.pagination || {
        page: page,
        totalPages: Math.ceil(newPosts.length / 10),
        total: newPosts.length
      };
      
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      
      setHasMore(pagination.page < pagination.totalPages);
      setCurrentPage(pagination.page);
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      
      if (err.response?.status === 401) {
        setError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setError(err.message || 'Impossible de charger les posts. Veuillez réessayer.');
      }
      
      if (page === 1) {
        setPosts([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Charger les posts au montage
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

  // Fonction pour changer le filtre
  const changeFilter = (filter) => {
    if (filter === 'personal') {
      const userId = getUserId();
      if (!userId) {
        console.warn("Pas d'ID utilisateur pour le filtre personnel");
        alert("Impossible d'accéder à vos posts personnels. Veuillez vous reconnecter.");
        return;
      }
    }
    
    if (filter !== currentFilter) {
      console.log(`Changement de filtre: ${currentFilter} -> ${filter}`);
      setCurrentFilter(filter);
      setCurrentPage(1);
      setPosts([]);
      
      setTimeout(() => {
        fetchPosts(1, filter);
      }, 10);
    }
  };

  // Fonctions pour gérer les posts
  const addPost = (newPost) => {
    if (newPost && (newPost._id || newPost.id)) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    }
  };

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
            
            {/* Barre de filtres améliorée */}
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
              
              <button 
                className={`${styles.filterButton} ${currentFilter === 'personal' ? styles.active : ''} ${!getUserId() ? styles.disabled : ''}`}
                onClick={() => getUserId() ? changeFilter('personal') : alert("Veuillez vous connecter pour voir vos posts")}
                data-filter="personal"
              >
                Mes posts
                {posts.length > 0 && currentFilter === 'personal' && (
                  <span className={styles.filterCount}>{posts.length}</span>
                )}
                {!getUserId() && <span className={styles.loginRequired}>(Connexion requise)</span>}
              </button>
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
// components/Dashboard/UserDashboard/Wall/PostList.jsx
import React from 'react';
import PostItem from './PostItem';
import Spinner from '../../../Common/Spinner';
import styles from './PostList.module.css';

const PostList = ({ posts, loading, onLoadMore, hasMore, onUpdatePost, onDeletePost }) => {
  // Fonction pour charger plus de posts lors du scroll
  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // Si on est proche de la fin du scroll et qu'il y a plus de posts à charger
    if (scrollHeight - scrollTop <= clientHeight * 1.5 && hasMore && !loading) {
      onLoadMore();
    }
  };
  
  return (
    <div className={styles.postListContainer} onScroll={handleScroll}>
      {posts.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <img src="/images/empty-posts.svg" alt="Aucun post" className={styles.emptyStateImage} />
          <h3>Aucun post à afficher</h3>
          <p>Soyez le premier à partager un souvenir musical !</p>
        </div>
      ) : (
        <div className={styles.postList}>
          {posts.map(post => (
            <PostItem 
              key={post._id} 
              post={post} 
              onUpdatePost={onUpdatePost}
              onDeletePost={onDeletePost}
            />
          ))}
          
          {loading && (
            <div className={styles.loadingContainer}>
              <Spinner size="medium" />
              <span>Chargement des posts...</span>
            </div>
          )}
          
          {!loading && hasMore && (
            <button 
              className={styles.loadMoreButton}
              onClick={onLoadMore}
            >
              Charger plus
            </button>
          )}
          
          {!loading && !hasMore && posts.length > 0 && (
            <div className={styles.endMessage}>
              Vous avez atteint la fin des posts
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PostList;
// components/Dashboard/AdminDashboard/Posts/AdminPosts.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './AdminPosts.module.css';
import { socialAPI } from '../../../../utils/socialAPI';

const AdminPosts = () => {
  // États pour stocker les données et gérer l'interface
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    visibility: '',
    status: '',
    hasMedia: '',
    hasReports: '',
    sortBy: 'newest'
  });
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);

  // Chargement des posts
  useEffect(() => {
    fetchPosts();
  }, [currentPage, filters]);

  // Fonction pour récupérer les posts
  const fetchPosts = async () => {
    try {
      setLoading(true);
      
      // Construction des paramètres de requête
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm || undefined,
        visibility: filters.visibility || undefined,
        status: filters.status || undefined,
        hasMedia: filters.hasMedia || undefined,
        hasReports: filters.hasReports === 'true' ? true : undefined,
        sortBy: filters.sortBy || 'newest'
      };
      
      // Appel à l'API
      const response = await socialAPI.getAllPosts(params);
      
      // Mise à jour de l'état
      setPosts(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPosts(response.pagination?.total || 0);
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      setError('Une erreur est survenue lors du chargement des posts');
    } finally {
      setLoading(false);
    }
  };

  // Gestionnaire de recherche
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilters({
      visibility: '',
      status: '',
      hasMedia: '',
      hasReports: '',
      sortBy: 'newest'
    });
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Gestionnaire de changement de page
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  // Gestion des sélections
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedPosts(posts.map(post => post._id));
    } else {
      setSelectedPosts([]);
    }
  };

  const handleSelectPost = (e, postId) => {
    if (e.target.checked) {
      setSelectedPosts([...selectedPosts, postId]);
    } else {
      setSelectedPosts(selectedPosts.filter(id => id !== postId));
    }
  };

  // Actions en masse
  const performBulkAction = async (action) => {
    if (selectedPosts.length === 0) return;
    
    try {
      setLoading(true);
      
      switch (action) {
        case 'approve':
          // Approuver les posts sélectionnés
          // await socialAPI.approveMultiplePosts(selectedPosts);
          break;
        case 'moderate':
          // Marquer comme modéré
          // await socialAPI.moderateMultiplePosts(selectedPosts);
          break;
        case 'delete':
          // Supprimer les posts
          // await socialAPI.deleteMultiplePosts(selectedPosts);
          break;
        default:
          break;
      }
      
      // Rafraîchir la liste
      await fetchPosts();
      setSelectedPosts([]);
      setBulkActionOpen(false);
    } catch (err) {
      console.error(`Erreur lors de l'action en masse "${action}":`, err);
      setError(`Une erreur est survenue lors de l'action en masse`);
    } finally {
      setLoading(false);
    }
  };

  // Confirmation de suppression
  const confirmDeletePost = (postId) => {
    setPostToDelete(postId);
    setConfirmDelete(true);
  };

  // Supprimer un post
  const deletePost = async () => {
    if (!postToDelete) return;
    
    try {
      setLoading(true);
      await socialAPI.deletePost(postToDelete);
      
      // Rafraîchir la liste
      await fetchPosts();
      setPostToDelete(null);
      setConfirmDelete(false);
    } catch (err) {
      console.error('Erreur lors de la suppression du post:', err);
      setError('Une erreur est survenue lors de la suppression du post');
    } finally {
      setLoading(false);
    }
  };

  // Convertir la date au format lisible
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return 'Date inconnue';
    }
  };

  // Tronquer le texte à une certaine longueur
  const truncateText = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  return (
    <div className={styles.adminPosts}>
      {/* En-tête */}
      <div className={styles.header}>
        <h1 className={styles.title}>Gestion des Posts</h1>
        <div className={styles.actions}>
          {selectedPosts.length > 0 && (
            <div className={styles.bulkActionContainer}>
              <button 
                className={styles.bulkActionButton}
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
              >
                Actions ({selectedPosts.length})
                <i className={`fas fa-chevron-${bulkActionOpen ? 'up' : 'down'}`}></i>
              </button>
              
              {bulkActionOpen && (
                <div className={styles.bulkActionDropdown}>
                  <button onClick={() => performBulkAction('approve')}>
                    <i className="fas fa-check"></i> Approuver
                  </button>
                  <button onClick={() => performBulkAction('moderate')}>
                    <i className="fas fa-eye"></i> Marquer comme modéré
                  </button>
                  <button onClick={() => performBulkAction('delete')}>
                    <i className="fas fa-trash"></i> Supprimer
                  </button>
                </div>
              )}
            </div>
          )}
          <button 
            className={styles.refreshButton}
            onClick={() => fetchPosts()}
            disabled={loading}
          >
            <i className={`fas fa-sync ${loading ? styles.spinning : ''}`}></i>
            Rafraîchir
          </button>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className={styles.filters}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <input 
              type="text" 
              placeholder="Rechercher par contenu, auteur..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>
        
        <div className={styles.filterControls}>
          <select 
            value={filters.visibility}
            onChange={(e) => setFilters({...filters, visibility: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">Tous les types de visibilité</option>
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Amis uniquement</option>
            <option value="PRIVATE">Privé</option>
          </select>
          
          <select 
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actif</option>
            <option value="moderated">Modéré</option>
            <option value="reported">Signalé</option>
          </select>
          
          <select 
            value={filters.hasMedia}
            onChange={(e) => setFilters({...filters, hasMedia: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">Tous les médias</option>
            <option value="true">Avec média</option>
            <option value="false">Sans média</option>
          </select>
          
          <select 
            value={filters.hasReports}
            onChange={(e) => setFilters({...filters, hasReports: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="">Tous les signalements</option>
            <option value="true">Avec signalements</option>
            <option value="false">Sans signalement</option>
          </select>
          
          <select 
            value={filters.sortBy}
            onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
            className={styles.filterSelect}
          >
            <option value="newest">Plus récents</option>
            <option value="oldest">Plus anciens</option>
            <option value="most_liked">Plus likés</option>
            <option value="most_commented">Plus commentés</option>
            <option value="most_reported">Plus signalés</option>
          </select>
          
          <button 
            onClick={resetFilters}
            className={styles.resetButton}
          >
            <i className="fas fa-times"></i>
            Réinitialiser
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Tableau des posts */}
      <div className={styles.tableContainer}>
        <table className={styles.postsTable}>
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectedPosts.length === posts.length && posts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Contenu</th>
              <th>Auteur</th>
              <th>Visibilité</th>
              <th>Date</th>
              <th>Likes</th>
              <th>Commentaires</th>
              <th>Signalements</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !posts.length ? (
              <tr>
                <td colSpan="11" className={styles.loadingCell}>
                  <div className={styles.loadingSpinner}></div>
                  Chargement des posts...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="11" className={styles.noDataCell}>
                  Aucun post trouvé
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post._id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedPosts.includes(post._id)}
                      onChange={(e) => handleSelectPost(e, post._id)}
                    />
                  </td>
                  <td className={styles.idCell}>{post._id}</td>
                  <td className={styles.contentCell}>
                    <div className={styles.contentPreview}>
                      {post.media && (
                        <div className={styles.mediaIndicator}>
                          <i className={`fas ${
                            post.type_media === 'IMAGE' ? 'fa-image' : 
                            post.type_media === 'VIDEO' ? 'fa-video' : 
                            post.type_media === 'AUDIO' ? 'fa-music' : 'fa-file'
                          }`}></i>
                        </div>
                      )}
                      <span>{truncateText(post.contenu)}</span>
                    </div>
                  </td>
                  <td className={styles.authorCell}>
                    {post.auteur ? (
                      <div className={styles.authorInfo}>
                        <div className={styles.authorAvatar}>
                          {post.auteur.photo_profil ? (
                            <img 
                              src={post.auteur.photo_profil}
                              alt={`${post.auteur.prenom} ${post.auteur.nom}`}
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {post.auteur.prenom?.[0] || ''}{post.auteur.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <span>{post.auteur.prenom} {post.auteur.nom}</span>
                      </div>
                    ) : (
                      <span className={styles.unknownAuthor}>Utilisateur inconnu</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${post.visibilite?.toLowerCase()}`]}`}>
                      {post.visibilite}
                    </span>
                  </td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td className={styles.likesCell}>
                    <div className={styles.statBadge}>
                      <i className="fas fa-heart"></i>
                      {post.likes?.length || 0}
                    </div>
                  </td>
                  <td className={styles.commentsCell}>
                    <div className={styles.statBadge}>
                      <i className="fas fa-comment"></i>
                      {post.commentaires?.length || 0}
                    </div>
                  </td>
                  <td className={styles.reportsCell}>
                    <div className={`${styles.statBadge} ${post.signalements?.length > 0 ? styles.hasReports : ''}`}>
                      <i className="fas fa-flag"></i>
                      {post.signalements?.length || 0}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[`status_${post.modere ? 'moderated' : 'active'}`]}`}>
                      {post.modere ? 'Modéré' : 'Actif'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionButtons}>
                      <Link 
                        to={`/admin/posts/${post._id}`} 
                        className={styles.actionButton}
                        title="Voir détails"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button 
                        className={styles.actionButton}
                        title={post.modere ? 'Approuver' : 'Modérer'}
                        onClick={() => {/* Fonction de modération */}}
                      >
                        <i className={`fas ${post.modere ? 'fa-check' : 'fa-shield-alt'}`}></i>
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Supprimer"
                        onClick={() => confirmDeletePost(post._id)}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-left"></i>
          </button>
          
          <div className={styles.pageInfo}>
            Page {currentPage} sur {totalPages} ({totalPosts} posts)
          </div>
          
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      )}

      {/* Modale de confirmation de suppression */}
      {confirmDelete && (
        <div className={styles.confirmDeleteModal}>
          <div className={styles.modalContent}>
            <h3>Confirmer la suppression</h3>
            <p>Êtes-vous sûr de vouloir supprimer ce post ? Cette action est irréversible.</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setConfirmDelete(false);
                  setPostToDelete(null);
                }}
              >
                Annuler
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={deletePost}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
/**
 * Media management functionality
 * @version 1.0.0
 * @author Library System Team
 */

// Global variables for media management
let media = [];
let filteredMedia = [];
let currentPage = 1;
let itemsPerPage = 5;
let currentMediaId = null;

/**
 * Initializes the media page
 */
function initMediaPage() {
  console.log('Media page initialized');
  loadMedia();
  setupEventListeners();
}

/**
 * Sets up event listeners for the media page
 */
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('media-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(performSearch, 300));
  }

  // Filter inputs
  const idFilter = document.getElementById('id-filter');
  const titelFilter = document.getElementById('titel-filter');

  if (idFilter) {
    idFilter.addEventListener('input', debounce(performSearch, 300));
  }
  if (titelFilter) {
    titelFilter.addEventListener('input', debounce(performSearch, 300));
  }
}

/**
 * Loads all media from the API
 */
async function loadMedia() {
  try {
    media = await apiRequest('/medium');

    // Check availability for each medium
    for (let medium of media) {
      try {
        const borrowing = await apiRequest(`/ausleihe/medium/${medium.id}`);
        medium.isAvailable = !borrowing;
      } catch (error) {
        // If borrowing doesn't exist, medium is available
        medium.isAvailable = true;
      }
    }

    filteredMedia = [...media];
    renderMediaTable();
    updateStatistics();
  } catch (error) {
    console.error('Error loading media:', error);
    showError('Fehler beim Laden der Medien');
  }
}

/**
 * Performs search and filtering on media
 */
function performSearch() {
  const searchTerm = document.getElementById('media-search').value.toLowerCase();
  const idFilter = document.getElementById('id-filter').value;
  const titelFilter = document.getElementById('titel-filter').value.toLowerCase();

  filteredMedia = media.filter(medium => {
    const matchesSearch = !searchTerm ||
      (medium.titel && medium.titel.toLowerCase().includes(searchTerm)) ||
      (medium.autor && medium.autor.toLowerCase().includes(searchTerm)) ||
      (medium.genre && medium.genre.toLowerCase().includes(searchTerm));

    const matchesId = !idFilter ||
      medium.id.toString().includes(idFilter);

    const matchesTitel = !titelFilter ||
      (medium.titel && medium.titel.toLowerCase().includes(titelFilter));

    return matchesSearch && matchesId && matchesTitel;
  });

  currentPage = 1;
  renderMediaTable();
}

/**
 * Renders the media table with pagination
 */
function renderMediaTable() {
  const tbody = document.getElementById('media-table-body');
  if (!tbody) return;

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageMedia = filteredMedia.slice(startIndex, endIndex);

  // Render table rows
  tbody.innerHTML = pageMedia.map(medium => {
    const statusIcon = medium.isAvailable ?
      '<i class="bi bi-check-circle-fill status-available"></i>' :
      '<i class="bi bi-x-circle-fill status-unavailable"></i>';

    const rating = medium.bewertung ? generateStarRating(medium.bewertung) : '';

    return `
            <tr class="media-row">
                <td>${medium.id}</td>
                <td>${medium.titel || ''}</td>
                <td>${medium.autor || ''}</td>
                <td>
                    ${medium.genre ? `<span class="genre-badge">${medium.genre}</span>` : ''}
                </td>
                <td>
                    <span class="rating-stars">${rating}</span>
                    ${medium.bewertung ? `<small class="text-muted ms-1">${medium.bewertung}/5</small>` : ''}
                </td>
                <td>${medium.isbn || medium.ean || ''}</td>
                <td>${medium.altersfreigabe || ''}</td>
                <td>${medium.standortcode || ''}</td>
                <td>${statusIcon}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-sm" onclick="editMedia(${medium.id})">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="deleteMedia(${medium.id})">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  }).join('');

  renderPagination();
}

/**
 * Generates star rating HTML
 * @param {number} rating - Rating value from 1-5
 * @returns {string} HTML string with star icons
 */
function generateStarRating(rating) {
  let stars = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;

  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="bi bi-star-fill"></i>';
  }

  if (hasHalfStar) {
    stars += '<i class="bi bi-star-half"></i>';
  }

  const emptyStars = 5 - Math.ceil(rating);
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="bi bi-star"></i>';
  }

  return stars;
}

/**
 * Renders pagination controls
 */
function renderPagination() {
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  const pagination = document.querySelector('.pagination');
  if (!pagination) return;

  // Generate pagination HTML
  let paginationHTML = `
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">Prev</a>
        </li>
    `;

  for (let i = 1; i <= totalPages; i++) {
    paginationHTML += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="changePage(${i})">${i}</a>
            </li>
        `;
  }

  paginationHTML += `
        <li class="page-item ${currentPage === totalPages || totalPages === 0 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">Next</a>
        </li>
    `;

  pagination.innerHTML = paginationHTML;
}

/**
 * Changes the current page
 * @param {number} page - Page number to switch to
 */
function changePage(page) {
  const totalPages = Math.ceil(filteredMedia.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderMediaTable();
  }
}

/**
 * Updates the statistics display
 */
function updateStatistics() {
  const available = media.filter(medium => medium.isAvailable).length;
  const unavailable = media.length - available;

  const availableElement = document.getElementById('available-media');
  const unavailableElement = document.getElementById('unavailable-media');

  if (availableElement) availableElement.textContent = available;
  if (unavailableElement) unavailableElement.textContent = unavailable;
}

/**
 * Opens the modal to add a new medium
 */
function addNewMedia() {
  currentMediaId = null;
  document.getElementById('mediaModalTitle').textContent = 'Neues Medium anlegen';
  document.getElementById('mediaForm').reset();

  const modal = new bootstrap.Modal(document.getElementById('mediaModal'));
  modal.show();
}

/**
 * Opens the modal to edit an existing medium
 * @param {number} mediaId - ID of the medium to edit
 */
async function editMedia(mediaId) {
  try {
    const medium = await apiRequest(`/medium/${mediaId}`);
    currentMediaId = mediaId;

    // Fill edit form with medium data
    document.getElementById('edit-genre').value = medium.genre || '';
    document.getElementById('edit-fsk').value = medium.altersfreigabe || '';
    document.getElementById('edit-isbn').value = medium.isbn || medium.ean || '';
    document.getElementById('edit-standortcode').value = medium.standortcode || '';

    const modal = new bootstrap.Modal(document.getElementById('editMediaModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading medium:', error);
    showError('Fehler beim Laden der Mediendaten');
  }
}

/**
 * Saves a new medium
 */
async function saveMedia() {
  const mediaData = {
    autor: document.getElementById('autor').value,
    titel: document.getElementById('titel').value
  };

  // Validation
  if (!mediaData.autor || !mediaData.titel) {
    showError('Autor und Titel sind Pflichtfelder');
    return;
  }

  try {
    await apiRequest('/medium', {
      method: 'POST',
      body: JSON.stringify(mediaData)
    });

    showSuccess('Medium erfolgreich hinzugefügt');

    // Close modal and reload media
    const modal = bootstrap.Modal.getInstance(document.getElementById('mediaModal'));
    modal.hide();
    loadMedia();
  } catch (error) {
    console.error('Error saving medium:', error);
    showError('Fehler beim Speichern des Mediums');
  }
}

/**
 * Updates an existing medium
 */
async function updateMedia() {
  if (!currentMediaId) return;

  const mediaData = {
    genre: document.getElementById('edit-genre').value,
    altersfreigabe: parseInt(document.getElementById('edit-fsk').value) || undefined,
    ean: document.getElementById('edit-isbn').value,
    standortcode: document.getElementById('edit-standortcode').value
  };

  // Remove undefined values
  Object.keys(mediaData).forEach(key => {
    if (mediaData[key] === undefined || mediaData[key] === '') {
      delete mediaData[key];
    }
  });

  try {
    await apiRequest(`/medium/${currentMediaId}`, {
      method: 'PUT',
      body: JSON.stringify(mediaData)
    });

    showSuccess('Medium erfolgreich aktualisiert');

    // Close modal and reload media
    const modal = bootstrap.Modal.getInstance(document.getElementById('editMediaModal'));
    modal.hide();
    loadMedia();
  } catch (error) {
    console.error('Error updating medium:', error);
    showError('Fehler beim Aktualisieren des Mediums');
  }
}

/**
 * Initiates deletion of a medium
 * @param {number} mediaId - ID of the medium to delete
 */
async function deleteMedia(mediaId) {
  currentMediaId = mediaId;

  try {
    const medium = await apiRequest(`/medium/${mediaId}`);

    // Update modal content with medium details
    const modalTitle = document.querySelector('#deleteMediaModal .modal-title');
    const modalBody = document.querySelector('#deleteMediaModal .modal-body p');

    modalTitle.textContent = `Medium "${medium.titel}" wirklich löschen?`;
    modalBody.innerHTML = `Möchten Sie das Medium "${medium.titel}" von ${medium.autor} wirklich löschen?<br>
                              Diese Aktion kann nicht rückgängig gemacht werden.`;

    const modal = new bootstrap.Modal(document.getElementById('deleteMediaModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading medium for deletion:', error);
    showError('Fehler beim Laden der Mediendaten');
  }
}

/**
 * Confirms and executes medium deletion
 */
async function confirmDeleteMedia() {
  if (!currentMediaId) return;

  try {
    await apiRequest(`/medium/${currentMediaId}`, {
      method: 'DELETE'
    });

    showSuccess('Medium erfolgreich gelöscht');

    // Close modal and reload media
    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteMediaModal'));
    modal.hide();
    loadMedia();
  } catch (error) {
    console.error('Error deleting medium:', error);
    showError('Fehler beim Löschen des Mediums');
  }
}

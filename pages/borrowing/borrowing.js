/**
 * Borrowing management functionality
 * @version 1.0.0
 * @author Library System Team
 */

// Global variables for borrowing management
let borrowings = [];
let filteredBorrowings = [];
let currentPage = 1;
let itemsPerPage = 5;
let currentBorrowingId = null;

/**
 * Initializes the borrowing page
 */
function initBorrowingPage() {
  console.log('Borrowing page initialized');
  loadBorrowings();
  setupEventListeners();
  setDefaultDate();
}

/**
 * Sets up event listeners for the borrowing page
 */
function setupEventListeners() {
  // Search input
  const searchInput = document.getElementById('borrowing-search');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(performSearch, 300));
  }
}

/**
 * Sets default date for borrowing form
 */
function setDefaultDate() {
  const dateInput = document.getElementById('verleihdatum');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.value = today;
  }
}

/**
 * Loads all borrowings from the API
 */
async function loadBorrowings() {
  try {
    borrowings = await apiRequest('/ausleihe');

    // Load customer and medium details for each borrowing
    for (let borrowing of borrowings) {
      try {
        // Load customer details
        if (borrowing.kunde && borrowing.kunde.id) {
          const customer = await apiRequest(`/kunde/${borrowing.kunde.id}`);
          borrowing.kunde = customer;
        }

        // Load medium details
        if (borrowing.medium && borrowing.medium.id) {
          const medium = await apiRequest(`/medium/${borrowing.medium.id}`);
          borrowing.medium = medium;
        }

        // Check if borrowing is extended (duration > 14 days)
        borrowing.isExtended = borrowing.leihdauer > 14;

        // Calculate return date
        if (borrowing.leihdatum) {
          const lendDate = new Date(borrowing.leihdatum);
          const returnDate = new Date(lendDate);
          returnDate.setDate(lendDate.getDate() + borrowing.leihdauer);
          borrowing.rueckgabedatum = returnDate.toISOString().split('T')[0];
        }

      } catch (error) {
        console.warn('Error loading details for borrowing:', borrowing.id, error);
      }
    }

    filteredBorrowings = [...borrowings];
    renderBorrowingTable();
    updateStatistics();
  } catch (error) {
    console.error('Error loading borrowings:', error);
    showError('Fehler beim Laden der Ausleihen');
  }
}

/**
 * Performs search on borrowings
 */
function performSearch() {
  const searchTerm = document.getElementById('borrowing-search').value.toLowerCase();

  filteredBorrowings = borrowings.filter(borrowing => {
    const customerName = borrowing.kunde ?
      `${borrowing.kunde.vorname} ${borrowing.kunde.familienname}`.toLowerCase() : '';
    const mediumTitle = borrowing.medium ? borrowing.medium.titel.toLowerCase() : '';

    return !searchTerm ||
      customerName.includes(searchTerm) ||
      mediumTitle.includes(searchTerm) ||
      (borrowing.id && borrowing.id.toString().includes(searchTerm));
  });

  currentPage = 1;
  renderBorrowingTable();
}

/**
 * Renders the borrowing table with pagination
 */
function renderBorrowingTable() {
  const tbody = document.getElementById('borrowing-table-body');
  if (!tbody) return;

  // Calculate pagination
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const pageBorrowings = filteredBorrowings.slice(startIndex, endIndex);

  // Render table rows
  tbody.innerHTML = pageBorrowings.map(borrowing => {
    const customerName = borrowing.kunde ?
      `${borrowing.kunde.id} - ${borrowing.kunde.vorname} ${borrowing.kunde.familienname}` :
      'Unbekannter Kunde';

    const mediumTitle = borrowing.medium ?
      `${borrowing.medium.id} - ${borrowing.medium.titel}` :
      'Unbekanntes Medium';

    const extendedBadge = borrowing.isExtended ?
      '<span class="extended-badge">Verlängert</span>' :
      '<i class="bi bi-check-circle-fill status-available"></i>';

    const leihdatum = borrowing.leihdatum ? formatDate(borrowing.leihdatum) : '';
    const rueckgabedatum = borrowing.rueckgabedatum ? formatDate(borrowing.rueckgabedatum) : '';

    // Check if overdue (return date is in the past)
    const isOverdue = borrowing.rueckgabedatum && new Date(borrowing.rueckgabedatum) < new Date();
    const dateClass = isOverdue ? 'overdue-warning' : '';

    return `
            <tr class="borrowing-row">
                <td>${borrowing.id}</td>
                <td>${customerName}</td>
                <td>${mediumTitle}</td>
                <td>${leihdatum}</td>
                <td class="${dateClass}">${rueckgabedatum}</td>
                <td>${extendedBadge}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-warning btn-sm" onclick="extendBorrowing(${borrowing.medium ? borrowing.medium.id : 0})"
                                title="Verlängern" ${borrowing.isExtended ? 'disabled' : ''}>
                            <i class="bi bi-clock"></i>
                        </button>
                        <button class="btn btn-danger btn-sm" onclick="returnBorrowing(${borrowing.medium ? borrowing.medium.id : 0})"
                                title="Zurückgeben">
                            <i class="bi bi-arrow-return-left"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
  }).join('');

  renderPagination();
}

/**
 * Renders pagination controls
 */
function renderPagination() {
  const totalPages = Math.ceil(filteredBorrowings.length / itemsPerPage);
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
  const totalPages = Math.ceil(filteredBorrowings.length / itemsPerPage);
  if (page >= 1 && page <= totalPages) {
    currentPage = page;
    renderBorrowingTable();
  }
}

/**
 * Updates the statistics display
 */
function updateStatistics() {
  const activeBorrowings = borrowings.length;
  const extendedBorrowings = borrowings.filter(b => b.isExtended).length;

  const activeElement = document.getElementById('active-borrowings');
  const extendedElement = document.getElementById('extended-borrowings');

  if (activeElement) activeElement.textContent = activeBorrowings;
  if (extendedElement) extendedElement.textContent = extendedBorrowings;
}

/**
 * Opens the modal to add a new borrowing
 */
function addNewBorrowing() {
  document.getElementById('borrowingForm').reset();
  setDefaultDate();

  const modal = new bootstrap.Modal(document.getElementById('borrowingModal'));
  modal.show();
}

/**
 * Saves a new borrowing
 */
async function saveBorrowing() {
  const borrowingData = {
    kunde: { id: parseInt(document.getElementById('kunde').value) },
    medium: { id: parseInt(document.getElementById('medium').value) }
  };

  // Validation
  if (!borrowingData.kunde.id || !borrowingData.medium.id) {
    showError('Kunde und Medium müssen angegeben werden');
    return;
  }

  try {
    await apiRequest('/ausleihe', {
      method: 'POST',
      body: JSON.stringify(borrowingData)
    });

    showSuccess('Ausleihe erfolgreich erstellt');

    // Close modal and reload borrowings
    const modal = bootstrap.Modal.getInstance(document.getElementById('borrowingModal'));
    modal.hide();
    loadBorrowings();
  } catch (error) {
    console.error('Error saving borrowing:', error);
    showError('Fehler beim Erstellen der Ausleihe');
  }
}

/**
 * Initiates extending a borrowing
 * @param {number} mediumId - ID of the medium to extend
 */
async function extendBorrowing(mediumId) {
  currentBorrowingId = mediumId;

  try {
    const borrowing = await apiRequest(`/ausleihe/medium/${mediumId}`);

    // Check if already extended
    if (borrowing.leihdauer > 14) {
      showError('Diese Ausleihe wurde bereits verlängert');
      return;
    }

    // Set default extension date (current return date + 14 days)
    const currentReturnDate = new Date(borrowing.leihdatum);
    currentReturnDate.setDate(currentReturnDate.getDate() + borrowing.leihdauer + 14);
    const newReturnDate = currentReturnDate.toISOString().split('T')[0];

    document.getElementById('verlangerungsdatum').value = newReturnDate;

    // Update modal title
    const modalTitle = document.querySelector('#extendBorrowingModal .modal-title');
    modalTitle.textContent = `Medium ${borrowing.medium.titel} verlängern`;

    const modal = new bootstrap.Modal(document.getElementById('extendBorrowingModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading borrowing for extension:', error);
    showError('Fehler beim Laden der Ausleihe');
  }
}

/**
 * Confirms and executes borrowing extension
 */
async function confirmExtendBorrowing() {
  if (!currentBorrowingId) return;

  try {
    await apiRequest(`/ausleihe/medium/${currentBorrowingId}`, {
      method: 'PUT'
    });

    showSuccess('Ausleihe erfolgreich verlängert');

    // Close modal and reload borrowings
    const modal = bootstrap.Modal.getInstance(document.getElementById('extendBorrowingModal'));
    modal.hide();
    loadBorrowings();
  } catch (error) {
    console.error('Error extending borrowing:', error);
    showError('Fehler beim Verlängern der Ausleihe');
  }
}

/**
 * Initiates returning a borrowing
 * @param {number} mediumId - ID of the medium to return
 */
async function returnBorrowing(mediumId) {
  currentBorrowingId = mediumId;

  try {
    const borrowing = await apiRequest(`/ausleihe/medium/${mediumId}`);

    // Update modal content
    const modalTitle = document.querySelector('#returnBorrowingModal .modal-title');
    const modalBody = document.querySelector('#returnBorrowingModal .modal-body p');

    modalTitle.textContent = `Ausleihe "${borrowing.medium.titel}" wirklich zurückgeben?`;
    modalBody.innerHTML = `Möchten Sie die Ausleihe "${borrowing.medium.titel}" wirklich zurückgeben?<br>
                              Diese Aktion kann nicht rückgängig gemacht werden.`;

    const modal = new bootstrap.Modal(document.getElementById('returnBorrowingModal'));
    modal.show();
  } catch (error) {
    console.error('Error loading borrowing for return:', error);
    showError('Fehler beim Laden der Ausleihe');
  }
}

/**
 * Confirms and executes borrowing return
 */
async function confirmReturnBorrowing() {
  if (!currentBorrowingId) return;

  try {
    await apiRequest(`/ausleihe/medium/${currentBorrowingId}`, {
      method: 'DELETE'
    });

    showSuccess('Ausleihe erfolgreich zurückgegeben');

    // Close modal and reload borrowings
    const modal = bootstrap.Modal.getInstance(document.getElementById('returnBorrowingModal'));
    modal.hide();
    loadBorrowings();
  } catch (error) {
    console.error('Error returning borrowing:', error);
    showError('Fehler beim Zurückgeben der Ausleihe');
  }
}

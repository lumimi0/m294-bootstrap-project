/**
 * Medienverwaltung für die Bibliotheks-Anwendung
 * @version 1.7
 * @author Luca Minotti
 */

// Konstanten für die API-Verbindung
const API_BASE_URL = 'http://192.168.1.93:8080/bibliothek';
const MEDIA_ENDPOINT = `${API_BASE_URL}/medium`;

// DOM-Elemente speichern
let searchInput;
let mediaTableBody;
let addMediaForm;
let editMediaForm;
let deleteModal;

/**
 * Initialisiert die Medienverwaltung beim Laden der Seite
 */
function initializeMediaManagement() {
    // DOM-Elemente holen
    searchInput = document.querySelector('.form-control[placeholder="Nach Medien suchen"]');
    mediaTableBody = document.querySelector('.table tbody');
    addMediaForm = document.querySelector('#addMediaModal form');
    editMediaForm = document.querySelector('#editMediaModal form');
    deleteModal = document.querySelector('#deleteMediaModal');

    // Event Listeners hinzufügen
    setupEventListeners();

    // Alle Medien beim Start laden
    loadAllMedia();
}

/**
 * Richtet alle Event Listeners ein
 */
function setupEventListeners() {
    // Such-Buttons
    document.getElementById('searchForId').addEventListener('click', () => searchMedia('id'));
    document.getElementById('searchForTitle').addEventListener('click', () => searchMedia('title'));
    document.getElementById('searchReset').addEventListener('click', resetSearch);

    // "Nur verfügbare" Button hinzufügen
    addAvailableOnlyButton();

    // Enter-Taste für Suche
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchMedia('id');
        }
    });

    // Formular-Submit Events
    addMediaForm.addEventListener('submit', handleAddMedia);
    
    // Edit Form Setup (falls das HTML korrigiert wird)
    if (editMediaForm) {
        editMediaForm.addEventListener('submit', handleEditMedia);
    }
}

/**
 * Fügt den "Nur verfügbare" Button zur Suchleiste hinzu
 */
function addAvailableOnlyButton() {
    const searchGroup = document.querySelector('.input-group');
    const availableButton = document.createElement('button');
    availableButton.id = 'searchAvailable';
    availableButton.className = 'btn btn-outline-secondary';
    availableButton.type = 'button';
    availableButton.textContent = 'Nur verfügbare';
    availableButton.addEventListener('click', loadAvailableMedia);
    
    // Button nach "Titel" einfügen
    const titleButton = document.getElementById('searchForTitle');
    titleButton.parentNode.insertBefore(availableButton, titleButton.nextSibling);
}

/**
 * Lädt alle Medien von der API
 * @returns {Promise<Array>} Liste aller Medien
 */
async function getAllMedia() {
    const response = await fetch(MEDIA_ENDPOINT);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden aller Medien');
    }
    
    return response.json();
}

/**
 * Lädt nur verfügbare Medien von der API
 * @returns {Promise<Array>} Liste aller verfügbaren Medien
 */
async function getAvailableMedia() {
    const response = await fetch(`${MEDIA_ENDPOINT}?verfuegbar=true`);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden verfügbarer Medien');
    }
    
    return response.json();
}

/**
 * Lädt und zeigt alle Medien an
 */
async function loadAllMedia() {
    try {
        const media = await getAllMedia();
        displayMedia(media);
    } catch (error) {
        console.error('Fehler beim Laden aller Medien:', error);
        displayEmptyTable('Fehler beim Laden der Medien.');
    }
}

/**
 * Lädt und zeigt nur verfügbare Medien an
 */
async function loadAvailableMedia() {
    try {
        const media = await getAvailableMedia();
        displayMedia(media);
        searchInput.value = ''; // Suchfeld leeren
    } catch (error) {
        console.error('Fehler beim Laden verfügbarer Medien:', error);
        displayEmptyTable('Fehler beim Laden der verfügbaren Medien.');
    }
}

/**
 * Führt eine Mediensuche basierend auf dem gewählten Typ durch
 * @param {string} searchType - Art der Suche: 'id' oder 'title'
 */
async function searchMedia(searchType) {
    const searchValue = searchInput.value.trim();
    
    if (!searchValue) {
        alert('Bitte geben Sie einen Suchbegriff ein.');
        return;
    }

    try {
        let media = [];
        
        switch (searchType) {
            case 'id':
                const medium = await getMediaById(parseInt(searchValue));
                media = medium ? [medium] : [];
                break;
            case 'title':
                media = await searchMediaByTitle(searchValue);
                break;
        }

        displayMedia(media);
    } catch (error) {
        console.error('Fehler bei der Suche:', error);
        alert('Fehler bei der Suche: ' + error.message);
    }
}

/**
 * Lädt ein Medium anhand seiner ID
 * @param {number} mediaId - Die Medien-ID
 * @returns {Promise<Object>} Das gefundene Medium
 */
async function getMediaById(mediaId) {
    const response = await fetch(`${MEDIA_ENDPOINT}/${mediaId}`);
    
    if (!response.ok) {
        throw new Error(`Medium mit ID ${mediaId} nicht gefunden`);
    }
    
    return response.json();
}

/**
 * Sucht Medien nach Titel
 * @param {string} title - Der Titel
 * @returns {Promise<Array>} Liste der gefundenen Medien
 */
async function searchMediaByTitle(title) {
    const response = await fetch(`${MEDIA_ENDPOINT}?titel=${encodeURIComponent(title)}`);
    
    if (!response.ok) {
        throw new Error('Fehler bei der Suche nach Titel');
    }
    
    return response.json();
}

/**
 * Zeigt die Medienliste in der Tabelle an
 * @param {Array} media - Liste der Medien
 */
function displayMedia(media) {
    mediaTableBody.innerHTML = '';

    if (media.length === 0) {
        displayEmptyTable('Keine Medien gefunden.');
        return;
    }

    media.forEach(medium => {
        const row = mediaTableBody.insertRow();
        
        // ID
        row.insertCell().textContent = medium.id || '-';
        
        // Titel
        row.insertCell().textContent = medium.titel || '-';
        
        // Autor
        row.insertCell().textContent = medium.autor || '-';
        
        // Genre
        row.insertCell().textContent = medium.genre || '-';
        
        // ISBN/EAN
        row.insertCell().textContent = medium.ean || '-';
        
        // FSK (Altersfreigabe)
        row.insertCell().textContent = medium.altersfreigabe || '-';
        
        // Standortcode
        row.insertCell().textContent = medium.standort || '-';
        
        // Aktions-Buttons
        const actionCell = row.insertCell();
        actionCell.innerHTML = `
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="editMedia(${medium.id})" title="Bearbeiten">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteMedia(${medium.id})" title="Löschen">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    });
}

/**
 * Zeigt eine leere Tabelle mit Platzhaltertext an
 * @param {string} message - Nachricht die angezeigt werden soll
 */
function displayEmptyTable(message = 'Verwenden Sie die Suchfunktion, um Medien zu finden.') {
    mediaTableBody.innerHTML = '';
    const row = mediaTableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.className = 'text-center text-muted py-5';
    cell.textContent = message;
}

/**
 * Setzt die Suche zurück und lädt alle Medien
 */
async function resetSearch() {
    searchInput.value = '';
    await loadAllMedia();
}

/**
 * Verarbeitet das Hinzufügen eines neuen Mediums
 * @param {Event} event - Das Submit-Event
 */
async function handleAddMedia(event) {
    event.preventDefault();
    
    const submitButton = addMediaForm.querySelector('button[type="submit"]');
    
    // Button während der Verarbeitung deaktivieren
    submitButton.disabled = true;
    submitButton.textContent = 'Wird hinzugefügt...';
    
    try {
        // Mediendaten sammeln
        const mediaData = {
            titel: addMediaForm.querySelector('#title').value.trim(),
            autor: addMediaForm.querySelector('#author').value.trim(),
            ean: addMediaForm.querySelector('#isbn').value.trim() || null,
            genre: addMediaForm.querySelector('#genre').value.trim() || null,
            altersfreigabe: addMediaForm.querySelector('#fsk').value.trim() ? 
                parseInt(addMediaForm.querySelector('#fsk').value.trim()) : null,
            standort: addMediaForm.querySelector('#shelfCode').value.trim() || null
        };
        
        // Validierung (Titel und Autor sind Pflicht laut API)
        if (!mediaData.titel || !mediaData.autor) {
            throw new Error('Titel und Autor sind Pflichtfelder');
        }
        
        // Medium erstellen
        await createMedia(mediaData);
        
        // Erfolg
        alert('Medium erfolgreich hinzugefügt!');
        addMediaForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addMediaModal')).hide();
        
        // Alle Medien neu laden
        await loadAllMedia();
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen:', error);
        alert('Fehler beim Hinzufügen des Mediums: ' + error.message);
    } finally {
        // Button wieder aktivieren
        submitButton.disabled = false;
        submitButton.textContent = 'Hinzufügen';
    }
}

/**
 * Erstellt ein neues Medium über die API
 * @param {Object} mediaData - Die Mediendaten
 * @returns {Promise<Object>} Das erstellte Medium
 */
async function createMedia(mediaData) {
    const response = await fetch(MEDIA_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(mediaData)
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Mediums');
    }
    
    return response.json();
}

/**
 * Öffnet das Modal zum Bearbeiten eines Mediums
 * @param {number} mediaId - Die Medien-ID
 */
async function editMedia(mediaId) {
    try {
        const medium = await getMediaById(mediaId);
        
        // Da das Edit-Modal im HTML falsche Felder hat, erstellen wir es dynamisch
        showEditMediaModal(medium);
        
    } catch (error) {
        console.error('Fehler beim Laden des Mediums:', error);
        alert('Fehler beim Laden des Mediums: ' + error.message);
    }
}

/**
 * Erstellt und zeigt das Edit-Modal für Medien
 * @param {Object} medium - Das zu bearbeitende Medium
 */
function showEditMediaModal(medium) {
    // Modal-Inhalt dynamisch erstellen
    const modalBody = document.querySelector('#editMediaModal .modal-body');
    modalBody.innerHTML = `
        <form>
            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="editGenre" class="form-label">Genre</label>
                    <input type="text" class="form-control" id="editGenre" value="${medium.genre || ''}" placeholder="Horror">
                </div>
                <div class="col-md-6">
                    <label for="editFsk" class="form-label">Altersfreigabe</label>
                    <input type="number" class="form-control" id="editFsk" value="${medium.altersfreigabe || ''}" placeholder="16">
                </div>
            </div>

            <div class="row mb-3">
                <div class="col-md-6">
                    <label for="editEan" class="form-label">ISBN / EAN</label>
                    <input type="text" class="form-control" id="editEan" value="${medium.ean || ''}" placeholder="978-3-765-51111-4">
                </div>
                <div class="col-md-6">
                    <label for="editStandort" class="form-label">Standortcode</label>
                    <input type="text" class="form-control" id="editStandort" value="${medium.standort || ''}" placeholder="12A">
                </div>
            </div>

            <div class="d-flex justify-content-end gap-3">
                <button type="button" class="btn btn-danger px-4" data-bs-dismiss="modal">Abbrechen</button>
                <button type="submit" class="btn btn-success px-4">Speichern</button>
            </div>
        </form>
    `;
    
    // Event Listener für das Form hinzufügen
    const form = modalBody.querySelector('form');
    form.addEventListener('submit', (event) => handleEditMedia(event, medium.id));
    
    // Modal anzeigen
    new bootstrap.Modal(document.getElementById('editMediaModal')).show();
}

/**
 * Verarbeitet die Bearbeitung eines Mediums
 * @param {Event} event - Das Submit-Event
 * @param {number} mediaId - Die Medien-ID
 */
async function handleEditMedia(event, mediaId) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Wird gespeichert...';
    
    try {
        const updateData = {
            genre: form.querySelector('#editGenre').value.trim() || null,
            altersfreigabe: form.querySelector('#editFsk').value.trim() ? 
                parseInt(form.querySelector('#editFsk').value.trim()) : null,
            ean: form.querySelector('#editEan').value.trim() || null,
            standort: form.querySelector('#editStandort').value.trim() || null
        };
        
        await updateMedia(mediaId, updateData);
        
        alert('Medium erfolgreich aktualisiert!');
        bootstrap.Modal.getInstance(document.getElementById('editMediaModal')).hide();
        
        // Alle Medien neu laden
        await loadAllMedia();
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        alert('Fehler beim Aktualisieren des Mediums: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Speichern';
    }
}

/**
 * Aktualisiert ein Medium über die API
 * @param {number} mediaId - Die Medien-ID
 * @param {Object} updateData - Die zu aktualisierenden Daten
 */
async function updateMedia(mediaId, updateData) {
    const response = await fetch(`${MEDIA_ENDPOINT}/${mediaId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren des Mediums');
    }
    
    return response.json();
}

/**
 * Löscht ein Medium nach Bestätigung
 * @param {number} mediaId - Die Medien-ID
 */
async function deleteMedia(mediaId) {
    try {
        const medium = await getMediaById(mediaId);
        const mediaInfo = `"${medium.titel}" von ${medium.autor}`;
        
        // Modal-Inhalt aktualisieren
        deleteModal.querySelector('#deleteMediaModalLabel').textContent = 
            `Medium ${mediaInfo} wirklich löschen?`;
        deleteModal.querySelector('p').innerHTML = 
            `Möchten Sie das Medium <strong>${mediaInfo}</strong> wirklich löschen?<br>Diese Aktion kann nicht rückgängig gemacht werden.`;
        
        // Delete-Button Event Listener
        const deleteButton = deleteModal.querySelector('.btn-danger');
        deleteButton.onclick = () => confirmDeleteMedia(mediaId);
        
        // Modal anzeigen
        new bootstrap.Modal(deleteModal).show();
        
    } catch (error) {
        console.error('Fehler beim Laden des Mediums:', error);
        alert('Fehler beim Laden des Mediums: ' + error.message);
    }
}

/**
 * Bestätigt und führt die Löschung durch
 * @param {number} mediaId - Die Medien-ID
 */
async function confirmDeleteMedia(mediaId) {
    const deleteButton = deleteModal.querySelector('.btn-danger');
    
    // Button während der Verarbeitung deaktivieren
    deleteButton.disabled = true;
    deleteButton.textContent = 'Wird gelöscht...';
    
    try {
        await deleteMediaById(mediaId);
        
        alert('Medium erfolgreich gelöscht!');
        bootstrap.Modal.getInstance(deleteModal).hide();
        
        // Medium aus Tabelle entfernen
        removeMediaFromTable(mediaId);
        
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen des Mediums: ' + error.message);
    } finally {
        // Button wieder aktivieren
        deleteButton.disabled = false;
        deleteButton.textContent = 'Löschen';
    }
}

/**
 * Löscht ein Medium über die API
 * @param {number} mediaId - Die Medien-ID
 */
async function deleteMediaById(mediaId) {
    const response = await fetch(`${MEDIA_ENDPOINT}/${mediaId}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Löschen des Mediums');
    }
}

/**
 * Entfernt ein Medium aus der Tabelle
 * @param {number} mediaId - Die Medien-ID
 */
function removeMediaFromTable(mediaId) {
    const rows = mediaTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === mediaId.toString()) {
            row.remove();
        }
    });
    
    // Alle Medien neu laden wenn Tabelle leer
    if (mediaTableBody.children.length === 0) {
        loadAllMedia();
    }
}

// Event Listener für das Laden der Seite
document.addEventListener('DOMContentLoaded', initializeMediaManagement);

// Globale Funktionen für HTML onclick Events
window.editMedia = editMedia;
window.deleteMedia = deleteMedia;
/**
 * Ausleihverwaltung für die Bibliotheks-Anwendung
 * @version 1.5
 * @author Luca Minotti
 */

// Konstanten für die API-Verbindung
const API_BASE_URL = 'http://192.168.1.93:8080/bibliothek';
const BORROWING_ENDPOINT = `${API_BASE_URL}/ausleihe`;
const CUSTOMER_ENDPOINT = `${API_BASE_URL}/kunde`;
const MEDIA_ENDPOINT = `${API_BASE_URL}/medium`;

// DOM-Elemente speichern
let searchInput;
let borrowingTableBody;
let addBorrowingForm;
let customerSelect;
let mediaSelect;
let dateFromInput;
let extendModal;
let deleteModal;

/**
 * Initialisiert die Ausleihverwaltung beim Laden der Seite
 */
function initializeBorrowingManagement() {
    // DOM-Elemente holen
    searchInput = document.querySelector('.form-control[placeholder="Nach Kundennummer oder Familienname suchen"]');
    borrowingTableBody = document.querySelector('.table tbody');
    addBorrowingForm = document.querySelector('#addBorrowingModal form');
    customerSelect = document.getElementById('customer-select');
    mediaSelect = document.getElementById('media-select');
    dateFromInput = document.getElementById('date-from');
    extendModal = document.getElementById('extendBorrowingModal');
    deleteModal = document.getElementById('deleteBorrowingModal');

    // Event Listeners hinzufügen
    setupEventListeners();

    // Alle Ausleihen beim Start laden
    loadAllBorrowings();

    // Heutiges Datum als Standard setzen
    setTodaysDate();

    // Kunden und Medien für Selects laden
    loadCustomersForSelect();
    loadMediaForSelect();
}

/**
 * Richtet alle Event Listeners ein
 */
function setupEventListeners() {
    // Such-Buttons
    document.getElementById('searchForCustomerId').addEventListener('click', () => searchBorrowings('customerId'));
    document.getElementById('searchForLastname').addEventListener('click', () => searchBorrowings('lastname'));
    document.getElementById('searchForMediaId').addEventListener('click', () => searchBorrowings('mediaId'));
    document.getElementById('searchForReminder').addEventListener('click', () => searchBorrowings('reminder'));
    document.getElementById('searchReset').addEventListener('click', resetSearch);

    // Enter-Taste für Suche
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const value = searchInput.value.trim();
            // Automatisch zwischen ID und Name unterscheiden
            if (/^\d+$/.test(value)) {
                searchBorrowings('customerId');
            } else {
                searchBorrowings('lastname');
            }
        }
    });

    // Formular-Submit Event
    addBorrowingForm.addEventListener('submit', handleAddBorrowing);

    // Modal Event Listener für Neuladen der Daten
    document.getElementById('addBorrowingModal').addEventListener('show.bs.modal', () => {
        loadCustomersForSelect();
        loadMediaForSelect();
        setTodaysDate();
    });
}

/**
 * Setzt das heutige Datum als Standard
 */
function setTodaysDate() {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    dateFromInput.value = todayString;
}

/**
 * Lädt alle Kunden für das Select-Element
 */
async function loadCustomersForSelect() {
    try {
        const customers = await getAllCustomers();
        customerSelect.innerHTML = '<option value="">Kunde auswählen...</option>';
        
        customers.forEach(customer => {
            const option = document.createElement('option');
            option.value = customer.id;
            option.textContent = `${customer.vorname} ${customer.familienname} (ID: ${customer.id})`;
            customerSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Kunden:', error);
        customerSelect.innerHTML = '<option value="">Fehler beim Laden der Kunden</option>';
    }
}

/**
 * Lädt alle verfügbaren Medien für das Select-Element
 */
async function loadMediaForSelect() {
    try {
        const media = await getAvailableMedia();
        mediaSelect.innerHTML = '<option value="">Medium auswählen...</option>';
        
        media.forEach(medium => {
            const option = document.createElement('option');
            option.value = medium.id;
            option.textContent = `${medium.titel} - ${medium.autor} (ID: ${medium.id})`;
            mediaSelect.appendChild(option);
        });
    } catch (error) {
        console.error('Fehler beim Laden der Medien:', error);
        mediaSelect.innerHTML = '<option value="">Fehler beim Laden der Medien</option>';
    }
}

/**
 * Lädt alle Kunden von der API
 * @returns {Promise<Array>} Liste aller Kunden
 */
async function getAllCustomers() {
    const response = await fetch(`${CUSTOMER_ENDPOINT}?familienname=`);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden der Kunden');
    }
    
    return response.json();
}

/**
 * Lädt alle verfügbaren Medien von der API
 * @returns {Promise<Array>} Liste verfügbarer Medien
 */
async function getAvailableMedia() {
    const response = await fetch(`${MEDIA_ENDPOINT}?verfuegbar=true`);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden der verfügbaren Medien');
    }
    
    return response.json();
}

/**
 * Lädt alle Ausleihen von der API
 * @returns {Promise<Array>} Liste aller Ausleihen
 */
async function getAllBorrowings() {
    const response = await fetch(BORROWING_ENDPOINT);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden aller Ausleihen');
    }
    
    return response.json();
}

/**
 * Lädt und zeigt alle Ausleihen an
 */
async function loadAllBorrowings() {
    try {
        const borrowings = await getAllBorrowings();
        displayBorrowings(borrowings);
    } catch (error) {
        console.error('Fehler beim Laden aller Ausleihen:', error);
        displayEmptyTable('Fehler beim Laden der Ausleihen.');
    }
}

/**
 * Führt eine Ausleihsuche basierend auf dem gewählten Typ durch
 * @param {string} searchType - Art der Suche: 'customerId', 'lastname', 'mediaId' oder 'reminder'
 */
async function searchBorrowings(searchType) {
    try {
        let borrowings = [];
        
        switch (searchType) {
            case 'customerId':
                const customerIdValue = searchInput.value.trim();
                if (!customerIdValue || !/^\d+$/.test(customerIdValue)) {
                    alert('Bitte geben Sie eine gültige Kundennummer ein.');
                    return;
                }
                borrowings = await searchBorrowingsByCustomerId(parseInt(customerIdValue));
                break;
                
            case 'lastname':
                const lastnameValue = searchInput.value.trim();
                if (!lastnameValue) {
                    alert('Bitte geben Sie einen Familiennamen ein.');
                    return;
                }
                borrowings = await searchBorrowingsByLastname(lastnameValue);
                break;
                
            case 'mediaId':
                const mediaIdValue = searchInput.value.trim();
                if (!mediaIdValue || !/^\d+$/.test(mediaIdValue)) {
                    alert('Bitte geben Sie eine gültige Medium-ID ein.');
                    return;
                }
                const singleBorrowing = await searchBorrowingByMediaId(parseInt(mediaIdValue));
                borrowings = singleBorrowing ? [singleBorrowing] : [];
                break;
                
            case 'reminder':
                borrowings = await getAllReminders();
                searchInput.value = ''; // Bei Mahnungen Suchfeld leeren
                break;
        }

        displayBorrowings(borrowings);
    } catch (error) {
        console.error('Fehler bei der Suche:', error);
        alert('Fehler bei der Suche: ' + error.message);
    }
}

/**
 * Sucht Ausleihen nach Kundennummer
 * @param {number} customerId - Die Kundennummer
 * @returns {Promise<Array>} Liste der gefundenen Ausleihen
 */
async function searchBorrowingsByCustomerId(customerId) {
    const response = await fetch(`${BORROWING_ENDPOINT}/kunde/${customerId}`);
    
    if (!response.ok) {
        throw new Error('Fehler bei der Suche nach Kundennummer');
    }
    
    return response.json();
}

/**
 * Sucht Ausleihen nach Familienname des Kunden
 * @param {string} lastname - Der Familienname
 * @returns {Promise<Array>} Liste der gefundenen Ausleihen
 */
async function searchBorrowingsByLastname(lastname) {
    const response = await fetch(`${BORROWING_ENDPOINT}/kunde?familienname=${encodeURIComponent(lastname)}`);
    
    if (!response.ok) {
        throw new Error('Fehler bei der Suche nach Familienname');
    }
    
    return response.json();
}

/**
 * Sucht Ausleihe nach Medium-ID
 * @param {number} mediaId - Die Medium-ID
 * @returns {Promise<Object|null>} Die gefundene Ausleihe oder null
 */
async function searchBorrowingByMediaId(mediaId) {
    try {
        const response = await fetch(`${BORROWING_ENDPOINT}/medium/${mediaId}`);
        
        if (!response.ok) {
            return null;
        }
        
        return response.json();
    } catch (error) {
        return null;
    }
}

/**
 * Lädt alle Mahnungen (überfällige Ausleihen)
 * @returns {Promise<Array>} Liste aller Mahnungen
 */
async function getAllReminders() {
    const response = await fetch(`${BORROWING_ENDPOINT}/mahnung`);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden der Mahnungen');
    }
    
    return response.json();
}

/**
 * Zeigt die Ausleihenliste in der Tabelle an
 * @param {Array} borrowings - Liste der Ausleihen
 */
function displayBorrowings(borrowings) {
    borrowingTableBody.innerHTML = '';

    if (borrowings.length === 0) {
        displayEmptyTable('Keine Ausleihen gefunden.');
        return;
    }

    borrowings.forEach(borrowing => {
        const row = borrowingTableBody.insertRow();
        
        // ID - für Mahnungen verwenden wir die Medium-ID
        const mediaId = borrowing.inventarnummer || borrowing.medium?.id || borrowing.id;
        row.insertCell().textContent = mediaId || '-';
        
        // Kunde
        const customerInfo = borrowing.kunde ? 
            `${borrowing.kunde.vorname || ''} ${borrowing.kunde.familienname || ''}`.trim() : 
            `${borrowing.vorname || ''} ${borrowing.familienname || ''}`.trim() || '-';
        row.insertCell().textContent = customerInfo;
        
        // Medium
        const mediaInfo = borrowing.medium?.titel || borrowing.titel || '-';
        row.insertCell().textContent = mediaInfo;
        
        // Ausleihdatum
        const borrowingDate = borrowing.leihdatum ? 
            new Date(borrowing.leihdatum).toLocaleDateString('de-DE') : '-';
        row.insertCell().textContent = borrowingDate;
        
        // Rückgabedatum berechnen
        const returnDate = calculateReturnDate(borrowing.leihdatum, borrowing.leihdauer);
        row.insertCell().textContent = returnDate;
        
        // Verlängert Status
        const isExtended = (borrowing.leihdauer || 14) > 14;
        const extendedCell = row.insertCell();
        extendedCell.innerHTML = `<span class="badge ${isExtended ? 'bg-success' : 'bg-secondary'}">${isExtended ? 'Ja' : 'Nein'}</span>`;
        
        // Aktions-Buttons
        const actionCell = row.insertCell();
        const maxExtended = (borrowing.leihdauer || 14) >= 28;
        
        actionCell.innerHTML = `
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="extendBorrowing(${mediaId}, ${borrowing.leihdauer || 14}, ${maxExtended})" 
                        title="Verlängern" ${maxExtended ? 'disabled' : ''}>
                    <i class="bi bi-arrow-clockwise"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="returnBorrowing(${mediaId})" title="Zurückgeben">
                    <i class="bi bi-box-arrow-in-left"></i>
                </button>
            </div>
        `;
    });
}

/**
 * Berechnet das Rückgabedatum basierend auf Leihdatum und Leihdauer
 * @param {string} leihdatum - Das Leihdatum
 * @param {number} leihdauer - Die Leihdauer in Tagen
 * @returns {string} Das formatierte Rückgabedatum
 */
function calculateReturnDate(leihdatum, leihdauer) {
    if (!leihdatum) return '-';
    
    const borrowDate = new Date(leihdatum);
    const returnDate = new Date(borrowDate);
    returnDate.setDate(borrowDate.getDate() + (leihdauer || 14));
    
    return returnDate.toLocaleDateString('de-DE');
}

/**
 * Zeigt eine leere Tabelle mit Platzhaltertext an
 * @param {string} message - Nachricht die angezeigt werden soll
 */
function displayEmptyTable(message = 'Verwenden Sie die Suchfunktion, um Ausleihen zu finden.') {
    borrowingTableBody.innerHTML = '';
    const row = borrowingTableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 7;
    cell.className = 'text-center text-muted py-5';
    cell.textContent = message;
}

/**
 * Setzt die Suche zurück und lädt alle Ausleihen
 */
async function resetSearch() {
    searchInput.value = '';
    await loadAllBorrowings();
}

/**
 * Verarbeitet das Hinzufügen einer neuen Ausleihe
 * @param {Event} event - Das Submit-Event
 */
async function handleAddBorrowing(event) {
    event.preventDefault();
    
    const submitButton = addBorrowingForm.querySelector('button[type="submit"]');
    
    // Button während der Verarbeitung deaktivieren
    submitButton.disabled = true;
    submitButton.textContent = 'Wird hinzugefügt...';
    
    try {
        // Eingabedaten extrahieren
        const customerId = parseInt(customerSelect.value);
        const mediaId = parseInt(mediaSelect.value);
        
        if (!customerId || !mediaId) {
            throw new Error('Bitte wählen Sie sowohl einen Kunden als auch ein Medium aus.');
        }
        
        // Ausleihedaten erstellen
        const borrowingData = {
            kunde: { id: customerId },
            medium: { id: mediaId }
        };
        
        // Ausleihe erstellen
        await createBorrowing(borrowingData);
        
        // Erfolg
        alert('Ausleihe erfolgreich hinzugefügt!');
        addBorrowingForm.reset();
        setTodaysDate(); // Datum zurücksetzen
        bootstrap.Modal.getInstance(document.getElementById('addBorrowingModal')).hide();
        
        // Alle Ausleihen neu laden
        await loadAllBorrowings();
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen:', error);
        alert('Fehler beim Hinzufügen der Ausleihe: ' + error.message);
    } finally {
        // Button wieder aktivieren
        submitButton.disabled = false;
        submitButton.textContent = 'Hinzufügen';
    }
}

/**
 * Erstellt eine neue Ausleihe über die API
 * @param {Object} borrowingData - Die Ausleihedaten
 * @returns {Promise<Object>} Die erstellte Ausleihe
 */
async function createBorrowing(borrowingData) {
    const response = await fetch(BORROWING_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(borrowingData)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Fehler beim Erstellen der Ausleihe: ${errorText}`);
    }
    
    return response.json();
}

/**
 * Verlängert eine Ausleihe
 * @param {number} mediaId - Die Medium-ID
 * @param {number} currentDuration - Aktuelle Leihdauer
 * @param {boolean} isMaxExtended - Ob bereits maximal verlängert
 */
async function extendBorrowing(mediaId, currentDuration, isMaxExtended) {
    try {
        // Modal-Inhalt aktualisieren
        const modalBody = extendModal.querySelector('.modal-body p');
        const extendButton = extendModal.querySelector('#extend-borrowing');
        
        if (isMaxExtended) {
            modalBody.innerHTML = `
                <strong>Warnung:</strong> Diese Ausleihe wurde bereits auf die maximale Dauer von 28 Tagen verlängert.<br>
                Eine weitere Verlängerung ist nicht möglich.
            `;
            extendButton.style.display = 'none';
            extendModal.querySelector('.btn-danger').textContent = 'OK';
        } else {
            const newDuration = currentDuration + 14;
            const willBeMaxExtended = newDuration >= 28;
            
            modalBody.innerHTML = `
                Möchten Sie die Ausleihe wirklich verlängern?<br>
                Die neue Leihdauer wird ${newDuration} Tage betragen.
                ${willBeMaxExtended ? '<br><strong>Hinweis:</strong> Nach dieser Verlängerung ist keine weitere Verlängerung möglich.' : ''}
            `;
            
            extendButton.style.display = 'inline-block';
            extendButton.onclick = () => confirmExtendBorrowing(mediaId);
            extendModal.querySelector('.btn-danger').textContent = 'Abbrechen';
        }
        
        // Modal anzeigen
        new bootstrap.Modal(extendModal).show();
        
    } catch (error) {
        console.error('Fehler beim Vorbereiten der Verlängerung:', error);
        alert('Fehler: ' + error.message);
    }
}

/**
 * Bestätigt und führt die Verlängerung durch
 * @param {number} mediaId - Die Medium-ID
 */
async function confirmExtendBorrowing(mediaId) {
    const extendButton = extendModal.querySelector('#extend-borrowing');
    
    // Button während der Verarbeitung deaktivieren
    extendButton.disabled = true;
    extendButton.textContent = 'Wird verlängert...';
    
    try {
        await extendBorrowingById(mediaId);
        
        alert('Ausleihe erfolgreich verlängert!');
        bootstrap.Modal.getInstance(extendModal).hide();
        
        // Alle Ausleihen neu laden
        await loadAllBorrowings();
        
    } catch (error) {
        console.error('Fehler beim Verlängern:', error);
        alert('Fehler beim Verlängern der Ausleihe: ' + error.message);
    } finally {
        // Button wieder aktivieren
        extendButton.disabled = false;
        extendButton.textContent = 'Verlängern';
    }
}

/**
 * Verlängert eine Ausleihe über die API
 * @param {number} mediaId - Die Medium-ID
 */
async function extendBorrowingById(mediaId) {
    const response = await fetch(`${BORROWING_ENDPOINT}/medium/${mediaId}`, {
        method: 'PUT'
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Verlängern der Ausleihe');
    }
}

/**
 * Gibt ein Medium zurück (löscht die Ausleihe)
 * @param {number} mediaId - Die Medium-ID
 */
async function returnBorrowing(mediaId) {
    try {
        // Ausleihe-Details für Modal laden
        const borrowing = await getBorrowingByMediaId(mediaId);
        const mediaInfo = borrowing?.medium?.titel || `Medium ID: ${mediaId}`;
        
        // Modal-Inhalt aktualisieren
        deleteModal.querySelector('#deleteBorrowingModalLabel').textContent = 
            `Medium "${mediaInfo}" zurückgeben`;
        deleteModal.querySelector('p').innerHTML = 
            `Möchten Sie das Medium <strong>"${mediaInfo}"</strong> wirklich zurückgeben?<br>Die Ausleihe wird dadurch gelöscht.`;
        
        // Return-Button Event Listener
        const returnButton = deleteModal.querySelector('#return-borrowing');
        returnButton.onclick = () => confirmReturnBorrowing(mediaId);
        
        // Modal anzeigen
        new bootstrap.Modal(deleteModal).show();
        
    } catch (error) {
        console.error('Fehler beim Laden der Ausleihe:', error);
        // Fallback: Direkt bestätigen ohne Details
        if (confirm(`Medium ID ${mediaId} wirklich zurückgeben?`)) {
            await confirmReturnBorrowing(mediaId);
        }
    }
}

/**
 * Lädt eine Ausleihe anhand der Medium-ID
 * @param {number} mediaId - Die Medium-ID
 * @returns {Promise<Object>} Die gefundene Ausleihe
 */
async function getBorrowingByMediaId(mediaId) {
    const response = await fetch(`${BORROWING_ENDPOINT}/medium/${mediaId}`);
    
    if (!response.ok) {
        throw new Error(`Ausleihe für Medium ${mediaId} nicht gefunden`);
    }
    
    return response.json();
}

/**
 * Bestätigt und führt die Rückgabe durch
 * @param {number} mediaId - Die Medium-ID
 */
async function confirmReturnBorrowing(mediaId) {
    const returnButton = deleteModal.querySelector('#return-borrowing');
    
    // Button während der Verarbeitung deaktivieren
    returnButton.disabled = true;
    returnButton.textContent = 'Wird zurückgegeben...';
    
    try {
        await returnBorrowingById(mediaId);
        
        alert('Medium erfolgreich zurückgegeben!');
        bootstrap.Modal.getInstance(deleteModal).hide();
        
        // Alle Ausleihen neu laden
        await loadAllBorrowings();
        
    } catch (error) {
        console.error('Fehler bei der Rückgabe:', error);
        alert('Fehler bei der Rückgabe: ' + error.message);
    } finally {
        // Button wieder aktivieren
        returnButton.disabled = false;
        returnButton.textContent = 'Zurückgeben';
    }
}

/**
 * Gibt ein Medium über die API zurück (löscht die Ausleihe)
 * @param {number} mediaId - Die Medium-ID
 */
async function returnBorrowingById(mediaId) {
    const response = await fetch(`${BORROWING_ENDPOINT}/medium/${mediaId}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Fehler bei der Rückgabe des Mediums');
    }
}

// Event Listener für das Laden der Seite
document.addEventListener('DOMContentLoaded', initializeBorrowingManagement);

// Globale Funktionen für HTML onclick Events
window.extendBorrowing = extendBorrowing;
window.returnBorrowing = returnBorrowing;
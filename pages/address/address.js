/**
 * Adressverwaltung für die Bibliotheks-Anwendung
 * @version 1.7
 * @author Luca Minotti
 */

// Konstanten für die API-Verbindung
const API_BASE_URL = 'http://192.168.1.93:8080/bibliothek';
const ADDRESS_ENDPOINT = `${API_BASE_URL}/adresse`;

// DOM-Elemente speichern
let searchInput;
let addressTableBody;
let addAddressForm;
let deleteModal;

/**
 * Initialisiert die Adressverwaltung beim Laden der Seite
 */
function initializeAddressManagement() {
    // DOM-Elemente holen
    searchInput = document.querySelector('.form-control[placeholder="Nach Adressen suchen"]');
    addressTableBody = document.querySelector('.table tbody');
    addAddressForm = document.querySelector('#addAddressModal form');
    deleteModal = document.querySelector('#deleteAddressModal');

    // Event Listeners hinzufügen
    setupEventListeners();

    // Alle Adressen beim Start laden
    loadAllAddresses();
}

/**
 * Richtet alle Event Listeners ein
 */
function setupEventListeners() {
    // Such-Buttons
    document.getElementById('searchForId').addEventListener('click', () => searchAddresses('id'));
    document.getElementById('searchForStreet').addEventListener('click', () => searchAddresses('street'));
    document.getElementById('searchForZip').addEventListener('click', () => searchAddresses('zip'));
    document.getElementById('searchReset').addEventListener('click', resetSearch);

    // Enter-Taste für Suche
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchAddresses('id');
        }
    });

    // Formular-Submit Event
    addAddressForm.addEventListener('submit', handleAddAddress);
}

/**
 * Führt eine Adresssuche basierend auf dem gewählten Typ durch
 * @param {string} searchType - Art der Suche: 'id', 'street' oder 'zip'
 */
async function searchAddresses(searchType) {
    const searchValue = searchInput.value.trim();
    
    if (!searchValue) {
        alert('Bitte geben Sie einen Suchbegriff ein.');
        return;
    }

    try {
        let addresses = [];
        
        switch (searchType) {
            case 'id':
                const address = await getAddressById(parseInt(searchValue));
                addresses = address ? [address] : [];
                break;
            case 'street':
                addresses = await searchAddressesByStreet(searchValue);
                break;
            case 'zip':
                addresses = await searchAddressesByZip(parseInt(searchValue));
                break;
        }

        displayAddresses(addresses);
    } catch (error) {
        console.error('Fehler bei der Suche:', error);
        alert('Fehler bei der Suche: ' + error.message);
    }
}

/**
 * Lädt alle Adressen von der API
 * @returns {Promise<Array>} Liste aller Adressen
 */
async function getAllAddresses() {
    const response = await fetch(ADDRESS_ENDPOINT);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden aller Adressen');
    }
    
    return response.json();
}

/**
 * Lädt und zeigt alle Adressen an
 */
async function loadAllAddresses() {
    try {
        const addresses = await getAllAddresses();
        displayAddresses(addresses);
    } catch (error) {
        console.error('Fehler beim Laden aller Adressen:', error);
        displayEmptyTable('Fehler beim Laden der Adressen.');
    }
}
async function getAddressById(addressId) {
    const response = await fetch(`${ADDRESS_ENDPOINT}/${addressId}`);
    
    if (!response.ok) {
        throw new Error(`Adresse mit ID ${addressId} nicht gefunden`);
    }
    
    return response.json();
}

/**
 * Sucht Adressen nach Strasse
 * @param {string} street - Die Strasse
 * @returns {Promise<Array>} Liste der gefundenen Adressen
 */
async function searchAddressesByStreet(street) {
    const response = await fetch(`${ADDRESS_ENDPOINT}?strasse=${encodeURIComponent(street)}`);
    
    if (!response.ok) {
        throw new Error('Fehler bei der Suche nach Strasse');
    }
    
    return response.json();
}

/**
 * Sucht Adressen nach PLZ
 * @param {number} zip - Die Postleitzahl
 * @returns {Promise<Array>} Liste der gefundenen Adressen
 */
async function searchAddressesByZip(zip) {
    const response = await fetch(`${ADDRESS_ENDPOINT}?plz=${zip}`);
    
    if (!response.ok) {
        throw new Error('Fehler bei der Suche nach PLZ');
    }
    
    return response.json();
}

/**
 * Zeigt die Adressenliste in der Tabelle an
 * @param {Array} addresses - Liste der Adressen
 */
function displayAddresses(addresses) {
    addressTableBody.innerHTML = '';

    if (addresses.length === 0) {
        displayEmptyTable('Keine Adressen gefunden.');
        return;
    }

    addresses.forEach(address => {
        const row = addressTableBody.insertRow();
        
        // ID
        row.insertCell().textContent = address.id || '-';
        
        // Strasse (ohne Hausnummer)
        const streetParts = splitStreetAndNumber(address.strasse);
        row.insertCell().textContent = streetParts.street || '-';
        
        // Hausnummer
        row.insertCell().textContent = streetParts.number || '-';
        
        // Stadt/Ort
        row.insertCell().textContent = address.ort || '-';
        
        // PLZ
        row.insertCell().textContent = address.plz || '-';
        
        // Aktions-Button
        const actionCell = row.insertCell();
        actionCell.innerHTML = `
            <button class="btn btn-sm btn-outline-danger" onclick="deleteAddress(${address.id})" title="Löschen">
                <i class="bi bi-trash"></i>
            </button>
        `;
    });
}

/**
 * Zeigt eine leere Tabelle mit Platzhaltertext an
 * @param {string} message - Nachricht die angezeigt werden soll
 */
function displayEmptyTable(message = 'Verwenden Sie die Suchfunktion, um Adressen zu finden.') {
    addressTableBody.innerHTML = '';
    const row = addressTableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 6;
    cell.className = 'text-center text-muted py-5';
    cell.textContent = message;
}

/**
 * Setzt die Suche zurück und lädt alle Adressen
 */
async function resetSearch() {
    searchInput.value = '';
    await loadAllAddresses();
}

/**
 * Verarbeitet das Hinzufügen einer neuen Adresse
 * @param {Event} event - Das Submit-Event
 */
async function handleAddAddress(event) {
    event.preventDefault();
    
    const submitButton = addAddressForm.querySelector('button[type="submit"]');
    
    // Button während der Verarbeitung deaktivieren
    submitButton.disabled = true;
    submitButton.textContent = 'Wird hinzugefügt...';
    
    try {
        // Adressdaten sammeln
        const addressData = {
            strasse: combineStreetAndNumber(
                addAddressForm.querySelector('#street').value.trim(),
                addAddressForm.querySelector('#houseNumber').value.trim()
            ),
            plz: parseInt(addAddressForm.querySelector('#postalCode').value.trim()),
            ort: addAddressForm.querySelector('#city').value.trim()
        };
        
        // Validierung
        if (!addressData.strasse || !addressData.plz) {
            throw new Error('Strasse und PLZ sind Pflichtfelder');
        }
        
        // Adresse erstellen
        await createAddress(addressData);
        
        // Erfolg
        alert('Adresse erfolgreich hinzugefügt!');
        addAddressForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addAddressModal')).hide();
        
        // Alle Adressen neu laden um die neue Adresse anzuzeigen
        await loadAllAddresses();
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen:', error);
        alert('Fehler beim Hinzufügen der Adresse: ' + error.message);
    } finally {
        // Button wieder aktivieren
        submitButton.disabled = false;
        submitButton.textContent = 'Hinzufügen';
    }
}

/**
 * Erstellt eine neue Adresse über die API
 * @param {Object} addressData - Die Adressdaten
 * @returns {Promise<Object>} Die erstellte Adresse
 */
async function createAddress(addressData) {
    const response = await fetch(ADDRESS_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Erstellen der Adresse');
    }
    
    return response.json();
}

/**
 * Löscht eine Adresse nach Bestätigung
 * @param {number} addressId - Die Adressen-ID
 */
async function deleteAddress(addressId) {
    try {
        const address = await getAddressById(addressId);
        const addressInfo = `${address.strasse}, ${address.plz} ${address.ort}`;
        
        // Modal-Inhalt aktualisieren
        deleteModal.querySelector('#deleteAddressModalLabel').textContent = 
            `Adresse ${addressInfo} wirklich löschen?`;
        deleteModal.querySelector('p').innerHTML = 
            `Möchten Sie Adresse <strong>${addressInfo}</strong> wirklich löschen?<br>Diese Aktion kann nicht rückgängig gemacht werden.`;
        
        // Delete-Button Event Listener
        const deleteButton = deleteModal.querySelector('.btn-danger');
        deleteButton.onclick = () => confirmDeleteAddress(addressId);
        
        // Modal anzeigen
        new bootstrap.Modal(deleteModal).show();
        
    } catch (error) {
        console.error('Fehler beim Laden der Adresse:', error);
        alert('Fehler beim Laden der Adresse: ' + error.message);
    }
}

/**
 * Bestätigt und führt die Löschung durch
 * @param {number} addressId - Die Adressen-ID
 */
async function confirmDeleteAddress(addressId) {
    const deleteButton = deleteModal.querySelector('.btn-danger');
    
    // Button während der Verarbeitung deaktivieren
    deleteButton.disabled = true;
    deleteButton.textContent = 'Wird gelöscht...';
    
    try {
        await deleteAddressById(addressId);
        
        alert('Adresse erfolgreich gelöscht!');
        bootstrap.Modal.getInstance(deleteModal).hide();
        
        // Adresse aus Tabelle entfernen
        removeAddressFromTable(addressId);
        
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen der Adresse: ' + error.message);
    } finally {
        // Button wieder aktivieren
        deleteButton.disabled = false;
        deleteButton.textContent = 'Löschen';
    }
}

/**
 * Löscht eine Adresse über die API
 * @param {number} addressId - Die Adressen-ID
 */
async function deleteAddressById(addressId) {
    const response = await fetch(`${ADDRESS_ENDPOINT}/${addressId}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Löschen der Adresse');
    }
}

/**
 * Entfernt eine Adresse aus der Tabelle
 * @param {number} addressId - Die Adressen-ID
 */
async function removeAddressFromTable(addressId) {
    const rows = addressTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === addressId.toString()) {
            row.remove();
        }
    });
    
    // Zeige Platzhalter wenn keine Adressen mehr da sind
    if (addressTableBody.children.length === 0) {
        await loadAllAddresses();
    }
}

/**
 * Kombiniert Strasse und Hausnummer zu einem String
 * @param {string} street - Die Strasse
 * @param {string} number - Die Hausnummer
 * @returns {string} Die kombinierte Adresse
 */
function combineStreetAndNumber(street, number) {
    if (!street) return '';
    if (!number) return street.trim();
    return `${street.trim()} ${number.trim()}`;
}

/**
 * Trennt Strasse und Hausnummer
 * @param {string} fullStreet - Die vollständige Strassenangabe
 * @returns {Object} Objekt mit street und number
 */
function splitStreetAndNumber(fullStreet) {
    if (!fullStreet) return { street: '', number: '' };
    
    const parts = fullStreet.trim().split(' ');
    const lastPart = parts[parts.length - 1];
    
    // Prüfe ob der letzte Teil eine Hausnummer ist
    if (/^\d+[a-zA-Z]?$/.test(lastPart) && parts.length > 1) {
        return {
            street: parts.slice(0, -1).join(' '),
            number: lastPart
        };
    }
    
    return { street: fullStreet, number: '' };
}

// Event Listener für das Laden der Seite
document.addEventListener('DOMContentLoaded', initializeAddressManagement);

// Globale Funktion für HTML onclick Events
window.deleteAddress = deleteAddress;
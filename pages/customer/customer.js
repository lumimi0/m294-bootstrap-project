/**
 * Kundenverwaltung für die Bibliotheks-Anwendung
 * @version 1.6
 * @author Luca Minotti
 */

// Konstanten für die API-Verbindung
const API_BASE_URL = 'http://192.168.1.93:8080/bibliothek';
const CUSTOMER_ENDPOINT = `${API_BASE_URL}/kunde`;
const BORROWING_ENDPOINT = `${API_BASE_URL}/ausleihe`;

// DOM-Elemente speichern
let searchInput;
let customerTableBody;
let addCustomerForm;
let editBasicForm;
let editAddressForm;
let deleteModal;

/**
 * Initialisiert die Kundenverwaltung beim Laden der Seite
 */
function initializeCustomerManagement() {
    // DOM-Elemente holen
    searchInput = document.querySelector('.form-control[placeholder="Nach Kunden suchen"]');
    customerTableBody = document.querySelector('.table tbody');
    addCustomerForm = document.querySelector('#addCustomerModal form');
    editBasicForm = document.querySelector('#editCustomerBasicModal form');
    editAddressForm = document.querySelector('#editCustomerAddressModal form');
    deleteModal = document.querySelector('#deleteCustomerModal');

    // Event Listeners hinzufügen
    setupEventListeners();
}

/**
 * Richtet alle Event Listeners ein
 */
function setupEventListeners() {
    // Such-Buttons
    document.getElementById('searchForId').addEventListener('click', () => searchCustomers('id'));
    document.getElementById('searchForLastName').addEventListener('click', () => searchCustomers('lastName'));
    document.getElementById('searchForStreet').addEventListener('click', () => searchCustomers('street'));

    // Enter-Taste für Suche
    searchInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            searchCustomers('id');
        }
    });

    // Formular-Submit Events
    addCustomerForm.addEventListener('submit', handleAddCustomer);
    editBasicForm.addEventListener('submit', handleEditBasicData);
    editAddressForm.addEventListener('submit', handleEditAddress);
}

/**
 * Führt eine Kundensuche basierend auf dem gewählten Typ durch
 * @param {string} searchType - Art der Suche: 'id', 'lastName' oder 'street'
 */
async function searchCustomers(searchType) {
    const searchValue = searchInput.value.trim();
    
    if (!searchValue) {
        alert('Bitte geben Sie einen Suchbegriff ein.');
        return;
    }

    try {
        let customers = [];
        
        switch (searchType) {
            case 'id':
                const customer = await getCustomerById(parseInt(searchValue));
                customers = customer ? [customer] : [];
                break;
            case 'lastName':
                customers = await searchCustomersByLastName(searchValue);
                break;
            case 'street':
                customers = await searchCustomersByStreet(searchValue);
                break;
        }

        displayCustomers(customers);
    } catch (error) {
        console.error('Fehler bei der Suche:', error);
        alert('Fehler bei der Suche: ' + error.message);
    }
}

/**
 * Lädt einen Kunden anhand seiner ID
 * @param {number} customerId - Die Kunden-ID
 * @returns {Promise<Object>} Der gefundene Kunde
 */
async function getCustomerById(customerId) {
    const response = await fetch(`${CUSTOMER_ENDPOINT}/${customerId}`);
    
    if (!response.ok) {
        throw new Error(`Kunde mit ID ${customerId} nicht gefunden`);
    }
    
    return response.json();
}

/**
 * Sucht Kunden nach Familienname
 * @param {string} lastName - Der Familienname
 * @returns {Promise<Array>} Liste der gefundenen Kunden
 */
async function searchCustomersByLastName(lastName) {
    const response = await fetch(`${CUSTOMER_ENDPOINT}?familienname=${encodeURIComponent(lastName)}`);
    
    if (!response.ok) {
        throw new Error('Fehler bei der Suche nach Familienname');
    }
    
    return response.json();
}

/**
 * Sucht Kunden nach Strasse
 * @param {string} street - Die Strasse
 * @returns {Promise<Array>} Liste der gefundenen Kunden
 */
async function searchCustomersByStreet(street) {
    const response = await fetch(`${CUSTOMER_ENDPOINT}/adresse?strasse=${encodeURIComponent(street)}`);
    
    if (!response.ok) {
        throw new Error('Fehler bei der Suche nach Strasse');
    }
    
    return response.json();
}

/**
 * Zeigt die Kundenliste in der Tabelle an
 * @param {Array} customers - Liste der Kunden
 */
function displayCustomers(customers) {
    customerTableBody.innerHTML = '';

    if (customers.length === 0) {
        const row = customerTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 8;
        cell.className = 'text-center text-muted py-5';
        cell.textContent = 'Keine Kunden gefunden.';
        return;
    }

    customers.forEach(customer => {
        const row = customerTableBody.insertRow();
        
        // ID
        row.insertCell().textContent = customer.id || '-';
        
        // Vorname
        row.insertCell().textContent = customer.vorname || '-';
        
        // Familienname
        row.insertCell().textContent = customer.familienname || '-';
        
        // Geburtsdatum formatieren
        const birthDate = customer.geburtsdatum ? 
            new Date(customer.geburtsdatum).toLocaleDateString('de-DE') : '-';
        row.insertCell().textContent = birthDate;
        
        // Adresse zusammensetzen
        const address = customer.adresse ? 
            `${customer.adresse.strasse || ''}, ${customer.adresse.plz || ''} ${customer.adresse.ort || ''}`.trim() : '-';
        row.insertCell().textContent = address.replace(/^,\s*/, '').replace(/,\s*$/, '');
        
        // E-Mail
        row.insertCell().textContent = customer.email || '-';
        
        // Ausleihen Button
        const borrowingCell = row.insertCell();
        borrowingCell.innerHTML = `
            <button class="btn btn-sm btn-outline-primary" onclick="showCustomerBorrowings(${customer.id})">
                Ausleihen anzeigen
            </button>
        `;
        
        // Aktions-Buttons
        const actionCell = row.insertCell();
        actionCell.innerHTML = `
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-primary" onclick="editCustomerBasicData(${customer.id})" title="Daten bearbeiten">
                    <i class="bi bi-person-lines-fill"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary" onclick="editCustomerAddress(${customer.id})" title="Adresse bearbeiten">
                    <i class="bi bi-geo-alt"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${customer.id})" title="Löschen">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
    });
}

/**
 * Verarbeitet das Hinzufügen eines neuen Kunden
 * @param {Event} event - Das Submit-Event
 */
async function handleAddCustomer(event) {
    event.preventDefault();
    
    const formData = new FormData(addCustomerForm);
    const submitButton = addCustomerForm.querySelector('button[type="submit"]');
    
    // Button während der Verarbeitung deaktivieren
    submitButton.disabled = true;
    submitButton.textContent = 'Wird hinzugefügt...';
    
    try {
        // Kundendaten sammeln
        const customerData = {
            vorname: formData.get('firstName') || addCustomerForm.querySelector('#firstName').value,
            familienname: formData.get('lastName') || addCustomerForm.querySelector('#lastName').value,
            email: formData.get('email') || addCustomerForm.querySelector('#email').value,
            geburtsdatum: formData.get('birthdate') || addCustomerForm.querySelector('#birthdate').value,
            adresse: {
                strasse: combineStreetAndNumber(
                    formData.get('street') || addCustomerForm.querySelector('#street').value,
                    formData.get('houseNumber') || addCustomerForm.querySelector('#houseNumber').value
                ),
                plz: parseInt(formData.get('postalCode') || addCustomerForm.querySelector('#postalCode').value),
                ort: formData.get('city') || addCustomerForm.querySelector('#city').value
            }
        };
        
        // Kunde erstellen
        await createCustomer(customerData);
        
        // Erfolg
        alert('Kunde erfolgreich hinzugefügt!');
        addCustomerForm.reset();
        bootstrap.Modal.getInstance(document.getElementById('addCustomerModal')).hide();
        
    } catch (error) {
        console.error('Fehler beim Hinzufügen:', error);
        alert('Fehler beim Hinzufügen des Kunden: ' + error.message);
    } finally {
        // Button wieder aktivieren
        submitButton.disabled = false;
        submitButton.textContent = 'Hinzufügen';
    }
}

/**
 * Erstellt einen neuen Kunden über die API
 * @param {Object} customerData - Die Kundendaten
 * @returns {Promise<Object>} Der erstellte Kunde
 */
async function createCustomer(customerData) {
    const response = await fetch(CUSTOMER_ENDPOINT, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Erstellen des Kunden');
    }
    
    return response.json();
}

/**
 * Öffnet das Modal zum Bearbeiten der Grunddaten
 * @param {number} customerId - Die Kunden-ID
 */
async function editCustomerBasicData(customerId) {
    try {
        const customer = await getCustomerById(customerId);
        
        // Formular mit aktuellen Daten füllen
        editBasicForm.querySelector('#editBasicLastName').value = customer.familienname || '';
        editBasicForm.querySelector('#editBasicEmail').value = customer.email || '';
        editBasicForm.dataset.customerId = customerId;
        
        // Modal öffnen
        new bootstrap.Modal(document.getElementById('editCustomerBasicModal')).show();
    } catch (error) {
        console.error('Fehler beim Laden der Kundendaten:', error);
        alert('Fehler beim Laden der Kundendaten: ' + error.message);
    }
}

/**
 * Verarbeitet die Bearbeitung der Grunddaten
 * @param {Event} event - Das Submit-Event
 */
async function handleEditBasicData(event) {
    event.preventDefault();
    
    const customerId = editBasicForm.dataset.customerId;
    const submitButton = editBasicForm.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Wird gespeichert...';
    
    try {
        const updateData = {
            familienname: editBasicForm.querySelector('#editBasicLastName').value,
            email: editBasicForm.querySelector('#editBasicEmail').value
        };
        
        await updateCustomerBasicData(customerId, updateData);
        
        alert('Kundendaten erfolgreich aktualisiert!');
        bootstrap.Modal.getInstance(document.getElementById('editCustomerBasicModal')).hide();
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        alert('Fehler beim Aktualisieren der Kundendaten: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Speichern';
    }
}

/**
 * Aktualisiert die Grunddaten eines Kunden
 * @param {number} customerId - Die Kunden-ID
 * @param {Object} updateData - Die zu aktualisierenden Daten
 */
async function updateCustomerBasicData(customerId, updateData) {
    const response = await fetch(`${CUSTOMER_ENDPOINT}/${customerId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Kundendaten');
    }
    
    return response.json();
}

/**
 * Öffnet das Modal zum Bearbeiten der Adresse
 * @param {number} customerId - Die Kunden-ID
 */
async function editCustomerAddress(customerId) {
    try {
        const customer = await getCustomerById(customerId);
        
        // Adressdaten trennen und einfügen
        if (customer.adresse) {
            const streetParts = splitStreetAndNumber(customer.adresse.strasse);
            editAddressForm.querySelector('#editAddressStreet').value = streetParts.street;
            editAddressForm.querySelector('#editAddressHouseNumber').value = streetParts.number;
            editAddressForm.querySelector('#editAddressPostalCode').value = customer.adresse.plz || '';
            editAddressForm.querySelector('#editAddressCity').value = customer.adresse.ort || '';
        }
        
        editAddressForm.dataset.customerId = customerId;
        
        // Modal öffnen
        new bootstrap.Modal(document.getElementById('editCustomerAddressModal')).show();
    } catch (error) {
        console.error('Fehler beim Laden der Adressdaten:', error);
        alert('Fehler beim Laden der Adressdaten: ' + error.message);
    }
}

/**
 * Verarbeitet die Bearbeitung der Adresse
 * @param {Event} event - Das Submit-Event
 */
async function handleEditAddress(event) {
    event.preventDefault();
    
    const customerId = editAddressForm.dataset.customerId;
    const submitButton = editAddressForm.querySelector('button[type="submit"]');
    
    submitButton.disabled = true;
    submitButton.textContent = 'Wird gespeichert...';
    
    try {
        const addressData = {
            strasse: combineStreetAndNumber(
                editAddressForm.querySelector('#editAddressStreet').value,
                editAddressForm.querySelector('#editAddressHouseNumber').value
            ),
            plz: parseInt(editAddressForm.querySelector('#editAddressPostalCode').value),
            ort: editAddressForm.querySelector('#editAddressCity').value
        };
        
        await updateCustomerAddress(customerId, addressData);
        
        alert('Adresse erfolgreich aktualisiert!');
        bootstrap.Modal.getInstance(document.getElementById('editCustomerAddressModal')).hide();
        
    } catch (error) {
        console.error('Fehler beim Aktualisieren:', error);
        alert('Fehler beim Aktualisieren der Adresse: ' + error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Speichern';
    }
}

/**
 * Aktualisiert die Adresse eines Kunden
 * @param {number} customerId - Die Kunden-ID
 * @param {Object} addressData - Die neuen Adressdaten
 */
async function updateCustomerAddress(customerId, addressData) {
    const response = await fetch(`${CUSTOMER_ENDPOINT}/${customerId}/adresse`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(addressData)
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Aktualisieren der Adresse');
    }
    
    return response.json();
}

/**
 * Löscht einen Kunden nach Bestätigung
 * @param {number} customerId - Die Kunden-ID
 */
async function deleteCustomer(customerId) {
    try {
        const customer = await getCustomerById(customerId);
        const customerName = `${customer.vorname} ${customer.familienname}`;
        
        // Modal-Inhalt aktualisieren
        deleteModal.querySelector('#deleteCustomerModalLabel').textContent = 
            `Kunde ${customerName} wirklich löschen?`;
        deleteModal.querySelector('p').innerHTML = 
            `Möchten Sie Kunde <strong>${customerName}</strong> wirklich löschen?<br>Diese Aktion kann nicht rückgängig gemacht werden.`;
        
        // Delete-Button Event Listener
        const deleteButton = deleteModal.querySelector('.btn-danger');
        deleteButton.onclick = () => confirmDeleteCustomer(customerId);
        
        // Modal anzeigen
        new bootstrap.Modal(deleteModal).show();
        
    } catch (error) {
        console.error('Fehler beim Laden des Kunden:', error);
        alert('Fehler beim Laden des Kunden: ' + error.message);
    }
}

/**
 * Bestätigt und führt die Löschung durch
 * @param {number} customerId - Die Kunden-ID
 */
async function confirmDeleteCustomer(customerId) {
    try {
        await deleteCustomerById(customerId);
        
        alert('Kunde erfolgreich gelöscht!');
        bootstrap.Modal.getInstance(deleteModal).hide();
        
        // Kunde aus Tabelle entfernen
        removeCustomerFromTable(customerId);
        
    } catch (error) {
        console.error('Fehler beim Löschen:', error);
        alert('Fehler beim Löschen des Kunden: ' + error.message);
    }
}

/**
 * Löscht einen Kunden über die API
 * @param {number} customerId - Die Kunden-ID
 */
async function deleteCustomerById(customerId) {
    const response = await fetch(`${CUSTOMER_ENDPOINT}/${customerId}`, {
        method: 'DELETE'
    });
    
    if (!response.ok) {
        throw new Error('Fehler beim Löschen des Kunden');
    }
}

/**
 * Entfernt einen Kunden aus der Tabelle
 * @param {number} customerId - Die Kunden-ID
 */
function removeCustomerFromTable(customerId) {
    const rows = customerTableBody.querySelectorAll('tr');
    rows.forEach(row => {
        if (row.cells[0].textContent === customerId.toString()) {
            row.remove();
        }
    });
    
    // Zeige Platzhalter wenn keine Kunden mehr da sind
    if (customerTableBody.children.length === 0) {
        const row = customerTableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 8;
        cell.className = 'text-center text-muted py-5';
        cell.textContent = 'Suchen Sie Kunden nach ID, Familiennamen oder Strasse.';
    }
}

/**
 * Zeigt die Ausleihen eines Kunden in einem Modal an
 * @param {number} customerId - Die Kunden-ID
 */
async function showCustomerBorrowings(customerId) {
    try {
        const borrowings = await getCustomerBorrowings(customerId);
        const customer = await getCustomerById(customerId);
        
        // Modal für Ausleihen erstellen oder aktualisieren
        let borrowingModal = document.getElementById('borrowingModal');
        if (!borrowingModal) {
            borrowingModal = createBorrowingModal();
            document.body.appendChild(borrowingModal);
        }
        
        // Modal-Inhalt aktualisieren
        const modalTitle = borrowingModal.querySelector('.modal-title');
        const modalBody = borrowingModal.querySelector('.modal-body');
        
        modalTitle.textContent = `Ausleihen von ${customer.vorname} ${customer.familienname}`;
        
        if (borrowings.length === 0) {
            modalBody.innerHTML = '<p class="text-center">Keine aktiven Ausleihen gefunden.</p>';
        } else {
            modalBody.innerHTML = createBorrowingList(borrowings);
        }
        
        new bootstrap.Modal(borrowingModal).show();
        
    } catch (error) {
        console.error('Fehler beim Laden der Ausleihen:', error);
        alert('Fehler beim Laden der Ausleihen: ' + error.message);
    }
}

/**
 * Lädt die Ausleihen eines Kunden
 * @param {number} customerId - Die Kunden-ID
 * @returns {Promise<Array>} Liste der Ausleihen
 */
async function getCustomerBorrowings(customerId) {
    const response = await fetch(`${BORROWING_ENDPOINT}/kunde/${customerId}`);
    
    if (!response.ok) {
        throw new Error('Fehler beim Laden der Ausleihen');
    }
    
    return response.json();
}

/**
 * Erstellt das Modal für Ausleihen
 * @returns {HTMLElement} Das Modal-Element
 */
function createBorrowingModal() {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.id = 'borrowingModal';
    modal.setAttribute('tabindex', '-1');
    modal.innerHTML = `
        <div class="modal-dialog modal-lg">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">Ausleihen</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Schliessen</button>
                </div>
            </div>
        </div>
    `;
    return modal;
}

/**
 * Erstellt die HTML-Liste der Ausleihen
 * @param {Array} borrowings - Liste der Ausleihen
 * @returns {string} HTML-String der Ausleihen-Liste
 */
function createBorrowingList(borrowings) {
    return `
        <div class="table-responsive">
            <table class="table table-sm">
                <thead>
                    <tr>
                        <th>Medium ID</th>
                        <th>Titel</th>
                        <th>Autor</th>
                        <th>Leihdatum</th>
                        <th>Leihdauer (Tage)</th>
                    </tr>
                </thead>
                <tbody>
                    ${borrowings.map(borrowing => `
                        <tr>
                            <td>${borrowing.medium?.id || '-'}</td>
                            <td>${borrowing.medium?.titel || '-'}</td>
                            <td>${borrowing.medium?.autor || '-'}</td>
                            <td>${borrowing.leihdatum ? new Date(borrowing.leihdatum).toLocaleDateString('de-DE') : '-'}</td>
                            <td>${borrowing.leihdauer || '-'}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
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
document.addEventListener('DOMContentLoaded', initializeCustomerManagement);

// Globale Funktionen für HTML onclick Events
window.editCustomerBasicData = editCustomerBasicData;
window.editCustomerAddress = editCustomerAddress;
window.deleteCustomer = deleteCustomer;
window.showCustomerBorrowings = showCustomerBorrowings;
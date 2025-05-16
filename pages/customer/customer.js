/**
 * Kundenverwaltung für die Bibliotheks-Anwendung
 * @version 1.0.0
 * @author Ihr Name
 */

// Konstanten für die API
const BACKEND_IP = '192.168.1.93';
const BACKEND_PORT = '8080';
const BASE_URL = `http://${BACKEND_IP}:${BACKEND_PORT}/bibliothek`;

/**
 * Lade einen spezifischen Kunden anhand seiner ID
 * @param {number} customerId - Die ID des Kunden
 * @returns {Promise<Object>} - Der Kunde als JSON-Objekt
 */
async function loadCustomerById(customerId) {
  try {
    const response = await fetch(`${BASE_URL}/kunde/${customerId}`);

    if (!response.ok) {
      throw new Error(`Fehler beim Laden des Kunden: ${response.status}`);
    }

    const customer = await response.json();
    return customer;
  } catch (error) {
    console.error('Fehler beim Laden des Kunden:', error);
    alert('Fehler beim Laden des Kunden: ' + error.message);
    return null;
  }
}

/**
 * Suche Kunden anhand des Familiennamens
 * @param {string} familyName - Der Familienname nach dem gesucht wird
 * @returns {Promise<Array>} - Array mit gefundenen Kunden
 */
async function searchCustomersByFamilyName(familyName) {
  try {
    const response = await fetch(`${BASE_URL}/kunde?familienname=${encodeURIComponent(familyName)}`);

    if (!response.ok) {
      throw new Error(`Fehler bei der Suche: ${response.status}`);
    }

    const customers = await response.json();
    return customers;
  } catch (error) {
    console.error('Fehler bei der Suche nach Familienname:', error);
    alert('Fehler bei der Suche: ' + error.message);
    return [];
  }
}

/**
 * Suche Kunden anhand der Adresse (Straße)
 * @param {string} street - Die Straße nach der gesucht wird
 * @returns {Promise<Array>} - Array mit gefundenen Kunden
 */
async function searchCustomersByAddress(street) {
  try {
    const response = await fetch(`${BASE_URL}/kunde/adresse?strasse=${encodeURIComponent(street)}`);

    if (!response.ok) {
      throw new Error(`Fehler bei der Suche: ${response.status}`);
    }

    const customers = await response.json();
    return customers;
  } catch (error) {
    console.error('Fehler bei der Suche nach Adresse:', error);
    alert('Fehler bei der Suche: ' + error.message);
    return [];
  }
}

/**
 * Zeige die Suchergebnisse in der UI an
 * @param {Array} customers - Array mit Kunden die angezeigt werden sollen
 */
function displaySearchResults(customers) {
  const tableBody = document.querySelector('.table tbody');

  // Leere die Tabelle
  tableBody.innerHTML = '';

  // Wenn keine Kunden gefunden wurden
  if (customers.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.className = 'text-center text-muted py-5';
    cell.textContent = 'Keine Kunden gefunden.';
    return;
  }

  // Füge jeden Kunden als Tabellenzeile hinzu
  customers.forEach(customer => {
    const row = tableBody.insertRow();

    // ID
    const idCell = row.insertCell();
    idCell.textContent = customer.id || '-';

    // Vorname
    const firstNameCell = row.insertCell();
    firstNameCell.textContent = customer.vorname || '-';

    // Familienname
    const lastNameCell = row.insertCell();
    lastNameCell.textContent = customer.familienname || '-';

    // Geburtsdatum (formatieren falls vorhanden)
    const birthDateCell = row.insertCell();
    if (customer.geburtsdatum) {
      // Datum formatieren (von YYYY-MM-DD zu DD.MM.YYYY)
      const date = new Date(customer.geburtsdatum);
      birthDateCell.textContent = date.toLocaleDateString('de-DE');
    } else {
      birthDateCell.textContent = '-';
    }

    // Adresse
    const addressCell = row.insertCell();
    if (customer.adresse) {
      const address = `${customer.adresse.strasse || ''}, ${customer.adresse.plz || ''} ${customer.adresse.ort || ''}`.trim();
      addressCell.textContent = address.replace(/^,\s*/, '').replace(/,\s*$/, '') || '-';
    } else {
      addressCell.textContent = '-';
    }

    // E-Mail
    const emailCell = row.insertCell();
    emailCell.textContent = customer.email || '-';

    // Ausleihen (wird später implementiert)
    const borrowingsCell = row.insertCell();
    borrowingsCell.innerHTML = '<button class="btn btn-sm btn-outline-primary">Ausleihen anzeigen</button>';

    // Aktionen
    const actionCell = row.insertCell();
    actionCell.innerHTML = `
            <div class="btn-group" role="group">
                <button class="btn btn-sm btn-outline-secondary" onclick="editCustomer(${customer.id})" title="Bearbeiten">
                    <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteCustomer(${customer.id})" title="Löschen">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;
  });
}

/**
 * Event Handler für die Suche nach ID
 */
async function handleSearchById() {
  const searchInput = document.querySelector('input[placeholder="Nach Kunden suchen"]');
  const searchValue = searchInput.value.trim();

  if (!searchValue) {
    alert('Bitte geben Sie eine ID ein');
    return;
  }

  const customerId = parseInt(searchValue);
  if (isNaN(customerId)) {
    alert('Bitte geben Sie eine gültige ID (Zahl) ein');
    return;
  }

  const customer = await loadCustomerById(customerId);
  if (customer) {
    displaySearchResults([customer]);
  }
}

/**
 * Event Handler für die Suche nach Familienname
 */
async function handleSearchByFamilyName() {
  const searchInput = document.querySelector('input[placeholder="Nach Kunden suchen"]');
  const searchValue = searchInput.value.trim();

  if (!searchValue) {
    alert('Bitte geben Sie einen Familiennamen ein');
    return;
  }

  const customers = await searchCustomersByFamilyName(searchValue);
  displaySearchResults(customers);
}

/**
 * Event Handler für die Suche nach Adresse
 */
async function handleSearchByAddress() {
  const searchInput = document.querySelector('input[placeholder="Nach Kunden suchen"]');
  const searchValue = searchInput.value.trim();

  if (!searchValue) {
    alert('Bitte geben Sie eine Straße ein');
    return;
  }

  const customers = await searchCustomersByAddress(searchValue);
  displaySearchResults(customers);
}

/**
 * Initialisiere die Event Listener für die Suchfunktionen
 */
function initializeCustomerSearch() {
  // Event Listener für ID-Suche
  const idButton = document.querySelector('button[type="button"]:nth-of-type(1)');
  if (idButton && idButton.textContent === 'ID') {
    idButton.addEventListener('click', handleSearchById);
  }

  // Event Listener für Familienname-Suche
  const familyNameButton = document.querySelector('button[type="button"]:nth-of-type(2)');
  if (familyNameButton && familyNameButton.textContent === 'Familienname') {
    familyNameButton.addEventListener('click', handleSearchByFamilyName);
  }

  // Event Listener für Adress-Suche
  const addressButton = document.querySelector('button[type="button"]:nth-of-type(3)');
  if (addressButton && addressButton.textContent === 'Adresse') {
    addressButton.addEventListener('click', handleSearchByAddress);
  }

  // Enter-Taste in der Suchleiste abfangen
  const searchInput = document.querySelector('input[placeholder="Nach Kunden suchen"]');
  if (searchInput) {
    searchInput.addEventListener('keypress', function(event) {
      if (event.key === 'Enter') {
        // Standardmäßig nach ID suchen wenn Enter gedrückt wird
        handleSearchById();
      }
    });
  }
}

// Initialisiere die Funktionen wenn das DOM geladen ist
document.addEventListener('DOMContentLoaded', function() {
  initializeCustomerSearch();
  initializeCustomerForm();
  initializeEditCustomerForm();
});

/**
 * Erstelle einen neuen Kunden
 * @param {Object} customerData - Die Kundendaten
 * @returns {Promise<Object>} - Der erstellte Kunde
 */
async function createCustomer(customerData) {
  try {
    const response = await fetch(`${BASE_URL}/kunde`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Erstellen des Kunden: ${response.status}`);
    }

    const newCustomer = await response.json();
    return newCustomer;
  } catch (error) {
    console.error('Fehler beim Erstellen des Kunden:', error);
    throw error;
  }
}

/**
 * Sammle die Formulardaten und erstelle das JSON-Objekt für den Kunden
 * @param {HTMLFormElement} form - Das Formular-Element
 * @returns {Object} - Das Kunden-Objekt im erwarteten Format
 */
function collectCustomerFormData(form) {
  const formData = new FormData(form);

  // Sammle die Werte aus den Eingabefeldern
  const firstName = form.querySelector('#firstName').value.trim();
  const lastName = form.querySelector('#lastName').value.trim();
  const email = form.querySelector('#email').value.trim();
  const birthdate = form.querySelector('#birthdate').value;
  const street = form.querySelector('#street').value.trim();
  const houseNumber = form.querySelector('#houseNumber').value.trim();
  const city = form.querySelector('#city').value.trim();
  const postalCode = form.querySelector('#postalCode').value.trim();

  // Combine street and house number
  const fullStreet = houseNumber ? `${street} ${houseNumber}` : street;

  // Erstelle das Kunden-Objekt im erwarteten JSON-Format
  const customerData = {
    vorname: firstName,
    familienname: lastName,
    email: email,
    geburtsdatum: birthdate,
    adresse: {
      strasse: fullStreet,
      ort: city,
      plz: parseInt(postalCode)
    }
  };

  return customerData;
}

/**
 * Validiere die Formulareingaben
 * @param {Object} customerData - Die zu validierenden Kundendaten
 * @returns {Object} - Validierungsergebnis mit success und errors
 */
function validateCustomerData(customerData) {
  const errors = [];

  // Pflichtfelder prüfen
  if (!customerData.vorname) {
    errors.push('Vorname ist erforderlich');
  }

  if (!customerData.familienname) {
    errors.push('Familienname ist erforderlich');
  }

  if (!customerData.email) {
    errors.push('E-Mail ist erforderlich');
  }

  if (!customerData.geburtsdatum) {
    errors.push('Geburtsdatum ist erforderlich');
  }

  if (!customerData.adresse.strasse) {
    errors.push('Straße ist erforderlich');
  }

  if (!customerData.adresse.plz || isNaN(customerData.adresse.plz)) {
    errors.push('Gültige Postleitzahl ist erforderlich');
  }

  // E-Mail Format prüfen (einfache Prüfung)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (customerData.email && !emailRegex.test(customerData.email)) {
    errors.push('Ungültiges E-Mail-Format');
  }

  return {
    success: errors.length === 0,
    errors: errors
  };
}

/**
 * Handle Submit-Event für das Kunden-Formular
 * @param {Event} event - Das Submit-Event
 */
async function handleCustomerFormSubmit(event) {
  event.preventDefault(); // Verhindere Standard-Submit

  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');

  try {
    // Button deaktivieren während der Verarbeitung
    submitButton.disabled = true;
    submitButton.textContent = 'Wird hinzugefügt...';

    // Sammle Formulardaten
    const customerData = collectCustomerFormData(form);

    // Validiere Daten
    const validation = validateCustomerData(customerData);
    if (!validation.success) {
      alert('Validierungsfehler:\n' + validation.errors.join('\n'));
      return;
    }

    // Erstelle Kunden
    const newCustomer = await createCustomer(customerData);

    // Erfolg!
    alert('Kunde erfolgreich hinzugefügt!');

    // Schließe Modal (wenn es eines ist)
    const modal = form.closest('.modal');
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    // Formular zurücksetzen
    form.reset();

    // Optional: Suche aktualisieren (zeige neuen Kunden in der Liste)
    // displaySearchResults([newCustomer]);

  } catch (error) {
    alert('Fehler beim Hinzufügen des Kunden: ' + error.message);
  } finally {
    // Button wieder aktivieren
    submitButton.disabled = false;
    submitButton.textContent = 'Hinzufügen';
  }
}

/**
 * Initialisiere das Kunden-Formular mit Event Listener
 */
function initializeCustomerForm() {
  // Suche das Formular (könnte in einem Modal sein)
  const customerForm = document.querySelector('form');

  if (customerForm) {
    customerForm.addEventListener('submit', handleCustomerFormSubmit);
  }

  // Zusätzlich für den Fall, dass es mehrere Formulare gibt
  const modalForm = document.querySelector('#addCustomerModal form');
  if (modalForm && modalForm !== customerForm) {
    modalForm.addEventListener('submit', handleCustomerFormSubmit);
  }
}

/**
 * Lösche einen Kunden - zeige Bestätigungsmodal
 * @param {number} customerId - Die ID des zu löschenden Kunden
 */
async function deleteCustomer(customerId) {
  try {
    // Lade die Kundendaten um den Namen zu zeigen
    const customer = await loadCustomerById(customerId);

    if (!customer) {
      alert('Kunde nicht gefunden');
      return;
    }

    // Finde das Delete-Modal
    const deleteModal = document.querySelector('#deleteCustomerModal');
    const modalTitle = deleteModal ? deleteModal.querySelector('#deleteCustomerModalLabel') : null;
    const modalBody = deleteModal ? deleteModal.querySelector('.modal-body p') : null;
    const deleteButton = deleteModal ? deleteModal.querySelector('.btn-danger') : null;

    if (!deleteModal) {
      // Fallback: Verwende einfache Bestätigung
      await deleteCustomerDirect(customerId);
      return;
    }

    // Aktualisiere Modal-Inhalt mit Kundenname
    const customerName = `${customer.vorname} ${customer.familienname}`.trim();

    if (modalTitle) {
      modalTitle.textContent = `Kunde ${customerName} wirklich löschen?`;
    }

    if (modalBody) {
      modalBody.innerHTML = `Möchten Sie Kunde <strong>${customerName}</strong> wirklich löschen?<br>
                Diese Aktion kann nicht rückgängig gemacht werden.`;
    }

    // Entferne alte Event Listener vom Delete-Button
    if (deleteButton) {
      const newDeleteButton = deleteButton.cloneNode(true);
      deleteButton.parentNode.replaceChild(newDeleteButton, deleteButton);

      // Füge neuen Event Listener hinzu
      newDeleteButton.addEventListener('click', async function() {
        await executeCustomerDeletion(customerId, deleteModal);
      });
    }

    // Öffne das Modal
    const modalInstance = new bootstrap.Modal(deleteModal);
    modalInstance.show();

  } catch (error) {
    console.error('Fehler beim Vorbereiten der Löschung:', error);
    alert('Fehler beim Laden der Kundendaten: ' + error.message);
  }
}

/**
 * Führe die eigentliche Löschung aus
 * @param {number} customerId - Die ID des zu löschenden Kunden
 * @param {HTMLElement} modal - Das Modal-Element
 */
async function executeCustomerDeletion(customerId, modal) {
  const deleteButton = modal.querySelector('.btn-danger');

  try {
    // Button deaktivieren während der Verarbeitung
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.textContent = 'Wird gelöscht...';
    }

    // DELETE-Request ausführen
    await deleteCustomerDirect(customerId);

    // Erfolg!
    alert('Kunde erfolgreich gelöscht');

    // Modal schließen
    const modalInstance = bootstrap.Modal.getInstance(modal);
    if (modalInstance) {
      modalInstance.hide();
    }

    // Optional: Tabelle aktualisieren
    // Du könntest hier die aktuelle Suche wiederholen
    // oder die Zeile aus der Tabelle entfernen
    removeCustomerFromTable(customerId);

  } catch (error) {
    alert('Fehler beim Löschen: ' + error.message);
  } finally {
    // Button wieder aktivieren
    if (deleteButton) {
      deleteButton.disabled = false;
      deleteButton.textContent = 'Löschen';
    }
  }
}

/**
 * Direkter DELETE-Request (ohne Modal)
 * @param {number} customerId - Die ID des zu löschenden Kunden
 */
async function deleteCustomerDirect(customerId) {
  try {
    const response = await fetch(`${BASE_URL}/kunde/${customerId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Löschen: ${response.status}`);
    }

    // Erfolg (DELETE gibt normalerweise keinen Body zurück)
    return true;

  } catch (error) {
    console.error('Fehler beim Löschen des Kunden:', error);
    throw error;
  }
}

/**
 * Entferne einen Kunden aus der Tabelle (ohne neue Suche)
 * @param {number} customerId - Die ID des gelöschten Kunden
 */
function removeCustomerFromTable(customerId) {
  const tableBody = document.querySelector('.table tbody');
  const rows = tableBody.querySelectorAll('tr');

  rows.forEach(row => {
    const firstCell = row.cells[0];
    if (firstCell && firstCell.textContent === customerId.toString()) {
      row.remove();
    }
  });

  // Wenn keine Zeilen mehr vorhanden sind, zeige Placeholder
  if (tableBody.children.length === 0) {
    const row = tableBody.insertRow();
    const cell = row.insertCell();
    cell.colSpan = 8;
    cell.className = 'text-center text-muted py-5';
    cell.textContent = 'Suchen Sie Kunden nach ID, Familiennamen oder Adresse.';
  }
}

/**
 * Aktualisiere einen bestehenden Kunden
 * @param {number} customerId - Die ID des zu aktualisierenden Kunden
 * @param {Object} updateData - Die zu aktualisierenden Daten
 * @returns {Promise<Object>} - Der aktualisierte Kunde
 */
async function updateCustomer(customerId, updateData) {
  try {
    const response = await fetch(`${BASE_URL}/kunde/${customerId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Aktualisieren des Kunden: ${response.status}`);
    }

    const updatedCustomer = await response.json();
    return updatedCustomer;
  } catch (error) {
    console.error('Fehler beim Aktualisieren des Kunden:', error);
    throw error;
  }
}

/**
 * Aktualisiere die Adresse eines Kunden
 * @param {number} customerId - Die ID des Kunden
 * @param {Object} addressData - Die neue Adresse
 * @returns {Promise<Object>} - Die aktualisierte Adresse
 */
async function updateCustomerAddress(customerId, addressData) {
  try {
    const response = await fetch(`${BASE_URL}/kunde/${customerId}/adresse`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(addressData)
    });

    if (!response.ok) {
      throw new Error(`Fehler beim Aktualisieren der Adresse: ${response.status}`);
    }

    const updatedAddress = await response.json();
    return updatedAddress;
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Adresse:', error);
    throw error;
  }
}

/**
 * Sammle die Daten aus dem Edit-Formular
 * @param {HTMLFormElement} form - Das Edit-Formular-Element
 * @returns {Object} - Das Update-Objekt mit separaten Kunden- und Adressdaten
 */
function collectEditFormData(form) {
  const email = form.querySelector('#editEmail').value.trim();
  const street = form.querySelector('#editStreet').value.trim();
  const houseNumber = form.querySelector('#editHouseNumber').value.trim();
  const city = form.querySelector('#editCity').value.trim();
  const postalCode = form.querySelector('#editPostalCode').value.trim();

  // Kombiniere Straße und Hausnummer
  const fullStreet = houseNumber ? `${street} ${houseNumber}` : street;

  // Trenne Kunden- und Adressdaten
  const customerData = {};
  const addressData = {};

  // Nur E-Mail kann direkt am Kunden geändert werden
  if (email) {
    customerData.email = email;
  }

  // Adressdaten sammeln
  if (fullStreet) {
    addressData.strasse = fullStreet;
  }
  if (city) {
    addressData.ort = city;
  }
  if (postalCode) {
    addressData.plz = parseInt(postalCode);
  }

  return {
    customerData: customerData,
    addressData: addressData
  };
}

/**
 * Lade die aktuellen Kundendaten in das Edit-Formular
 * @param {Object} customer - Die Kundendaten
 * @param {HTMLFormElement} form - Das Edit-Formular
 */
function loadCustomerIntoEditForm(customer, form) {
  // E-Mail setzen
  const emailField = form.querySelector('#editEmail');
  if (emailField) {
    emailField.value = customer.email || '';
  }

  // Adressdaten setzen (falls vorhanden)
  if (customer.adresse) {
    // Straße und Hausnummer trennen (einfache Trennung)
    const streetField = form.querySelector('#editStreet');
    const houseNumberField = form.querySelector('#editHouseNumber');

    if (streetField && customer.adresse.strasse) {
      // Versuche Hausnummer am Ende zu erkennen
      const streetParts = customer.adresse.strasse.trim().split(' ');
      const lastPart = streetParts[streetParts.length - 1];

      // Wenn der letzte Teil eine Zahl ist, behandle es als Hausnummer
      if (/^\d+[a-zA-Z]?$/.test(lastPart) && streetParts.length > 1) {
        streetField.value = streetParts.slice(0, -1).join(' ');
        if (houseNumberField) {
          houseNumberField.value = lastPart;
        }
      } else {
        streetField.value = customer.adresse.strasse;
        if (houseNumberField) {
          houseNumberField.value = '';
        }
      }
    }

    // Ort setzen
    const cityField = form.querySelector('#editCity');
    if (cityField) {
      cityField.value = customer.adresse.ort || '';
    }

    // PLZ setzen
    const postalCodeField = form.querySelector('#editPostalCode');
    if (postalCodeField) {
      postalCodeField.value = customer.adresse.plz || '';
    }
  }
}

/**
 * Handle Submit-Event für das Edit-Formular
 * @param {Event} event - Das Submit-Event
 */
async function handleEditFormSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const submitButton = form.querySelector('button[type="submit"]');

  // Hole die Kunden-ID (muss vorher gesetzt werden)
  const customerId = form.dataset.customerId;

  if (!customerId) {
    alert('Keine Kunden-ID gefunden');
    return;
  }

  try {
    // Button deaktivieren
    submitButton.disabled = true;
    submitButton.textContent = 'Wird gespeichert...';

    // Sammle Formulardaten
    const formData = collectEditFormData(form);

    // Aktualisiere Kunden (E-Mail)
    if (Object.keys(formData.customerData).length > 0) {
      await updateCustomer(customerId, formData.customerData);
    }

    // Aktualisiere Adresse
    if (Object.keys(formData.addressData).length > 0) {
      await updateCustomerAddress(customerId, formData.addressData);
    }

    // Erfolg!
    alert('Kunde erfolgreich aktualisiert!');

    // Schließe Modal
    const modal = form.closest('.modal');
    if (modal) {
      const modalInstance = bootstrap.Modal.getInstance(modal);
      if (modalInstance) {
        modalInstance.hide();
      }
    }

    // Optional: Suche aktualisieren um Änderungen zu zeigen
    // Hier könntest du die aktuelle Suchanfrage wiederholen

  } catch (error) {
    alert('Fehler beim Aktualisieren des Kunden: ' + error.message);
  } finally {
    // Button wieder aktivieren
    submitButton.disabled = false;
    submitButton.textContent = 'Speichern';
  }
}

/**
 * Bearbeite einen Kunden - lade Daten und öffne Edit-Modal
 * @param {number} customerId - Die ID des zu bearbeitenden Kunden
 */
async function editCustomer(customerId) {
  try {
    // Lade die aktuellen Kundendaten
    const customer = await loadCustomerById(customerId);

    if (!customer) {
      alert('Kunde nicht gefunden');
      return;
    }

    // Finde das Edit-Modal und Formular
    const editModal = document.querySelector('#editCustomerModal');
    const editForm = editModal ? editModal.querySelector('form') : null;

    if (!editForm) {
      alert('Edit-Formular nicht gefunden');
      return;
    }

    // Setze die Kunden-ID im Formular
    editForm.dataset.customerId = customerId;

    // Lade Daten ins Formular
    loadCustomerIntoEditForm(customer, editForm);

    // Öffne das Modal
    if (editModal) {
      const modalInstance = new bootstrap.Modal(editModal);
      modalInstance.show();
    }

  } catch (error) {
    console.error('Fehler beim Bearbeiten des Kunden:', error);
    alert('Fehler beim Laden der Kundendaten: ' + error.message);
  }
}

/**
 * Initialisiere das Edit-Formular mit Event Listener
 */
function initializeEditCustomerForm() {
  // Suche das Edit-Formular
  const editForm = document.querySelector('#editCustomerModal form');

  if (editForm) {
    editForm.addEventListener('submit', handleEditFormSubmit);
  }
}

// Exportiere Funktionen für andere Module (falls benötigt)
window.customerModule = {
  loadCustomerById,
  searchCustomersByFamilyName,
  searchCustomersByAddress,
  displaySearchResults,
  editCustomer,
  deleteCustomer,
  deleteCustomerDirect,
  executeCustomerDeletion,
  createCustomer,
  updateCustomer,
  updateCustomerAddress,
  handleCustomerFormSubmit,
  handleEditFormSubmit,
  removeCustomerFromTable
};

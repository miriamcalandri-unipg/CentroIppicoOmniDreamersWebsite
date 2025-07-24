window.onload = async function () {
    document.getElementById('admin-logout-button').addEventListener('click', logout);
    document.getElementById('close-reply-modal').addEventListener('click', closeReplyModal);
    
    await loadBookings();
    await loadMessages();
    await loadRequests();
};

/**
 * Funzione di gestione dello stile menu hamburger in modalità mobile.
 */
function toggleMenu() {
    const hamburgerIcon = document.querySelector('.hamburger-menu-icon');
    const menu = document.querySelector('.menu');

    menu.classList.toggle('menu-open');

    if (hamburgerIcon.textContent === 'menu') {
        hamburgerIcon.textContent = 'close';
    } else {
        hamburgerIcon.textContent = 'menu';
    }
}

/**
 * Invia una richiesta GET al web server per ottenere tutte le prenotazioni dei clienti.
 */
async function loadBookings() {
    try {
        const response = await fetch('/api/admin/bookings', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.redirected) {
                window.location.href = response.url;
                return;
            }

        const result = await response.json();
        if (!result.success) {
            throw new Error('Errore nel caricamento delle prenotazioni');
        }

        const bookings = result.bookings || [];
        displayBookings(bookings);

    } catch (error) {
        console.error('Errore nel caricamento delle prenotazioni:', error);

        const tableBody = document.getElementById('bookings-table');
        while (tableBody.firstChild != null) {
            tableBody.removeChild(tableBody.firstChild);
        }

        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.classList.add('error-message');
        cell.textContent = `Errore nel caricamento delle prenotazioni: ${error.message}`;

        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

/**
 * Invia una richiesta GET al web server per ottenere tutti i messaggi inviati dagli utenti. 
 */
async function loadMessages() {
    try {
        const response = await fetch('/api/admin/messages', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.redirected) {
                window.location.href = response.url;
                return;
        }
        
        const result = await response.json();
        if (!result.success) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/book_lesson.html';
                return;
            }
            throw new Error('Errore nel caricamento dei messaggi');
        }

        const messages = result.messages || [];
        displayMessages(messages);

    } catch (error) {
        console.error('Errore nel caricamento dei messaggi:', error);

        const tableBody = document.getElementById('messages-table');
        while (tableBody.firstChild != null) {
            tableBody.removeChild(tableBody.firstChild);
        }

        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.classList.add('error-message');
        cell.textContent = `Errore nel caricamento dei messaggi: ${error.message}`;

        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

/**
 * Invia una richiesta GET al web server per ottenere tutti le richieste inviati dai clienti. 
 */
async function loadRequests() {
    try {
        const response = await fetch('/api/admin/requests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        const result = await response.json();
        if (!result.success) {
            if (response.status === 401 || response.status === 403) {
                window.location.href = '/book_lesson.html';
                return;
            }
            throw new Error('Errore nel caricamento delle richieste');
        }

        const requests = result.requests || [];
        displayRequests(requests);

    } catch (error) {
        console.error('Errore nel caricamento delle richieste:', error);

        const tableBody = document.getElementById('requests-table');
        while (tableBody.firstChild != null) {
            tableBody.removeChild(tableBody.firstChild);
        }

        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.classList.add('error-message');
        cell.textContent = `Errore nel caricamento delle richieste: ${error.message}`;

        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

/**
 *  Gestisce la visualizzazione delle prenotazioni nella tabella.
 *  Crea una riga per ogni prenotazione e aggiunge i pulsanti di conferma e rifiuto.
 *  @param {Array} bookings - Array di oggetti prenotazione da visualizzare.
 */
function displayBookings(bookings) {
    const tableBody = document.getElementById('bookings-table');
    while (tableBody.firstChild != null) {
        tableBody.removeChild(tableBody.firstChild);
    }

    if (bookings.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = 'Nessuna prenotazione trovata';
        cell.colSpan = 8;
        cell.style.textAlign = 'center';

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    bookings.forEach(booking => {
        const date = new Date(booking.data_prenotazione).toLocaleDateString('it-IT');
        const statusClass = booking.stato === 'Confermata' ? 'confirmed' : (booking.stato === 'Annullata' ? 'denied' : 'pending');
        const statusText = booking.stato === 'Confermata' ? 'Confermata' : (booking.stato === 'Annullata' ? 'Annullata' : 'In attesa');

        const row = document.createElement('tr');
        row.setAttribute('data-id', booking.id);

        const idCell = document.createElement('td');
        idCell.textContent = booking.id;
        row.appendChild(idCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = `${booking.nome} ${booking.cognome}`;
        row.appendChild(nameCell);

        const emailCell = document.createElement('td');
        emailCell.textContent = booking.email_cliente;
        row.appendChild(emailCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = date;
        row.appendChild(dateCell);

        const timeCell = document.createElement('td');
        timeCell.textContent = booking.orario;
        row.appendChild(timeCell);

        const descCell = document.createElement('td');
        descCell.textContent = booking.descrizione || 'Nessuna descrizione';
        row.appendChild(descCell);

        const statusCell = document.createElement('td');
        statusCell.classList.add('booking-status', statusClass);
        statusCell.textContent = statusText;
        row.appendChild(statusCell);

        const actionsCell = document.createElement('td');
        actionsCell.classList.add('buttons-cell');

        const confirmButton = document.createElement('button');
        confirmButton.classList.add('confirm-button');
        confirmButton.textContent = 'Conferma';
        if (booking.stato === 'Confermata') {
            confirmButton.disabled = true; 
        }

        confirmButton.addEventListener('click', async () => updateBookingStatus(booking.id, 'Confermata'));

        const denyButton = document.createElement('button');
        denyButton.classList.add('deny-button');
        denyButton.textContent = 'Annulla';
        if (booking.stato === 'Annullata') {
            denyButton.disabled = true; 
        }

        denyButton.addEventListener('click', async () => updateBookingStatus(booking.id, 'Annullata'));

        actionsCell.appendChild(confirmButton);
        actionsCell.appendChild(denyButton);
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}

/**
 * Gestisce la visualizzazione dei messaggi nella tabella.
 * Crea una riga per ogni messaggio e visualizza i dettagli del mittente e del contenuto.
 * Crea un pulsante per inviare una risposta via email.
 * @param {Array} messages - Array di oggetti messaggio da visualizzare.
 */
function displayMessages(messages) {
    const tableBody = document.getElementById('messages-table');
    while (tableBody.firstChild != null) {
        tableBody.removeChild(tableBody.firstChild);
    }

    if (messages.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = 'Nessun messaggio trovato';
        cell.colSpan = 6; 
        cell.style.textAlign = 'center';

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    messages.forEach(message => {
        const date = new Date(message.data_invio).toLocaleDateString('it-IT');

        const row = document.createElement('tr');
        row.setAttribute('data-id', message.id);

        const idCell = document.createElement('td');
        idCell.textContent = message.id;
        row.appendChild(idCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = `${message.nome_mittente} ${message.cognome_mittente}`;
        row.appendChild(nameCell);

        const emailCell = document.createElement('td');
        emailCell.textContent = message.email_mittente;
        row.appendChild(emailCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = date;
        row.appendChild(dateCell);

        const contentCell = document.createElement('td');
        contentCell.textContent = message.contenuto;
        row.appendChild(contentCell);

        const actionsCell = document.createElement('td');
        actionsCell.classList.add('buttons-cell');

        const replyButton = document.createElement('button');
        replyButton.textContent = 'Invia email';
        replyButton.classList.add('submit-button');
        replyButton.addEventListener('click', () => {
            const email = message.email_mittente;
            const url = `mailto:${email}?subject=Risposta al tuo messaggio`;
            window.open(url, '_blank').focus();
        });

        actionsCell.appendChild(replyButton);
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}


/**
 * Gestisce la visualizzazione delle richieste nella tabella.
 * Crea una riga per ogni richiesta e visualizza il contenuto con la possibilità di rispondere.
 * @param {Array} requests - Array di oggetti richiesta da visualizzare.
 */
function displayRequests(requests) {
    const tableBody = document.getElementById('requests-table');
    while (tableBody.firstChild != null) {
        tableBody.removeChild(tableBody.firstChild);
    }

    if (requests.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.textContent = 'Nessuna richiesta trovata';
        cell.colSpan = 6; 
        cell.style.textAlign = 'center';

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    requests.forEach(request => {
        const date = new Date(request.data_invio).toLocaleDateString('it-IT');

        const row = document.createElement('tr');
        row.setAttribute('data-id', request.id);

        const idCell = document.createElement('td');
        idCell.textContent = request.id;
        idCell.setAttribute('data-label', 'ID');
        row.appendChild(idCell);

        const nameCell = document.createElement('td');
        nameCell.textContent = `${request.nome} ${request.cognome}`;
        nameCell.setAttribute('data-label', 'Cliente');
        row.appendChild(nameCell);

        const dateCell = document.createElement('td');
        dateCell.textContent = date;
        dateCell.setAttribute('data-label', 'Data');
        row.appendChild(dateCell);

        const contentCell = document.createElement('td');
        contentCell.textContent = request.contenuto;
        contentCell.setAttribute('data-label', 'Contenuto');
        row.appendChild(contentCell);

        const actionsCell = document.createElement('td');
        actionsCell.setAttribute('data-label', 'Azioni');
        actionsCell.classList.add('buttons-cell');

        const replyButton = document.createElement('button');
        replyButton.textContent = 'Rispondi';
        replyButton.classList.add('submit-button', 'open-modal-button');
        replyButton.id = 'reply-button-' + request.id;
        if (request.risposta != null) {
            replyButton.disabled = true; 
            replyButton.textContent = 'Risposto';
        }

        user = request.nome + ' ' + request.cognome;
        replyButton.addEventListener('click', () => showReplyModal(user, request.id));

        actionsCell.appendChild(replyButton);
        row.appendChild(actionsCell);

        tableBody.appendChild(row);
    });
}

/**
 * Aggiorna lo stato di una prenotazione.
 * Invia una richiesta PUT al server per aggiornare lo stato della prenotazione.
 * @param {number} bookingId - L'ID della prenotazione da aggiornare.
 * @param {string} status - Il nuovo stato della prenotazione (Confermata, Annullata).
 */
async function updateBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`/api/admin/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({ stato: status })
        });

        if(response.redirected) {
            window.location.href = response.url;
            return;
        }
        
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        await loadBookings();
    } catch (error) {
        console.error('Errore nell\'aggiornamento dello stato della prenotazione', error);
        alert(`Errore nell'aggiornamento dello stato della prenotazione: ${error.message}`);
    }
}

/**
 * Apre un form popup per rispondere a una richiesta.
 * @param {string} user - Nome e cognome dell'utente che ha inviato la richiesta.
 * @param {number} id - ID della richiesta a cui rispondere.
 */
function showReplyModal(user, id) {
    const overlay = document.getElementById('overlay');
    const userInput = document.getElementById('reply-user');
    userInput.value = user;
    overlay.classList.add('show-overlay');

    document.getElementById('reply-form').addEventListener('submit', async (event) => submitReply(event, id));
}

/**
 * Nasconde il form di risposta e resetta i campi.
 */
function closeReplyModal() {
    const overlay = document.getElementById('overlay');
    overlay.classList.remove('show-overlay');
    const replyForm = document.getElementById('reply-form');
    replyForm.reset();
}

/**
 * Richiesta PUT al server per aggiornare la richiesta aggiungendo una risposta.
 * Invia il contenuto della risposta e aggiorna la tabella delle richieste.
 * @param {Event} event - L'evento di submit del form.
 * @param {number} id - ID della richiesta a cui rispondere.
 */
async function submitReply(event, id) {
    event.preventDefault();

    const contentInput = document.getElementById('reply-content');  
    const content = contentInput.value;
    const button = document.getElementById(`reply-button-${id}`);
    const originalButtonText = button.textContent;
    button.textContent = 'Invio in corso...';
    button.disabled = true;

    if (!content) {
        alert('Il contenuto non può essere vuoto.');
        return;
    }

    try {
        const response = await fetch(`/api/admin/requests/reply/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify({contenuto: content})
        });

        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }
        
        closeReplyModal();
        await loadRequests();
    } catch (error) {
        console.error('Errore nell\'invio della risposta:', error);
        alert(`Errore nell'invio della risposta: ${error.message}`);
    }
    finally {
        button.textContent = originalButtonText;
        button.disabled = false;
    }
}

/**
 * Gestisce il logout dell'amministratore.
 * Invia una richiesta POST al server per terminare la sessione dell'amministratore.
 */
async function logout() {
    const logoutButton = document.getElementById('admin-logout-button');
    const originalButtonText = logoutButton.textContent;
    logoutButton.textContent = 'Logout in corso...';
    logoutButton.disabled = true;
    try {
        const response = await fetch('/api/admin/logout', {
            method: 'POST',
            credentials: 'include'
        });

        if (response.redirected) {
            window.location.href = response.url;
            return;
        }

        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }

        window.location.href = '/book_lesson.html';
    } catch (error) {
        console.error('Errore durante il logout:', error);
        alert('Errore durante il logout: ' + error.message);
    }
    finally {
        logoutButton.textContent = originalButtonText;
        logoutButton.disabled = false;
    }
}
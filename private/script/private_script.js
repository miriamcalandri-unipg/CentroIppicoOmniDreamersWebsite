let USER_EMAIL = '';

window.onload = async function () {
    const bookButton = document.getElementById('new-booking-button');
    if (bookButton != null) {
        bookButton.addEventListener('click', function () {
            if (document.getElementById('new-booking-form')) {
                return;
            }

            createBookLessonForm();
        });
    }

    const newRequestButton = document.getElementById('new-request-button');

    if (newRequestButton != null) {
        newRequestButton.addEventListener('click', showNewRequestModal);
    }

    await loadUserDashboard();
    await logoutUser();
}

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
 * Invia una richiesta GET al server per caricare i dati della dashboard utente.
 * Mostra le informazioni dell'utente, le prenotazioni e le richieste.
 */
async function loadUserDashboard() {
    try {
        const userInfoSection = document.getElementById('user-info-section');

        if (userInfoSection != null) {
            const message = document.createElement('p');
            message.id = 'dashboard-loading';
            message.textContent = 'Caricamento dati utente...';
            userInfoSection.appendChild(message);
        }
        
        const response = await fetch('/api/user/dashboard', {
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
                console.log('Non autorizzato, reindirizzo alla pagina di login...');
                window.location.href = '/book_lesson.html';
                return;
            }

            throw new Error(result.message);
        }

        const loadingElement = document.getElementById('dashboard-loading');
        if (loadingElement != null) loadingElement.remove();
        
        USER_EMAIL = result.user.email;
        displayUserInfo(result.user);
        displayUserBookings(result.bookings);
        displayUserRequests(result.requests)
        
        document.getElementById('user-experience').textContent = result.user.experience;
        document.getElementById('user-phone').textContent = result.user.phone;
    
    } catch (error) {
        const userInfoSection = document.getElementById('user-info-section');

        if (userInfoSection != null) {
            const error = document.createElement('p');
            error.textContent = `Errore nel caricamento dei dati: ${error.message}`;
            error.className = 'error-message';
            userInfoSection.appendChild(error);
        }
    }
}

/**
 * Mostra le informazioni dell'utente nel dashboard.
 * @param {Object} user - L'oggetto contenente le informazioni dell'utente.
 */
function displayUserInfo(user) {
    document.getElementById('user-name').textContent = `${user.name} ${user.surname}`;
    document.getElementById('user-email').textContent = user.email;
}

/**
 * Mostra le prenotazioni dell'utente nel dashboard.
 * @param {Array} bookings - L'array di prenotazioni dell'utente.
 */
function displayUserBookings(bookings) {
    const bookingsContainer = document.getElementById('user-bookings');
    while (bookingsContainer.firstChild != null) {
        bookingsContainer.removeChild(bookingsContainer.firstChild);
    }

    if (bookings.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'Non hai prenotazioni attive.';

        bookingsContainer.appendChild(message);
        return;
    }

    const table = document.createElement('table');
    table.className = 'dashboard-table bookings-table';

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Data', 'Orario', 'Descrizione', 'Stato'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    
    bookings.forEach(booking => {
        const bookingDate = new Date(booking.data_prenotazione).toLocaleDateString('it-IT');
        
        const statusClass = booking.stato === 'Confermata' ? 'status-confirmed' : 
                           (booking.stato === 'Annullata' ? 'status-denied' : 'status-pending');
        
        const statusText = booking.stato === 'Confermata' ? 'Confermata' : 
                          (booking.stato === 'Annullata' ? 'Annullata' : 'In attesa');
        
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = bookingDate;
        row.appendChild(dateCell);
        
        const timeCell = document.createElement('td');
        timeCell.textContent = booking.orario;
        row.appendChild(timeCell);

        const descCell = document.createElement('td');
        descCell.textContent = booking.descrizione || 'Nessuna descrizione disponibile';
        row.appendChild(descCell);
        
        const statusCell = document.createElement('td');
        const statusBadge = document.createElement('span');
        statusBadge.className = `status-badge ${statusClass}`;
        statusBadge.textContent = statusText;
        statusCell.appendChild(statusBadge);
        row.appendChild(statusCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    bookingsContainer.appendChild(table);
}

/**
 * Mostra le richieste inviate dall'utente nella dashboard.
 * @param {Array} requests - L'array delle richieste inviate dall'utente.   
 */
function displayUserRequests(requests) {
    const container = document.getElementById('user-requests');
    while (container.firstChild != null) {
        container.removeChild(container.firstChild);
    }

    if (requests.length === 0) {
        const message = document.createElement('p');
        message.textContent = 'Non hai inviato richieste.';

        container.appendChild(message);
        return;
    }

    const table = document.createElement('table');
    table.className = 'dashboard-table requests-table';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    
    const headers = ['Data', 'Richiesta', 'Risposta'];
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    
    requests.forEach(request => {
        const messageDate = new Date(request.data_invio).toLocaleDateString('it-IT');    
        const content = request.contenuto || 'Nessun contenuto disponibile';
        
        const row = document.createElement('tr');
        
        const dateCell = document.createElement('td');
        dateCell.textContent = messageDate;
        row.appendChild(dateCell);

        const contentCell = document.createElement('td');
        contentCell.textContent = content;
        row.appendChild(contentCell);
        
        const responseCell = document.createElement('td');
        if (request.risposta) {
            responseCell.textContent = request.risposta;
        }
        else {
            const statusBadge = document.createElement('span');
            statusBadge.textContent = 'In attesa';
            statusBadge.className = `status-badge status-pending`;
            responseCell.appendChild(statusBadge);
        }

        row.appendChild(responseCell);
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    container.appendChild(table);
}


/**
 * Crea dinamicamente il form per prenotare una nuova lezione.
 */
function createBookLessonForm() {
    const bookingSection = document.getElementById('new-booking-button').parentNode;
    const newBookingButton = document.getElementById('new-booking-button');

    const container = document.createElement('div');
    container.id = 'new-booking-form-container';
    
    const formTitle = document.createElement('h3');
    formTitle.textContent = 'Prenota una nuova lezione';
    
    const form = document.createElement('form');
    form.id = 'new-booking-form';

    const dateLabel = document.createElement('label');
    dateLabel.setAttribute('for', 'booking-date');
    dateLabel.textContent = 'Data:';
    
    const dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.id = 'booking-date';
    dateInput.name = 'bookingDate';
    dateInput.required = true;

    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    dateInput.min = formattedDate;
    
    const timeLabel = document.createElement('label');
    timeLabel.setAttribute('for', 'booking-time');
    timeLabel.textContent = 'Orario:';
    
    const timeInput = document.createElement('input');
    timeInput.type = 'time';
    timeInput.id = 'booking-time';
    timeInput.name = 'bookingTime';
    timeInput.required = true;
    
    const descLabel = document.createElement('label');
    descLabel.setAttribute('for', 'booking-description');
    descLabel.textContent = 'Descrizione:';
    
    const descInput = document.createElement('textarea');
    descInput.name = 'description';
    descInput.id = 'booking-description';
    descInput.placeholder = 'Inserisci eventuali richieste o informazioni aggiuntive...';

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Conferma Prenotazione';
    submitButton.classList.add('dashboard-button', 'submit-button');
    submitButton.id = 'book-button';
    
    const cancelButton = document.createElement('button');
    cancelButton.type = 'button';
    cancelButton.textContent = 'Annulla';
    cancelButton.classList.add('dashboard-button', 'cancel-button');

    cancelButton.addEventListener('click', function() {
        if (document.getElementById('new-booking-button') == null) {
            bookingSection.appendChild(newBookingButton);
        }
        container.remove();
    });
    
    form.appendChild(dateLabel);
    form.appendChild(dateInput);
    form.appendChild(document.createElement('br'));
    
    form.appendChild(timeLabel);
    form.appendChild(timeInput);
    form.appendChild(document.createElement('br'));
    
    form.appendChild(descLabel);
    form.appendChild(descInput);
    form.appendChild(document.createElement('br'));
    
    form.appendChild(cancelButton);
    form.appendChild(submitButton);
    
    container.appendChild(formTitle);
    container.appendChild(form);
    
    bookingSection.appendChild(container);
    bookingSection.removeChild(newBookingButton);

    form.addEventListener('submit', handleBookingSubmission);
}

/**
 * Gestisce l'invio del form di prenotazione, inviando una richiesta POST al server.
 * @param {Object} event - L'evento di submit del form di prenotazione.
 */
async function handleBookingSubmission(event) {
    event.preventDefault();
    
    const bookingForm = document.getElementById('new-booking-form');
    const bookingDate = document.getElementById('booking-date').value;
    const bookingTime = document.getElementById('booking-time').value;
    const description = document.getElementById('booking-description').value;
        
    const bookingData = {
        bookingDate: bookingDate,
        bookingTime: bookingTime,
        description: description
    };
    
    const submitButton = document.getElementById('book-button');
    const originalButtonText = submitButton.textContent;
    submitButton.textContent = 'Invio in corso...';
    submitButton.disabled = true;

    try {
        const response = await fetch(`/api/user/book`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData),
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
    
        bookingForm.reset();
        document.getElementById('new-booking-form-container').remove();
        loadUserDashboard();
    } catch (error) {
        console.error('Errore durante la prenotazione:', error);
        alert(`Si è verificato un errore durante la prenotazione: ${error.message}`);
    }
    finally {
        submitButton.textContent = originalButtonText;
        submitButton.disabled = false;
    }
}

/**
 * Mostra il form per inviare una nuova richiesta.
 */
function showNewRequestModal() {
    const overlay = document.getElementById('overlay');
    overlay.classList.toggle('show-overlay');

    document.getElementById('new-request-form').addEventListener('submit', newRequestSubmit);
    document.getElementById('close-new-request-form').addEventListener('click', closeNewRequestModal);
}

/**
 * Invia una richiesta POST al server per creare una nuova richiesta.
 * @param {Event} event - L'evento di submit del form di richiesta.
 */
async function newRequestSubmit(event) {
    event.preventDefault();

    const content = document.getElementById('new-request-content').value;
    const senderEmail = USER_EMAIL;
    const button = document.getElementById('send-new-request-button');
    const originalButtonText = button.textContent;
    button.textContent = 'Invio in corso...';
    button.disabled = true;

    try {
        const response = await fetch('/api/user/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: senderEmail,
                content: content,
            }),
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

        closeNewRequestModal();
        await loadUserDashboard();
    } catch (error) {
        console.error('Errore durante l\'invio del messaggio:', error);
        alert(`Errore durante l'invio del messaggio: ${error.message}`);
    }
    finally {
        button.textContent = originalButtonText;
        button.disabled = false;
    }
}

function closeNewRequestModal() {
    const overlay = document.getElementById('overlay');

    overlay.classList.remove('show-overlay');
    document.getElementById('new-request-form').reset();
}

/**
 * Gestisce il logout dell'utente.
 * Invia una richiesta POST al server per terminare la sessione dell'utente.
 */
async function logoutUser() {
    const logoutButton = document.getElementById('user-logout-button');
    const originalButtonText = logoutButton.textContent;

    logoutButton.addEventListener('click', async function (event) {
        event.preventDefault();
        
        logoutButton.textContent = 'Logout in corso...';
        logoutButton.disabled = true;

        try {
        const response = await fetch('/api/logout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
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
        alert(`Errore durante il logout: ${error.message}`);
    }
    finally {
        logoutButton.textContent = originalButtonText;
        logoutButton.disabled = false;
    }});
}
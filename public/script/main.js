window.onload = async function () {
    switch (window.location.pathname) {

        case '/':
            console.log('Home page loaded');
            loadHeroImage('home');
            handleSlideshow();
            break;

        case '/about.html':
            console.log('About page loaded');
            loadHeroImage('about');
            break;

        case '/activities.html':
            console.log('Activities page loaded');
            loadHeroImage('activities');
            await loadActivities();
            break;

        case '/book_lesson.html':
            console.log('Book Lesson page loaded');
            loadHeroImage('book_lesson');
            handleBookLessonForm();
            handleUserLogin();
            createAdminLoginForm();
            break;

        case '/contact.html':
            console.log('Contact page loaded');
            loadHeroImage('contact');
            handleContactForm();
            break;
        default:
            break;
    }
};

/**
 * Carica l'hero image in base alla pagina corrente.
 * @param {String} page - Il nome della pagina per cui caricare l'immagine.
 */
function loadHeroImage(page) {
    const hero = document.querySelector('.hero');
    if (hero == null) {
        console.error('Hero element not found!');
        return;
    }
    const path = `/img/${page}/hero.png`
    hero.style.backgroundImage = `url(${path})`;
}

/**
 * Richiesta GET al server per caricare le attività.
 */
async function loadActivities() {
    try {
        const response = await fetch('/api/activities');
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message);
        }

        const activities = result.activities || [];
        displayActivities(activities);
    } catch (error) {
        console.error('Errore nel caricamento delle attività:', error);
        const container = document.getElementById('activities-container');

        if (container != null) {
            const paragraph = document.createElement('p');
            paragraph.className = 'error-message';
            paragraph.textContent = `Errore nel caricamento delle attività: ${error.message}`;
            container.appendChild(paragraph);
        }
    }
}

/**
 * Funzione che crea il layout alternato per le attività.
 */
function displayActivities(activities) {
    const container = document.getElementById('activities-container');

    if (container == null) {
        console.error('Container delle attività non trovato!');
        return;
    }

    while (container.firstChild != null) {
        container.removeChild(container.firstChild);
    }

    if (activities.length === 0) {
        const paragraph = document.createElement('p');
        paragraph.textContent = 'Nessuna attività trovata.';
        container.appendChild(paragraph);
        return;
    }

    activities.forEach((activity, index) => {
        const section = document.createElement('section');
        section.className = 'activity-section';
        
        const header = document.createElement('div');
        header.className = 'activity-header';
        
        const title = document.createElement('h2');
        title.textContent = activity.nome;
        
        const imageContainer = document.createElement('div');
        imageContainer.className = 'activity-image-container';
        
        const img = document.createElement('img');
        img.src = activity.immagine;
        img.alt = activity.nome;
        
        const textContainer = document.createElement('div');
        textContainer.className = 'activity-text-container';
        
        const description = document.createElement('p');
        description.textContent = activity.descrizione;
        
        const contentContainer = document.createElement('div');
        contentContainer.className = 'activity-content-container';
        contentContainer.classList.add(index % 2 === 0 ? 'even' : 'odd');
        
        header.appendChild(title);
        section.appendChild(header);
        imageContainer.appendChild(img);
        textContainer.appendChild(description);
        
        contentContainer.appendChild(textContainer);
        contentContainer.appendChild(imageContainer);
        
        section.appendChild(contentContainer);
        container.appendChild(section);
    });
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
 * Gestisce il parsing e l'invio del modulo di registrazione 
 * e prenotazione della prima lezione. Invia una richiesta POST
 * al server per registrare l'utente e creare una prenotazione.
 * Effettua il login e carica la dashboard dell'utente.
 */
function handleBookLessonForm() {
    const bookingForm = document.getElementById('booking-form');
    if (!bookingForm) return;

    const passwordField = document.getElementById('password');
    const confirmPasswordField = document.getElementById('confirm-password');
    const dateInput = document.getElementById('date');
    
    const validatePasswords = () => {
        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        confirmPasswordField.classList.remove('error', 'matching');
        passwordField.classList.remove('error', 'matching');
        
        if (password === confirmPassword && password !== '') {
            confirmPasswordField.setCustomValidity('');
            confirmPasswordField.classList.add('matching');
            passwordField.classList.add('matching');
        } else {
            confirmPasswordField.setCustomValidity('Le password non corrispondono.');
            confirmPasswordField.classList.add('error');
            passwordField.classList.add('error');
        }
    };

    const validateDate = (dateInput) => {
        const today = new Date();
        const selectedDate = new Date(dateInput.value);

        if (selectedDate < today) {
            dateInput.setCustomValidity('La data non può essere nel passato.');
            dateInput.classList.add('error');
        } else {
            dateInput.setCustomValidity('');
            dateInput.classList.remove('error');
        }
    }

    passwordField.addEventListener('input', validatePasswords);
    confirmPasswordField.addEventListener('input', validatePasswords);
    dateInput.addEventListener('input', () => validateDate(dateInput));

    bookingForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const password = passwordField.value;
        const confirmPassword = confirmPasswordField.value;

        if (password !== confirmPassword) {
            confirmPasswordField.focus();
            return;
        }

        const dateInput = document.getElementById('date');
        if (dateInput) {
            validateDate(dateInput);
            if (dateInput.classList.contains('error')) {
                dateInput.focus();
                return;
            }
        }

        // Separo i dati dell'utente e della prenotazione
        const userData = {
            email: document.getElementById('email').value,
            name: document.getElementById('name').value,
            surname: document.getElementById('surname').value,
            experience: document.getElementById('riding-experience').value,
            phone: document.getElementById('phone-number').value,
            password: password,
        };

        const bookingData = {
            bookingDate: document.getElementById('date').value,
            bookingTime: document.getElementById('time').value,
            description: document.getElementById('comments').value
        };

        const submitButton = document.getElementById('booking-submit-button');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Invio in corso...';

        try {
            const registerResponse = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            const registerResult = await registerResponse.json();
            if (!registerResult.success) {
                throw new Error(registerResult.message);
            }

            const loginResponse = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: userData.email,
                    password: userData.password
                }),
                credentials: 'include'
            });

            const loginResult = await loginResponse.json();
            if (!loginResult.success) {
                throw new Error(loginResult.message);
            }

            const bookingResponse = await fetch(`/api/user/book`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(bookingData)
            });

            const bookingResult = await bookingResponse.json();
            if (!bookingResult.success) {
                throw new Error(bookingResult.message);
            }

            bookingForm.reset();
            location.replace(location.href)
        } catch (error) {
            console.error('Errore durante la registrazione:', error);
            alert(`Si è verificato un errore durante la registrazione: ${error.message}`);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
            passwordField.classList.remove('error', 'matching');
            confirmPasswordField.classList.remove('error', 'matching');
            dateInput.classList.remove('error');
        }
    });
}

/**
 * Gestisce l'autenticazione dell'utente.
 * Invia una richiesta POST al server per autenticare l'utente.
 */
async function handleUserLogin() {
    const loginForm = document.getElementById('login-form');
    if (!loginForm) return;

    loginForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const loginData = new FormData(loginForm);
        const data = Object.fromEntries(loginData.entries());
        
        const submitButton = document.getElementById('login-submit-button');
        const originalButtonText = submitButton ? submitButton.textContent : 'Accedi';
        if (submitButton != null) {
            submitButton.disabled = true;
            submitButton.textContent = 'Accesso in corso...';
        }

        let errorMessage = document.getElementById('login-error-message');
        if (!errorMessage) {
            errorMessage = document.createElement('div');
            errorMessage.id = 'login-error-message';
            errorMessage.classList.add('error-message');

            loginForm.appendChild(errorMessage);
        } else {
            errorMessage.style.display = 'none';
        }

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include' 
            });

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message);
            }

            window.location.href = '/private/user_dashboard.html';
        } catch (error) {
            console.error('Errore durante il login:', error);

            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
        } finally {
            if (submitButton != null) {
                submitButton.disabled = false;
                submitButton.textContent = originalButtonText;
            }
        }
    });
}

/**
 * Crea il modulo di login per l'amministratore.
 * Aggiunge un evento al link di login per mostrare il modulo. 
 */
function createAdminLoginForm() {
    const createAdminPanel = document.getElementById('admin-login-link');
    if (!createAdminPanel) {
        console.error('Admin login link not found');
        return;
    }

    createAdminPanel.addEventListener('click', function(event) {
        event.preventDefault();
        const contentDiv = document.querySelector('.content');

        if (!contentDiv) {
            console.error('Content div non trovata');
            return;
        }

        if (document.getElementById('admin-login-section')) {
            return;
        }

        const section = document.createElement('section');
        section.id = 'admin-login-section';

        const header = document.createElement('h3');
        header.textContent = 'Accesso Amministratore';

        section.appendChild(header);

        const form = document.createElement('form');
        form.id = 'admin-login-form';

        section.appendChild(form);

        const emailLabel = document.createElement('label');
        emailLabel.setAttribute('for', 'admin-email');
        emailLabel.textContent = 'Email:';

        form.appendChild(emailLabel);
        
        const emailInput = document.createElement('input');
        emailInput.type = 'email';
        emailInput.id = 'admin-email';
        emailInput.name = 'email';
        emailInput.required = true;

        form.appendChild(emailInput);

        const passwordLabel = document.createElement('label');
        passwordLabel.setAttribute('for', 'admin-password');
        passwordLabel.textContent = 'Password:';

        form.appendChild(passwordLabel);

        const passwordInput = document.createElement('input');
        passwordInput.type = 'password';
        passwordInput.id = 'admin-password';
        passwordInput.name = 'password';
        passwordInput.required = true;

        form.appendChild(passwordInput);

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Accedi';
        submitButton.id = 'admin-submit-button';
        submitButton.className = 'submit-button';

        form.appendChild(submitButton);

        const errorMessage = document.createElement('div');
        errorMessage.id = 'admin-login-error';
        errorMessage.className = 'error-message';
        errorMessage.style.display = 'none';
        
        form.appendChild(errorMessage);
        
        contentDiv.appendChild(section);

        handleAdminLogin();
    });
};

/**
 * Gestisce il login dell'amministratore.
 * Invia una richiesta POST al server per autenticare l'amministratore.
 * Se il login ha successo, reindirizza alla dashboard dell'amministratore.
 */
function handleAdminLogin() {
    const form = document.getElementById('admin-login-form');
    if (!form) {
        console.error('Login form dell\'amministratore non trovata');
        return;
    }
    
    form.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const loginData = new FormData(form);
        const data = Object.fromEntries(loginData.entries());
        const errorElement = document.getElementById('admin-login-error');
        const submitButton = document.getElementById('admin-submit-button');
        const originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Accesso in corso...';

        try {
            errorElement.style.display = 'none';
            
            const response = await fetch('/api/admin/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                credentials: 'include'
            });
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message);
            }
            
            window.location.href = '/admin/admin_dashboard.html';
        } catch (error) {
            console.error('Errore durante il login:', error);
            errorElement.textContent = error.message;
            errorElement.style.display = 'block';
        }
        finally {
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });
}

/**
 * Invia con una richiesta POST i dati del modulo di contatto.
 * Gestisce l'invio del modulo di contatto e mostra un messaggio di successo o errore.
 */
async function handleContactForm() {
    const contactForm = document.getElementById('contact-form');
    if (!contactForm) return;
    const submitButton = document.getElementById('contact-submit-button');
    const originalButtonText = submitButton.textContent;

    contactForm.addEventListener('submit', async function (event) {
        event.preventDefault();

        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        submitButton.textContent = 'Invio in corso...';
        submitButton.disabled = true;

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            if (!result.success) {
                throw new Error(result.message);
            }

            contactForm.reset();
        } catch (error) {
            console.error('Errore durante l\'invio del messaggio', error);
            alert(`Errore durante l'invio del messaggio: ${error.message}`);
        }
        finally {
            submitButton.textContent = originalButtonText;
            submitButton.disabled = false;
        }
    });
}

/**
 * Gestisce le immagini dello slideshow della galleria.
 * Mostra le immagini in gruppi dinamici, in base alla larghezza della finestra.
 * Permette di navigare tra i gruppi di immagini con frecce e imposta 
 * un timer automatico per cambiare le immagini ogni 4 secondi.
 */
function handleSlideshow() {
    const track = document.querySelector('.track');
    const slides = document.getElementsByClassName('slide-image');
    let index = 0;
    let margin = 8;;
    let slidesToShow = getSlidesToShow();

    let slideTimer = setInterval(() => moveSlides(), 4000);

    function getSlidesToShow() {
        if (window.innerWidth >= 2000) return 4;
        if (window.innerWidth >= 1500) return 3;
        if (window.innerWidth >= 1000) return 2;
        return 1;
    }
    
    function resetTimer() {
        clearInterval(slideTimer);
        slideTimer = setInterval(() => moveSlides(), 4000);
    }

    function moveSlides() {
        slidesToShow = getSlidesToShow();
        const slideWidth = slides[0].offsetWidth + margin*2;
        
        const maxIndex = slides.length - slidesToShow;
        index = (index + 1) > maxIndex ? 0 : index + 1;
        
        const offset = -(index * slideWidth);
        track.style.transform = `translateX(${offset}px)`;
        resetTimer();
    }

    window.addEventListener('resize', () => {
        slidesToShow = getSlidesToShow();
        index = 0;
        track.style.transform = 'translateX(0px)';
    });

    const prevButton = document.getElementById('prev');
    const nextButton = document.getElementById('next');
    
    if (prevButton) {
        prevButton.addEventListener('click', () => {
            slidesToShow = getSlidesToShow();
            const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(slides[0]).marginLeft) + parseFloat(getComputedStyle(slides[0]).marginRight);
            const maxIndex = slides.length - slidesToShow;
            
            index = (index - 1) < 0 ? maxIndex : index - 1;
            const offset = -(index * slideWidth);
            track.style.transform = `translateX(${offset}px)`;
            resetTimer();
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            slidesToShow = getSlidesToShow();
            const slideWidth = slides[0].offsetWidth + parseFloat(getComputedStyle(slides[0]).marginLeft) + parseFloat(getComputedStyle(slides[0]).marginRight);
            const maxIndex = slides.length - slidesToShow;
            
            index = (index + 1) > maxIndex ? 0 : index + 1;
            const offset = -(index * slideWidth);
            track.style.transform = `translateX(${offset}px)`;
            resetTimer();
        });
    }
}
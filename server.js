const express = require('express');
const mysql = require('mysql2');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'my_secret_key';
const ONE_HOUR = 60 * 60 * 1000;

app.use(express.json());
app.use(cookieParser());


/**
 * Setup della pool di connessioni al Database MySQL.
 */
const pool = mysql.createPool({
    host: 'localhost',
    user: 'user1',
    password: 'test123',
    database: 'omnidreamers',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

/**
 * Middleware per servire file statici per le pagine private e admin.
 * Serve le pagine statiche per gli utenti autenticati e per gli amministratori.  
 */
app.use('/private', authenticateUser, express.static('private'));
app.use('/admin', authenticateAdmin, express.static('admin'));

/**
 * Middleware a parte per mantenere lo stato di autenticazione dell'utente.
 * Controlla se l'utente è autenticato come amministratore o come utente normale
 * e reindirizza alla corrispettiva dashboard o alla pagina di prenotazione.
 */
app.use('/book_lesson.html', (req, res, next) => {
    const token = req.cookies.token;
    
    try {
        const payload = jwt.verify(token, JWT_SECRET);

        if (payload && payload.role === 'admin') {
            return res.redirect('/admin/admin_dashboard.html');
        }
        else if (payload && payload.role === 'user') {
            return res.redirect('/private/user_dashboard.html');
        }

        return res.redirect('/book_lesson.html');
    } catch (err) {
        next();
    }
});

/**
 * Per tutte le altre richieste, serve i file statici dalla cartella 'public'.
 */
app.use(express.static('public'));

/**
 * Middleware per autenticare l'utente.
 * Controlla se il token dell'utente è presente nei cookie e lo verifica.
 */
function authenticateUser(req, res, next) {
    const token = req.cookies.token;

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload || payload.role !== 'user') {
            return res.redirect('/book_lesson.html');
        }
        req.user = payload;
        next();

    } catch (err) {
        console.error('Autenticazione del token utente fallita: ', err);
        return res.redirect('/book_lesson.html');
    }
}

/**
 * Middleware per autenticare l'amministratore.
 * Controlla se il token dell'amministratore è presente nei cookie e lo verifica.
 */
function authenticateAdmin(req, res, next) {
    const token = req.cookies.token;

    try {
        const payload = jwt.verify(token, JWT_SECRET);
        if (!payload || payload.role !== 'admin') {
            return res.redirect('/book_lesson.html');
        }
        req.admin = payload;
        next();

    } catch (err) {
        console.error('Autenticazione del token amministratore fallita: ', err);
        return res.redirect('/book_lesson.html');
    }
}

/**
 * Registra un nuovo utente e lo inserisce nel database.
 */
app.post('/api/register', async (req, res) => {
    const { email, name, surname, experience, phone, password } = req.body;
    const query = 'INSERT INTO Clienti (email, nome, cognome, esperienza,  telefono, password) VALUES (?, ?, ?, ?, ?, ?)';
    const connection = await pool.promise().getConnection();

    try {
        const [result] = await connection.execute(query, [email, name, surname, experience, phone, password]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Errore nella registrazione dell\'utente'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Registrazione completata con successo'
        });

    } catch (error) {
        console.error('Errore durante la registrazione:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore nella registrazione utente'
        });
    } finally {
        connection.release();
    }
});

/**
 * Gestisce il login degli utenti.
 * Verifica le credenziali dell'utente e restituisce un token JWT se sono valide.
 */
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email e password sono obbligatori'
        });
    }

    const query = 'SELECT * FROM Clienti WHERE email = ? AND password = ?';
    const connection = await pool.promise().getConnection();
    try {
        const [result] = await connection.execute(query, [email, password]);

        if (result.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        const user = result[0];
        const payload = { email: user.email, role: 'user' };
        const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: ONE_HOUR,
            sameSite: 'strict'
        });

        return res.json({
            success: true,
            message: 'Login effettuato con successo',
            user: { email: user.email, name: user.nome, surname: user.cognome }
        });

    } catch (error) {
        console.error('Errore durante il login utente:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Errore del server durante il login' 
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Restituisce le informazioni dell'utente autenticato.
 */ 
app.get('/api/user/dashboard', authenticateUser, async (req, res) => {
    try {
        const userEmail = req.user.email;

        const userInfoQuery = 'SELECT * FROM Clienti WHERE email = ?';
        const bookingQuery = 'SELECT * FROM Prenotazioni WHERE email_cliente = ? ORDER BY id DESC';
        const requestsQuery = 'SELECT * FROM Richieste WHERE email_mittente = ? ORDER BY id DESC';

        const connection = await pool.promise().getConnection();

        try {
            const [userResults] = await connection.execute(userInfoQuery, [userEmail]);

            if (userResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Utente non trovato'
                });
            }

            const user = userResults[0];
            const [bookingResults] = await connection.execute(bookingQuery, [userEmail]);
            const [requestsResults] = await connection.execute(requestsQuery, [userEmail]);

            res.status(200).json({
                success: true,
                user: {
                    email: user.email,
                    name: user.nome,
                    surname: user.cognome,
                    experience: user.esperienza,
                    phone: user.telefono
                },
                bookings: bookingResults,
                requests: requestsResults
            });

        } catch (error) {
            console.error('Errore nel recuperare le informazioni utente:', error);
            return res.status(500).json({
                success: false,
                message: 'Errore del server nel recuperare le informazioni'
            });
        }
        finally {
            connection.release();
        }

    } catch (err) {
        console.error('Errore nell\'elaborazione dei dati utente:', err);
        return res.status(500).json({
            success: false,
            message: 'Errore del server nell\'elaborazione dei dati'
        });
    }
});

/**
 * Crea una nuova prenotazione e la inserisce nel database.
 */
app.post('/api/user/book', authenticateUser, async (req, res) => {
    const userEmail = req.user.email;
    const { bookingDate, bookingTime, description } = req.body;
    const query = 'INSERT INTO Prenotazioni (email_cliente, data_prenotazione, orario, descrizione) VALUES (?, ?, ?, ?)';
    const connection = await pool.promise().getConnection();

    try {
        const [result] = await connection.execute(query, [userEmail, bookingDate, bookingTime, description]);
        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Errore nell\'inserimento della prenotazione nel database'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Prenotazione effettuata con successo'
        });
    } catch (error) {
        console.error('Errore durante la registrazione della prenotazione:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore nel registrare la prenotazione'
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Gestisce l'invio di una richiesta da parte degli utenti autenticati.
 * Inserisce la richiesta nel database.
 */
app.post('/api/user/request', authenticateUser, async (req, res) => {
    const userEmail = req.user.email;
    const { content } = req.body;

    if (!content) {
        return res.status(400).json({
            success: false,
            message: 'Il contenuto della richiesta è obbligatorio'
        });
    }

    const query = 'INSERT INTO Richieste (email_mittente, contenuto) VALUES (?, ?)';
    const connection = await pool.promise().getConnection();

    try {
        const [result] = await connection.execute(query, [userEmail, content]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Errore nell\'invio della richiesta'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Richiesta inviata con successo'
        });
    } catch (error) {
        console.error('Errore durante l\'invio della richiesta:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'invio della richiesta'
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Restituisce la pagina con la dashboard per gli utenti autenticati.
 */
app.get('/private/user_dashboard.html', authenticateUser, (req, res) => {
    return res.sendFile(path.join(__dirname, 'private', 'user_dashboard.html'));
});

/**
 * Gestisce il logout degli utenti e rimuove il token dai cookie.
 */
app.post('/api/logout', authenticateUser, (req, res) => {
    res.clearCookie('token');
    return res.status(200).json({
        success: true,
        message: 'Logout effettuato con successo'
    });
});


/**
 * Gestice l'autenticazione dell'amministratore.
 * Verifica le credenziali dell'amministratore e restituisce un token JWT se sono valide.
 */
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            success: false,
            message: 'Email e password sono obbligatori'
        });
    }

    const query = 'SELECT * FROM Amministratori WHERE email = ? AND password = ?';
    const connection = await pool.promise().getConnection();
    try {

        const [result] = await connection.execute(query, [email, password]);

        if (result.length == 0) {
            return res.status(401).json({
                success: false,
                message: 'Credenziali non valide'
            });
        }

        const admin = result[0];
        const payload = { email: admin.email, role: 'admin' };
        const token = jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });

        res.cookie('token', token, {
            httpOnly: true,
            secure: true,
            maxAge: ONE_HOUR,
            sameSite: 'strict'
        });

        return res.json({
            success: true,
            message: 'Login amministratore effettuato con successo',
        });

    } catch (error) {
        console.error('Errore durante il login amministratore:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore del server durante il login'
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Restituisce la dashboard dell'amministratore se l'amministratore è autenticato.
 */
app.get('/admin/admin_dashboard.html', authenticateAdmin, (req, res) => {
    return res.sendFile(path.join(__dirname, 'admin', 'admin_dashboard.html'));
});


/**
 * Gestisce il logout dell'amministratore e rimuove il token dai cookie.
 */
app.post('/api/admin/logout', authenticateAdmin, (req, res) => {
    res.clearCookie('token');

    return res.json({
        success: true,
        message: 'Logout effettuato con successo'
    });
});

/**
 * Carica le prenotazioni effettuate dagli utenti e le restituisce 
 * in formato JSON per la visualizzazione nella dashboard dell'amministratore.
 */
app.get('/api/admin/bookings', authenticateAdmin, async (req, res) => {
    const query = `
      SELECT p.*, c.nome, c.cognome 
      FROM Prenotazioni p
      JOIN Clienti c ON p.email_cliente = c.email
      ORDER BY p.id DESC
    `;
    const connection = await pool.promise().getConnection();

    try {
        const [bookings] = await connection.execute(query);

        return res.json({
            success: true,
            bookings: bookings
        });
    } catch (error) {
        console.error('Errore nel recuperare le prenotazioni:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore nel recuperare le prenotazioni'
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Carica i messaggi inviati dagli utenti e li restituisce 
 * in formato JSON per la visualizzazione nella dashboard dell'amministratore.
 */
app.get('/api/admin/messages', authenticateAdmin, async (req, res) => {
    const query = `
      SELECT * FROM Messaggi
      ORDER BY id DESC
    `;
    const connection = await pool.promise().getConnection();

    try {
        const [messages] = await connection.execute(query);
        return res.json({
            success: true,
            messages: messages
        });
    } catch (error) {
        console.error('Errore nel recuperare i messaggi:', error);
        return res.status(500).json({
            success: false,
            error: 'Errore nel recuperare i messaggi'
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Carica le richieste inviati dai clienti registrati e li restituisce 
 * in formato JSON per la visualizzazione nella dashboard dell'amministratore.
 */
app.get('/api/admin/requests', authenticateAdmin, async (req, res) => {
    const query = `
      SELECT r.id, c.nome, c.cognome, r.data_invio, r.contenuto, r.risposta
      FROM Richieste r, Clienti c
      WHERE r.email_mittente = c.email  
      ORDER BY r.id DESC
    `;
    const connection = await pool.promise().getConnection();

    try {
        const [requests] = await connection.execute(query);
        return res.json({
            success: true,
            requests: requests
        });
    } catch (error) {
        console.error('Errore nel recuperare le richieste:', error);
        return res.status(500).json({
            success: false,
            error: 'Errore nel recuperare le richieste'
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Aggiorna lo stato di una prenotazione (confermata o rifiutata)
 */
app.put('/api/admin/bookings/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { stato } = req.body;
    const query = 'UPDATE Prenotazioni SET stato = ? WHERE id = ?';
    const connection = await pool.promise().getConnection();

    try {
        const [result] = await connection.execute(query, [stato, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Prenotazione non trovata'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Prenotazione aggiornata con successo'
        });
    } catch (error) {
        console.error('Errore nell\'aggiornare la prenotazione:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore nell\'aggiornamento della prenotazione'
        });
    }
    finally {
        connection.release();
    }
});

/** 
 * Gestisce l'invio di una risposta a una richiesta da parte dell'amministratore.
 * Aggiorna la richiesta nel database con la risposta fornita.
 */
app.put('/api/admin/requests/reply/:id', authenticateAdmin, async (req, res) => {
    const { id } = req.params;
    const { contenuto } = req.body;

    const query = 'UPDATE Richieste SET risposta = ? WHERE id = ?';
    const connection = await pool.promise().getConnection();

    try {
        const [result] = await connection.execute(query, [contenuto, id]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Errore nell\'invio della risposta'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'Risposta inviata con successo'
        });
    } catch (error) {
        console.error('Errore durante l\'invio della risposta:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'invio della risposta',   
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Carica le attività disponibili nel database e le restituisce in formato JSON.
 */
app.get('/api/activities', async (req, res) => {
    const query = 'SELECT * FROM Attivita';
    const connection = await pool.promise().getConnection();
    try {
        const [activities] = await connection.execute(query);

        return res.json({
            success: true,
            activities: activities
        });
    } catch (error) {
        console.error('Errore nel recuperare le attività:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore nel recuperare le attività'
        });
    }
    finally {
        connection.release();
    }
});

/**
 * Gestisce l'invio di un messaggio di contatto da parte degli utenti.
 * Inserisce il messaggio nel database.
 */
app.post('/api/contact', async (req, res) => {
    const { name, surname, email, message } = req.body;

    if (!name || !surname || !email || !message) {
        return res.status(400).json({
            success: false,
            message: 'Tutti i campi sono obbligatori'
        });
    }

    const query = 'INSERT INTO Messaggi (email_mittente, nome_mittente, cognome_mittente, contenuto) VALUES (?, ?, ?, ?)';
    const connection = await pool.promise().getConnection();

    try {
        const [result] = await connection.execute(query, [email, name, surname, message]);

        if (result.affectedRows === 0) {
            return res.status(400).json({
                success: false,
                message: 'Errore nell\'invio del messaggio'
            });
        }

        return res.status(201).json({
            success: true,
            message: 'Messaggio inviato con successo'
        });
    } catch (error) {
        console.error('Errore durante l\'invio del messaggio:', error);
        return res.status(500).json({
            success: false,
            message: 'Errore del server durante l\'invio del messaggio',
        });
    }
    finally {
        connection.release();
    }
});

app.listen(PORT, () => {
    console.log(`Server online: http://localhost:${PORT}`);
});
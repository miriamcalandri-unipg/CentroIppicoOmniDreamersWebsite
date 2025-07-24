DROP DATABASE IF EXISTS omnidreamers;
CREATE DATABASE IF NOT EXISTS omnidreamers;
USE omnidreamers;

CREATE TABLE IF NOT EXISTS Clienti (
    email VARCHAR(100) PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    esperienza ENUM('Principiante', 'Intermedio', 'Avanzato', 'Esperto') NOT NULL,
    telefono VARCHAR(15) NOT NULL,
    password VARCHAR(255) NOT NULL,
    data_registrazione TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Attivita (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    immagine VARCHAR(255) NOT NULL,
    descrizione TEXT
);

CREATE TABLE IF NOT EXISTS Amministratori (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    cognome VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS Prenotazioni (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_cliente VARCHAR(100) NOT NULL,
    data_prenotazione DATE NOT NULL,
    orario TIME NOT NULL,
    descrizione TEXT,
    stato ENUM('In attesa', 'Confermata', 'Annullata') DEFAULT 'In attesa',
    FOREIGN KEY (email_cliente) REFERENCES Clienti(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Richieste (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_mittente VARCHAR(100) NOT NULL,
    contenuto TEXT NOT NULL,
    data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    risposta TEXT,
    FOREIGN KEY (email_mittente) REFERENCES Clienti(email) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Messaggi (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_mittente VARCHAR(100) NOT NULL,
    nome_mittente VARCHAR(50),
    cognome_mittente VARCHAR(50),
    contenuto TEXT NOT NULL,
    data_invio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO Attivita (nome, immagine, descrizione) VALUES 
('Lezioni di Equitazione', '/img/activities/lessons.png', 'Il nostro centro offre lezioni di equitazione per tutti i livelli. Abbiamo istruttori qualificati per guidarti nel tuo percorso di apprendimento, a partire dalle prime lezioni di trotto, fino a partecipare in competizioni regionali di tutte le principali discipline della monta inglese: dressage, salto ostacoli e completo.'),
('Agonismo', '/img/activities/competitions.png','Il nostro istruttore Madelyn Hawkfeather, istruttore certificato Fise di III livello, sarà felice di accoglierti sotto la sua guida e aiutarti a raggiungere i tuoi obiettivi agonistici. Ogni anno, accompagnamo moltissimi esordienti nelle loro prime competizioni e molti veterani in competizioni di alto livello, come i Campionati regionali, i Campionati Italiani e Fieracavalli Verona. '),
('Campi estivi per bambini', '/img/activities/summer_camp.png', 'Ogni estate, la nostra istruttrice Serena Strawberrycake organizza dei campi estivi per i bambini, dai 6 ai 14 anni. I campi estivi sono un''occasione unica per insegnare ai bambini a prendersi cura dei cavalli, fare nuove amicizie e divertirsi all''aria aperta. I campi si svolgono in un ambiente sicuro e supervisionato, con attività che spaziano dalle lezioni di equitazione, alla cura dei cavalli, fino a giochi e attività ricreative. ');

INSERT INTO Amministratori (nome, cognome, email, password) VALUES 
('Admin', 'Madelyn', 'admin@omnidreamers.it', 'admin123');
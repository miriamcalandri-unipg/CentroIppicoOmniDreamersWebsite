# Sito web per il Centro Ippico "Omni Dreamers"
*Progetto di Programmazione Web e Mobile svolto da Miriam Calandri, matricola 353149, Università di Perugia.*

L’obiettivo del sito web è di essere un portale informativo e interattivo per il Centro Ippico “Omni Dreamers”, che permetta agli utenti di conoscere le attività offerte, visualizzare gli istruttori, prenotare le lezioni e contattare la struttura, e agli amministratori di gestire le prenotazioni e visualizzare i messaggi inviati dagli utenti.

*Tutte le immagini sono state generate tramite il videogioco Star Stable Online e il centro ippico in questione è inventato a fini didattici*

### Installare i requisiti
- Installare [Node.js](https://nodejs.org/en)
- Installare le dipendenze 
```bash
npm install
```
- Installare mysql server 
  - Su Ubuntu: 
  ```bash
    sudo apt-get install mysql-server
    ```
- Creare il database
```bash
sudo mysql -u root -p 
source /database.sql
```
- Creare l'utente nel database
```bash
sudo mysql -u root -p 
source /omnidreamers/database.sql
CREATE USER 'user1'@'localhost' IDENTIFIED BY 'test123';
GRANT ALL PRIVILEGES ON omnidreamers.* to 'user1'@'localhost';
FLUSH PRIVILEGES;
```
test

### Eseguire il progetto
- Per avviare il server:
```bash
npm run start
```

## Funzionalità
- La home page mostra un'introduzione generale del centro, con una galleria di immagini dinamica.
- La pagina chi siamo fornisce una presentazione generale della struttura e degli istruttori del centro.
- La pagina attività mostra le attività offerte dal maneggio, caricandole dinamicamente dal database.
- La pagina prenota lezione consente ad utenti non registrati di effettuare la registrazione, creando quindi un'account e prenotando la loro prima lezione. Clienti già registrati possono invece effettuare il login ed accedere alla propria dashboard, da cui possono visualizzare le proprie prenotazioni, prenotare nuove lezioni e inviare richieste agli amministratori.
- La pagina contatti presenta delle informazioni base di contatto, con iframe di google maps e un form per consentire a chiunque di inviare messaggi agli amministratori.
- Nella pagina prenota lezione è inoltre presente un form di login per gli amministratori, che possono accedere ad una dashboard che gli consente di confermare o rifiutare le prenotazioni degli utenti registrati, e di rispondere alle loro richieste. Possono inoltre visualizzare i messaggi inviati tramite il form di contatto.
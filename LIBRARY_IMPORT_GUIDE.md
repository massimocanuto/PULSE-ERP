# Guida all'Importazione della Libreria (Amazon & Google Play Books)

Pulse Library supporta nativamente i formati **PDF** e **ePub**. Poiché Amazon (Kindle) e Google Play Books utilizzano ecosistemi chiusi e spesso proteggono i file con DRM (Digital Rights Management), non è possibile una sincronizzazione automatica diretta. Tuttavia, puoi esportare i tuoi libri e caricarli su Pulse seguendo questi passaggi.

## 1. Google Play Books

Google rende il processo relativamente semplice per i libri che possiedi (non quelli in affitto).

1.  Vai su [Google Play Books - Le mie libri](https://play.google.com/books).
2.  Clicca sui **tre puntini** sotto la copertina del libro che vuoi scaricare.
3.  Seleziona **Esporta**.
4.  Scegli **Esporta come EPUB** (consigliato per la lettura su Pulse) o **Esporta come PDF**.
    *   *Nota:* Spesso scaricherai un file `.acsm`. Questo è un "biglietto" per scaricare il libro vero e proprio protetto da Adobe DRM.
    *   Se ottieni un file `.acsm`, devi aprirlo con **Adobe Digital Editions** (gratuito) sul tuo PC. Una volta aperto lì, il file vero (.epub o .pdf) sarà salvato nella cartella `Documents/My Digital Editions`.
5.  Una volta ottenuto il file `.epub` o `.pdf`, vai su **Pulse Library**.
6.  Clicca sui tre puntini sulla card del libro (o aggiungilo se non c'è) e seleziona **Carica E-book**.

## 2. Amazon Kindle

L'ecosistema Kindle è più chiuso. I file scaricati sono spesso in formato `.azw3`, `.kfx` o `.mobi`, che devono essere convertiti in PDF o ePub per essere letti su Pulse.

### Metodo A: "Scarica e trasferisci tramite USB"
1.  Vai su [I miei contenuti e dispositivi](https://www.amazon.it/mycd) su Amazon.
2.  Trova il libro e clicca su **Altre azioni**.
3.  Seleziona **Scarica e trasferisci tramite USB**.
4.  Seleziona il tuo dispositivo Kindle di destinazione (necessario per decriptare il file se protetto).
5.  Otterrai un file sul tuo computer.

### Metodo B: Calibre (Consigliato per la gestione)
Per gestire e convertire i tuoi libri Kindle in formati aperti (ePub/PDF) utilizzabili su Pulse e altri lettori, lo strumento standard del settore è **Calibre** (software open-source gratuito).

1.  Scarica e installa [Calibre](https://calibre-ebook.com/).
2.  Importa i file scaricati da Amazon in Calibre.
3.  Usa la funzione **Converti libri** per trasformarli in **EPUB** (consigliato per Pulse).
    *   *Attenzione:* Se il libro ha DRM, Calibre da solo non potrà convertirlo senza plugin aggiuntivi (DeDRM). Legalmente puoi rimuovere il DRM solo per copie di backup personali di libri che hai acquistato.
4.  Una volta convertito in EPUB o PDF, carica il file su **Pulse Library**.

## Riepilogo Formati Pulse
*   **EPUB**: Migliore esperienza di lettura (testo ridimensionabile, font personalizzabili).
*   **PDF**: Ottimo per layout fissi, manuali e documenti scansionati.


import 'dotenv/config';
import { db } from "./server/db";
import { anagraficaClienti, anagraficaFornitori, referentiClienti, indirizziSpedizioneClienti } from "./shared/schema";
import { eq, like, and, or } from "drizzle-orm";
import { randomUUID } from "crypto";

// ==============================================================================
// UTILITY FUNCTIONS
// ==============================================================================

function printHeader(title: string) {
    console.log('\n' + '═'.repeat(90));
    console.log(`  ${title}`);
    console.log('═'.repeat(90));
}

function printStep(num: number, total: number, description: string) {
    console.log(`\n[${num}/${total}] ${description}`);
    console.log('─'.repeat(90));
}

function printSuccess(message: string) {
    console.log(`✅ ${message}`);
}

function printInfo(message: string) {
    console.log(`ℹ️  ${message}`);
}

function printWarning(message: string) {
    console.log(`⚠️  ${message}`);
}

function printTable(title: string, data: any[]) {
    console.log(`\n📊 ${title}`);
    console.log('─'.repeat(90));
    data.forEach((item, idx) => {
        console.log(`   ${idx + 1}. ${item}`);
    });
}

function printDetails(label: string, obj: any, fields: string[]) {
    console.log(`\n${label}:`);
    fields.forEach(field => {
        if (obj[field] !== null && obj[field] !== undefined) {
            console.log(`   • ${field}: ${obj[field]}`);
        }
    });
}

// ==============================================================================
// TEST CLIENTI E FORNITORI
// ==============================================================================

async function testAnagraficaClientiEFornitori() {
    printHeader('SIMULAZIONE COMPLETA: CLIENTI & FORNITORI');
    console.log('Sistema: PULSE-ERP');
    console.log('Moduli: Anagrafica Clienti + Anagrafica Fornitori');
    console.log('Operazioni: CREATE, READ, UPDATE, DELETE, SEARCH, RELATIONS');

    const TOTAL_STEPS = 25;
    let currentStep = 0;

    try {
        // ══════════════════════════════════════════════════════════════
        // PARTE 1: GESTIONE CLIENTI AVANZATA
        // ══════════════════════════════════════════════════════════════
        printHeader('PARTE 1: GESTIONE CLIENTI');

        // STEP 1: Creazione multipla clienti
        printStep(++currentStep, TOTAL_STEPS, 'CREATE - Inserimento multiplo clienti (5 clienti)');

        const clientiDaCreare = [
            {
                id: randomUUID(),
                ragioneSociale: 'Tech Innovators S.r.l.',
                partitaIva: '10101010101',
                email: 'info@techinnovators.it',
                pec: 'techinnovators@pec.it',
                telefono: '+39 02 1111111',
                citta: 'Milano',
                provincia: 'MI',
                categoriaCliente: 'vip',
                settoreMerceologico: 'Information Technology',
                limiteCredito: '50000.00',
                stato: 'attivo',
                condizioni_pagamento: 'Bonifico 30gg',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Fashion House Italia',
                partitaIva: '20202020202',
                email: 'orders@fashionhouse.it',
                telefono: '+39 02 2222222',
                citta: 'Milano',
                provincia: 'MI',
                categoriaCliente: 'standard',
                settoreMerceologico: 'Moda',
                limiteCredito: '25000.00',
                stato: 'attivo',
                condizioni_pagamento: 'RiBa 60gg',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Food & Beverage Group S.p.A.',
                partitaIva: '30303030303',
                email: 'info@foodbeverage.it',
                telefono: '+39 051 3333333',
                citta: 'Bologna',
                provincia: 'BO',
                categoriaCliente: 'vip',
                settoreMerceologico: 'Food & Beverage',
                limiteCredito: '75000.00',
                stato: 'attivo',
                condizioni_pagamento: 'Bonifico 45gg',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Startup Digital Solutions',
                partitaIva: '40404040404',
                email: 'hello@startupdigital.com',
                telefono: '+39 06 4444444',
                citta: 'Roma',
                provincia: 'RM',
                categoriaCliente: 'prospect',
                settoreMerceologico: 'Digital Marketing',
                limiteCredito: '10000.00',
                stato: 'attivo',
                condizioni_pagamento: 'Bonifico anticipato',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Green Energy Italia S.r.l.',
                partitaIva: '50505050505',
                email: 'info@greenenergy.it',
                telefono: '+39 011 5555555',
                citta: 'Torino',
                provincia: 'TO',
                categoriaCliente: 'standard',
                settoreMerceologico: 'Energie Rinnovabili',
                limiteCredito: '30000.00',
                stato: 'attivo',
                condizioni_pagamento: 'Bonifico 30gg DF',
                createdAt: new Date().toISOString()
            }
        ];

        for (const cliente of clientiDaCreare) {
            await db.insert(anagraficaClienti).values(cliente);
        }

        printSuccess(`${clientiDaCreare.length} clienti creati con successo!`);
        clientiDaCreare.forEach((c, idx) => {
            console.log(`   ${idx + 1}. ${c.ragioneSociale} (${c.citta}) - Categoria: ${c.categoriaCliente}`);
        });

        // STEP 2: Lettura e visualizzazione tutti i clienti
        printStep(++currentStep, TOTAL_STEPS, 'READ ALL - Visualizzazione completa clienti');

        const tuttiClienti = await db.select().from(anagraficaClienti);
        printInfo(`Totale clienti nel database: ${tuttiClienti.length}`);

        printTable('Elenco completo clienti', tuttiClienti.map(c =>
            `${c.ragioneSociale} | ${c.citta || 'N/A'} | ${c.categoriaCliente || 'N/A'} | Fido: €${c.limiteCredito || '0'}`
        ));

        // STEP 3: Ricerca clienti VIP
        printStep(++currentStep, TOTAL_STEPS, 'SEARCH - Filtraggio clienti VIP');

        const clientiVIP = await db.select()
            .from(anagraficaClienti)
            .where(eq(anagraficaClienti.categoriaCliente, 'vip'));

        printSuccess(`Trovati ${clientiVIP.length} clienti VIP`);
        clientiVIP.forEach((c, idx) => {
            console.log(`   ${idx + 1}. ${c.ragioneSociale} - Limite credito: €${c.limiteCredito}`);
        });

        // STEP 4: Ricerca per città
        printStep(++currentStep, TOTAL_STEPS, 'SEARCH - Clienti a Milano');

        const clientiMilano = await db.select()
            .from(anagraficaClienti)
            .where(eq(anagraficaClienti.citta, 'Milano'));

        printSuccess(`Trovati ${clientiMilano.length} clienti a Milano`);
        clientiMilano.forEach(c => {
            console.log(`   • ${c.ragioneSociale} - ${c.settoreMerceologico || 'N/A'}`);
        });

        // STEP 5: Aggiunta referenti per un cliente
        printStep(++currentStep, TOTAL_STEPS, 'RELATIONS - Aggiunta referenti al cliente VIP');

        const clienteConReferenti = clientiDaCreare[0]; // Tech Innovators

        const referenti = [
            {
                id: randomUUID(),
                clienteId: clienteConReferenti.id,
                nome: 'Giovanni',
                cognome: 'Bianchi',
                ruolo: 'CEO',
                email: 'giovanni.bianchi@techinnovators.it',
                cellulare: '+39 333 1111111',
                principale: 1,
                riceveOfferte: 1,
                attivo: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                clienteId: clienteConReferenti.id,
                nome: 'Laura',
                cognome: 'Verdi',
                ruolo: 'CFO',
                email: 'laura.verdi@techinnovators.it',
                cellulare: '+39 333 2222222',
                principale: 0,
                riceveOfferte: 1,
                attivo: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                clienteId: clienteConReferenti.id,
                nome: 'Marco',
                cognome: 'Neri',
                ruolo: 'Procurement Manager',
                email: 'marco.neri@techinnovators.it',
                cellulare: '+39 333 3333333',
                principale: 0,
                riceveOfferte: 1,
                attivo: 1,
                createdAt: new Date().toISOString()
            }
        ];

        for (const ref of referenti) {
            await db.insert(referentiClienti).values(ref);
        }

        printSuccess(`${referenti.length} referenti aggiunti per ${clienteConReferenti.ragioneSociale}`);
        referenti.forEach((r, idx) => {
            console.log(`   ${idx + 1}. ${r.nome} ${r.cognome} - ${r.ruolo}${r.principale ? ' ⭐ (Principale)' : ''}`);
        });

        // STEP 6: Lettura referenti del cliente
        printStep(++currentStep, TOTAL_STEPS, 'READ - Recupero referenti del cliente');

        const referentiRecuperati = await db.select()
            .from(referentiClienti)
            .where(eq(referentiClienti.clienteId, clienteConReferenti.id));

        printSuccess(`Recuperati ${referentiRecuperati.length} referenti`);
        printDetails('Referente principale', referentiRecuperati[0],
            ['nome', 'cognome', 'ruolo', 'email', 'cellulare']);

        // STEP 7: Aggiunta indirizzi di spedizione multipli
        printStep(++currentStep, TOTAL_STEPS, 'RELATIONS - Indirizzi spedizione multipli');

        const indirizziSpedizione = [
            {
                id: randomUUID(),
                clienteId: clienteConReferenti.id,
                nome: 'Sede Principale Milano',
                indirizzo: 'Via Dante, 15',
                cap: '20121',
                citta: 'Milano',
                provincia: 'MI',
                principale: 1,
                attivo: 1,
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                clienteId: clienteConReferenti.id,
                nome: 'Magazzino Nord',
                indirizzo: 'Via Industria, 45',
                cap: '20020',
                citta: 'Lainate',
                provincia: 'MI',
                principale: 0,
                attivo: 1,
                createdAt: new Date().toISOString()
            }
        ];

        for (const ind of indirizziSpedizione) {
            await db.insert(indirizziSpedizioneClienti).values(ind);
        }

        printSuccess(`${indirizziSpedizione.length} indirizzi di spedizione aggiunti`);
        indirizziSpedizione.forEach((i, idx) => {
            console.log(`   ${idx + 1}. ${i.nome} - ${i.citta}${i.principale ? ' ⭐' : ''}`);
        });

        // STEP 8: Aggiornamento dati cliente (upgrade a VIP)
        printStep(++currentStep, TOTAL_STEPS, 'UPDATE - Upgrade cliente da PROSPECT a VIP');

        const clienteDaAggiornare = clientiDaCreare[3]; // Startup Digital

        const [clienteUpgradato] = await db.update(anagraficaClienti)
            .set({
                categoriaCliente: 'vip',
                limiteCredito: '40000.00',
                condizioni_pagamento: 'Bonifico 30gg',
                note: 'Cliente promosso a VIP dopo 3 ordini confermati',
                updatedAt: new Date().toISOString()
            })
            .where(eq(anagraficaClienti.id, clienteDaAggiornare.id))
            .returning();

        printSuccess('Cliente升级 completato!');
        console.log(`\n   Cliente: ${clienteUpgradato.ragioneSociale}`);
        console.log(`   Categoria: prospect → ${clienteUpgradato.categoriaCliente}`);
        console.log(`   Limite Credito: €${clienteDaAggiornare.limiteCredito} → €${clienteUpgradato.limiteCredito}`);
        console.log(`   Condizioni: ${clienteDaAggiornare.condizioni_pagamento} → ${clienteUpgradato.condizioni_pagamento}`);

        // STEP 9: Soft delete cliente
        printStep(++currentStep, TOTAL_STEPS, 'DELETE - Disattivazione cliente (soft delete)');

        const clienteDaDisattivare = clientiDaCreare[1]; // Fashion House

        await db.update(anagraficaClienti)
            .set({
                stato: 'cessato',
                attivo: 0,
                note: 'Cliente cessato - Chiusura azienda',
                updatedAt: new Date().toISOString()
            })
            .where(eq(anagraficaClienti.id, clienteDaDisattivare.id));

        printSuccess(`Cliente disattivato: ${clienteDaDisattivare.ragioneSociale}`);
        printWarning('Il cliente è ora nello stato "cessato" ma i dati rimangono nel database');

        // STEP 10: Conteggio clienti per categoria
        printStep(++currentStep, TOTAL_STEPS, 'ANALYTICS - Statistiche clienti per categoria');

        const clientiAttivi = await db.select()
            .from(anagraficaClienti)
            .where(eq(anagraficaClienti.attivo, 1));

        const statistiche = {
            totali: tuttiClienti.length,
            attivi: clientiAttivi.length,
            vip: clientiAttivi.filter(c => c.categoriaCliente === 'vip').length,
            standard: clientiAttivi.filter(c => c.categoriaCliente === 'standard').length,
            prospect: clientiAttivi.filter(c => c.categoriaCliente === 'prospect').length,
            cessati: tuttiClienti.length - clientiAttivi.length
        };

        console.log('\n📊 STATISTICHE CLIENTI:');
        console.log(`   Totale clienti: ${statistiche.totali}`);
        console.log(`   ├─ Attivi: ${statistiche.attivi}`);
        console.log(`   │  ├─ VIP: ${statistiche.vip}`);
        console.log(`   │  ├─ Standard: ${statistiche.standard}`);
        console.log(`   │  └─ Prospect: ${statistiche.prospect}`);
        console.log(`   └─ Cessati: ${statistiche.cessati}`);

        // ══════════════════════════════════════════════════════════════
        // PARTE 2: GESTIONE FORNITORI AVANZATA
        // ══════════════════════════════════════════════════════════════
        printHeader('PARTE 2: GESTIONE FORNITORI');

        // STEP 11: Creazione multipla fornitori
        printStep(++currentStep, TOTAL_STEPS, 'CREATE - Inserimento multiplo fornitori (5 fornitori)');

        const fornitoriDaCreare = [
            {
                id: randomUUID(),
                ragioneSociale: 'Global Tech Supplies Inc.',
                partitaIva: '11111111111',
                email: 'orders@globaltech.com',
                telefono: '+39 02 7777777',
                citta: 'Milano',
                provincia: 'MI',
                stato: 'attivo',
                condizioni_pagamento: 'Bonifico 60gg DF',
                iban: 'IT01A1234567890123456789012',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Office Supplies Italia S.r.l.',
                partitaIva: '22222222222',
                email: 'vendite@officesupplies.it',
                telefono: '+39 06 8888888',
                citta: 'Roma',
                provincia: 'RM',
                stato: 'attivo',
                condizioni_pagamento: 'Bonifico 30gg',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Cloud Services Provider S.p.A.',
                partitaIva: '33333333333',
                email: 'sales@cloudservices.it',
                telefono: '+39 02 9999999',
                citta: 'Milano',
                provincia: 'MI',
                stato: 'attivo',
                condizioni_pagamento: 'RiBa 45gg',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Print & Marketing Solutions',
                partitaIva: '44444444444',
                email: 'info@printmarketing.it',
                telefono: '+39 011 6666666',
                citta: 'Torino',
                provincia: 'TO',
                stato: 'attivo',
                condizioni_pagamento: 'Bonifico 30gg',
                createdAt: new Date().toISOString()
            },
            {
                id: randomUUID(),
                ragioneSociale: 'Energy & Utilities Corp.',
                partitaIva: '55555555555',
                email: 'clienti@energyutilities.it',
                telefono: '+39 02 5555555',
                citta: 'Milano',
                provincia: 'MI',
                stato: 'attivo',
                condizioni_pagamento: 'Addebito diretto',
                createdAt: new Date().toISOString()
            }
        ];

        for (const fornitore of fornitoriDaCreare) {
            await db.insert(anagraficaFornitori).values(fornitore);
        }

        printSuccess(`${fornitoriDaCreare.length} fornitori creati con successo!`);
        fornitoriDaCreare.forEach((f, idx) => {
            console.log(`   ${idx + 1}. ${f.ragioneSociale} (${f.citta}) - ${f.settoreMerceologico}`);
        });

        // STEP 12: Lettura tutti i fornitori
        printStep(++currentStep, TOTAL_STEPS, 'READ ALL - Visualizzazione fornitori');

        const tuttiFornitori = await db.select().from(anagraficaFornitori);
        printInfo(`Totale fornitori nel database: ${tuttiFornitori.length}`);

        printTable('Elenco completo fornitori', tuttiFornitori.map(f =>
            `${f.ragioneSociale} | ${f.citta || 'N/A'} | ${f.condizioni_pagamento || 'N/A'}`
        ));

        // STEP 13: Ricerca fornitori con IBAN configurato
        printStep(++currentStep, TOTAL_STEPS, 'SEARCH - Fornitori con IBAN configurato');

        const fornitoriConIBAN = tuttiFornitori.filter(f => f.iban && f.iban !== '');

        printSuccess(`Trovati ${fornitoriConIBAN.length} fornitori con IBAN configurato`);
        fornitoriConIBAN.forEach(f => {
            console.log(`   ⭐ ${f.ragioneSociale} - IBAN: ${f.iban}`);
        });

        // STEP 14: Ricerca fornitori a Milano
        printStep(++currentStep, TOTAL_STEPS, 'SEARCH - Fornitori localizzati a Milano');

        const fornitoriMilano = await db.select()
            .from(anagraficaFornitori)
            .where(eq(anagraficaFornitori.citta, 'Milano'));

        printSuccess(`Trovati ${fornitoriMilano.length} fornitori a Milano`);
        fornitoriMilano.forEach(f => {
            console.log(`   • ${f.ragioneSociale}`);
        });

        // STEP 15: Aggiornamento condizioni fornitore
        printStep(++currentStep, TOTAL_STEPS, 'UPDATE - Negoziazione migliori condizioni');

        const fornitoreDaAggiornare = fornitoriDaCreare[0]; // Global Tech

        const [fornitoreAggiornato] = await db.update(anagraficaFornitori)
            .set({
                condizioni_pagamento: 'Bonifico 90gg DF',
                note: 'Condizioni migliorate dopo volume acquisti: pagamento a 90gg',
                updatedAt: new Date().toISOString()
            })
            .where(eq(anagraficaFornitori.id, fornitoreDaAggiornare.id))
            .returning();

        printSuccess('Condizioni negoziate con successo!');
        console.log(`\n   Fornitore: ${fornitoreAggiornato.ragioneSociale}`);
        console.log(`   Pagamento: ${fornitoreDaAggiornare.condizioni_pagamento} → ${fornitoreAggiornato.condizioni_pagamento}`);

        // STEP 16: Aggiunta note fornitore
        printStep(++currentStep, TOTAL_STEPS, 'UPDATE - Aggiunta note di avviso fornitore');

        const fornitoreProblematico = fornitoriDaCreare[1]; // Office Supplies

        await db.update(anagraficaFornitori)
            .set({
                note: 'ATTENZIONE: Ritardi frequenti nelle consegne. Valutare fornitori alternativi.',
                updatedAt: new Date().toISOString()
            })
            .where(eq(anagraficaFornitori.id, fornitoreProblematico.id));

        printWarning(`Aggiunta nota di avviso per fornitore: ${fornitoreProblematico.ragioneSociale}`);

        // STEP 17: Sospensione fornitore
        printStep(++currentStep, TOTAL_STEPS, 'DELETE - Sospensione fornitore');

        const fornitoreDaSospendere = fornitoriDaCreare[4]; // Energy & Utilities

        await db.update(anagraficaFornitori)
            .set({
                stato: 'sospeso',
                attivo: 0,
                note: 'Fornitore sospeso - In attesa risoluzione contestazione fattura',
                updatedAt: new Date().toISOString()
            })
            .where(eq(anagraficaFornitori.id, fornitoreDaSospendere.id));

        printSuccess(`Fornitore sospeso: ${fornitoreDaSospendere.ragioneSociale}`);

        // STEP 18: Statistiche fornitori
        printStep(++currentStep, TOTAL_STEPS, 'ANALYTICS - Statistiche fornitori');

        const fornitoriAttivi = await db.select()
            .from(anagraficaFornitori)
            .where(eq(anagraficaFornitori.attivo, 1));

        const statFornitori = {
            totali: tuttiFornitori.length,
            attivi: fornitoriAttivi.length,
            conIBAN: fornitoriAttivi.filter(f => f.iban && f.iban !== '').length,
            senzaIBAN: fornitoriAttivi.filter(f => !f.iban || f.iban === '').length,
            sospesi: tuttiFornitori.length - fornitoriAttivi.length
        };

        console.log('\n📊 STATISTICHE FORNITORI:');
        console.log(`   Totale fornitori: ${statFornitori.totali}`);
        console.log(`   ├─ Attivi: ${statFornitori.attivi}`);
        console.log(`   │  ├─ Con IBAN: ${statFornitori.conIBAN}`);
        console.log(`   │  └─ Senza IBAN: ${statFornitori.senzaIBAN}`);
        console.log(`   └─ Sospesi: ${statFornitori.sospesi}`);

        // ══════════════════════════════════════════════════════════════
        // PARTE 3: OPERAZIONI AVANZATE
        // ══════════════════════════════════════════════════════════════
        printHeader('PARTE 3: OPERAZIONI AVANZATE');

        // STEP 19: Ricerca combinata (clienti E fornitori a Milano)
        printStep(++currentStep, TOTAL_STEPS, 'ADVANCED SEARCH - Tutti i partner a Milano');

        const clientiMI = await db.select().from(anagraficaClienti).where(eq(anagraficaClienti.citta, 'Milano'));
        const fornitoriMI = await db.select().from(anagraficaFornitori).where(eq(anagraficaFornitori.citta, 'Milano'));

        console.log('\n🏙️  PARTNER A MILANO:');
        console.log(`\n   CLIENTI (${clientiMI.length}):`);
        clientiMI.forEach(c => console.log(`      • ${c.ragioneSociale}`));
        console.log(`\n   FORNITORI (${fornitoriMI.length}):`);
        fornitoriMI.forEach(f => console.log(`      • ${f.ragioneSociale}`));

        // STEP 20: Aggiornamento massivo - Tag di settore
        printStep(++currentStep, TOTAL_STEPS, 'BULK UPDATE - Applicazione tag settore IT');

        const clientiIT = await db.select()
            .from(anagraficaClienti)
            .where(
                or(
                    like(anagraficaClienti.settoreMerceologico, '%Technology%'),
                    like(anagraficaClienti.settoreMerceologico, '%Digital%'),
                    like(anagraficaClienti.settoreMerceologico, '%Information%')
                )
            );

        for (const cliente of clientiIT) {
            await db.update(anagraficaClienti)
                .set({
                    tags: 'IT,Tech,Innovation',
                    updatedAt: new Date().toISOString()
                })
                .where(eq(anagraficaClienti.id, cliente.id));
        }

        printSuccess(`Tag applicati a ${clientiIT.length} clienti del settore IT`);

        // STEP 21: Report completo cliente con relazioni
        printStep(++currentStep, TOTAL_STEPS, 'REPORT - Scheda completa cliente (con referenti e indirizzi)');

        const clienteReport = clientiDaCreare[0];
        const [clienteDettaglio] = await db.select().from(anagraficaClienti).where(eq(anagraficaClienti.id, clienteReport.id));
        const referentiCliente = await db.select().from(referentiClienti).where(eq(referentiClienti.clienteId, clienteReport.id));
        const indirizziCliente = await db.select().from(indirizziSpedizioneClienti).where(eq(indirizziSpedizioneClienti.clienteId, clienteReport.id));

        console.log('\n' + '═'.repeat(90));
        console.log('  📄 SCHEDA COMPLETA CLIENTE');
        console.log('═'.repeat(90));

        printDetails('DATI PRINCIPALI', clienteDettaglio,
            ['ragioneSociale', 'partitaIva', 'email', 'telefono', 'citta', 'categoriaCliente', 'limiteCredito']);

        console.log(`\n   REFERENTI (${referentiCliente.length}):`);
        referentiCliente.forEach((r, idx) => {
            console.log(`      ${idx + 1}. ${r.nome} ${r.cognome} - ${r.ruolo} (${r.email})`);
        });

        console.log(`\n   INDIRIZZI SPEDIZIONE (${indirizziCliente.length}):`);
        indirizziCliente.forEach((i, idx) => {
            console.log(`      ${idx + 1}. ${i.nome} - ${i.citta}${i.principale ? ' ⭐ PRINCIPALE' : ''}`);
        });

        // STEP 22: Ripristino cliente cessato
        printStep(++currentStep, TOTAL_STEPS, 'RESTORE - Riattivazione cliente cessato');

        await db.update(anagraficaClienti)
            .set({
                stato: 'attivo',
                attivo: 1,
                note: 'Cliente riattivato - Nuova gestione aziendale',
                updatedAt: new Date().toISOString()
            })
            .where(eq(anagraficaClienti.id, clientiDaCreare[1].id));

        printSuccess(`Cliente ${clientiDaCreare[1].ragioneSociale} riattivato con successo`);

        // STEP 23: Eliminazione referente
        printStep(++currentStep, TOTAL_STEPS, 'DELETE RELATION - Rimozione referente');

        const referenteDaEliminare = referenti[2]; // Marco Neri
        await db.delete(referentiClienti).where(eq(referentiClienti.id, referenteDaEliminare.id));

        printSuccess(`Referente rimosso: ${referenteDaEliminare.nome} ${referenteDaEliminare.cognome}`);

        // STEP 24: Verifica integrità dati
        printStep(++currentStep, TOTAL_STEPS, 'VALIDATION - Verifica integrità database');

        const clientiSenzaEmail = await db.select()
            .from(anagraficaClienti)
            .where(or(
                eq(anagraficaClienti.email, ''),
                eq(anagraficaClienti.email, null as any)
            ));

        if (clientiSenzaEmail.length > 0) {
            printWarning(`${clientiSenzaEmail.length} clienti senza email!`);
        } else {
            printSuccess('Tutti i clienti hanno un indirizzo email');
        }

        const fornitoriSenzaIBAN = tuttiFornitori.filter(f => !f.iban || f.iban === '');
        if (fornitoriSenzaIBAN.length > 0) {
            printWarning(`${fornitoriSenzaIBAN.length} fornitori senza IBAN`);
        } else {
            printSuccess('Tutti i fornitori hanno IBAN configurato');
        }

        // STEP 25: Riepilogo finale
        printStep(++currentStep, TOTAL_STEPS, 'SUMMARY - Riepilogo operazioni completate');

        printHeader('RIEPILOGO FINALE - TEST CLIENTI & FORNITORI');

        const clientiFinali = await db.select().from(anagraficaClienti);
        const fornitoriFinali = await db.select().from(anagraficaFornitori);
        const referentiFinali = await db.select().from(referentiClienti);
        const indirizziFinali = await db.select().from(indirizziSpedizioneClienti);

        console.log('\n✅ TUTTE LE ' + TOTAL_STEPS + ' OPERAZIONI COMPLETATE CON SUCCESSO!\n');

        console.log('📊 RISULTATI FINALI:\n');
        console.log('   CLIENTI:');
        console.log(`      • Totale clienti: ${clientiFinali.length}`);
        console.log(`      • Referenti configurati: ${referentiFinali.length}`);
        console.log(`      • Indirizzi spedizione: ${indirizziFinali.length}`);
        console.log(`      • Clienti VIP: ${clientiFinali.filter(c => c.categoriaCliente === 'vip').length}`);
        console.log(`      • Clienti attivi: ${clientiFinali.filter(c => c.attivo === 1).length}`);

        console.log('\n   FORNITORI:');
        console.log(`      • Totale fornitori: ${fornitoriFinali.length}`);
        console.log(`      • Con IBAN configurato: ${fornitoriFinali.filter(f => f.iban && f.iban !== '').length}`);
        console.log(`      • Fornitori attivi: ${fornitoriFinali.filter(f => f.attivo === 1).length}`);

        console.log('\n   OPERAZIONI ESEGUITE:');
        console.log('      ✓ Creazione multipla (clienti e fornitori)');
        console.log('       ✓ Ricerche e filtri avanzati');
        console.log('      ✓ Gestione relazioni (referenti, indirizzi)');
        console.log('      ✓ Aggiornamenti singoli e massivi');
        console.log('      ✓ Soft delete e ripristino');
        console.log('      ✓ Analytics e statistiche');
        console.log('      ✓ Validazione integrità dati');

        console.log('\n' + '═'.repeat(90));
        console.log('  🎯 TEST COMPLETATI: 25/25');
        console.log('  ✅ Sistema CLIENTI & FORNITORI pienamente funzionante');
        console.log('  📊 Database testato con successo');
        console.log('═'.repeat(90) + '\n');

        process.exit(0);

    } catch (error: any) {
        console.error('\n❌ ERRORE DURANTE IL TEST:');
        console.error('Messaggio:', error.message);
        if (error.stack) console.error('\nStack trace:', error.stack);
        process.exit(1);
    }
}

// Avvio test
console.log('\n🚀 PULSE-ERP - Avvio test approfondito CLIENTI & FORNITORI...\n');
testAnagraficaClientiEFornitori();

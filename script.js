// Asetetaan kiinteät palkka-arvot
const TUNTIPALKKA = 14.90;
const PAIVARAHA_ARVO = 52.00;

// Haetaan HTML-elementit muuttujiin
const pvmInput = document.getElementById('pvm');
const asiakasInput = document.getElementById('asiakas');
const paikkakuntaInput = document.getElementById('paikkakunta');
const tunnitInput = document.getElementById('tunnit');
const urakkaInput = document.getElementById('urakka');
const tyontehtavaInput = document.getElementById('tyontehtava');
const paivarahatCheckbox = document.getElementById('paivarahatCheckbox');
const lisaaButton = document.getElementById('lisaaButton');
const merkinnatLista = document.getElementById('merkinnatLista');
const tallennaKuukausiButton = document.getElementById('tallennaKuukausi');
const viestiAlue = document.getElementById('viestiAlue');
const kayttajanimiInput = document.getElementById('kayttajanimi');

const urakkaYhteensaSpan = document.getElementById('urakkaYhteensa');
const tuntiPalkkaYhteensaSpan = document.getElementById('tuntiPalkkaYhteensa');
const paivarahatYhteensaSpan = document.getElementById('paivarahatYhteensa');
const bruttoPalkkaYhteensaSpan = document.getElementById('bruttoPalkkaYhteensa');

let merkinnat = [];
let kayttajanimi = '';

function naytaViesti(teksti, tyyppi = 'info') {
    viestiAlue.textContent = teksti;
    viestiAlue.className = `viesti ${tyyppi}`;
    setTimeout(() => {
        viestiAlue.textContent = '';
        viestiAlue.className = '';
    }, 3000);
}

function tallennaMerkinnat() {
    localStorage.setItem('palkkaMerkinnat', JSON.stringify(merkinnat));
    localStorage.setItem('kayttajanimi', kayttajanimiInput.value);
}

function lataaMerkinnat() {
    const tallennetut = localStorage.getItem('palkkaMerkinnat');
    const tallennettuNimi = localStorage.getItem('kayttajanimi');
    
    if (tallennetut) {
        merkinnat = JSON.parse(tallennetut);
        paivitaMerkinnatLista();
        paivitaYhteenveto();
    }

    if (tallennettuNimi) {
        kayttajanimiInput.value = tallennettuNimi;
        kayttajanimi = tallennettuNimi;
    }
}

function paivitaYhteenveto() {
    let kokonaisUrakka = 0;
    let kokonaisTunnit = 0;
    let kokonaisPaivarahat = 0;
    
    merkinnat.forEach(merkinta => {
        if (merkinta.urakka > 0) {
            kokonaisUrakka += merkinta.urakka;
        } else if (merkinta.tunnit > 0) {
            kokonaisTunnit += merkinta.tunnit;
        }
        kokonaisPaivarahat += merkinta.paivarahat;
    });

    const tuntiPalkkaYhteensa = kokonaisTunnit * TUNTIPALKKA;
    const bruttoPalkka = kokonaisUrakka + tuntiPalkkaYhteensa;

    urakkaYhteensaSpan.textContent = kokonaisUrakka.toFixed(2);
    tuntiPalkkaYhteensaSpan.textContent = tuntiPalkkaYhteensa.toFixed(2);
    paivarahatYhteensaSpan.textContent = kokonaisPaivarahat.toFixed(2);
    bruttoPalkkaYhteensaSpan.textContent = bruttoPalkka.toFixed(2);
}

function paivitaMerkinnatLista() {
    merkinnatLista.innerHTML = '';
    merkinnat.forEach((merkinta, index) => {
        const li = document.createElement('li');
        let teksti = `${merkinta.pvm}: `;
        
        let lisatiedot = [];
        if (merkinta.asiakas) lisatiedot.push(merkinta.asiakas);
        if (merkinta.paikkakunta) lisatiedot.push(merkinta.paikkakunta);
        if (lisatiedot.length > 0) {
            teksti += `(${lisatiedot.join(', ')}) `;
        }
        
        if (merkinta.urakka > 0) {
            teksti += `Urakka (${merkinta.urakka.toFixed(2)} €)`;
        } else {
            teksti += `${merkinta.tunnit} h`;
        }
        
        if (merkinta.paivarahat > 0) {
            teksti += ` + Päiväraha (${merkinta.paivarahat.toFixed(2)} €)`;
        }
        
        li.innerHTML = `
            <span>${teksti}</span>
            <div class="merkinta-toiminnot">
                <button class="poista-btn" data-index="${index}">Poista</button>
            </div>
        `;

        li.querySelector('.poista-btn').addEventListener('click', function() {
            if (confirm("Haluatko varmasti poistaa merkinnän?")) {
                merkinnat.splice(index, 1);
                tallennaMerkinnat();
                paivitaMerkinnatLista();
                paivitaYhteenveto();
                naytaViesti("Merkintä poistettu.", "success");
            }
        });
        
        merkinnatLista.appendChild(li);
    });
}

function lisaaMerkinta() {
    const pvm = pvmInput.value;
    const asiakas = asiakasInput.value;
    const paikkakunta = paikkakuntaInput.value;
    const tunnit = parseFloat(tunnitInput.value) || 0;
    const urakka = parseFloat(urakkaInput.value) || 0;
    const tyontehtava = tyontehtavaInput.value;
    const paivarahat = paivarahatCheckbox.checked ? PAIVARAHA_ARVO : 0;
    
    if (!pvm || (tunnit <= 0 && urakka <= 0)) {
        naytaViesti("Syötä päivämäärä sekä tunnit tai urakan hinta.", "error");
        return;
    }

    const uusiMerkinta = {
        pvm: pvm,
        asiakas: asiakas,
        paikkakunta: paikkakunta,
        tunnit: tunnit,
        urakka: urakka,
        tyontehtava: tyontehtava,
        paivarahat: paivarahat
    };

    merkinnat.push(uusiMerkinta);
    tallennaMerkinnat();
    
    pvmInput.value = '';
    asiakasInput.value = '';
    paikkakuntaInput.value = '';
    tunnitInput.value = '';
    urakkaInput.value = '';
    tyontehtavaInput.value = '';
    paivarahatCheckbox.checked = false;
    paivitaMerkinnatLista();
    paivitaYhteenveto();
    naytaViesti("Merkintä lisätty onnistuneesti!", "success");
}

function tallennaKuukausi() {
    if (merkinnat.length === 0) {
        naytaViesti("Ei merkintöjä tallennettavaksi.", "error");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    let y = 20;

    // Käyttäjänimi PDF-tiedoston ylälaitaan
    const nimi = kayttajanimiInput.value || "Tuntematon käyttäjä";
    doc.setFontSize(12);
    doc.text(`Käyttäjä: ${nimi}`, 10, y);
    y += 10;

    // Otsikko
    doc.setFontSize(20);
    doc.text("Palkkalaskelma", 10, y);
    y += 10;
    doc.setFontSize(12);
    const kuukausi = new Date().toLocaleDateString('fi-FI', { year: 'numeric', month: 'long' });
    doc.text(`Kuukausi: ${kuukausi}`, 10, y);
    y += 20;
    
    // Merkinnät-taulukko
    const data = merkinnat.map(m => [
        m.pvm,
        m.asiakas,
        m.paikkakunta,
        m.tyontehtava,
        m.tunnit > 0 ? `${m.tunnit} h` : '',
        m.urakka > 0 ? `${m.urakka.toFixed(2)} €` : '',
        m.paivarahat > 0 ? `${m.paivarahat.toFixed(2)} €` : ''
    ]);
    
    doc.autoTable({
        startY: y,
        head: [['Päivämäärä', 'Asiakas', 'Paikkakunta', 'Työntehtävä', 'Tunnit', 'Urakka', 'Päiväraha']],
        body: data,
        styles: {
            font: 'Helvetica',
            fontSize: 9,
        },
        headStyles: {
            fillColor: [55, 71, 79],
            textColor: 255
        },
        columnStyles: {
            3: { cellWidth: 35 }
        },
        didDrawPage: (data) => {
            y = data.cursor.y + 10;
        }
    });
    
    y = doc.autoTable.previous.finalY + 10;
    
    // Yhteenveto
    doc.setFontSize(14);
    doc.text("Yhteenveto:", 10, y);
    y += 10;

    const urakkaYhteensa = merkinnat.reduce((sum, m) => sum + m.urakka, 0);
    const tuntipalkkaYhteensa = merkinnat.reduce((sum, m) => sum + m.tunnit, 0) * TUNTIPALKKA;
    const bruttopalkka = urakkaYhteensa + tuntipalkkaYhteensa;
    const paivarahatYhteensa = merkinnat.reduce((sum, m) => sum + m.paivarahat, 0);
    
    doc.setFontSize(12);
    doc.text(`Urakkapalkka yhteensä: ${urakkaYhteensa.toFixed(2)} €`, 10, y);
    y += 10;
    doc.text(`Tuntipalkka yhteensä: ${tuntipalkkaYhteensa.toFixed(2)} €`, 10, y);
    y += 10;
    doc.setFontSize(14);
    doc.text(`Bruttopalkka yhteensä: ${bruttopalkka.toFixed(2)} €`, 10, y);
    y += 10;
    
    doc.setFontSize(14);
    doc.text(`Päivärahat yhteensä: ${paivarahatYhteensa.toFixed(2)} €`, 10, y);
    y += 10;

    // Tallennetaan tiedosto
    doc.save(`palkkalaskelma_${new Date().toISOString().slice(0, 7)}.pdf`);
    
    // TÄRKEÄ MUUTOS: Tässä kohdassa EI enää tyhjennetä merkintöjä.
    // Tiedot säilyvät seuraavaa käyttökertaa varten.
    naytaViesti("Palkkalaskelma tallennettu.", "success");
}

// Tapahtumankuuntelijat
lisaaButton.addEventListener('click', lisaaMerkinta);
tallennaKuukausiButton.addEventListener('click', tallennaKuukausi);
kayttajanimiInput.addEventListener('input', tallennaMerkinnat); // Tallennetaan nimi automaattisesti

// Kutsutaan funktiota sivun latautuessa
lataaMerkinnat();
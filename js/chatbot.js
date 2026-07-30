(() => {
    const PHONE_DISPLAY = "044 236 5158";
    const PHONE_LINK = "tel:+358442365158";
    const EMAIL = "leppavedensiivouspalvelu@gmail.com";
    const FORM_ACTION = "https://formspree.io/f/mqeryrnl";
    const THANK_YOU_URL = "https://www.leppavedensiivous.fi/kiitos.html";

    const normalize = (value) => value
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9åäö\s-]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const containsAny = (text, words) => words.some((word) => text.includes(word));

    const topicFromText = (text) => {
        if (containsAny(text, ["yrityssiiv", "toimistosiiv", "toimitila", "liiketila", "yrityks", "ylläpitosiiv", "yllapitosiiv"])) {
            return "Yrityssiivous";
        }
        if (containsAny(text, ["muuttosiiv", "muutto", "loppusiiv"])) {
            return "Muuttosiivous";
        }
        if (containsAny(text, ["ikkunanpes", "ikkuna", "parvekelasi", "sälekaihd", "salekaihd"])) {
            return "Ikkunanpesu";
        }
        if (containsAny(text, ["kotisiiv", "koti", "ylläpitosiivous kotiin", "yllapitosiivous kotiin", "viikkosiiv"])) {
            return "Kotisiivous";
        }
        return "";
    };

    const initialTopic = () => {
        const path = window.location.pathname;
        if (path.includes("yrityssiivous")) return "Yrityssiivous";
        if (path.includes("muuttosiivous")) return "Muuttosiivous";
        if (path.includes("ikkunanpesu")) return "Ikkunanpesu";
        if (path.includes("kotisiivous")) return "Kotisiivous";
        return "";
    };

    const root = document.createElement("div");
    root.className = "lsp-chatbot";
    root.innerHTML = `
        <button class="lsp-chatbot-launcher" type="button" aria-expanded="false" aria-controls="lsp-chatbot-panel">
            <span class="lsp-chatbot-launcher-icon" aria-hidden="true">✦</span>
            <span>Kysy siivouksesta</span>
        </button>
        <section class="lsp-chatbot-panel" id="lsp-chatbot-panel" role="dialog" aria-labelledby="lsp-chatbot-heading" hidden>
            <header class="lsp-chatbot-header">
                <div>
                    <h2 class="lsp-chatbot-heading" id="lsp-chatbot-heading">Siivousneuvoja</h2>
                    <p class="lsp-chatbot-status">Valmiina auttamaan</p>
                </div>
                <button class="lsp-chatbot-close" type="button" aria-label="Sulje keskustelu">×</button>
            </header>
            <div class="lsp-chatbot-messages" role="log" aria-live="polite" aria-relevant="additions"></div>
            <form class="lsp-chatbot-composer">
                <label class="lsp-chatbot-honeypot" for="lsp-chatbot-question">Kirjoita kysymyksesi</label>
                <input class="lsp-chatbot-input" id="lsp-chatbot-question" type="text" maxlength="300" autocomplete="off" placeholder="Kirjoita kysymys…">
                <button class="lsp-chatbot-send" type="submit" aria-label="Lähetä kysymys">→</button>
            </form>
            <p class="lsp-chatbot-note">Vastaukset perustuvat sivuston tietoihin. Älä lähetä arkaluonteisia tietoja.</p>
        </section>
    `;
    document.body.appendChild(root);

    const backToTopButton = document.querySelector("#backToTop");
    if (backToTopButton) {
        backToTopButton.style.bottom = "96px";
    }

    const launcher = root.querySelector(".lsp-chatbot-launcher");
    const panel = root.querySelector(".lsp-chatbot-panel");
    const closeButton = root.querySelector(".lsp-chatbot-close");
    const messages = root.querySelector(".lsp-chatbot-messages");
    const composer = root.querySelector(".lsp-chatbot-composer");
    const questionInput = root.querySelector(".lsp-chatbot-input");

    let lastTopic = initialTopic();
    let leadForm;

    const scrollToLatest = () => {
        window.requestAnimationFrame(() => {
            messages.scrollTop = messages.scrollHeight;
        });
    };

    const createAction = (action) => {
        if (action.href) {
            const link = document.createElement("a");
            link.className = "lsp-chatbot-action";
            link.href = action.href;
            link.textContent = action.label;
            if (action.external) {
                link.target = "_blank";
                link.rel = "noopener";
            }
            return link;
        }

        const button = document.createElement("button");
        button.className = "lsp-chatbot-action";
        button.type = "button";
        button.textContent = action.label;
        button.addEventListener("click", () => {
            if (action.value === "__lead__") {
                showLeadForm();
                return;
            }
            submitQuestion(action.value);
        });
        return button;
    };

    const addMessage = (text, sender = "bot", actions = []) => {
        const message = document.createElement("div");
        message.className = `lsp-chatbot-message lsp-chatbot-message--${sender}`;
        message.textContent = text;
        messages.appendChild(message);

        if (actions.length) {
            const actionRow = document.createElement("div");
            actionRow.className = "lsp-chatbot-actions";
            actions.forEach((action) => actionRow.appendChild(createAction(action)));
            messages.appendChild(actionRow);
        }
        scrollToLatest();
    };

    const topicAnswer = (topic) => {
        const answers = {
            "Yrityssiivous": {
                text: "Yrityssiivous suunnitellaan toimitilan koon, käytön ja puhtaustavoitteen mukaan. Palvelu sopii esimerkiksi toimistoihin, liiketiloihin, vastaanottotiloihin ja muihin pieniin tai keskisuuriin toimitiloihin. Siivous voi olla säännöllistä tai kertaluonteista.",
                page: "yrityssiivous.html"
            },
            "Kotisiivous": {
                text: "Kotisiivouksen voi tilata viikoittain, kahden viikon välein, kuukausittain tai kertaluonteisesti. Siivous voidaan sopia kodin ja toiveidesi mukaan, ja tarvittaessa välineet sekä aineet tuodaan mukana.",
                page: "kotisiivous.html"
            },
            "Muuttosiivous": {
                text: "Muuttosiivous suunnitellaan kohteen koon ja kunnon mukaan. Se voi sisältää keittiön, kylpyhuoneen, WC:n ja muiden tilojen perusteellisen puhdistuksen. Ikkunanpesun voi lisätä samaan kokonaisuuteen.",
                page: "muuttosiivous.html"
            },
            "Ikkunanpesu": {
                text: "Ikkunanpesua tehdään koteihin, yrityksiin ja taloyhtiöihin. Tarvittaessa mukana tulevat pesuvälineet ja aineet. Ikkunanpesun voi yhdistää koti- tai muuttosiivoukseen.",
                page: "ikkunanpesu.html"
            }
        };
        return answers[topic];
    };

    const priceAnswer = () => {
        if (lastTopic === "Kotisiivous") {
            return "Kotisiivouksen sivulla ilmoitettu hinta on 35 € / h, sisältäen arvonlisäveron. Tarkka kokonaiskustannus riippuu työn määrästä.";
        }
        if (lastTopic === "Yrityssiivous") {
            return "Yrityssiivouksen hintaan vaikuttavat tilan koko, tilatyyppi, palvelun sisältö ja käyntitiheys. Kun kerrot nämä tiedot, saat kohteeseen perustuvan maksuttoman tarjouksen.";
        }
        if (lastTopic === "Muuttosiivous") {
            return "Muuttosiivouksen hinta arvioidaan kohteen koon, kunnon ja sovittujen lisäpalvelujen perusteella. Kerro tarjouspyynnössä pinta-ala ja muuttopäivä.";
        }
        if (lastTopic === "Ikkunanpesu") {
            return "Ikkunanpesun hinta määräytyy muun muassa ikkunoiden määrän, koon ja rakenteen perusteella. Kerro tarjouspyynnössä ikkunoiden lukumäärä ja kohteen sijainti.";
        }
        return "Kotisiivouksen sivulla ilmoitettu hinta on 35 € / h sis. ALV. Muut palvelut hinnoitellaan kohteen ja työn sisällön mukaan. Maksuttoman tarjouksen saat jättämällä kohteen tiedot.";
    };

    const responseFor = (rawText) => {
        const text = normalize(rawText);
        const detectedTopic = topicFromText(text);
        if (detectedTopic) {
            lastTopic = detectedTopic;
        }

        if (containsAny(text, ["tarjous", "yhteydenotto", "ota yhteyttä", "ota yhteytta", "varaa", "tilata", "haluan palvelun", "jätä yhteystiedot", "jata yhteystiedot"])) {
            return {
                text: "Totta kai. Jätä yhteystietosi ja lyhyt kuvaus kohteesta, niin Leppäveden Siivouspalvelu voi olla sinuun yhteydessä.",
                actions: [{label:"Avaa yhteydenottolomake",value:"__lead__"}]
            };
        }

        if (containsAny(text, ["hinta", "maksaa", "paljonko", "hinnoittelu", "euro", "€/h", "tuntihinta"])) {
            return {
                text: priceAnswer(),
                actions: [{label:"Pyydä tarkka tarjous",value:"__lead__"}]
            };
        }

        if (containsAny(text, ["puhelin", "numero", "sähköposti", "sahkoposti", "soittaa", "whatsapp", "yhteystiedot", "yhteys"])) {
            return {
                text: `Saat yhteyden puhelimitse numerosta ${PHONE_DISPLAY} tai sähköpostilla ${EMAIL}. Voit myös jättää yhteydenottopyynnön tässä keskustelussa.`,
                actions: [
                    {label:"Soita",href:PHONE_LINK},
                    {label:"Lähetä sähköposti",href:`mailto:${EMAIL}`},
                    {label:"Jätä yhteystiedot",value:"__lead__"}
                ]
            };
        }

        if (containsAny(text, ["alue", "missä", "missa", "paikkakunta", "jyväskyl", "jyvaskyl", "laukaa", "leppäve", "leppave", "lähialue", "lahialue"])) {
            return {
                text: "Palvelualueeseen kuuluvat Jyväskylä, Laukaa ja Leppävesi. Myös lähialueita voidaan palvella sopimuksen mukaan.",
                actions: [{label:"Kysy omasta kohteesta",value:"__lead__"}]
            };
        }

        if (containsAny(text, ["väline", "valine", "aineet", "pesuaine", "tarvikkeet", "omat aineet"])) {
            return {
                text: "Kyllä, tarvittaessa kaikki tarvittavat siivousvälineet ja pesuaineet tuodaan mukana. Kohdekohtaisista toiveista kannattaa mainita tarjouspyynnössä."
            };
        }

        if (containsAny(text, ["kotitalousväh", "kotitalousvah", "veroväh", "verovah"])) {
            return {
                text: "Kotisiivouksesta voi saada kotitalousvähennyksen Verohallinnon kulloinkin voimassa olevien sääntöjen mukaisesti. Tarkista oma tilanteesi ja ajantasaiset ehdot Verohallinnolta."
            };
        }

        if (containsAny(text, ["kuinka usein", "käyntiväli", "kayntivali", "viikoittain", "kuukausittain", "kertaluonte", "säännöllinen", "saannollinen"])) {
            if (lastTopic === "Yrityssiivous") {
                return {
                    text: "Yrityssiivouksen käyntiväli sovitaan tilojen käytön ja siivoustarpeen mukaan. Palvelu voi olla säännöllinen tai yksittäinen siivouskäynti."
                };
            }
            return {
                text: "Kotisiivouksen voi tilata viikoittain, kahden viikon välein, kuukausittain tai kertaluonteisesti. Myös muut palvelut voidaan sopia tarpeen mukaan."
            };
        }

        if (containsAny(text, ["kauanko", "kuinka kauan", "kesto", "kestää", "kestaa"])) {
            return {
                text: "Työn kesto riippuu kohteen koosta, kunnosta ja sovitusta sisällöstä. Saat arvion tarjousvaiheessa, kun kerrot kohteen perustiedot.",
                actions: [{label:"Kerro kohteen tiedot",value:"__lead__"}]
            };
        }

        if (detectedTopic) {
            const answer = topicAnswer(detectedTopic);
            return {
                text: answer.text,
                actions: [
                    {label:"Lue lisää",href:answer.page},
                    {label:"Mitä maksaa?",value:`Mitä ${detectedTopic.toLowerCase()} maksaa?`},
                    {label:"Pyydä tarjous",value:"__lead__"}
                ]
            };
        }

        if (containsAny(text, ["hei", "moi", "terve", "päivää", "paivaa", "hello"])) {
            return {
                text: "Hei! Autan mielelläni siivouspalvelun valinnassa. Voit kysyä palveluista, hinnasta, alueesta tai jättää yhteydenottopyynnön.",
                actions: [
                    {label:"Yrityssiivous",value:"Yrityssiivous"},
                    {label:"Kotisiivous",value:"Kotisiivous"},
                    {label:"Pyydä tarjous",value:"__lead__"}
                ]
            };
        }

        if (containsAny(text, ["auki", "aukiolo", "milloin pääsee", "milloin paasee", "vapaa aika", "saatavuus"])) {
            return {
                text: "Vapaat ajat ja sopiva siivousajankohta varmistetaan suoraan yrittäjältä. Jätä yhteydenottopyyntö tai soita, niin saat ajantasaisen vastauksen.",
                actions: [
                    {label:"Jätä yhteystiedot",value:"__lead__"},
                    {label:"Soita",href:PHONE_LINK}
                ]
            };
        }

        return {
            text: "En halua arvata vastausta, jota sivuston tiedoista ei löydy. Voit jättää kysymyksesi yhteydenottopyyntöön, soittaa tai valita alta palvelun.",
            actions: [
                {label:"Jätä yhteystiedot",value:"__lead__"},
                {label:"Soita",href:PHONE_LINK},
                {label:"Yrityssiivous",value:"Yrityssiivous"},
                {label:"Kotisiivous",value:"Kotisiivous"}
            ]
        };
    };

    const showLeadForm = () => {
        if (leadForm) {
            leadForm.scrollIntoView({behavior:"smooth",block:"nearest"});
            const firstField = leadForm.querySelector("input:not([type='hidden'])");
            if (firstField) firstField.focus();
            return;
        }

        addMessage("Täytä yhteystietosi. Lomake lähetetään suoraan Leppäveden Siivouspalvelulle.");

        leadForm = document.createElement("form");
        leadForm.className = "lsp-chatbot-lead";
        leadForm.action = FORM_ACTION;
        leadForm.method = "POST";

        const serviceOptions = ["Kotisiivous","Muuttosiivous","Ikkunanpesu","Yrityssiivous","Muu siivouspalvelu"]
            .map((service) => `<option value="${service}"${service === lastTopic ? " selected" : ""}>${service}</option>`)
            .join("");

        leadForm.innerHTML = `
            <h3 class="lsp-chatbot-lead-title">Pyydä yhteydenottoa</h3>
            <p class="lsp-chatbot-lead-intro">Tarjouspyyntö on maksuton eikä sido tilaamaan.</p>
            <div class="lsp-chatbot-field">
                <label for="lsp-lead-name">Nimi *</label>
                <input id="lsp-lead-name" name="Nimi" type="text" autocomplete="name" required>
            </div>
            <div class="lsp-chatbot-field">
                <label for="lsp-lead-contact">Puhelin tai sähköposti *</label>
                <input id="lsp-lead-contact" name="Puhelin tai sähköposti" type="text" autocomplete="tel" required>
            </div>
            <div class="lsp-chatbot-field">
                <label for="lsp-lead-service">Palvelu *</label>
                <select id="lsp-lead-service" name="Palvelu" required>
                    <option value="">Valitse palvelu</option>
                    ${serviceOptions}
                </select>
            </div>
            <div class="lsp-chatbot-field">
                <label for="lsp-lead-location">Paikkakunta</label>
                <input id="lsp-lead-location" name="Paikkakunta" type="text" autocomplete="address-level2">
            </div>
            <div class="lsp-chatbot-field">
                <label for="lsp-lead-message">Kerro lyhyesti kohteesta</label>
                <textarea id="lsp-lead-message" name="Viesti" placeholder="Esim. tilan koko, toivottu ajankohta ja siivoustarve"></textarea>
            </div>
            <label class="lsp-chatbot-consent">
                <input name="Yhteydenottolupa" type="checkbox" value="Kyllä" required>
                <span>Sallin yhteydenoton tarjouspyyntööni liittyen. *</span>
            </label>
            <div class="lsp-chatbot-honeypot" aria-hidden="true">
                <label for="lsp-lead-website">Jätä tämä kenttä tyhjäksi</label>
                <input id="lsp-lead-website" name="_gotcha" type="text" tabindex="-1" autocomplete="off">
            </div>
            <input name="_subject" type="hidden" value="Uusi yhteydenottopyyntö sivuston siivousneuvojalta">
            <input name="_next" type="hidden" value="${THANK_YOU_URL}">
            <button class="lsp-chatbot-lead-submit" type="submit">Lähetä yhteydenottopyyntö</button>
        `;

        messages.appendChild(leadForm);
        scrollToLatest();
        window.setTimeout(() => {
            const firstField = leadForm.querySelector("#lsp-lead-name");
            if (firstField) firstField.focus();
        }, 100);
    };

    const submitQuestion = (value) => {
        const cleanValue = value.trim();
        if (!cleanValue) return;

        addMessage(cleanValue, "user");
        questionInput.value = "";
        questionInput.disabled = true;

        window.setTimeout(() => {
            const response = responseFor(cleanValue);
            addMessage(response.text, "bot", response.actions || []);
            questionInput.disabled = false;
            questionInput.focus();
        }, 280);
    };

    const openChat = () => {
        panel.hidden = false;
        launcher.setAttribute("aria-expanded", "true");
        if (backToTopButton) backToTopButton.style.visibility = "hidden";
        questionInput.focus();
    };

    const closeChat = () => {
        panel.hidden = true;
        launcher.setAttribute("aria-expanded", "false");
        if (backToTopButton) backToTopButton.style.visibility = "";
        launcher.focus();
    };

    launcher.addEventListener("click", () => {
        if (panel.hidden) {
            openChat();
        } else {
            closeChat();
        }
    });
    closeButton.addEventListener("click", closeChat);
    composer.addEventListener("submit", (event) => {
        event.preventDefault();
        submitQuestion(questionInput.value);
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && !panel.hidden) {
            closeChat();
        }
    });

    const welcomeText = lastTopic === "Yrityssiivous"
        ? "Hei! Autan yrityssiivoukseen liittyvissä kysymyksissä ja tarjouspyynnön tekemisessä. Mitä haluaisit tietää?"
        : "Hei! Autan löytämään sopivan siivouspalvelun ja tekemään tarjouspyynnön. Miten voin auttaa?";

    addMessage(welcomeText, "bot", [
        {label:"Yrityssiivous",value:"Yrityssiivous"},
        {label:"Kotisiivous",value:"Kotisiivous"},
        {label:"Muuttosiivous",value:"Muuttosiivous"},
        {label:"Ikkunanpesu",value:"Ikkunanpesu"},
        {label:"Pyydä tarjous",value:"__lead__"}
    ]);
})();

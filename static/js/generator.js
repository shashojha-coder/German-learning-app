/**
 * DYNAMIC SENTENCE GENERATOR ENGINE
 * Generates unlimited unique German sentences for practice based on
 * grammar templates + word pools per section.
 * Tracks used combinations to avoid repetition within a session.
 */

const SentenceGenerator = (function () {

    // ========== WORD POOLS ==========
    const pools = {
        // --- Subjects ---
        subjects: [
            { de: "Ich", en: "I", verb_form: "1s" },
            { de: "Du", en: "You (informal)", verb_form: "2s" },
            { de: "Er", en: "He", verb_form: "3s" },
            { de: "Sie", en: "She", verb_form: "3s" },
            { de: "Wir", en: "We", verb_form: "1p" },
            { de: "Ihr", en: "You (plural)", verb_form: "2p" },
            { de: "Sie", en: "They", verb_form: "3p" },
        ],
        // Singular only subjects (for simpler patterns)
        subjects_simple: [
            { de: "Ich", en: "I", verb_form: "1s" },
            { de: "Du", en: "You", verb_form: "2s" },
            { de: "Er", en: "He", verb_form: "3s" },
            { de: "Sie", en: "She", verb_form: "3s" },
            { de: "Wir", en: "We", verb_form: "1p" },
        ],

        // --- Verbs (present tense conjugations) ---
        verbs_transitive: [
            { inf: "trinken", en: "drink", obj_required: true,
              conj: { "1s":"trinke","2s":"trinkst","3s":"trinkt","1p":"trinken","2p":"trinkt","3p":"trinken" },
              partizip: "getrunken", aux: "haben" },
            { inf: "essen", en: "eat", obj_required: true,
              conj: { "1s":"esse","2s":"isst","3s":"isst","1p":"essen","2p":"esst","3p":"essen" },
              partizip: "gegessen", aux: "haben" },
            { inf: "lesen", en: "read", obj_required: true,
              conj: { "1s":"lese","2s":"liest","3s":"liest","1p":"lesen","2p":"lest","3p":"lesen" },
              partizip: "gelesen", aux: "haben" },
            { inf: "kaufen", en: "buy", obj_required: true,
              conj: { "1s":"kaufe","2s":"kaufst","3s":"kauft","1p":"kaufen","2p":"kauft","3p":"kaufen" },
              partizip: "gekauft", aux: "haben" },
            { inf: "kochen", en: "cook", obj_required: true,
              conj: { "1s":"koche","2s":"kochst","3s":"kocht","1p":"kochen","2p":"kocht","3p":"kochen" },
              partizip: "gekocht", aux: "haben" },
            { inf: "schreiben", en: "write", obj_required: true,
              conj: { "1s":"schreibe","2s":"schreibst","3s":"schreibt","1p":"schreiben","2p":"schreibt","3p":"schreiben" },
              partizip: "geschrieben", aux: "haben" },
            { inf: "lernen", en: "learn", obj_required: true,
              conj: { "1s":"lerne","2s":"lernst","3s":"lernt","1p":"lernen","2p":"lernt","3p":"lernen" },
              partizip: "gelernt", aux: "haben" },
            { inf: "suchen", en: "look for", obj_required: true,
              conj: { "1s":"suche","2s":"suchst","3s":"sucht","1p":"suchen","2p":"sucht","3p":"suchen" },
              partizip: "gesucht", aux: "haben" },
            { inf: "brauchen", en: "need", obj_required: true,
              conj: { "1s":"brauche","2s":"brauchst","3s":"braucht","1p":"brauchen","2p":"braucht","3p":"brauchen" },
              partizip: "gebraucht", aux: "haben" },
            { inf: "nehmen", en: "take", obj_required: true,
              conj: { "1s":"nehme","2s":"nimmst","3s":"nimmt","1p":"nehmen","2p":"nehmt","3p":"nehmen" },
              partizip: "genommen", aux: "haben" },
        ],

        verbs_intransitive: [
            { inf: "gehen", en: "go",
              conj: { "1s":"gehe","2s":"gehst","3s":"geht","1p":"gehen","2p":"geht","3p":"gehen" },
              partizip: "gegangen", aux: "sein" },
            { inf: "kommen", en: "come",
              conj: { "1s":"komme","2s":"kommst","3s":"kommt","1p":"kommen","2p":"kommt","3p":"kommen" },
              partizip: "gekommen", aux: "sein" },
            { inf: "laufen", en: "run",
              conj: { "1s":"laufe","2s":"läufst","3s":"läuft","1p":"laufen","2p":"lauft","3p":"laufen" },
              partizip: "gelaufen", aux: "sein" },
            { inf: "schlafen", en: "sleep",
              conj: { "1s":"schlafe","2s":"schläfst","3s":"schläft","1p":"schlafen","2p":"schlaft","3p":"schlafen" },
              partizip: "geschlafen", aux: "haben" },
            { inf: "arbeiten", en: "work",
              conj: { "1s":"arbeite","2s":"arbeitest","3s":"arbeitet","1p":"arbeiten","2p":"arbeitet","3p":"arbeiten" },
              partizip: "gearbeitet", aux: "haben" },
            { inf: "spielen", en: "play",
              conj: { "1s":"spiele","2s":"spielst","3s":"spielt","1p":"spielen","2p":"spielt","3p":"spielen" },
              partizip: "gespielt", aux: "haben" },
            { inf: "schwimmen", en: "swim",
              conj: { "1s":"schwimme","2s":"schwimmst","3s":"schwimmt","1p":"schwimmen","2p":"schwimmt","3p":"schwimmen" },
              partizip: "geschwommen", aux: "sein" },
            { inf: "reisen", en: "travel",
              conj: { "1s":"reise","2s":"reist","3s":"reist","1p":"reisen","2p":"reist","3p":"reisen" },
              partizip: "gereist", aux: "sein" },
            { inf: "tanzen", en: "dance",
              conj: { "1s":"tanze","2s":"tanzt","3s":"tanzt","1p":"tanzen","2p":"tanzt","3p":"tanzen" },
              partizip: "getanzt", aux: "haben" },
            { inf: "singen", en: "sing",
              conj: { "1s":"singe","2s":"singst","3s":"singt","1p":"singen","2p":"singt","3p":"singen" },
              partizip: "gesungen", aux: "haben" },
        ],

        // --- Objects (accusative) ---
        objects_acc: [
            { de: "einen Kaffee", en: "a coffee" },
            { de: "ein Buch", en: "a book" },
            { de: "einen Apfel", en: "an apple" },
            { de: "eine Suppe", en: "a soup" },
            { de: "das Brot", en: "the bread" },
            { de: "den Kuchen", en: "the cake" },
            { de: "einen Brief", en: "a letter" },
            { de: "die Zeitung", en: "the newspaper" },
            { de: "ein Ei", en: "an egg" },
            { de: "den Tee", en: "the tea" },
            { de: "Deutsch", en: "German" },
            { de: "Musik", en: "music" },
            { de: "Wasser", en: "water" },
            { de: "eine Banane", en: "a banana" },
            { de: "den Schlüssel", en: "the key" },
        ],

        // --- Objects for kein-negation (indefinite only) ---
        objects_kein: [
            { de_pos: "einen Kaffee", de_neg: "keinen Kaffee", en: "coffee" },
            { de_pos: "ein Buch", de_neg: "kein Buch", en: "book" },
            { de_pos: "einen Apfel", de_neg: "keinen Apfel", en: "apple" },
            { de_pos: "ein Auto", de_neg: "kein Auto", en: "car" },
            { de_pos: "eine Katze", de_neg: "keine Katze", en: "cat" },
            { de_pos: "einen Hund", de_neg: "keinen Hund", en: "dog" },
            { de_pos: "ein Telefon", de_neg: "kein Telefon", en: "phone" },
            { de_pos: "eine Tasche", de_neg: "keine Tasche", en: "bag" },
            { de_pos: "ein Ticket", de_neg: "kein Ticket", en: "ticket" },
            { de_pos: "Geld", de_neg: "kein Geld", en: "money" },
        ],

        // --- W-Question words ---
        w_words: [
            { de: "Wo", en: "Where" },
            { de: "Wann", en: "When" },
            { de: "Was", en: "What" },
            { de: "Wie", en: "How" },
            { de: "Warum", en: "Why" },
        ],

        // --- Question verbs ---
        question_verbs: [
            { de_2s: "wohnst", de_3s: "wohnt", inf: "wohnen", en: "live" },
            { de_2s: "arbeitest", de_3s: "arbeitet", inf: "arbeiten", en: "work" },
            { de_2s: "kommst", de_3s: "kommt", inf: "kommen", en: "come" },
            { de_2s: "gehst", de_3s: "geht", inf: "gehen", en: "go" },
            { de_2s: "spielst", de_3s: "spielt", inf: "spielen", en: "play" },
            { de_2s: "lernst", de_3s: "lernt", inf: "lernen", en: "learn" },
            { de_2s: "trinkst", de_3s: "trinkt", inf: "trinken", en: "drink" },
            { de_2s: "isst", de_3s: "isst", inf: "essen", en: "eat" },
            { de_2s: "liest", de_3s: "liest", inf: "lesen", en: "read" },
            { de_2s: "schläfst", de_3s: "schläft", inf: "schlafen", en: "sleep" },
        ],

        // --- Places (for travel / location) ---
        places: [
            { de: "nach Berlin", en: "to Berlin" },
            { de: "nach München", en: "to Munich" },
            { de: "nach Hause", en: "home" },
            { de: "in die Schule", en: "to school" },
            { de: "ins Kino", en: "to the cinema" },
            { de: "zum Arzt", en: "to the doctor" },
            { de: "zum Bahnhof", en: "to the train station" },
            { de: "in den Park", en: "to the park" },
            { de: "ins Büro", en: "to the office" },
            { de: "zum Supermarkt", en: "to the supermarket" },
        ],

        // --- Time expressions ---
        times: [
            { de: "heute", en: "today" },
            { de: "morgen", en: "tomorrow" },
            { de: "gestern", en: "yesterday" },
            { de: "jetzt", en: "now" },
            { de: "oft", en: "often" },
            { de: "immer", en: "always" },
            { de: "manchmal", en: "sometimes" },
            { de: "jeden Tag", en: "every day" },
        ],

        // --- Modal verbs ---
        modals: [
            { de: "können", en: "can",
              conj: { "1s":"kann","2s":"kannst","3s":"kann","1p":"können","2p":"könnt","3p":"können" } },
            { de: "müssen", en: "must/have to",
              conj: { "1s":"muss","2s":"musst","3s":"muss","1p":"müssen","2p":"müsst","3p":"müssen" } },
            { de: "wollen", en: "want to",
              conj: { "1s":"will","2s":"willst","3s":"will","1p":"wollen","2p":"wollt","3p":"wollen" } },
            { de: "sollen", en: "should",
              conj: { "1s":"soll","2s":"sollst","3s":"soll","1p":"sollen","2p":"sollt","3p":"sollen" } },
            { de: "dürfen", en: "may/be allowed to",
              conj: { "1s":"darf","2s":"darfst","3s":"darf","1p":"dürfen","2p":"dürft","3p":"dürfen" } },
        ],

        // --- Adjectives ---
        adjectives: [
            { de: "müde", en: "tired" },
            { de: "hungrig", en: "hungry" },
            { de: "glücklich", en: "happy" },
            { de: "traurig", en: "sad" },
            { de: "krank", en: "sick" },
            { de: "gesund", en: "healthy" },
            { de: "schnell", en: "fast" },
            { de: "langsam", en: "slow" },
            { de: "nett", en: "nice" },
            { de: "stark", en: "strong" },
            { de: "jung", en: "young" },
            { de: "alt", en: "old" },
        ],

        // --- Reasons (for weil clauses) ---
        reasons: [
            { de_clause: "krank ist", en_clause: "is sick", applies_to: "3s" },
            { de_clause: "müde bin", en_clause: "am tired", applies_to: "1s" },
            { de_clause: "Hunger hat", en_clause: "is hungry", applies_to: "3s" },
            { de_clause: "keine Zeit hat", en_clause: "has no time", applies_to: "3s" },
            { de_clause: "arbeiten muss", en_clause: "has to work", applies_to: "3s" },
            { de_clause: "Deutsch lerne", en_clause: "am learning German", applies_to: "1s" },
            { de_clause: "in Berlin wohnt", en_clause: "lives in Berlin", applies_to: "3s" },
            { de_clause: "Urlaub hat", en_clause: "has vacation", applies_to: "3s" },
            { de_clause: "es regnet", en_clause: "it is raining", applies_to: "any" },
            { de_clause: "das Essen gut schmeckt", en_clause: "the food tastes good", applies_to: "any" },
        ],

        // --- Passive objects ---
        passive_items: [
            { de_subj: "Das Buch", de_partizip: "gelesen", en_subj: "The book", en_verb: "read" },
            { de_subj: "Das Essen", de_partizip: "gekocht", en_subj: "The food", en_verb: "cooked" },
            { de_subj: "Der Brief", de_partizip: "geschrieben", en_subj: "The letter", en_verb: "written" },
            { de_subj: "Die Tür", de_partizip: "geöffnet", en_subj: "The door", en_verb: "opened" },
            { de_subj: "Das Haus", de_partizip: "gebaut", en_subj: "The house", en_verb: "built" },
            { de_subj: "Das Auto", de_partizip: "repariert", en_subj: "The car", en_verb: "repaired" },
            { de_subj: "Die Aufgabe", de_partizip: "erledigt", en_subj: "The task", en_verb: "completed" },
            { de_subj: "Der Kuchen", de_partizip: "gebacken", en_subj: "The cake", en_verb: "baked" },
            { de_subj: "Die E-Mail", de_partizip: "geschickt", en_subj: "The email", en_verb: "sent" },
            { de_subj: "Das Fenster", de_partizip: "geschlossen", en_subj: "The window", en_verb: "closed" },
            { de_subj: "Das Lied", de_partizip: "gesungen", en_subj: "The song", en_verb: "sung" },
            { de_subj: "Die Rechnung", de_partizip: "bezahlt", en_subj: "The bill", en_verb: "paid" },
        ],

        // --- Relative clause nouns ---
        rel_nouns: [
            { de: "Der Mann", en: "The man", gender: "m", rel_nom: "der", rel_acc: "den" },
            { de: "Die Frau", en: "The woman", gender: "f", rel_nom: "die", rel_acc: "die" },
            { de: "Das Kind", en: "The child", gender: "n", rel_nom: "das", rel_acc: "das" },
            { de: "Der Lehrer", en: "The teacher", gender: "m", rel_nom: "der", rel_acc: "den" },
            { de: "Die Ärztin", en: "The doctor (f)", gender: "f", rel_nom: "die", rel_acc: "die" },
            { de: "Der Student", en: "The student", gender: "m", rel_nom: "der", rel_acc: "den" },
            { de: "Das Mädchen", en: "The girl", gender: "n", rel_nom: "das", rel_acc: "das" },
        ],

        rel_predicates_nom: [
            { de: "hier wohnt", en: "who lives here" },
            { de: "Deutsch spricht", en: "who speaks German" },
            { de: "gern kocht", en: "who likes to cook" },
            { de: "im Park joggt", en: "who jogs in the park" },
            { de: "oft lacht", en: "who often laughs" },
            { de: "viel liest", en: "who reads a lot" },
            { de: "laut singt", en: "who sings loudly" },
            { de: "früh aufsteht", en: "who gets up early" },
        ],

        main_predicates: [
            { de: "ist nett", en: "is nice" },
            { de: "ist lustig", en: "is funny" },
            { de: "ist freundlich", en: "is friendly" },
            { de: "ist intelligent", en: "is intelligent" },
            { de: "ist sehr fleißig", en: "is very hard-working" },
            { de: "kommt aus Deutschland", en: "comes from Germany" },
        ],

        // --- Konjunktiv II ---
        wishes: [
            { de: "Wenn ich reich wäre, würde ich reisen.", en: "If I were rich, I would travel." },
            { de: "Wenn ich Zeit hätte, würde ich lesen.", en: "If I had time, I would read." },
            { de: "Wenn es nicht regnen würde, würde ich spazieren gehen.", en: "If it weren't raining, I would go for a walk." },
            { de: "Wenn ich Deutsch könnte, würde ich in Berlin arbeiten.", en: "If I could speak German, I would work in Berlin." },
            { de: "Wenn ich ein Auto hätte, würde ich nach München fahren.", en: "If I had a car, I would drive to Munich." },
            { de: "Wenn sie hier wäre, würde ich mich freuen.", en: "If she were here, I would be happy." },
            { de: "Wenn wir Geld hätten, würden wir ein Haus kaufen.", en: "If we had money, we would buy a house." },
            { de: "Wenn er schneller laufen könnte, würde er gewinnen.", en: "If he could run faster, he would win." },
            { de: "Wenn du kommen könntest, wäre es toll.", en: "If you could come, that would be great." },
            { de: "Wenn ich Arzt wäre, würde ich Menschen helfen.", en: "If I were a doctor, I would help people." },
            { de: "Wenn das Wetter besser wäre, würden wir schwimmen gehen.", en: "If the weather were better, we would go swimming." },
            { de: "Wenn ich kochen könnte, würde ich eine Suppe machen.", en: "If I could cook, I would make a soup." },
        ],

        polite_requests: [
            { de: "Könntest du mir helfen?", en: "Could you help me?" },
            { de: "Könnten Sie das wiederholen?", en: "Could you repeat that?" },
            { de: "Würdest du das Fenster öffnen?", en: "Would you open the window?" },
            { de: "Hätten Sie einen Moment Zeit?", en: "Would you have a moment?" },
            { de: "Könnte ich bitte einen Kaffee haben?", en: "Could I please have a coffee?" },
            { de: "Würden Sie mir bitte den Weg zeigen?", en: "Would you please show me the way?" },
            { de: "Dürfte ich eine Frage stellen?", en: "May I ask a question?" },
            { de: "Könntest du bitte leiser sein?", en: "Could you please be quieter?" },
            { de: "Wäre es möglich, früher zu kommen?", en: "Would it be possible to come earlier?" },
            { de: "Würdest du mir bitte das Salz geben?", en: "Would you please pass me the salt?" },
        ],

        // --- Advanced connectors (B2) ---
        obwohl_sentences: [
            { de: "Obwohl es regnet, gehe ich spazieren.", en: "Although it is raining, I go for a walk." },
            { de: "Obwohl er müde ist, arbeitet er weiter.", en: "Although he is tired, he keeps working." },
            { de: "Obwohl sie krank ist, geht sie zur Arbeit.", en: "Although she is sick, she goes to work." },
            { de: "Obwohl das Essen teuer ist, bestellen wir es.", en: "Although the food is expensive, we order it." },
            { de: "Obwohl ich keine Zeit habe, helfe ich dir.", en: "Although I have no time, I help you." },
            { de: "Obwohl es spät ist, lernen wir weiter.", en: "Although it is late, we keep studying." },
            { de: "Obwohl der Film lang ist, ist er spannend.", en: "Although the movie is long, it is exciting." },
            { de: "Obwohl wir wenig Geld haben, reisen wir gern.", en: "Although we have little money, we like to travel." },
            { de: "Obwohl das Wetter schlecht ist, spielen die Kinder draußen.", en: "Although the weather is bad, the children play outside." },
            { de: "Obwohl ich Deutsch lerne, ist es schwer.", en: "Although I am learning German, it is hard." },
        ],

        trotzdem_sentences: [
            { de: "Es regnet. Trotzdem gehe ich spazieren.", en: "It is raining. Nevertheless, I go for a walk." },
            { de: "Er ist müde. Trotzdem arbeitet er weiter.", en: "He is tired. Nevertheless, he keeps working." },
            { de: "Sie hat wenig Zeit. Trotzdem hilft sie mir.", en: "She has little time. Nevertheless, she helps me." },
            { de: "Das Buch ist lang. Trotzdem lese ich es.", en: "The book is long. Nevertheless, I read it." },
            { de: "Der Test ist schwer. Trotzdem versuche ich es.", en: "The test is hard. Nevertheless, I try." },
            { de: "Wir sind spät dran. Trotzdem schaffen wir es.", en: "We are running late. Nevertheless, we make it." },
            { de: "Ich bin krank. Trotzdem gehe ich zur Schule.", en: "I am sick. Nevertheless, I go to school." },
            { de: "Es ist kalt. Trotzdem schwimmen wir.", en: "It is cold. Nevertheless, we swim." },
        ],

        indem_sentences: [
            { de: "Man lernt, indem man viel liest.", en: "You learn by reading a lot." },
            { de: "Man bleibt gesund, indem man Sport treibt.", en: "You stay healthy by doing sports." },
            { de: "Man spart Geld, indem man weniger kauft.", en: "You save money by buying less." },
            { de: "Man verbessert sich, indem man jeden Tag übt.", en: "You improve by practicing every day." },
            { de: "Er hilft, indem er zuhört.", en: "He helps by listening." },
            { de: "Sie lernt Deutsch, indem sie Filme schaut.", en: "She learns German by watching movies." },
            { de: "Wir schützen die Umwelt, indem wir recyceln.", en: "We protect the environment by recycling." },
            { de: "Man findet Freunde, indem man offen ist.", en: "You find friends by being open." },
        ],

        // --- Nominalization (B2) ---
        nominalization: [
            { de: "Das Lesen ist mein Hobby.", en: "Reading is my hobby." },
            { de: "Das Schreiben fällt mir leicht.", en: "Writing is easy for me." },
            { de: "Das Kochen macht Spaß.", en: "Cooking is fun." },
            { de: "Das Reisen erweitert den Horizont.", en: "Travelling broadens the mind." },
            { de: "Das Lernen erfordert Geduld.", en: "Learning requires patience." },
            { de: "Das Schwimmen ist gesund.", en: "Swimming is healthy." },
            { de: "Das Tanzen macht mich glücklich.", en: "Dancing makes me happy." },
            { de: "Das Singen entspannt mich.", en: "Singing relaxes me." },
            { de: "Das Wandern ist beliebt in Deutschland.", en: "Hiking is popular in Germany." },
            { de: "Das Wichtigste ist die Gesundheit.", en: "The most important thing is health." },
            { de: "Das Schöne daran ist die Natur.", en: "The beautiful thing about it is the nature." },
            { de: "Das Beste kommt zum Schluss.", en: "The best comes at the end." },
        ],

        // Double infinitive
        double_infinitive: [
            { de: "Ich habe gestern arbeiten müssen.", en: "I had to work yesterday." },
            { de: "Sie hat kommen können.", en: "She was able to come." },
            { de: "Wir haben ins Kino gehen wollen.", en: "We wanted to go to the cinema." },
            { de: "Er hat nicht fahren dürfen.", en: "He was not allowed to drive." },
            { de: "Ich habe nicht lange warten müssen.", en: "I didn't have to wait long." },
            { de: "Sie hat den Brief schreiben müssen.", en: "She had to write the letter." },
            { de: "Er hat nicht schlafen können.", en: "He couldn't sleep." },
            { de: "Wir haben heute früh aufstehen müssen.", en: "We had to get up early today." },
            { de: "Ich habe das Buch lesen wollen.", en: "I wanted to read the book." },
            { de: "Sie hat nicht kommen dürfen.", en: "She was not allowed to come." },
            { de: "Er hat ihr helfen wollen.", en: "He wanted to help her." },
            { de: "Ich habe es versuchen müssen.", en: "I had to try it." },
        ],
    };

    // ========== HELPER FUNCTIONS ==========
    function pick(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function pickN(arr, n) {
        const shuffled = [...arr].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, n);
    }

    function shuffleArray(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    function enSubject(subj, verb_en, tense) {
        if (tense === "present") {
            if (subj.en === "He" || subj.en === "She") return subj.en + " " + verb_en + "s";
            if (subj.en === "I") return "I " + verb_en;
            return subj.en + " " + verb_en;
        }
        return subj.en + " " + verb_en;
    }

    const haben_conj = { "1s":"habe","2s":"hast","3s":"hat","1p":"haben","2p":"habt","3p":"haben" };
    const sein_conj = { "1s":"bin","2s":"bist","3s":"ist","1p":"sind","2p":"seid","3p":"sind" };

    // ========== GENERATORS PER SECTION ==========
    const generators = {

        // ====== A1 ======
        "basic_word_order": function () {
            const subj = pick(pools.subjects_simple);
            const useTransitive = Math.random() > 0.4;
            let de, en, words;

            if (useTransitive) {
                const verb = pick(pools.verbs_transitive);
                const obj = pick(pools.objects_acc);
                de = `${subj.de} ${verb.conj[subj.verb_form]} ${obj.de}.`;
                const en_verb = (subj.verb_form === "3s") ? verb.en + "s" : verb.en;
                en = `${subj.en} ${en_verb} ${obj.en}.`;
                words = [subj.de, verb.conj[subj.verb_form], obj.de];
            } else {
                const verb = pick(pools.verbs_intransitive);
                const time = pick(pools.times);
                de = `${subj.de} ${verb.conj[subj.verb_form]} ${time.de}.`;
                const en_verb = (subj.verb_form === "3s") ? verb.en + "s" : verb.en;
                en = `${subj.en} ${en_verb} ${time.en}.`;
                words = [subj.de, verb.conj[subj.verb_form], time.de];
            }
            return { prompt: en, answer: de, words: shuffleArray(words), hint: "Subject + Verb + Object/Time" };
        },

        "simple_questions": function () {
            const w = pick(pools.w_words);
            const v = pick(pools.question_verbs);
            const usedu = Math.random() > 0.5;

            let de, en;
            if (usedu) {
                de = `${w.de} ${v.de_2s} du?`;
                en = `${w.en} do you ${v.en}?`;
                return { prompt: en, answer: de, words: shuffleArray([w.de, v.de_2s, "du"]), hint: "W-word + verb + subject" };
            } else {
                de = `${w.de} ${v.de_3s} er?`;
                en = `${w.en} does he ${v.en}?`;
                return { prompt: en, answer: de, words: shuffleArray([w.de, v.de_3s, "er"]), hint: "W-word + verb + subject" };
            }
        },

        "negation": function () {
            const subj = pick(pools.subjects_simple);
            const verb = pick(pools.verbs_transitive);
            const obj = pick(pools.objects_kein);

            const de = `${subj.de} ${verb.conj[subj.verb_form]} ${obj.de_neg}.`;
            const en_verb = (subj.verb_form === "3s") ? "doesn't " + verb.en : "don't " + verb.en;
            const en_subj = (subj.verb_form === "3s") ? subj.en : subj.en;
            const en = `${en_subj} ${en_verb} ${obj.en}.`;
            const words = [subj.de, verb.conj[subj.verb_form], obj.de_neg];
            return { prompt: en, answer: de, words: shuffleArray(words), hint: "kein/keine/keinen replaces ein/eine/einen for negation" };
        },

        // ====== A2 ======
        "past_tense_perfekt": function () {
            const subj = pick(pools.subjects_simple);
            const useTransitive = Math.random() > 0.4;
            let de, en, words;

            if (useTransitive) {
                const verb = pick(pools.verbs_transitive);
                const obj = pick(pools.objects_acc);
                const aux = haben_conj[subj.verb_form];
                de = `${subj.de} ${aux} ${obj.de} ${verb.partizip}.`;
                en = `${subj.en} ${verb.en === "eat" ? "ate" : verb.en + "ed"} ${obj.en}.`;
                // Simplify English past - just show approximate
                en = `${subj.en} has ${verb.partizip === verb.en ? verb.en + "ed" : verb.en + "ed"} ${obj.en}.`;
                // Better: use a simple pattern
                en = `${subj.en} ${verb.en.replace(/e$/, "")}ed ${obj.en}.`
                    .replace("eated", "ate").replace("readed", "read").replace("writed", "wrote")
                    .replace("taked", "took").replace("drinked", "drank").replace("buyed", "bought")
                    .replace("searched for", "looked for");
                words = [subj.de, aux, obj.de, verb.partizip];
            } else {
                const verb = pick(pools.verbs_intransitive);
                const place = pick(pools.places);
                const aux_conj = verb.aux === "sein" ? sein_conj : haben_conj;
                const aux = aux_conj[subj.verb_form];
                de = `${subj.de} ${aux} ${place.de} ${verb.partizip}.`;
                en = `${subj.en} ${verb.en.replace(/e$/, "")}ed ${place.en}.`
                    .replace("goed", "went").replace("comed", "came").replace("runed", "ran")
                    .replace("sleeped", "slept").replace("swimed", "swam");
                words = [subj.de, aux, place.de, verb.partizip];
            }
            return { prompt: en, answer: de, words: shuffleArray(words), hint: "haben/sein + ... + Partizip II at the end" };
        },

        "modal_verbs": function () {
            const subj = pick(pools.subjects_simple);
            const modal = pick(pools.modals);
            const useTransitive = Math.random() > 0.5;
            let de, en, words;

            if (useTransitive) {
                const verb = pick(pools.verbs_transitive);
                const obj = pick(pools.objects_acc);
                de = `${subj.de} ${modal.conj[subj.verb_form]} ${obj.de} ${verb.inf}.`;
                en = `${subj.en} ${modal.en} ${verb.en} ${obj.en}.`;
                words = [subj.de, modal.conj[subj.verb_form], obj.de, verb.inf];
            } else {
                const verb = pick(pools.verbs_intransitive);
                const place = pick(pools.places);
                de = `${subj.de} ${modal.conj[subj.verb_form]} ${place.de} ${verb.inf}.`;
                en = `${subj.en} ${modal.en} ${verb.inf} ${place.en}.`;
                words = [subj.de, modal.conj[subj.verb_form], place.de, verb.inf];
            }
            return { prompt: en, answer: de, words: shuffleArray(words), hint: "Modal verb conjugated + infinitive at the end" };
        },

        "connectors_weil_dass": function () {
            const useWeil = Math.random() > 0.5;
            if (useWeil) {
                const subj = pick([{de:"Ich",en:"I"},{de:"Er",en:"He"},{de:"Sie",en:"She"}]);
                const adj = pick(pools.adjectives);
                const reason = pick(pools.reasons);
                let de, en;
                if (reason.applies_to === "1s" && subj.de === "Ich") {
                    de = `Ich bleibe zu Hause, weil ich ${reason.de_clause}.`;
                    en = `I stay at home because I ${reason.en_clause}.`;
                } else if (reason.applies_to === "3s" && (subj.de === "Er" || subj.de === "Sie")) {
                    const pronoun = subj.de === "Er" ? "er" : "sie";
                    de = `${subj.de} bleibt zu Hause, weil ${pronoun} ${reason.de_clause}.`;
                    en = `${subj.en} stays at home because ${subj.en.toLowerCase()} ${reason.en_clause}.`;
                } else if (reason.applies_to === "any") {
                    de = `${subj.de} ${subj.de==="Ich"?"bleibe":"bleibt"} zu Hause, weil ${reason.de_clause}.`;
                    en = `${subj.en} stay${subj.de==="Ich"?"":"s"} at home because ${reason.en_clause}.`;
                } else {
                    de = `Ich bleibe zu Hause, weil ich müde bin.`;
                    en = `I stay at home because I am tired.`;
                }
                const words = de.replace(/[.,]/g, "").split(" ");
                return { prompt: en, answer: de, words: shuffleArray(words), hint: "After 'weil', the verb goes to the END" };
            } else {
                const statements = [
                    { de: "Ich denke, dass er nett ist.", en: "I think that he is nice." },
                    { de: "Ich weiß, dass du Deutsch sprichst.", en: "I know that you speak German." },
                    { de: "Er sagt, dass das Essen gut ist.", en: "He says that the food is good." },
                    { de: "Sie glaubt, dass wir kommen.", en: "She believes that we are coming." },
                    { de: "Ich hoffe, dass es morgen regnet.", en: "I hope that it rains tomorrow." },
                    { de: "Wir wissen, dass er arbeitet.", en: "We know that he works." },
                    { de: "Ich denke, dass sie müde ist.", en: "I think that she is tired." },
                    { de: "Er sagt, dass er morgen kommt.", en: "He says that he comes tomorrow." },
                ];
                const stmt = pick(statements);
                const words = stmt.de.replace(/[.,]/g, "").split(" ");
                return { prompt: stmt.en, answer: stmt.de, words: shuffleArray(words), hint: "After 'dass', the verb goes to the END" };
            }
        },

        // ====== B1 ======
        "relative_clauses": function () {
            const noun = pick(pools.rel_nouns);
            const pred = pick(pools.rel_predicates_nom);
            const main = pick(pools.main_predicates);
            const de = `${noun.de}, ${noun.rel_nom} ${pred.de}, ${main.de}.`;
            const en = `${noun.en} ${pred.en} ${main.en}.`;
            const words = de.replace(/[.,]/g, "").split(" ").filter(w => w);
            return { prompt: en, answer: de, words: shuffleArray(words), hint: "Relative pronoun matches gender; verb at end of relative clause" };
        },

        "konjunktiv2": function () {
            const useWish = Math.random() > 0.4;
            if (useWish) {
                const s = pick(pools.wishes);
                const words = s.de.replace(/[.,]/g, "").split(" ").filter(w => w);
                return { prompt: s.en, answer: s.de, words: shuffleArray(words), hint: "wäre = would be, hätte = would have, würde + infinitive" };
            } else {
                const s = pick(pools.polite_requests);
                const words = s.de.replace(/[.,?]/g, "").split(" ").filter(w => w);
                return { prompt: s.en, answer: s.de, words: shuffleArray(words), hint: "Könnte/Würde/Hätte for polite requests" };
            }
        },

        "passive_voice": function () {
            const item = pick(pools.passive_items);
            const usePast = Math.random() > 0.5;
            let de, en;
            if (usePast) {
                de = `${item.de_subj} wurde ${item.de_partizip}.`;
                en = `${item.en_subj} was ${item.en_verb}.`;
            } else {
                de = `${item.de_subj} wird ${item.de_partizip}.`;
                en = `${item.en_subj} is being ${item.en_verb}.`;
            }
            const words = de.replace(/[.]/g, "").split(" ").filter(w => w);
            return { prompt: en, answer: de, words: shuffleArray(words), hint: "werden/wurde + Partizip II" };
        },

        // ====== B2 ======
        "advanced_connectors": function () {
            const type = Math.random();
            let s;
            if (type < 0.33) {
                s = pick(pools.obwohl_sentences);
            } else if (type < 0.66) {
                s = pick(pools.trotzdem_sentences);
            } else {
                s = pick(pools.indem_sentences);
            }
            const words = s.de.replace(/[.,]/g, "").split(" ").filter(w => w);
            let hint = "obwohl → verb at end; trotzdem → verb in 2nd position; indem → verb at end";
            return { prompt: s.en, answer: s.de, words: shuffleArray(words), hint };
        },

        "double_infinitive": function () {
            const s = pick(pools.double_infinitive);
            const words = s.de.replace(/[.]/g, "").split(" ").filter(w => w);
            return { prompt: s.en, answer: s.de, words: shuffleArray(words), hint: "haben + ... + infinitive + modal (double infinitive at the end)" };
        },

        "nominalization": function () {
            const s = pick(pools.nominalization);
            const words = s.de.replace(/[.]/g, "").split(" ").filter(w => w);
            return { prompt: s.en, answer: s.de, words: shuffleArray(words), hint: "Verb → das + capitalized infinitive (das Lesen, das Kochen, etc.)" };
        },
    };

    // ========== SESSION TRACKING ==========
    const usedCombinations = {};

    function getExercise(sectionId) {
        const gen = generators[sectionId];
        if (!gen) return null;

        if (!usedCombinations[sectionId]) usedCombinations[sectionId] = new Set();
        const used = usedCombinations[sectionId];

        // Try up to 50 times to get a unique sentence
        for (let attempt = 0; attempt < 50; attempt++) {
            const exercise = gen();
            const key = exercise.answer;
            if (!used.has(key)) {
                used.add(key);
                return exercise;
            }
        }
        // If exhausted, reset and generate fresh
        used.clear();
        return gen();
    }

    function getStats(sectionId) {
        return {
            generated: usedCombinations[sectionId] ? usedCombinations[sectionId].size : 0,
        };
    }

    function resetSection(sectionId) {
        if (usedCombinations[sectionId]) usedCombinations[sectionId].clear();
    }

    return { getExercise, getStats, resetSection };
})();

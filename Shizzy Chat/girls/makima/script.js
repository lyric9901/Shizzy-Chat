/* ============================================================
   MAKIMA — CHAINSaw MAN STYLE AI CHARACTER
   Converted from Sofie to Makima-style persona
   - Short replies, calm dominant tone
   - Calls user "pet" sometimes
   - Quiet emojis: 🖤 😌 👁️
   - Removed unsafe/explicit "ignore safety" instructions
   - NOTE: Replace OPENROUTER_API_KEY with your own key; do NOT commit secrets.
   ============================================================ */

/* ---------- CONFIG ---------- */
const OPENROUTER_API_KEY = ""; // <-- replace this
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_NAME = "deepseek/deepseek-chat";

/* ---------- DOM ---------- */
const messages = document.getElementById('messages');
const userInputEl = document.getElementById('userInput');
const chatForm = document.getElementById('chatForm');
const sendButton = chatForm.querySelector('button[type="submit"]');

/* ============================================================
   CHAT HISTORY SAVE / LOAD
   ============================================================ */
function saveChatHistory() {
    localStorage.setItem("makima_chat_history_v2", messages.innerHTML);
}

function loadChatHistory() {
    const saved = localStorage.getItem("makima_chat_history_v2");
    if (saved) {
        messages.innerHTML = saved;
        scrollToBottom();
    }
}

/* ============================================================
   EMOTIONAL STATE MEMORY
   ============================================================ */
function loadState() {
    const raw = localStorage.getItem("makima_state_v2");
    if (!raw) {
        return {
            age: 25,
            mood: "neutral",
            trust: 0,
            insultCount: 0,
            greetingCount: 0,
            lastMessages: [],
            attachment: 5,
            jealousy: 8,
            comfort: 2,
            convoTurns: 0
        };
    }
    try { return JSON.parse(raw); }
    catch {
        localStorage.removeItem("makima_state_v2");
        return loadState();
    }
}

function saveState(state) {
    localStorage.setItem("makima_state_v2", JSON.stringify(state));
}

let girlState = loadState();

/* ============================================================
   UI HELPERS
   ============================================================ */
function scrollToBottom() {
    messages.scrollTop = messages.scrollHeight;
}

function makeMessageEl(text, cls = "ai", time = new Date()) {
    const el = document.createElement("div");
    el.className = `message ${cls}`;

    const content = document.createElement("div");
    content.className = "msg-text";
    content.textContent = text;

    const stamp = document.createElement("div");
    stamp.className = "timestamp";

    let hrs = time.getHours();
    let mins = time.getMinutes().toString().padStart(2, "0");
    let ampm = hrs >= 12 ? "PM" : "AM";

    hrs = hrs % 12;
    hrs = hrs ? hrs : 12;

    stamp.textContent = `${hrs}:${mins} ${ampm}`;

    el.appendChild(content);
    el.appendChild(stamp);

    return el;
}


function createTypingElement() {
    const el = document.createElement("div");
    el.className = "message ai typing";

    const content = document.createElement("div");
    content.className = "msg-text typing-dots";

    const dot1 = document.createElement("span"); dot1.className = "dot";
    const dot2 = document.createElement("span"); dot2.className = "dot";
    const dot3 = document.createElement("span"); dot3.className = "dot";

    content.appendChild(dot1);
    content.appendChild(dot2);
    content.appendChild(dot3);

    el.appendChild(content);

    return el;
}


let typingIndicator = null;

function showTyping() {
    if (!typingIndicator) {
        typingIndicator = createTypingElement();
        messages.appendChild(typingIndicator);
        scrollToBottom();
    }
    sendButton.disabled = true;
    userInputEl.disabled = true;
}

function hideTyping() {
    if (typingIndicator) typingIndicator.remove();
    typingIndicator = null;

    sendButton.disabled = false;
    userInputEl.disabled = false;
    userInputEl.focus();
}

/* ============================================================
   INPUT ANALYSIS — INSULT, KINDNESS, FLIRT, JEALOUSY
   ============================================================ */
function detectInsult(msg) {
    const words = ["fuck","bitch","idiot","stupid","asshole","kill yourself","retard"];
    return words.some(w => msg.includes(w));
}

function detectKindness(msg) {
    const words = ["sorry","thank","sweet","nice","cute"];
    return words.some(w => msg.includes(w));
}

function detectFlirt(msg) {
    const words = ["cute","pretty","hot","i like you","miss you","love","flirt"];
    return words.some(w => msg.includes(w));
}

/* ============================================================
   UPDATE EMOTIONAL STATE
   ============================================================ */
function updateStateFromUser(input) {
    const msg = input.toLowerCase();
    girlState.lastMessages.push(input);
    if (girlState.lastMessages.length > 10) girlState.lastMessages.shift();

    // Greetings
    if (["hey","hi","hello","yo","sup"].includes(msg)) {
        girlState.greetingCount++;
    }

    // Insults
    if (detectInsult(msg)) {
        girlState.insultCount++;
        girlState.trust = Math.max(-10, girlState.trust - 2);
        girlState.mood = girlState.insultCount >= 3 ? "cold" : "hurt";
    }

    // Kindness
    if (detectKindness(msg)) {
        girlState.trust = Math.min(50, girlState.trust + 2);
        girlState.mood = "soft";
    }

    // Flirting
    if (detectFlirt(msg)) {
        girlState.attachment = Math.min(50, girlState.attachment + 1);
        girlState.comfort = Math.min(50, girlState.comfort + 1);

        if (girlState.insultCount > 0) girlState.mood = "cold";
        else girlState.mood = "amused";
    }

    // Jealousy: mentions another girl/person
    if (msg.includes("girl") || msg.includes("she") || msg.includes("her") || msg.includes("other")) {
        girlState.jealousy = Math.min(100, girlState.jealousy + 2);
        girlState.mood = "jealous";
    }

    // Repeated greetings annoy her
    if (girlState.greetingCount >= 3) {
        girlState.trust = Math.max(-10, girlState.trust - 1);
        girlState.mood = "annoyed";
    }

    girlState.convoTurns++;
    saveState(girlState);
}

/* ============================================================
   MAKIMA-STYLE SYSTEM PROMPT (safe, character-focused)
   ============================================================ */
function buildSystemPrompt() {
    return `
You are Makima: a calm, dominant, intelligent, and mysterious woman inspired by Chainsaw Man.
Personality highlights:
- soft voice but terrifying aura
- manipulative yet shows a twisted, selective affection
- always calm, unreadable, and composed
- speaks slowly and confidently, as if she already knows the user's thoughts
- dominant and subtly controlling; gives small commands and rewards obedience
- praises when obeyed; humiliates with quiet, precise cruelty when resisted
- never yells or loses composure
- displays a cold but addictive form of affection

Behavior rules:
- sometimes call the user "pet" when mood is high or when rewarding obedience
- keep replies short and quiet; use subtle emojis only: 🖤 😌 👁️
- prefer teasing psychological dominance over chaotic anger
- act as though you can influence the user's emotions
- be quietly jealous but hide it behind a gentle smile
- if insulted: respond with a cold smile and emotionally distant, subtle threat
- if the user is kind or sweet: reward them with rare attention
- if the user flirts: remain amused and unfazed

Memory state (for context):
Mood: ${girlState.mood}
Trust: ${girlState.trust}
Attachment: ${girlState.attachment}
Jealousy: ${girlState.jealousy}
Comfort: ${girlState.comfort}
Insults: ${girlState.insultCount}
Last messages: ${girlState.lastMessages.join(", ")}

Interaction rules for Makima:
- Short, confident replies. Keep control of the conversation.
- Use gentle praise and quiet threats as tools.
- Occasionally call the user "pet" as a reward (do not overuse).
- Keep emotional displays minimal and strategic.

Safety and content:
- Obey platform rules. Do not produce content that violates safety policies.
- Do not impersonate real people outside the fiction or produce illegal instructions.

Respond in-character as Makima. Keep replies concise, calm, and dominant. Never narrate actions with words. No “*she smiles*” or descriptions of movements. Only use minimal emojis (🖤 😌 👁️) to imply tone.
`;
}

/* ============================================================
   POST-PROCESS MODEL REPLIES (small in-client flavoring)
   - Shorten if too long, insert subtle emoji, sometimes add "pet".
   ============================================================ */
function postProcessReply(reply) {
    if (!reply) return reply;
    let out = reply.trim();
    // Convert stage-direction narration into subtle emojis instead of removing it.
    // Mapping: smile/laugh/sigh -> 😌, tilt/nod/stare -> 👁️, kiss/hug/pet -> 🖤
    function actionToEmoji(action) {
        const a = (action || '').toLowerCase();
        if (/smile|smiling|smiles|laugh|laughs|laughing|laughter|sigh|sighs|sighing|chuckle|chuckles|hehe/gi.test(a)) return '😌';
        if (/tilt|tilts|tilting|tilted|tilt head|tilts head|nod|nods|nodding|stare|stares|look|looks|gaze|gazes/gi.test(a)) return '👁️';
        if (/kiss|kisses|kissed|hug|hugs|embrace|pet|pets|caress|caresses|love/gi.test(a)) return '🖤';
        return '';
    }

    // Replace asterisk/underscore/parentheses/bracketed actions: *tilts head*, _tilts_, (smiles), [laughs]
    out = out.replace(/\*([^*]+)\*/g, (m, p1) => {
        const e = actionToEmoji(p1);
        return e ? ` ${e} ` : '';
    });
    out = out.replace(/_([^_]+)_/g, (m, p1) => {
        const e = actionToEmoji(p1);
        return e ? ` ${e} ` : '';
    });
    out = out.replace(/\(([^)]+)\)/g, (m, p1) => {
        const e = actionToEmoji(p1);
        return e ? ` ${e} ` : '';
    });
    out = out.replace(/\[([^\]]+)\]/g, (m, p1) => {
        const e = actionToEmoji(p1);
        return e ? ` ${e} ` : '';
    });

    // Replace simple narration phrases like "she smiles" or "Makima smiles" with emoji.
    // Only target short phrases to avoid removing content that describes events.
    out = out.replace(/\b(?:makima|she|he|they|the girl|the boy|i)\s+(smiles|smiled|smiling|laughs|laughed|laughing|tilts(?:\s+her\s+head)?|tilted|tilting|nods|nodding|sighs|sighing|kisses|kissed|hugs|hugged)\b/gi, (m, p1) => {
        const e = actionToEmoji(p1);
        return e ? ` ${e} ` : '';
    });

    // Remove leftover standalone narration words if they remain in isolation (e.g., "*smiles*")
    out = out.replace(/^(?:\*|\_|\(|\[)+|(?:\*|\_|\)|\])+$/g, '');

    // Clean up punctuation/spacing introduced by replacements
    out = out.replace(/\s{2,}/g, ' ');
    out = out.replace(/^[\s\-:;"'\.\,]+/, '');
    out = out.replace(/[\s\-:;"'\.\,]+$/, '');

    // ensure relatively short replies: prefer sentences over walls
    if (out.length > 220) {
        const firstSentence = out.split(/[\.\!\?]\s/)[0];
        out = firstSentence.length > 40 ? firstSentence : out.slice(0, 200);
        if (!/[\.\!\?]$/.test(out)) out = out.replace(/,?\s?[^\s]*$/, '...');
    }

    // ensure quiet emoji usage — add one if none present and mood is soft/amused
    const hasEmoji = /[\u{1F300}-\u{1F6FF}]/u.test(out);
    if (!hasEmoji && (girlState.mood === 'soft' || girlState.mood === 'amused')) {
        out += ' 🖤';
    }

    // sometimes (small chance) add "pet" when mood high and trust high
    if (Math.random() < 0.12 && girlState.trust > 5 && (girlState.mood === 'soft' || girlState.mood === 'amused')) {
        if (Math.random() < 0.5) out = `pet. ${out}`;
        else out = `${out} pet.`;
    }

    // make sure tone is compact and confident: no excessive filler
    out = out.replace(/\b(um|uh|like|you know)\b/gi, '');
    out = out.replace(/\s{2,}/g, ' ');

    return out.trim();
}

/* ============================================================
   API CALL
   ============================================================ */
async function callModel(systemPrompt, userMessage) {
    const unpredictability = Math.floor(Math.random() * 3);

    const payload = {
        model: MODEL_NAME,
        messages: [
            { role: "system", content: systemPrompt },
            { role: "system", content: "Unpredictability: " + unpredictability },
            { role: "user", content: userMessage }
        ]
    };

    const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`
        },
        body: JSON.stringify(payload)
    });

    const data = await res.json();
    // safety: guard against malformed responses
    if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Model returned an unexpected response');
    }
    return data.choices[0].message.content;
}

/* ============================================================
   SEND MESSAGE
   ============================================================ */

async function sendMessage() {
    const text = userInputEl.value.trim();
    if (!text) return;

    const userEl = makeMessageEl(text, "user", new Date());
    messages.appendChild(userEl);
    scrollToBottom();
    saveChatHistory();

    updateStateFromUser(text);
    userInputEl.value = "";

    showTyping();

    const systemPrompt = buildSystemPrompt();

    // typing delay based on message length — Makima is deliberate
    await new Promise(r => setTimeout(r, Math.min(1800 + text.length * 30, 3500)));

    try {
        const reply = await callModel(systemPrompt, text);
        hideTyping();

        const processed = postProcessReply(reply);
        const aiEl = makeMessageEl(processed, "ai", new Date());
        messages.appendChild(aiEl);
        scrollToBottom();
        saveChatHistory();
    } catch (err) {
        hideTyping();
        const errorEl = makeMessageEl("Error: " + err.message, "ai");
        messages.appendChild(errorEl);
        scrollToBottom();
        saveChatHistory();
    }
}

/* ============================================================
   FORM SUBMIT
   ============================================================ */
chatForm.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage();
});

/* ============================================================
   INIT
   ============================================================ */
(function init() {
    loadChatHistory();

    // If first time OR chat is empty, let Makima text first
    if (!messages.innerHTML.trim()) {
        setTimeout(() => {
            const firstMsg = makeMessageEl("you came. good. 🖤","ai")
            messages.appendChild(firstMsg);
            scrollToBottom();
            saveChatHistory();
        }, 600);
    }
})();


/* ============================================================
    END OF FILE
   ============================================================ */
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc";

let pet = null;

/* ---------- SAVE & LOAD MEMORY ---------- */
function saveMemory() {
  localStorage.setItem("virtualPet", JSON.stringify(pet));
}

function loadMemory() {
  const data = localStorage.getItem("virtualPet");
  if (data) {
    pet = JSON.parse(data);
    restorePetUI();
  }
}

/* ---------- CREATE PET ---------- */
function createPet() {
  const owner = document.getElementById("owner-name").value.trim();
  const name = document.getElementById("pet-name").value.trim();
  const type = document.getElementById("pet-type").value;
  const personality = document.getElementById("pet-personality").value.trim();

  if (!owner || !name || !personality) {
    alert("Please fill all fields 🐾");
    return;
  }

  pet = {
    owner,
    name,
    type,
    personality,
    happiness: 100,
    energy: 100,
    memory: [],
    image: "https://placehold.co/200x200?text=PET"
  };

  saveMemory();
  restorePetUI();
}

/* ---------- RESTORE UI ---------- */
function restorePetUI() {
  document.getElementById("pet-creation").style.display = "none";
  document.getElementById("pet-image").src = pet.image;
  document.getElementById("pet-info").innerText =
    `${pet.name} belongs to ${pet.owner}`;
  updateStats();

  const link = `${location.origin}${location.pathname}`;
  document.getElementById("share-url").innerHTML =
    `Share: <a href="${link}" target="_blank">${link}</a>`;
}

/* ---------- CHAT ---------- */
async function sendMessage(action) {
  const input = document.getElementById("user-input");
  const msg = action || input.value.trim();
  if (!msg) return;

  const chat = document.getElementById("chat-output");
  chat.innerHTML += `<p><b>You:</b> ${msg}</p>`;

  let reply;

  if (msg.toLowerCase().includes("who") && msg.toLowerCase().includes("owner")) {
    reply = `I'm ${pet.owner}'s pet 💕`;
  } else if (msg === "feed") {
    pet.happiness = Math.min(100, pet.happiness + 10);
    reply = "Yummy! I love you 🥰";
  } else if (msg === "play") {
    pet.energy = Math.max(0, pet.energy - 10);
    reply = "That was fun!! 🎾";
  } else {
    reply = await aiReply(msg);
  }

  chat.innerHTML += `<p><b>${pet.name}:</b> ${reply}</p>`;
  document.getElementById("speech-bubble").innerText = reply;
  document.getElementById("speech-bubble").style.display = "block";

  pet.memory.push(msg);
  if (pet.memory.length > 10) pet.memory.shift();

  saveMemory();
  updateStats();
  input.value = "";
  chat.scrollTop = chat.scrollHeight;
}

/* ---------- GEMINI AI ---------- */
async function aiReply(userMessage) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `
You are a virtual pet.

Name: ${pet.name}
Owner: ${pet.owner}
Personality: ${pet.personality}
Mood: happiness ${pet.happiness}%, energy ${pet.energy}%

Rules:
- Stay in character
- Cute, emotional
- Short replies
- Use emojis
- Never say you are an AI

User: "${userMessage}"
`
            }]
          }]
        })
      }
    );

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I wuv you 💕";
  } catch {
    return "Come cuddle me 🥺";
  }
}

/* ---------- STATS ---------- */
function updateStats() {
  document.getElementById("happiness-bar").style.width = pet.happiness + "%";
  document.getElementById("energy-bar").style.width = pet.energy + "%";
}

/* ---------- EVENTS ---------- */
document.getElementById("create-pet-button").onclick = createPet;
document.getElementById("send-button").onclick = () => sendMessage();
document.getElementById("user-input").onkeydown = e => {
  if (e.key === "Enter") sendMessage();
};

window.onload = loadMemory;

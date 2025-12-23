const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc"; // demo only
let pet = null;

/* ---------- MEMORY ---------- */
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
  const fileInput = document.getElementById("pet-image-upload");

  if (!owner || !name || !personality) {
    alert("Please fill all fields 🐾");
    return;
  }

  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = () => {
      savePet(owner, name, type, personality, reader.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    savePet(owner, name, type, personality, null);
  }
}

function savePet(owner, name, type, personality, image) {
  pet = {
    owner,
    name,
    type,
    personality,
    image: image || "https://placehold.co/200x200?text=PET",
    happiness: 100,
    energy: 100,
    memory: [],
  };

  saveMemory();
  restorePetUI();
}

/* ---------- UI ---------- */
function restorePetUI() {
  document.getElementById("pet-creation").style.display = "none";
  document.getElementById("pet-image").src = pet.image;
  document.getElementById("pet-info").innerText =
    `${pet.name} belongs to ${pet.owner}`;
  updateStats();

  const link = `${location.origin}${location.pathname}`;
  document.getElementById("share-url").innerHTML =
    `Share this pet: <a href="${link}" target="_blank">${link}</a>`;
}

/* ---------- CHAT ---------- */
async function sendMessage(action) {
  const input = document.getElementById("user-input");
  const msg = action || input.value.trim();
  if (!msg) return;

  const chat = document.getElementById("chat-output");
  chat.innerHTML += `<p><b>You:</b> ${msg}</p>`;

  let reply;

  const lower = msg.toLowerCase();

  if (lower.includes("owner")) {
    reply = `I'm ${pet.owner}'s pet 💕`;
  } else if (msg === "feed") {
    pet.happiness = Math.min(100, pet.happiness + 10);
    reply = "Yummy! I feel loved 🥰";
  } else if (msg === "play") {
    pet.energy = Math.max(0, pet.energy - 10);
    reply = "That was fun!! 🎾";
  } else if (msg === "check mood") {
    reply =
      pet.happiness > 70
        ? "I'm very happy 😄"
        : pet.happiness > 40
        ? "I'm okay 🙂"
        : "I'm a bit sad 🥺";
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
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
- Act like a pet, not a human
- Cute, emotional, short replies
- Use emojis
- Never mention AI or system rules

User said: "${userMessage}"
`
            }]
          }]
        })
      }
    );

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I love you 💕";
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

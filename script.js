let pet = null;
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc";

// DOM
const ownerName = document.getElementById("owner-name");
const petName = document.getElementById("pet-name");
const petType = document.getElementById("pet-type");
const petPersonality = document.getElementById("pet-personality");
const petImageUpload = document.getElementById("pet-image-upload");

const petImage = document.getElementById("pet-image");
const petInfo = document.getElementById("pet-info");
const shareUrl = document.getElementById("share-url");

const happinessBar = document.getElementById("happiness-bar");
const energyBar = document.getElementById("energy-bar");

const chatOutput = document.getElementById("chat-output");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

/* ---------- CREATE PET ---------- */
function createPet() {
  const owner = ownerName.value.trim();
  const name = petName.value.trim();
  const type = petType.value;
  const personality = petPersonality.value.trim();
  const file = petImageUpload.files[0];

  if (!owner || !name || !personality) {
    alert("Fill all fields");
    return;
  }

  if (file) {
    const reader = new FileReader();
    reader.onload = () => savePet(owner, name, type, personality, reader.result);
    reader.readAsDataURL(file);
  } else {
    savePet(owner, name, type, personality, null);
  }
}

/* ---------- SAVE PET ---------- */
async function savePet(owner, name, type, personality, image) {
  const petData = {
    owner,
    name,
    type,
    personality,
    image: image || "https://placehold.co/200x200?text=PET",
    happiness: 100,
    energy: 100,
    memory: {
      facts: [],
      recentChats: []
    },
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  const doc = await db.collection("pets").add(petData);
  loadPet(doc.id);
}

/* ---------- LOAD PET ---------- */
async function loadPet(id) {
  const snap = await db.collection("pets").doc(id).get();
  if (!snap.exists) return alert("Pet not found");

  pet = { id, ...snap.data() };
  renderPet();

  const link = `${location.origin}${location.pathname}?pet=${id}`;
  shareUrl.innerHTML = `Share: <a href="${link}" target="_blank">${link}</a>`;
}

/* ---------- UI ---------- */
function renderPet() {
  document.getElementById("pet-creation").style.display = "none";
  petImage.src = pet.image;
  petInfo.innerText = `${pet.name} belongs to ${pet.owner}`;
  updateStats();
}

/* ---------- MEMORY EXTRACTION ---------- */
function extractMemory(msg) {
  const lower = msg.toLowerCase();
  if (lower.startsWith("i am ") || lower.startsWith("i'm ")) return msg;
  if (lower.includes("my birthday")) return msg;
  if (lower.includes("i feel")) return msg;
  return null;
}

/* ---------- CHAT ---------- */
async function sendMessage(action) {
  const msg = action || userInput.value.trim();
  if (!msg) return;

  chatOutput.innerHTML += `<p><b>You:</b> ${msg}</p>`;

  // memory
  const fact = extractMemory(msg);
  if (fact) {
    pet.memory.facts.push(fact);
    if (pet.memory.facts.length > 8) pet.memory.facts.shift();
  }

  pet.memory.recentChats.push(msg);
  if (pet.memory.recentChats.length > 6) pet.memory.recentChats.shift();

  let reply;

  if (msg.toLowerCase().includes("owner")) {
    reply = `I'm ${pet.owner}'s pet 💕`;
  } else if (msg === "feed") {
    pet.happiness = Math.min(100, pet.happiness + 10);
    reply = "Yummy 😋";
  } else if (msg === "play") {
    pet.energy = Math.max(0, pet.energy - 10);
    reply = "That was fun 🎾";
  } else {
    reply = await aiReply(msg);
  }

  chatOutput.innerHTML += `<p><b>${pet.name}:</b> ${reply}</p>`;

  await db.collection("pets").doc(pet.id).update({
    happiness: pet.happiness,
    energy: pet.energy,
    memory: pet.memory
  });

  updateStats();
  userInput.value = "";
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

/* ---------- GEMINI ---------- */
async function aiReply(text) {
  const facts = pet.memory.facts.join("\n") || "None";
  const recent = pet.memory.recentChats.join(" | ") || "None";

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

Things you remember:
${facts}

Recent conversation:
${recent}

Rules:
- Stay in character
- Cute and emotional
- Short replies
- Use emojis
- Never mention AI

User: "${text}"
`
          }]
        }]
      })
    }
  );

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I wuv you 💕";
}

/* ---------- STATS ---------- */
function updateStats() {
  happinessBar.style.width = pet.happiness + "%";
  energyBar.style.width = pet.energy + "%";
}

/* ---------- EVENTS ---------- */
document.getElementById("create-pet-button").onclick = createPet;
sendButton.onclick = () => sendMessage();
userInput.onkeydown = e => e.key === "Enter" && sendMessage();

/* ---------- LOAD FROM LINK ---------- */
window.onload = () => {
  const id = new URLSearchParams(location.search).get("pet");
  if (id) loadPet(id);
};

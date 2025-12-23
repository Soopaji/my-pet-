let pet = null;
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc";

// DOM
const petCreation = document.getElementById("pet-creation");
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
const speechBubble = document.getElementById("speech-bubble");

/* ---------------- CREATE PET ---------------- */
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
    reader.onload = () => {
      savePet(owner, name, type, personality, reader.result);
    };
    reader.readAsDataURL(file);
  } else {
    savePet(owner, name, type, personality, null);
  }
}

/* ---------------- SAVE PET ---------------- */
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

/* ---------------- LOAD PET ---------------- */
async function loadPet(id) {
  const snap = await db.collection("pets").doc(id).get();
  if (!snap.exists) {
    alert("Pet not found");
    return;
  }

  pet = { id, ...snap.data() };
  renderPet();

  const link = `${location.origin}${location.pathname}?pet=${id}`;
  shareUrl.innerHTML = `Share this pet: <a href="${link}" target="_blank">${link}</a>`;
}

/* ---------------- UI ---------------- */
function renderPet() {
  petCreation.style.display = "none";
  petCreation.style.pointerEvents = "none";

  petImage.src = pet.image;
  petInfo.innerText = `${pet.name} belongs to ${pet.owner}`;
  updateStats();

  setTimeout(() => userInput.focus(), 300);
}

/* ---------------- MEMORY ---------------- */
function extractMemory(msg) {
  const l = msg.toLowerCase();
  if (l.startsWith("i am ") || l.startsWith("i'm ")) return msg;
  if (l.includes("my birthday")) return msg;
  if (l.includes("i feel")) return msg;
  return null;
}

/* ---------------- CHAT ---------------- */
async function sendMessage(action) {
  if (!pet) return;

  const msg = action || userInput.value.trim();
  if (!msg) return;

  chatOutput.innerHTML += `<p><b>You:</b> ${msg}</p>`;

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
  } else if (msg === "check mood") {
    reply =
      pet.happiness > 70 ? "I'm happy 😄" :
      pet.happiness > 40 ? "I'm okay 🙂" :
      "I'm sad 🥺";
  } else {
    reply = await aiReply(msg);
  }

  chatOutput.innerHTML += `<p><b>${pet.name}:</b> ${reply}</p>`;
  speechBubble.innerText = reply;
  speechBubble.style.display = "block";

  await db.collection("pets").doc(pet.id).update({
    happiness: pet.happiness,
    energy: pet.energy,
    memory: pet.memory
  });

  updateStats();
  userInput.value = "";
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

/* ---------------- GEMINI ---------------- */
async function aiReply(text) {
  const facts = pet.memory.facts.join("\n") || "None";
  const recent = pet.memory.recentChats.join(" | ") || "None";

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

Things you remember:
${facts}

Recent conversation:
${recent}

Rules:
- Stay in character
- Cute, emotional
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
  } catch {
    return "Come cuddle me 🥺";
  }
}

/* ---------------- STATS ---------------- */
function updateStats() {
  happinessBar.style.width = pet.happiness + "%";
  energyBar.style.width = pet.energy + "%";
}

/* ---------------- EVENTS ---------------- */
document.getElementById("create-pet-button").onclick = createPet;
sendButton.onclick = () => sendMessage();
userInput.onkeydown = e => e.key === "Enter" && sendMessage();

/* ---------------- LOAD FROM LINK ---------------- */
window.onload = () => {
  const id = new URLSearchParams(location.search).get("pet");
  if (id) loadPet(id);
};

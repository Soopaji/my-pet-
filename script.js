let pet = null;
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc";

// ---------- DOM ELEMENTS ----------
const petCreation = document.getElementById("pet-creation");
const ownerName = document.getElementById("owner-name");
const petName = document.getElementById("pet-name");
const petType = document.getElementById("pet-type");
const petPersonality = document.getElementById("pet-personality");
const petImageUpload = document.getElementById("pet-image-upload");

const createPetButton = document.getElementById("create-pet-button");

const petImage = document.getElementById("pet-image");
const petInfo = document.getElementById("pet-info");
const shareUrl = document.getElementById("share-url");

const happinessBar = document.getElementById("happiness-bar");
const energyBar = document.getElementById("energy-bar");

const chatOutput = document.getElementById("chat-output");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const speechBubble = document.getElementById("speech-bubble");

/* ---------- CREATE PET ---------- */
async function createPet() {
  const owner = ownerName.value.trim();
  const name = petName.value.trim();
  const type = petType.value;
  const personality = petPersonality.value.trim();
  const file = petImageUpload.files[0];

  if (!owner || !name || !personality) {
    alert("Please fill all fields 🐾");
    return;
  }

  let imageURL = "https://placehold.co/200x200?text=PET";

  if (file) {
    const ref = storage.ref(`pets/${Date.now()}_${file.name}`);
    await ref.put(file);
    imageURL = await ref.getDownloadURL();
  }

  const doc = await db.collection("pets").add({
    owner,
    name,
    type,
    personality,
    image: imageURL,
    happiness: 100,
    energy: 100,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  loadPet(doc.id);
}

/* ---------- LOAD PET ---------- */
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

/* ---------- UI ---------- */
function renderPet() {
  petCreation.style.display = "none";
  petImage.src = pet.image;
  petInfo.innerText = `${pet.name} belongs to ${pet.owner}`;
  updateStats();
}

/* ---------- CHAT ---------- */
async function sendMessage(action) {
  const msg = action || userInput.value.trim();
  if (!msg) return;

  chatOutput.innerHTML += `<p><b>You:</b> ${msg}</p>`;
  let reply;

  const lower = msg.toLowerCase();

  if (lower.includes("owner")) {
    reply = `I'm ${pet.owner}'s pet 💕`;
  } else if (msg === "feed") {
    pet.happiness = Math.min(100, pet.happiness + 10);
    reply = "Yummy! 😋";
  } else if (msg === "play") {
    pet.energy = Math.max(0, pet.energy - 10);
    reply = "That was fun! 🎾";
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

  chatOutput.innerHTML += `<p><b>${pet.name}:</b> ${reply}</p>`;
  speechBubble.innerText = reply;
  speechBubble.style.display = "block";

  await db.collection("pets").doc(pet.id).update({
    happiness: pet.happiness,
    energy: pet.energy,
  });

  updateStats();
  userInput.value = "";
  chatOutput.scrollTop = chatOutput.scrollHeight;
}

/* ---------- GEMINI ---------- */
async function aiReply(text) {
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

/* ---------- STATS ---------- */
function updateStats() {
  happinessBar.style.width = pet.happiness + "%";
  energyBar.style.width = pet.energy + "%";
}

/* ---------- EVENTS ---------- */
createPetButton.onclick = createPet;
sendButton.onclick = () => sendMessage();
userInput.onkeydown = e => e.key === "Enter" && sendMessage();

/* ---------- LOAD FROM LINK ---------- */
window.onload = () => {
  const id = new URLSearchParams(location.search).get("pet");
  if (id) loadPet(id);
};

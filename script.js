let pet = null;
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc";

/* ================= DOM ================= */
const petCreation = document.getElementById("pet-creation");
const petBox = document.getElementById("pet-box");
const controls = document.getElementById("controls");
const chatUI = document.getElementById("chat-interface");

const ownerName = document.getElementById("owner-name");
const petName = document.getElementById("pet-name");
const petImageUpload = document.getElementById("pet-image-upload");

const petImage = document.getElementById("pet-image");
const petInfo = document.getElementById("pet-info");
const shareUrl = document.getElementById("share-url");

const chatOutput = document.getElementById("chat-output");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");

/* ================= CREATE PET ================= */
const createBtn = document.getElementById("create-pet-button");
if (createBtn) {
  createBtn.addEventListener("click", () => {
    const owner = ownerName.value.trim();
    const name = petName.value.trim();
    const file = petImageUpload?.files?.[0];

    if (!owner || !name) {
      alert("Please enter owner name and pet name");
      return;
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = () => savePet(owner, name, reader.result);
      reader.readAsDataURL(file);
    } else {
      savePet(owner, name, null);
    }
  });
}

/* ================= SAVE PET ================= */
async function savePet(owner, name, image) {
  const petData = {
    owner,
    name,
    image: image || "https://placehold.co/200x200?text=PET",
    happiness: 100,
    memory: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const doc = await db.collection("pets").add(petData);
  loadPet(doc.id);
}

/* ================= LOAD PET ================= */
async function loadPet(id) {
  const snap = await db.collection("pets").doc(id).get();
  if (!snap.exists) {
    alert("Pet not found");
    return;
  }

  pet = { id, ...snap.data() };

  if (petCreation) {
    petCreation.style.display = "none";
    petCreation.style.pointerEvents = "none";
  }
  if (petBox) petBox.style.display = "block";
  if (controls) controls.style.display = "block";
  if (chatUI) chatUI.style.display = "block";

  petImage.src = pet.image;
  petInfo.innerText = `${pet.name} belongs to ${pet.owner}`;

  const link = `${location.origin}${location.pathname}?pet=${id}`;
  if (shareUrl) {
    shareUrl.innerHTML = `Share: <a href="${link}" target="_blank">${link}</a>`;
  }

  // force-enable chat input
  userInput.disabled = false;
  userInput.readOnly = false;
  userInput.value = "";
  userInput.focus();
}

/* ================= CHAT ================= */
async function sendMessage(text) {
  if (!pet || !text) return;

  chatOutput.innerHTML += `<p><b>You:</b> ${text}</p>`;

  pet.memory.push(text);
  if (pet.memory.length > 6) pet.memory.shift();

  let reply;
  const lower = text.toLowerCase();

  if (lower.includes("owner")) {
    reply = `I'm ${pet.owner}'s pet 💕`;
  } else if (lower === "feed") {
    pet.happiness = Math.min(100, pet.happiness + 10);
    reply = "Yummy 😋";
  } else if (lower === "play") {
    pet.happiness = Math.min(100, pet.happiness + 5);
    reply = "That was fun 🎾";
  } else if (lower === "check mood") {
    reply =
      pet.happiness > 70
        ? "I'm happy 😄"
        : pet.happiness > 40
        ? "I'm okay 🙂"
        : "I'm sad 🥺";
  } else {
    reply = await aiReply(text);
  }

  chatOutput.innerHTML += `<p><b>${pet.name}:</b> ${reply}</p>`;

  await db.collection("pets").doc(pet.id).update({
    happiness: pet.happiness,
    memory: pet.memory,
  });

  chatOutput.scrollTop = chatOutput.scrollHeight;
}

/* ================= GEMINI ================= */
async function aiReply(text) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `
You are a virtual pet.

Name: ${pet.name}
Owner: ${pet.owner}

Recent memory:
${pet.memory.join(" | ") || "None"}

Rules:
- Act like a pet
- Cute and emotional
- Short replies
- Use emojis
- Never say you are an AI

User: "${text}"
`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || "I wuv you 💕";
  } catch {
    return "Come cuddle me 🥺";
  }
}

/* ================= CHAT INPUT EVENTS ================= */
if (sendButton) {
  sendButton.addEventListener("click", () => {
    const msg = userInput.value.trim();
    userInput.value = "";
    sendMessage(msg);
  });
}

if (userInput) {
  userInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      const msg = userInput.value.trim();
      userInput.value = "";
      sendMessage(msg);
    }
  });
}

/* ================= OPTIONAL CONTROL BUTTONS ================= */
const feedBtn = document.getElementById("feed-btn");
if (feedBtn) feedBtn.addEventListener("click", () => sendMessage("feed"));

const playBtn = document.getElementById("play-btn");
if (playBtn) playBtn.addEventListener("click", () => sendMessage("play"));

const moodBtn = document.getElementById("mood-btn");
if (moodBtn) moodBtn.addEventListener("click", () => sendMessage("check mood"));

/* ================= LOAD FROM SHARE LINK ================= */
window.addEventListener("load", () => {
  const id = new URLSearchParams(location.search).get("pet");
  if (id) loadPet(id);
});

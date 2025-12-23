let pet = null;
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc";

/* ================= DOM ELEMENTS ================= */
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
document
  .getElementById("create-pet-button")
  .addEventListener("click", () => {
    const owner = ownerName.value.trim();
    const name = petName.value.trim();
    const file = petImageUpload.files[0];

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

/* ================= SAVE PET ================= */
async function savePet(owner, name, image) {
  const petData = {
    owner,
    name,
    image: image || "https://placehold.co/200x200?text=PET",
    happiness: 100,
    memory: [], // light long-term memory
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

  // UI state
  petCreation.style.display = "none";
  petCreation.style.pointerEvents = "none";
  petBox.style.display = "block";
  controls.style.display = "block";
  chatUI.style.display = "block";

  petImage.src = pet.image;
  petInfo.innerText = `${pet.name} belongs to ${pet.owner}`;

  const link = `${location.origin}${location.pathname}?pet=${id}`;
  shareUrl.innerHTML = `Share: <a href="${link}" target="_blank">${link}</a>`;

  // 🔑 ensure chat input works
  userInput.disabled = false;
  userInput.readOnly = false;
  userInput.value = "";
  userInput.focus();
}

/* ================= CHAT ================= */
async function sendMessage(text) {
  if (!pet || !text) return;

  chatOutput.innerHTML += `<p><b>You:</b> ${text}</p>`;

  // store memory (limited)
  pet.memory.push(text);
  if (pet.memory.length > 6) pet.memory.shift();

  let reply;

  if (text.toLowerCase().includes("owner")) {
    reply = `I'm ${pet.owner}'s pet 💕`;
  } else if (text === "feed") {
    pet.happiness = Math.min(100, pet.happiness + 10);
    reply = "Yummy 😋";
  } else if (text === "play") {
    pet.happiness = Math.min(100, pet.happiness + 5);
    reply = "That was fun 🎾";
  } else if (text === "check mood") {
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

/* ================= GEMINI AI ================= */
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

Recent things you remember:
${pet.memory.join(" | ") || "Nothing yet"}

Rules:
- Act like a pet
- Be cute and emotional
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
    return (
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "I wuv you 💕"
    );
  } catch {
    return "Come cuddle me 🥺";
  }
}

/* ================= EVENTS ================= */
sendButton.addEventListener("click", () => {
  const msg = userInput.value.trim();
  userInput.value = "";
  sendMessage(msg);
});

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const msg = userInput.value.trim();
    userInput.value = "";
    sendMessage(msg);
  }
});

document
  .getElementById("feed-btn")
  .addEventListener("click", () => sendMessage("feed"));

document
  .getElementById("play-btn")
  .addEventListener("click", () => sendMessage("play"));

document
  .getElementById("mood-btn")
  .addEventListener("click", () => sendMessage("check mood"));

/* ================= LOAD FROM SHARE LINK ================= */
window.addEventListener("load", () => {
  const id = new URLSearchParams(location.search).get("pet");
  if (id) loadPet(id);
});

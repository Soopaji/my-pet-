let pet = null;

/* ============================
   GEMINI API CONFIG
============================ */
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc"; // ⚠️ For demo only

/* ============================
   PET TYPES & PERSONALITY
============================ */
const petTypes = {
  dog: {
    sound: "🐶 Woof!",
    traits: "loyal, playful, energetic, loves attention",
    emoji: "🐶",
    defaultImage:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5Eb2c8L3RleHQ+PC9zdmc+",
  },
  cat: {
    sound: "🐱 Meow~",
    traits: "independent, sassy, affectionate but moody",
    emoji: "🐱",
    defaultImage:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DYXQ8L3RleHQ+PC9zdmc+",
  },
  rabbit: {
    sound: "🐰 Squeak!",
    traits: "shy, sweet, gentle, curious",
    emoji: "🐰",
    defaultImage:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5SYWJiaXQ8L3RleHQ+PC9zdmc+",
  },
  bird: {
    sound: "🐦 Chirp!",
    traits: "talkative, cheerful, energetic",
    emoji: "🐦",
    defaultImage:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5CaXJkPC90ZXh0Pjwvc3ZnPg==",
  },
  custom: {
    sound: "💖",
    traits: "loving, magical, friendly",
    emoji: "✨",
    defaultImage:
      "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCI+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0iI2RkZCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LXNpemU9IjIwIiBmaWxsPSIjOTk5IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5DdXN0b208L3RleHQ+PC9zdmc+",
  },
};

/* ============================
   CREATE PET
============================ */
async function createPet() {
  const name = document.getElementById("pet-name").value.trim();
  const type = document.getElementById("pet-type").value;
  const fileInput = document.getElementById("pet-image-upload");

  if (!name) {
    alert("Please give your pet a name 🐾");
    return;
  }

  let imageData = petTypes[type].defaultImage;

  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      imageData = e.target.result;
      await savePet(name, type, imageData);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    await savePet(name, type, imageData);
  }
}

async function savePet(name, type, image) {
  pet = {
    id: Date.now().toString(),
    name,
    type,
    image,
    happiness: 100,
    energy: 100,
    memory: [],
  };

  document.getElementById("pet-image").src = pet.image;
  document.getElementById(
    "pet-info"
  ).innerText = `${pet.name} the ${pet.type} is ready!`;
  document.getElementById("pet-creation").style.display = "none";
  document.getElementById("pet-stats").style.display = "block";
  updateStats();
}

/* ============================
   CHAT & COMMANDS
============================ */
async function sendMessage(action) {
  if (!pet) {
    alert("Create a pet first!");
    return;
  }

  const input = document.getElementById("user-input");
  const chat = document.getElementById("chat-output");
  const command = action || input.value.trim();
  if (!command) return;

  chat.innerHTML += `<p><strong>You:</strong> ${command}</p>`;

  let reply = "";

  switch (command.toLowerCase()) {
    case "feed":
      pet.happiness = Math.min(100, pet.happiness + 10);
      pet.energy = Math.min(100, pet.energy + 5);
      reply = `${petTypes[pet.type].sound} Yum! I feel loved 💕`;
      break;

    case "play":
      pet.happiness = Math.min(100, pet.happiness + 5);
      pet.energy = Math.max(0, pet.energy - 10);
      reply = `${petTypes[pet.type].sound} That was fun!! 🎾`;
      break;

    case "check mood":
      reply =
        pet.happiness > 80
          ? "I'm super happy!! 😄"
          : pet.happiness > 50
          ? "I'm feeling okay 🙂"
          : "I'm a bit sad… 🥺";
      break;

    default:
      reply = await getAIResponse(command);
      break;
  }

  chat.innerHTML += `<p><strong>${pet.name}:</strong> ${reply}</p>`;
  document.getElementById("speech-bubble").innerText = reply;
  document.getElementById("speech-bubble").style.display = "block";

  pet.memory.push(command);
  if (pet.memory.length > 5) pet.memory.shift();

  input.value = "";
  updateStats();
  chat.scrollTop = chat.scrollHeight;
}

/* ============================
   GEMINI AI RESPONSE
============================ */
async function getAIResponse(userMessage) {
  try {
    const mood =
      pet.happiness > 80
        ? "very happy"
        : pet.happiness > 50
        ? "calm"
        : "sad";

    const response = await fetch(
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
Type: ${pet.type}
Traits: ${petTypes[pet.type].traits}
Mood: ${mood}
Energy: ${pet.energy}%

Rules:
- Reply in 1–2 sentences
- Be cute, emotional, pet-like
- Use emojis
- Never say "I don't know"

User said: "${userMessage}"
`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    return `${petTypes[pet.type].sound} ${text || "I love chatting with you 💕"}`;
  } catch (e) {
    return `${petTypes[pet.type].sound} I'm cuddling you instead 🥰`;
  }
}

/* ============================
   UI HELPERS
============================ */
function updateStats() {
  document.getElementById("happiness-bar").style.width = `${pet.happiness}%`;
  document.getElementById("energy-bar").style.width = `${pet.energy}%`;
  document.getElementById("happiness-value").innerText = `${pet.happiness}%`;
  document.getElementById("energy-value").innerText = `${pet.energy}%`;
}

/* ============================
   EVENT LISTENERS
============================ */
document
  .getElementById("create-pet-button")
  .addEventListener("click", createPet);

document
  .getElementById("send-button")
  .addEventListener("click", () => sendMessage());

document
  .getElementById("user-input")
  .addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

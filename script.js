let pet = null;

// Gemini API key
const API_KEY = "AIzaSyAbDtNzUj_ZoXzl5kpfdpx2lyinVxX65wc";

// Pet types
const petTypes = {
  dog: { sound: "Woof!", defaultImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5Eb2c8L3RleHQ+PC9zdmc+" },
  cat: { sound: "Meow!", defaultImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DYXQ8L3RleHQ+PC9zdmc+" },
  rabbit: { sound: "Squeak!", defaultImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5SYWJiaXQ8L3RleHQ+PC9zdmc+" },
  bird: { sound: "Chirp!", defaultImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5CaXJkPC90ZXh0Pjwvc3ZnPg==" },
  custom: { sound: "💖", defaultImage: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjAiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5DdXN0b208L3RleHQ+PC9zdmc+" },
};

// Create pet
async function createPet() {
  const name = document.getElementById("pet-name").value.trim();
  const type = document.getElementById("pet-type").value || "custom";
  const fileInput = document.getElementById("pet-image-upload");

  if (!name) {
    alert("Please enter a name for your pet!");
    return;
  }

  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      await savePetToDB(name, type, e.target.result);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    await savePetToDB(name, type, petTypes[type].defaultImage);
  }
}

// Save pet
async function savePetToDB(name, type, imageURL) {
  const petData = {
    name,
    type,
    image: imageURL,
    happiness: 100,
    energy: 100,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection("pets").add(petData);
  pet = { id: docRef.id, ...petData };

  document.getElementById("pet-image").src = pet.image;
  document.getElementById("pet-info").innerText = `${pet.name} the ${pet.type} is ready!`;

  const shareLink = `${location.origin}${location.pathname}?pet=${pet.id}`;
  document.getElementById("share-url").innerHTML =
    `Share your pet: <a href="${shareLink}" target="_blank">${shareLink}</a>`;

  document.getElementById("pet-creation").style.display = "none";
  document.getElementById("pet-stats").style.display = "block";
  updateStatsDisplay();
}

// Chat
async function sendMessage(action) {
  if (!pet) return;

  const inputEl = document.getElementById("user-input");
  const chatOutput = document.getElementById("chat-output");
  const command = action || inputEl.value.trim();
  if (!command) return;

  chatOutput.innerHTML += `<p><strong>You:</strong> ${command}</p>`;

  let reply;
  switch (command.toLowerCase()) {
    case "feed":
      pet.happiness = Math.min(100, pet.happiness + 10);
      reply = `${pet.name} happily eats! 🍖`;
      break;
    case "play":
      pet.energy = Math.max(0, pet.energy - 10);
      reply = `${pet.name} enjoys playing! 🎾`;
      break;
    default:
      reply = await getAIResponse(command);
  }

  chatOutput.innerHTML += `<p><strong>${pet.name}:</strong> ${reply}</p>`;
  inputEl.value = "";
  updateStatsDisplay();
}

// Gemini AI
async function getAIResponse(userMessage) {
  try {
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
                  text: `You are a virtual pet ${pet.type} named ${pet.name}. Reply cutely to: "${userMessage}"`,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();
    return (
      petTypes[pet.type].sound +
      " " +
      (data?.candidates?.[0]?.content?.parts?.[0]?.text ||
        "Hmm... I'm not sure 🐾")
    );
  } catch {
    return petTypes[pet.type].sound + " I'm sleepy right now 😴";
  }
}

// Stats UI
function updateStatsDisplay() {
  document.getElementById("happiness-bar").style.width = pet.happiness + "%";
  document.getElementById("energy-bar").style.width = pet.energy + "%";
}

// Events
document.getElementById("create-pet-button").addEventListener("click", createPet);
document.getElementById("send-button").addEventListener("click", () => sendMessage());
document.getElementById("user-input").addEventListener("keydown", e => {
  if (e.key === "Enter") sendMessage();
});

// Load shared pet
window.addEventListener("load", () => {
  const id = new URLSearchParams(location.search).get("pet");
  if (id) loadPet(id);
});


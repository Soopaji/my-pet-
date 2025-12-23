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

  // If image uploaded, read it as base64
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = async function (e) {
      const imageData = e.target.result;
      await savePetToDB(name, type, imageData);
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    const imageData =
      petTypes[type]?.defaultImage || "assets/default-pet.png";
    await savePetToDB(name, type, imageData);
  }
}

// Save pet in Firestore + set global state + show share link
async function savePetToDB(name, type, imageURL) {
  try {

    const petData = {
      name,
      type,
      image: imageURL,
      happiness: 100,
      energy: 100,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("pets").add(petData);
    const petId = docRef.id;

    pet = { id: petId, ...petData };

    document.getElementById("pet-image").src = pet.image;
    document.getElementById("pet-info").innerText = `${pet.name} the ${pet.type} is ready!`;

    const shareLink = `${window.location.origin}${window.location.pathname}?pet=${petId}`;
    document.getElementById("share-url").innerHTML = `Share your pet: <a href="${shareLink}" target="_blank">${shareLink}</a>`;

    alert("Your pet is ready! Share this link:\n" + shareLink);

    document.getElementById("pet-creation").style.display = "none";
    document.getElementById("pet-stats").style.display = "block";
    updateStatsDisplay();

  } catch (err) {
    console.error("Error saving pet:", err);
    alert("Error creating pet. Please try again.");
  }
}

// Load pet from Firestore using id from ?pet=...
async function loadPet(id) {
  try {
    const doc = await db.collection("pets").doc(id).get();
    if (!doc.exists) {
      console.warn("No pet found with id:", id);
      alert("This pet link is invalid or deleted.");
      return;
    }

    const data = doc.data();
    pet = { id, ...data };

    const petImage = document.getElementById("pet-image");
    petImage.src = pet.image;

    document.getElementById(
      "pet-info"
    ).innerText = `${pet.name} the ${pet.type}`;
    document.getElementById("pet-creation").style.display = "none";

    const shareLink = `${window.location.origin}${window.location.pathname}?pet=${id}`;
    const shareUrlEl = document.getElementById("share-url");
    if (shareUrlEl) {
      shareUrlEl.innerHTML = `Share this pet: <a href="${shareLink}" target="_blank">${shareLink}</a>`;
    }
  } catch (err) {
    console.error("Error loading pet:", err);
  }
}

// Optional: image preview on upload
const fileInputEl = document.getElementById("pet-image-upload");
if (fileInputEl) {
  fileInputEl.addEventListener("change", function (event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (e) {
        document.getElementById("pet-image").src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  });
}

// Chat / Commands
async function sendMessage(action) {
  if (!pet) {
    alert("Please create or load a pet first!");
    return;
  }

  const inputEl = document.getElementById("user-input");
  const chatOutput = document.getElementById("chat-output");

  const command = action || inputEl.value.trim();
  if (!command) return;

  chatOutput.innerHTML += `<p><strong>You:</strong> ${command}</p>`;
  chatOutput.scrollTop = chatOutput.scrollHeight;

  let petResponse = "";

  switch (command.toLowerCase()) {
    case "feed":
      pet.happiness = Math.min(pet.happiness + 10, 100);
      pet.energy = Math.min(pet.energy + 5, 100);
      petResponse = `${pet.name} happily eats! 🍖`;
      break;
    case "play":
      pet.happiness = Math.min(pet.happiness + 5, 100);
      pet.energy = Math.max(pet.energy - 10, 0);
      petResponse = `${pet.name} enjoys playing! 🎾`;
      break;
    case "check mood":
      if (pet.happiness > 80) {
        petResponse = `${pet.name} is very happy! 😊`;
      } else if (pet.happiness > 50) {
        petResponse = `${pet.name} is content. 🙂`;
      } else {
        petResponse = `${pet.name} seems a bit sad. 😢`;
      }
      break;
    default:
      petResponse = await getAIResponse(command);
      break;
  }

  chatOutput.innerHTML += `<p><strong>${pet.name}:</strong> ${petResponse}</p>`;
  chatOutput.scrollTop = chatOutput.scrollHeight;

  const speechBubble = document.getElementById("speech-bubble");
  speechBubble.innerText = petResponse;
  speechBubble.style.display = "block";

  if (!action) {
    inputEl.value = "";
  }

  // Save updated mood/energy
  if (pet.id) {
    db.collection("pets")
      .doc(pet.id)
      .update({
        happiness: pet.happiness,
        energy: pet.energy,
      })
      .catch((err) => console.error("Error updating pet stats:", err));
  }

  updateStatsDisplay();
}

// AI reply using Gemini API
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

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    const sound = petTypes[pet.type]?.sound || "🐾";
    return sound + " " + (text || "Hmm... I'm not sure what to say! 🐾");
  } catch (error) {
    console.error("AI Error:", error);
    const sound = petTypes[pet.type]?.sound || "🐾";
    return sound + " Sorry, I'm having trouble responding! 🐾";
  }
}

// Button listeners
document
  .getElementById("create-pet-button")
  .addEventListener("click", createPet);

document
  .getElementById("send-button")
  .addEventListener("click", () => sendMessage());

document
  .getElementById("user-input")
  .addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });

// Update stats display
function updateStatsDisplay() {
  if (!pet) return;

  const happinessBar = document.getElementById("happiness-bar");
  const energyBar = document.getElementById("energy-bar");
  const happinessValue = document.getElementById("happiness-value");
  const energyValue = document.getElementById("energy-value");

  happinessBar.style.width = `${pet.happiness}%`;
  energyBar.style.width = `${pet.energy}%`;
  happinessValue.textContent = `${pet.happiness}%`;
  energyValue.textContent = `${pet.energy}%`;
}

// On load: check for ?pet=ID
window.addEventListener("load", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const petId = urlParams.get("pet");

  if (petId) {
    loadPet(petId);
  }
});


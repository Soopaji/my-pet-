let pet = null;

const API_KEY = "AIzaSyCWjlAAysIa65rncjBnn_J0UQL8qGMDACM";

const petTypes = {
  dog: { sound: "Woof!", defaultImage: "assets/dog.png" },
  cat: { sound: "Meow!", defaultImage: "assets/cat.png" },
  rabbit: { sound: "Squeak!", defaultImage: "assets/rabbit.png" },
  bird: { sound: "Chirp!", defaultImage: "assets/bird.png" }
};

// Handle pet creation
function createPet() {
  const name = document.getElementById("pet-name").value.trim();
  const type = document.getElementById("pet-type").value;
  const fileInput = document.getElementById("pet-image-upload");
  const petImage = document.getElementById("pet-image");

  if (!name) {
    alert("Please enter a name for your pet!");
    return;
  }

  pet = {
    name,
    type,
    happiness: 100,
    energy: 100,
    sound: petTypes[type]?.sound || "🐾"
  };

  // Use uploaded image if available
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function (e) {
      pet.image = e.target.result;
      petImage.src = pet.image;
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    pet.image = petTypes[type]?.defaultImage || "assets/default-pet.png";
    petImage.src = pet.image;
  }

  document.getElementById("pet-info").innerText = `${pet.name} the ${pet.type} is ready!`;
  document.getElementById("speech-bubble").style.display = "none";
  document.getElementById("pet-creation").style.display = "none";
}

// Optional: Preview image on upload
document.getElementById("pet-image-upload").addEventListener("change", function (event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      document.getElementById("pet-image").src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Handle chat input & commands
async function sendMessage(action) {
  if (!pet) {
    alert("Please create a pet first!");
    return;
  }

  const command = action || document.getElementById("user-input").value.trim();
  if (!command) return;

  document.getElementById("chat-output").innerHTML += `<p><strong>You:</strong> ${command}</p>`;

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
      petResponse = pet.happiness > 80
        ? `${pet.name} is very happy! 😊`
        : pet.happiness > 50
        ? `${pet.name} is content. 🙂`
        : `${pet.name} seems a bit sad. 😢`;
      break;
    default:
      petResponse = await getAIResponse(command);
      break;
  }

  document.getElementById("chat-output").innerHTML += `<p><strong>${pet.name}:</strong> ${petResponse}</p>`;
  document.getElementById("speech-bubble").innerText = petResponse;
  document.getElementById("speech-bubble").style.display = "block";

  if (!action) {
    document.getElementById("user-input").value = "";
  }
}

// AI reply using Gemini API
async function getAIResponse(userMessage) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a virtual pet ${pet.type} named ${pet.name}. Reply in a cute, friendly tone to: "${userMessage}"`
              }
            ]
          }
        ]
      })
    });

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return pet.sound + " " + (text || "Hmm... I'm not sure what to say! 🐾");
  } catch (error) {
    console.error("AI Error:", error);
    return pet.sound + " Sorry, I'm having trouble responding! 🐾";
  }
}

// Event listeners
document.getElementById("create-pet-button").addEventListener("click", createPet);
document.getElementById("send-button").addEventListener("click", () => sendMessage());

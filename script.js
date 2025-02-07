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
    name: name,
    type: type,
    happiness: 100,
    energy: 100,
    sound: petTypes[type]?.sound || "🐾"
  };

  // Use uploaded image if available; otherwise, use the default image for the selected type.
  if (fileInput.files.length > 0) {
    const reader = new FileReader();
    reader.onload = function (e) {
      pet.image = e.target.result; // store image data in pet object
      petImage.src = pet.image;
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else {
    pet.image = petTypes[type]?.defaultImage || "assets/default-pet.png";
    petImage.src = pet.image;
  }

  document.getElementById("pet-info").innerText = `${pet.name} the ${pet.type} is ready!`;
  document.getElementById("speech-bubble").style.display = "none";
  // Hide the pet creation box for a cleaner UI once the pet is created
  document.getElementById("pet-creation").style.display = "none";
}

// Optional: Preview uploaded pet image immediately
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

// Handle chat input & built-in commands (Feed, Play, Check Mood)
// This function accepts an optional parameter 'action'. If provided (e.g. "feed"),
// it uses that as the command; otherwise, it retrieves the text from the chat input.
async function sendMessage(action) {
  if (!pet) {
    alert("Please create a pet first!");
    return;
  }

  // Use the provided action, or if not provided, get the value from the input box.
  const command = action || document.getElementById("user-input").value.trim();
  if (!command) return;

  // Append user's message to chat output.
  document.getElementById("chat-output").innerHTML += `<p><strong>You:</strong> ${command}</p>`;

  let petResponse = "";
  // Built-in command handling:
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

  // Append pet's response to chat output.
  document.getElementById("chat-output").innerHTML += `<p><strong>${pet.name}:</strong> ${petResponse}</p>`;
  // Show speech bubble with pet's response.
  document.getElementById("speech-bubble").innerText = petResponse;
  document.getElementById("speech-bubble").style.display = "block";

  // If the message was from the chat input (and not a button command), clear the input.
  if (!action) {
    document.getElementById("user-input").value = "";
  }
}

// Fetch AI response using Google Gemini API for non-built-in commands.
async function getAIResponse(userMessage) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `You are a ${pet.type} named ${pet.name}. Reply in a cute, friendly, and fun way to: "${userMessage}"`
              }
            ]
          }
        ]
      })
    });
    const data = await response.json();
    if (data.candidates && data.candidates.length > 0) {
      return pet.sound + " " + (data.candidates[0].content.parts[0].text || "Hmm... I don't know what to say! 🐾");
    } else {
      return pet.sound + " Oops! No response from the AI.";
    }
  } catch (error) {
    console.error("Error fetching AI response:", error);
    return pet.sound + " Sorry, I'm having trouble responding right now! 🐾";
  }
}

// Attach event listener to the create pet button.
document.getElementById("create-pet-button").addEventListener("click", createPet);

// Attach event listener to the chat send button.
document.getElementById("send-button").addEventListener("click", function () {
  sendMessage();
});

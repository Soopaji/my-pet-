let pet = null;
const API_KEY = "AIzaSyCWjlAAysIa65rncjBnn_J0UQL8qGMDACM"; // Make sure this is correct

function createPet() {
    const name = document.getElementById("pet-name").value;
    const fileInput = document.getElementById("pet-image-upload");

    if (!name) {
        alert("Enter a name for your pet!");
        return;
    }

    pet = { name, happiness: 100, energy: 100 };
    document.getElementById("pet-info").innerText = `${name} is here!`;

    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("pet-image").src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        document.getElementById("pet-image").src = "assets/placeholder.png";
    }
}

async function generateAIResponse(prompt) {
    if (!pet) return "Please create a pet first!";
    
    const fullPrompt = `You are a pet named ${pet.name}. Respond in a cute and fun way! Message: ${prompt}`;

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contents: [{ parts: [{ text: fullPrompt }] }] })
        });

        if (!response.ok) throw new Error("API Error: " + response.statusText);

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I don't know what to say!";
    } catch (error) {
        console.error("Error:", error);
        return "Oops! The AI is not responding.";
    }
}

async function sendMessage(action = null) {
    const userInput = action || document.getElementById("user-input").value;
    if (!pet) {
        alert("Please create a pet first!");
        return;
    }

    let petResponse;
    if (userInput.toLowerCase() === "feed") {
        pet.happiness += 10;
        pet.energy += 5;
        petResponse = `${pet.name} happily eats! 🍖`;
    } else if (userInput.toLowerCase() === "play") {
        pet.happiness += 5;
        pet.energy -= 5;
        petResponse = `${pet.name} enjoys playing! 🎾`;
    } else if (userInput.toLowerCase() === "check mood") {
        petResponse = pet.happiness > 80 ? `${pet.name} is very happy! 😊` :
                      pet.happiness > 50 ? `${pet.name} is content. 🙂` :
                      `${pet.name} seems a bit sad. 😢`;
    } else {
        petResponse = await generateAIResponse(userInput);
    }

    document.getElementById("chat-output").innerHTML += `<p><b>You:</b> ${userInput}</p>`;
    document.getElementById("chat-output").innerHTML += `<p><b>${pet.name}:</b> ${petResponse}</p>`;

    showSpeechBubble(petResponse);
}

function showSpeechBubble(text) {
    const speechBubble = document.getElementById("speech-bubble");
    speechBubble.innerText = text;
    speechBubble.style.display = "block";
    setTimeout(() => {
        speechBubble.style.display = "none";
    }, 3000);
}

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

    // Check if a custom pet image is uploaded
    if (fileInput.files.length > 0) {
        const reader = new FileReader();
        reader.onload = function (e) {
            petImage.src = e.target.result;
        };
        reader.readAsDataURL(fileInput.files[0]);
    } else {
        petImage.src = petTypes[type]?.defaultImage || "assets/default-pet.png";
    }

    document.getElementById("pet-info").innerText = `${pet.name} the ${pet.type} is ready!`;
    document.getElementById("speech-bubble").style.display = "none";
}

// Ensure uploaded image is shown before pet is created
document.getElementById("pet-image-upload").addEventListener("change", function(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            document.getElementById("pet-image").src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
});

// Handle chat input & send AI request
document.getElementById('send-button').addEventListener('click', async function () {
    if (!pet) {
        alert("Please create a pet first!");
        return;
    }

    const userMessage = document.getElementById('user-input').value.trim();
    if (!userMessage) return;

    document.getElementById('chat-output').innerHTML += `<p><strong>You:</strong> ${userMessage}</p>`;

    const petResponse = await getAIResponse(userMessage);
    document.getElementById('chat-output').innerHTML += `<p><strong>${pet.name}:</strong> ${petResponse}</p>`;

    document.getElementById('speech-bubble').innerText = petResponse;
    document.getElementById('speech-bubble').style.display = "block";

    // Clear input field
    document.getElementById('user-input').value = '';
});

// Fetch AI response using Google Gemini API
async function getAIResponse(userMessage) {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `You are a ${pet.type} named ${pet.name}. Reply in a fun way to: "${userMessage}"` }] }]
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

// Attach event listener to create pet button
document.getElementById("create-pet-button").addEventListener("click", createPet);

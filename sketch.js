// This is where the data is stored
let dataURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR5eE7SMg4Na3jnmM69lRacKetRSzB50rfYA5wshVIEWHBVAYzjkXpzSdCuNKbfB2lqda1HINcaPpGZ/pub?gid=0&single=true&output=csv";

// Empty variables to hold the data
let rawData, data, currentNode, textbox, canvas;

// Track the current location in the network
let state = "preload";

// Shader variables
let poetry_progression = 0.0;
let target = 0.0;
let increment = 0.1;

// Fade transition variables
let fadeDuration = 500; // Duration in milliseconds
let fadeStartTime = 0;
let isTransitioning = true; // Prevents state change during fade
let opacity = 0; // Controls text opacity
let fadeState = "in"; // Tracks if text is fading in or out

// Hide the splash screen when the "Okay" button is clicked
document.getElementById("splashButton").addEventListener("click", function () {
    document.getElementById("splashScreen").style.display = "none";
    isTransitioning = false;
    changeState(currentNode.next);
  });

// Before doing anything else
function preload() {
  // Load the data
  rawData = loadTable(dataURL, "csv", "header");

  // Check for Android devices
  let Android = /(android)/i.test(navigator.userAgent);

  // Load the shader
  shader_file = false ? loadShader("rect.vert", "drawAndroid.frag") : loadShader("rect.vert", "draw.frag");

  //console.log("Loading shader: " + (Android ? "drawAndroid.frag" : "draw.frag"));
}

function setup() {
  // Assign the canvas to a variable
  canvas = createCanvas(windowWidth, windowHeight, WEBGL);
  canvas.id("bg"); // Assign an id to the canvas
  alpha: false,
  pixelDensity(1.5);
  frameRate(30);
  shader(shader_file);

  // Process the data into a nicer format
  data = rawData.getObject("id");

  // Store the textbox in a variable
  textbox = select("#textDiv");
  updateText(); // Initialize the first text with fade-in effect

  // Add an event listener for the background canvas to jump to the next node when clicked or touched
  document.getElementById("bg").addEventListener("click", function () {
    if (currentNode && currentNode.next) {
      changeState(currentNode.next);
    }
  });

  // Add event listener for textDiv to handle escape functionality
  document.getElementById("textDiv").addEventListener("click", function () {
    if (currentNode && currentNode.escape) {
      changeState(currentNode.escape);
    } else if (currentNode) {
      changeState(currentNode.next);
    }
  });
}

function draw() {
  // Simon bits
  shader_file.setUniform("u_res", [windowWidth, windowHeight]);
  shader_file.setUniform("u_time", millis() / 1000.0);
  shader_file.setUniform("u_poetry_progress", poetry_progression);
  resizeCanvas(windowWidth, windowHeight);
  rect(0, 0, windowWidth, windowHeight);

  // Lerp progression values to target values over the same duration as the fade
  let lerpAmt = 0.02;
  poetry_progression = lerp(poetry_progression, target, lerpAmt);

  // Handle fade effect
  let elapsed = millis() - fadeStartTime;
  if (isTransitioning) {
    if (fadeState === "in") {
      opacity = constrain(elapsed / fadeDuration, 0, 1);
      if (opacity >= 1) isTransitioning = false;
    } else if (fadeState === "out") {
      opacity = 1 - constrain(elapsed / fadeDuration, 0, 1);
      if (opacity <= 0) {
        isTransitioning = false;
        updateText(); // Load new text once fully faded out
      }
    }
  }
  textbox.style("opacity", opacity);

  // Add or remove the escapable class based on the current node
  if (currentNode.escape) {
    textbox.addClass("escapable");
  } else {
    textbox.removeClass("escapable");
  }
}

// Updates the text and triggers a fade-in effect
function updateText() {
  // Grab current node details
  currentNode = data[state];

  // Start fade-in transition
  fadeState = "in";
  isTransitioning = true;
  fadeStartTime = millis();
  opacity = 0;

  // Wrap each word in a span for animation
  const words = currentNode.text.split(" ");
  let wrappedWords = words
    .map((word, index) => `<span class="words" style="animation-delay: ${index * 0.2}s;">${word}</span>`)
    .join(" ");
  wrappedWords="<p>" + wrappedWords + "</p>"; // Wrap the entire text in a paragraph tag  
  textbox.html(wrappedWords);
}

// Handles state change with fade-out and fade-in transition
function changeState(nextState) {
  if (!isTransitioning) {
    fadeState = "out"; // Start fade-out transition
    isTransitioning = true;
    fadeStartTime = millis();
    state = nextState;
    target += increment;
  }
}

// Function to run when key is pressed
function keyPressed() {
  if (key === " ") changeState(currentNode.next);
  if (key === "Escape" && currentNode.escape) changeState(currentNode.escape);
}

// Calculates distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

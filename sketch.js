// This is where the data is stored
let dataURL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vR5eE7SMg4Na3jnmM69lRacKetRSzB50rfYA5wshVIEWHBVAYzjkXpzSdCuNKbfB2lqda1HINcaPpGZ/pub?gid=0&single=true&output=csv";

// Empty variables to hold the data
let rawData, data, currentNode, textbox;

// Track the current location in the network
let state = "preload";

// Shader variables
let poetry_progression = 0.0;
let target = 0.0;
let increment = 0.1;

// Fade transition variables
let fadeDuration = 500; // Duration in milliseconds
let fadeStartTime = 0;
let isTransitioning = false; // Prevents state change during fade
let opacity = 0; // Controls text opacity
let fadeState = "in"; // Tracks if text is fading in or out

// Hide the splash screen when the "Okay" button is clicked
document.getElementById("splashButton").addEventListener("click", function () {
    document.getElementById("splashScreen").style.display = "none";
  });

// Before doing anything else
function preload() {
  // Load the data
  rawData = loadTable(dataURL, "csv", "header");
  // Load the shader
  shader_file = loadShader("rect.vert", "draw.frag");
}

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);
  shader(shader_file);

  // Process the data into a nicer format
  data = rawData.getObject("id");

  // Store the textbox in a variable
  textbox = select("#textDiv");
  updateText(); // Initialize the first text with fade-in effect
}

function draw() {
  // Simon bits
  shader_file.setUniform("u_res", [width, height]);
  shader_file.setUniform("u_time", millis() / 1000.0);
  shader_file.setUniform("u_poetry_progress", poetry_progression);
  rect(0, 0, width, height);

  // Lerp progression values to target values over the same duration as the fade
  let lerpAmt = 1.0 - pow(1.0 - 1.0 / fadeDuration / 2, deltaTime);
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

  // Add a white border if the node can be escaped
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
  textbox.html(currentNode.text);
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

// Functions to run when mouse is clicked or screen is touched
function mouseClicked() {
  if (
    currentNode.escape &&
    distance(mouseX, mouseY, windowWidth*0.5, windowHeight*0.75) <
      windowWidth / 20
  ) {
    changeState(currentNode.escape);
  } else {
    changeState(currentNode.next);
  }
}

function touchEnded() {
  if (currentNode.escape && mouseY > windowHeight*0.8) {
    changeState(currentNode.escape);
  } else {
    changeState(currentNode.next);
  }
}

// Calculates distance between two points
function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}
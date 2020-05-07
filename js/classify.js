let featureExtractor;
let classifier;
let video;
let loss;
let aImageCount = 0;
let bImageCount = 0;

function setup() {
  noCanvas();
  // Create a video element
  video = document.getElementById('video');
  navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
      video.srcObject = stream;
      video.play();
    })

  // Extract the already learned features from MobileNet
  featureExtractor = ml5.featureExtractor('MobileNet', function() {
    console.log('Model loaded!');
  });

  // Create a new classifier using those features and give the video we want to use
  classifier = featureExtractor.classification(video, { numLabels: 2 });
  // Set up the UI buttons
  setupButtons();
}

// Classify the current frame.
function classify() {
  classifier.classify(gotResults);
}

function enableTrainButton() {
  let trainButton = document.getElementById('train');
  if (aImageCount > 0 && bImageCount > 0) {
    trainButton.removeAttribute('disabled');
  }
}

// A util function to create UI buttons
function setupButtons() {
  let buttonA = document.getElementById('classifyA');
  let inputA = document.getElementById('inputA');
  buttonA.onclick = function(e) {
    inputA.setAttribute('disabled', 'disabled');
    aImageCount++;
    classifier.addImage(inputA.value !== "" ? inputA.value : 'A');
    buttonA.innerHTML = `Classify A (${aImageCount})`;
    enableTrainButton();
  }

  let buttonB = document.getElementById('classifyB');
  let inputB = document.getElementById('inputB');
  buttonB.onclick = function(e) {
    inputB.setAttribute('disabled', 'disabled');
    bImageCount++;
    classifier.addImage(inputB.value !== "" ? inputB.value : 'B');
    buttonB.innerHTML = `Classify B (${bImageCount})`;
    enableTrainButton();
  }

  // Predict Button
  let predictButton = document.getElementById('predict');
  predictButton.onclick = function(e) {
    classify();
  }

  let saveButton = document.getElementById('save');
  saveButton.onclick = function(e) {
    classifier.save();
  }

  // Train button
  let trainButton = document.getElementById('train');
  let lossElement = document.getElementById('loss');
  trainButton.onclick = function(e) {
    classifier.train(function(lossValue) {
      if (lossValue) {
        loss = lossValue;
        lossElement.innerHTML = `Loss: ${lossValue}`;
      } else {
        trainButton.innerHTML = `Training completed. Final loss: ${loss}`;
        predictButton.removeAttribute('disabled');
        saveButton.removeAttribute('disabled');
      }
    });
  }


  let load = document.getElementById('loadModel');
  load.onchange = function(e) {
    classifier.load(this.files);
    predictButton.removeAttribute('disabled');
  }
}

// Show the results
function gotResults(err, results) {
  if (err) {
    console.error(err);
  }
  if (results && results[0]) {
    let resultsElement = document.getElementById('result');
    let confidenceElement = document.getElementById('confidence');
    let confidence = results[0].confidence.toFixed(2) * 100;
    if (confidence > 80) {
      resultsElement.innerHTML = results[0].label;
    } else {
      resultsElement.innerHTML = '????????';
    }

    confidenceElement.innerHTML = `${confidence}%`;
    classify();
  }
}

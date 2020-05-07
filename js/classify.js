let featureExtractor;
let classifier;
let video;
let loss;
let labelCount = 2;
let imageCounts = {};

function setup() {
  noCanvas();

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

  setupButtons();
}

// Classify the current frame.
function classify() {
  classifier.classify(gotResults);
}

function enableTrainButton() {
  let trainButton = document.getElementById('train');
  let allLabelsTrained = true;
  for(i = 0; i < labelCount; i++) {
    if (!imageCounts[i] || imageCounts[i] < 1) {
      allLabelsTrained = false;
    }
  }

  if (allLabelsTrained) {
    trainButton.removeAttribute('disabled');
  }
}

// A util function to create UI buttons
function setupButtons() {
  addLabelButtonBehavaior(0);
  addLabelButtonBehavaior(1);

  // Add Label Button
  let addLabelButton = document.getElementById('addLabel');
  addLabelButton.onclick = function(e) {

    let fields = document.getElementsByClassName('label-field-group');
    let lastField = fields[fields.length-1];

    let newField = `
      <div class="label-field-group">
        <button class="btn btn-default" id="classify${labelCount}">Classify ${mapIndexLetter(labelCount)} <span class="count">(0)</span></button>
        <input class="form-control" type="text" id="input${labelCount}"  placeholder="Label ${mapIndexLetter(labelCount)}" />
      </div>
    `;

    lastField.parentNode.insertBefore(document.createRange().createContextualFragment(newField), lastField.nextSibling);
    addLabelButtonBehavaior(labelCount);
    labelCount++;
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

function setClassifier(callback) {
  if (!classifier) {
    classifier = featureExtractor.classification(video, { numLabels: labelCount }, callback);
    document.getElementById('addLabel').setAttribute('disabled', 'disabled');
  } else {
    callback();
  }
}

function addLabelButtonBehavaior(index) {
  let button = document.getElementById(`classify${index}`);
  let input = document.getElementById(`input${index}`);
  button.onclick = function(e) {
    setClassifier(function() {
      let imageCount = imageCounts[index] || 0;
      imageCount++
      imageCounts[index] = imageCount;

      input.setAttribute('disabled', 'disabled');
      classifier.addImage(input.value !== "" ? input.value : mapIndexLetter(index));
      button.getElementsByClassName('count')[0].innerHTML = `(${imageCount})`
      enableTrainButton();
    });
  }
}

function mapIndexLetter(index) {
  return indexLetterMap[index] || '???';
}

const indexLetterMap = {
  0: 'A',
  1: 'B',
  2: 'C',
  3: 'D',
  4: 'E',
  5: 'F',
  6: 'G',
  7: 'H',
  8: 'I',
  9: 'J',
  11: 'K',
  12: 'L',
  13: 'M',
  14: 'N',
  15: 'O',
  16: 'P',
  17: 'Q',
  18: 'R',
  19: 'S',
  20: 'T',
  21: 'U',
  22: 'V',
  23: 'W',
  24: 'X',
  25: 'Y',
  26: 'Z',
};

// Show the results
function gotResults(err, results) {
  if (err) {
    console.error(err);
  }
  if (results && results[0]) {
    let resultsElement = document.getElementById('result');
    let confidenceElement = document.getElementById('confidence');
    let confidence = results[0].confidence.toFixed(2) * 100;
    if (confidence > 70) {
      resultsElement.innerHTML = results[0].label;
    } else {
      resultsElement.innerHTML = '????????';
    }

    confidenceElement.innerHTML = `${confidence}%`;
    classify();
  }
}

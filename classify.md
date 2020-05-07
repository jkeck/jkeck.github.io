---
layout: page
title: Image Classification using Feature Extractor with MobileNet
permalink: /classify/
---
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.9.0/p5.min.js"></script>
<script src="https://unpkg.com/ml5@0.5.0/dist/ml5.min.js" type="text/javascript"></script>
<style>
  body {
    text-align: center;
  }

  input.form-control {
    display: inline;
    width: auto;
  }

  input[type="file"] {
    display: inline-block;
  }

  video {
    transform: scaleX(-1);
  }
</style>

<p>
  <div>
    <button class="btn btn-default" id="classifyA">Classify A (0)</button>
    <input class="form-control" type="text" id="inputA" placeholder="Label A" />
  </div>
  <div>
    <button class="btn btn-default" id="classifyB">Classify B (0)</button>
    <input class="form-control" type="text" id="inputB"  placeholder="Label B"  />
  </div>
  <button class="btn btn-default" id="train">Train <span id="loss"></span></button>
  <button class="btn btn-primary" id="predict" disabled>Start guessing</button>
</p>

<video id="video" width="640" height="480"  autoplay></video>

<p>
  Label: <span id="result">...</span><br />
  Confidence: <span id="confidence">...</span>
</p>
<button class="btn btn-default" id="save">Save model</button><br/>
<div class="form-group">
  <label for="loadModel">Load saved model</label>
  <input type="file" id="loadModel" multiple />
  <p class="help-block">Upload both the <code>model.json</code> and <code>model.weights.json</code> files that were downloaded using the "Save model" button above</p>
</div>

<script src="/js/classify.js"></script>

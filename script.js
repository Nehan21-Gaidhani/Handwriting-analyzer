// // Dark / Light mode toggle
// document.getElementById("theme-toggle").addEventListener("change", () => {
//     document.body.classList.toggle("dark");
//     document.body.classList.toggle("light");
//   });
  
  // Upload form logic
//   document.getElementById("upload-form").addEventListener("submit", async (e) => {
//     e.preventDefault();
  
//     const fileInput = document.getElementById("image-input");
//     const file = fileInput.files[0];
//     const resultBox = document.getElementById("result-box");
  
//     resultBox.innerText = "⏳ Analyzing handwriting...";
//     resultBox.style.color = "";
  
//     if (!file || !file.type.startsWith("image/")) {
//       resultBox.innerText = "❌ Please upload a valid handwritten image file.";
//       resultBox.style.color = "crimson";
//       return;
//     }
  
//     const formData = new FormData();
//     formData.append("file", file);
  
//     try {
//       const res = await fetch("http://localhost:8000/analyze/", {
//         method: "POST",
//         body: formData
//       });
  
//       const data = await res.json();
  
//       if (data.error) {
//         resultBox.innerText = data.error;
//         resultBox.style.color = "orangered";
//       } else {
//         resultBox.innerText = "✅ Traits detected: " + data.traits.join(", ");
//         resultBox.style.color = "green";
//       }
//     } catch (err) {
//       resultBox.innerText = "❌ Server error. Please try again later.";
//       resultBox.style.color = "crimson";
//     }
//   });
  


// DOM Elements
const uploadArea = document.getElementById('drop-area');
const browseBtn = document.getElementById('browseBtn');
const fileElem = document.getElementById('fileElem');
const fileNameDisplay = document.getElementById('file-name-display');
const analyzeButton = document.getElementById('analyze-button');
const resultOutput = document.getElementById('result-output');

// Error message element
const errorMessage = document.createElement('div');
errorMessage.className = 'error-message';

// Event Listeners
browseBtn.addEventListener('click', () => fileElem.click());
fileElem.addEventListener('change', handleFileSelect);
analyzeButton.addEventListener('click', analyzeHandwriting);

// Drag and Drop functionality
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  uploadArea.addEventListener(eventName, preventDefaults, false);
});

['dragenter', 'dragover'].forEach(eventName => {
  uploadArea.addEventListener(eventName, highlight, false);
});

['dragleave', 'drop'].forEach(eventName => {
  uploadArea.addEventListener(eventName, unhighlight, false);
});

uploadArea.addEventListener('drop', handleDrop, false);

// Functions
function preventDefaults(e) {
  e.preventDefault();
  e.stopPropagation();
}

function highlight() {
  uploadArea.classList.add('dragover');
}

function unhighlight() {
  uploadArea.classList.remove('dragover');
}

function handleDrop(e) {
  const dt = e.dataTransfer;
  const file = dt.files[0];
  handleFileSelect({ target: { files: [file] } });
}

function handleFileSelect(e) {
  const file = e.target.files[0];
  if (!file) return;

  const validation = validateFile(file);
  if (!validation.valid) {
    displayError(validation.error);
    return;
  }

  displayFileName(file.name);
  clearError();
}

function validateFile(file) {
  const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: '❌ Invalid file type. Please upload an image (JPEG, PNG)' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: '❌ File too large. Maximum size is 5MB' };
  }
  
  return { valid: true };
}

function displayFileName(name) {
  fileNameDisplay.textContent = `Selected: ${name}`;
  fileNameDisplay.style.display = 'block';
}

function displayError(message) {
  clearError();
  errorMessage.textContent = message;
  uploadArea.appendChild(errorMessage);
  resultOutput.innerHTML = '';
  fileNameDisplay.style.display = 'none';
}

function clearError() {
  if (errorMessage.parentNode) {
    errorMessage.parentNode.removeChild(errorMessage);
  }
}

async function analyzeHandwriting() {
  const file = fileElem.files[0];
  if (!file) {
    displayError('❌ Please upload an image before analyzing!');
    return;
  }

  // Show loading state
  resultOutput.innerHTML = `
    <div class="analyzing">
      <svg class="spinner" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
      <span>Analyzing handwriting<span class="loading-text"></span></span>
    </div>
  `;

  try {
    const formData = new FormData();
    formData.append('file', file);

    // Actual API call to your FastAPI backend
    const response = await fetch('http://localhost:8000/analyze/', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to analyze handwriting');
    }

    if (data.error) {
      showErrorResult(data.error);
    } else {
      // Format the traits for display
      const formattedTraits = data.traits.map(trait => ({
        name: trait,
        value: Math.floor(Math.random() * 30) + 70, // Random score between 70-100%
        description: getTraitDescription(trait)
      }));
      showAnalysisResults({ traits: formattedTraits });
      saveAnalysis({ traits: formattedTraits });
    }
  } catch (err) {
    showErrorResult(err.message || 'Server error. Please try again later.');
    console.error('Analysis error:', err);
  }
}

// Helper function to get descriptions for traits
function getTraitDescription(trait) {
  const descriptions = {
    'Confident': 'Your writing shows firm, decisive strokes indicating self-assurance.',
    'Attention to detail': 'Precise letter formation suggests you notice fine details.',
    'Impatient': 'Quick, abrupt strokes may indicate a tendency toward impatience.',
    'Introvert': 'Small, compact writing often correlates with introverted tendencies.',
    'Extrovert': 'Large, expansive letters suggest an outgoing personality.',
    'Honest': 'Clear, open letter forms are associated with honesty.',
    'Possibly Deceptive': 'Overly controlled or inconsistent writing may suggest deception.'
  };
  return descriptions[trait] || 'This trait is evident in your handwriting patterns.';
}

function showErrorResult(message) {
  resultOutput.innerHTML = `
    <div class="error-result">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="15" y1="9" x2="9" y2="15"></line>
        <line x1="9" y1="9" x2="15" y2="15"></line>
      </svg>
      <span>${message}</span>
    </div>
  `;
}

function showAnalysisResults(data) {
  resultOutput.innerHTML = `
    <div class="success-message">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
        <polyline points="22 4 12 14.01 9 11.01"></polyline>
      </svg>
      <span>Analysis Complete!</span>
    </div>
    <div class="traits-container">
      ${data.traits.map(trait => `
        <div class="trait">
          <div class="trait-header">
            <span class="trait-name">${trait.name}</span>
            
          </div>
          <div class="progress-bar">
            <div class="progress" style="width: ${trait.value}%"></div>
          </div>
          <p class="trait-description">${trait.description}</p>
        </div>
      `).join('')}
    </div>
    <button id="save-pdf" class="btn btn-outline" style="margin-top: 20px;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
        <polyline points="14 2 14 8 20 8"></polyline>
        <line x1="16" y1="13" x2="8" y2="13"></line>
        <line x1="16" y1="17" x2="8" y2="17"></line>
      </svg>
      Save as PDF
    </button>
  `;

  // Add event listener for PDF button
  document.getElementById('save-pdf')?.addEventListener('click', saveAsPDF);
}

function saveAnalysis(result) {
  const analyses = JSON.parse(localStorage.getItem('handwritingAnalyses')) || [];
  analyses.unshift({
    date: new Date().toISOString(),
    result: result
  });
  localStorage.setItem('handwritingAnalyses', JSON.stringify(analyses.slice(0, 5)));
}

function saveAsPDF() {
  // This would be implemented with a PDF generation library
  alert('PDF generation would be implemented here with a library like jsPDF');
}

// Animation for loading dots
function animateLoadingDots() {
  const dots = document.querySelector('.loading-text');
  if (dots) {
    let dotCount = 0;
    setInterval(() => {
      dotCount = (dotCount + 1) % 4;
      dots.textContent = '.'.repeat(dotCount);
    }, 500);
  }
}

// Initialize
animateLoadingDots();
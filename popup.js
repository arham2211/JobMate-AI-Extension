document.addEventListener("DOMContentLoaded", function () {
  const notLinkedinSection = document.getElementById("not-linkedin");
  const analyzeButton = document.getElementById("analyze-button");
  const resetButton = document.getElementById("reset-button");
  const actionSection = document.getElementById("action-section");
  const statusSection = document.getElementById("status-section");
  const jobStatus = document.getElementById("job-status");
  const apiKeyInput = document.getElementById("api-key");

  // Show warning if not on LinkedIn job page
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const url = tabs[0].url;
    if (!url.includes("linkedin.com/jobs")) {
      notLinkedinSection.classList.remove("hidden");
      actionSection.classList.add("hidden");
    }
  });

  // Check if a job has already been analyzed
  chrome.storage.local.get(["jobDataExtracted"], function (result) {
    if (result.jobDataExtracted) {
      actionSection.classList.add("hidden");
      statusSection.classList.remove("hidden");
    }
  });

  // Handle analyze button click
  analyzeButton.addEventListener("click", function () {

    const apiKey = apiKeyInput.value.trim();
    if (!apiKey.startsWith("gsk")) {
      alert("Please enter a valid OpenAI API key");
      return;
    }

    // Show loading state
    analyzeButton.textContent = "Analyzing...";
    analyzeButton.disabled = true;

    // Extract job data from the page
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        {
          action: "trigger",
          apiKey: apiKey  
        },
        function (response) {
          if (response && response.success) {
            console.log("✅ HTML content POSTed successfully:", response.data);

            // Open the full web page with results
            chrome.tabs.create({ url: "results.html" });

            // Update popup UI
            actionSection.classList.add("hidden");
            statusSection.classList.remove("hidden");
          } else {
            console.error("❌ Failed to POST HTML content:", response?.error);
            jobStatus.querySelector(".status-icon").textContent = "✗";
            jobStatus.querySelector(".status-icon").classList.remove("success");
            jobStatus.querySelector(".status-icon").classList.add("error");
            jobStatus.querySelector(".status-message").textContent =
              "Failed to extract job data";
            statusSection.classList.remove("hidden");
          }
        }
      );
    });
  });

  // Handle reset button click
  resetButton.addEventListener("click", function () {
    chrome.storage.local.remove([
      "jobAnalysis",
      "jobDataExtracted",
      "resumeUploaded",
    ]);

    // Reset UI
    actionSection.classList.remove("hidden");
    statusSection.classList.add("hidden");
    analyzeButton.textContent = "Analyze This Job";
    analyzeButton.disabled = false;
  });
});

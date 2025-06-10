chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "trigger") {
    const htmlContent = document.documentElement.outerHTML;
    const apiKey = request.apiKey;

    if (!apiKey) {
      console.error("❌ No API key provided");
      sendResponse({ success: false, error: "API key is missing" });
      return;
    }


    extractJobPostEndpoint({ html: htmlContent }, apiKey)
      .then(data => {
        console.log("✅ POST to /extract-job/ successful:", data);
        sendResponse({ success: true, data });
      })
      .catch(err => {
        console.error("❌ Failed POST to /extract-job/:", err);
        sendResponse({ success: false, error: err.message });
      });

    return true;
  }
});

async function extractJobPostEndpoint(payload, apiKey) {
  const response = await fetch('https://jobmate-ai.vercel.app/extract-job/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    throw new Error("Failed to POST to /extract-job/");
  }

  return response.json();
}

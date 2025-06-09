document.addEventListener("DOMContentLoaded", function () {
    const dropArea = document.getElementById("drop-area");
    const fileInput = document.getElementById("resume-upload");
    const resumeStatus = document.getElementById("resume-status");
    const jobAnalysisSection = document.getElementById("job-analysis");
    const jobResultsContent = document.getElementById("job-results-content");
    
    // Check if job analysis data exists
    chrome.storage.local.get(["jobAnalysis"], function (result) {
      if (result.jobAnalysis) {
        // If resume was already uploaded, show results
        chrome.storage.local.get(["resumeUploaded"], function (resumeResult) {
          if (resumeResult.resumeUploaded) {
            resumeStatus.classList.remove("hidden");
            resumeStatus.querySelector(".status-message").textContent = "Resume uploaded successfully";
            
            // Show job analysis results
            jobAnalysisSection.classList.remove("hidden");
            jobResultsContent.innerHTML = createJobAnalysisHTML(result.jobAnalysis);
          }
        });
      } else {
        // If no job analysis data, show message
        jobAnalysisSection.classList.remove("hidden");
        jobResultsContent.innerHTML = "<p>No job data found. Please return to LinkedIn and analyze a job first.</p>";
      }
    });
  
    // Handle upload via clicking
    dropArea.addEventListener("click", () => {
      fileInput.click();
    });
  
    fileInput.addEventListener("change", handleFiles);
  
    // Drag & drop events
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ["dragenter", "dragover"].forEach((eventName) => {
      dropArea.addEventListener(eventName, () => dropArea.classList.add("highlight"));
    });
    
    ["dragleave", "drop"].forEach((eventName) => {
      dropArea.addEventListener(eventName, () => dropArea.classList.remove("highlight"));
    });
    
    dropArea.addEventListener("drop", handleDrop, false);
  
    function preventDefaults(e) {
      e.preventDefault();
      e.stopPropagation();
    }
  
    function handleDrop(e) {
      const files = e.dataTransfer.files;
      handleFiles({ target: { files: files } });
    }
  
    function handleFiles(e) {
      const files = e.target?.files;
      if (files && files.length) {
        uploadResume(files[0]);
      }
    }
  
    function uploadResume(file) {
      resumeStatus.classList.remove("hidden");
      resumeStatus.querySelector(".status-message").textContent = "Uploading resume...";
  
      const formData = new FormData();
      formData.append("file", file);
      console.log("📄 Uploading file:", file.name);
  
      fetch("https://jobmate-ai.vercel.app/upload-resume/", {
        method: "POST",
        body: formData,
      })
        .then((response) => {
          if (!response.ok) {
            throw new Error("Resume upload failed");
          }
          return response.json();
        })
        .then((data) => {
          console.log("✅ Resume upload successful. Response from backend:", data);
          
          // Mark resume as uploaded
          chrome.storage.local.set({ resumeUploaded: true });
  
          resumeStatus.querySelector(".status-message").textContent = "Resume uploaded successfully";
          
          // Get job analysis data and show results
          const analysis = data.similarity;
          chrome.storage.local.set({ jobAnalysis: analysis }, function () {
            jobAnalysisSection.classList.remove("hidden");
            jobResultsContent.innerHTML = createJobAnalysisHTML(analysis);
          });
        })
        .catch((error) => {
          console.error("❌ Resume upload failed:", error);
          resumeStatus.querySelector(".status-icon").textContent = "✗";
          resumeStatus.querySelector(".status-icon").classList.remove("success");
          resumeStatus.querySelector(".status-icon").classList.add("error");
          resumeStatus.querySelector(".status-message").textContent = "Resume upload failed";
        });
    }
  
    function createJobAnalysisHTML(analysis) {
      console.log("Creating job analysis HTML");
      const score = analysis.match_score || 0;
      let scoreClass = "score-low";
    
      if (score >= 70) {
        scoreClass = "score-high";
      } else if (score >= 50) {
        scoreClass = "score-medium";
      }
    
      const matchingSkills = analysis.matching_skills || [];
      const missingSkills = analysis.missing_skills || [];
      const suggestedCourses = analysis.suggested_courses || [];
    
      return `
        <div class="match-score-container">
          <div class="score-circle ${scoreClass}">
            <div class="score-value">${Math.round(score)}%</div>
            <div class="score-label">Match Score</div>
          </div>
        </div>
        <div class="match-details">
          <div class="skills-list">
            <h3>Matching Skills (${matchingSkills.length})</h3>
            <div class="skills-container">
              ${matchingSkills.map(skill =>
                `<span class="skill-tag matching-skill">${skill}</span>`
              ).join("")}
              ${matchingSkills.length === 0 ? "<p>No matching skills found</p>" : ""}
            </div>
          </div>
          <div class="skills-list">
            <h3>Missing Skills (${missingSkills.length})</h3>
            <div class="skills-container">
              ${missingSkills.map(skill =>
                `<span class="skill-tag missing-skill">${skill}</span>`
              ).join("")}
              ${missingSkills.length === 0 ? "<p>No missing skills identified</p>" : ""}
            </div>
          </div>
          ${suggestedCourses.length > 0 ? `
            <div class="skills-list">
              <h3>Suggested Courses</h3>
              ${suggestedCourses.map(course => `
                <a href="${course.url}" target="_blank" class="course-suggestion">
                  <div class="course-title">${course.title}</div>
                  <div class="course-platform">${course.platform}</div>
                </a>
              `).join("")}
            </div>` : ""}
        </div>
      `;
    }
  });
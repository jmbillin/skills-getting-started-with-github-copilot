document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // ── Azure DevOps Work Item Lookup ──────────────────────────────────────────

  const workitemForm = document.getElementById("workitem-form");
  const workitemMessage = document.getElementById("workitem-message");
  const workitemResult = document.getElementById("workitem-result");

  workitemForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const itemId = document.getElementById("workitem-id").value;

    workitemMessage.className = "hidden";
    workitemResult.classList.add("hidden");
    workitemResult.innerHTML = "";

    try {
      const response = await fetch(`/workitems/${encodeURIComponent(itemId)}`);
      const data = await response.json();

      if (!response.ok) {
        workitemMessage.textContent = data.detail || "An error occurred";
        workitemMessage.className = "error";
        return;
      }

      // Build a detail card from the returned fields
      const fields = [
        { label: "ID", value: data.id },
        { label: "Type", value: data.type },
        { label: "Title", value: data.title },
        { label: "State", value: data.state },
        { label: "Priority", value: data.priority },
        { label: "Severity", value: data.severity },
        { label: "Assigned To", value: data.assigned_to },
        { label: "Created By", value: data.created_by },
        { label: "Created Date", value: data.created_date ? new Date(data.created_date).toLocaleString() : null },
        { label: "Changed Date", value: data.changed_date ? new Date(data.changed_date).toLocaleString() : null },
        { label: "Area Path", value: data.area_path },
        { label: "Iteration Path", value: data.iteration_path },
        { label: "Tags", value: data.tags },
        { label: "Description", value: data.description, html: true },
        { label: "Repro Steps", value: data.repro_steps, html: true },
        { label: "Acceptance Criteria", value: data.acceptance_criteria, html: true },
      ];

      let html = `<div class="workitem-card">`;
      fields.forEach(({ label, value, html: isHtml }) => {
        if (value === null || value === undefined || value === "") return;
        const safeValue = isHtml ? DOMPurify.sanitize(String(value)) : String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        html += `<div class="workitem-field">
          <span class="workitem-label">${label}:</span>
          ${isHtml ? `<div class="workitem-value">${safeValue}</div>` : `<span class="workitem-value">${safeValue}</span>`}
        </div>`;
      });
      html += `</div>`;

      workitemResult.innerHTML = html;
      workitemResult.classList.remove("hidden");
    } catch (error) {
      workitemMessage.textContent = "Failed to look up work item. Please try again.";
      workitemMessage.className = "error";
      console.error("Error fetching work item:", error);
    }
  });
});

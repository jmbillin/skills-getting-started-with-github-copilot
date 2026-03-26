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

  // Handle lookup form submission
  const lookupForm = document.getElementById("lookup-form");
  const lookupResult = document.getElementById("lookup-result");
  const lookupMessage = document.getElementById("lookup-message");

  lookupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const activityId = document.getElementById("activity-id").value;
    lookupResult.classList.add("hidden");
    lookupMessage.classList.add("hidden");

    try {
      const response = await fetch(`/activities/lookup?id=${encodeURIComponent(activityId)}`);
      const result = await response.json();

      if (response.ok) {
        document.getElementById("lookup-name").textContent = result.name;
        document.getElementById("lookup-description").textContent = result.description;
        document.getElementById("lookup-version-filed").textContent = result.version_filed;
        lookupResult.classList.remove("hidden");
      } else {
        lookupMessage.textContent = result.detail || "Activity not found";
        lookupMessage.className = "error";
        lookupMessage.classList.remove("hidden");
      }
    } catch (error) {
      lookupMessage.textContent = "Failed to look up activity. Please try again.";
      lookupMessage.className = "error";
      lookupMessage.classList.remove("hidden");
      console.error("Error looking up activity:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

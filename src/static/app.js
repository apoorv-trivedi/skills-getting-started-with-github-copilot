document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  async function removeParticipant(activityName, email) {
    const response = await fetch(
      `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(email)}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.detail || "Failed to remove participant");
    }

    return result;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message and reset dropdown
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

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

        const participantsSection = document.createElement("div");
        participantsSection.className = "participants-section";
        participantsSection.innerHTML = `<strong>Participants:</strong>`;

        if (details.participants.length) {
          const participantList = document.createElement("ul");
          participantList.className = "participants-list";

          details.participants.forEach((participant) => {
            const listItem = document.createElement("li");
            listItem.className = "participant-item";

            const nameSpan = document.createElement("span");
            nameSpan.className = "participant-name";
            nameSpan.textContent = participant;

            const removeButton = document.createElement("button");
            removeButton.type = "button";
            removeButton.className = "participant-remove";
            removeButton.title = `Unregister ${participant}`;
            removeButton.textContent = "×";

            removeButton.addEventListener("click", async () => {
              removeButton.disabled = true;
              try {
                await removeParticipant(name, participant);
                messageDiv.textContent = `Removed ${participant} from ${name}`;
                messageDiv.className = "success";
                messageDiv.classList.remove("hidden");
                fetchActivities();
              } catch (error) {
                messageDiv.textContent = error.message;
                messageDiv.className = "error";
                messageDiv.classList.remove("hidden");
                console.error("Error removing participant:", error);
              } finally {
                removeButton.disabled = false;
              }

              setTimeout(() => {
                messageDiv.classList.add("hidden");
              }, 5000);
            });

            listItem.appendChild(nameSpan);
            listItem.appendChild(removeButton);
            participantList.appendChild(listItem);
          });

          participantsSection.appendChild(participantList);
        } else {
          const noParticipants = document.createElement("p");
          noParticipants.className = "no-participants";
          noParticipants.textContent = "No participants yet.";
          participantsSection.appendChild(noParticipants);
        }

        activityCard.appendChild(participantsSection);
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
});

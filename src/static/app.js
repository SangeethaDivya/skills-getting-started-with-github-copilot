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

      // Clear loading message and dropdown
      activitiesList.innerHTML = "";
      // Reset dropdown but keep the placeholder
      activitySelect.innerHTML = `<option value="">-- Select an activity --</option>`;

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        // Build participants list DOM so we can attach delete handlers
        const title = document.createElement('h4');
        title.textContent = name;

        const desc = document.createElement('p');
        desc.textContent = details.description;

        const scheduleP = document.createElement('p');
        scheduleP.innerHTML = `<strong>Schedule:</strong> ${details.schedule}`;

        const availP = document.createElement('p');
        availP.innerHTML = `<strong>Availability:</strong> ${spotsLeft} spots left`;

        const participantsDiv = document.createElement('div');
        participantsDiv.className = 'participants';

        const participantsHeader = document.createElement('h5');
        participantsHeader.textContent = 'Participants';

        participantsDiv.appendChild(participantsHeader);

        if (details.participants && details.participants.length) {
          const ul = document.createElement('ul');
          ul.className = 'participants-list';

          details.participants.forEach((p) => {
            const li = document.createElement('li');
            li.className = 'participant-item';

            const span = document.createElement('span');
            span.textContent = p;

            const delBtn = document.createElement('button');
            delBtn.className = 'delete-participant';
            delBtn.setAttribute('aria-label', `Remove ${p}`);
            delBtn.textContent = '✕';

            delBtn.addEventListener('click', async () => {
              if (!confirm(`Remove ${p} from ${name}?`)) return;
              try {
                const res = await fetch(
                  `/activities/${encodeURIComponent(name)}/participants?email=${encodeURIComponent(p)}`,
                  { method: 'DELETE' }
                );

                const body = await res.json();
                if (res.ok) {
                  messageDiv.textContent = body.message;
                  messageDiv.className = 'message success';
                  messageDiv.classList.remove('hidden');
                  // Refresh activities list
                  fetchActivities();
                } else {
                  messageDiv.textContent = body.detail || 'Failed to remove participant';
                  messageDiv.className = 'message error';
                  messageDiv.classList.remove('hidden');
                }
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              } catch (err) {
                console.error('Error removing participant:', err);
                messageDiv.textContent = 'Failed to remove participant';
                messageDiv.className = 'message error';
                messageDiv.classList.remove('hidden');
                setTimeout(() => messageDiv.classList.add('hidden'), 4000);
              }
            });

            li.appendChild(span);
            li.appendChild(delBtn);
            ul.appendChild(li);
          });

          participantsDiv.appendChild(ul);
        } else {
          const none = document.createElement('p');
          none.className = 'no-participants';
          none.textContent = 'No participants yet';
          participantsDiv.appendChild(none);
        }

        // Assemble card
        activityCard.appendChild(title);
        activityCard.appendChild(desc);
        activityCard.appendChild(scheduleP);
        activityCard.appendChild(availP);
        activityCard.appendChild(participantsDiv);

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
        messageDiv.className = "message success";
        signupForm.reset();
        // Refresh activities so participants list updates
        await fetchActivities();
        // ensure dropdown resets visually
        activitySelect.value = "";
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "message error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "message error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});

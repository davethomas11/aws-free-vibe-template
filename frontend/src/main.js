const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:3001").replace(/\/$/, "");

const apiUrlEl = document.getElementById("api-url");
const apiStatusEl = document.getElementById("api-status");
const itemForm = document.getElementById("item-form");
const itemInput = document.getElementById("item-input");
const itemsList = document.getElementById("items-list");

apiUrlEl.textContent = API_URL;

async function checkHealth() {
  try {
    const res = await fetch(`${API_URL}/health`);
    const data = await res.json();
    apiStatusEl.textContent = `Online (${data.storageMode})`;
    apiStatusEl.className = "status-pill online";
  } catch (err) {
    apiStatusEl.textContent = "Offline (run `npm run dev` or set VITE_API_URL)";
    apiStatusEl.className = "status-pill offline";
  }
}

async function loadItems() {
  try {
    const res = await fetch(`${API_URL}/items`);
    const data = await res.json();
    itemsList.innerHTML = "";
    for (const item of data.items || []) {
      const li = document.createElement("li");
      li.innerHTML = `<span>${item.text}</span><small>${new Date(item.createdAt).toLocaleTimeString()}</small>`;
      itemsList.appendChild(li);
    }
  } catch {
    // Ignore when backend is offline
  }
}

itemForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = itemInput.value.trim();
  if (!text) return;
  itemInput.value = "";
  await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  await loadItems();
});

checkHealth();
loadItems();

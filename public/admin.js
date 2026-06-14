let password = sessionStorage.getItem("admin_password");

if (!password) {
  password = prompt("Admin password:");
  sessionStorage.setItem("admin_password", password);
}

async function loadGroupSettings() {
  if (!selectedChatId) return;

  const data = await api(
    "/api/admin/group-settings?chat_id=" + encodeURIComponent(selectedChatId)
  );

  document.getElementById("vaultToggle").checked = data.vault_enabled;
  document.getElementById("aiToggle").checked = data.ai_enabled;
}

async function saveGroupSettings() {
  if (!selectedChatId) {
    alert("Select a chat first");
    return;
  }

  const settingsPassword = prompt("Enter settings password:");

  if (!settingsPassword) {
    await loadGroupSettings();
    return;
  }

  await api("/api/admin/group-settings", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      vault_enabled: document.getElementById("vaultToggle").checked,
      ai_enabled: document.getElementById("aiToggle").checked,
      settings_password: settingsPassword
    }),
  });

  await loadGroupSettings();
}

async function trackPanelVisit() {
  let visitorId = localStorage.getItem("panel_visitor_id");

  if (!visitorId) {
    visitorId = crypto.randomUUID();
    localStorage.setItem("panel_visitor_id", visitorId);
  }

  await api("/api/admin/panel-visit", {
    method: "POST",
    body: JSON.stringify({
      visitor_id: visitorId,
      page: location.pathname,
      hostname: location.hostname,
      language: navigator.language,
      platform: navigator.platform,
      user_agent: navigator.userAgent,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screen_width: screen.width,
      screen_height: screen.height,
      window_width: window.innerWidth,
      window_height: window.innerHeight,
      device_pixel_ratio: window.devicePixelRatio,
      dark_mode: window.matchMedia("(prefers-color-scheme: dark)").matches,
      touch_support: navigator.maxTouchPoints > 0
    })
  });
}

let selectedChatId = null;
let selectedChatTitle = null;
let replyToMessageId = null;
let replyToName = null;

async function api(path, options = {}) {
  options.headers = {
    ...(options.headers || {}),
    "x-admin-password": password,
    "Content-Type": "application/json"
  };

  const res = await fetch(path, options);

  if (res.status === 401) {
    sessionStorage.removeItem("admin_password");
    alert("Wrong admin password. Refresh and try again.");
    throw new Error("Unauthorized");
  }
  
  if (res.status === 403) {
  alert("Wrong reply/delete password.");
  throw new Error("Forbidden");
}



 return res.json();
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function loadChats() {
  const data = await api("/api/admin/chats");
  const box = document.getElementById("chats");
  box.innerHTML = "";

  if (!data.chats || data.chats.length === 0) {
    box.innerHTML = `<div class="empty">No chats yet</div>`;
    return;
  }

  const search = document.getElementById("chatSearch")?.value.toLowerCase() || "";

  const chats = data.chats.filter(chat =>
    String(chat.chat_title || "").toLowerCase().includes(search) ||
    String(chat.chat_id || "").toLowerCase().includes(search) ||
    String(chat.chat_type || "").toLowerCase().includes(search)
  );

  chats.forEach(chat => {
    const div = document.createElement("div");
    div.className = "chat-item";

    if (String(chat.chat_id) === String(selectedChatId)) {
      div.classList.add("active");
    }

    div.innerHTML = `
      <div class="chat-title">${escapeHtml(chat.chat_title || chat.chat_id)}</div>
      <div class="chat-type">${escapeHtml(chat.chat_type || "chat")}</div>
      <div class="chat-time">${formatTime(chat.created_at)}</div>
    `;

    div.onclick = () => {
      selectedChatId = chat.chat_id;
      selectedChatTitle = chat.chat_title || chat.chat_id;
      document.getElementById("chatTitle").innerText = selectedChatTitle;
      clearReply();
      loadMessages();
      loadChats();
    };

    box.appendChild(div);
  });
}

async function loadMessages() {
  if (!selectedChatId) return;

  const box = document.getElementById("messages");
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;

  const search = document.getElementById("messageSearch")?.value || "";

  const data = await api(
    "/api/admin/messages?chat_id=" +
      encodeURIComponent(selectedChatId) +
      "&search=" +
      encodeURIComponent(search)
  );

  box.innerHTML = "";

  if (!data.messages || data.messages.length === 0) {
    box.innerHTML = `<div class="empty">No messages yet</div>`;
    return;
  }

  data.messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message-row " + (m.is_bot ? "bot" : "");

    const canReply = !!m.telegram_message_id;

    row.innerHTML = `
  <div class="message-wrap">
    <div class="sender">${escapeHtml(m.username || (m.is_bot ? "Akash" : "User"))}</div>

    <div class="bubble">
      <div class="message-text">${escapeHtml(m.message_text)}</div>
    </div>

    <div class="message-meta">
      <span class="time">${formatTime(m.created_at)}</span>
      ${
        canReply
          ? `<button class="reply-button" onclick="selectReply(${m.telegram_message_id}, '${escapeHtml(m.username || "User")}')">Reply</button>`
          : ""
      }
    </div>
  </div>
`;
    box.appendChild(row);
  });

  if (nearBottom) {
    box.scrollTop = box.scrollHeight;
  }
}

function selectReply(messageId, username) {
  replyToMessageId = messageId;
  replyToName = username;

  document.getElementById("replyText").innerText = "Replying to " + username;
  document.getElementById("replyBox").classList.remove("hidden");
}

function clearReply() {
  replyToMessageId = null;
  replyToName = null;

  document.getElementById("replyText").innerText = "";
  document.getElementById("replyBox").classList.add("hidden");
}

async function sendMessage() {
  const input = document.getElementById("text");
  const text = input.value.trim();

  if (!selectedChatId) {
    alert("Select a chat first");
    return;
  }

 if (!text) return;

const replyPassword = prompt("Enter reply password:");

if (!replyPassword) return;

await api("/api/admin/messages", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      text,
      reply_to_message_id: replyToMessageId,
      reply_password: replyPassword
    })
  });

  input.value = "";
  clearReply();

  await loadMessages();
  await loadChats();
}

async function deleteChat() {
  if (!selectedChatId) {
    alert("Select a chat first");
    return;
  }

  if (!confirm("Delete this chat history from panel?")) return;

  const deletePassword = prompt("Enter delete password:");

  if (!deletePassword) return;

  await api(
  "/api/admin/chats?chat_id=" +
    encodeURIComponent(selectedChatId),
  {
    method: "DELETE",
    headers: {
      "x-delete-password": deletePassword
    }
  }
);

  selectedChatId = null;
  selectedChatTitle = null;
  clearReply();

  document.getElementById("chatTitle").innerText = "Select a chat";
  document.getElementById("messages").innerHTML =
    `<div class="empty">No chat selected</div>`;

  await loadChats();
}
function handleEnter(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

loadChats();
trackPanelVisit();

setInterval(() => {
  loadChats();
  if (selectedChatId) loadMessages();
}, 3000);

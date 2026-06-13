let password = localStorage.getItem("admin_password");

if (!password) {
  password = prompt("Admin password:");
  localStorage.setItem("admin_password", password);
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
    localStorage.removeItem("admin_password");
    alert("Wrong admin password. Refresh and try again.");
    throw new Error("Unauthorized");
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

  data.chats.forEach(chat => {
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

  const data = await api("/api/admin/messages?chat_id=" + encodeURIComponent(selectedChatId));
  const box = document.getElementById("messages");
  box.innerHTML = "";

  if (!data.messages || data.messages.length === 0) {
    box.innerHTML = `<div class="empty">No messages yet</div>`;
    return;
  }

  data.messages.forEach(m => {
    const row = document.createElement("div");
    row.className = "message-row " + (m.is_bot ? "bot" : "");

    const canReply = m.telegram_message_id ? true : false;

    row.innerHTML = `
      <div class="bubble">
        <div class="sender">${escapeHtml(m.username || (m.is_bot ? "Akash" : "User"))}</div>
        <div>${escapeHtml(m.message_text)}</div>
        <div class="time">${formatTime(m.created_at)}</div>
        ${
          canReply
            ? `<button class="reply-button" onclick="selectReply(${m.telegram_message_id}, '${escapeHtml(m.username || "User")}')">Reply</button>`
            : ""
        }
      </div>
    `;

    box.appendChild(row);
  });

  box.scrollTop = box.scrollHeight;
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

  await api("/api/admin/send", {
    method: "POST",
    body: JSON.stringify({
      chat_id: selectedChatId,
      text,
      reply_to_message_id: replyToMessageId
    })
  });

  input.value = "";
  clearReply();

  await loadMessages();
  await loadChats();
}

function handleEnter(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

loadChats();

setInterval(() => {
  loadChats();
  if (selectedChatId) loadMessages();
}, 3000);

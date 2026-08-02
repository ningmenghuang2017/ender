const setupMessage = document.getElementById("firebase-setup-message");
const authStatus = document.getElementById("auth-status");
const authError = document.getElementById("auth-error");
const chatError = document.getElementById("chat-error");
const roomStatus = document.getElementById("room-status");
const selectedRoomLabel = document.getElementById("selected-room-label");
const roomList = document.getElementById("room-list");
const messageList = document.getElementById("message-list");
const signUpForm = document.getElementById("sign-up-form");
const signInForm = document.getElementById("sign-in-form");
const signOutButton = document.getElementById("sign-out-button");
const createRoomForm = document.getElementById("create-room-form");
const roomNameInput = document.getElementById("room-name");
const createRoomButton = document.getElementById("create-room-button");
const messageForm = document.getElementById("message-form");
const messageInput = document.getElementById("message-input");
const sendMessageButton = document.getElementById("send-message-button");

const state = {
  auth: null,
  db: null,
  user: null,
  rooms: [],
  selectedRoomId: "",
  selectedRoomName: "",
  unsubscribeRooms: null,
  unsubscribeMessages: null
};

bindEvents();
renderSignedOutState();
showMessagesHint("Sign in and choose a room to see messages.");
initializeChat();

function bindEvents() {
  signUpForm.addEventListener("submit", handleSignUp);
  signInForm.addEventListener("submit", handleSignIn);
  signOutButton.addEventListener("click", handleSignOut);
  createRoomForm.addEventListener("submit", handleCreateRoom);
  messageForm.addEventListener("submit", handleSendMessage);
}

async function initializeChat() {
  authStatus.textContent = "Chat is loading...";

  try {
    const configModule = await import("../firebase-config.js");
    const firebaseConfig = configModule.firebaseConfig;

    if (!isFirebaseConfigReady(firebaseConfig)) {
      showSetupInstructions("Firebase chat is waiting for setup. Copy firebase-config.example.js to firebase-config.js and add your real Firebase values.");
      return;
    }

    const firebaseBaseUrl = "https://www.gstatic.com/firebasejs/12.1.0";
    const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
      import(`${firebaseBaseUrl}/firebase-app.js`),
      import(`${firebaseBaseUrl}/firebase-auth.js`),
      import(`${firebaseBaseUrl}/firebase-firestore.js`)
    ]);

    const app = initializeApp(firebaseConfig);
    state.auth = authModule.getAuth(app);
    state.db = firestoreModule.getFirestore(app);
    state.authModule = authModule;
    state.firestoreModule = firestoreModule;
    clearStatus(setupMessage);

    authModule.onAuthStateChanged(state.auth, function (user) {
      state.user = user;
      clearStatus(authError);
      clearStatus(chatError);

      if (user) {
        authStatus.textContent = `Signed in as ${user.email || "Unknown user"}.`;
        signOutButton.disabled = false;
        createRoomButton.disabled = false;
        roomNameInput.disabled = false;
        updateMessageComposerState();
        subscribeToRooms();
      } else {
        renderSignedOutState();
      }
    });
  } catch (error) {
    const isMissingConfig = error instanceof TypeError || /firebase-config\.js/.test(String(error && error.message));
    if (isMissingConfig) {
      showSetupInstructions("Firebase chat is waiting for setup. Copy firebase-config.example.js to firebase-config.js and add your real Firebase values.");
      return;
    }

    authStatus.textContent = "Chat could not start.";
    showStatus(setupMessage, getFriendlyError(error), "status-error");
  }
}

function isFirebaseConfigReady(firebaseConfig) {
  if (!firebaseConfig || typeof firebaseConfig !== "object") {
    return false;
  }

  return Object.values(firebaseConfig).every(function (value) {
    return typeof value === "string" && value.trim() && !value.includes("YOUR_");
  });
}

function renderSignedOutState() {
  authStatus.textContent = "Not signed in.";
  signOutButton.disabled = true;
  createRoomButton.disabled = true;
  roomNameInput.disabled = true;
  messageInput.value = "";
  state.selectedRoomId = "";
  state.selectedRoomName = "";
  roomStatus.textContent = "Sign in to load rooms.";
  selectedRoomLabel.textContent = "Select a room to begin chatting.";
  roomList.innerHTML = '<p class="small">Sign in to see chat rooms.</p>';
  showMessagesHint("Sign in and choose a room to see messages.");
  stopRoomsSubscription();
  stopMessagesSubscription();
  updateMessageComposerState();
}

async function handleSignUp(event) {
  event.preventDefault();
  clearStatus(authError);
  clearStatus(chatError);

  if (!state.authModule || !state.auth) {
    showSetupInstructions("Firebase chat is waiting for setup. Copy firebase-config.example.js to firebase-config.js and add your real Firebase values.");
    return;
  }

  const email = signUpForm.email.value.trim();
  const password = signUpForm.password.value.trim();

  if (!email || !password) {
    showStatus(authError, "Enter both email and password to create an account.", "status-error");
    return;
  }

  if (password.length < 6) {
    showStatus(authError, "Passwords must be at least 6 characters long.", "status-error");
    return;
  }

  try {
    await state.authModule.createUserWithEmailAndPassword(state.auth, email, password);
    signUpForm.reset();
  } catch (error) {
    showStatus(authError, getFriendlyError(error), "status-error");
  }
}

async function handleSignIn(event) {
  event.preventDefault();
  clearStatus(authError);
  clearStatus(chatError);

  if (!state.authModule || !state.auth) {
    showSetupInstructions("Firebase chat is waiting for setup. Copy firebase-config.example.js to firebase-config.js and add your real Firebase values.");
    return;
  }

  const email = signInForm.email.value.trim();
  const password = signInForm.password.value.trim();

  if (!email || !password) {
    showStatus(authError, "Enter both email and password to sign in.", "status-error");
    return;
  }

  try {
    await state.authModule.signInWithEmailAndPassword(state.auth, email, password);
    signInForm.reset();
  } catch (error) {
    showStatus(authError, getFriendlyError(error), "status-error");
  }
}

async function handleSignOut() {
  clearStatus(authError);
  clearStatus(chatError);

  if (!state.authModule || !state.auth) {
    return;
  }

  try {
    await state.authModule.signOut(state.auth);
  } catch (error) {
    showStatus(authError, getFriendlyError(error), "status-error");
  }
}

async function handleCreateRoom(event) {
  event.preventDefault();
  clearStatus(chatError);

  if (!state.user) {
    showStatus(chatError, "Sign in before creating a room.", "status-error");
    return;
  }

  const roomName = roomNameInput.value.trim();

  if (roomName.length < 3 || roomName.length > 40) {
    showStatus(chatError, "Room names must be between 3 and 40 characters.", "status-error");
    return;
  }

  try {
    const roomRef = await state.firestoreModule.addDoc(
      state.firestoreModule.collection(state.db, "rooms"),
      {
        name: roomName,
        createdAt: state.firestoreModule.serverTimestamp(),
        createdByUid: state.user.uid,
        createdByEmail: state.user.email || ""
      }
    );

    roomNameInput.value = "";
    state.selectedRoomId = roomRef.id;
  } catch (error) {
    showStatus(chatError, getFriendlyError(error), "status-error");
  }
}

async function handleSendMessage(event) {
  event.preventDefault();
  clearStatus(chatError);

  if (!state.user) {
    showStatus(chatError, "Sign in before sending messages.", "status-error");
    return;
  }

  if (!state.selectedRoomId) {
    showStatus(chatError, "Choose a room before sending a message.", "status-error");
    return;
  }

  const text = messageInput.value.trim();

  if (!text) {
    showStatus(chatError, "Type a message before sending.", "status-error");
    return;
  }

  try {
    await state.firestoreModule.addDoc(
      state.firestoreModule.collection(state.db, "rooms", state.selectedRoomId, "messages"),
      {
        text: text,
        createdAt: state.firestoreModule.serverTimestamp(),
        senderUid: state.user.uid,
        senderEmail: state.user.email || "",
        senderDisplay: state.user.email || "Unknown user"
      }
    );

    messageInput.value = "";
  } catch (error) {
    showStatus(chatError, getFriendlyError(error), "status-error");
  }
}

function subscribeToRooms() {
  if (!state.user || !state.db || !state.firestoreModule) {
    return;
  }

  stopRoomsSubscription();

  const roomsQuery = state.firestoreModule.query(
    state.firestoreModule.collection(state.db, "rooms"),
    state.firestoreModule.orderBy("createdAt", "asc")
  );

  state.unsubscribeRooms = state.firestoreModule.onSnapshot(
    roomsQuery,
    function (snapshot) {
      state.rooms = snapshot.docs.map(function (doc) {
        return {
          id: doc.id,
          ...doc.data()
        };
      });

      renderRooms();

      if (!state.selectedRoomId && state.rooms.length) {
        selectRoom(state.rooms[0].id, state.rooms[0].name || "Untitled room");
      } else if (state.selectedRoomId) {
        const selectedRoom = state.rooms.find(function (room) {
          return room.id === state.selectedRoomId;
        });

        if (selectedRoom) {
          state.selectedRoomName = selectedRoom.name || "Untitled room";
          selectedRoomLabel.textContent = `Chatting in ${state.selectedRoomName}`;
          subscribeToMessages(state.selectedRoomId);
        } else {
          state.selectedRoomId = "";
          state.selectedRoomName = "";
          stopMessagesSubscription();
          showMessagesHint("Choose a room to see messages.");
        }
      }
    },
    function (error) {
      roomStatus.textContent = "Could not load rooms.";
      showStatus(chatError, getFriendlyError(error), "status-error");
    }
  );
}

function renderRooms() {
  if (!state.rooms.length) {
    roomStatus.textContent = "No rooms yet. Create the first room.";
    roomList.innerHTML = '<p class="small">No rooms yet. Create the first room.</p>';
    return;
  }

  roomStatus.textContent = "Choose a room or create a new one.";
  roomList.innerHTML = "";

  state.rooms.forEach(function (room) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "room-button";
    button.textContent = room.name || "Untitled room";

    if (room.id === state.selectedRoomId) {
      button.classList.add("room-button-active");
    }

    button.addEventListener("click", function () {
      selectRoom(room.id, room.name || "Untitled room");
    });

    roomList.appendChild(button);
  });
}

function selectRoom(roomId, roomName) {
  state.selectedRoomId = roomId;
  state.selectedRoomName = roomName;
  selectedRoomLabel.textContent = `Chatting in ${roomName}`;
  updateMessageComposerState();
  renderRooms();
  subscribeToMessages(roomId);
}

function subscribeToMessages(roomId) {
  if (!state.user || !roomId || !state.db || !state.firestoreModule) {
    return;
  }

  stopMessagesSubscription();
  showMessagesHint("Loading messages...");

  const messagesQuery = state.firestoreModule.query(
    state.firestoreModule.collection(state.db, "rooms", roomId, "messages"),
    state.firestoreModule.orderBy("createdAt", "asc")
  );

  state.unsubscribeMessages = state.firestoreModule.onSnapshot(
    messagesQuery,
    function (snapshot) {
      if (!snapshot.docs.length) {
        showMessagesHint("No messages yet. Send the first one.");
        return;
      }

      messageList.innerHTML = "";

      snapshot.docs.forEach(function (doc) {
        const message = doc.data();
        const article = document.createElement("article");
        article.className = "message-item";

        const meta = document.createElement("div");
        meta.className = "message-meta";
        meta.textContent = `${message.senderDisplay || message.senderEmail || "Unknown user"} • ${formatTimestamp(message.createdAt)}`;

        const body = document.createElement("p");
        body.className = "message-body";
        body.textContent = message.text || "";

        article.appendChild(meta);
        article.appendChild(body);
        messageList.appendChild(article);
      });

      messageList.scrollTop = messageList.scrollHeight;
    },
    function (error) {
      showStatus(chatError, getFriendlyError(error), "status-error");
      showMessagesHint("Messages could not be loaded.");
    }
  );
}

function stopRoomsSubscription() {
  if (typeof state.unsubscribeRooms === "function") {
    state.unsubscribeRooms();
  }

  state.unsubscribeRooms = null;
  state.rooms = [];
}

function stopMessagesSubscription() {
  if (typeof state.unsubscribeMessages === "function") {
    state.unsubscribeMessages();
  }

  state.unsubscribeMessages = null;
}

function updateMessageComposerState() {
  const canSend = Boolean(state.user && state.selectedRoomId);
  sendMessageButton.disabled = !canSend;
  messageInput.disabled = !canSend;
}

function showMessagesHint(message) {
  messageList.innerHTML = `<p class="small">${escapeHtml(message)}</p>`;
}

function showSetupInstructions(message) {
  showStatus(setupMessage, message, "status-banner");
  authStatus.textContent = "Firebase chat setup is required.";
  roomStatus.textContent = "Add your Firebase config to enable rooms.";
  updateMessageComposerState();
}

function showStatus(element, message, className) {
  element.hidden = false;
  element.textContent = message;
  element.className = className ? `status-message ${className}` : "status-message";
}

function clearStatus(element) {
  element.hidden = true;
  element.textContent = "";
}

function formatTimestamp(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Sending...";
  }

  return timestamp.toDate().toLocaleString([], {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function getFriendlyError(error) {
  const code = error && error.code ? error.code : "";
  const defaultMessage = error && error.message ? error.message : "Something went wrong. Please try again.";

  switch (code) {
    case "auth/email-already-in-use":
      return "That email is already being used.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email or password is incorrect.";
    case "auth/weak-password":
      return "Choose a stronger password with at least 6 characters.";
    case "permission-denied":
      return "Firebase denied access. Check your Authentication and Firestore rules.";
    default:
      return defaultMessage;
  }
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

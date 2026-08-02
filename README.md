## Ender website

This repository hosts a static HTML/CSS/JS website and now includes Firebase-powered multi-user authentication and realtime chat rooms.

### Firebase setup

1. Create a Firebase project at https://console.firebase.google.com/.
2. In the Firebase project, create a Web app and copy the config values.
3. Enable **Authentication** and turn on the **Email/Password** provider.
4. Enable **Cloud Firestore** in the Firebase console.
5. Copy `firebase-config.example.js` to `firebase-config.js` in the repository root.
6. Replace the placeholder values in `firebase-config.js` with your real Firebase web app config.

`firebase-config.js` is gitignored so real secrets are not committed by accident.

### Firestore structure used by the site

- `rooms/{roomId}`
  - `name`
  - `createdAt`
  - `createdByUid`
  - `createdByEmail`
- `rooms/{roomId}/messages/{messageId}`
  - `text`
  - `createdAt`
  - `senderUid`
  - `senderEmail`
  - `senderDisplay`

### Example Firestore rules

Use rules like these for development, then tighten them for production based on your needs:

```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /rooms/{roomId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null
        && request.resource.data.name is string
        && request.resource.data.name.size() >= 3
        && request.resource.data.name.size() <= 40;

      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null
          && request.resource.data.text is string
          && request.resource.data.text.size() > 0
          && request.resource.data.text.size() <= 280;
      }
    }
  }
}
```

### Manual test steps

1. Copy `firebase-config.example.js` to `firebase-config.js` and add real Firebase values.
2. Open `index.html` through a local server or GitHub Pages.
3. Sign up with a new email/password account.
4. Sign out, then sign back in with the same account.
5. Open the site in a second browser or private window and sign in as a different user.
6. Create a room in one window, then select the same room in both windows.
7. Send messages from both users and confirm that:
   - messages appear in realtime
   - each message shows the sender email
   - each message shows a timestamp

### Notes

- The chat UI is on `index.html`.
- Firebase config placeholders live in `firebase-config.example.js`.
- Play the tower defence game at https://ningmenghuang2017.github.io/ender/tower-defence.html

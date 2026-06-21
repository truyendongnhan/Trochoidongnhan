# Security Specification

## 1. Data Invariants
- **Project Ownership**: Every Project document MUST have a `userId` field matching the creator's authentication UID. No one but the owner can read, write, update, or delete the project.
- **Relational Integrity for Chapters**: Chapters can only reside inside a Project's nested `chapters` subcollection. A chapter write is validated against the owner of the parent Project.
- **Admin Control**: Custom worlds (`customWorlds` collection) can be viewed by any authenticated user but can ONLY be created, updated, or deleted by authorized System Administrators.
- **No Self-Privilege Escalation**: Users cannot declare themselves as administrators or modify the `admins` collection.

---

## 2. The "Dirty Dozen" Payloads

### Payload 1: ID Spoofing on Project Creation (Evil User attempts to create a project claiming it belongs to Victim)
```json
{
  "id": "project-123",
  "userId": "victim-uid-abc",
  "worldId": "one-piece",
  "character": { "name": "Hackey", "stats": {} },
  "story": { "title": "Evil Story" },
  "updatedAt": 123456789
}
```

### Payload 2: Hostile Read of Private Project (UID `attacker` attempts to read project `/projects/victim-project`)
```json
// Any attempt to read other user's projects must fail
```

### Payload 3: Shadow Update of Project Stats (UID `attacker` attempts to inject unlisted keys or edit state inside a project they don't own)
```json
{
  "character": { "name": "Hackey", "wealth": 9999999 }
}
```

### Payload 4: Arbitrary Project Deletion (UID `attacker` attempts to delete a project owned by `victim`)
```json
// Delete signal from non-owner must fail
```

### Payload 5: Sibling Chapter Hijacking (UID `attacker` attempts to insert a custom chapter under a project owned by `victim`)
```json
{
  "id": "hijack-chapter",
  "title": "Malicious Chapter",
  "content": "Attacker content",
  "createdAt": 123456789
}
```

### Payload 6: Rogue Custom World Creation (Standard authenticated user without admin privileges attempts to create a custom world)
```json
{
  "id": "my-fake-world",
  "name": "Malicious Land",
  "type": "anime",
  "description": "Bypassing admin check",
  "createdBy": "attacker-uid"
}
```

### Payload 7: Unauthorized Custom World Edit/Deactivation (Standard user attempts to hide or overwrite a world they didn't create or don't have admin access to)
```json
{
  "isHidden": true
}
```

### Payload 8: Self-Assigned Admin Status (Attacker attempts to create an entry in the `/admins` collection)
```json
{
  "email": "attacker@gmail.com"
}
```

### Payload 9: Unauthenticated Read of Projects (Anonymous user without an ID attempts to fetch user projects)
```json
// Reads are blocked for unauthenticated requests
```

### Payload 10: Value Poisoning in Chapter (Standard user attempts to inject 1.5MB of garbage data inside the title of a chapter)
```json
{
  "title": "{ A very long string exceeding N characters... }"
}
```

### Payload 11: Invalid ID Poisoning (Standard user attempts to use a document ID containing special injected symbols like `/` or `$` or massive size over 128 characters)
```json
// Path/ID Poisoning attack must be rejected by isValidId()
```

### Payload 12: Missing Immutability Guard (Attacker attempts to update a project's `worldId` after creation)
```json
{
  "worldId": "naruto"
}
```

---

## 3. Test Runner Spec Template
Below is the verification plan implemented to ensure the rule set acts as a pristine firewall rejecting all Dirty Dozen anomalies:
- Initializes the Firestore emulator using the mock Firebase token payloads.
- Runs assertions checking that unauthenticated, unauthorized, or invalid data shapes result in instant `PERMISSION_DENIED`.

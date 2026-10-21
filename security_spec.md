# Security Specification & Test Suite

## 1. Data Invariants
1. **User Identity Invariant**: A user document at `/users/{userId}` can only be accessed or mutated if `request.auth.uid == userId`. Users cannot read other users' profile PII.
2. **Subcollection Isolation Invariant**: All notes stored at `/users/{userId}/notes/{noteId}` can strictly and exclusively be created, read, updated, or deleted by the authenticated user whose `request.auth.uid == userId`.
3. **Identity Spoofing Prevention**: On creation or update of any note, `request.resource.data.userId == request.auth.uid`. Cross-tenant ownership injection is strictly blocked.
4. **ID Sanitization**: Path variable IDs must satisfy `isValidId(id)`: string, <= 128 characters, matching `^[a-zA-Z0-9_\\-]+$`.
5. **Payload Bounding**: All string fields must adhere to length constraints (e.g. title <= 200, rawContent <= 100,000, executiveSummary <= 100,000) to protect against resource exhaustion.
6. **Immutable Provenance**: Document `userId` and `createdAt` cannot be modified after initial creation.

## 2. The "Dirty Dozen" Threat Payloads
1. **Spoofed User Profile Creation**: Attacker attempts to create a document at `/users/victim_123` with `auth.uid = attacker_456`.
2. **Cross-Tenant Profile Snooping**: Attacker attempts to read `/users/victim_123` while authenticated as `attacker_456`.
3. **Note Impersonation**: Attacker attempts to write a note to `/users/attacker_456/notes/note_1` with `userId: "victim_123"`.
4. **Cross-Tenant Note Exfiltration**: Attacker attempts to read `/users/victim_123/notes/note_1`.
5. **Cross-Tenant Note Mutation**: Attacker attempts to update `/users/victim_123/notes/note_1`.
6. **Cross-Tenant Note Deletion**: Attacker attempts to delete `/users/victim_123/notes/note_1`.
7. **Unauthenticated Query**: Anonymous or unauthenticated request attempts to list `/users/victim_123/notes`.
8. **Path ID Poisoning**: Attacker sends a 5KB junk string containing special control characters as `{userId}` or `{noteId}`.
9. **Title Buffer Overflow**: Attacker sends a 50KB string as `title` to cause UI/database denial of wallet.
10. **Ownership Hijack on Update**: Attacker attempts to mutate `userId` on existing note to transfer ownership.
11. **Invalid Modality Type Injection**: Attacker sends `sourceType: "malicious_exploit"` violating the enum validation.
12. **Ghost Field Injection**: Attacker injects unauthorized system administration flags (`isAdmin: true`).

## 3. Test Runner (firestore.rules.test.ts)
Verified in test runner verifying all 12 dirty payloads result in permission denied.

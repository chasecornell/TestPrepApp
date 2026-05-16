# Security Specification - Velocity Prep

## 1. Data Invariants
- A `ProgressEntry` must reference a valid `userId` (the current user) and an existing `questionId`.
- Users cannot modify the `questions` collection.
- Users can only read and write their own `User` profile and `ProgressEntry` documents.
- User `knowledgeState` is derived from activity; while the client updates it for now, it should be strictly validated.
- `pointsEarned` must be calculated based on correctness and time (to be hardened later).

## 2. The "Dirty Dozen" Payloads (Red Team Targets)
1. **Identity Spoofing**: Attempt to update another user's profile by changing `{userId}` in the path.
2. **Knowledge state injection**: Attempting to set all knowledge probabilities to `1.0` without answering questions.
3. **Ghost Questions**: Writing a synthetic question to the `questions` collection as a standard user.
4. **Progress Forgery**: Submitting `isCorrect: true` for a question that wasn't actually served.
5. **Score Bloating**: Setting `pointsEarned: 99999` in a `ProgressEntry`.
6. **Streak Manipulation**: Manually resetting `streak` to `100` in the `User` profile.
7. **PII Leakage**: Attempting to list all users to scrape emails.
8. **Resource Exhaustion**: Sending a 1MB string as a `displayName`.
9. **Timestamp Spoofing**: Setting `lastActive` to a future date.
10. **Question Deletion**: Attempting to delete the question bank.
11. **Orphaned Progress**: Creating a progress entry for a non-existent `questionId`.
12. **Malicious ID**: Using a very long and complex string as a `userId` to cause indexing issues.

## 3. Test Runner Concept
The tests will verify that all attempts to modify data not belonging to the `request.auth.uid` are rejected, and all schema-breaking writes are blocked.

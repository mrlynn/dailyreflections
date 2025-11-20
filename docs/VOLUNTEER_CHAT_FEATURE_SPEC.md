# Volunteer Chat Feature Specification  
### AA Companion — Trusted Service Implementation Plan

---

## 1. Purpose

Enable **trusted, sober volunteers** to staff an **online peer-support chat feature** within the AA Companion app.  
The goal is to provide users with access to caring, experienced members of the recovery community who can share experience, strength, and hope — *not* counseling or therapy.

This system must ensure:
- Safety for users seeking help.
- Integrity and anonymity for volunteers.
- Alignment with AA principles of service, humility, and trust.

---

## 2. Guiding Principles

- **Anonymity**: Volunteers are identified by first name and last initial (e.g., “Mike L.”).  
- **Service**: Emphasis on listening and sharing personal experience, not giving advice.  
- **Accountability**: Volunteers are vetted and periodically reviewed.  
- **Transparency**: Users are clearly informed they’re chatting with a peer, not a professional.  
- **Safety**: AI moderation and admin oversight ensure a respectful, safe environment.

---

## 3. Feature Overview

| Component | Description |
|------------|-------------|
| **Volunteer Application Flow** | Registered users apply to become chat volunteers through an in-app form. |
| **Approval Process** | Applications reviewed by 2+ trusted admins before activation. |
| **Volunteer Role Assignment** | Approved users are assigned the `volunteer_listener` role in MongoDB. |
| **Chat Staffing Interface** | Volunteers can “go live” to accept incoming chat requests. |
| **AI + Admin Moderation** | Real-time language moderation and session audit metadata logging. |
| **Feedback Loop** | Users can rate their chat interaction; repeated negative feedback triggers review. |

---

## 4. Application Flow

### 4.1 Step 1 — Volunteer Intent Form
Users complete a short in-app form:

**Fields:**
- How long have you been sober?
- Why do you want to volunteer?
- How do you stay connected in recovery (home group, sponsor, etc.)?
- What does service mean to you?

**Submission creates a document in:**
```json
{
  "_id": "ObjectId",
  "user_id": "UUID",
  "status": "pending",
  "responses": { ... },
  "created_at": "timestamp",
  "reviewed_by": [],
  "approved": false
}
```

---

### 4.2 Step 2 — Code of Conduct Agreement
Volunteers must agree to a digital statement affirming:

- “I will not provide medical, therapeutic, or legal advice.”  
- “I will maintain anonymity and confidentiality at all times.”  
- “I will treat all users with compassion and respect.”  
- “I understand this is a spiritual service, not a professional role.”

Agreement is stored as a boolean and timestamp in the user’s profile.

---

### 4.3 Step 3 — Review & Approval
- Two trusted admins must approve each volunteer.  
- Approval requires reviewing responses and possibly conducting a short orientation call.
- The `volunteer_listener` role is only granted after both approvals are recorded.

**Approval log schema:**
```json
{
  "volunteer_id": "UUID",
  "approved_by": ["admin_id_1", "admin_id_2"],
  "approved_at": "timestamp"
}
```

---

## 5. Ongoing Trust & Safety

### 5.1 AI Moderation
Integrate an AI moderation API (OpenAI, Perspective, or custom LLM filter).

**Flow:**
1. All messages pass through moderation filter before reaching the user.
2. Flagged messages trigger:
   - Automatic warning to volunteer.
   - Logging in moderation collection.
   - Optional temporary suspension of the volunteer role.

### 5.2 User Feedback
At chat close, prompt:
> “Was this interaction kind and respectful?”

Users can select:
- 👍 Yes, it was helpful  
- ⚠️ It felt uncomfortable  
- 🚫 Inappropriate  

Flags are stored for admin review.  
Threshold: 3+ ⚠️ or 🚫 feedback = auto-review.

### 5.3 Session Audit Logging
Log only **metadata**, not conversation text.

```json
{
  "chat_id": "UUID",
  "volunteer_id": "UUID",
  "user_id": "UUID",
  "start_time": "timestamp",
  "end_time": "timestamp",
  "feedback": "positive|neutral|flagged",
  "moderation_flags": 0
}
```

---

## 6. Chat Interface (Technical Overview)

### For Users
- Entry point: “Chat with a sober volunteer”
- Before session: disclaimer text displayed
  > “You’re speaking with a fellow alcoholic in recovery — not a counselor or therapist.”
- System matches user with available volunteer.

### For Volunteers
- “Go Live” button on dashboard.
- Displays queue of waiting users.
- Auto-assign chat sessions (round robin or random selection).

### Stack Considerations
- **Frontend**: React/NextJS + Material UI  
- **Backend**: Node/Express  
- **Database**: MongoDB Atlas  
  - Collections: `volunteers`, `volunteer_applications`, `chat_sessions`, `feedback`, `moderation_events`  
- **Realtime**: WebSocket or Firebase integration for live chat.
- **AI Moderation**: Use middleware to process messages.

---

## 7. Admin Dashboard

Admins can:
- Review and approve applications.
- View audit logs and flagged sessions.
- Revoke volunteer privileges.
- View aggregate stats: total sessions, active volunteers, flagged interactions.

---

## 8. Orientation & Training

Each new volunteer completes a 15–20 minute orientation:
- Overview of spiritual principles of service.
- Listening skills vs. advice-giving.
- Confidentiality and safety reminders.
- Reporting pathways if they encounter a crisis (e.g., suicidal ideation).

You can host this as a recorded video or brief interactive module.

---

## 9. Crisis Escalation Protocol

If a user expresses suicidal ideation or crisis:
1. Chatbot detects phrases like “I want to die,” “I can’t go on,” etc.
2. Immediately present **crisis message**:
   > “I’m really concerned for your safety. Please reach out right now for help:  
   > 📞 Call or text 988 (U.S. Suicide & Crisis Lifeline).”
3. Automatically end chat and log event for admin review.

---

## 10. Summary of Collections

| Collection | Purpose |
|-------------|----------|
| `users` | Stores user profiles, roles, and consent flags. |
| `volunteer_applications` | Tracks applications and review process. |
| `volunteers` | Stores active volunteer records and metadata. |
| `chat_sessions` | Records metadata for all volunteer-led chats. |
| `feedback` | User feedback after sessions. |
| `moderation_events` | AI or manual moderation flags. |

---

## 11. Next Steps

1. **Design UX flow** for application, approval, and volunteer dashboard.
2. **Implement backend schema** and API endpoints.
3. **Integrate AI moderation service**.
4. **Build admin approval interface**.
5. **Pilot with trusted early volunteers** before public rollout.
6. **Gather feedback**, refine, and scale gradually.

---

## 12. Future Enhancements

- Peer mentoring / volunteer pairing.
- Availability scheduling (volunteer shifts).
- Anonymous group chat feature for “open sharing”.
- Recognition system for long-term service contributors (badges, thank-you notes).

---

> “We give it away to keep it.”  
> — AA principle of service

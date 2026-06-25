# 🗺️ Volunteer Management System (VMS)

**Detailed System Workflows & State Machines**

> **Executive Summary**  
> This document maps the exact technical workflows and state machines for the three core roles in the Volunteer Management System. These flowcharts are directly tied to the React routing layers, PostgreSQL database state transitions, and API endpoints utilized in the live application.

---

## 🎨 Diagram Legend

Before reviewing the workflows, please note the color-coding system used to identify the nature of each action:

- **[🟦 Blue Nodes]:** User-initiated actions (Frontend interactions).
- **[🟩 Green Nodes]:** Organizational interactions and successful terminal states.
- **[🟪 Purple Nodes]:** Administrative actions requiring high-level permissions.
- **[🟨 Yellow Diamonds]:** System logic gates or human decision points.
- **[⬜ Gray Nodes]:** Automated backend processes (API calls, cron jobs, or database triggers).
- **[🟥 Red Nodes]:** Destructive or punitive actions (e.g., account suspensions).

---

## 1. The Volunteer Journey

**Objective:** Discover relevant opportunities, complete applications, participate in events, and earn verified service hours.

_This workflow highlights the integration of the AI Matchmaking engine, which allows volunteers to bypass manual searching in favor of algorithmic, skill-based recommendations._

```mermaid
flowchart TD
    %% Styling
    classDef userAction fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af
    classDef systemAction fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151
    classDef decision fill:#fef08a,stroke:#eab308,stroke-width:2px,color:#854d0e
    classDef success fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#166534

    Start(["Secure Login via JWT/OAuth"]) :::userAction --> Dashboard["View Volunteer Dashboard"] :::userAction
    Dashboard --> AI_Match{"Engage AI Matchmaker?"} :::decision

    AI_Match -- Yes --> AI_Endpoint["Backend: /api/ai/recommendations"] :::systemAction
    AI_Endpoint --> AI_Display["Render Top 3 Personalized Events"] :::systemAction
    AI_Display --> Apply["Submit Formal Application"] :::userAction

    AI_Match -- No --> Discover["Execute Manual Filter & Search"] :::userAction
    Discover --> Apply

    Apply --> Wait{"Organization Review Status"} :::decision
    Wait -- Rejected --> Dashboard
    Wait -- Waitlisted --> Notification["Receive Waitlist Queue Notification"] :::systemAction
    Wait -- Approved --> AutoSchedule["System Generates Individual Event Schedule"] :::systemAction

    AutoSchedule --> Attend["Physical Attendance at Event"] :::userAction
    Attend --> CheckIn["Execute Self Check-in via Portal"] :::userAction
    CheckIn --> OrgVerify{"Organization Verification"} :::decision

    OrgVerify -- Denied --> Dispute["Hours Invalidated / Flagged"] :::systemAction
    OrgVerify -- Approved --> HoursCredit["Earn Verified Service Hours!"] :::success

    HoursCredit --> Feedback["Submit Post-Event Rating"] :::userAction
```

---

## 2. The Organization / Organizer Journey

**Objective:** Establish platform legitimacy, broadcast opportunities, manage applicant queues, and definitively verify volunteer labor.

_This workflow outlines the strict lifecycle of an 'Opportunity' state machine, moving from creation to applicant processing, and concluding with event validation._

```mermaid
flowchart TD
    %% Styling
    classDef orgAction fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#166534
    classDef systemAction fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151
    classDef decision fill:#fef08a,stroke:#eab308,stroke-width:2px,color:#854d0e

    Start(["Register Organization Profile"]) :::orgAction --> CheckVerify{"Is Account Verified by Admin?"} :::decision

    CheckVerify -- No --> WaitAdmin["Account Restricted: Wait for Admin KYC"] :::systemAction
    CheckVerify -- Yes --> CreateOpp["Draft Volunteer Opportunity"] :::orgAction

    CreateOpp --> SetDetails["Configure Capacity, Skills, & Timeframes"] :::orgAction
    SetDetails --> Publish["Publish Opportunity to Global Feed"] :::systemAction

    Publish --> ReceiveApps["Aggregate Incoming Applications"] :::systemAction
    ReceiveApps --> ReviewApps{"Process Applicant"} :::decision

    ReviewApps -- Reject --> RejectEmail["Trigger Rejection Protocol"] :::systemAction
    ReviewApps -- Waitlist --> WaitlistQueue["Add to Operational Queue"] :::systemAction
    ReviewApps -- Approve --> Assign["Assign Volunteer to Specific Shift"] :::systemAction

    Assign --> EventDay["Execute Event / Operations"] :::orgAction
    EventDay --> PostEvent["Initiate Post-Event Processing"] :::systemAction

    PostEvent --> Verify["Audit Volunteer Check-ins"] :::orgAction
    Verify --> RateVol["Submit Volunteer Reliability Rating"] :::orgAction
    RateVol --> CloseEvent["Transition Event to 'Completed' State"] :::systemAction
```

---

## 3. The Platform Admin Journey

**Objective:** Maintain platform security, vet organizations to prevent fraudulent events, and utilize AI for strategic oversight.

_This workflow emphasizes the high-level moderation capabilities required to run a multi-tenant volunteer marketplace safely._

```mermaid
flowchart TD
    %% Styling
    classDef adminAction fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#6b21a8
    classDef systemAction fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151
    classDef decision fill:#fef08a,stroke:#eab308,stroke-width:2px,color:#854d0e
    classDef danger fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#991b1b

    Start(["Secure Admin Login"]) :::adminAction --> MainDash["Access Global Dashboard"] :::adminAction

    MainDash --> ActionChoice{"Select Operational Task"} :::decision

    ActionChoice -- Strategic Analysis --> AI_Report["Trigger 'Generate AI Report'"] :::adminAction
    AI_Report --> AI_Summary["Backend Fetches Live KPIs -> Sends to Gemini API"] :::systemAction
    AI_Summary --> ReadReport["Review Generated Health Summary"] :::adminAction

    ActionChoice -- Organization Moderation --> ReviewOrg["Review Pending Organization KYC"] :::adminAction
    ReviewOrg --> OrgDecision{"Is Organization Legitimate?"} :::decision
    OrgDecision -- Approve --> UnlockOrg["Unlock Organization Read/Write Access"] :::systemAction
    OrgDecision -- Reject --> BlockOrg["Hard Delete / Block Organization Account"] :::danger

    ActionChoice -- User Moderation --> ViewFlags["Audit Flagged Users & Poor Ratings"] :::adminAction
    ViewFlags --> UserDecision{"Does User Violate TOS?"} :::decision
    UserDecision -- No --> ClearFlag["Clear Warning / Dismiss Flag"] :::systemAction
    UserDecision -- Yes --> SuspendUser["Execute Account Suspension / IP Ban"] :::danger
```

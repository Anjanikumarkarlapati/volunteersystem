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
    classDef userAction fill:#eff6ff,stroke:#3b82f6,stroke-width:2px,color:#1e40af
    classDef systemAction fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151
    classDef decision fill:#fef08a,stroke:#eab308,stroke-width:2px,color:#854d0e
    classDef success fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#166534

    Start(["Secure Login via JWT/OAuth"]) --> Dashboard["View Volunteer Dashboard"]
    Dashboard --> AI_Match{"Engage AI Matchmaker?"}

    AI_Match -- Yes --> AI_Endpoint["Backend: /api/ai/recommendations"]
    AI_Endpoint --> AI_Display["Render Top 3 Personalized Events"]
    AI_Display --> Apply["Submit Formal Application"]

    AI_Match -- No --> Discover["Execute Manual Filter & Search"]
    Discover --> Apply

    Apply --> Wait{"Organization Review Status"}
    Wait -- Rejected --> Dashboard
    Wait -- Waitlisted --> Notification["Receive Waitlist Queue Notification"]
    Wait -- Approved --> AutoSchedule["System Generates Individual Event Schedule"]

    AutoSchedule --> Attend["Physical Attendance at Event"]
    Attend --> CheckIn["Execute Self Check-in via Portal"]
    CheckIn --> OrgVerify{"Organization Verification"}

    OrgVerify -- Denied --> Dispute["Hours Invalidated / Flagged"]
    OrgVerify -- Approved --> HoursCredit["Earn Verified Service Hours!"]

    HoursCredit --> Feedback["Submit Post-Event Rating"]

    class Start,Dashboard,Apply,Discover,Attend,CheckIn,Feedback userAction
    class AI_Endpoint,AI_Display,Notification,AutoSchedule,Dispute systemAction
    class AI_Match,Wait,OrgVerify decision
    class HoursCredit success
```

---

## 2. The Organization / Organizer Journey

**Objective:** Establish platform legitimacy, broadcast opportunities, manage applicant queues, and definitively verify volunteer labor.

_This workflow outlines the strict lifecycle of an 'Opportunity' state machine, moving from creation to applicant processing, and concluding with event validation._

```mermaid
flowchart TD
    classDef orgAction fill:#f0fdf4,stroke:#22c55e,stroke-width:2px,color:#166534
    classDef systemAction fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151
    classDef decision fill:#fef08a,stroke:#eab308,stroke-width:2px,color:#854d0e

    Start(["Register Organization Profile"]) --> CheckVerify{"Is Account Verified by Admin?"}

    CheckVerify -- No --> WaitAdmin["Account Restricted: Wait for Admin KYC"]
    CheckVerify -- Yes --> CreateOpp["Draft Volunteer Opportunity"]

    CreateOpp --> SetDetails["Configure Capacity, Skills, & Timeframes"]
    SetDetails --> Publish["Publish Opportunity to Global Feed"]

    Publish --> ReceiveApps["Aggregate Incoming Applications"]
    ReceiveApps --> ReviewApps{"Process Applicant"}

    ReviewApps -- Reject --> RejectEmail["Trigger Rejection Protocol"]
    ReviewApps -- Waitlist --> WaitlistQueue["Add to Operational Queue"]
    ReviewApps -- Approve --> Assign["Assign Volunteer to Specific Shift"]

    Assign --> EventDay["Execute Event / Operations"]
    EventDay --> PostEvent["Initiate Post-Event Processing"]

    PostEvent --> Verify["Audit Volunteer Check-ins"]
    Verify --> RateVol["Submit Volunteer Reliability Rating"]
    RateVol --> CloseEvent["Transition Event to 'Completed' State"]

    class Start,CreateOpp,SetDetails,EventDay,Verify,RateVol orgAction
    class WaitAdmin,Publish,ReceiveApps,RejectEmail,WaitlistQueue,Assign,PostEvent,CloseEvent systemAction
    class CheckVerify,ReviewApps decision
```

---

## 3. The Platform Admin Journey

**Objective:** Maintain platform security, vet organizations to prevent fraudulent events, and utilize AI for strategic oversight.

_This workflow emphasizes the high-level moderation capabilities required to run a multi-tenant volunteer marketplace safely._

```mermaid
flowchart TD
    classDef adminAction fill:#faf5ff,stroke:#a855f7,stroke-width:2px,color:#6b21a8
    classDef systemAction fill:#f3f4f6,stroke:#9ca3af,stroke-width:2px,color:#374151
    classDef decision fill:#fef08a,stroke:#eab308,stroke-width:2px,color:#854d0e
    classDef danger fill:#fef2f2,stroke:#ef4444,stroke-width:2px,color:#991b1b

    Start(["Secure Admin Login"]) --> MainDash["Access Global Dashboard"]

    MainDash --> ActionChoice{"Select Operational Task"}

    ActionChoice -- Strategic Analysis --> AI_Report["Trigger 'Generate AI Report'"]
    AI_Report --> AI_Summary["Backend Fetches Live KPIs -> Sends to Gemini API"]
    AI_Summary --> ReadReport["Review Generated Health Summary"]

    ActionChoice -- Organization Moderation --> ReviewOrg["Review Pending Organization KYC"]
    ReviewOrg --> OrgDecision{"Is Organization Legitimate?"}
    OrgDecision -- Approve --> UnlockOrg["Unlock Organization Read/Write Access"]
    OrgDecision -- Reject --> BlockOrg["Hard Delete / Block Organization Account"]

    ActionChoice -- User Moderation --> ViewFlags["Audit Flagged Users & Poor Ratings"]
    ViewFlags --> UserDecision{"Does User Violate TOS?"}
    UserDecision -- No --> ClearFlag["Clear Warning / Dismiss Flag"]
    UserDecision -- Yes --> SuspendUser["Execute Account Suspension / IP Ban"]

    class Start,MainDash,AI_Report,ReadReport,ReviewOrg,ViewFlags adminAction
    class AI_Summary,UnlockOrg,ClearFlag systemAction
    class ActionChoice,OrgDecision,UserDecision decision
    class BlockOrg,SuspendUser danger
```

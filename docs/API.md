# API Documentation

Base URL:

```text
http://localhost:5000/api
```

Authenticated requests require:

```http
Authorization: Bearer <accessToken>
```

## Authentication

| Method | Path             | Roles         | Description                                     |
| ------ | ---------------- | ------------- | ----------------------------------------------- |
| POST   | `/auth/register` | Public        | Register a volunteer or organization            |
| POST   | `/auth/login`    | Public        | Login and receive access and refresh tokens     |
| POST   | `/auth/refresh`  | Public        | Rotate refresh token and receive new token pair |
| POST   | `/auth/logout`   | Authenticated | Revoke refresh token                            |
| GET    | `/auth/me`       | Authenticated | Return current user and role profile            |

Registration body:

```json
{
  "name": "Maya Chen",
  "email": "maya@example.com",
  "password": "Volunteer123!",
  "role": "volunteer",
  "location": "Austin, TX",
  "skills": ["mentoring", "first aid"],
  "interests": ["education"]
}
```

Organization registration body:

```json
{
  "name": "Jordan Lee",
  "organizationName": "Green Future Network",
  "email": "hello@example.org",
  "password": "Org123!",
  "role": "organization",
  "city": "Austin",
  "state": "TX"
}
```

## Volunteers

| Method | Path                     | Roles               | Description                                                  |
| ------ | ------------------------ | ------------------- | ------------------------------------------------------------ |
| GET    | `/volunteers/me`         | Volunteer           | Get own volunteer profile                                    |
| PUT    | `/volunteers/me`         | Volunteer           | Update phone, location, bio, skills, interests, availability |
| GET    | `/volunteers/me/history` | Volunteer           | Get applications, attendance, and certificates               |
| GET    | `/volunteers/me/hours`   | Volunteer           | Get hours, completed events, certificate count               |
| GET    | `/volunteers`            | Organization, Admin | Search volunteer profiles                                    |
| GET    | `/volunteers/:id`        | Organization, Admin | Get volunteer profile by ID                                  |

## Organizations

| Method | Path                        | Roles        | Description                     |
| ------ | --------------------------- | ------------ | ------------------------------- |
| GET    | `/organizations/me`         | Organization | Get own organization profile    |
| PUT    | `/organizations/me`         | Organization | Update organization profile     |
| GET    | `/organizations`            | Admin        | List organizations              |
| GET    | `/organizations/:id`        | Public       | Get public organization profile |
| PATCH  | `/organizations/:id/verify` | Admin        | Verify or unverify organization |

## Opportunities

| Method | Path                                         | Roles                      | Description                          |
| ------ | -------------------------------------------- | -------------------------- | ------------------------------------ |
| GET    | `/opportunities`                             | Public                     | Search open opportunities            |
| POST   | `/opportunities`                             | Organization, Admin        | Create opportunity                   |
| GET    | `/opportunities/:id`                         | Public                     | Get opportunity detail               |
| PUT    | `/opportunities/:id`                         | Owning Organization, Admin | Update opportunity                   |
| DELETE | `/opportunities/:id`                         | Owning Organization, Admin | Mark opportunity cancelled           |
| GET    | `/opportunities/:id/applications`            | Owning Organization, Admin | List applications for an opportunity |
| POST   | `/opportunities/:opportunityId/applications` | Volunteer                  | Apply for an opportunity             |

Opportunity filters:

```text
?search=river&category=Environment&location=Austin&skill=first aid&remote=false&startDate=2026-07-01&endDate=2026-07-31&page=1&limit=12
```

Create opportunity body:

```json
{
  "title": "River Cleanup Crew",
  "description": "Help remove litter and collect impact data.",
  "category": "Environment",
  "required_skills": ["teamwork", "outdoor work"],
  "location": "Austin, TX",
  "is_remote": false,
  "start_date": "2026-07-12",
  "end_date": "2026-07-12",
  "capacity": 40,
  "hours_estimate": 4,
  "status": "open"
}
```

## Applications

| Method | Path                       | Roles                      | Description                         |
| ------ | -------------------------- | -------------------------- | ----------------------------------- |
| GET    | `/applications/me`         | Volunteer                  | View own applications               |
| GET    | `/applications`            | Organization, Admin        | List applications                   |
| PATCH  | `/applications/:id/status` | Owning Organization, Admin | Approve, reject, waitlist, withdraw |

Review body:

```json
{
  "status": "approved",
  "review_notes": "Strong fit for event support."
}
```

## Events and Attendance

| Method | Path                          | Roles                      | Description                                          |
| ------ | ----------------------------- | -------------------------- | ---------------------------------------------------- |
| GET    | `/events`                     | Authenticated              | List events                                          |
| POST   | `/events`                     | Organization, Admin        | Create event                                         |
| GET    | `/events/me/assigned`         | Volunteer                  | View assigned events                                 |
| GET    | `/events/:id`                 | Authenticated              | Get event detail                                     |
| PUT    | `/events/:id`                 | Owning Organization, Admin | Update event                                         |
| DELETE | `/events/:id`                 | Owning Organization, Admin | Mark event cancelled                                 |
| GET    | `/events/:eventId/attendance` | Owning Organization, Admin | List attendance                                      |
| POST   | `/events/:eventId/attendance` | Owning Organization, Admin | Assign one or more volunteers                        |
| PATCH  | `/attendance/:id`             | Owning Organization, Admin | Update attendance status, check-in, check-out, hours |

Assign volunteers:

```json
{
  "volunteerIds": ["10000000-0000-0000-0000-000000000101"],
  "notes": "Approved application converted to assignment."
}
```

Update attendance:

```json
{
  "status": "attended",
  "check_in_at": "2026-07-12T09:00:00Z",
  "check_out_at": "2026-07-12T13:00:00Z",
  "hours": 4
}
```

## Certificates

| Method | Path                         | Roles                                       | Description                  |
| ------ | ---------------------------- | ------------------------------------------- | ---------------------------- |
| GET    | `/certificates/me`           | Volunteer                                   | List own certificates        |
| GET    | `/certificates`              | Organization, Admin                         | List certificates            |
| POST   | `/certificates`              | Organization, Admin                         | Generate certificate and PDF |
| GET    | `/certificates/:id/download` | Owner Volunteer, Owning Organization, Admin | Download PDF                 |

Create certificate:

```json
{
  "volunteer_id": "10000000-0000-0000-0000-000000000102",
  "event_id": "50000000-0000-0000-0000-000000000502",
  "opportunity_id": "30000000-0000-0000-0000-000000000302",
  "title": "Certificate of Volunteer Service",
  "hours": 5,
  "metadata": {
    "achievement": "Completed food distribution support"
  }
}
```

## Notifications

| Method | Path                      | Roles         | Description                     |
| ------ | ------------------------- | ------------- | ------------------------------- |
| GET    | `/notifications`          | Authenticated | List current user notifications |
| PATCH  | `/notifications/read-all` | Authenticated | Mark all notifications read     |
| PATCH  | `/notifications/:id/read` | Authenticated | Mark one notification read      |
| POST   | `/notifications`          | Admin         | Create notification for a user  |

## Admin

| Method | Path                      | Roles | Description                               |
| ------ | ------------------------- | ----- | ----------------------------------------- |
| GET    | `/admin/dashboard`        | Admin | Platform overview metrics                 |
| GET    | `/admin/users`            | Admin | Paginated user management                 |
| PATCH  | `/admin/users/:id/status` | Admin | Update user status                        |
| GET    | `/admin/monitoring`       | Admin | Recent audit logs and monitoring counters |

## Reports

| Method | Path                    | Roles               | Description                                            |
| ------ | ----------------------- | ------------------- | ------------------------------------------------------ |
| GET    | `/reports/organization` | Organization, Admin | Organization summary, statuses, hours                  |
| GET    | `/reports/platform`     | Admin               | Monthly hours, monthly applications, top organizations |

## Uploads

| Method | Path               | Roles         | Description                                         |
| ------ | ------------------ | ------------- | --------------------------------------------------- |
| POST   | `/uploads/profile` | Authenticated | Upload volunteer profile image or organization logo |

Use multipart form-data with field name `file`. Supported file types are JPEG, PNG, WebP, and PDF up to 5 MB.

## Error Format

```json
{
  "message": "Validation failed",
  "details": [
    {
      "type": "field",
      "msg": "Invalid value",
      "path": "email",
      "location": "body"
    }
  ]
}
```

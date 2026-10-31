# HustleHub+ Architecture

```text
                         SYSTEM BOUNDARY
┌─────────────────────────────────────────────────────────────┐
│                         HTTPS / TLS                         │
│                                                             │
│  ┌───────────────┐       REST/JWT       ┌────────────────┐ │
│  │ Users         │ ───────────────────> │ React Frontend │ │
│  │ Client        │                      └───────┬────────┘ │
│  │ Freelancer    │                              │          │
│  │ Admin         │                              │ HTTPS    │
│  └───────────────┘                              ▼          │
│                                      ┌────────────────────┐ │
│                                      │ Express Backend    │ │
│                                      │ Validation         │ │
│                                      │ Sanitisation       │ │
│                                      │ Rate Limiting      │ │
│                                      │ Helmet / CSP       │ │
│                                      │ JWT / RBAC         │ │
│                                      │ Error Handling     │ │
│                                      │ Audit Logging      │ │
│                                      └─────────┬──────────┘ │
│                                                │            │
│                                      ┌─────────▼──────────┐ │
│                                      │ MongoDB            │ │
│                                      │ Users              │ │
│                                      │ Gigs               │ │
│                                      │ Bookings           │ │
│                                      │ Transactions       │ │
│                                      └────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

Part 1 implements the Express backend, HTTPS, validation, JWT and controlled errors. Part 2 completes the MERN architecture with React and MongoDB.

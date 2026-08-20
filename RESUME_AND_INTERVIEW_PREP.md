# Connectly — Resume & Interview Prep

## Resume Bullet Points

Pick 2-3 depending on space. Adjust verbs/order to match the rest of your resume's style.

- **Built Connectly, a full-stack real-time chat application (MERN + Socket.IO)** supporting 1:1 and group messaging with live typing indicators, online presence, and delivered/read receipts; architected a shared services layer so REST and WebSocket handlers reuse identical business logic instead of duplicating it.

- **Implemented JWT-based authentication with httpOnly cookies and bcrypt password hashing**, enforcing authorization checks (not just authentication) on every mutating endpoint — e.g. verifying conversation membership before message access and admin role before group management — to prevent unauthorized data access.

- **Designed a MongoDB schema with purpose-built compound indexes** (`{conversation, createdAt}` for paginated message history, `{recipient, read, createdAt}` for notification feeds) and implemented offset pagination to avoid loading full conversation histories, plus integrated Cloudinary for media uploads to keep binary data out of the database.

*(Optional 4th bullet if you have room):*
- **Wrote an automated backend test suite (Jest + Supertest)** covering authentication, message authorization boundaries, and permission checks (e.g. only a message's sender can edit or delete-for-everyone), running against an isolated in-memory MongoDB instance.

---

## Short Project Description (for resume header/projects section)

> **Connectly** — A production-shaped real-time chat application built with React, Node.js, Express, Socket.IO, and MongoDB. Supports 1:1 and group messaging, live typing/presence/read-receipts, media sharing via Cloudinary, and JWT authentication. Deployed on Vercel and Render.
> [Live Demo] · [GitHub]

---

## 10 Technical Interview Questions & Strong Answers

**1. Why did you use both REST and Socket.IO instead of just one?**
REST is stateless and good for "give me data" operations — fetching conversation history, searching users, editing a profile. Sockets are for "tell me the instant something changes" — a new message arriving while I'm looking at a completely different screen. Trying to do everything over sockets makes standard things like pagination, caching, and auth middleware awkward; trying to do everything over REST means polling for real-time updates, which is both slower and wasteful.

**2. How does authentication work end to end, and how does it differ from authorization?**
On login, the server verifies the password with bcrypt, signs a JWT containing the user's ID, and sends it as an httpOnly cookie — meaning client-side JS can't read it, which limits XSS token theft. Every protected REST route runs it through `jwt.verify()` in middleware to attach `req.user`. Socket connections authenticate the same JWT at handshake time, before the connection is even accepted, so an unauthenticated socket never gets to join a room. **Authentication** answers "who are you" — that's the JWT check. **Authorization** answers "are you allowed to do *this specific thing*" — e.g. even a logged-in user can't edit someone else's message or add themselves to a group; every mutating controller separately checks resource ownership/membership before touching the database.

**3. Walk me through what happens when User A sends a message to User B.**
A's client emits `send_message` over the socket with the conversation ID and text. The server validates A is actually a participant, saves the message via a shared `messageService`, updates the conversation's denormalized `lastMessage` field, then broadcasts `receive_message` to everyone in that conversation's Socket.IO room — which includes B's client if B has that conversation open. It also emits a `new_notification` to B's personal room (`user:<B_id>`) regardless of whether B has that specific chat open, so their sidebar/badge updates live either way.

**4. What happens if User B is offline when the message is sent?**
The message is still saved to MongoDB with `deliveredTo` not yet including B — there's no special offline handling needed on write. When B reconnects, their client fetches conversations via REST, which naturally includes the new message since it's already persisted. Their client then fires a `message_delivered` event once it actually renders the message, updating the sender's UI from a single checkmark to a double checkmark.

**5. How do you avoid loading an entire conversation's message history at once?**
The `GET /api/messages/:conversationId` endpoint takes `page`/`limit` query params and uses `.skip().limit()` against a compound index on `{conversation, createdAt}` — so even a conversation with tens of thousands of messages only ever loads 30 at a time, sorted newest-first, then reversed client-side for natural top-to-bottom rendering.

**6. Why put shared logic in a `services/` layer instead of directly in controllers or socket handlers?**
Both the REST endpoint (`POST /api/messages`) and the socket event (`send_message`) need to create a message identically — validate the sender is a participant, save it, update the conversation's last-message preview. If that logic lived separately in the controller and the socket handler, they'd inevitably drift apart as the app evolved — e.g. someone fixes a bug in one path and forgets the other. Having one `messageService.createMessage()` function that both call means there's exactly one code path, so there's nothing to keep in sync.

**7. How do you prevent memory leaks or duplicate event listeners with Socket.IO in React?**
Every `useEffect` that calls `socket.on(...)` returns a cleanup function that calls the matching `socket.off(...)`. This matters because without it, every time a component re-renders or a conversation changes, you'd stack up another listener for the same event — so a single incoming message would eventually trigger the handler multiple times. The socket connection itself is also a singleton (`socket.js`), created once per login and destroyed on logout, rather than being recreated on every component mount.

**8. How would this app need to change to support 1 million users?**
A few concrete changes: (1) Socket.IO would need the Redis adapter, since a single server process can only hold sockets for the users connected to *it* — with multiple server instances behind a load balancer, a message sent by a user on Instance A needs Redis pub/sub to reach a recipient connected to Instance B. (2) The `isOnline`/presence broadcast currently does `io.emit()` to everyone — at scale that should only notify users who actually share a conversation with the user going online/offline, not the entire connected user base. (3) MongoDB would likely need read replicas and/or sharding by conversation ID for very large deployments. (4) Media delivery would benefit from a CDN in front of Cloudinary URLs, which Cloudinary already provides by default.

**9. Why store the JWT in an httpOnly cookie instead of localStorage?**
localStorage is readable by any JavaScript running on the page — including injected scripts from an XSS vulnerability — which means a successful XSS attack can directly steal the token. An httpOnly cookie is invisible to JavaScript entirely; it's automatically attached by the browser to requests but can never be read or exfiltrated by a script. The tradeoff is needing `sameSite`/CORS configured correctly for cross-origin requests in production, which is exactly why `withCredentials: true` and matching `CLIENT_URL` values matter.

**10. What are the current scalability/design limitations of this project, and how would you address them?**
Three honest ones: (1) No horizontal scaling for Socket.IO without adding Redis, as mentioned above. (2) Offset-based pagination (`skip/limit`) gets slower on very deep pages since MongoDB still has to walk past all skipped documents — cursor-based pagination (using the last message's `createdAt`/`_id` as a cursor) would scale better for extremely long conversation histories. (3) The free-tier Render deployment spins down on inactivity, adding cold-start latency — a paid always-on instance or a different host would fix that in a real production deployment.

---

## Notes on Honesty for This Section

Per your original instructions, I haven't invented any metrics ("handled 10K users," "99.9% uptime," etc.) since none of these were actually benchmarked. If you'd like, once the app is deployed, you could run a simple load test (e.g. with `k6` or `artillery`) against the Socket.IO layer and get a real number to cite — that would be a genuinely strong, defensible addition to bullet #1.

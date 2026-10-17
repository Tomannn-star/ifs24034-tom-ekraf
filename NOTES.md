# Implementation & Security Notes

## What I broke and how I fixed it

During the audit of the product form modal and pages, I diagnosed that form input fields rejected keystrokes because they were bound to TanStack Form using the imperative getter `form.getFieldValue(...)` alongside `form.setFieldValue(...)`. Because TanStack Form does not trigger component-level re-renders when setting field values through imperative helpers, the input values remained locked to their initial snapshot without updating reactively on each keystroke. I fixed this by refactoring the form architecture to use TanStack Form's reactive `<form.Field>` component, binding `value={field.state.value}`, `onChange={(e) => field.handleChange(e.target.value)}`, and `onBlur={field.handleBlur}`, which reactively re-renders individual fields, validates constraints, and smoothly persists typing. Furthermore, I resolved pre-existing Biome check errors in `styles.css` (moving `@import "tw-animate-css"` ahead of plugin declarations and resolving shorthand background property conflicts) and ensured static script safety in `__root.tsx`.

---

## Security Enhancements & Attack Mitigations

### 1. Server-Side Zod Input Validation
Every server function (`createProduct`, `updateProduct`, `deleteProduct`, `updateUserRole`, `deleteUser`) enforces rigorous schema validation using Zod for string lengths, positive numerical values, integer stock counts, and image URL/data URI limits.  
**Attack Prevented:** Prevents *Parameter Tampering*, *Oversized Payload Denial-of-Service (DoS)*, and memory corruption where malicious actors bypass client-side form controls to submit corrupt or malicious payloads.

### 2. Server-Enforced Authorization (`requireAdmin` & `requireAuth`)
All mutating server operations and sensitive administrative queries strictly verify active sessions on the server using `requireAdmin()` and `requireAuth()`, reading headers directly via TanStack Start's `getRequest()`.  
**Attack Prevented:** Prevents *Broken Object Level Authorization (BOLA / IDOR)* and *Privilege Escalation* where unauthenticated or low-privilege users attempt to invoke backend mutation functions directly.

### 3. Prevention of Self-Role-Demotion and Self-Deletion
Server-side checks in `updateUserRole` and `deleteUser` explicitly compare the requesting administrator's ID against the target user ID to reject self-demotion to standard user and self-deletion.  
**Attack Prevented:** Prevents *Administrative Lockout* and *Internal Privilege Sabotage*, ensuring active administrators cannot inadvertently or maliciously orphan administrative privileges.

### 4. Last-Administrator Lockout Protection
`deleteUser` verifies that at least two administrators exist before allowing the deletion of any administrator account.  
**Attack Prevented:** Prevents *Permanent System Lockout (Administrative DoS)*, ensuring the management console always retains at least one reachable administrator.

### 5. In-Memory Rate Limiting on Authentication Endpoints
Better Auth configuration has been enhanced with rate limiting (`window: 60`, `max: 10`) on authentication endpoints in `src/lib/auth.ts`.  
**Attack Prevented:** Mitigates *Brute-Force Attacks*, *Dictionary Attacks*, and *Credential Stuffing* by throttling rapid repeated login attempts.

### 6. Hardened Session Cookie Configuration
Session cookies are configured with `httpOnly: true`, `sameSite: "lax"`, explicit expiration timeouts, and automatic `secure` flags in production environments.  
**Attack Prevented:** Protects against *Cross-Site Scripting (XSS) Session Hijacking* by preventing client JavaScript from accessing session tokens, while mitigating *Cross-Site Request Forgery (CSRF)*.

### 7. Product Image Dimension and Payload Capping (Max 512px)
Product image inputs are inspected client-side with automatic canvas downscaling / rejection if dimensions exceed 512x512px, coupled with server-side payload size and URI format validation.  
**Attack Prevented:** Prevents *Pixel Flood Attacks* and *Bandwidth/Memory Exhaustion* where attackers upload multi-megabyte images to degrade serverless function performance.

### 8. Idempotent Seed Process
The `/setup` seed server function verifies preexisting admin accounts and sample data before executing mutations, wrapping user creation in safe fallback logic.  
**Attack Prevented:** Prevents *Application Crash Denial-of-Service* caused by unhandled unique-constraint violations during cold-starts or automated redeployments.


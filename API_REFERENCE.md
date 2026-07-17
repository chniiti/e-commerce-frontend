# TrendDrop Backend — API Reference

Single source of truth for frontend integration. Generated directly from the implemented controllers, DTOs, and security configuration.

- **Base URL (dev):** `http://localhost:8081` (dev profile; default profile uses port `8080`)
- **All endpoints are prefixed** with the paths shown below (no extra context path).
- **Content type:** `application/json` for all request/response bodies (except the payment webhook, which also accepts form-urlencoded).
- **Swagger UI:** `GET /swagger-ui.html` · OpenAPI JSON: `GET /api-docs`

---

## Table of Contents

1. [Conventions](#conventions)
2. [Authentication & Roles](#authentication--roles)
3. [Error Responses](#error-responses)
4. [Shared Types](#shared-types)
5. [Enums](#enums)
6. [Auth Module](#auth-module--apiauth)
7. [User Module](#user-module--apiusers)
8. [Catalog / Products Module](#catalog--products-module--apiproducts)
9. [Order Module](#order-module--apiorders)
10. [Payment Module](#payment-module--apipayments)
11. [Trend Research Module](#trend-research-module--apitrends-research)
12. [Campaign Module](#campaign-module--apicampaigns)
13. [Delivery Module](#delivery-module--apidelivery)
14. [Dashboard Module](#dashboard-module--apidashboard)
15. [Audit Module](#audit-module--apiaudit-logs)
16. [Stock Module](#stock-module--apistock)
17. [WebSocket Notifications](#websocket-notifications)

---

## Conventions

Every REST endpoint returns the same wrapper:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data: T | null;          // null on errors and on Void responses
  message: string | null;  // human-readable status or error message
  timestamp: string;       // ISO-8601 instant, e.g. "2026-07-16T17:04:11.123Z"
}
```

Every list endpoint is paginated with `page` (0-based, default `0`) and `size` (default `20`) query params and returns:

```typescript
interface PagedResponse<T> {
  content: T[];
  page: number;          // current page index (0-based)
  size: number;          // page size requested
  totalElements: number; // total rows across all pages
  totalPages: number;
}
```

All timestamps are ISO-8601 instants (UTC) serialized as strings, e.g. `"2026-07-16T14:30:00Z"`. `LocalDate` fields are `"YYYY-MM-DD"` strings. `BigDecimal` fields serialize as JSON numbers.

---

## Authentication & Roles

- **Scheme:** JWT Bearer. Send `Authorization: Bearer <accessToken>` on every protected request.
- **Access token:** ~15 min lifetime. **Refresh token:** ~7 days — exchange it at `POST /api/auth/refresh`. The refresh endpoint rejects access tokens (tokens carry a type claim).
- **Roles:** `ADMIN`, `TRENDS_RESPONSIBLE`, `CUSTOMER`. Customers do **not** log in — all customer-facing flows (browse, reserve, track) are anonymous/public.

Role legend used per endpoint below:

| Label | Meaning |
|---|---|
| `PUBLIC` | No token required |
| `ADMIN` | Requires JWT with role ADMIN |
| `ADMIN, TRENDS_RESPONSIBLE` | Either role accepted |

**Rate limiting (Bucket4j, 5 requests/min per IP):** applies to `POST /api/auth/login` and `POST /api/orders`. Exceeding it returns **429** with `ApiResponse` body: `{"success": false, "message": "Too many requests. Please try again later.", ...}`.

---

## Error Responses

All errors use the same `ApiResponse` shape with `success: false`, `data: null`, and `message` set:

| Status | Trigger |
|---|---|
| `400 Bad Request` | Bean-validation failure (message = comma-joined field errors) or domain `BadRequestException` (e.g. invalid state transition, bad webhook signature, product not orderable) |
| `401 Unauthorized` | Missing/invalid/expired JWT on a protected endpoint; wrong credentials on login; invalid refresh token |
| `403 Forbidden` | Valid JWT but insufficient role (`message: "Access denied"`) |
| `404 Not Found` | Resource does not exist (unknown id, slug, tracking id) |
| `409 Conflict` | `InsufficientStockException` — reservation attempted with no stock left |
| `429 Too Many Requests` | Rate limit exceeded on `POST /api/auth/login` or `POST /api/orders` |
| `500 Internal Server Error` | Unexpected error (`message: "An unexpected error occurred"`) |

Example error body:

```json
{
  "success": false,
  "data": null,
  "message": "Product not found with id: 42",
  "timestamp": "2026-07-16T14:30:00Z"
}
```

---

## Shared Types

```typescript
// ISO-8601 UTC instant string, e.g. "2026-07-16T14:30:00Z"
type Instant = string;
// "YYYY-MM-DD"
type LocalDate = string;
```

## Enums

```typescript
type Role = "ADMIN" | "TRENDS_RESPONSIBLE" | "CUSTOMER";

type ProductStatus =
  | "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "LIVE"
  | "PEAK" | "DECLINING" | "ARCHIVED" | "REJECTED";

type PaymentMethod = "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "COD";

type OrderStatus =
  | "RESERVED" | "CONFIRMED" | "PROCESSING"
  | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

type TrendResearchStatus =
  | "RESEARCHING" | "SOURCING" | "READY" | "LIVE"
  | "PEAK" | "DECLINING" | "ARCHIVED";

type Platform = "SNAPCHAT" | "INSTAGRAM" | "TIKTOK" | "FACEBOOK";
```

---

## Auth Module — `/api/auth`

### Types

```typescript
interface RegisterRequest {
  name: string;        // required, non-blank, max 255
  email: string;       // required, valid email, max 255
  phone?: string;      // optional; if present must match ^\+?[0-9]{8,15}$
  password: string;    // required, 8–72 characters
  role?: Role;         // optional; defaults to TRENDS_RESPONSIBLE.
                       // ADMIN only allowed when bootstrapping the first user.
}

interface LoginRequest {
  email: string;       // required, valid email
  password: string;    // required, non-blank
}

interface RefreshTokenRequest {
  refreshToken: string; // required, non-blank; must be a REFRESH-type token
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;   // access-token lifetime in SECONDS (e.g. 900)
  email: string;
  role: Role;
}
```

### `POST /api/auth/register` — PUBLIC

Register a staff user (ADMIN bootstrap or TRENDS_RESPONSIBLE).

- **Body:** `RegisterRequest`
- **201:** `ApiResponse<AuthResponse>` (`message: "Registration successful"`)
- **Errors:** `400` validation failure or email already registered

### `POST /api/auth/login` — PUBLIC (rate-limited 5/min/IP)

- **Body:** `LoginRequest`
- **200:** `ApiResponse<AuthResponse>` (`message: "Login successful"`)
- **Errors:** `400` validation; `401` bad credentials or disabled account; `429` rate limit

### `POST /api/auth/refresh` — PUBLIC

- **Body:** `RefreshTokenRequest`
- **200:** `ApiResponse<AuthResponse>` (`message: "Token refreshed"`) — returns a **new** access + refresh token pair
- **Errors:** `400` validation; `401` expired/invalid refresh token, or an access token passed instead of a refresh token

---

## User Module — `/api/users`

**All endpoints: ADMIN only** (class-level `@PreAuthorize("hasRole('ADMIN')")`).

### Types

```typescript
interface UserDto {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  enabled: boolean;
  createdAt: Instant;
}

interface CreateUserRequest {
  name: string;      // required, max 255
  email: string;     // required, valid email, max 255
  phone?: string;    // optional; ^\+?[0-9]{8,15}$
  password: string;  // required, 8–72 characters
  role: Role;        // required
}

interface UpdateRoleRequest {
  role: Role;        // required
}
```

### `GET /api/users` — ADMIN

- **Query:** `page` (default 0), `size` (default 20)
- **200:** `ApiResponse<PagedResponse<UserDto>>`
- **Errors:** `401`, `403`

### `GET /api/users/{id}` — ADMIN

- **Path:** `id` (number)
- **200:** `ApiResponse<UserDto>`
- **Errors:** `401`, `403`, `404` unknown user

### `POST /api/users` — ADMIN

- **Body:** `CreateUserRequest`
- **201:** `ApiResponse<UserDto>` (`message: "User created"`)
- **Errors:** `400` validation or duplicate email; `401`; `403`

### `PUT /api/users/{id}/suspend` — ADMIN

Disables login for the user.

- **200:** `ApiResponse<UserDto>` (`message: "User suspended"`)
- **Errors:** `401`, `403`, `404`

### `PUT /api/users/{id}/activate` — ADMIN

- **200:** `ApiResponse<UserDto>` (`message: "User activated"`)
- **Errors:** `401`, `403`, `404`

### `PUT /api/users/{id}/role` — ADMIN

- **Body:** `UpdateRoleRequest`
- **200:** `ApiResponse<UserDto>` (`message: "Role updated"`)
- **Errors:** `400` validation; `401`; `403`; `404`

---

## Catalog / Products Module — `/api/products`

### Types

```typescript
interface VariantDto {
  id?: number;          // present in responses; omit when creating
  color: string | null;
  sku: string;          // required, non-blank
  stockQty: number;     // required, >= 0
  imageUrl?: string | null;
  swatchHex?: string | null;
  initialStockQty?: number | null;
  spinFrames?: string[]; // optional 24–36 frame URLs for 360° spin
}

interface LandingPageDto {
  id?: number;               // present in responses
  productId?: number;        // present in responses
  heroMediaUrl: string | null;
  sectionsJson: string | null; // JSON string with page sections (frontend-defined shape)
  urgencyCounter: number | null;
  countdownEnd: Instant | null;
}

interface ProductDto {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  status: ProductStatus;
  sellPrice: number;
  stockQty: number;
  launchStart: Instant | null;
  launchEnd: Instant | null;
}

// extends ProductDto
interface ProductDetailDto extends ProductDto {
  variants: VariantDto[];
  landingPage: LandingPageDto | null;
}

interface CreateProductRequest {
  name: string;              // required, max 255
  description?: string;
  category: string;          // required, max 100
  costPrice: number;         // required, > 0
  sellPrice: number;         // required, > 0
  stockQty: number;          // required, >= 0
  launchStart?: Instant;
  launchEnd?: Instant;
  variants?: VariantDto[];   // each validated (sku required, stockQty >= 0)
  landingPage?: LandingPageDto;
}

// All fields optional — only provided fields are updated
interface UpdateProductRequest {
  name?: string;             // max 255
  description?: string;
  category?: string;         // max 100
  costPrice?: number;        // > 0
  sellPrice?: number;        // > 0
  stockQty?: number;         // >= 0
  launchStart?: Instant;
  launchEnd?: Instant;
  variants?: VariantDto[];
  landingPage?: LandingPageDto;
}
```

### `GET /api/products` — PUBLIC

Browse **LIVE** products only. Redis-cached (~60s TTL).

- **Query:** `page` (default 0), `size` (default 20)
- **200:** `ApiResponse<PagedResponse<ProductDto>>`

### `GET /api/products/{slug}` — PUBLIC

Landing-page detail by slug. Redis-cached.

- **Path:** `slug` (string)
- **200:** `ApiResponse<ProductDetailDto>`
- **Errors:** `404` unknown slug or product not publicly visible

### `GET /api/products/manage` — ADMIN, TRENDS_RESPONSIBLE

Admin sees all products; Trends Responsible sees only own.

- **Query:** `status` (optional `ProductStatus`), `page`, `size`
- **200:** `ApiResponse<PagedResponse<ProductDto>>`
- **Errors:** `400` invalid status value; `401`; `403`

### `GET /api/products/manage/{id}` — ADMIN, TRENDS_RESPONSIBLE

- **Path:** `id` (number)
- **200:** `ApiResponse<ProductDetailDto>`
- **Errors:** `401`; `403` (incl. Trends Responsible accessing another creator's product); `404`

### `POST /api/products` — ADMIN, TRENDS_RESPONSIBLE

Creates product in `PENDING_APPROVAL` status (creator cannot self-approve).

- **Body:** `CreateProductRequest`
- **201:** `ApiResponse<ProductDto>` (`message: "Product created"`)
- **Errors:** `400` validation; `401`; `403`

### `PUT /api/products/{id}` — ADMIN, TRENDS_RESPONSIBLE

Trends Responsible may only update own products.

- **Body:** `UpdateProductRequest`
- **200:** `ApiResponse<ProductDto>` (`message: "Product updated"`)
- **Errors:** `400` validation; `401`; `403` not owner; `404`

### `PUT /api/products/{id}/approve` — ADMIN

Approves and sets the product **LIVE**. Evicts product caches.

- **200:** `ApiResponse<ProductDto>` (`message: "Product approved"`)
- **Errors:** `400` not in an approvable state; `401`; `403`; `404`

### `PUT /api/products/{id}/reject` — ADMIN

- **200:** `ApiResponse<ProductDto>` (`message: "Product rejected"`)
- **Errors:** `400` not pending approval; `401`; `403`; `404`

---

## Order Module — `/api/orders`

### Types

```typescript
interface CreateOrderRequest {
  firstName: string;          // required, max 100
  lastName: string;           // required, max 100
  phone: string;              // required, ^\+?[0-9]{8,15}$
  email?: string;             // optional; valid email, max 255
  deliveryLocation: string;   // required, max 500
  productId: number;          // required
  variantId?: number;         // optional
  paymentMethod: PaymentMethod; // required
}

interface PaymentInitResponse {
  orderTrackingId: string;
  checkoutUrl: string | null;       // hosted checkout URL — redirect the customer here.
                                    // null for COD orders (no gateway involved).
  paymentId: string | null;         // local payment record id; null for COD
  providerPaymentId: string | null; // Dibsy payment id (e.g. "pt_..."); null for COD
}

interface OrderTrackingResponse {
  trackingId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  productName: string;
  variant: string | null;
  deliveryLocation: string;
  createdAt: Instant;
  updatedAt: Instant;
}

interface OrderDto {
  id: number;
  trackingId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string | null;
  deliveryLocation: string;
  productId: number;
  variantId: number | null;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  totalPrice: number;
  createdAt: Instant;
}

interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus; // required
}
```

### `POST /api/orders` — PUBLIC (rate-limited 5/min/IP)

Creates a reservation. Stock is decremented atomically at reservation time.

- **Behavior by payment method:**
  - `COD` → order created directly as `CONFIRMED`, `paymentStatus: PENDING` (collected on delivery). `checkoutUrl`, `paymentId`, `providerPaymentId` are `null`.
  - `CARD` / `APPLE_PAY` / `GOOGLE_PAY` → order created as `RESERVED`; a Dibsy payment session is initiated and `checkoutUrl` returned for redirect.
- **Body:** `CreateOrderRequest`
- **201:** `ApiResponse<PaymentInitResponse>` (`message: "Order reserved"`)
- **Errors:** `400` validation or product not orderable (not LIVE); `404` unknown product/variant; `409` insufficient stock; `429` rate limit

### `GET /api/orders/track/{trackingId}` — PUBLIC

- **Path:** `trackingId` (string, UUID issued at reservation)
- **200:** `ApiResponse<OrderTrackingResponse>`
- **Errors:** `404` unknown tracking id

### `GET /api/orders` — ADMIN, TRENDS_RESPONSIBLE

Trends Responsible only sees orders for own products.

- **Query:** `productId` (optional number), `page`, `size`
- **200:** `ApiResponse<PagedResponse<OrderDto>>`
- **Errors:** `401`; `403`

### `PUT /api/orders/{id}/status` — ADMIN, TRENDS_RESPONSIBLE

- **Path:** `id` (number, the internal order id — not the tracking id)
- **Body:** `UpdateOrderStatusRequest`
- **200:** `ApiResponse<OrderDto>` (`message: "Order status updated"`)
- **Errors:** `400` validation/invalid transition; `401`; `403`; `404`

---

## Payment Module — `/api/payments`

### `POST /api/payments/webhook/{provider}` — PUBLIC (signature-verified)

Gateway callback receiver (currently `provider = dibsy`). **Not intended for frontend use** — documented for completeness/testing.

- **Path:** `provider` (string, e.g. `dibsy`)
- **Headers:** signature required in **one** of:
  - `X-Dibsy-Signature: <hex HMAC-SHA256 of raw body>`
  - `X-Signature: sha256=<hex HMAC>` (the `sha256=` prefix is allowed on either header)
- **Body:** raw JSON string from the gateway. Recognized fields:

```typescript
interface DibsyWebhookBody {
  id: string;       // provider payment id (matched against stored transactionRef)
  status: string;   // "succeeded" | "paid" | "failed" | "canceled" | ...
  metadata?: {
    order_id?: string;
    tracking_id?: string;
  };
}
```

- **Effects:** on success → `Payment.status = PAID`, `Order.orderStatus = CONFIRMED` (stock already held at reservation — not re-decremented). On failure → `Order.orderStatus = CANCELLED`, `Payment.status = FAILED`, held stock released.
- **200:** `ApiResponse<null>` (`message: "Webhook received"`)
- **Errors:** `400` missing/invalid signature or unknown provider; `404` unknown payment reference

---

## Trend Research Module — `/api/trends-research`

**All endpoints: ADMIN, TRENDS_RESPONSIBLE** (class-level). Trends Responsible operates on **own entries only**; Admin sees all.

### Types

```typescript
interface TrendResearchDto {
  id: number;
  productName: string;
  source: string | null;
  evidenceNotes: string | null;
  score: number | null;
  status: TrendResearchStatus;
  trendsResponsibleId: number;
}

interface CreateTrendResearchRequest {
  productName: string;          // required, non-blank
  source?: string;
  evidenceNotes?: string;
  score?: number;
  status?: TrendResearchStatus;
}
```

### `GET /api/trends-research` — ADMIN, TRENDS_RESPONSIBLE

- **Query:** `page`, `size`
- **200:** `ApiResponse<PagedResponse<TrendResearchDto>>`

### `GET /api/trends-research/{id}` — ADMIN, TRENDS_RESPONSIBLE

- **200:** `ApiResponse<TrendResearchDto>`
- **Errors:** `401`; `403` not owner; `404`

### `POST /api/trends-research` — ADMIN, TRENDS_RESPONSIBLE

- **Body:** `CreateTrendResearchRequest`
- **201:** `ApiResponse<TrendResearchDto>` (`message: "Created"`)
- **Errors:** `400` validation; `401`; `403`

### `PUT /api/trends-research/{id}` — ADMIN, TRENDS_RESPONSIBLE

- **Body:** `CreateTrendResearchRequest` (same shape as create)
- **200:** `ApiResponse<TrendResearchDto>` (`message: "Updated"`)
- **Errors:** `400`; `401`; `403` not owner; `404`

### `DELETE /api/trends-research/{id}` — ADMIN, TRENDS_RESPONSIBLE

- **200:** `ApiResponse<null>` (`message: "Deleted"`)
- **Errors:** `401`; `403` not owner; `404`

---

## Campaign Module — `/api/campaigns`

**All endpoints: ADMIN, TRENDS_RESPONSIBLE** (class-level).

### Types

```typescript
interface CampaignDto {
  id: number;
  productId: number;
  platform: Platform;
  utmSource: string | null;
  budgetNote: string | null;
  startDate: LocalDate | null; // "YYYY-MM-DD"
}

interface CreateCampaignRequest {
  productId: number;    // required
  platform: Platform;   // required
  utmSource?: string;
  budgetNote?: string;
  startDate?: LocalDate;
}
```

### `GET /api/campaigns` — ADMIN, TRENDS_RESPONSIBLE

- **Query:** `page`, `size`
- **200:** `ApiResponse<PagedResponse<CampaignDto>>`

### `POST /api/campaigns` — ADMIN, TRENDS_RESPONSIBLE

- **Body:** `CreateCampaignRequest`
- **201:** `ApiResponse<CampaignDto>` (`message: "Created"`)
- **Errors:** `400` validation; `401`; `403`; `404` unknown product

### `PUT /api/campaigns/{id}` — ADMIN, TRENDS_RESPONSIBLE

- **Body:** `CreateCampaignRequest`
- **200:** `ApiResponse<CampaignDto>` (`message: "Updated"`)
- **Errors:** `400`; `401`; `403`; `404`

---

## Delivery Module — `/api/delivery`

### Types

```typescript
interface DeliveryTrackingDto {
  id: number;
  orderId: number;
  status: string;            // free-form courier status text
  courier: string | null;
  eta: Instant | null;
  deliveredAt: Instant | null;
}

interface UpdateDeliveryRequest {
  orderId: number;    // required — internal order id
  status: string;     // required, non-blank
  courier?: string;
  eta?: Instant;
  deliveredAt?: Instant;
}
```

### `GET /api/delivery/track/{trackingId}` — PUBLIC

Delivery status by **order tracking id** (the UUID from the reservation). If no courier record exists yet, returns a placeholder with `status` mirroring the current `OrderStatus` (and `id`, `courier`, `eta`, `deliveredAt` null).

- **200:** `ApiResponse<DeliveryTrackingDto>`
- **Errors:** `404` unknown tracking id

### `PUT /api/delivery` — ADMIN, TRENDS_RESPONSIBLE

Creates or updates the delivery tracking record for an order.

- **Body:** `UpdateDeliveryRequest`
- **200:** `ApiResponse<DeliveryTrackingDto>`
- **Errors:** `400` validation; `401`; `403`; `404` unknown order

---

## Dashboard Module — `/api/dashboard`

### Types

```typescript
interface DashboardStatsDto {
  totalRevenue: number;         // sum over paid/confirmed orders
  activeTrends: number;
  conversionRate: number;       // 0–100
  slaCompliancePercent: number; // 0–100 (48h delivery SLA)
}
```

### `GET /api/dashboard` — ADMIN

- **200:** `ApiResponse<DashboardStatsDto>`
- **Errors:** `401`; `403`

---

## Audit Module — `/api/audit-logs`

### Types

```typescript
interface AuditLogDto {
  id: number;
  actorId: number;
  action: string;      // e.g. "PRODUCT_APPROVED", "ROLE_CHANGED"
  entityType: string;  // e.g. "Product", "User"
  entityId: number;
  createdAt: Instant;
}
```

### `GET /api/audit-logs` — ADMIN

- **Query:** `page`, `size`
- **200:** `ApiResponse<PagedResponse<AuditLogDto>>`
- **Errors:** `401`; `403`

---

## Stock Module — `/api/stock`

**All endpoints: ADMIN, TRENDS_RESPONSIBLE** (class-level, never public).

### Types

```typescript
interface StockItemDto {
  variantId: number;
  productId: number;
  productName: string;
  productStatus: ProductStatus;
  sku: string;
  color: string | null;
  stockQty: number;
}

interface AdjustStockRequest {
  quantity: number;  // required, >= 0 — the NEW absolute stock quantity
  reason?: string;   // optional, max 500
}

interface StockAdjustmentLogDto {
  id: number;
  variantId: number;
  previousQty: number;
  newQty: number;
  adjustedBy: number;  // user id of the staff member
  reason: string | null;
  adjustedAt: Instant;
}
```

### `GET /api/stock` — ADMIN, TRENDS_RESPONSIBLE

- **Query:** `page`, `size`
- **200:** `ApiResponse<PagedResponse<StockItemDto>>`

### `GET /api/stock/low` — ADMIN, TRENDS_RESPONSIBLE

Variants below the low-stock threshold.

- **Query:** `page`, `size`
- **200:** `ApiResponse<PagedResponse<StockItemDto>>`

### `GET /api/stock/{variantId}` — ADMIN, TRENDS_RESPONSIBLE

- **200:** `ApiResponse<StockItemDto>`
- **Errors:** `401`; `403`; `404` unknown variant

### `PUT /api/stock/{variantId}` — ADMIN, TRENDS_RESPONSIBLE

Manual restock/correction. Sets the variant's stock to the **absolute** `quantity` value (not a delta), keeps the product's aggregate stock in sync, and writes an adjustment log.

- **Body:** `AdjustStockRequest`
- **200:** `ApiResponse<StockAdjustmentLogDto>` (`message: "Stock adjusted"`)
- **Errors:** `400` validation, quantity equals current stock ("New quantity is the same as current stock"), or adjustment would make product stock negative; `401`; `403`; `404`

---

## WebSocket Notifications

Real-time push of new order reservations to staff dashboards.

| | |
|---|---|
| **Endpoint** | `http://localhost:8081/ws` (SockJS-enabled STOMP endpoint; use a SockJS client or raw WebSocket at `ws://localhost:8081/ws/websocket`) |
| **Protocol** | STOMP over SockJS |
| **Auth** | JWT **access token** in the STOMP `CONNECT` frame headers: `Authorization: Bearer <accessToken>` (a plain `token` header is also accepted). The HTTP handshake itself is open; auth is enforced on CONNECT. |
| **Allowed roles** | `ADMIN`, `TRENDS_RESPONSIBLE` only — enforced at both CONNECT and SUBSCRIBE. Others get the connection rejected. |
| **Subscription topic** | `/topic/orders` |
| **When pushed** | After a reservation transaction commits (`POST /api/orders` success), asynchronously. |

**Payload pushed to `/topic/orders`** (note: this is the raw message — **not** wrapped in `ApiResponse`):

```typescript
interface OrderNotificationMessage {
  orderId: number;
  trackingId: string;
  productName: string;
  variant: string | null;
  deliveryLocation: string;
  customerName: string;   // "firstName lastName"
  phone: string;
}
```

**Client example (STOMP.js):**

```javascript
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

const client = new Client({
  webSocketFactory: () => new SockJS("http://localhost:8081/ws"),
  connectHeaders: { Authorization: `Bearer ${accessToken}` },
  onConnect: () => {
    client.subscribe("/topic/orders", (frame) => {
      const notification = JSON.parse(frame.body); // OrderNotificationMessage
      console.log("New order:", notification);
    });
  },
});
client.activate();
```
 
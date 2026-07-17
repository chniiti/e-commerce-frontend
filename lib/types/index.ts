/** Matches backend Role enum */
export type UserRole = "ADMIN" | "TRENDS_RESPONSIBLE" | "CUSTOMER";

/** Matches backend ProductStatus enum */
export type ProductStatus =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "APPROVED"
  | "LIVE"
  | "PEAK"
  | "DECLINING"
  | "ARCHIVED"
  | "REJECTED";

/** Matches backend PaymentMethod enum */
export type PaymentMethod = "CARD" | "APPLE_PAY" | "GOOGLE_PAY" | "COD";

/** Matches backend OrderStatus enum */
export type OrderStatus =
  | "RESERVED"
  | "CONFIRMED"
  | "PROCESSING"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

/** Matches backend PaymentStatus enum */
export type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "REFUNDED";

/** Matches backend ApiResponse<T> */
export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  message: string | null;
  timestamp: string;
}

/** Matches backend PagedResponse<T> */
export interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

/** Matches backend LoginRequest */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Matches backend RefreshTokenRequest */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/** Matches backend RegisterRequest */
export interface RegisterRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role?: UserRole;
}

/** Matches backend AuthResponse */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: "Bearer";
  expiresIn: number;
  email: string;
  role: UserRole;
}

/** Client-side user derived from AuthResponse */
export interface AuthUser {
  email: string;
  role: UserRole;
}

/** Matches backend ProductDto */
export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  status: ProductStatus;
  sellPrice: number;
  stockQty: number;
  launchStart: string | null;
  launchEnd: string | null;
}

/** Matches backend VariantDto */
export interface ProductVariant {
  id: number;
  color: string | null;
  sku: string;
  stockQty: number;
  imageUrl?: string | null;
  swatchHex?: string | null;
  initialStockQty?: number | null;
  spinFrames?: string[];
}

/** Matches backend LandingPageDto */
export interface LandingPage {
  id: number;
  productId: number;
  heroMediaUrl: string | null;
  sectionsJson: string | null;
  urgencyCounter: number | null;
  countdownEnd: string | null;
}

/** Matches backend ProductDetailDto */
export interface ProductDetail extends Product {
  variants: ProductVariant[];
  landingPage: LandingPage | null;
}

/** Matches backend CreateOrderRequest */
export interface CreateOrderRequest {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  deliveryLocation: string;
  productId: number;
  variantId?: number;
  paymentMethod: PaymentMethod;
}

/** Matches backend OrderDto */
export interface Order {
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
  createdAt: string;
}

/** Matches backend PaymentInitResponse */
export interface PaymentInitResponse {
  orderTrackingId: string;
  checkoutUrl: string | null;
  paymentId: string | null;
  providerPaymentId: string | null;
}

/** Matches backend OrderTrackingResponse */
export interface OrderTrackingResponse {
  trackingId: string;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  productName: string;
  variant: string | null;
  deliveryLocation: string;
  createdAt: string;
  updatedAt: string;
}

/** Matches backend OrderNotificationMessage (WebSocket /topic/orders) */
export interface OrderNotificationMessage {
  orderId: number;
  trackingId: string;
  productName: string;
  variant: string | null;
  deliveryLocation: string;
  customerName: string;
  phone: string;
}

export type WebsocketConnectionStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "error";

/** Client-enriched notification for the dashboard bell */
export interface OrderNotification extends OrderNotificationMessage {
  id: string;
  receivedAt: string;
  read: boolean;
}

/** Matches backend StockItemDto */
export interface StockItem {
  variantId: number;
  productId: number;
  productName: string;
  productStatus: ProductStatus;
  sku: string;
  color: string | null;
  stockQty: number;
}

/** Matches backend AdjustStockRequest */
export interface AdjustStockRequest {
  quantity: number;
  reason?: string;
}

/** Matches backend StockAdjustmentLogDto */
export interface StockAdjustmentLog {
  id: number;
  variantId: number;
  previousQty: number;
  newQty: number;
  adjustedBy: number;
  reason: string | null;
  adjustedAt: string;
}

/** Frontend low-stock threshold (matches backend app.stock.low-threshold default) */
export const LOW_STOCK_THRESHOLD = 10;

/** Matches backend CreateProductRequest */
export interface CreateProductRequest {
  name: string;
  description?: string;
  category: string;
  costPrice: number;
  sellPrice: number;
  stockQty: number;
  launchStart?: string;
  launchEnd?: string;
  variants?: ProductVariantInput[];
  landingPage?: LandingPageInput;
}

/** Matches backend VariantDto (create/update payload) */
export interface ProductVariantInput {
  id?: number;
  color: string | null;
  sku: string;
  stockQty: number;
  imageUrl?: string | null;
  swatchHex?: string | null;
  initialStockQty?: number | null;
  spinFrames?: string[];
}

/** Matches backend LandingPageDto (create/update payload) */
export interface LandingPageInput {
  id?: number;
  productId?: number;
  heroMediaUrl: string | null;
  sectionsJson: string | null;
  urgencyCounter: number | null;
  countdownEnd: string | null;
}

/** Matches backend UpdateProductRequest */
export interface UpdateProductRequest {
  name?: string;
  description?: string;
  category?: string;
  costPrice?: number;
  sellPrice?: number;
  stockQty?: number;
  launchStart?: string;
  launchEnd?: string;
  variants?: ProductVariantInput[];
  landingPage?: LandingPageInput;
}

/** Matches backend Platform enum */
export type CampaignPlatform =
  | "SNAPCHAT"
  | "INSTAGRAM"
  | "TIKTOK"
  | "FACEBOOK";

/** Matches backend CampaignDto */
export interface Campaign {
  id: number;
  productId: number;
  platform: CampaignPlatform;
  utmSource: string | null;
  budgetNote: string | null;
  startDate: string | null;
}

/** Matches backend CreateCampaignRequest */
export interface CreateCampaignRequest {
  productId: number;
  platform: CampaignPlatform;
  utmSource?: string;
  budgetNote?: string;
  startDate?: string;
}

/** Matches backend TrendResearchStatus enum */
export type TrendResearchStatus =
  | "RESEARCHING"
  | "SOURCING"
  | "READY"
  | "LIVE"
  | "PEAK"
  | "DECLINING"
  | "ARCHIVED";

/** Matches backend TrendResearchDto */
export interface TrendResearch {
  id: number;
  productName: string;
  source: string | null;
  evidenceNotes: string | null;
  score: number | null;
  status: TrendResearchStatus;
  trendsResponsibleId: number;
}

/** Matches backend CreateTrendResearchRequest */
export interface CreateTrendResearchRequest {
  productName: string;
  source?: string;
  evidenceNotes?: string;
  score?: number;
  status?: TrendResearchStatus;
}

/** Matches backend UserDto */
export interface User {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  enabled: boolean;
  createdAt: string;
}

/** Matches backend CreateUserRequest */
export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: UserRole;
}

/** Matches backend UpdateRoleRequest */
export interface UpdateRoleRequest {
  role: UserRole;
}

/** Matches backend AuditLogDto */
export interface AuditLogEntry {
  id: number;
  actorId: number;
  action: string;
  entityType: string;
  entityId: number;
  createdAt: string;
}

/** Matches backend DashboardStatsDto */
export interface DashboardStats {
  totalRevenue: number;
  activeTrends: number;
  conversionRate: number;
  slaCompliancePercent: number;
}

/** Matches backend UpdateOrderStatusRequest */
export interface UpdateOrderStatusRequest {
  orderStatus: OrderStatus;
}

/** Matches backend DeliveryTrackingDto.
 * `id` is null for the documented placeholder returned before courier setup.
 */
export interface DeliveryTracking {
  id: number | null;
  orderId: number;
  status: string;
  courier: string | null;
  eta: string | null;
  deliveredAt: string | null;
}

/** Matches backend UpdateDeliveryRequest */
export interface UpdateDeliveryRequest {
  orderId: number;
  status: string;
  courier?: string;
  eta?: string;
  deliveredAt?: string;
}

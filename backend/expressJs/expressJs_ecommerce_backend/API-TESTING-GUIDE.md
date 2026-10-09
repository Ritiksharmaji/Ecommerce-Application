# API Testing Guide (Postman)

Files:
- `Ecommerce.postman_collection.json`: 43 requests in run order, each with tests
- `Ecommerce.postman_environment.json`: variables (base URL, admin login, auto-filled tokens/IDs)

## Steps

1. Start the server: `npm run server` (opens at `http://localhost:3000`).
2. In Postman, choose **Import** and import both JSON files.
3. In the environment dropdown at the top right, select **Ecommerce - Local**.
4. Either:
   - **Fast:** right-click the collection, choose **Run collection**, then **Run**. Every request runs in order.
   - **Manual:** click through folders `0` → `9` in order. Each request saves the tokens and IDs that the next one needs.

You never copy tokens or IDs by hand. The test scripts fill in these environment variables:

| Variable | Set by |
|---|---|
| `adminToken` | 1.1 Admin Login (uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`) |
| `userEmail`, `userToken`, `userId` | 1.2 Register New User (creates a unique email on every run) |
| `productId`, `productId2` | 2.1 Get All Products |
| `newProductId` | 2.3 Create Product (JSON) |
| `addressId` | 3.1 Add Address |
| `orderId` | 6.1 Create Order |

## Flow

| Folder | What it tests |
|---|---|
| 0. Health | `GET /` |
| 1. Auth | admin login, register, login, `/me`, wrong password → 401 |
| 2. Products | list (paginated), single, create from image URLs, create with image file upload (optional; pick a file in form-data), update, user tries to create → 403 |
| 3. Addresses | add, list, update |
| 4. Wishlist | get, toggle add, toggle remove |
| 5. Cart | get, add, update quantity, remove item (`?size=`), insufficient stock → 400, clear |
| 6. Orders | create order from cart (cash), my orders, single order, empty cart → 400 |
| 7. Admin | update order status, all orders (+ status filter), dashboard stats, user → 403 |
| 8. Payments | Stripe checkout session (test mode; pay with card `4242 4242 4242 4242`) |
| 9. Cleanup | deletes the address, product and cart created by this run |

## Dummy data already in the DB

- **10 products** across Men, Women, Kids, Shoes, Bags and Other
- **3 users** (password `Test@1234`):
  - `rahul.verma@example.com`: 1 order, delivered/paid
  - `priya.singh@example.com`: 1 order, shipped
  - `amit.kumar@example.com`: 1 order, processing
- Each user also has an address, wishlist items and a cart.

## Testing the deployed server

Change `serverUrl` and `baseUrl` in the environment to your deployed URL, e.g. `https://your-app.vercel.app` and `https://your-app.vercel.app/api`.

## Stripe webhook (for deploy)

`STRIPE_WEBHOOK_SECRET` in `.env` is still a placeholder. In the Stripe Dashboard, go to **Developers → Webhooks**, add the endpoint `https://<your-domain>/api/stripe` for the events `payment_intent.succeeded`, `payment_intent.payment_failed` and `payment_intent.canceled`, then copy its signing secret (`whsec_...`) into `.env` and your hosting env vars.

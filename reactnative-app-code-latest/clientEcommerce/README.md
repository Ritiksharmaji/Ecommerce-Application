### ========= creating and reseting the application =============
1) to create : npx create-expo-app@latest
2) to reset the application: npm run reset-project
3) ![alt text](image.png)
4) then start the project : npm run start 
5) ![alt text](image-1.png)
6) now we need to add the tailwings css for react native for that we need to use the nativewind: https://www.nativewind.dev/
7) ![alt text](image-2.png)
8) ![alt text](image-3.png)
9) ![alt text](image-4.png)
10) ![alt text](image-5.png)
11) ![alt text](image-6.png)
12) ![alt text](image-7.png)
13) ![alt text](image-8.png)
14) ![alt text](image-9.png)
15) ![alt text](image-10.png)
16) ![alt text](image-11.png)
17) ![alt text](image-12.png)
18) ![alt text](image-13.png)
19) ![alt text](image-14.png)

## ============ now setting the asstes and constants for the projects ===============
1) ![alt text](image-15.png)

## =========== setting the screens tabls =================
1) ![alt text](image-16.png)
2) now pushed the code to githube

## ==================== coderevouuew =====
That’s completely fine 👍 — **you don’t need `.coderabbit.yaml` by default**, but without it, CodeRabbit uses **default settings**, which is why you’re seeing that message.

Let’s fix it properly 👇

---

# ✅ Why you’re seeing this

Since you don’t have a config file:

* **CodeRabbit** is using default rules
* Default = **only review PRs to main/master branch**

---

# 🚀 Best Solution → Create `.coderabbit.yaml`

Create a file in your repo root:

```
.coderabbit.yaml
```

---

## 🔥 Recommended Config (Use This)

```yaml
reviews:
  auto_review:
    enabled: true
    branches:
      - "*"

  review_status: false
```

---

# 📌 What this does

### ✅ `branches: "*"`

* Enables auto review on **ALL branches**
* Fixes your current issue permanently

### ✅ `review_status: false`

* Removes that annoying message

---

# 🛠️ Steps to Add It

1. Go to your repo
2. Click **Add File → Create new file**
3. Name it:

   ```
   .coderabbit.yaml
   ```
4. Paste the config
5. Commit

---

# ⚡ After Adding

* Push new PR → review happens automatically ✅
* No more “review skipped” message ✅

---

# 🔥 Alternative (No config file)

If you don’t want config:

Just comment in PR:

```
@coderabbitai review
```

---

# 💡 My Suggestion (Based on your goals)

Since you're aiming for **full-stack + production-level apps**, always:

* Use `.coderabbit.yaml`
* Enable auto reviews on all branches

👉 This simulates **real company workflows (very important for interviews)**

---

If you want next:
I can give you a **complete GitHub setup**:
✅ CodeRabbit + ESLint + Prettier + CI/CD
👉 so your projects look **industry-level** 🚀


## =============== creating product Details Screen ========
1) ![alt text](image-17.png)
2) ![alt text](image-18.png)
3) ![alt text](image-19.png)
4) ![alt text](image-20.png)

## ============ Create Shop Screen ===============
1) ![alt text](image-21.png)
2) ![alt text](image-22.png)
3) ![alt text](image-23.png)
4) ![alt text](image-24.png)
5) ![alt text](image-25.png)

## ============ favorate screen =========
1) ![alt text](image-26.png)

## ====== profile =======
1) ![alt text](image-27.png)

## ====== Error fixed =======
1) ![alt text](image-28.png)
2) the forth tab comming 
Got it — your folder structure clearly shows the problem 👇

```
app
 └── (tabs)
      ├── shop/        ❗ THIS is the issue
      │    └── index.tsx
      ├── cart.tsx
      ├── favorites.tsx
      ├── index.tsx
      ├── profile.tsx
```

---

# 💥 WHY EXTRA TAB IS COMING

In **Expo Router**, **every file or folder inside `(tabs)` becomes a tab automatically**.

👉 So this:

```
shop/index.tsx
```

👉 is being treated as a **separate tab → "shop" tab**

That’s why:

* You see a **4th tab**
* Clicking it opens `shop/index.tsx`

---

# ✅ FIX (CHOOSE ONE)

## ✅ OPTION 1 (BEST PRACTICE)

Move `shop` **OUTSIDE `(tabs)`**

### ✔ Correct structure:

```
app
 ├── (tabs)
 │    ├── index.tsx
 │    ├── cart.tsx
 │    ├── favorites.tsx
 │    ├── profile.tsx
 │
 ├── shop/
 │    └── index.tsx
```

👉 Now:

* No extra tab
* You can still navigate:

```js
router.push('/shop')
```

---

## ✅ OPTION 2 (IF YOU WANT TO KEEP IT INSIDE)

Hide it manually in `(tabs)/_layout.tsx`

Add this:

```js
<Tabs.Screen
  name="shop"
  options={{
    href: null, // 🔥 hides from tab bar
  }}
/>
```

---

## ⚠️ WHY YOUR CURRENT BEHAVIOR HAPPENS

* `(tabs)` auto-registers routes
* Folder = tab
* `shop/index.tsx` = `/shop`
* So Expo creates:

  * Home tab
  * Cart tab
  * Favorites tab
  * Profile tab
  * ❌ Shop tab (extra)

---

# 🚀 RECOMMENDED APPROACH

👉 Use this structure:

* Tabs = only main navigation
* Other screens = outside tabs

This is how **real apps (Flipkart/Amazon)** are structured.

---

# ✅ FINAL ANSWER

✔ Extra tab = `shop` folder inside `(tabs)`
✔ Clicking opens shop screen = expected behavior
✔ Fix = move `shop` outside OR hide it

---

If you want next level:
I can help you build **proper navigation flow like:**

* Home → Shop → Product → Cart
* With animations + stack inside tabs

Just tell me 👍

=========== output ======
1) ![alt text](image-29.png)
2) ![alt text](image-30.png)


## ============= working on admin panal ===============
1) npm i expo-image-picker
2) ![alt text](image-33_copy.png)
3) ![alt text](image-32.png)
4) ![alt text](image-33.png)
5) ![alt text](image-34.png)
6) ![alt text](image-35.png)
7) ![alt text](image-36.png)
8) ![alt text](image-37.png)
9) ![alt text](image-38.png)


### =========== Add user authentication with Clerk =============
1) npm install @clerk/clerk-expo
2) then create project on cleark website and 
3) ![alt text](image-31.png)
4) ![alt text](image-32.png)
5) and add it into .env file 
6) ![alt text](image-33.png)
7) then we need to wrap out application into clearkProvide 
8) ![alt text](image-34.png)
9) then we need to install the expo-secure-store: npm install expo-secure-store
15) ![alt text](image-39.png)
16) ![alt text](image-40.png)
17) ![alt text](image-41.png)
18) ![alt text](image-42.png)
19) ![alt text](image-43.png)
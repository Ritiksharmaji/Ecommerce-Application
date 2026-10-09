## Guide to Setup Up a Basic Express Server with TypeScript

This guide provides a step-by-step process for setting up a basic web server using Express.js and TypeScript.
Prerequisites
Ensure you have the following installed:

Node.js ( Latest LTS recommended )
npm (or yarn/pnpm)

### 1. Project Initialization

Start by creating a new directory for your project and initializing a new Node.js project.

```bash
mkdir server
```

```bash
cd server
```

```bash
npm init -y
```

### 2. Install Dependencies

Install Express and the necessary TypeScript-related packages.
Production Dependencies

Install Express, the web framework

```bash
npm install express cors dotenv
```

Install TypeScript, the type definitions for Express and Node.js, and `tsx` for running the server without a pre-compiled step.

```bash
npm install -D typescript tsx @types/node ts-node @types/express nodemon @types/cors
```

### 3. Configure TypeScript

Create a `tsconfig.json` file in your project root to configure the TypeScript compiler. You can generate a default file using the following command

```bash
npx tsc --init
```

For a basic setup, ensure your `tsconfig.json` has at least these settings:

```json
{
    "compilerOptions": {
        "target": "ES2020",
        "module": "nodenext",
        "moduleResolution":"nodenext",
        "outDir": "./dist",
        "rootDir": "./",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true
    },
    "include": [
        "./**/*.ts"
    ],
    "exclude": [
        "node_modules"
    ]
}
```

### 4. Create the Server File

Create a main server file, for example `server.ts`.

Add the following basic Express server code to server.ts:

```typescript
import "dotenv/config";
import express, { Request, Response } from 'express';
import cors from "cors";

const app = express();

// Middleware
app.use(cors())
app.use(express.json());

const port = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.listen(port, () => {
    console.log(`Server is running at http://localhost:${port}`);
});
```

### 5. Update package.json Scripts

Modify your `package.json` file to add scripts for starting the server using `tsx`

```json
"scripts": {
    "start": "tsx server.ts",
    "server": "nodemon --exec tsx server.ts",
    "build": "tsc"
}
```

```json
"type": "module"
```

### 6. Run the Server

Start your server using the new script:

```bash
npm run server
```

You should see the message: Server is running at http://localhost:3000

Open your web browser and navigate to http://localhost:3000 to see the

"Server is Live!" message.

1) ![alt text](image.png)
2) ![alt text](image-1.png)

## =========== project flow ============
1) ![alt text](image-2.png)
2) ![alt text](image-3.png)
3) ![alt text](image-4.png)
4) ![alt text](image-5.png)
5) ![alt text](image-6.png)
6) ![alt text](image-7.png)

## ============ configure mongoDB , cleark and cloudnary ===
1) npm install mongoose
2) ![alt text](image-8.png)
3) ![alt text](image-9.png)
4) ![alt text](image-10.png)
5) ![alt text](image-11.png)
6) ![alt text](image-12.png)
7) now next is configure the clerk webhook 
8) ![alt text](image-13.png)
9) ![alt text](image-14.png)
10) ![alt text](image-15.png)
11) ![alt text](image-16.png)
12) ![alt text](image-17.png)
13) ![alt text](image-18.png)
14) ![alt text](image-19.png)
15) ![alt text](image-20.png)
16) ![alt text](image-21.png)
17) ![alt text](image-22.png)
18) ![alt text](image-23.png)
19) 

## =========== deplay it on vercel so that we can provide the endpoint to clerk webhook ==
1) ![alt text](image-24.png)
2) ![alt text](image-25.png)
3) ![alt text](image-26.png)
4) now pushed the code on githube 
5) ![alt text](image-27.png)
6) now we need to connect with backend to vercel 
7) ![alt text](image-28.png)
8) ![alt text](image-29.png)
9) ![alt text](image-30.png)
10) ![alt text](image-31.png)
11) ![alt text](image-32.png)
12) ![alt text](image-33.png)
13) ![alt text](image-34.png)
14) ![alt text](image-35.png)
15) ![alt text](image-36.png)

## ========== 
1) ![alt text](image-37.png)
2) ![alt text](image-38.png)
3) ![alt text](image-39.png)
4) ![alt text](image-40.png)
5) now pused the code to githube and marge to main 
6) ![alt text](image-41.png)

7) ![alt text](image-42.png)
8) ![alt text](image-43.png)

## ======== working with products and setup the cloudnary to update the image ========
1) ![alt text](image-44.png)
2) ![alt text](image-45.png)
3) now install the cloudnary: npm i cloudinary multer
4) and: npm i -D @types/multer
4) ![alt text](image-46.png)
5) 
Append unique hashes to assets referenced in your views to aggressively cache them while guaranteeing that clients receive the most recent versions.

## Installation

```bash
npm i hasset
```

## Usage

Running the following command will scan asset files found in the `roots` path(s) and replace their references with hashed versions in the `refs` path(s):

```bash
npx hasset --roots="path/to/scan/assets1/,path/to/scan/assets2/" --refs="views/path/to/append/hashes1/,views/path/to/append/hashes2/"
```

## Usage Example

Register `@fastify/static`:

```js
await fastify.register(import("@fastify/static"), {
  root: new URL("assets/", import.meta.url).pathname,
  prefix: "/p/assets/",
  wildcard: false,
  index: false,
  immutable: true,
  maxAge: process.env.NODE_ENV === "production" ? 31536000 * 1000 : 0,
});
```

Add the `hasset` command to the build script:

```json
"scripts": {
  "build": "npx hasset --roots=assets/ --refs=views/,routes/",
},
```

Make sure to `npm run build` in `Dockerfile`:

```dockerfile
FROM node:latest

WORKDIR /app

COPY package*.json ./

RUN npm ci --include=dev

COPY . .

RUN npm run build

RUN npm prune --production

CMD ["npm", "start"]
```

## Real Example

Run `npm run example` to see `hasset` in action.

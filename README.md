Append unique hashes to assets referenced in your views to aggressively cache them while guaranteeing that clients receive the most recent versions.

## Installation

```bash
npm i hasset
```

## Usage

Run the following command at the root of the project:

```bash
npx hasset --roots="path/to/scan/assets1/,path/to/scan/assets2/" --cwds="views/path/to/append/hashes1/,views/path/to/append/hashes2/"
```

## Docker Example

The following command should be run during the build process:

```json
"scripts": {
  "build": "npx hasset --roots=src/assets/ --cwds=src/views/,src/routes/",
},
```

Then, in the Dockerfile:

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

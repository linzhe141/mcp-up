import path from "node:path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
export default [
  {
    name: "hackernews",
    serverFilePath: path.resolve(
      __dirname,
      "./playground/server/hackernews-server.ts"
    ),
  },
]

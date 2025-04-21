import path from "node:path"
import { fileURLToPath } from "url"
import { dirname } from "path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
export default [
  {
    name: "hackernews",
    serverFilePath: path.resolve(__dirname, "./server/hackernews-server.ts"),
  },
]

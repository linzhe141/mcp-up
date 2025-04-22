import type { McpClientConfig } from "../src/type"
import path from "node:path"

export default [
  {
    name: "hackernews",
    type: "pure server",
    serverFilePath: path.resolve("./server/hackernews-server.ts"),
  },
  {
    name: "writefile",
    type: "pure server",
    serverFilePath: path.resolve("./server/writefile-server.ts"),
  },
] satisfies McpClientConfig[]

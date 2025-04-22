import type { McpClientConfig } from "../src/type"
import path from "node:path"

export default [
  {
    name: "hackernews",
    type: "pure server",
    serverFilePath: path.resolve("./server/hackernews-server.ts"),
  },
] satisfies McpClientConfig[]

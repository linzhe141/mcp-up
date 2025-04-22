import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import fs from "node:fs/promises"
import { z } from "zod"

export const server = new McpServer({
  name: "file-server",
  version: "1.0.0",
})
server.tool(
  "write-to-file",
  "Create a new file or completely overwrite an existing file with new content. " +
    "Use with caution as it will overwrite existing files without warning. ",
  {
    path: z.string(),
    content: z.string(),
  },
  async ({ path, content }) => {
    await fs.writeFile(path, content, "utf-8")
    return {
      content: [{ type: "text", text: `Successfully wrote to ${path}` }],
    }
  }
)

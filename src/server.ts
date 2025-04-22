import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"

export async function createMcpServer(server: McpServer) {
  try {
    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.log("Mcp Server running on stdio")
  } catch (error) {
    console.error("Fatal error:", error)
    process.exit(1)
  }
}

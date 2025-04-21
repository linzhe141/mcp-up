import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { Tool } from "@modelcontextprotocol/sdk/types.js"

export async function createMcpClient({
  name,
  version = "0.0.1",
  serverFilePath,
}: {
  name: string
  version?: string
  serverFilePath: string
}) {
  const client = new Client({ name, version })
  await connectToServer()
  const serverTools = await client.listTools()
  const tools: Tool[] = serverTools.tools.map((tool) => {
    return {
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
    }
  })
  return {
    client,
    tools,
    close() {
      client.close()
    },
    callTool(name: string, params: Record<string, any>) {
      return client.callTool({
        name,
        arguments: params,
      })
    },
  }

  async function connectToServer() {
    try {
      const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", serverFilePath],
      })
      await client.connect(transport)
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e)
      throw e
    }
  }
}

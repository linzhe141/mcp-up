import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js"
import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { fileURLToPath } from "node:url"
import path from "node:path"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const wrapFilePath = path.resolve(__dirname, "./wrap-to-start-server.ts")

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
      // 本质就是通过一个子进程启动mcp server，通过 stdio 连接到子进程的 stdin 和 stdout
      const transport = new StdioClientTransport({
        command: "npx",
        args: ["tsx", wrapFilePath, serverFilePath],
      })
      console.log("Connecting to MCP server...")
      await client.connect(transport)
    } catch (e) {
      console.log("Failed to connect to MCP server: ", e)
      throw e
    }
  }
}

import llm from "./llm"
import type OpenAI from "openai"
import allClient from "../playground/mcpup.config"
import { createMcpClient } from "./client"
import { Client } from "@modelcontextprotocol/sdk/client/index.js"
import { Tool } from "@modelcontextprotocol/sdk/types.js"
import { createMcpServer } from "./server"
import { pathToFileURL } from 'node:url';

export async function start({ prompt }: { prompt: string }) {
  let formatTools: OpenAI.Chat.Completions.ChatCompletionTool[] = []
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = []

  const res = await invoke(prompt)

  console.log("Response:", res)

  async function invoke(prompt: string) {
    const clients: {
      client: Client
      tools: Tool[]
      callTool: Function
      close: Function
    }[] = []
    for (const c of allClient) {
      const {server} = await import(pathToFileURL(c.serverFilePath).href)
      await createMcpServer(server)
      const { client, tools, callTool, close } = await createMcpClient({
        name: c.name,
        serverFilePath: c.serverFilePath,
      })
      clients.push({ client, tools, callTool, close })
    }
    formatTools = clients
      .map((i) => i.tools)
      .flat()
      .map((tool) => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.inputSchema,
        },
      }))
    console.log("formatTools", formatTools)
    let response = await chat(prompt)

    while (true) {
      if (response.toolCalls.length > 0) {
        for (const toolCall of response.toolCalls) {
          const mcp = clients.find(({ tools }) =>
            tools.some((t: any) => t.name === toolCall.function.name)
          )
          if (mcp) {
            console.log(`Calling tool: ${toolCall.function.name}`)
            console.log(`Arguments: ${toolCall.function.arguments}`)
            const result = await mcp.callTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments)
            )
            appendToolResult(toolCall.id, JSON.stringify(result))
          } else {
            appendToolResult(toolCall.id, "Tool not found")
          }
        }
        // 工具调用后,继续对话
        response = await chat()
        continue
      }
      // 没有工具调用,结束对话
      for (const { client } of clients) {
        await client.close()
      }
      return response.content
    }
  }

  function appendToolResult(toolCallId: string, toolOutput: string) {
    messages.push({
      role: "tool",
      content: toolOutput,
      tool_call_id: toolCallId,
    })
  }

  async function chat(prompt?: string) {
    if (prompt) {
      messages.push({ role: "user", content: prompt })
    }

    const stream = await llm.chat.completions.create({
      model: process.env.END_POINT_ID!,
      messages: messages,
      stream: true,
      tools: formatTools,
    })

    let content = ""
    const toolCalls: {
      id: string
      function: { name: string; arguments: string }
    }[] = []
    for await (const chunk of stream) {
      const delta = chunk.choices[0].delta
      // 处理普通Content
      if (delta.content) {
        const contentChunk = chunk.choices[0].delta.content || ""
        content += contentChunk
        process.stdout.write(contentChunk)
      }
      // 处理ToolCall
      if (delta.tool_calls) {
        for (const toolCallChunk of delta.tool_calls) {
          // 第一次要创建一个toolCall
          if (toolCalls.length <= toolCallChunk.index) {
            toolCalls.push({ id: "", function: { name: "", arguments: "" } })
          }
          let currentCall = toolCalls[toolCallChunk.index]
          if (toolCallChunk.id) currentCall.id += toolCallChunk.id
          if (toolCallChunk.function?.name)
            currentCall.function.name += toolCallChunk.function.name
          if (toolCallChunk.function?.arguments)
            currentCall.function.arguments += toolCallChunk.function.arguments
        }
      }
    }
    messages.push({
      role: "assistant",
      content: content,
      tool_calls: toolCalls.map((call) => ({
        id: call.id,
        type: "function",
        function: call.function,
      })),
    })
    return {
      content: content,
      toolCalls: toolCalls,
    }
  }
}

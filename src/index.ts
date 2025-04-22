import llm from "./llm"
import type OpenAI from "openai"
import { createMcpClient, type McpClient } from "./client"
import path from "path"
import { pathToFileURL } from "node:url"
import { McpClientConfig } from "./type"

export async function startConversation({ prompt }: { prompt: string }) {
  let availableTools: OpenAI.Chat.Completions.ChatCompletionTool[] = []
  const chatMessages: OpenAI.Chat.ChatCompletionMessageParam[] = []
  const inputClientConfig = await getMcpupConfig()

  await processPrompt(prompt)

  async function processPrompt(prompt: string) {
    const mcpClients: McpClient[] = []

    for (const clientConfig of inputClientConfig) {
      const mcpClient = await createMcpClient({
        name: clientConfig.name,
        serverFilePath: clientConfig.serverFilePath,
        type: clientConfig.type,
      })
      mcpClients.push(mcpClient)
    }

    availableTools = mcpClients
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
    console.log("Available Tools", availableTools)

    let chatResponse = await generateChatResponse(prompt)

    while (true) {
      if (chatResponse.toolCalls.length > 0) {
        for (const toolCall of chatResponse.toolCalls) {
          const targetClient = mcpClients.find(({ tools }) =>
            tools.some((tool) => tool.name === toolCall.function.name)
          )
          if (targetClient) {
            console.log(`Executing tool: ${toolCall.function.name}`)
            console.log(`Arguments: ${toolCall.function.arguments}`)
            console.log(`calling tool...`)
            const toolResult = await targetClient.callTool(
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments)
            )
            console.log(`Tool result: ${JSON.stringify(toolResult)}`)
            appendToolExecutionResult(toolCall.id, JSON.stringify(toolResult))
          } else {
            appendToolExecutionResult(toolCall.id, "Tool not found")
          }
        }
        // Continue conversation after tool execution
        chatResponse = await generateChatResponse()
        continue
      }
      // End conversation if no tools are called
      for (const { client } of mcpClients) {
        await client.close()
      }
      return chatResponse.content
    }
  }

  function appendToolExecutionResult(toolCallId: string, toolOutput: string) {
    chatMessages.push({
      role: "tool",
      content: toolOutput,
      tool_call_id: toolCallId,
    })
  }

  async function generateChatResponse(prompt?: string) {
    if (prompt) {
      chatMessages.push({
        role: "system",
        content: `You are an assistant with tool calling capabilities. Please work strictly in the following way:

1. You can call multiple tools, but only one tool at a time.

2. After calling the tool, I will return the result of the tool execution to you.

3. Please do not try to call the next tool before getting the tool result.

4. Only return one tool_call at a time, and wait for me to return the tool result before continuing.`,
      })
      chatMessages.push({ role: "user", content: prompt })
    }
    console.log("start llm")
    const stream = await llm.chat.completions.create({
      model: process.env.END_POINT_ID!,
      messages: chatMessages,
      stream: true,
      tools: availableTools,
    })
    console.log("processing chatResponse ...")
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
          if (toolCalls.length <= toolCallChunk.index) {
            toolCalls.push({
              id: "",
              function: { name: "", arguments: "" },
            })
          }
          const current = toolCalls[toolCallChunk.index]
          if (toolCallChunk.id) current.id += toolCallChunk.id
          if (toolCallChunk.function?.name)
            current.function.name += toolCallChunk.function.name
          if (toolCallChunk.function?.arguments)
            current.function.arguments += toolCallChunk.function.arguments
        }
      }
    }

    chatMessages.push({
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

async function getMcpupConfig() {
  const mcpupConfigPath = pathToFileURL(
    path.resolve(process.cwd(), "./mcpup.config.ts")
  ).href
  const { default: mcpupConfig } = await import(mcpupConfigPath)
  return mcpupConfig as McpClientConfig[]
}

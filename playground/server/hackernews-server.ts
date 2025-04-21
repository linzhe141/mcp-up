import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { z } from "zod"

export const server = new McpServer({
  name: "hackernews-server",
  version: "1.0.0",
})
server.tool(
  "get-hackernews-top-stories",
  "Get the stories from Hacker News",
  {
    type: z.enum(["topstories", "newstories", "beststories"]),
    amount: z.number().min(1).max(500).default(10),
  },
  async (params) => {
    console.log("params", params)
    const response = await fetch(
      `https://hacker-news.firebaseio.com/v0/${params.type}.json`
    )
    const ids = await response.json()
    const stories = await Promise.all(
      ids.slice(0, params.amount).map(async (id: number) => {
        const storyResponse = await fetch(
          `https://hacker-news.firebaseio.com/v0/item/${id}.json`
        )
        return storyResponse.json()
      })
    )
    console.log("stories", stories)
    return {
      content: stories.map((story) => ({
        type: "text",
        text: JSON.stringify(story),
      })),
    }
  }
)

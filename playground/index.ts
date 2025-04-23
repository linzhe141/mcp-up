import { startConversation } from "../src"
import path from "node:path"
const outputPath = path.resolve("./output")
startConversation({
  prompt: `获取hacknews的最新1条消息，并输出到${outputPath}/news.md，并且还要有对应的链接，文件名为news.md。`,
})

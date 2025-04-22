import { pathToFileURL } from "node:url"
import { createMcpServer } from "./server"

const args = process.argv.slice(2)
const [serverFilePath] = args
const { server } = await import(pathToFileURL(serverFilePath).href)
await createMcpServer(server)
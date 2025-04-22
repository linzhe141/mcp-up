import { pathToFileURL } from "node:url"
import { createMcpServer } from "./server"
console.log(process.argv)

const args = process.argv.slice(2)
console.log("wrap to execute server")
const [serverFilePath] = args
const { server } = await import(pathToFileURL(serverFilePath).href)
await createMcpServer(server)

import spawn from "cross-spawn"
// for debugger 测试使用子进程启动一个 mcp server
spawn(
  "npx",
  ["tsx", "../src/wrap-to-start-server.ts", "./server/hackernews-server.ts"],
  {
    stdio: ["inherit", "inherit", "inherit"],
  }
)

import OpenAI from "openai"
import dotenv from "dotenv"

dotenv.config()
const llm = new OpenAI({
  baseURL: process.env.BASE_URL,
  apiKey: process.env.API_KEY,
})

export default llm

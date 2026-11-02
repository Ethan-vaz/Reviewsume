import { connection } from "next/server";
import { getOpenAI, MODEL } from "@/lib/openai";

export async function GET() {
    // This Next.js version prerenders GET routes at build time unless told otherwise.
    // connection() says "wait for a real request", so OpenAI is called on each visit.
    await connection();

    const response = await getOpenAI().responses.create({
        model: MODEL,
        input: "Say hello to Reviewsume in one short sentence.",
    });

    return Response.json({ message: response.output_text });
}

import OpenAI from "openai";

const client = new OpenAI();

export async function GET() {
    const response = await client.responses.create({
        model: "gpt-4.1-mini",
        input: "Say hello to Reviewsume in one short sentence.",
    });

    return Response.json({ message: response.output_text });
}
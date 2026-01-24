// function to call gemini REST API
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

type GeminiChatRequest = {
    prompt?: string;
};

type GeminiChatResponse = {
    text: string;
};

export async function geminiChat(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        return {
            status: 500,
            body: "Server misconfiguration: GEMINI_API_KEY is missing"
        };
    }

    let body: GeminiChatRequest;
    try {
        body = await request.json();
    } catch (err) {
        context.error("Invalid JSON body", err);
        return {
            status: 400,
            body: "Invalid JSON body"
        };
    }

    const prompt = body?.prompt?.trim();
    if (!prompt) {
        return {
            status: 400,
            body: "Missing required field: prompt"
        };
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${encodeURIComponent(apiKey)}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        role: "user",
                        parts: [{ text: prompt }]
                    }
                ]
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            context.error("Gemini API error", { status: response.status, errorText });
            return {
                status: 502,
                body: "Upstream Gemini API error"
            };
        }

        const data = await response.json();
        const text = data?.candidates?.[0]?.content?.parts?.map((part: { text?: string }) => part.text ?? "").join("") ?? "";

        if (!text) {
            return {
                status: 502,
                body: "Gemini returned an empty response"
            };
        }

        const responseBody: GeminiChatResponse = { text };
        return {
            status: 200,
            jsonBody: responseBody
        };
    } catch (err) {
        context.error("Gemini request failed", err);
        return {
            status: 500,
            body: "Error calling Gemini API"
        };
    }
}

app.http("gemini-chat", {
    methods: ["POST"],
    authLevel: "anonymous",
    handler: geminiChat
});


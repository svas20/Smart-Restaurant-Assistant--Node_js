import { ChatOpenAI } from "@langchain/openai";
import { RunnablePassthrough, RunnableWithMessageHistory, RunnableLambda, RunnableParallel } from "@langchain/core/runnables";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { prompts } from "./prompts.js";
import { retriever } from "./retriver.js";

// Get the API key from environment variables

// Store for session-based message history
let store = {};

// Retrieve message history based on session ID
function getMessageHistory(session_id) {
    if (!(session_id in store)) {
        store[session_id] = new InMemoryChatMessageHistory();
    }
    return store[session_id];
}

// Main function to process user input and return result
export async function result(user_input, order_number) {
    const apiKey = process.env.OPENAI_API_KEY;
    //console.log(apiKey)
    // Initialize ChatOpenAI with the API key
    const llm = new ChatOpenAI({
        model: "gpt-4", // Ensure this is a valid model name
        temperature: 0,
        apiKey // Pass the API key here
    });

    // Initialize output parser
    const outputParser = new StringOutputParser();

    // Create a parallel chain with steps for retrieving context and handling the question
    const chain = new RunnableParallel({
        steps: {
            context: new RunnableLambda({
                func: (input) => input.question
            }).pipe(retriever), // This will retrieve context based on the user input
            question: new RunnablePassthrough() // Simply passes the question through
        }
    }).pipe(prompts) // Applies the prompts
      .pipe(llm)      // Passes through the language model
      .pipe(outputParser); // Parses the output

    // Add message history handling
    const chain_with_history = new RunnableWithMessageHistory({
        runnable: chain,
        getMessageHistory,
        inputMessagesKey: "question",
        historyMessagesKey: "history",
    });

    // Invoke the chain with history, providing question input and session ID
    const res = await chain_with_history.invoke(
        { question: user_input },
        { configurable: { sessionId: order_number } } // This passes the session ID as an option
    );

    return res;
}

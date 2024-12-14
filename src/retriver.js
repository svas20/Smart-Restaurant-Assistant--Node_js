import * as fs from "node:fs";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import path from 'path';
import { fileURLToPath } from 'url';


// Define __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function retriever() {
  try {

  // Get the API key from environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    //console.log(apiKey)
    // Define the directory and file name
    const directoryPath = path.join(__dirname, 'Document');
    const fileName = 'Menu.txt';

    // Construct the full file path
    const filePath = path.join(directoryPath, fileName);

    // Read the file
    const text = fs.readFileSync(filePath, 'utf8');

    // Initialize the text splitter
    const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000 });
    const docs = await textSplitter.createDocuments([text]);

    // Create a vector store from the documents, passing the apiKey to OpenAIEmbeddings
    const vectorStore = await MemoryVectorStore.fromDocuments(
      docs,
      new OpenAIEmbeddings(apiKey) // Ensure the API key is passed here
    );

    // Initialize a retriever wrapper around the vector store
    const vectorStoreRetriever = vectorStore.asRetriever({ k: 2 });

    // Return the retriever
    return vectorStoreRetriever;

  } catch (error) {
    console.error("Error in retriever function:", error.message);
    throw error; // Optional: Re-throw the error if you want to handle it higher up
  }
}

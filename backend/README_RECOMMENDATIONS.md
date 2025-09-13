Recommendations module

Overview:

- Implements an embeddings + rerank recommendations endpoint at POST `/api/recommendations`.
- Uses cached `Project.embedding` vectors if present, computes a profile embedding for the current user, finds top candidates by cosine similarity, then calls an LLM (Gemini or OpenAI) to re-rank and explain the top K results.

Required environment variables:

- `GEMINI_API_KEY` - API key for Gemini (or `OPENAI_API_KEY` to use OpenAI)
- `GEMINI_MODEL` - (optional) model for reranking, default `models/text-bison-001`
- `GEMINI_EMBEDDING_MODEL` - (optional) embedding model for Gemini, default `models/embed-text-embedding-gecko-001`
- `EMBEDDING_PROVIDER` - set to `openai` to use OpenAI embeddings instead of Gemini
- `OPENAI_API_KEY` - if using OpenAI
- `OPENAI_EMBEDDING_MODEL` - optional override for OpenAI embedding model
- `OPENAI_RERANK_MODEL` - optional override for OpenAI rerank/chat model

Seeding project embeddings:

- The system expects projects to have `embedding` field populated. You can seed embeddings with a small script that calls the `createEmbedding` helper and updates each project.

Example script (node):

```js
// scripts/seed-embeddings.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../db/connect");
const Project = require("../models/Project");
const { createEmbedding } = require("../lib/llm");

async function run() {
  await connectDB(process.env.MONGODB_URI);
  const projects = await Project.find();
  for (const p of projects) {
    const text = `${p.name}\n\n${p.description || ""}`.slice(0, 30000);
    const emb = await createEmbedding(text);
    if (emb) {
      p.embedding = emb;
      await p.save();
      console.log("Seeded", p._id);
    }
  }
  process.exit(0);
}
run();
```

Notes:

- For production, store embeddings in a vector DB (Pinecone, Weaviate, Milvus) or use MongoDB $vectorSearch feature.
- The current implementation is best-effort and intended as a proof-of-concept.

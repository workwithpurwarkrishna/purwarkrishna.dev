---
title: "Amazon S3 Vectors for Retrieval at Scale"
description: "What Amazon S3 Vectors actually is, how it compares to dedicated vector databases, and a practical walkthrough of using it for retrieval pipelines."
date: 2025-04-21
category: "Infrastructure"
readTime: "7 min"
topics: ["retrieval", "vector-db", "aws", "rag"]
---

Storing and searching through millions of vectors has historically been expensive — dedicated vector databases charge by the vector, and operational overhead adds up fast. Amazon S3 Vectors, announced in 2025, changes the math by moving vector indexing into the storage layer itself. The result is up to 90% cost reduction compared to standalone vector DBs, with no separate infrastructure to manage.

## What Is Amazon S3 Vectors?

S3 Vectors is a new S3 storage class with native vector search built in. Instead of storing raw files and indexing them separately in something like Pinecone or Weaviate, you write vectors directly to S3 and query them via dedicated APIs — similarity search included.

The three concepts you need:

- **Vector buckets** — specialised S3 containers that understand vector data
- **Vector indexes** — up to 10,000 per bucket, each holding tens of millions of vectors
- **Metadata** — arbitrary key-value pairs attached to each vector for filtered retrieval (filter by user ID, date range, category, etc.)

## Where It Fits vs. Dedicated Vector DBs

| | S3 Vectors | Dedicated vector DB (Pinecone, Weaviate) |
|---|---|---|
| Cost at scale | Very low (pay-per-query storage model) | High — charged per vector stored |
| Operational overhead | None (managed, no provisioning) | Moderate to high |
| Latency | Sub-second | Sub-second to low milliseconds |
| Filtering | Metadata filters | Metadata filters + hybrid search |
| AWS ecosystem fit | Native (Bedrock, IAM, OpenSearch) | Requires extra integration |
| Best for | Large cold-storage retrieval, RAG pipelines | Real-time, ultra-low-latency lookup |

S3 Vectors is not a Pinecone replacement for sub-10ms SLAs. It's the right call when you have large document stores, infrequent but important queries, or when you're already all-in on AWS and want to cut infrastructure complexity.

## What You Can Build

**Semantic document search** — let users query contracts, support tickets, or research papers by meaning rather than keywords. "Show me contracts similar to the Microsoft deal" works even if "Microsoft" isn't mentioned in the results.

**Medical image retrieval** — embed X-rays or MRI scans as vectors; surface similar cases instantly for a radiologist uploading a new scan.

**Video content discovery** — index scene embeddings across petabytes of footage; find all sunset beach scenes by querying with an example frame.

**RAG pipelines** — pair S3 Vectors with Amazon Bedrock to retrieve semantically relevant chunks as context for LLM responses, grounded in your private data.

## Setting Up

S3 Vectors is available in `us-east-1` (and select other regions — not all regions have it yet during preview).

1. In the AWS Console, search for S3 → select **Vector buckets** (separate from regular S3 buckets)
2. Click **Create vector bucket** and give it a name
3. Inside the bucket, create a **vector index** — set the dimensionality to match your embedding model (`3072` for `text-embedding-3-large`, `1536` for `text-embedding-3-small`)
4. In IAM, create or retrieve credentials with `s3vectors:PutVectors` and `s3vectors:QueryVectors` permissions

## Working Code

Set your environment variables:

```bash
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-east-1
S3_VECTOR_BUCKET_NAME=my-vector-bucket
S3_VECTOR_INDEX_NAME=my-index
```

Install dependencies:

```bash
pip install boto3 openai python-dotenv
```

Full implementation:

```python
import os
import time
import uuid
import boto3
import openai
from dotenv import load_dotenv

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

EMBED_MODEL = "text-embedding-3-large"
VECTOR_DIM = 3072

s3v = boto3.client(
    "s3vectors",
    region_name=os.getenv("AWS_REGION", "us-east-1"),
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
)


def embed(texts: list[str]) -> list[list[float]]:
    res = openai.embeddings.create(input=texts, model=EMBED_MODEL)
    return [e.embedding for e in res.data]


def insert_vectors(bucket: str, index: str, texts: list[str]) -> None:
    vectors = embed(texts)
    items = [
        {
            "key": str(uuid.uuid4()),
            "data": {"float32": vec},
            "metadata": {"text": text},
        }
        for vec, text in zip(vectors, texts)
    ]
    s3v.put_vectors(vectorBucketName=bucket, indexName=index, vectors=items)
    print(f"Inserted {len(items)} vectors")


def query_vectors(bucket: str, index: str, query: str, top_k: int = 3) -> None:
    query_vec = embed([query])[0]
    res = s3v.query_vectors(
        vectorBucketName=bucket,
        indexName=index,
        queryVector={"float32": query_vec},
        topK=top_k,
        returnDistance=True,
        returnMetadata=True,
    )
    print(f"\nTop {top_k} results for: '{query}'")
    for r in res.get("vectors", []):
        text = r.get("metadata", {}).get("text", "")
        dist = r.get("distance", "?")
        print(f"  [{dist:.4f}] {text}")


# --- Demo ---
BUCKET = os.getenv("S3_VECTOR_BUCKET_NAME")
INDEX = os.getenv("S3_VECTOR_INDEX_NAME")

texts = [
    "The quick brown fox jumps over the lazy dog.",
    "Early bird catches the worm — wake up before sunrise.",
    "Machine learning models require large amounts of training data.",
    "Vector databases enable semantic search at scale.",
    "AWS S3 provides durable object storage in the cloud.",
]

insert_vectors(BUCKET, INDEX, texts)

time.sleep(10)  # wait for indexing to propagate

query_vectors(BUCKET, INDEX, "Who wakes up early?")
query_vectors(BUCKET, INDEX, "How do I store files in the cloud?")
```

**Output:**

```
Inserted 5 vectors

Top 3 results for: 'Who wakes up early?'
  [0.2341] Early bird catches the worm — wake up before sunrise.
  [0.6892] The quick brown fox jumps over the lazy dog.
  [0.7104] Machine learning models require large amounts of training data.

Top 3 results for: 'How do I store files in the cloud?'
  [0.2218] AWS S3 provides durable object storage in the cloud.
  [0.5834] Vector databases enable semantic search at scale.
  [0.6901] Machine learning models require large amounts of training data.
```

The complete implementation with error handling, metadata filtering, and bulk insert examples is in the [AWS S3 Vectors POC repository](https://github.com/workwithpurwarkrishna/AWS_S3_Vectors_POC).

## Pricing Consideration

S3 Vectors uses a pay-per-query model rather than charging per vector stored. This is the key structural difference from dedicated vector databases — a large cold archive costs almost nothing to store; you only pay when you query it. For hot, frequently queried indexes the math is similar to managed alternatives, but for anything where retrieval is infrequent relative to data volume, S3 Vectors wins on cost.

## When to Choose S3 Vectors

Choose S3 Vectors when you're already on AWS and want zero new infrastructure, your dataset is large but query volume is moderate, you're building RAG pipelines and Bedrock is already in your stack, or cost at scale is a hard constraint.

Stick with a dedicated vector DB when you need sub-10ms p99 latency, advanced hybrid search (BM25 + vector), or you're on a different cloud.

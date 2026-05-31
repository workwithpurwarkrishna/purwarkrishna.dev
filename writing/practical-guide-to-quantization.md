---
title: "A Practical Guide to Quantization"
description: "How quantization lets you run large language models on consumer hardware — the math behind it, and working code using BitsAndBytes 4-bit and 8-bit configs."
date: 2024-09-03
category: "Infrastructure"
readTime: "3 min"
topics: ["quantization", "llm", "inference", "bitsandbytes"]
---

Have you ever tried to run a powerful AI model and got an out-of-memory error? You're not alone. Today's models are massive — often requiring expensive GPUs with tens of gigabytes of VRAM. Quantization is the technique that changes that.

It reduces model size by changing how numbers are stored: instead of high-precision floats, you use simpler, lower-bit formats that need far less memory. Think of it like compressing a photo — you trade a small amount of quality for a much smaller file size.

## Why Do We Need Quantization?

Consumer hardware will never keep pace with state-of-the-art model sizes. But quantization closes the gap. A 32B parameter model that normally needs ~64 GB of GPU memory can fit inside 24 GB with 4-bit quantization — at a modest cost in precision.

## How Does Quantization Work?

Under the hood, quantization converts high-precision floating-point numbers (like `fp32`) to lower-bit formats like `bf16`, `int8`, or `int4`. The precision loss comes from dropping mantissa bits.

In IEEE 754, a floating-point number has three parts:

```
[sign bit] [exponent bits] [mantissa bits]
```

- **FP32** — 1 sign bit, 8 exponent bits, 23 mantissa bits
- **BF16** — 1 sign bit, 8 exponent bits, 7 mantissa bits
- **INT8** — 8 bits total, no exponent/mantissa split

By shrinking the mantissa, you halve (or quarter) the memory footprint while keeping the dynamic range largely intact. That's the core of quantization.

## Practical Implementation with BitsAndBytes

BitsAndBytes is the most straightforward library for on-the-fly quantization — no pre-training or complex setup required.

```bash
pip install bitsandbytes accelerate transformers
```

### 4-bit quantization

```python
from transformers import AutoModelForCausalLM, BitsAndBytesConfig
import torch

bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4"
)

model = AutoModelForCausalLM.from_pretrained(
    "your-model-name",
    quantization_config=bnb_config,
    device_map="auto"
)
```

`nf4` (NormalFloat4) is the recommended quant type for LLMs — it's designed for weights that follow a normal distribution and outperforms standard INT4 in accuracy.

### 8-bit quantization

```python
bnb_config = BitsAndBytesConfig(
    load_in_8bit=True,
    bnb_8bit_compute_dtype=torch.float16
)

model = AutoModelForCausalLM.from_pretrained(
    "your-model-name",
    quantization_config=bnb_config,
    device_map="auto"
)
```

8-bit is a safer choice when you need higher accuracy and can afford slightly more memory.

## Comparing Quantization Methods

| Method | Bits | Memory savings | Accuracy hit | Best for |
|--------|------|---------------|--------------|----------|
| FP16   | 16   | ~50% vs FP32  | Minimal      | General inference |
| INT8   | 8    | ~75% vs FP32  | Small        | Production deployment |
| INT4 (NF4) | 4 | ~87% vs FP32 | Moderate    | Consumer hardware |

## What About GGUF, GPTQ, AWQ?

These are **post-training quantization** formats — the model is quantized once and saved as a smaller file. They give better accuracy at a given bit-width but require running a quantization process upfront.

BitsAndBytes is different: it quantizes **at load time**, which means you can try any Hugging Face model with quantization in a few lines of code — no preprocessing required. That's why it's the go-to for experimentation.

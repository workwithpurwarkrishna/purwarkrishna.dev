---
title: "What Are Temperature, Top-p, and Top-k in AI?"
description: "A clear breakdown of the three key sampling parameters in AI language models — what they control, how they interact, and when to reach for each."
date: 2024-11-12
category: "AI Engineering"
readTime: "7 min"
topics: ["llm", "sampling", "inference"]
---

LLMs generate text by predicting the next token from a probability distribution over the entire vocabulary. Three parameters — **temperature**, **top-p**, and **top-k** — control how that distribution is sampled. Get them wrong and you get either robotic repetition or incoherent rambling. Get them right and the output fits your use case exactly.

## Temperature

**Range: 0 to 2**

Temperature scales the logits before the softmax is applied. A lower value sharpens the distribution (the model becomes more confident in its top choices); a higher value flattens it (lower-probability tokens get more of a chance).

- **Low temperature (0.2–0.4):** Deterministic, consistent, predictable. Good for factual Q&A, code generation, structured data extraction.
- **High temperature (0.7–1.0+):** More varied and creative, but more likely to drift off-topic or hallucinate. Good for brainstorming, creative writing, idea generation.
- **Temperature 0:** The model always picks the single highest-probability token. Fully deterministic.

### What a difference in temperature looks like

Prompt: *"I saw him walking into the principal's office with his parents…"* (Qwen2.5-7B-Instruct)

**At temperature 0.3:**

> It was my best friend, Alex. As you watched from your hiding spot behind the janitorial closet door, Alex looked nervous but determined as he knocked softly before entering without waiting for permission. His parents stood beside him, their expressions a mix of concern and pride. The secretary glanced up briefly, then returned her attention to typing away at her computer screen. Alex took a deep breath and began speaking earnestly about something that had happened between classes — how he'd accidentally broken one of Ms. Johnson's favourite antique vases during cleaning duty.

**At temperature 0.8:**

> It was my best friend! As Sarah watched her best friend Michael walk into the school principal's office with his parents through the glass doors of their high school, her heart sank like a stone. She had only just texted him earlier that morning to confirm plans for lunch after last period, and now he looked so serious she couldn't even make eye contact as they entered together. The scene unfolding behind them seemed ominous — Mr. Thompson stood at his desk looking sternly up from some papers spread out before him, Mrs. Johnson fidgeting nervously beside him, with Michael Jr.

Notice how the higher temperature drifts — more imaginative, but also noisier.

## Top-p (Nucleus Sampling)

**Range: 0 to 1**

Instead of using a fixed number of tokens, top-p sampling dynamically selects the smallest set of tokens whose combined probability mass reaches `p`. If `p = 0.9`, the model samples only from the tokens that together account for 90% of the probability.

- **Low top-p (0.3–0.5):** Focused on the most likely tokens — coherent but less varied.
- **High top-p (0.9–0.95):** Broader vocabulary, richer responses.

The key difference from top-k: the nucleus size adapts to the context. When the model is very confident (one token has 80% probability), even a high top-p might only include two or three candidates. When confidence is spread out, many tokens qualify.

## Top-k Sampling

**Range: 1 to ∞**

Top-k caps the candidate pool to exactly the `k` highest-probability tokens at each step, regardless of their actual probabilities.

- **Low top-k (5–10):** Very controlled. Good for code, formal documents, structured output.
- **High top-k (50–100):** Broader range of outputs, useful in creative contexts.

### Top-k vs top-p

Think of ordering lunch:

- **Top-k** is a fixed menu — always exactly 5 options, no matter how popular or varied they are that day.
- **Top-p** is a dynamic buffet — you choose from all dishes that together cover 90% of what people order. On a day when two dishes dominate, you might only see three options. On a varied day, you see eight.

Top-p adapts to context; top-k doesn't. That's why top-p is generally preferred in modern APIs.

## When to Use What

| Use case | Temperature | Top-p | Top-k |
|----------|------------|-------|-------|
| Factual Q&A / RAG | 0.0–0.3 | 0.3–0.5 | 10–20 |
| Code generation | 0.0–0.2 | 0.1–0.3 | 5–15 |
| Chatbots | 0.5–0.7 | 0.8–0.9 | 40–60 |
| Creative writing | 0.8–1.2 | 0.9–0.95 | 50–100 |
| Brainstorming | 1.0–1.5 | 0.95–1.0 | 80–100 |

In practice, you typically set either top-p **or** top-k, not both — using both stacks the constraints. Most production LLM APIs default to `temperature=1.0, top_p=1.0` (no restriction), and you tune from there.

## Working Code

```bash
pip install transformers torch
```

```python
from transformers import GPT2Tokenizer, GPT2LMHeadModel

model_name = "gpt2"
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)

prompt_text = "Once upon a time, in a land far, far away,"
input_ids = tokenizer.encode(prompt_text, return_tensors="pt")

temperature = 0.7   # higher = more creative
top_p = 0.9         # nucleus sampling threshold
top_k = 50          # limit to top-k tokens

output = model.generate(
    input_ids,
    max_length=150,
    temperature=temperature,
    top_p=top_p,
    top_k=top_k,
    num_return_sequences=1,
    no_repeat_ngram_size=2,
    pad_token_id=tokenizer.eos_token_id
)

generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
print(generated_text)
```

Try changing `temperature` between 0.2 and 1.5, or set `top_k=5` vs `top_k=100`, and watch how the output character changes. The parameters interact — experiment with one at a time before combining them.

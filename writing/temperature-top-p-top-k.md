---
layout: post
title: "What Are Temperature, Top-p, and Top-k in AI?"
description: "A clear breakdown of the three key sampling parameters in AI language models — what they control, how they interact, and when to reach for each."
date: 2024-11-12
category: "AI Engineering"
readTime: "7 min"
---LLMs work their wonders by crafting text that feels just like human writing, predicting what word comes next in a perfect flow. The real charm happens behind the curtain, where it\'s all about the game of probabilities and tokens!

Let's control this magic by fine-tuning specific parameters: **temperature**, **top_p (nucleus sampling)**, and **top_k sampling,** making us the magicians of this magic. It\'s going to be an exciting exploration!

## What is Temperature in AI?

Range: 0 to 2 (in practice)

Temperature controls the amount of randomness in the output. Here's how it works:

- **Low Temperature (e.g., 0.2--0.4):**

> For low temperatures, the model becomes more deterministic. It prefers high-probability tokens, generating coherent and predictable text.
>
> This works well for applications that demand consistency, e.g., technical documentation or factual descriptions.

- **High Temperature (e.g., 0.7--1.0+):**

> At higher temperatures, the model introduces more randomness. Lesser likely tokens have a chance to appear, making the text more diverse and creative.
>
> However, this can lead to occasional \"hallucinations\" or off-topic responses. Creative storytelling or brainstorming tasks benefit from higher temperatures.

***Note:** Set temp to 0.0 if you want extremely deterministic results.*

### Temperature Example in AI

Imagine a language model that must accurately complete a sentence while maintaining coherence with the initial prompt.

**Input sentence: \"I saw him walking into the principal's office with his parents\...\"**
(using Qwen/Qwen2.5-7B-Instruct)

- **At a low temperature (0.3):**

***Generated Output:*** It was my best friend, Alex. As you watched from your hiding spot behind the janitorial closet door, Alex looked nervous but determined as he knocked softly before entering without waiting for permission.

His parents stood beside him, their expressions a mix of concern and pride. The secretary glanced up briefly, then returned her attention to typing away at her computer screen.

Alex took a deep breath and began speaking earnestly about something that had happened between classes - how he\'d accidentally broken one of Ms. Johnson\'s favourite antique vases during cleaning duty.

- **At a high temperature (0.8):**

***Generated Output:*** It was my best friend! As Sarah watched her best friend Michael walk into the school principal\'s_office_with_his_parents through the glass doors of their high school, her heart sank like a stone.

She had only just texted him earlier that morning to confirm plans for lunch after last period, and now he looked so serious she couldn\'t even make eye contact as they entered together.

The scene unfolding behind them seemed ominous - Mr. Thompson stood at his desk looking sternly up from some papers spread out before him, Mrs. Johnson fidgeting nervously beside him, with Michael Jr.

*Notice how the high temperature provides a more imaginative, varied completion.*

Other parameters: []

Knowing the temperature is important if you need to find the balance between controlled and imaginative outputs.

## What is Top_p Sampling in AI?

(Range: 0 to 1)

**Top_p** sampling or nucleus sampling improves the generation process by only looking at the smallest subset of tokens whose combined probability is above a specified threshold (p).

- **Low Top_p (e.g., 0.3--0.5):**
  The model only considers a few very high-probability tokens, leading to focused and coherent text but with less diversity.

- **High Top_p (e.g., 0.9--0.95):**
  A broader range of tokens is considered, which can result in richer and more varied responses.

### How It Works

For a given prediction, tokens are sorted by probability. The model then adds tokens until the total probability is at least *p*.

Only these tokens form the "nucleus" from which the next word is sampled. This dynamic approach adapts to the context, which is why top_p is often preferred in creative applications.

## What is Top_k Sampling?

(Range: 1 to infinity)

**Top_k** sampling limits the model's choices to the top *k* most likely tokens at each generation step.

- **Low Top_k (e.g., 5--10):**
  The model is restricted to a very small set of tokens, making the output more consistent and predictable. This is useful for tasks where precision is critical, such as generating code or formal documents.

- **High Top_k (e.g., 50--100):**
  More tokens are considered, allowing for a broader and sometimes more creative output. However, if the threshold is set too high, it might include fewer relevant words.

### Example of Top_k Sampling

For the prompt: **\"The capital of France is \...\"**

- **With top_k = 5:**
  The model might reliably output: *\"Paris.\"*

- **With top_k = 50:**
  There's more room for variation, which might be useful in a creative writing context but less so for factual answers.

Top_k is straightforward; capping the number of choices helps prevent the inclusion of very unlikely (and often nonsensical) tokens.

## What Is The Difference Between Top_k And Top_p?

They can be confusing, so imagine you\'re ordering lunch. With **top‑k sampling**, it\'s like a fixed menu where you always see exactly, say, five dish options, regardless of how popular or varied they are. No matter the day or how tastes change, you only choose from those five predetermined dishes.

With **top‑p sampling**, it\'s more like a dynamic buffet. Instead of a fixed number of options, you choose from all the dishes that together account for, say, 90% of what people typically order. On a day when a couple of dishes are extremely popular, your choices might be limited to just three items.

But on another day, if the popularity is spread out more evenly, you might see seven or eight dishes to pick from. This way, the number of options adapts to the situation, sometimes more, sometimes fewer, based on the overall likelihood of the dishes being chosen.

In summary, **top‑k** always gives you a fixed set of choices, while **top‑p** adjusts the choices dynamically depending on how the probabilities add up, much like a buffet that adapts to customer preferences on any given day.

## When and How to Use These Parameters?

### Use Cases and Tips

- **Factual or Technical Content:**
  Use a **low temperature** (e.g., 0.2--0.4) with a **low top_p** or **low top_k** to ensure high accuracy and consistency.

- **Creative Writing and Brainstorming:**
  Opt for a **high temperature** (e.g., 0.7--1.0) and a **high top_p** (e.g., 0.9--0.95) to unlock a broader spectrum of ideas while maintaining reasonable coherence.

- **Chatbots and Conversational Agents:**
  A balanced approach (medium temperature around 0.5--0.7, with a moderate top_p and top_k) can provide engaging and natural-sounding responses without veering off-topic.

### Experiment and Iterate

The key to mastering these parameters is experimentation:

- **Adjust one at a Time:** Tweak temperature or top_p independently to see their individual effects.

- **Mix and Match:** Combine temperature with top_p or top_k settings to find the optimal balance for your specific task.

## Test it yourself!

Want to experiment firsthand with these parameters? You can clone our GitHub repository and use a simple UI to tweak the settings for different models. It's a fun and hands-on way to see how temperature, top_p, and top_k influence the text generation results.

## Here is The Code Script:

### Install required libraries

pip install transformers torch

### Main code

from transformers import GPT2Tokenizer, GPT2LMHeadModel

```python
# Load a pre-trained GPT model and tokenizer
model_name = "gpt2" # you can change the model name to other models but keep in mind that the tokenizer and model should match along with imports
tokenizer = GPT2Tokenizer.from_pretrained(model_name)
model = GPT2LMHeadModel.from_pretrained(model_name)
# Encode a prompt text to get input_ids
prompt_text = "Once upon a time, in a land far, far away,"
input_ids = tokenizer.encode(prompt_text, return_tensors='pt')
# Set your parameters for temperature, top_p, and top_k
temperature = 0.7 # Controls creativity: higher is more creative, lower is more deterministic
top_p = 0.9 # Nucleus sampling: top_p controls the cumulative probability threshold
top_k = 50 # Top-K sampling: limits choices to top K most likely tokens
# Generate text using the model with the specified parameters
output = model.generate(
```

input_ids,

```python
max_length=150, # Max length of generated text
temperature=temperature, # Adjust temperature for creativity
top_p=top_p, # Apply top_p sampling
top_k=top_k, # Apply top_k sampling
num_return_sequences=1, # Number of sequences to generate
no_repeat_ngram_size=2, # Prevent repeating n-grams for more natural output
pad_token_id=tokenizer.eos_token_id # Ensures padding with EOS token
)
# Decode the generated text and print the result
generated_text = tokenizer.decode(output[0], skip_special_tokens=True)
print(generated_text)
```

## Conclusion

At this point, you should know the role of temperature, top_p, and top_k parameters to strike a balance between creativity, coherence, and consistency in generated text by AI.

If it\'s unclear to you how you can adjust them for your purpose, kindly experiment with the Gradio Interface of the GitHub repo for hands-on implementation.

One size does NOT fit all! Try these out to achieve just the output that you require, creative, fact-based, deterministic, or any combination thereof!
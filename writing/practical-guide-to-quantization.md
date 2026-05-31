---
title: "A Practical Guide to Quantization"
description: "How quantization lets you run large language models on consumer hardware — the math behind it, and working code using BitsAndBytes 4-bit and 8-bit configs."
date: 2024-09-03
category: "Infrastructure"
readTime: "3 min"
topics: ["quantization", "llm", "inference", "bitsandbytes"]
---

# **What Is Quantization and Its Practical Guide**

Have you ever tried to run a powerful AI model but got an error saying your computer doesn\'t have enough memory? You\'re not alone. Today\'s AI models are massive, often requiring expensive GPUs with huge amounts of memory.

Quantization is a clever technique that reduces model size by changing how numbers are stored, using simpler, less precise formats that need far less memory. Think of it like compressing a photo: you trade a small amount of quality for a much smaller file size.

In this guide, we\'ll explore how quantization works under the hood and show you practical code examples using BitsAndBytes. You\'ll learn to implement both 4-bit and 8-bit quantization with just a few lines of code, making large language models more accessible on consumer hardware. Ready to optimize your AI models? Let\'s dive in!

## **Why Do We Need Quantization?**

Our consumer hardware will never be enough to run new state-of-the-art models coming every now and then with billions of parameters, but that should not let us stop from trying them!!

This is where Quantization does its magic by letting us use a 32B parameter mode, i.e. a 70 GB model within 24 GB of GPU. We will say later on how to do it ourselves.

Quantization enables us to use large models on our GPU, which would not be possible otherwise at the cost of a loss of some precision.

## **How Does Quantization Work?**

Under the hood, Quantization converts higher precision floating points, such as fp32, to numbers like bf16, int8, int4, etc. It leads to the loss of some precision by losing the decimal points. Let's break down the math in a simple way (no need to worry, it's easy, I promise).

Usually, in our AI world, FP are stored in IEEE 754 Standard and are divided into 3 parts: Sign bit, Exponent Bit and Mantissa(fraction). Floating points are a way to store numbers in base two.

Their format is: [sign bit][exponent bits][mantissa bits]

Now, to keep it extremely simple, FP32 has 1 sign bit, 8 exp bits, and 23 mantissa better known as the fraction. BF16 has the size, 1 sign bit, 8 exp bits, and 7 fraction bits. Now, by losing these fractional values, we do lose a little bit of precision, but by converting FP32 to BF16, we can load the same model in half the size. This was an oversimplified example of how things work, actually, but this is one of the core parts of Quantization.

## **Practical Ways To Do Quantization**

### **BitsAndBytes Configuration**

BitsAndBytes provides the most straightforward approach to model Quantization, supporting both 8-bit and 4-bit Quantization with minimal code changes.

Prerequisite: pip install bitsandbytes, accelerate

#### 4-bit Quantization Setup

from transformers import AutoModelForCausalLM, BitsAndBytesConfig

import torch

# Configure 4-bit quantization

bnb_config = BitsAndBytesConfig(

load_in_4bit=True,

bnb_4bit_compute_dtype=torch.float16,

bnb_4bit_use_double_quant=True,

bnb_4bit_quant_type=\"nf4\"

)

# Load quantized model

model = AutoModelForCausalLM.from_pretrained(

\"your-model-name\",

quantization_config=bnb_config,

device_map=\"auto\"

)

#### 8-bit Quantization Configuration

# 8-bit quantization config

bnb_config = BitsAndBytesConfig(

load_in_8bit=True,

bnb_8bit_compute_dtype=torch.float16

)

## Comparison of Quantization Methods

  **Method**     **Precision**   **Speed**      **Accuracy**       **Use Case**
  -------------- --------------- -------------- ------------------
  FP16           Half            2x faster      High               General inference

  INT8           8-bit           4x faster      Good               Production deployment

  INT4           4-bit           8x faster      Moderate           Resource-constrained devices

  NF4            4-bit           8x faster      Better than INT4   Advanced applications

These were the simple, easy to use ways that we can use in our daily code whenever we need quantization. There are many other advanced techniques like GGUF, GPTQ, AWQ and more but they are performed either during training or after training, giving us a quantized model, on the other hand, bnb comes in handy when we need it last minute and saves us the pain of dealing with complicated computation and hours of training!

Happy Quantizing!! 😀
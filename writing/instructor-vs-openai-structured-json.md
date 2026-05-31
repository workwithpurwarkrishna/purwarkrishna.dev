---
title: "Instructor vs. OpenAI Structured JSON in Production"
description: "A hands-on comparison of Instructor and OpenAI's native structured output for production AI systems — where each shines and where each breaks."
date: 2024-10-08
category: "Systems"
readTime: "12 min"
topics: ["structured-output", "openai", "pydantic", "llm"]
---

Meta Description- Discover how Instructor's Pydantic-based structured output beats OpenAI's JSON for complex schemas, ensuring validation and deep nesting support.

Why the Instructor Beats OpenAI for Structured JSON Output

Integrating LLMs in our code and workflow is surely exciting, but it can get tiresome quickly as we need our outputs to follow proper structure/schema, and need to validate them along the way. This is where Instructor shines, let's go through it one step at a time, see how it performs compared to OpenAI and much more.

First, let's understand what Structured Output means!

Structured Output means getting output in a particular schema, widely used as JSON. Strictly adhering to JSON output enables us to use LLM in traditional or AI-enabled services.

Instructor's library enforces strict JSON schemas via Pydantic integration, enabling immediate validation and deep-nesting support out of the box. In contrast, OpenAI's native structured-output feature works well for small, simple schemas but quickly breaks on complex or nested data, forcing manual workarounds.

**The key takeaway:** *The Instructor transforms schema complexity from a blocker into a one-line response_model call, streamlining development and reducing error handling.*

## Why Structured Output Matters?

- LLMs generate probabilistic texts which can sometimes be different from what we expect, and hence they need to follow a strict schema.

- Structured Output provides us with that predictability, lets us validate the code and helps in integrating the code into pipelines due to its ease and reliability.

## Overview of Instructor Library

Started by [Jason Liu](https://github.com/jxnl), now with 200+ contributors and more than 2.5M downloads per month, Instructor ensures that we get structured output that strictly adheres to our schema.Core features: Pydantic integration, vendor-agnostic support, complexity handling

### Install the core library via pip:

pip install instructor



### Basic Usage Snippet:

import instructor

from openai import OpenAI

from pydantic import BaseModel

# 1. Define the shape of the data you want

class UserInfo(BaseModel):

name: str

age: int

# 2. Create an Instructor client for your LLM provider

client = instructor.from_openai(OpenAI())

# 3. Call the chat completions API with your Pydantic model

user = client.chat.completions.create(

model=\"gpt-4.1-mini\",

response_model=UserInfo,

messages=[],

)

# 4. Access validated, structured fields

print(user.name) # Alice

print(user.age) # 28

## Overview of OpenAI's Built-in Structured Output

- Easy to use as it is built in, it works well with simple and small schema that only requires JSON output.

- Limitations: Pydantic validation issues, schema complexity breakdown

## Side-by-Side Comparison of Instructor Library and OpenAI Structured Output

  **Feature**                  **Instructor Library**                   **OpenAI Structured Output**
  ---------------------------- ----------------------------------------
  Vendor lock-in               Works with any supported LLM             Tied to OpenAI's API
  Validation support           Native Pydantic validators               Fails on complex or nested schemas
  Schema complexity handling   Handles deep nesting seamlessly          Breaks on large/complex schemas
  Ease of use                  Single-step response_model integration   Requires manual crafting, parsing, and error handling
  Error messaging              Clear Pydantic-style errors              Cryptic JSON schema errors

## Simple Example: Species Extraction

In this example, we would focus on the validation of our schema and compare how both approaches perform.

### Instructor version 

**Code:**

# Import required libraries

from openai import OpenAI # OpenAI\'s official Python client

import instructor # Library for structured outputs from LLMs

from pydantic import BaseModel, field_validator # For data validation

from dotenv import load_dotenv # To load environment variables from .env file

# Load environment variables (like API keys) from .env file

load_dotenv()

# Define a data model for species information using Pydantic

# This ensures the data follows a specific structure and validation rules

class Species(BaseModel):

name: str # Species name as a string

habitat: str # Where the species lives

average_lifespan: int # Average lifespan in years

# Custom validator to ensure species name is in capital letters

\@field_validator(\"name\")

def name_must_be_capital(cls, v: str) -> str:

if not v.isupper():

raise ValueError(\"Species name must be in capital letters.\")

return v

# Initialize the OpenAI client with instructor wrapper

# This allows us to get structured JSON responses from the model

client = instructor.from_openai(OpenAI(), mode=instructor.Mode.JSON)

# Sample text containing information about a species

paragraph = \"\"\"

The African elephant is one of the largest land animals. It typically lives in savannas and forests.

These elephants can live up to 70 years in the wild.

\"\"\"

# Make an API call to GPT-4 to extract structured information

# The response will be automatically converted to our Species model

response = client.chat.completions.create(

model=\"gpt-4.1-mini-2025-04-14\", # Specify which model to use

response_model=Species, # Tell the model to format response as Species object

messages=[

\",

}

],

)

# Print the structured response

print(response)

**Output:**

name=\'AFRICAN ELEPHANT\' habitat=\'savannas and forests\' average_lifespan=70

**The output is exactly what we want.**

### OpenAI version

**Code:**

# Import required libraries

from openai import OpenAI # OpenAI\'s official Python client

from pydantic import BaseModel, field_validator, ValidationError # For data validation and error handling

from dotenv import load_dotenv # To load environment variables from .env file

# Load environment variables (like API keys) from .env file

load_dotenv()

# Define a data model for species information using Pydantic

# This ensures the data follows a specific structure and validation rules

class Species(BaseModel):

name: str # Species name as a string

habitat: str # Where the species lives

average_lifespan: int # Average lifespan in years

# Custom validator to ensure species name is in capital letters

# This will cause validation errors if the model returns lowercase names

\@field_validator(\"name\")

def name_must_be_capital(cls, v: str) -> str:

if not v.isupper():

raise ValueError(\"Species name must be in capital letters.\")

return v

# Initialize the basic OpenAI client

# Note: This version doesn\'t use instructor, which means we\'ll need to handle

# response parsing and validation manually

client = OpenAI()

# Sample text containing information about a species

# Note: The text contains lowercase \"african\" which will cause validation errors

# This demonstrates why instructor\'s automatic formatting is helpful

paragraph = \"\"\"

The african elephant is one of the largest land animals. It typically lives in savannas and forests.

These elephants can live up to 70 years in the wild.

\"\"\"

# Try to parse the response and handle potential errors

try:

# Make an API call to GPT-4 to extract structured information

# Note: Without instructor, we need to manually parse and validate the response

response = client.responses.parse(

model=\"gpt-4.1-mini-2025-04-14\", # Specify which model to use

input=[

\",

}

],

text_format=Species, # Attempt to format response as Species object

)

# Print the parsed response if successful

print(response.output_parsed)

except ValidationError as ve:

# Handle validation errors (e.g., when species name isn\'t in capital letters)

print(\"Validation Error:\")

for error in ve.errors():

print(f\"Field:  - Error: \")

except Exception as e:

# Handle any other unexpected errors

print(\"An error occurred while processing the response:\")

print(str(e))

# This version is more prone to errors because:

# 1. It doesn\'t automatically format the response

# 2. It requires manual error handling

# 3. The model might return data in an unexpected format

# 4. We need to handle validation ourselves

**Output:**

Validation Error:

Field: name - Error: Value error, Species name must be in capital letters.

It fails upon validation and throws an error. On top of that, to make sure that the code doesn't explode, I had to write extra try & except, which was not the case with the Instructor.

**Key takeaway**: Instructor succeeds out of the box.

## Complex Example: Financial Analysis

**Model definition** (nested Pydantic classes)

main.py:

from typing import Dict, List, Optional, Union, Literal

from datetime import datetime

from pydantic import BaseModel, Field

class FinancialAnalysisModel(BaseModel):

\"\"\"

Base model for financial data analysis with nested classes

for comparing structured output approaches.

This model demonstrates a complex nested structure that can be used to:

1\. Validate financial data

2\. Ensure type safety

3\. Provide structured output for financial analysis

4\. Compare different approaches to data extraction

\"\"\"

class TransactionData(BaseModel):

\"\"\"

Nested class for detailed transaction information.

This class enforces strict typing and validation for financial transactions.

\"\"\"

# Enforce specific transaction types using Literal type

transaction_type: Literal[\"deposit\", \"withdrawal\", \"transfer\", \"investment\"] = Field(

\..., description=\"The type of financial transaction\"

)

amount: float = Field(\..., description=\"Transaction amount in specified currency\")

currency_code: str = Field(\..., description=\"Three-letter currency code\")

timestamp: datetime = Field(\..., description=\"ISO format timestamp of the transaction\")

status: str = Field(\..., description=\"Current status of the transaction\")

# Optional field that can be None

notes: Optional[str] = Field(None, description=\"Additional transaction notes\")

# Dictionary for flexible metadata storage

metadata: Dict[str, Union[str, float, bool]] = Field(

default_factory=dict, description=\"Additional contextual information\"

)

class AccountSummary(BaseModel):

\"\"\"

Nested class for account summary information.

Provides a structured way to store account-level financial data.

\"\"\"

account_id: str = Field(\..., description=\"Unique identifier for the account\")

account_type: str = Field(\..., description=\"Type of financial account\")

balance: float = Field(\..., description=\"Current balance in base currency\")

risk_level: Literal[\"low\", \"medium\", \"high\"] = Field(

\..., description=\"Risk assessment of the account\"

)

# Dictionary to store various performance metrics

performance_metrics: Dict[str, float] = Field(

default_factory=dict, description=\"Key performance indicators for the account\"

)

last_updated: str = Field(\..., description=\"When the data was last refreshed\")

# Top-level fields for the financial analysis

client_id: str = Field(\..., description=\"Unique identifier for the client\")

analysis_date: str = Field(\..., description=\"Date of financial analysis\")

# Dictionary mapping account IDs to their summaries

accounts: Dict[str, AccountSummary] = Field(

default_factory=dict, description=\"Map of account IDs to account summaries\"

)

# List of transactions for the analysis period

transactions: List[TransactionData] = Field(

default_factory=list, description=\"List of relevant transactions in analysis period\"

)

# Flexible dictionary for analysis results and recommendations

result: Dict[str, Union[float, str, bool]] = Field(

default_factory=dict, description=\"Analysis results and recommendations\"

)

# Sample text demonstrating the kind of financial data we\'ll be parsing

# This text contains various pieces of information that need to be extracted

# and structured according to our model

SAMPLE_TEXT = \"\"\"

Client C123456\'s financial analysis from May 15, 2025 shows one investment account (A001) with a balance of usd 158,432.50.

The account has medium risk, with YTD return of 8.3%, one-year return of 12.1%, and volatility of 6.7%.

The account was last updated on May 14, 2025 at 11:00 PM UTC.

A recent transaction shows an investment of usd 10,000 completed on May 1, 2025 at 2:30 PM UTC,

noted as \"Monthly portfolio contribution\" in the \"scheduled\" category for an \"index_fund\".

The analysis projects a 10.5% annual return, with a risk-adjusted score of 7.8.

Rebalancing is recommended, and tax efficiency is moderate.

\"\"\"

**Instructor workflow**

structured_output_instructor.py:

# Import required libraries

from openai import OpenAI # OpenAI\'s official Python client

import instructor # Library for structured outputs from LLMs

from main import FinancialAnalysisModel, SAMPLE_TEXT # Import our data model and sample text

from dotenv import load_dotenv # To load environment variables from .env file

# Load environment variables (like API keys) from .env file

load_dotenv()

# Initialize the OpenAI client with instructor wrapper

# This enables automatic structured output parsing and validation

client = instructor.from_openai(OpenAI(), mode=instructor.Mode.JSON)

def analyze_financial_data(text):

\"\"\"

Analyze financial data using OpenAI\'s chat completions API with instructor.

This function demonstrates how instructor simplifies the process of:

1\. Extracting structured data from unstructured text

2\. Validating the extracted data against our model

3\. Handling complex nested structures

4\. Ensuring type safety

Args:

text: The financial text to analyze (unstructured text containing financial information)

Returns:

Extracted financial analysis data matching FinancialAnalysisModel structure

Returns None if an error occurs during processing

\"\"\"

try:

# Make API call to GPT-4 with instructor\'s structured output handling

# The response will be automatically parsed and validated against FinancialAnalysisModel

response = client.chat.completions.create(

response_model=FinancialAnalysisModel, # Specify our model for structured output

messages=[

],

model=\"gpt-4.1-mini-2025-04-14\", # Specify which model to use

)

return response

except Exception as e:

# Handle any errors that occur during processing

print(f\"Error occurred: \")

return None

# When running this script directly, analyze the sample text

if __name__ == \"__main__\":

# Process the sample financial text and print the structured result

result = analyze_financial_data(SAMPLE_TEXT)

print(result)

**Output:**

python3 structured_outputs_instructor.py

client_id=\'C123456\' analysis_date=\'2025-05-15\' accounts=, last_updated=\'2025-05-14T23:00:00Z\')} transactions=[TransactionData(transaction_type=\'investment\', amount=10000.0, currency_code=\'USD\', timestamp=datetime.datetime(2025, 5, 1, 14, 30, tzinfo=TzInfo(UTC)), status=\'completed\', notes=\'Monthly portfolio contribution\', metadata=)] result=

The output is a mix of strings, lists and dictionaries, as defined in the FinancialAnalysisModel class, which is gracefully handled by the Instructor.

**OpenAI workflow** (standard parse fails + workaround code)\
structured_outputs_openai.py:

# Import required libraries

from openai import OpenAI # OpenAI\'s official Python client

from main import FinancialAnalysisModel, SAMPLE_TEXT # Import our data model and sample text

import os # For environment variable access

from dotenv import load_dotenv # To load environment variables from .env file

# Load environment variables (like API keys) from .env file

load_dotenv()

# Initialize basic OpenAI client without instructor wrapper

# Note: This version lacks automatic structured output handling

client = OpenAI(api_key=os.getenv(\'OPENAI_API_KEY\'))

def analyze_financial_data(text):

\"\"\"

Analyze financial data using OpenAI\'s basic chat completions API.

This implementation demonstrates the limitations of using OpenAI\'s basic client:

1\. No automatic handling of complex nested structures

2\. Manual parsing required for nested objects

3\. No built-in validation against our model

4\. More prone to errors with complex data types

Args:

text: The financial text to analyze (unstructured text containing financial information)

Returns:

Extracted financial analysis data matching FinancialAnalysisModel structure

Returns None if an error occurs during processing

\"\"\"

try:

# Call the chat completions API with JSON response format

# Note: This approach struggles with nested structures in FinancialAnalysisModel

response = client.responses.parse(

model=\"gpt-4o-2024-08-06\", # Specify which model to use

input=[

,

],

text_format=FinancialAnalysisModel, # Attempt to format as our model

)

# Extract the parsed output

# Note: This might fail for complex nested structures

result = response.output_parsed

return result

except Exception as e:

# Handle any errors that occur during processing

# Common errors include:

# - Nested structure parsing failures

# - Type validation errors

# - Missing required fields

print(f\"Error occurred: \")

return None

# When running this script directly, analyze the sample text

if __name__ == \"__main__\":

# Process the sample financial text and print the structured result

# Note: This is likely to fail due to the complexity of our model

result = analyze_financial_data(SAMPLE_TEXT)

print(result)

**Output:**

python3 structured_outputs_openai.py

Error occurred: Error code: 400 - } None



As we can see, it did not work when the schema got complex; to get the same result with OpenAI, we would have to do a complex manoeuvre, write a schema for every part and then parse it, increasing the complexity and burden, which doesn't make any sense.

**Key takeaway**: The Instructor handles complexity with minimal code against this monstrosity we have to do by defining our schema again in JSON format.

## Conclusion

Instructor's model-first design turns structured output into a predictable, maintainable process. By integrating Pydantic validators and embracing vendor-agnostic support, it ensures that any response aligns exactly with your data models, no extra parsing, no mysterious JSON errors.

Meanwhile, relying solely on OpenAI's built-in JSON formatting quickly becomes untenable as schema complexity grows, leaving developers to build elaborate manual workarounds.

Ultimately, Instructor empowers teams to adopt LLM-powered pipelines without sacrificing reliability or debugging clarity.
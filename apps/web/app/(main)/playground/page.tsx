import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { CodePlayground, PlaygroundLanguage, decodePlaygroundState } from "@/components/code-playground";
import { cn } from "@/lib/design-system";

export const metadata: Metadata = {
  title: "Code Playground - Claude Insider",
  description: "Interactive multi-language code playground with AI assistance. Write, run, and experiment with JavaScript, TypeScript, Python, and more.",
};

// Component to handle shared code from URL
function SharedPlayground({ code, language }: { code: string; language: PlaygroundLanguage }) {
  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-4">
        <div className="px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/20 via-blue-500/20 to-cyan-500/20 border border-violet-500/20">
          <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Shared Code</span>
        </div>
        <span className="text-sm text-gray-500">Someone shared this code with you</span>
      </div>
      <CodePlayground
        title="Shared Code"
        description="This code was shared via link - feel free to edit and experiment!"
        language={language}
        initialCode={code}
        allowLanguageSwitch={true}
        enableSharing={true}
        playgroundId="shared"
      />
    </div>
  );
}

// Example code snippets for the playground
interface Example {
  id: string;
  title: string;
  description: string;
  language: PlaygroundLanguage;
  code: string;
}

const examples: Example[] = [
  {
    id: "api-call",
    title: "Claude API Call",
    description: "Basic example of calling the Claude API with streaming",
    language: "javascript",
    code: `// Example: Calling the Claude API
// Note: This is a simulation - actual API calls require server-side code

const message = {
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [
    { role: "user", content: "Hello, Claude!" }
  ]
};

console.log("Request payload:");
console.log(JSON.stringify(message, null, 2));

// Simulated response
const response = {
  id: "msg_01XYZ...",
  type: "message",
  role: "assistant",
  content: [
    { type: "text", text: "Hello! How can I help you today?" }
  ],
  model: "claude-sonnet-4-20250514",
  usage: { input_tokens: 12, output_tokens: 9 }
};

console.log("\\nSimulated response:");
console.log(JSON.stringify(response, null, 2));`,
  },
  {
    id: "tool-definition",
    title: "Tool Definition",
    description: "Define a tool for Claude to use in your applications",
    language: "javascript",
    code: `// Example: Defining a tool for Claude
const weatherTool = {
  name: "get_weather",
  description: "Get the current weather in a location",
  input_schema: {
    type: "object",
    properties: {
      location: {
        type: "string",
        description: "City and state, e.g. San Francisco, CA"
      },
      unit: {
        type: "string",
        enum: ["celsius", "fahrenheit"],
        description: "Temperature unit"
      }
    },
    required: ["location"]
  }
};

console.log("Tool Definition:");
console.log(JSON.stringify(weatherTool, null, 2));

// Simulated tool call
const toolUse = {
  type: "tool_use",
  id: "toolu_01ABC...",
  name: "get_weather",
  input: { location: "San Francisco, CA", unit: "fahrenheit" }
};

console.log("\\nSimulated tool use:");
console.log(JSON.stringify(toolUse, null, 2));`,
  },
  {
    id: "streaming",
    title: "Streaming Response",
    description: "Handle streaming responses from Claude",
    language: "javascript",
    code: `// Example: Simulating streaming response handling

async function simulateStream() {
  const chunks = [
    "Hello",
    "! ",
    "I'm ",
    "Claude",
    ", ",
    "your ",
    "AI ",
    "assistant",
    "."
  ];

  console.log("Streaming response:");
  let fullText = "";

  for (const chunk of chunks) {
    // Simulate network delay
    await new Promise(r => setTimeout(r, 100));
    fullText += chunk;
    console.log(\`Chunk: "\${chunk}" | Full: "\${fullText}"\`);
  }

  console.log("\\nFinal message:", fullText);
  return fullText;
}

simulateStream();`,
  },
  {
    id: "error-handling",
    title: "Error Handling",
    description: "Handle API errors gracefully",
    language: "javascript",
    code: `// Example: Error handling patterns

class APIError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.name = "APIError";
  }
}

async function callAPI(endpoint) {
  // Simulate different error scenarios
  const scenarios = [
    { status: 200, success: true },
    { status: 429, error: "Rate limit exceeded" },
    { status: 401, error: "Invalid API key" },
    { status: 500, error: "Internal server error" }
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

  if (scenario.success) {
    console.log("✅ Request successful!");
    return { data: "Response data here" };
  }

  throw new APIError(scenario.status, scenario.error);
}

async function main() {
  try {
    const result = await callAPI("/v1/messages");
    console.log("Result:", result);
  } catch (error) {
    if (error instanceof APIError) {
      console.log(\`❌ API Error (\${error.status}): \${error.message}\`);

      if (error.status === 429) {
        console.log("→ Retry after delay...");
      } else if (error.status === 401) {
        console.log("→ Check your API key");
      }
    } else {
      console.log("❌ Unexpected error:", error.message);
    }
  }
}

main();`,
  },
  // Python examples
  {
    id: "python-basics",
    title: "Python Basics",
    description: "Basic Python syntax with print, lists, and loops (simulated)",
    language: "python",
    code: `# Python Basics - Simulated Execution
# This runs in a Python simulation environment

# Variables and types
name = "Claude"
version = 3.5
is_ai = True

print(f"Hello, I'm {name}!")
print(f"Version: {version}")
print(f"Is AI: {is_ai}")

# Lists and loops
numbers = [1, 2, 3, 4, 5]
print(f"\\nNumbers: {numbers}")
print(f"Sum: {sum(numbers)}")
print(f"Max: {max(numbers)}")

# List comprehension
squares = [x ** 2 for x in range(5)]
print(f"Squares: {squares}")

# For loop
print("\\nCounting:")
for i in range(3):
    print(f"  Count: {i}")`,
  },
  {
    id: "python-functions",
    title: "Python Functions",
    description: "Define and call functions in Python (simulated)",
    language: "python",
    code: `# Python Functions - Simulated Execution

def greet(name):
    return f"Hello, {name}!"

def calculate_area(length, width):
    return length * width

def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

# Call our functions
print(greet("World"))
print(f"Area of 5x3: {calculate_area(5, 3)}")

# Generate Fibonacci sequence
print("\\nFibonacci sequence:")
for i in range(8):
    print(f"  fib({i}) = {fibonacci(i)}")`,
  },
  {
    id: "python-data",
    title: "Python Data Processing",
    description: "Working with data structures in Python (simulated)",
    language: "python",
    code: `# Python Data Processing - Simulated Execution

# List operations
fruits = ["apple", "banana", "cherry", "date"]
print(f"Fruits: {fruits}")
print(f"Length: {len(fruits)}")
print(f"Sorted: {sorted(fruits)}")

# Filter with list comprehension
long_fruits = [f for f in fruits if len(f) > 5]
print(f"Long names: {long_fruits}")

# Dictionary-like operations (using lists for simulation)
scores = [85, 92, 78, 95, 88]
print(f"\\nScores: {scores}")
print(f"Average: {sum(scores) / len(scores)}")
print(f"Highest: {max(scores)}")
print(f"Lowest: {min(scores)}")

# Range and enumerate
print("\\nIndexed fruits:")
for i, fruit in enumerate(fruits):
    print(f"  {i}: {fruit}")`,
  },
  // Go example (view only)
  {
    id: "go-example",
    title: "Go Example",
    description: "Claude API call in Go (view only - cannot run in browser)",
    language: "go",
    code: `package main

import (
    "context"
    "fmt"
    "github.com/anthropics/anthropic-sdk-go"
)

func main() {
    client := anthropic.NewClient()

    message, err := client.Messages.Create(
        context.Background(),
        anthropic.MessageCreateParams{
            Model:     anthropic.F("claude-sonnet-4-20250514"),
            MaxTokens: anthropic.F(int64(1024)),
            Messages: anthropic.F([]anthropic.MessageParam{
                anthropic.NewUserMessage(
                    anthropic.NewTextBlock("Hello, Claude!"),
                ),
            }),
        },
    )

    if err != nil {
        panic(err)
    }

    fmt.Printf("Response: %s\\n", message.Content[0].Text)
}`,
  },
  // JSON validation
  {
    id: "json-validation",
    title: "JSON Validation",
    description: "Validate and format JSON data",
    language: "json",
    code: `{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello, Claude!"
    }
  ],
  "system": "You are a helpful AI assistant.",
  "temperature": 0.7,
  "top_p": 1.0
}`,
  },
];

interface PageProps {
  searchParams: Promise<{ code?: string; id?: string }>;
}

export default async function PlaygroundPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const sharedCode = params.code ? decodePlaygroundState(params.code) : null;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Shared Code Section */}
        {sharedCode && (
          <SharedPlayground code={sharedCode.code} language={sharedCode.language} />
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10 border border-violet-500/20 mb-4">
            <svg
              className="w-4 h-4 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"
              />
            </svg>
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Interactive</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Code Playground</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Experiment with code in real-time. Supports JavaScript, TypeScript, Python (simulated), Go, Rust, and more.
            Get AI assistance to understand and improve your code.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-4">
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-500/20 text-yellow-600 dark:text-yellow-400">JavaScript</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400">TypeScript</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">Python</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">Go</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-600 dark:text-orange-400">Rust</span>
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-lime-500/20 text-lime-600 dark:text-lime-400">JSON</span>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div
            className={cn(
              "p-4 rounded-xl",
              "bg-gray-50 dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Run Code</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Execute JavaScript, TypeScript, and Python code in the browser
            </p>
          </div>

          <div
            className={cn(
              "p-4 rounded-xl",
              "bg-gray-50 dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <svg
                  className="w-5 h-5 text-violet-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">AI Assistance</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Get AI help to explain, improve, or debug your code
            </p>
          </div>

          <div
            className={cn(
              "p-4 rounded-xl",
              "bg-gray-50 dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.098 19.902a3.75 3.75 0 005.304 0l6.401-6.402M6.75 21A3.75 3.75 0 013 17.25V4.125C3 3.504 3.504 3 4.125 3h5.25c.621 0 1.125.504 1.125 1.125v4.072M6.75 21a3.75 3.75 0 003.75-3.75V8.197M6.75 21h13.125c.621 0 1.125-.504 1.125-1.125v-5.25c0-.621-.504-1.125-1.125-1.125h-4.072M10.5 8.197l2.88-2.88c.438-.439 1.15-.439 1.59 0l3.712 3.713c.44.44.44 1.152 0 1.59l-2.879 2.88M6.75 17.25h.008v.008H6.75v-.008z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Edit & Experiment</h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Modify code examples and see results immediately
            </p>
          </div>
        </div>

        {/* Examples */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Try These Examples</h2>

          {examples.map((example) => (
            <CodePlayground
              key={example.id}
              title={example.title}
              description={example.description}
              language={example.language}
              initialCode={example.code}
            />
          ))}
        </div>

        {/* Custom Playground */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Your Playground</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Start with a blank canvas and write your own code. Switch between languages using the dropdown.
            Use the AI assistant to help you along the way.
          </p>

          <CodePlayground
            title="Custom Code"
            description="Write and execute your own code - switch languages above"
            language="javascript"
            allowLanguageSwitch={true}
            enableSharing={true}
            playgroundId="custom"
            initialCode={`// Write your code here - use the language dropdown to switch!
console.log("Hello from the playground!");

// Try some experiments:
// - Arrays and objects
// - Functions and classes
// - Async/await patterns

const greet = (name) => \`Hello, \${name}!\`;
console.log(greet("World"));`}
          />
        </div>
      </main>

      <Footer />
    </div>
  );
}

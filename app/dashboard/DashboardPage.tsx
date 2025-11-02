"use client";

import { useState, useRef, useEffect } from "react";
import Sidebar from "@/components/sidebar";
import { HiOutlinePaperAirplane, HiOutlineClipboardDocumentList, HiOutlineSparkles, HiOutlineBookOpen, HiOutlineHeart } from "react-icons/hi2";

const featureExamples = [
  {
    icon: <HiOutlineClipboardDocumentList className="w-5 h-5 text-emerald-600" />,
    text: "Input: 'tomato, chicken, pasta' — Get recipes using these ingredients.",
  },
  {
    icon: <HiOutlineSparkles className="w-5 h-5 text-emerald-600" />,
    text: "Prompt: 'Suggest a vegetarian dinner with mushrooms and spinach.'",
  },
  {
    icon: <HiOutlineBookOpen className="w-5 h-5 text-emerald-600" />,
    text: "Ask: 'How do I cook a quick pasta with what I have?'",
  },
  {
    icon: <HiOutlineHeart className="w-5 h-5 text-emerald-600" />,
    text: "Prompt: 'Save this recipe for later.'",
  },
];

type Message = {
  role: "user" | "agent";
  content: string;
};

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>(
    [
      {
        role: "agent",
        content:
          "👋 Hi! I’m your FoodFindr AI Agent. Tell me what ingredients you have, or ask for a recipe, meal plan, or to save a favorite. How can I help you cook today?",
      },
    ]
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Simulate AI agent response
  async function handleSend(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages((msgs) => [...msgs, userMsg]);
    setInput("");
    setLoading(true);

    // Simulate AI response based on features
    setTimeout(() => {
      let reply = "Sorry, I didn't understand. Please try again!";
      if (/ingredient|have|tomato|chicken|pasta|spinach|mushroom/i.test(userMsg.content)) {
        reply =
          "Here’s a recipe you can make: <b>Chicken Tomato Pasta</b>.\n\nIngredients: chicken, tomato, pasta, olive oil, garlic.\nInstructions: 1. Cook pasta. 2. Sauté chicken and garlic. 3. Add tomatoes. 4. Combine with pasta. 5. Enjoy!";
      } else if (/vegetarian|dinner/i.test(userMsg.content)) {
        reply =
          "How about a <b>Mushroom & Spinach Stir Fry</b>? Sauté mushrooms and spinach with garlic and olive oil. Serve with rice or pasta!";
      } else if (/save|favorite/i.test(userMsg.content)) {
        reply = "Recipe saved to your favorites! ⭐";
      } else if (/quick|how do i cook/i.test(userMsg.content)) {
        reply =
          "For a quick meal, try boiling pasta and tossing it with olive oil, garlic, and any veggies you have!";
      } else if (/recipe|suggest/i.test(userMsg.content)) {
        reply =
          "Tell me your available ingredients, and I’ll suggest a recipe!";
      }
      setMessages((msgs) => [
        ...msgs,
        { role: "agent", content: reply },
      ]);
      setLoading(false);
    }, 1200);
  }

  return (
    <div className="flex min-h-screen bg-neutral-50 font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col items-center justify-center px-2 md:px-0 py-8">
        <div className="w-full max-w-2xl flex flex-col flex-1 bg-white/80 rounded-2xl shadow border border-neutral-100 min-h-[70vh]">
          {/* Header */}
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-100 to-white shadow ring-1 ring-neutral-100">
              <HiOutlineSparkles className="w-6 h-6 text-emerald-700" />
            </span>
            <span className="font-bold text-xl tracking-tight text-neutral-800">
              FoodFindr AI Agent
            </span>
          </div>
          {/* Chat area */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-xl text-base whitespace-pre-line transition-all
                    ${
                      msg.role === "user"
                        ? "bg-emerald-700 text-white rounded-br-none"
                        : "bg-neutral-100 text-neutral-900 rounded-bl-none"
                    }`}
                  dangerouslySetInnerHTML={{ __html: msg.content }}
                />
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] px-4 py-2 rounded-xl bg-neutral-100 text-neutral-900 rounded-bl-none animate-pulse">
                  FoodFindr AI is thinking...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {/* Input area */}
          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 px-6 py-4 border-t border-neutral-100 bg-white/90"
          >
            <input
              type="text"
              className="flex-1 rounded-lg border border-neutral-200 px-4 py-2 text-base focus:outline-none focus:ring-2 focus:ring-emerald-200 transition"
              placeholder="Type your ingredients or ask for a recipe…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              autoFocus
            />
            <button
              type="submit"
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg p-2 transition disabled:opacity-50 cursor-pointer"
              disabled={loading || !input.trim()}
              aria-label="Send"
            >
              <HiOutlinePaperAirplane className="w-6 h-6" />
            </button>
          </form>
          {/* Feature examples */}
          <div className="px-6 pb-4 pt-2">
            <div className="text-xs text-neutral-500 mb-2">Try these prompts:</div>
            <div className="flex flex-wrap gap-2">
              {featureExamples.map((ex, i) => (
                <button
                  key={i}
                  type="button"
                  className="flex items-center gap-2 bg-neutral-100 hover:bg-emerald-50 text-neutral-700 rounded-full px-3 py-1 text-xs font-medium transition cursor-pointer"
                  onClick={() => setInput(ex.text.replace(/^.*?['"](.+?)['"].*$/, "$1"))}
                >
                  {ex.icon}
                  {ex.text}
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
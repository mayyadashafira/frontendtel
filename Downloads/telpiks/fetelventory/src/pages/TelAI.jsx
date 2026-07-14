import { useState, useRef, useEffect, useCallback } from "react";
import { BrainCircuit, Send } from "lucide-react";
import "../styles/telai.css";
import PageHeader from "../components/PageHeader";
import { telAiService } from "../services/telAiService";
import { useAuth } from "../context/AuthContext";

export default function TelAI() {
  const { user: loggedInUser } = useAuth();
  const currentUser = loggedInUser || { name: "Guest", email: "" };
  const [search, setSearch] = useState("");
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      sender: "ai",
      text: "Hallo! I'm Telventory AI. What can I assist you with today ?",
    },
  ]);
  const [suggestions, setSuggestions] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState(null);
  const [conversationId, setConversationId] = useState(null);

  const threadEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    telAiService
      .getSuggestions()
      .then((items) => {
        if (isMounted) setSuggestions(items);
      })
      .catch(() => {
        if (isMounted) setSuggestions([]);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleSend = useCallback(
    async (rawText) => {
      const text = (rawText ?? inputValue).trim();
      if (!text || isSending) return;

      appendMessage({ id: `u-${Date.now()}`, sender: "user", text });
      setInputValue("");
      setError(null);
      setIsSending(true);

      const history = messages
        .filter((m) => m.id !== "welcome")
        .map((m) => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text,
        }));

      try {
        const { reply, conversationId: newConversationId } =
          await telAiService.sendMessage(text, { conversationId, history });
        if (newConversationId) setConversationId(newConversationId);
        appendMessage({ id: `a-${Date.now()}`, sender: "ai", text: reply });
      } catch (err) {
        setError("Tel AI couldn't respond right now. Please try again.");
      } finally {
        setIsSending(false);
      }
    },
    [inputValue, isSending, messages, conversationId, appendMessage]
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSend();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const keyword = search.trim().toLowerCase();
  const filteredMessages = keyword
    ? messages.filter((m) => m.text.toLowerCase().includes(keyword))
    : messages;
  const isSearching = keyword.length > 0;

  return (
    <>
      <PageHeader
        search={search}
        onSearchChange={setSearch}
        placeholder="Search this conversation..."
      />

      <div className="tel-ai">
        <div className="tel-ai-top">
          <h1 className="dash-title">
            <BrainCircuit size={28} />
            <span>Tel AI</span>
          </h1>
        </div>

        <div className="tel-ai__thread">
          {isSearching && filteredMessages.length === 0 && (
            <p className="dash-loading-text">No messages match your search.</p>
          )}

          {filteredMessages.map((message) => (
            <ChatBubble key={message.id} message={message} currentUser={currentUser} />
          ))}

          {!isSearching &&
            messages[messages.length - 1]?.sender === "ai" &&
            suggestions.length > 0 &&
            !isSending && (
              <div className="tel-ai__suggestions">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className="tel-ai__chip"
                    onClick={() => handleSend(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

          {isSending && (
            <div className="tel-ai__row tel-ai__row--ai">
              <AiAvatar />
              <div className="tel-ai__bubble tel-ai__bubble--typing" aria-live="polite">
                <span className="tel-ai__dot" />
                <span className="tel-ai__dot" />
                <span className="tel-ai__dot" />
              </div>
            </div>
          )}

          {error && (
            <p className="tel-ai__error" role="alert">
              {error}
            </p>
          )}

          <div ref={threadEndRef} />
        </div>

        <form className="tel-ai__composer" onSubmit={handleSubmit}>
          <div className="tel-ai__composer-bar">
            <input
              type="text"
              className="tel-ai__input"
              placeholder="Ask Telventory AI anything about asset..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              aria-label="Message Telventory AI"
            />
            <button
              type="submit"
              className="tel-ai__send"
              disabled={isSending || !inputValue.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="tel-ai__disclaimer">
            Telventory AI can make mistakes. Please verify important asset and network
            configuration data.
          </p>
        </form>
      </div>
    </>
  );
}

function ChatBubble({ message, currentUser }) {
  const isUser = message.sender === "user";
  return (
    <div className={`tel-ai__row ${isUser ? "tel-ai__row--user" : "tel-ai__row--ai"}`}>
      {!isUser && <AiAvatar />}
      <div className="tel-ai__group">
        <span className="tel-ai__sender-label">
          {isUser ? `${currentUser.name} (You)` : "Telventory AI"}
        </span>
        <div className={`tel-ai__bubble ${isUser ? "tel-ai__bubble--user" : ""}`}>
          {message.text.split("\n").map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      </div>
      {isUser && <UserAvatar currentUser={currentUser} />}
    </div>
  );
}

function AiAvatar() {
  return (
    <div className="tel-ai__avatar tel-ai__avatar--ai" aria-hidden="true">
      <BrainCircuit size={18} />
    </div>
  );
}

function UserAvatar({ currentUser }) {
  return (
    <div className="tel-ai__avatar tel-ai__avatar--user" aria-hidden="true">
      <span>{currentUser.name?.[0] ?? "U"}</span>
    </div>
  );
}

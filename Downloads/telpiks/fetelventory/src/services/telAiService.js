import { apiClient } from "./apiClient";

/**
 * telAiService.js
 * ------------------------------------------------------------------
 * Tel AI chatbot — tersambung ke backend FastAPI (app/routers/chatbot.py),
 * BUKAN memanggil Gemini API secara langsung dari browser. Pesan yang
 * dikirim ke sini diteruskan backend ke `chatbot_service.handle_chat()`,
 * yang men-*mask* data sensitif (IP/MAC/email/nama karyawan) terlebih
 * dahulu sebelum menyentuh Gemini, lalu balasannya sudah disanitasi
 * saat sampai di sini — komponen UI (TelAI.jsx) tinggal menampilkan
 * `reply` apa adanya.
 * ------------------------------------------------------------------
 */

/**
 * Starter suggestion chips shown before the user has typed anything.
 */
export const defaultSuggestions = [
  "How many Total assets are registered?",
  "Quick status summary of all assets?",
];

export const telAiService = {
  /**
   * Send a user message to Tel AI and get a reply.
   * @param {string} message
   * @param {{ conversationId?: string, history?: Array<{role: string, content: string}> }} options
   */
  async sendMessage(message, { conversationId = null, history = [] } = {}) {
    return apiClient.post("/tel-ai/chat", {
      message,
      conversationId,
      history,
    });
  },

  /**
   * Starter/quick-reply suggestion chips.
   */
  async getSuggestions() {
    try {
      const suggestions = await apiClient.get("/tel-ai/suggestions");
      return Array.isArray(suggestions) && suggestions.length ? suggestions : defaultSuggestions;
    } catch {
      return defaultSuggestions;
    }
  },
};

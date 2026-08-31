import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
const genAI = new GoogleGenerativeAI(apiKey);

export interface LiveNudgeResult {
  nudgeMessage: string;
  retryWindow: string;
}

export async function generateLiveNudge(
  customerName: string,
  amount: number,
  failureReason: string,
): Promise<LiveNudgeResult> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `You are a helpful UPI mandate recovery assistant. A UPI mandate debit has failed and we need to send a polite nudge to the customer.

Customer name: ${customerName}
Mandate amount: ₹${amount}
Failure reason: ${failureReason}

Respond ONLY with a JSON object (no markdown, no code fences) with exactly these two fields:
- "nudge_message": a short, polite WhatsApp message (max 2-3 sentences) to the customer explaining the failed debit and asking them to take action. Use the customer's name. Keep it warm and concise.
- "retry_window": a recommended retry window time based on the failure reason (e.g. "Tomorrow 9:00–11:00 AM IST" or "In 3 days at 9:00 AM IST"). Keep it short.

Example response:
{"nudge_message": "Hi ${customerName}, your ₹${amount} UPI mandate could not be debited due to ${failureReason}. Please ensure sufficient balance and we will retry automatically. Reply HELP for support.", "retry_window": "Tomorrow 9:00–11:00 AM IST"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '');

  try {
    const parsed = JSON.parse(cleaned);
    return {
      nudgeMessage: parsed.nudge_message ?? '',
      retryWindow: parsed.retry_window ?? '',
    };
  } catch {
    // If JSON parsing fails, return the raw text as the message
    return {
      nudgeMessage: cleaned || text,
      retryWindow: '',
    };
  }
}

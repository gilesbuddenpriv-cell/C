import Anthropic from '@anthropic-ai/sdk'
import type { Question } from '@/types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

interface RawQuestion {
  question: string
  optionA: string
  optionB: string
  optionC: string
  optionD: string
  correctOption: string
  explanation: string
}

function buildQuestions(
  raw: RawQuestion[],
  topicId: string | null,
  customTopicId: string | null,
): Omit<Question, 'id' | 'created_at'>[] {
  return raw.map((r) => ({
    topic_id: topicId,
    custom_topic_id: customTopicId,
    question_text: r.question,
    option_a: r.optionA,
    option_b: r.optionB,
    option_c: r.optionC,
    option_d: r.optionD,
    correct_option: r.correctOption.toLowerCase() as 'a' | 'b' | 'c' | 'd',
    explanation: r.explanation,
  }))
}

/**
 * Generate 30 MCQ questions for a pre-built BASRaT topic.
 */
export async function generateTopicQuestions(
  topicTitle: string,
  subtitle: string,
  topicId: string,
): Promise<Omit<Question, 'id' | 'created_at'>[]> {
  const prompt = `You are a BASRaT (British Association of Sport Rehabilitators and Trainers) examination expert.

Generate exactly 30 multiple-choice questions on the topic "${topicTitle}" (subtopics: ${subtitle}) for the BASRaT registration examination.

The BASRaT registration exam is a 100-question MCQ paper sat by sport rehabilitation students at undergraduate/degree level. Questions must test clinical knowledge, evidence-based practice, and professional reasoning appropriate to a qualifying Sport Rehabilitator.

Requirements:
- Cover a broad spread of the subtopics listed
- Mix question types: factual recall, clinical application, scenario-based reasoning, evidence interpretation
- Vary difficulty: approximately 40% straightforward, 40% applied, 20% challenging
- Each question must have exactly 4 options labelled A, B, C, D
- One and only one correct answer per question
- Explanation should be 2–3 sentences, concise and educational
- Do not write trick questions or use "all of the above" / "none of the above"

Return ONLY a valid JSON array with no markdown, no preamble, no trailing text:
[{"question":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctOption":"a","explanation":"..."}]

The correctOption field must be exactly one of the lowercase letters: a, b, c, or d.`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const raw: RawQuestion[] = JSON.parse(text)
  return buildQuestions(raw, topicId, null)
}

/**
 * Generate 30 MCQ questions from the text content of a user-uploaded document.
 */
export async function generateDocumentQuestions(
  documentText: string,
  customTopicId: string,
): Promise<Omit<Question, 'id' | 'created_at'>[]> {
  const prompt = `You are an expert at creating exam-style MCQ questions from educational content.

Below is the content of a document uploaded by a sport rehabilitation student. Generate exactly 30 multiple-choice questions based on this document, suitable for degree-level examination.

DOCUMENT CONTENT:
---
${documentText.slice(0, 12000)}
---

Requirements:
- Questions must be directly answerable from the document content
- Cover the full breadth of topics covered in the document
- Mix factual recall with applied/reasoning questions
- 4 options (A, B, C, D) per question, exactly one correct
- Concise 2–3 sentence explanation for the correct answer
- Do not use "all of the above" / "none of the above"

Return ONLY a valid JSON array with no markdown, no preamble:
[{"question":"...","optionA":"...","optionB":"...","optionC":"...","optionD":"...","correctOption":"a","explanation":"..."}]

The correctOption field must be exactly one of: a, b, c, or d.`

  const message = await client.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: prompt }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const raw: RawQuestion[] = JSON.parse(text)
  return buildQuestions(raw, null, customTopicId)
}

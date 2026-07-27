/**
 * AdaptivePath API client.
 *
 * All requests are routed to the FastAPI backend at http://localhost:8000.
 * The JWT token (stored in localStorage under "ap_token") is automatically
 * injected as an Authorization: Bearer header on every request.
 *
 * Exports:
 *   auth        — login(), signup(), me()
 *   learner     — fetchLearnerState()
 *   quiz        — fetchQuizQuestions(), submitQuiz()
 *   content     — searchContent()
 */

const BASE_URL = import.meta.env.PROD ? '' : 'http://localhost:8000'

// ---------------------------------------------------------------------------
// Core fetch wrapper
// ---------------------------------------------------------------------------

async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('ap_token')
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (!res.ok) {
    let detail = `HTTP ${res.status}`
    try {
      const err = await res.json()
      detail = err.detail || detail
    } catch (_) { /* ignore */ }
    throw new Error(detail)
  }

  return res.json()
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

/**
 * Sign up a new user.
 * @returns {{ token, learner_id, full_name }}
 */
export async function signup(fullName, email, password) {
  const data = await apiFetch('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ full_name: fullName, email, password }),
  })
  _storeSession(data)
  return data
}

/**
 * Log in with email + password.
 * @returns {{ token, learner_id, full_name }}
 */
export async function login(email, password) {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  _storeSession(data)
  return data
}

/**
 * Return the current user's profile from the stored JWT.
 * @returns {{ learner_id, full_name, email }}
 */
export async function me() {
  return apiFetch('/api/auth/me')
}

/** Clear session from localStorage. */
export function logout() {
  localStorage.removeItem('ap_token')
  localStorage.removeItem('ap_learner_id')
  localStorage.removeItem('ap_full_name')
}

function _storeSession({ token, learner_id, full_name }) {
  localStorage.setItem('ap_token', token)
  localStorage.setItem('ap_learner_id', learner_id)
  localStorage.setItem('ap_full_name', full_name)
}

// ---------------------------------------------------------------------------
// Learner state
// ---------------------------------------------------------------------------

/**
 * Fetch full learner state (mastery, topic states, recommendation).
 *
 * Returns a UI-ready object:
 *   mastery        — { topicId: 0-100 }
 *   state          — { topicId: 'mastered'|'unlocked'|'locked' }
 *   recommendation — { topic_id, confidence, alternatives, mode }
 */
export async function fetchLearnerState(learnerId) {
  const data = await apiFetch(`/api/learner/${encodeURIComponent(learnerId)}/state`)
  const mastery = {}
  for (const [k, v] of Object.entries(data.mastery)) {
    mastery[k] = Math.round(v * 100)
  }
  return { mastery, state: data.state, recommendation: data.recommendation }
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

/**
 * Fetch quiz questions for a topic.
 * @returns {Array<{ id, topic_id, question, options: string[], answer_index }>}
 */
export async function fetchQuizQuestions(topicId) {
  return apiFetch(`/api/quiz/questions/${encodeURIComponent(topicId)}`)
}

/**
 * Submit quiz result.
 * @returns {{ topic_id, prior_mastery, new_mastery, mastery_delta, state, recommendation }}
 */
export async function submitQuiz(learnerId, topicId, correctCount, totalCount) {
  return apiFetch('/api/quiz/submit', {
    method: 'POST',
    body: JSON.stringify({
      learner_id: learnerId,
      topic_id: topicId,
      correct_count: correctCount,
      total_count: totalCount,
    }),
  })
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/** Semantic search over topic content. */
export async function searchContent(query, topK = 5) {
  return apiFetch(`/api/content/search?q=${encodeURIComponent(query)}&top_k=${topK}`)
}

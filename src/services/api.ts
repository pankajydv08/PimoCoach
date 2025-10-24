import { supabase } from '../lib/supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

async function getAuthHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  
  return {
    'Content-Type': 'application/json',
    ...(session?.access_token && { 'Authorization': `Bearer ${session.access_token}` })
  };
}

export async function startSession(sessionType = 'general', difficulty = 'medium') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/session/start`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ session_type: sessionType, difficulty_level: difficulty })
  });

  if (!response.ok) {
    throw new Error('Failed to start session');
  }

  return response.json();
}

export async function getNextQuestion(sessionId: string, category = 'behavioral', difficulty = 'medium') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/question/next`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ sessionId, category, difficulty })
  });

  if (!response.ok) {
    throw new Error('Failed to get next question');
  }

  return response.json();
}

export async function getModelAnswer(questionText: string, category = 'behavioral', difficulty = 'medium') {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/question/model-answer`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ questionText, category, difficulty })
  });

  if (!response.ok) {
    throw new Error('Failed to get model answer');
  }

  return response.json();
}

export async function getCustomQA(jobDescription: string, sessionId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/question/custom-qa`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ jobDescription, sessionId })
  });

  if (!response.ok) {
    throw new Error('Failed to generate custom Q&A');
  }

  return response.json();
}

export async function synthesizeSpeech(text: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/tts/synthesize`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ text })
  });

  if (!response.ok) {
    throw new Error('Failed to synthesize speech');
  }

  return response.json();
}

export async function transcribeAudio(audioBlob: Blob) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/stt/transcribe`, {
    method: 'POST',
    headers,
    body: formData
  });

  if (!response.ok) {
    throw new Error('Failed to transcribe audio');
  }

  return response.json();
}

export async function evaluateResponse(
  sessionId: string,
  questionId: string,
  questionNumber: number,
  questionText: string,
  transcript: string
) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/evaluate`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      sessionId,
      questionId,
      questionNumber,
      questionText,
      transcript
    })
  });

  if (!response.ok) {
    throw new Error('Failed to evaluate response');
  }

  return response.json();
}

export async function getSession(sessionId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/session/${sessionId}`, {
    headers
  });

  if (!response.ok) {
    throw new Error('Failed to get session');
  }

  return response.json();
}

export async function getSessionResponses(sessionId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers: HeadersInit = {};
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/responses`, {
    headers
  });

  if (!response.ok) {
    throw new Error('Failed to get session responses');
  }

  return response.json();
}

export async function completeSession(sessionId: string) {
  const headers = await getAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/session/${sessionId}/complete`, {
    method: 'POST',
    headers
  });

  if (!response.ok) {
    throw new Error('Failed to complete session');
  }

  return response.json();
}

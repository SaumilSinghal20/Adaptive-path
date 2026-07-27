"""
Semantic search over topic content.

NOTE: the target architecture calls for the all-MiniLM-L6-v2 sentence-transformer
(as used in CommunityLearn). That model has to be downloaded from huggingface.co,
which isn't reachable from this sandbox's network, so this ships a TF-IDF +
cosine-similarity implementation instead — it's a real, working semantic search,
just a weaker one than a transformer embedding.

To upgrade later, only this file changes:
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer("all-MiniLM-L6-v2")
    vectors = model.encode(texts)
Everything calling `search()` stays the same.
"""
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity


class ContentIndex:
    def __init__(self):
        self._vectorizer = None
        self._matrix = None
        self._ids = []
        self._texts = []

    def build(self, topic_ids: list[str], texts: list[str]):
        self._ids = topic_ids
        self._texts = texts
        self._vectorizer = TfidfVectorizer(stop_words="english")
        self._matrix = self._vectorizer.fit_transform(texts)

    def search(self, query: str, top_k: int = 5):
        if self._vectorizer is None:
            return []
        query_vec = self._vectorizer.transform([query])
        scores = cosine_similarity(query_vec, self._matrix)[0]
        ranked = sorted(zip(self._ids, scores), key=lambda x: x[1], reverse=True)
        return [{"topic_id": tid, "score": float(score)} for tid, score in ranked[:top_k]]


content_index = ContentIndex()

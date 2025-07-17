from __future__ import annotations

import sqlite3
import numpy as np
import pandas as pd
from openai import OpenAI
from sklearn.metrics.pairwise import cosine_similarity


class RAMatcher:
    """
    Pre-embeds all faculty once at start-up.
    Call .match(cv_text, top_n) to get a ranked list.
    """

    def __init__(self, db_path: str, *, api_key: str, model: str = "text-embedding-3-large"):
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.ai = OpenAI(api_key=api_key)
        self.model = model
        self._load_faculty()

    # ------------------------------------------------------------------ #
    def _load_faculty(self):
        df = pd.read_sql("""
            SELECT Name,
                   Email,
                   Faculty,
                   "Summary of Research",
                   "Fields of Research",
                   "Link to Page"
            FROM faculty
        """, self.conn)

        self.meta = df.to_dict(orient="records")
        joined = (
            df["Summary of Research"] + ". Fields: " + df["Fields of Research"]
        ).tolist()

        resp = self.ai.embeddings.create(input=joined, model=self.model)
        self.embeds = [np.array(e.embedding) for e in resp.data]

    def _embed(self, text: str) -> np.ndarray:
        resp = self.ai.embeddings.create(input=[text], model=self.model)
        return np.array(resp.data[0].embedding)

    # ------------------------------------------------------------------ #
    def match(self, cv_text: str, *, top_n: int = 5):
        v = self._embed(cv_text)
        sims = [cosine_similarity([v], [e])[0][0] for e in self.embeds]
        idxs = sorted(range(len(sims)), key=lambda i: sims[i], reverse=True)[: top_n]
        return [self.meta[i] | {"score": sims[i]} for i in idxs]
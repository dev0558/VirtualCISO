"""Tenant-scoped retrieval over approved policies and latest check results.

Isolation is enforced twice: PostgreSQL RLS on rag_chunks (app.org_id) and an explicit
organization_id filter in every query."""
from __future__ import annotations

import math
import re
from dataclasses import dataclass

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from ..models import Organization, Policy, RagChunk
from .embeddings import embed, tokens


@dataclass
class Retrieved:
    id: str
    source_type: str
    source_ref: str
    source_name: str
    content: str
    similarity: float

    def citation(self) -> dict:
        return {"type": self.source_type, "reference": self.source_ref, "name": self.source_name}


def _chunks_markdown(md: str, max_chars: int = 900) -> list[tuple[str, str]]:
    """Split by headings; returns (section_title, text)."""
    parts: list[tuple[str, str]] = []
    title, buf = "Introduction", []
    for line in md.splitlines():
        m = re.match(r"^#{1,4}\s+(.*)", line)
        if m:
            if "".join(buf).strip():
                parts.append((title, "\n".join(buf).strip()))
            title, buf = m.group(1).strip(), []
        else:
            buf.append(line)
    if "".join(buf).strip():
        parts.append((title, "\n".join(buf).strip()))
    out = []
    for t, text in parts:
        for i in range(0, len(text), max_chars):
            out.append((t, text[i:i + max_chars]))
    return out


def index_policy(db: Session, org: Organization, policy: Policy, version) -> None:
    db.execute(delete(RagChunk).where(RagChunk.organization_id == org.id, RagChunk.source_type == "policy",
                                      RagChunk.source_ref.like(f"{policy.code} %")))
    for section, text in _chunks_markdown(version.content):
        content = f"{policy.title} — {section}\n{text}"
        db.add(RagChunk(organization_id=org.id, source_type="policy", source_ref=f"{policy.code} v{version.version}",
                        source_name=f"{policy.title} § {section}", content=content, embedding=embed(content)))


def index_check_results(db: Session, org: Organization) -> None:
    from ..services.state import latest_evidence

    db.execute(delete(RagChunk).where(RagChunk.organization_id == org.id, RagChunk.source_type == "check"))
    for code, ev in latest_evidence(db, org.id).items():
        if ev.status == "skipped":
            continue
        facts = (ev.observed or {}).get("facts", {})
        fact_txt = "; ".join(f"{k.split('.', 1)[-1].replace('_', ' ')} = {v}" for k, v in facts.items()
                             if not isinstance(v, list))
        content = (f"Automated check {code}: {ev.check.name}. Result: {ev.status.upper()} as of "
                   f"{ev.collected_at:%Y-%m-%d}. {ev.check.description} Observed: {fact_txt}.")
        db.add(RagChunk(organization_id=org.id, source_type="check", source_ref=code,
                        source_name=f"{ev.check.name} ({ev.status})", content=content, embedding=embed(content)))


def _bm25(query_toks: list[str], docs: list[list[str]], k1: float = 1.4, b: float = 0.75) -> list[float]:
    n = len(docs)
    avg = sum(len(d) for d in docs) / n if n else 1.0
    df: dict[str, int] = {}
    for d in docs:
        for t in set(d):
            df[t] = df.get(t, 0) + 1
    scores = []
    for d in docs:
        tf: dict[str, int] = {}
        for t in d:
            tf[t] = tf.get(t, 0) + 1
        s = 0.0
        for t in set(query_toks):
            if t not in tf:
                continue
            idf = math.log(1 + (n - df[t] + 0.5) / (df[t] + 0.5))
            s += idf * tf[t] * (k1 + 1) / (tf[t] + k1 * (1 - b + b * len(d) / avg))
        scores.append(s)
    return scores


def retrieve(db: Session, org_id, query: str, k: int = 6) -> list[Retrieved]:
    """Hybrid ranking over the tenant's chunks: BM25 (lexical) + cosine similarity (pgvector).
    `similarity` is a 0..1 relevance score used for confidence and abstention."""
    q = embed(query)
    dist = RagChunk.embedding.cosine_distance(q)
    rows = db.execute(select(RagChunk, dist.label("d")).where(RagChunk.organization_id == org_id).limit(5000)).all()
    if not rows:
        return []
    qt = tokens(query)
    bm = _bm25(qt, [tokens(c.content) for c, _ in rows])
    scored = []
    for (c, d), s in zip(rows, bm, strict=True):
        lexical = s / (s + 6.0)  # saturating 0..1
        rel = 0.65 * lexical + 0.35 * max(0.0, 1 - d)
        scored.append((rel, c))
    scored.sort(key=lambda x: -x[0])
    return [Retrieved(str(c.id), c.source_type, c.source_ref, c.source_name, c.content, round(rel, 4))
            for rel, c in scored[:k]]

"""Embeddings for retrieval.

Default: a deterministic local feature-hashing embedder (no data leaves the deployment, no extra
vendor). It captures lexical overlap (unigrams + bigrams with light stemming), which works well
for compliance text where questions and policies share vocabulary. Set VOYAGE_API_KEY to use a
hosted semantic embedding model instead (same 384-dim column via truncation is NOT done — switch
EMBEDDING_DIM and re-index if you change provider)."""
from __future__ import annotations

import hashlib
import math
import re

from ..models import EMBEDDING_DIM

_TOKEN = re.compile(r"[a-z0-9]+")
STOP = set("a an the and or of to in for on with by is are be been do does your you we our us it its this that "
           "as at from how what which who whom when where any all have has had not no yes can will shall must".split())
SYNONYMS = {"mfa": "multifactor", "2fa": "multifactor", "2sv": "multifactor", "twofactor": "multifactor",
            "authentication": "authent", "authenticate": "authent", "admins": "admin", "administrator": "admin",
            "administrators": "admin", "administrative": "admin", "privileged": "privilege", "logs": "log",
            "logging": "log", "backups": "backup", "repositories": "repo", "repository": "repo", "repos": "repo",
            "encrypted": "encrypt", "encryption": "encrypt", "vulnerabilities": "vulnerab", "vulnerability": "vulnerab",
            "incidents": "incident", "policies": "policy", "reviews": "review", "reviewed": "review",
            "accounts": "account", "users": "user", "secrets": "secret", "deprovisioned": "deprovision",
            "leavers": "leaver", "dependencies": "dependency", "tested": "test", "testing": "test"}


SYNONYMS.update({"login": "signin", "logins": "signin", "sign": "signin", "offboarding": "deprovision",
                 "offboard": "deprovision", "leaver": "deprovision", "terminated": "deprovision",
                 "2-step": "multifactor", "otp": "multifactor", "restore": "backup", "restoring": "backup",
                 "recovery": "backup", "external": "guest", "guests": "guest", "contractor": "guest",
                 "sast": "codescan", "codeql": "codescan", "dependabot": "dependency", "superadmin": "admin"})


def stem(t: str) -> str:
    for suf in ("ations", "ation", "ings", "ing", "ments", "ment", "ness", "ies", "ied", "ed", "es", "s"):
        if len(t) > len(suf) + 3 and t.endswith(suf):
            return t[: -len(suf)] + ("y" if suf in ("ies", "ied") else "")
    return t


def tokens(text: str) -> list[str]:
    low = text.lower()
    for a, b in (("multi-factor", "multifactor"), ("two-factor", "twofactor"), ("2-step", "multifactor"),
                 ("sign-in", "signin"), ("sign in", "signin"), ("off-boarding", "offboarding")):
        low = low.replace(a, b)
    out = []
    for t in _TOKEN.findall(low):
        if t in STOP or len(t) < 2:
            continue
        t = SYNONYMS.get(t, t)
        out.append(SYNONYMS.get(stem(t), stem(t)))
    return out


_tokens = tokens


def _bucket(feature: str) -> tuple[int, float]:
    h = hashlib.blake2b(feature.encode(), digest_size=8).digest()
    idx = int.from_bytes(h[:4], "little") % EMBEDDING_DIM
    sign = 1.0 if h[4] & 1 else -1.0
    return idx, sign


def embed(text: str) -> list[float]:
    vec = [0.0] * EMBEDDING_DIM
    toks = _tokens(text)
    feats = toks + [f"{a}_{b}" for a, b in zip(toks, toks[1:], strict=False)]
    counts: dict[str, int] = {}
    for f in feats:
        counts[f] = counts.get(f, 0) + 1
    for f, c in counts.items():
        idx, sign = _bucket(f)
        vec[idx] += sign * (1.0 + math.log(c)) * (1.5 if "_" in f else 1.0)
    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
    return [v / norm for v in vec]

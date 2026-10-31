"""Evidence object storage (S3-compatible, versioned bucket). Failures never block a run:
the evidence row still carries the sanitized payload and its SHA-256 hash."""
import json
import logging
from functools import lru_cache

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from ..config import get_settings

log = logging.getLogger(__name__)


@lru_cache
def _client():
    s = get_settings()
    if not s.s3_access_key:
        return None
    c = boto3.client("s3", endpoint_url=s.s3_endpoint_url, aws_access_key_id=s.s3_access_key,
                     aws_secret_access_key=s.s3_secret_key, config=Config(connect_timeout=3, retries={"max_attempts": 1}))
    try:
        c.head_bucket(Bucket=s.s3_bucket)
    except ClientError:
        c.create_bucket(Bucket=s.s3_bucket)
        try:
            c.put_bucket_versioning(Bucket=s.s3_bucket, VersioningConfiguration={"Status": "Enabled"})
        except ClientError:
            log.warning("object store does not support bucket versioning; evidence still hash-verified")
    return c


def put_evidence(key: str, body: dict, sha256: str) -> str | None:
    try:
        c = _client()
        if c is None:
            return None
        c.put_object(Bucket=get_settings().s3_bucket, Key=key, Body=json.dumps(body, sort_keys=True).encode(),
                     ContentType="application/json", Metadata={"sha256": sha256})
        return key
    except (BotoCoreError, ClientError) as e:
        log.warning("evidence upload failed: %s", type(e).__name__)
        _client.cache_clear()
        return None

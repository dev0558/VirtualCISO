"""Generic rule evaluation for checks (data-driven, see seed/checks.yaml)."""
from typing import Any

OPS = {
    "eq": lambda a, b: a == b, "ne": lambda a, b: a != b,
    "lt": lambda a, b: a < b, "lte": lambda a, b: a <= b,
    "gt": lambda a, b: a > b, "gte": lambda a, b: a >= b,
    "in": lambda a, b: a in b,
    "is_true": lambda a, _b: a is True, "is_false": lambda a, _b: a is False,
}


class MissingFact(Exception):
    pass


def facts_used(rule: dict[str, Any]) -> list[str]:
    if "all" in rule:
        return [f for r in rule["all"] for f in facts_used(r)]
    return [rule["fact"]]


def evaluate(rule: dict[str, Any], facts: dict[str, Any]) -> bool:
    if "all" in rule:
        return all(evaluate(r, facts) for r in rule["all"])
    name = rule["fact"]
    if name not in facts or facts[name] is None:
        raise MissingFact(name)
    op = OPS.get(rule["op"])
    if op is None:
        raise ValueError(f"Unknown operator {rule['op']}")
    try:
        return bool(op(facts[name], rule.get("value")))
    except TypeError:
        return False


def status_for(rule: dict[str, Any], warn: dict[str, Any] | None, facts: dict[str, Any]) -> str:
    try:
        if evaluate(rule, facts):
            return "passed"
    except MissingFact:
        return "skipped"
    if warn:
        try:
            if evaluate(warn, facts):
                return "warning"
        except MissingFact:
            pass
    return "failed"

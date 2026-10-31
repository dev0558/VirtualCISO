from vciso_api.services.rules import status_for


def test_pass_fail_warning_skipped():
    rule = {"fact": "x.pct", "op": "gte", "value": 100}
    warn = {"fact": "x.pct", "op": "gte", "value": 95}
    assert status_for(rule, warn, {"x.pct": 100}) == "passed"
    assert status_for(rule, warn, {"x.pct": 97}) == "warning"
    assert status_for(rule, warn, {"x.pct": 50}) == "failed"
    assert status_for(rule, warn, {}) == "skipped"


def test_all_and_in_operators():
    rule = {"all": [{"fact": "a", "op": "lte", "value": 3}, {"fact": "b", "op": "in", "value": ["read", "none"]}]}
    assert status_for(rule, None, {"a": 2, "b": "read"}) == "passed"
    assert status_for(rule, None, {"a": 2, "b": "write"}) == "failed"
    assert status_for(rule, None, {"a": 2}) == "skipped"


def test_type_mismatch_fails_closed():
    assert status_for({"fact": "a", "op": "gte", "value": 1}, None, {"a": "n/a"}) == "failed"


def test_every_seed_check_maps_to_both_frameworks_or_iso():
    import yaml

    from vciso_api.config import get_settings

    checks = yaml.safe_load((get_settings().seed_dir / "checks.yaml").read_text())["checks"]
    assert 25 <= len(checks) <= 30
    for c in checks:
        assert any(x.startswith("A.") for x in c["controls"]), c["code"]
        assert any("." in x and not x.startswith("A.") for x in c["controls"]), c["code"]

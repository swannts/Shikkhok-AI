from app.services.output_safety import OutputSafetyService


def test_validate_and_sanitize_redacts_full_credentials() -> None:
    service = OutputSafetyService()

    google_key = "AIzaSy" + ("A" * 33)
    openai_key = "sk-" + ("b" * 32)
    ghp_token = "ghp_" + ("c" * 36)
    gho_token = "gho_" + ("d" * 36)
    ghs_token = "ghs_" + ("e" * 36)

    text = (
        f"Google: {google_key}; "
        f"OpenAI: {openai_key}; "
        f"GitHub1: {ghp_token}; "
        f"GitHub2: {gho_token}; "
        f"GitHub3: {ghs_token}."
    )

    result = service.validate_and_sanitize(text)

    assert result.sanitized_text.count("[REDACTED_CREDENTIAL]") == 5
    assert google_key not in result.sanitized_text
    assert openai_key not in result.sanitized_text
    assert ghp_token not in result.sanitized_text
    assert gho_token not in result.sanitized_text
    assert ghs_token not in result.sanitized_text
    assert result.redacted_items == [
        google_key,
        openai_key,
        ghp_token,
        gho_token,
        ghs_token,
    ]

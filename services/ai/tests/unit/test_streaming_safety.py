from app.services.streaming_safety import StreamingOutputSafetyFilter


def test_safe_text_streams_normally():
    safety_filter = StreamingOutputSafetyFilter(lookahead_window=10)
    c1 = safety_filter.feed("গণিতের মৌলিক সূত্রাবলি ")
    c2 = safety_filter.feed("নিয়মিত অনুশীলন করলে সহজে মনে রাখা সম্ভব।")
    final = safety_filter.finalize()

    reconstructed = c1 + c2 + final
    assert reconstructed == "গণিতের মৌলিক সূত্রাবলি নিয়মিত অনুশীলন করলে সহজে মনে রাখা সম্ভব।"
    assert safety_filter.redacted_count == 0


def test_redacts_api_key_split_across_chunks():
    safety_filter = StreamingOutputSafetyFilter(lookahead_window=45)
    # The Google API key "AIzaSy" + 33 chars is split across chunk 1 and chunk 2
    prefix = "Your key is "
    part1 = "AIzaSyA1B2C3D4E5"
    part2 = "F6G7H8I9J0K1L2M3N4O5P6Q7R"
    suffix = " please keep it safe."

    out1 = safety_filter.feed(prefix + part1)
    out2 = safety_filter.feed(part2 + suffix)
    final = safety_filter.finalize()

    full_output = out1 + out2 + final
    assert "AIzaSy" not in full_output
    assert "[REDACTED_CREDENTIAL]" in full_output


def test_redacts_unsafe_phrase_split_across_chunks():
    safety_filter = StreamingOutputSafetyFilter(lookahead_window=20)
    out1 = safety_filter.feed("You should never how to make ")
    out2 = safety_filter.feed("bomb at school.")
    final = safety_filter.finalize()

    full_output = out1 + out2 + final
    assert "how to make bomb" not in full_output
    assert "[REDACTED_CONTENT]" in full_output


def test_bangla_unicode_boundaries():
    safety_filter = StreamingOutputSafetyFilter(lookahead_window=15)
    out1 = safety_filter.feed("বীজগণিতীয় সূত্রাবলি: (a + b)² = ")
    out2 = safety_filter.feed("a² + 2ab + b²।")
    final = safety_filter.finalize()

    full_output = out1 + out2 + final
    assert full_output == "বীজগণিতীয় সূত্রাবলি: (a + b)² = a² + 2ab + b²।"

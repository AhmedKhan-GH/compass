// Unit tests for sig::SignalDocument — annotations, undo/redo, JSON round-trip.
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "signal/signal_document.h"

using sig::Annotation;
using sig::SignalDocument;

TEST_CASE("annotations add, and undo/redo restore state") {
    SignalDocument d;
    CHECK_FALSE(d.can_undo());
    d.SetEdfPath("rec.edf");
    d.AddAnnotation({1.0, 2.0, "beat"});
    d.AddAnnotation({5.0, 5.0, "marker"});  // point marker (start == end)
    REQUIRE(d.annotations().size() == 2);
    CHECK(d.edf_path() == "rec.edf");
    CHECK(d.dirty());

    d.Undo();  // removes the marker
    CHECK(d.annotations().size() == 1);
    d.Undo();  // removes the beat
    CHECK(d.annotations().empty());
    d.Redo();
    CHECK(d.annotations().size() == 1);
    CHECK(d.annotations()[0].label == "beat");
}

TEST_CASE("remove and edit are undoable and bounds-checked") {
    SignalDocument d;
    d.AddAnnotation({1, 2, "a"});
    d.AddAnnotation({3, 4, "b"});
    d.RemoveAnnotation(5);  // out of range → no-op
    CHECK(d.annotations().size() == 2);
    d.EditAnnotation(0, {1, 2, "renamed"});
    CHECK(d.annotations()[0].label == "renamed");
    d.Undo();
    CHECK(d.annotations()[0].label == "a");
    d.RemoveAnnotation(0);
    CHECK(d.annotations().size() == 1);
    CHECK(d.annotations()[0].label == "b");
}

TEST_CASE("JSON sidecar round-trips") {
    SignalDocument d;
    d.SetEdfPath("study/rec.edf");
    d.AddAnnotation({1.5, 3.25, "arrhythmia, run"});  // comma + text
    d.AddAnnotation({10.0, 10.0, "R-peak"});
    const std::string js = d.ToJson();

    auto loaded = SignalDocument::FromJson(js);
    REQUIRE(loaded.has_value());
    CHECK(loaded->edf_path() == "study/rec.edf");
    REQUIRE(loaded->annotations().size() == 2);
    CHECK(loaded->annotations()[0].start == doctest::Approx(1.5));
    CHECK(loaded->annotations()[0].end == doctest::Approx(3.25));
    CHECK(loaded->annotations()[0].label == "arrhythmia, run");
    CHECK(loaded->annotations()[1].label == "R-peak");
    CHECK_FALSE(loaded->dirty());       // freshly loaded == clean
    CHECK_FALSE(loaded->can_undo());    // empty history
}

TEST_CASE("malformed sidecar is rejected, not thrown") {
    CHECK_FALSE(SignalDocument::FromJson("").has_value());
    CHECK_FALSE(SignalDocument::FromJson("{ not json").has_value());
    CHECK_FALSE(SignalDocument::FromJson("[1,2,3]").has_value());          // not an object
    CHECK_FALSE(SignalDocument::FromJson("{\"annotations\":42}").has_value());  // wrong type
    CHECK_FALSE(SignalDocument::FromJson("{\"version\":2}").has_value());  // future version
}

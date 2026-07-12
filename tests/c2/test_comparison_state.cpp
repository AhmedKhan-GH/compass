// C2 — .compass document round-trip, version refusal, and edit/undo behavior.
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include "doctest.h"

#include "compass/comparison_document.h"
#include "compass/comparison_state.h"

using namespace compass;

namespace {
ComparisonState Sample() {
    ComparisonState s;
    s.store_root = "/tmp/store-a";
    s.runs = {{1, "baseline", "#4c6ef5", {"loss", "accuracy"}},
              {2, "tweak", "#e8590c", {}}};
    s.annotations = {{1, 1, 42, "loss", "spike here"},
                     {2, 2, -1, "", "run-level note"}};
    s.layout = "layout2|blob";
    s.next_annotation_id = 3;
    return s;
}
}  // namespace

TEST_CASE("state round-trips through the .compass JSON codec") {
    const ComparisonState in = Sample();
    ComparisonState out;
    REQUIRE(DeserializeState(SerializeState(in), &out));
    CHECK(out == in);
}

TEST_CASE("a newer version is refused; older/missing is read best-effort") {
    ComparisonState in = Sample();
    in.version = kComparisonVersion + 1;
    const std::string blob = SerializeState(in);

    ComparisonState out;
    CHECK_FALSE(DeserializeState(blob, &out));  // honest refusal

    // Malformed JSON is also refused.
    CHECK_FALSE(DeserializeState("{not json", &out));

    // A document with no version field parses (version defaults to current).
    ComparisonState v0;
    REQUIRE(DeserializeState("{\"store_root\":\"/x\"}", &v0));
    CHECK(v0.store_root == "/x");
}

TEST_CASE("ComparisonDocument edits round-trip and drive undo/redo") {
    ComparisonDocument doc;
    CHECK_FALSE(doc.dirty());

    doc.SetStoreRoot("/tmp/s");
    doc.SetRuns({{7, "r7", "#123456", {}}});
    const int64_t a = doc.AddAnnotation(7, 10, "loss", "note");
    CHECK(doc.dirty());
    CHECK(doc.runs().size() == 1);
    CHECK(doc.annotations().size() == 1);

    // Edit + delete.
    CHECK(doc.EditAnnotation(a, "edited"));
    CHECK(doc.annotations().front().text == "edited");
    CHECK_FALSE(doc.EditAnnotation(999, "x"));  // unknown id
    CHECK(doc.DeleteAnnotation(a));
    CHECK(doc.annotations().empty());

    // Undo the delete brings the note back.
    doc.Undo();
    CHECK(doc.annotations().size() == 1);

    // Full serialize round-trip through the document contract.
    ComparisonDocument reloaded;
    REQUIRE(reloaded.Deserialize(doc.Serialize()));
    CHECK(reloaded.store_root() == "/tmp/s");
    CHECK(reloaded.runs().size() == 1);
    CHECK_FALSE(reloaded.dirty());   // ResetState marks clean
}

TEST_CASE("annotation ids are stable and monotonic across a reload") {
    ComparisonDocument doc;
    const int64_t a1 = doc.AddAnnotation(1, -1, "", "one");
    const int64_t a2 = doc.AddAnnotation(1, -1, "", "two");
    CHECK(a2 == a1 + 1);

    ComparisonDocument reloaded;
    REQUIRE(reloaded.Deserialize(doc.Serialize()));
    // A new note continues the sequence (next_annotation_id persisted).
    const int64_t a3 = reloaded.AddAnnotation(1, -1, "", "three");
    CHECK(a3 == a2 + 1);
}

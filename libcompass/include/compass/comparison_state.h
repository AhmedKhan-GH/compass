// Compass C2 — the ComparisonState value type + .compass (de)serialization.
//
// The run-comparison document (spec §4) holds REFERENCES + CONFIG, never tensor
// data: which metrics store root, which runs, per-run display options, free-text
// annotations bound to a run (and optionally a run+step+tag), and the saved
// window layout. This header is the pure, wx-free value model + its JSON codec;
// ComparisonDocument (comparison_document.h) wraps it in the framework's
// undo/redo/dirty machinery, and the tests round-trip it headless.
//
// Versioned: a `version` field is written and an HONEST refusal is returned for a
// file whose version is newer than this build understands (spec §4).

#ifndef COMPASS_COMPARISON_STATE_H
#define COMPASS_COMPARISON_STATE_H

#include <cstdint>
#include <string>
#include <vector>

namespace compass {

// The .compass format version this build writes and can read. A file whose
// stored version exceeds this is refused by DeserializeState (never guessed at).
inline constexpr int kComparisonVersion = 1;

// One selected run plus how the document chooses to display it.
struct RunDisplay {
    int64_t id = 0;                        // metrics runs.id
    std::string label;                     // display label ("" -> derived)
    std::string color;                     // "#rrggbb" series color ("" -> auto)
    std::vector<std::string> visible_tags; // empty -> all tags visible

    bool operator==(const RunDisplay&) const = default;
};

// A free-text note. Bound to a run (run >= 0), optionally to a step (step >= 0)
// and a scalar tag (non-empty) so a view can drop a marker at that point.
struct Annotation {
    int64_t id = 0;        // stable local id (unique within the document)
    int64_t run = -1;      // -1 -> document-level note (not bound to a run)
    int64_t step = -1;     // -1 -> whole-run note (no step marker)
    std::string tag;       // "" -> not tied to a specific scalar series
    std::string text;

    bool operator==(const Annotation&) const = default;
};

struct ComparisonState {
    int version = kComparisonVersion;
    std::string store_root;              // "" -> Compass's own session root
    std::vector<RunDisplay> runs;
    std::vector<Annotation> annotations;
    std::string layout;                  // AUI perspective ("" -> default)
    int64_t next_annotation_id = 1;      // monotonic source for Annotation.id

    bool operator==(const ComparisonState&) const = default;
};

// Serialize to a .compass JSON document (stable key order, human-diffable).
std::string SerializeState(const ComparisonState& state);

// Parse a .compass document. Returns false (leaving *out untouched) on malformed
// JSON OR on a version newer than kComparisonVersion — the honest refusal. On a
// missing/older version the file is read best-effort (fields default).
bool DeserializeState(const std::string& json, ComparisonState* out);

}  // namespace compass

#endif  // COMPASS_COMPARISON_STATE_H

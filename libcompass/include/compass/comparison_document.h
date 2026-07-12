// Compass C2 — ComparisonDocument.
//
// The concrete document the run-comparison workspace edits: the framework's
// UndoableDocument<ComparisonState> (undo/redo/dirty) with Serialize/Deserialize
// wired to the .compass JSON codec (comparison_state.h). Wx-free and headless-
// testable — the DocumentFrame Save/Open path drives exactly these two methods.

#ifndef COMPASS_COMPARISON_DOCUMENT_H
#define COMPASS_COMPARISON_DOCUMENT_H

#include <string>

#include "compass/comparison_state.h"
#include "compass/document.h"

namespace compass {

class ComparisonDocument : public UndoableDocument<ComparisonState> {
public:
    // Convenience read accessors over the current state.
    const std::string& store_root() const { return state().store_root; }
    const std::vector<RunDisplay>& runs() const { return state().runs; }
    const std::vector<Annotation>& annotations() const {
        return state().annotations;
    }
    const std::string& layout() const { return state().layout; }

    // --- Editing (each is one undo step) -------------------------------------
    void SetStoreRoot(std::string root);
    void SetRuns(std::vector<RunDisplay> runs);
    void SetLayout(std::string perspective);

    // Add a note; returns its assigned id. run/step/tag may be unset (-1 / "").
    int64_t AddAnnotation(int64_t run, int64_t step, std::string tag,
                          std::string text);
    // Replace an existing note's text; no-op (returns false) if id is unknown.
    bool EditAnnotation(int64_t id, std::string text);
    bool DeleteAnnotation(int64_t id);

    // --- Document contract ---------------------------------------------------
    std::string Serialize() const override { return SerializeState(state()); }
    bool Deserialize(const std::string& data) override {
        ComparisonState s;
        if (!DeserializeState(data, &s)) return false;
        ResetState(std::move(s));
        return true;
    }
};

}  // namespace compass

#endif  // COMPASS_COMPARISON_DOCUMENT_H

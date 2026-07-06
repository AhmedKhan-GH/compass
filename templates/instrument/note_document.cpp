// Instrument Template — NoteDocument implementation.
// REPLACE THIS with your instrument's document logic.

#include "note_document.h"

#include <utility>

namespace note {

void NoteDocument::SetText(std::string text) {
    // Build the next snapshot from scratch and commit it as one undo step.
    NoteState next;
    next.text = std::move(text);
    Commit(std::move(next));
}

std::string NoteDocument::Serialize() const {
    return state().text;
}

bool NoteDocument::Deserialize(const std::string& data) {
    // Install the loaded contents with a clean, empty undo history.
    NoteState loaded;
    loaded.text = data;
    ResetState(std::move(loaded));
    return true;
}

}  // namespace note

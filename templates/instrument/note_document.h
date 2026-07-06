// Instrument Template — NoteDocument
//
// The smallest possible Compass document: a single blob of text. It exists to
// demonstrate the compass::UndoableDocument<State> contract end to end — memento
// undo/redo, dirty tracking, and Serialize/Deserialize for Save/Open — with the
// domain reduced to one std::string.
//
// REPLACE THIS with your instrument's real document. Model your state as a plain
// struct (`NoteState` below), give each domain mutation a method that builds a
// fresh state and calls Commit(), and implement Serialize()/Deserialize() for
// your file format. Keep this file pure C++ and wx-free: the document is
// headless so it can be unit-tested without a GUI.

#ifndef COMPASS_TEMPLATE_NOTE_DOCUMENT_H
#define COMPASS_TEMPLATE_NOTE_DOCUMENT_H

#include <string>

#include "compass/document.h"

namespace note {

// The document snapshot. Undo/redo works by keeping copies of this, so keep it
// cheap to copy (or accept the cost). REPLACE with your instrument's state.
struct NoteState {
    std::string text;
};

class NoteDocument : public compass::UndoableDocument<NoteState> {
public:
    // The only domain mutation. Builds the next state and commits it as one undo
    // step (Commit pushes the current state onto the undo stack, adopts `next`,
    // clears redo, and marks the document dirty). REPLACE with your mutations.
    void SetText(std::string text);

    // Read accessor over the current committed state.
    const std::string& text() const { return state().text; }

    // --- persistence (drives the shell's Save/Open) ---
    // For this trivial format the file contents ARE the text, verbatim.
    std::string Serialize() const override;
    // Deserialize never rejects arbitrary bytes as invalid here; a real
    // instrument should return false on malformed input, leaving the document
    // unchanged. ResetState installs the loaded state with empty undo history,
    // marked clean.
    bool Deserialize(const std::string& data) override;
};

}  // namespace note

#endif  // COMPASS_TEMPLATE_NOTE_DOCUMENT_H

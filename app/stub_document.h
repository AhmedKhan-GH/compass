// Compass C1 — StubDocument.
//
// DocumentFrame (rescued from libcompass) talks to a compass::Document. C1 has
// no serialized document of its own yet — the .compass manifest is C2's job
// (spec §4: "Document model can be a stub v0, one implicit document"). This is
// that stub: one implicit, always-clean, never-undoable document so the rescued
// shell (menus, AUI docking, layout persistence) runs unchanged. Save/Open are
// inert no-ops here; the load-bearing planes are the libcaliper viewport and the
// live metrics table, not a document file.

#ifndef COMPASS_C1_STUB_DOCUMENT_H
#define COMPASS_C1_STUB_DOCUMENT_H

#include "compass/document.h"

namespace compass {

class StubDocument : public Document {
public:
    bool CanUndo() const override { return false; }
    bool CanRedo() const override { return false; }
    void Undo() override {}
    void Redo() override {}
    std::string Serialize() const override { return "{}"; }
    bool Deserialize(const std::string&) override { return true; }
};

}  // namespace compass

#endif  // COMPASS_C1_STUB_DOCUMENT_H

// Compass C1 — entry point.
//
// A compass::App (rescued from libcompass) subclass that names the app and builds
// the libcaliper-hosting WorkspaceFrame. All the chrome (menu bar, AUI docking,
// layout persistence) is the rescued shell; the canvas is libcaliper's.

#include "compass/app.h"

#include "workspace_frame.h"

class CompassApp : public compass::App {
protected:
    wxFrame* CreateMainFrame() override { return new compass::WorkspaceFrame(); }
    wxString AppName() const override { return "Compass"; }
};

wxIMPLEMENT_APP(CompassApp);

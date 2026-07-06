// Compass — Plot Workbench (Instrument #1) entry point.
// The whole app is now a compass::App subclass naming the instrument and its frame.

#include "compass/app.h"

#include "main_frame.h"

class CompassApp : public compass::App {
protected:
    wxFrame* CreateMainFrame() override { return new MainFrame(); }
    wxString AppName() const override { return "Compass"; }
};

wxIMPLEMENT_APP(CompassApp);

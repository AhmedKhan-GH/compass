// Compass — Signal Workbench (Instrument #2, I3) entry point.

#include "compass/app.h"

#include "signal_frame.h"

class SignalApp : public compass::App {
protected:
    wxFrame* CreateMainFrame() override { return new SignalFrame(); }
    wxString AppName() const override { return "Signal Workbench"; }
};

wxIMPLEMENT_APP(SignalApp);

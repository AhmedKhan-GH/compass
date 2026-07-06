// Instrument Template — application entry point.
//
// compass::App is the wxApp base: it owns startup/shutdown and creates the main
// window from CreateMainFrame(). All you supply is your frame and an app name.
// REPLACE the frame type and AppName() with your instrument's.

#include "compass/app.h"

#include "note_frame.h"

class TemplateApp : public compass::App {
protected:
    // Return type is wxFrame* per the task contract; NoteFrame derives from
    // compass::DocumentFrame which derives from wxFrame.
    wxFrame* CreateMainFrame() override { return new note::NoteFrame(); }

    // Used for config/window-geometry persistence and window titling.
    wxString AppName() const override { return "InstrumentTemplate"; }
};

wxIMPLEMENT_APP(TemplateApp);

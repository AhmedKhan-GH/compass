// Compass framework (libcompass) — App.
//
// A thin wxApp base (PLATFORM.md §5.3): sets app/vendor names, registers the
// image handlers instruments need for export, and creates the main frame via a
// factory the instrument supplies. Instruments write:
//
//   class MyApp : public compass::App {
//     wxFrame* CreateMainFrame() override { return new MyFrame(); }
//     wxString AppName() const override { return "MyInstrument"; }
//   };
//   wxIMPLEMENT_APP(MyApp);

#ifndef COMPASS_APP_H
#define COMPASS_APP_H

#include <wx/app.h>
#include <wx/frame.h>

namespace compass {

class App : public wxApp {
public:
    bool OnInit() override;

protected:
    // Construct the instrument's main frame (a compass::DocumentFrame subclass).
    virtual wxFrame* CreateMainFrame() = 0;
    virtual wxString AppName() const = 0;
    virtual wxString VendorName() const { return AppName(); }
};

}  // namespace compass

#endif  // COMPASS_APP_H

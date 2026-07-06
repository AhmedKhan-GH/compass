// Compass framework (libcompass) — App implementation.

#include "compass/app.h"

#include <wx/image.h>
#include <wx/persist/toplevel.h>

#ifdef __WXMSW__
#include <windows.h>  // DwmSetWindowAttribute lives in dwmapi
#include <dwmapi.h>   // Win11 Mica backdrop (design §2)
#endif

namespace compass {

bool App::OnInit() {
    if (!wxApp::OnInit()) return false;
#ifdef __WXMSW__
    MSWEnableDarkMode(wxApp::DarkMode_Auto);  // follow-system dark mode (design §1)
#endif
    SetAppName(AppName());
    SetVendorName(VendorName());
    wxImage::AddHandler(new wxPNGHandler);  // instruments export PNG snapshots

    wxFrame* frame = CreateMainFrame();
    wxPersistentRegisterAndRestore(frame, "MainFrame");  // window geometry
#ifdef __WXMSW__
    // Mica backdrop. Numeric constants used directly (ABI-frozen) so old SDKs
    // still compile; HRESULT ignored → silent no-op on Win10 (design §2).
    int backdrop = 2;  // DWMSBT_MAINWINDOW
    ::DwmSetWindowAttribute(frame->GetHWND(), 38 /* DWMWA_SYSTEMBACKDROP_TYPE */,
                            &backdrop, sizeof(backdrop));
#endif
    frame->Show(true);
    return true;
}

}  // namespace compass

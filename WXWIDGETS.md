# wxWidgets Configuration Reference

This document outlines the available features and configure options for wxWidgets 3.2.9 used in this project.

## Build Configuration

- **Version**: 3.2.9
- **Build Type**: osx_cocoa-unicode-static-3.2
- **Total Headers**: 420+

## Major Feature Categories

### Advanced UI Components
- **aui/** - Advanced docking UI framework
- **stc/** - Scintilla-based code editor control
- **propgrid/** - Property grid controls
- **ribbon/** - Office-style ribbon interfaces
- **richtext/** - Rich text editing capabilities

### Data & Resources
- **xrc/** - XML-based resource system
- **xml/** - XML parsing utilities
- **html/** - HTML rendering engine
- **protocol/** - HTTP/FTP protocol support

### Platform-Specific
- **osx/** - macOS (Cocoa) specific implementations
- **unix/** - Unix/Linux specific implementations
- **generic/** - Generic cross-platform implementations

## Configure Options

### Installation & Build Type
```bash
--prefix=PREFIX              # Installation prefix (default: /usr/local)
--enable-monolithic          # Build as single library
--enable-shared              # Build shared libraries (default)
--disable-shared             # Build static libraries
--enable-debug               # Build with debugging support
--enable-debug_info          # Generate debug information
```

### GUI & Toolkit Selection
```bash
--disable-gui               # Build non-GUI library only
--with-gtk[=VERSION]        # Use GTK+ (VERSION: 3, 2, 1, or "any")
--with-osx_cocoa            # Use macOS Cocoa
--with-msw                  # Use MS-Windows
--with-qt                   # Use Qt
--with-x11                  # Use X11
```

### Language & Standards
```bash
--enable-cxx11              # Use C++11 compiler
--with-cxx=11|14|17|20      # Specify C++ dialect
--disable-unicode           # Disable Unicode support (not recommended)
--enable-utf8               # Use UTF-8 representation (Unix only)
--enable-stl                # Use standard C++ classes for everything
--enable-std_string         # Use std::string for wxString
--enable-std_containers     # Use standard C++ containers
```

### Core Libraries & Dependencies
```bash
--with-opengl               # Include OpenGL support
--with-libpng               # Use libpng for PNG images
--with-libjpeg              # Use libjpeg for JPEG images
--with-libtiff              # Use libtiff for TIFF images
--with-zlib                 # Use zlib compression
--with-expat                # Enable XML support via expat
--with-regex                # Enable wxRegEx class
--with-cairo                # Use Cairo-based wxGraphicsContext
```

### Networking
```bash
--enable-sockets            # Socket/network classes
--enable-ipv6               # IPv6 support in wxSocket
--enable-webrequest         # wxWebRequest support
--with-libcurl              # Use libcurl for wxWebRequest
--enable-protocols          # wxProtocol and derived classes
--enable-ftp                # wxFTP support
--enable-http               # wxHTTP support
```

### UI Controls
```bash
--disable-controls          # Disable all standard controls
--enable-button             # wxButton class
--enable-checkbox           # wxCheckBox class
--enable-choice             # wxChoice class
--enable-combobox           # wxComboBox class
--enable-listbox            # wxListBox class
--enable-listctrl           # wxListCtrl class
--enable-notebook           # wxNotebook class
--enable-radiobox           # wxRadioBox class
--enable-slider             # wxSlider class
--enable-spinbtn            # wxSpinButton class
--enable-stattext           # wxStaticText class
--enable-textctrl           # wxTextCtrl class
--enable-treectrl           # wxTreeCtrl class
--enable-grid               # wxGrid class
--enable-dataviewctrl       # wxDataViewCtrl class
```

### Advanced UI Features
```bash
--enable-aui                # AUI docking library
--enable-ribbon             # wxRibbon library
--enable-propgrid           # wxPropertyGrid library
--enable-stc                # wxStyledTextCtrl (Scintilla)
--enable-richtext           # wxRichTextCtrl
--enable-webview            # wxWebView library
--enable-mediactrl          # wxMediaCtrl for media playback
```

### Dialogs
```bash
--enable-commondlg          # All common dialogs
--enable-aboutdlg           # wxAboutBox
--enable-choicedlg          # wxChoiceDialog
--enable-coldlg             # wxColourDialog
--enable-filedlg            # wxFileDialog
--enable-fontdlg            # wxFontDialog
--enable-msgdlg             # wxMessageDialog
--enable-progressdlg        # wxProgressDialog
--enable-wizarddlg          # wxWizard
```

### Graphics & Imaging
```bash
--enable-graphics_ctx       # 2D graphics context API
--enable-graphics-d2d       # Direct2D graphics (Windows)
--enable-image              # wxImage class
--enable-gif                # GIF image support
--enable-pcx                # PCX image support
--enable-tga                # TGA image support
--enable-xpm                # XPM image support
--enable-svg                # SVG device context
--with-nanosvg              # NanoSVG for SVG rasterization
```

### Document/View Architecture
```bash
--enable-docview            # Document/view architecture
--enable-mdi                # Multiple document interface
--enable-help               # Help subsystem
--enable-html               # wxHTML sub-library
--enable-htmlhelp           # wxHTML-based help
--enable-xrc                # XRC resources
```

### System & Utilities
```bash
--enable-threads            # Thread support
--enable-filesystem         # Virtual file systems
--enable-fswatcher          # wxFileSystemWatcher
--enable-config             # wxConfig classes
--enable-datetime           # wxDateTime class
--enable-timer              # wxTimer class
--enable-stopwatch          # wxStopWatch class
--enable-log                # Logging system
--enable-cmdline            # wxCmdLineParser
--enable-intl               # Internationalization
```

### Platform-Specific Options

#### Windows
```bash
--enable-uxtheme            # Windows XP themed look
--enable-taskbarbutton      # wxTaskBarButton
--enable-webviewie          # IE-based wxWebView
--enable-webviewedge        # Edge-based wxWebView
--with-dpi=none|system|per-monitor  # DPI awareness
```

#### macOS
```bash
--with-macosx-sdk=PATH      # macOS SDK path
--with-macosx-version-min=VER  # Minimum macOS version (default: 10.10)
--enable-universal_binary   # Create universal binary
```

### Optimization & Debugging
```bash
--enable-debug              # Debug build
--enable-debug_info         # Include debug symbols
--disable-optimise          # Disable optimizations
--enable-profile            # Add profiling information
--enable-no_exceptions      # Build without C++ exceptions
--enable-no_rtti            # Build without RTTI
```

## Key Feature Headers

The library includes 420+ header files providing access to various functionality. Major categories include:

- **Core**: app.h, event.h, string.h, datetime.h, file.h
- **UI Controls**: button.h, textctrl.h, listctrl.h, treectrl.h, grid.h
- **Windows**: frame.h, dialog.h, panel.h, window.h
- **Graphics**: dc.h, graphics.h, image.h, bitmap.h
- **Advanced**: aui/, stc/, propgrid/, ribbon/, richtext/
- **Networking**: socket.h, protocol/, webrequest.h
- **XML**: xml/, xrc/
- **Utilities**: config.h, log.h, stream.h, archive.h

## Usage in This Project

This project uses wxWidgets as a Git submodule located at `third_party/wxWidgets/`. The build is configured via CMake in `cmake/External/wxwidgets.cmake`.

For the complete list of available features, see `wxwidgets-available-features.txt` and `wxwidgets-configure-options.txt` in the project root.

## References

- wxWidgets Documentation: https://docs.wxwidgets.org/
- wxWidgets Wiki: https://wiki.wxwidgets.org/
- Source Repository: https://github.com/wxWidgets/wxWidgets

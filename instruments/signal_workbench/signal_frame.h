// Compass — Signal Workbench (Instrument #2, I3)
// SignalFrame: the plot-specific... signal-specific shell. A thin subclass of
// compass::DocumentFrame supplying a SignalDocument, a channel tree, the waveform
// canvas, and an annotation table. Opens EDF recordings; the document is the
// annotation sidecar (.annot).

#pragma once

#include "compass/document_frame.h"
#include "signal/edf_reader.h"
#include "signal/signal_document.h"

class WaveformCanvas;
class wxTreeCtrl;
class wxDataViewListCtrl;
class wxDataViewEvent;
class wxMenu;
class wxAboutDialogInfo;

class SignalFrame : public compass::DocumentFrame {
public:
    SignalFrame();

protected:
    compass::Document& document() override { return m_doc; }
    void NewDocument() override { m_doc = sig::SignalDocument{}; }
    void BuildWorkspace() override;
    void SyncViews() override;
    wxString DocumentWildcard() const override {
        return "Annotation session (*.annot)|*.annot";
    }
    wxString DefaultFileName() const override { return "session.annot"; }
    void PopulateFileMenu(wxMenu& file_menu) override;
    void PopulateAboutDialog(wxAboutDialogInfo& info) override;

private:
    void OnOpenRecording(wxCommandEvent& e);
    void OnAddAnnotation(wxCommandEvent& e);
    void OnRemoveAnnotation(wxCommandEvent& e);
    void OnAnnotEdited(wxDataViewEvent& e);
    void ReloadChannelTree();
    void ReloadAnnotTable();

    sig::SignalDocument m_doc;
    sig::EdfReader m_reader;
    bool m_haveReader = false;
    WaveformCanvas* m_canvas = nullptr;
    wxTreeCtrl* m_tree = nullptr;
    wxDataViewListCtrl* m_annot = nullptr;
    bool m_reloading = false;
};

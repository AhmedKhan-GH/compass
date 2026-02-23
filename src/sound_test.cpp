#include <wx/wx.h>
#include <wx/sound.h>
#include <wx/file.h>
#include <wx/filename.h>
#include <cmath>
#include <vector>

// Generate a sine wave tone
std::vector<uint8_t> GenerateTone(int frequency, int durationMs, int sampleRate = 44100) {
    int numSamples = (sampleRate * durationMs) / 1000;
    std::vector<int16_t> samples(numSamples);

    for (int i = 0; i < numSamples; i++) {
        double t = (double)i / sampleRate;
        double value = sin(2.0 * M_PI * frequency * t) * 32767.0 * 0.5; // 50% volume
        samples[i] = (int16_t)value;
    }

    // Create WAV file in memory
    std::vector<uint8_t> wavData;

    // WAV header
    wavData.insert(wavData.end(), {'R','I','F','F'});
    uint32_t chunkSize = 36 + numSamples * 2;
    wavData.push_back(chunkSize & 0xff);
    wavData.push_back((chunkSize >> 8) & 0xff);
    wavData.push_back((chunkSize >> 16) & 0xff);
    wavData.push_back((chunkSize >> 24) & 0xff);
    wavData.insert(wavData.end(), {'W','A','V','E'});

    // fmt chunk
    wavData.insert(wavData.end(), {'f','m','t',' '});
    wavData.insert(wavData.end(), {16,0,0,0}); // fmt chunk size
    wavData.insert(wavData.end(), {1,0}); // PCM format
    wavData.insert(wavData.end(), {1,0}); // mono
    wavData.push_back(sampleRate & 0xff);
    wavData.push_back((sampleRate >> 8) & 0xff);
    wavData.push_back((sampleRate >> 16) & 0xff);
    wavData.push_back((sampleRate >> 24) & 0xff);
    uint32_t byteRate = sampleRate * 2;
    wavData.push_back(byteRate & 0xff);
    wavData.push_back((byteRate >> 8) & 0xff);
    wavData.push_back((byteRate >> 16) & 0xff);
    wavData.push_back((byteRate >> 24) & 0xff);
    wavData.insert(wavData.end(), {2,0}); // block align
    wavData.insert(wavData.end(), {16,0}); // bits per sample

    // data chunk
    wavData.insert(wavData.end(), {'d','a','t','a'});
    uint32_t dataSize = numSamples * 2;
    wavData.push_back(dataSize & 0xff);
    wavData.push_back((dataSize >> 8) & 0xff);
    wavData.push_back((dataSize >> 16) & 0xff);
    wavData.push_back((dataSize >> 24) & 0xff);

    // audio data
    for (int16_t sample : samples) {
        wavData.push_back(sample & 0xff);
        wavData.push_back((sample >> 8) & 0xff);
    }

    return wavData;
}

class SoundTestFrame : public wxFrame {
public:
    SoundTestFrame() : wxFrame(nullptr, wxID_ANY, "Sound Test", wxDefaultPosition, wxSize(400, 250)) {
        wxPanel* panel = new wxPanel(this);
        wxBoxSizer* sizer = new wxBoxSizer(wxVERTICAL);

        wxButton* tone440Button = new wxButton(panel, wxID_ANY, "Play 440 Hz (A4)");
        wxButton* tone523Button = new wxButton(panel, wxID_ANY, "Play 523 Hz (C5)");
        wxButton* tone659Button = new wxButton(panel, wxID_ANY, "Play 659 Hz (E5)");

        sizer->Add(tone440Button, 0, wxALL | wxCENTER, 5);
        sizer->Add(tone523Button, 0, wxALL | wxCENTER, 5);
        sizer->Add(tone659Button, 0, wxALL | wxCENTER, 5);

        wxStaticText* info = new wxStaticText(panel, wxID_ANY,
            "Click buttons to test sound generation.\nTones will play for 500ms.");
        sizer->Add(info, 0, wxALL | wxCENTER, 10);

        panel->SetSizer(sizer);

        tone440Button->Bind(wxEVT_BUTTON, [](wxCommandEvent&) {
            auto wavData = GenerateTone(440, 500);
            wxString tempFile = wxFileName::CreateTempFileName("tone");
            wxFile file(tempFile, wxFile::write);
            file.Write(wavData.data(), wavData.size());
            file.Close();
            wxSound sound(tempFile);
            sound.Play(wxSOUND_ASYNC | wxSOUND_LOOP);
            wxMilliSleep(500);
            wxRemoveFile(tempFile);
        });

        tone523Button->Bind(wxEVT_BUTTON, [](wxCommandEvent&) {
            auto wavData = GenerateTone(523, 500);
            wxString tempFile = wxFileName::CreateTempFileName("tone");
            wxFile file(tempFile, wxFile::write);
            file.Write(wavData.data(), wavData.size());
            file.Close();
            wxSound sound(tempFile);
            sound.Play(wxSOUND_ASYNC | wxSOUND_LOOP);
            wxMilliSleep(500);
            wxRemoveFile(tempFile);
        });

        tone659Button->Bind(wxEVT_BUTTON, [](wxCommandEvent&) {
            auto wavData = GenerateTone(659, 500);
            wxString tempFile = wxFileName::CreateTempFileName("tone");
            wxFile file(tempFile, wxFile::write);
            file.Write(wavData.data(), wavData.size());
            file.Close();
            wxSound sound(tempFile);
            sound.Play(wxSOUND_ASYNC | wxSOUND_LOOP);
            wxMilliSleep(500);
            wxRemoveFile(tempFile);
        });
    }
};

class SoundTestApp : public wxApp {
public:
    virtual bool OnInit() {
        SoundTestFrame* frame = new SoundTestFrame();
        frame->Show(true);
        return true;
    }
};

wxIMPLEMENT_APP(SoundTestApp);

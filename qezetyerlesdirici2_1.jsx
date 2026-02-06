#targetengine "session"
app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!");
    exit();
}

var debugLog = [];
function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}
function showLog() {
    if (debugLog.length > 0) {
        alert("🪵 LOG:\n\n" + debugLog.join('\n'));
    }
}

var savedConfig = {
    lastFolder: "",
    columns: 2,
    titleFontSize: 14,
    bodyFontSize: 10,
    imageRatio: 40,
    padding: 5
};

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.1");
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [500, 400];

// TAB 1: ƏSAS
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 15;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 15;
grpFolder.spacing = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olan):");
var etFolder = grpFolder.add("edittext", undefined, savedConfig.lastFolder);
etFolder.preferredSize = [450, 30];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 35;

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin");
    if (folder) {
        etFolder.text = folder.fsName;
        savedConfig.lastFolder = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

// TAB-lar (tipoqrafiya, şəkil və s.) əvvəlki kimi saxlanılıb
// ... (bu hissə dəyişməz qalır, kod sənin orijinalından olduğu kimi işləyəcək)

// DÜYMƏLƏR
var grpButtons = win.add("group");
grpButtons.orientation = "row";
grpButtons.alignment = ["fill", "bottom"];
grpButtons.spacing = 10;

var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [120, 40];

var btnRun = grpButtons.add("button", undefined, "✅ Yerləşdir");
btnRun.preferredSize = [150, 40];

var btnCancel = grpButtons.add("button", undefined, "❌ Bağla", {name: "cancel"});
btnCancel.preferredSize = [120, 40];

var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [480, 25];

// Sənin bütün əsas “btnTest.onClick” və “btnRun.onClick” məntiqi eyni saxlanılır,
// yalnız “alert()” çağırışları qorunur və “win” bağlandıqdan sonra göstərilir.

btnRun.onClick = function() {
    debugLog = [];
    try {
        txtProgress.text = "İcra olunur...";
        win.update();
        log("YERLƏŞDİRMƏ BAŞLADI");
        // bütün sənin mövcud əməliyyat kodların burada eyni qalır
        // ...
        txtProgress.text = "✅ Tamamlandı";
        win.close();
        showLog();
    } catch (e) {
        log("XƏTA: " + e);
        alert("❌ Xəta: " + e + "\n\nSətir: " + e.line);
        txtProgress.text = "Xəta!";
        showLog();
    }
};

win.center();
win.show();

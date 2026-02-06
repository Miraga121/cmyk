// #targetengine "session"

// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v3.1 — STİL PAKETİ İLƏ (InDesign 20.0+)
// ═══════════════════════════════════════════════════════════

if (parseFloat(app.version) < 19.0) {
    alert("Bu skript InDesign 19.0+ üçün nəzərdə tutulub!\nHal-hazırki versiya: " + app.version);
    exit();
}

if (!app.documents.length) { alert("Sənəd açın!"); exit(); }
var doc = app.activeDocument;

// Global
var debugLog = [], totalPlaced = 0, totalErrors = 0;
function log(m) { debugLog.push(m); $.writeln(m); }

// ────────────────────────────────
// STİL YARADICI FUNKSIYALAR
// ────────────────────────────────

function createParagraphStyle(name, baseStyle, settings) {
    var style = doc.paragraphStyles.item(name);
    if (!style.isValid) style = doc.paragraphStyles.add({ name: name });
    if (baseStyle) style.basedOn = baseStyle;
    for (var key in settings) {
        if (style.properties.hasOwnProperty(key)) style[key] = settings[key];
    }
    return style;
}

function createCharacterStyle(name, settings) {
    var style = doc.characterStyles.item(name);
    if (!style.isValid) style = doc.characterStyles.add({ name: name });
    for (var key in settings) {
        if (style.properties.hasOwnProperty(key)) style[key] = settings[key];
    }
    return style;
}

function createObjectStyle(name, settings) {
    var style = doc.objectStyles.item(name);
    if (!style.isValid) style = doc.objectStyles.add({ name: name });
    for (var key in settings) {
        if (style.properties.hasOwnProperty(key)) style[key] = settings[key];
    }
    return style;
}

// ────────────────────────────────
// STİL DƏYİŞƏNLƏRİ
// ────────────────────────────────

var baseTextStyle, titleStyle, subtitleStyle, emphasisStyle, imageObjectStyle;

// ────────────────────────────────
// STİL PAKETİ FUNKSIYALAR
// ────────────────────────────────

function exportStylePack() {
    var pack = {
        version: "3.1",
        baseFont: baseTextStyle.appliedFont ? baseTextStyle.appliedFont.name : "Times New Roman",
        baseSize: baseTextStyle.pointSize,
        baseLeading: baseTextStyle.leading,
        titleSize: titleStyle.pointSize,
        titleSpaceAfter: titleStyle.spaceAfter,
        subtitleSize: subtitleStyle.pointSize,
        wrapOffset: imageObjectStyle.textWrapPreferences.textWrapOffset,
        imageBorder: imageObjectStyle.strokeWeight
    };

    var file = File.saveDialog("Stil paketini saxla (*.json)", "JSON:*.json");
    if (!file) return;
    if (!file.name.match(/\.json$/i)) file = new File(file.fsName + ".json");

    try {
        file.encoding = "UTF-8";
        file.open("w");
        file.write(JSON.stringify(pack, null, 2));
        file.close();
        log("Stil paketi saxlandı: " + file.fsName);
        alert("Stil paketi saxlandı!\n" + file.fsName);
    } catch (e) {
        log("Paket saxlama xətası: " + e);
        alert("Xəta: " + e);
    }
}

function importStylePack() {
    var file = File.openDialog("Stil paketi seçin (*.json)", "JSON:*.json");
    if (!file) return;

    try {
        file.encoding = "UTF-8";
        file.open("r");
        var data = JSON.parse(file.read());
        file.close();

        if (data.version !== "3.1") {
            if (!confirm("Fərqli versiya paketi. Yenə də yüklənsin?")) return;
        }

        // Əsas mətn
        baseTextStyle.appliedFont = app.fonts.item(data.baseFont) || app.fonts[0];
        baseTextStyle.pointSize = data.baseSize;
        baseTextStyle.leading = data.baseLeading;

        // Başlıq
        titleStyle.pointSize = data.titleSize;
        titleStyle.spaceAfter = data.titleSpaceAfter;

        // Altbaşlıq
        subtitleStyle.pointSize = data.subtitleSize;

        // Şəkil
        imageObjectStyle.textWrapPreferences.textWrapOffset = data.wrapOffset;
        imageObjectStyle.strokeWeight = data.imageBorder;

        log("Stil paketi yükləndi: " + file.fsName);
        alert("Stil paketi yükləndi!\n" + file.fsName);

        // GUI yenilə
        updateGUIFromStyles();

    } catch (e) {
        log("Paket yükləmə xətası: " + e);
        alert("Xəta: " + e);
    }
}

// ────────────────────────────────
// GUI YARATMA
// ────────────────────────────────

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v3.1", undefined, {resizeable: true});
win.orientation = "column"; win.spacing = 10; win.margins = 20;

var tabPanel = win.add("tabbedpanel");

// === TAB 1: ƏSAS ===
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column"; tab1.spacing = 15;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.margins = 15;
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize.width = 450;
var btnBrowse = grpFolder.add("button", undefined, "Qovluq Seç...");
btnBrowse.preferredSize.height = 35;

// === TAB 2: TİPOQRAFİYA ===
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column"; tab2.spacing = 15;

// Şrift və Ölçülər
var grpFont = tab2.add("group");
grpFont.add("statictext", undefined, "Əsas Şrift:");
var ddlFont = grpFont.add("dropdownlist", undefined, getFontNames());
ddlFont.preferredSize.width = 200;

var grpBaseSize = tab2.add("group");
grpBaseSize.add("statictext", undefined, "Əsas Ölçü:");
var ddlBaseSize = grpBaseSize.add("dropdownlist", undefined, ["9", "10", "11", "12"]);
ddlBaseSize.selection = 1;

var grpTitleSize = tab2.add("group");
grpTitleSize.add("statictext", undefined, "Başlıq Ölçü:");
var ddlTitleSize = grpTitleSize.add("dropdownlist", undefined, ["14", "16", "18", "20", "24"]);
ddlTitleSize.selection = 1;

// === TAB 3: ŞƏKİL ===
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column"; tab3.spacing = 15;

var grpWrap = tab3.add("group");
grpWrap.add("statictext", undefined, "Mətn axıtma (mm):");
var txtWrap = grpWrap.add("edittext", undefined, "4");
txtWrap.preferredSize.width = 50;

// === TAB 4: STİL PAKETİ ===
var tab4 = tabPanel.add("tab", undefined, "Stil Paketi");
tab4.orientation = "column"; tab4.alignChildren = "center"; tab4.spacing = 20;

var btnExport = tab4.add("button", undefined, "Stil Paketi Saxla", {name: "ok"});
btnExport.preferredSize = [220, 50];

var btnImport = tab4.add("button", undefined, "Stil Paketi Yüklə", {name: "ok"});
btnImport.preferredSize = [220, 50];

// === ƏSAS DÜYMƏLƏR ===
var grpButtons = win.add("group");
grpButtons.alignment = "center"; grpButtons.spacing = 15;

var btnTest = grpButtons.add("button", undefined, "Test Et");
var btnRun = grpButtons.add("button", undefined, "Yerləşdir");
var btnCancel = grpButtons.add("button", undefined, "Bağla", {name: "cancel"});

var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize.width = 480;

// ────────────────────────────────
// GUI YENİLƏMƏ
// ────────────────────────────────

function updateGUIFromStyles() {
    if (!baseTextStyle || !baseTextStyle.isValid) return;
    ddlFont.selection = ddlFont.find(baseTextStyle.appliedFont.name) || 0;
    ddlBaseSize.selection = ddlBaseSize.find(baseTextStyle.pointSize.toString()) || 1;
    ddlTitleSize.selection = ddlTitleSize.find(titleStyle.pointSize.toString()) || 1;
    txtWrap.text = imageObjectStyle.textWrapPreferences.textWrapOffset[0].toString();
}

// ────────────────────────────────
// YARDIMÇI FUNKSIYALAR
// ────────────────────────────────

function getFontNames() {
    var fonts = [];
    for (var i = 0; i < app.fonts.length; i++) fonts.push(app.fonts[i].name);
    return fonts.sort();
}

// ────────────────────────────────
// STİLLƏRİ QUR
// ────────────────────────────────

function setupStyles() {
    log("Stil iyerarxiyası qurulur...");

    baseTextStyle = createParagraphStyle("01_Əsas Mətn", null, {
        pointSize: 10,
        leading: 12,
        appliedFont: app.fonts.item("Times New Roman"),
        justification: Justification.LEFT_ALIGN
    });

    titleStyle = createParagraphStyle("02_Başlıq", baseTextStyle, {
        pointSize: 16,
        fontStyle: "Bold",
        spaceAfter: 6
    });

    subtitleStyle = createParagraphStyle("03_Altbaşlıq", baseTextStyle, {
        pointSize: 12,
        fontStyle: "Bold Italic",
        spaceAfter: 4
    });

    emphasisStyle = createCharacterStyle("Vurğu", {
        fontStyle: "Bold"
    });

    imageObjectStyle = createObjectStyle("Şəkil - Mətn Axıtma", {
        textWrapPreferences: {
            textWrapMode: TextWrapModes.BOUNDING_BOX_TEXT_WRAP,
            textWrapOffset: [4, 4, 4, 4]
        },
        strokeWeight: 0.5
    });

    updateGUIFromStyles();
    log("Stil iyerarxiyası tamamlandı.");
}

// ────────────────────────────────
// EVENT HANDLERS
// ────────────────────────────────

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olan)");
    if (folder) {
        etFolder.text = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

btnExport.onClick = function() { exportStylePack(); };
btnImport.onClick = function() { importStylePack(); };

btnTest.onClick = function() {
    alert("Test funksiyası gələcəkdə əlavə olunacaq.\nHazırda stil paketi ilə işləyə bilərsiniz.");
};

btnRun.onClick = function() {
    var rootPath = etFolder.text;
    if (!rootPath) { alert("Qovluq seçin!"); return; }

    // GUI-dən parametrləri yenilə
    baseTextStyle.appliedFont = app.fonts.item(ddlFont.selection.text);
    baseTextStyle.pointSize = parseInt(ddlBaseSize.selection.text);
    baseTextStyle.leading = baseTextStyle.pointSize * 1.2;

    titleStyle.pointSize = parseInt(ddlTitleSize.selection.text);

    var wrapVal = parseFloat(txtWrap.text) || 4;
    imageObjectStyle.textWrapPreferences.textWrapOffset = [wrapVal, wrapVal, wrapVal, wrapVal];

    win.close();
    alert("Yerləşdirmə başlayır...\nStil paketi tətbiq olundu.");
    // Əsas yerləşdirmə loqikası buraya əlavə olunacaq
};

// ────────────────────────────────
// BAŞLAT
// ────────────────────────────────

setupStyles();
win.center();
win.show();
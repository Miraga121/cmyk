#targetengine "session"

// QƏZET MƏZMUN YERLƏŞDİRİCİSİ v3.0 — STYLES SİSTEMİ İLƏ
// Uyğunluq: InDesign 19.x (ExtendScript)

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Heç olmasa 8 səhifə olmalıdır — hal-hazırda: " + doc.pages.length);
    exit();
}

var CONFIG = {
    styles: {
        title: "Qezet_Basliq",
        body: "Qezet_Metn",
        caption: "Qezet_Sekil_Aciklama",
        charBold: "Qezet_Qalın",
        charItalic: "Qezet_Kursiv"
    },
    defaults: {
        columns: 3,
        imageRatio: 40,
        padding: 5,
        titleSize: 14,
        bodySize: 10
    },
    typography: {
        firstLineIndent: UnitValue(3, "mm"),
        bodyLeadingRatio: 1.2,
        hyphenateMinLength: 5,
        titleSpaceAfter: 4.5,
        baselineGrid: UnitValue(12, "pt")
    }
};

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
function ensureStyles(doc) {
    try {
        var boldFont = findArialFont("Bold");
        var regularFont = findArialFont("Regular");
        var italicFont = findArialFont("Italic");

        var titleStyle = getOrCreateParaStyle(doc, CONFIG.styles.title);
        titleStyle.appliedFont = boldFont.name;
        titleStyle.pointSize = CONFIG.defaults.titleSize;
        titleStyle.justification = Justification.LEFT_ALIGN;
        titleStyle.spaceAfter = CONFIG.typography.titleSpaceAfter;
        titleStyle.leading = 16;
        titleStyle.keepWithNext = true;

        var bodyStyle = getOrCreateParaStyle(doc, CONFIG.styles.body);
        bodyStyle.appliedFont = regularFont.name;
        bodyStyle.pointSize = CONFIG.defaults.bodySize;
        bodyStyle.justification = Justification.FULLY_JUSTIFIED;
        bodyStyle.firstLineIndent = CONFIG.typography.firstLineIndent;
        bodyStyle.leading = bodyStyle.pointSize * CONFIG.typography.bodyLeadingRatio;
        bodyStyle.hyphenation = true;
        bodyStyle.hyphenateWordsLongerThan = CONFIG.typography.hyphenateMinLength;
        bodyStyle.hyphenationZone = UnitValue(3, "mm");

        var captionStyle = getOrCreateParaStyle(doc, CONFIG.styles.caption);
        captionStyle.appliedFont = italicFont.name;
        captionStyle.pointSize = 8;
        captionStyle.justification = Justification.LEFT_ALIGN;
        captionStyle.leading = 9.6;
        captionStyle.firstLineIndent = 0;
        captionStyle.leftIndent = UnitValue(1, "mm");
        captionStyle.rightIndent = UnitValue(1, "mm");
        captionStyle.hyphenation = false;

        getOrCreateCharStyle(doc, CONFIG.styles.charBold).appliedFont = boldFont.name;
        getOrCreateCharStyle(doc, CONFIG.styles.charItalic).appliedFont = italicFont.name;

        return true;
    } catch(e) {
        alert("❌ Üslublar yaradıla bilmədi!\n\n" + e.message);
        return false;
    }
}

function getOrCreateParaStyle(doc, styleName) {
    try {
        var style = doc.paragraphStyles.itemByName(styleName);
        if (style.isValid) return style;
    } catch(e){}
    return doc.paragraphStyles.add({name: styleName});
}

function getOrCreateCharStyle(doc, styleName) {
    try {
        var style = doc.characterStyles.itemByName(styleName);
        if (style.isValid) return style;
    } catch(e){}
    return doc.characterStyles.add({name: styleName});
}

function findArialFont(variant) {
    var fontMap = {
        "Bold": ["Arial-BoldMT","Arial Bold"],
        "Regular": ["ArialMT","Arial"],
        "Italic": ["Arial-ItalicMT","Arial Italic"]
    };
    var candidates = fontMap[variant] || fontMap["Regular"];
    for (var i=0;i<candidates.length;i++){
        try {
            var f = app.fonts.itemByName(candidates[i]);
            if (f.isValid) return f;
        } catch(e){}
    }
    return app.fonts[0];
}

// ─────────────────────────────────────────────
// BASELINE GRID
// ─────────────────────────────────────────────
function setupBaselineGrid(doc) {
    var gridPrefs = doc.gridPreferences;
    gridPrefs.baselineStart = UnitValue(12, "pt");
    gridPrefs.baselineDivision = CONFIG.typography.baselineGrid;
}

// ─────────────────────────────────────────────
// ƏSAS İCRA
// ─────────────────────────────────────────────
function runPlacer(rootFolder) {
    if (!ensureStyles(doc)) return;
    setupBaselineGrid(doc);

    var fitOption = ContentFitOptions.PROPORTIONALLY;

    for (var p=2; p<=8; p++) {
        var pageFolder = new Folder(rootFolder + "/page" + p);
        if (!pageFolder.exists) continue;

        var txtFiles = pageFolder.getFiles("*.txt");
        var imgFiles = pageFolder.getFiles(/\.(jpg|jpeg|png|tif|tiff)$/i);

        var page = doc.pages.item(p-1);
        clearPageContent(page);

        for (var i=0; i<txtFiles.length; i++) {
            var tf = page.textFrames.add();
            tf.geometricBounds = [20,20,200,200];
            tf.contents = readTextFile(txtFiles[i]);
            tf.parentStory.paragraphs[0].appliedParagraphStyle = doc.paragraphStyles.itemByName(CONFIG.styles.title);
            tf.parentStory.paragraphs.itemByRange(1,-1).appliedParagraphStyle = doc.paragraphStyles.itemByName(CONFIG.styles.body);
        }

        for (var j=0; j<imgFiles.length; j++) {
            var rf = page.rectangles.add();
            rf.geometricBounds = [210,20,300,200];
            rf.place(imgFiles[j]);
            rf.fit(fitOption);
        }
    }
}

function readTextFile(file) {
    file.encoding = "UTF-8";
    file.open("r");
    var content = file.read();
    file.close();
    return content;
}

function clearPageContent(page) {
    var items = page.pageItems;
    for (var i=items.length-1; i>=0; i--) {
        items[i].remove();
    }
}

// ─────────────────────────────────────────────
// İSTİFADƏÇİ İNTERFEYSİ
// ─────────────────────────────────────────────
var win = new Window("dialog", "Qəzet Yerləşdiricisi v3.0", undefined);
var etFolder = win.add("edittext", undefined, "");
etFolder.preferredSize = [400,25];
var btnBrowse = win.add("button", undefined, "📁 Qovluq Seç");
var btnRun = win.add("button", undefined, "✅ Yerləşdir");

btnBrowse.onClick = function(){
    var f = Folder.selectDialog("Ana qovluğu seçin");
    if (f) etFolder.text = f.fsName;
};

btnRun.onClick = function(){
    var root = new Folder(etFolder.text);
    if (!root.exists) { 
        alert("❌ Qovluq mövcud deyil"); 
        return; 
    }
    runPlacer(root);
    alert("✅ Yerləşdirmə tamamlandı!");
    win.close();
};

win.show();

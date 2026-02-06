#targetengine "session"

// ═══════════════════════════════════════════════════════════════
// QƏZET MƏZMUN YERLƏŞDİRİCİSİ v3.0 — STYLES SİSTEMİ İLƏ
// ═══════════════════════════════════════════════════════════════
// Uyğunluq: InDesign 19.x (ExtendScript)
// Yeniləmə: 2025-01-30
// YENİLİKLƏR:
// ✓ Paragraph və Character Styles avtomatik yaradılması
// ✓ Üslub əsaslı formatlama (manual overrides yox)
// ✓ Mərkəzləşdirilmiş dizayn idarəetməsi
// ✓ Arial font ailə yoxlaması və alternativlər
// ✓ Təkmilləşdirilmiş xəta idarəetməsi
// ═══════════════════════════════════════════════════════════════

#targetengine "session"

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Heç olmasa 8 səhifə olmalıdır — hal-hazırda: " + doc.pages.length);
    exit();
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL KONFIQURASIYA
// ═══════════════════════════════════════════════════════════════

var CONFIG = {
    styles: {
        title: "Qezet_Basliq",
        body: "Qezet_Metn",
        caption: "Qezet_Sekil_Aciklama",
        charBold: "Qezet_Qalın",
        charItalic: "Qezet_Kursiv"
    },
    defaults: {
        columns: 2,
        imageRatio: 40,
        padding: 5,
        titleSize: 14,
        bodySize: 10,
        minFontSize: 8,
        firstColExtraPercent: 0
    }
};

var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;

function log(msg) {
    debugLog.push(msg);
    try { $.writeln(msg); } catch(e) {}
}

// ═══════════════════════════════════════════════════════════════
// ÜSLUB (STYLES) İDARƏETMƏSİ
// ═══════════════════════════════════════════════════════════════

function ensureStyles(doc) {
    log("═══════════════════════════════════════");
    log("ÜSLUB SİSTEMİ HAZIRLANIR");
    log("═══════════════════════════════════════");
    
    try {
        // PARAGRAPH STYLES
        
        // 1. Başlıq üslubu
        var titleStyle = getOrCreateParaStyle(doc, CONFIG.styles.title);
        var boldFont = findArialFont("Bold");
        
        titleStyle.appliedFont = boldFont;
        titleStyle.pointSize = 14;
        titleStyle.justification = Justification.LEFT_ALIGN;
        titleStyle.spaceBefore = 0;
        titleStyle.spaceAfter = 6;
        titleStyle.leading = 16;
        titleStyle.fillColor = doc.swatches.itemByName("Black");
        titleStyle.hyphenation = false;
        
        log("✓ Başlıq üslubu: " + CONFIG.styles.title);
        
        // 2. Əsas mətn üslubu
        var bodyStyle = getOrCreateParaStyle(doc, CONFIG.styles.body);
        var regularFont = findArialFont("Regular");
        
        bodyStyle.appliedFont = regularFont;
        bodyStyle.pointSize = 10;
        bodyStyle.justification = Justification.FULLY_JUSTIFIED; // İki tərəfə
        bodyStyle.spaceBefore = 0;
        bodyStyle.spaceAfter = 3;
        bodyStyle.firstLineIndent = 0;
        bodyStyle.leading = 12;
        bodyStyle.hyphenation = true;
        bodyStyle.fillColor = doc.swatches.itemByName("Black");
        
        // Hyphenation settings
        try {
            bodyStyle.hyphenateCapitalizedWords = false;
            bodyStyle.hyphenateWordsLongerThan = 6;
            bodyStyle.hyphenateAfterFirst = 3;
            bodyStyle.hyphenateBeforeLast = 3;
        } catch(e) {
            log("⚠️ Hyphenation ayarları xətası: " + e.message);
        }
        
        log("✓ Əsas mətn üslubu: " + CONFIG.styles.body);
        
        // 3. Şəkil açıqlaması üslubu
        var captionStyle = getOrCreateParaStyle(doc, CONFIG.styles.caption);
        var italicFont = findArialFont("Italic");
        
        captionStyle.appliedFont = italicFont;
        captionStyle.pointSize = 8;
        captionStyle.justification = Justification.CENTER_ALIGN;
        captionStyle.spaceBefore = 3;
        captionStyle.spaceAfter = 0;
        captionStyle.leading = 10;
        captionStyle.fillColor = doc.swatches.itemByName("Black");
        
        log("✓ Şəkil açıqlaması: " + CONFIG.styles.caption);
        
        // CHARACTER STYLES (gələcək istifadə üçün)
        
        var charBold = getOrCreateCharStyle(doc, CONFIG.styles.charBold);
        charBold.appliedFont = boldFont;
        charBold.fontStyle = "Bold";
        
        var charItalic = getOrCreateCharStyle(doc, CONFIG.styles.charItalic);
        charItalic.appliedFont = italicFont;
        charItalic.fontStyle = "Italic";
        
        log("✓ Character styles yaradıldı");
        log("═══════════════════════════════════════");
        
        return true;
    } catch(e) {
        log("❌ Üslub yaratma xətası: " + e.message);
        alert("❌ XƏTA: Üslublar yaradıla bilmədi!\n\n" + e.message);
        return false;
    }
}

// Paragraph Style tap və ya yarat
function getOrCreateParaStyle(doc, styleName) {
    try {
        var style = doc.paragraphStyles.itemByName(styleName);
        if (style.isValid) {
            log("  ↻ Mövcud: " + styleName);
            return style;
        }
    } catch(e) {}
    
    try {
        var newStyle = doc.paragraphStyles.add({name: styleName});
        log("  ✚ Yeni: " + styleName);
        return newStyle;
    } catch(e) {
        log("  ❌ Yaradılmadı: " + styleName + " — " + e.message);
        return doc.paragraphStyles[0]; // Default
    }
}

// Character Style tap və ya yarat
function getOrCreateCharStyle(doc, styleName) {
    try {
        var style = doc.characterStyles.itemByName(styleName);
        if (style.isValid) {
            return style;
        }
    } catch(e) {}
    
    try {
        return doc.characterStyles.add({name: styleName});
    } catch(e) {
        return doc.characterStyles[0];
    }
}

// Arial font ailə axtarışı
function findArialFont(variant) {
    var fontMap = {
        "Bold": [
            "Arial-BoldMT",
            "Arial Bold",
            "ArialMT-Bold",
            "Arial-Bold",
            "Arial\tBold"
        ],
        "Regular": [
            "ArialMT",
            "Arial",
            "Arial-Regular",
            "Arial Regular"
        ],
        "Italic": [
            "Arial-ItalicMT",
            "Arial Italic",
            "ArialMT-Italic",
            "Arial-Italic",
            "Arial\tItalic"
        ]
    };
    
    var candidates = fontMap[variant] || fontMap["Regular"];
    
    // İlk mövcud fontu tap
    for (var i = 0; i < candidates.length; i++) {
        try {
            var font = app.fonts.itemByName(candidates[i]);
            if (font.isValid) {
                log("  ✓ Font tapıldı: " + candidates[i]);
                return font;
            }
        } catch(e) {}
    }
    
    // Arial ailəsindən hər hansı birini tap
    try {
        for (var j = 0; j < app.fonts.length; j++) {
            if (app.fonts[j].name.indexOf("Arial") !== -1) {
                log("  ⚠️ Alternativ: " + app.fonts[j].name);
                return app.fonts[j];
            }
        }
    } catch(e) {}
    
    // Default font
    log("  ⚠️ Arial tapılmadı, default istifadə edilir");
    return app.fonts[0];
}

// Üslubu tətbiq et
function applyParagraphStyle(textFrame, styleName) {
    try {
        var style = doc.paragraphStyles.itemByName(styleName);
        if (style && style.isValid) {
            textFrame.parentStory.paragraphs.everyItem().appliedParagraphStyle = style;
            return true;
        }
        log("    ⚠️ Üslub tapılmadı: " + styleName);
        return false;
    } catch(e) {
        log("    ❌ Üslub tətbiq xətası: " + e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// KÖMƏKÇI FUNKSIYALAR
// ═══════════════════════════════════════════════════════════════

function readTextFile(file) {
    if (!file || !file.exists) return "";
    try {
        file.encoding = "UTF-8";
        if (!file.open("r")) return "";
        var content = file.read();
        file.close();
        if (content && content.length > 0 && content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    } catch (e) {
        log("Fayl oxuma xətası: " + file.name + " — " + e.message);
        return "";
    }
}

function getNumberedFiles(folder, filterRegex) {
    if (!folder || !folder.exists) return [];
    try {
        var all = folder.getFiles();
        if (!all || all.length === 0) return [];
        var out = [];
        for (var i = 0; i < all.length; i++) {
            try {
                if (all[i] instanceof File && filterRegex.test(all[i].name)) {
                    out.push(all[i]);
                }
            } catch(e){}
        }
        out.sort(function(a,b){
            var na = parseInt(a.name.match(/^\d+/)) || 0;
            var nb = parseInt(b.name.match(/^\d+/)) || 0;
            return na - nb;
        });
        return out;
    } catch (e) {
        log("getNumberedFiles error: " + e.message);
        return [];
    }
}

function findImageFiles(folder, groupNum) {
    if (!folder || !folder.exists) return [];
    try {
        var pattern = new RegExp("^" + groupNum + "[-_]?(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$","i");
        var all = folder.getFiles();
        if (!all || all.length === 0) return [];
        var res = [];
        for (var i = 0; i < all.length; i++) {
            try {
                if (all[i] instanceof File && pattern.test(all[i].name)) {
                    res.push(all[i]);
                }
            } catch(e){}
        }
        res.sort(function(a,b){
            var ma = a.name.match(/[-_](\d+)\./);
            var mb = b.name.match(/[-_](\d+)\./);
            var na = ma ? parseInt(ma[1]) : 0;
            var nb = mb ? parseInt(mb[1]) : 0;
            return na - nb;
        });
        return res;
    } catch (e) {
        log("findImageFiles error: " + e.message);
        return [];
    }
}

function clearPageContent(page) {
    try {
        if (!page) {
            log("❌ clearPageContent: page null-dür");
            return false;
        }
        
        var items = page.pageItems;
        if (!items) {
            log("⚠️ pageItems mövcud deyil");
            return false;
        }

        log("  Silinəcək element sayı: " + items.length);
        
        for (var i = items.length - 1; i >= 0; i--) {
            try {
                if (items[i] && items[i].isValid) {
                    items[i].remove();
                }
            } catch(e) {}
        }
        
        log("  ✓ Səhifə təmizləndi");
        return true;
    } catch (e) {
        log("❌ clearPageContent xətası: " + e.message);
        return false;
    }
}

// ═══════════════════════════════════════════════════════════════
// İSTİFADƏÇİ İNTERFEYSİ
// ═══════════════════════════════════════════════════════════════

var win = new Window("dialog", "Qəzet Yerləşdiricisi v3.0 (Styles)", undefined, {resizeable:true});
win.orientation = "column";
win.alignChildren = ["fill","top"];
win.margins = 12;
win.spacing = 8;

var tabPanel = win.add("tabbedpanel");
tabPanel.preferredSize = [620,540];
tabPanel.alignChildren = ["fill","fill"];

// ─────────────────────────────────────────────────────────────
// TAB 1: ƏSAS
// ─────────────────────────────────────────────────────────────

var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column"; 
tab1.alignChildren = ["fill","top"]; 
tab1.spacing = 8;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.margins = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ...):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [560,28];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 26;

var grpLayout = tab1.add("panel", undefined, "Layout");
grpLayout.margins = 10;

var gCols = grpLayout.add("group");
gCols.add("statictext", undefined, "Grid sütun sayı:");
var ddlColumns = gCols.add("dropdownlist", undefined, ["1","2","3","4"]);
ddlColumns.selection = CONFIG.defaults.columns - 1;
ddlColumns.preferredSize = [80,22];

var gImg = grpLayout.add("group");
gImg.add("statictext", undefined, "Şəkil sahəsi (% hüceyrə hündürlüyü):");
var sliderImg = gImg.add("slider", undefined, CONFIG.defaults.imageRatio, 20, 60);
sliderImg.preferredSize = [300,22];
var txtImg = gImg.add("statictext", undefined, CONFIG.defaults.imageRatio + "%");
txtImg.preferredSize = [40,22];
sliderImg.onChanging = function(){ txtImg.text = Math.round(this.value) + "%"; };

var gPad = grpLayout.add("group");
gPad.add("statictext", undefined, "Padding (pt):");
var ddlPadding = gPad.add("dropdownlist", undefined, ["0","3","5","8","10"]);
ddlPadding.selection = 2;
ddlPadding.preferredSize = [80,22];

var grpPages = tab1.add("panel", undefined, "Səhifələr (page2..page8)");
grpPages.margins = 10;
var chkPages = [];
var row1 = grpPages.add("group");
row1.orientation = "row";
for (var p=2; p<=8; p++){
    var c = row1.add("checkbox", undefined, "S." + p);
    c.value = true;
    chkPages.push(c);
}
var rowBtns = grpPages.add("group");
var btnAll = rowBtns.add("button", undefined, "Hamısını seç"); 
btnAll.onClick = function(){ 
    for(var i=0; i<chkPages.length; i++) chkPages[i].value = true; 
};
var btnNone = rowBtns.add("button", undefined, "Hamısını götür"); 
btnNone.onClick = function(){ 
    for(var i=0; i<chkPages.length; i++) chkPages[i].value = false; 
};

// ─────────────────────────────────────────────────────────────
// TAB 2: TİPOQRAFİYA (Styles əsaslı)
// ─────────────────────────────────────────────────────────────

var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column"; 
tab2.alignChildren = ["fill","top"]; 
tab2.spacing = 8;

var grpStyleInfo = tab2.add("panel", undefined, "ℹ️ Üslub Sistemi");
grpStyleInfo.margins = 10;
var txtStyleInfo = grpStyleInfo.add("statictext", undefined, 
    "Bu skript avtomatik olaraq aşağıdakı üslubları yaradır:\n\n" +
    "• Qezet_Basliq — Başlıqlar üçün (14pt, Bold, Sol)\n" +
    "• Qezet_Metn — Əsas mətn (10pt, Regular, İki tərəfə)\n" +
    "• Qezet_Sekil_Aciklama — Şəkil açıqlamaları (8pt, Italic, Mərkəz)\n\n" +
    "Üslubları Paragraph Styles panelindən redaktə edə bilərsiniz.",
    {multiline: true}
);
txtStyleInfo.preferredSize = [580, 120];

var grpTitle = tab2.add("panel", undefined, "Başlıq Parametrləri");
grpTitle.margins = 10;
var rowTitle = grpTitle.add("group");
rowTitle.add("statictext", undefined, "Font ölçüsü:");
var ddlTitleSize = rowTitle.add("dropdownlist", undefined, ["12","14","16","18","20","24"]);
ddlTitleSize.selection = 1;
ddlTitleSize.preferredSize = [80,22];

rowTitle.add("statictext", undefined, "  Hizalama:");
var ddlTitleAlign = rowTitle.add("dropdownlist", undefined, ["Sol","Mərkəz","Sağ"]);
ddlTitleAlign.selection = 0;
ddlTitleAlign.preferredSize = [100,22];

var grpBody = tab2.add("panel", undefined, "Mətn Parametrləri");
grpBody.margins = 10;
var rowBody = grpBody.add("group");
rowBody.add("statictext", undefined, "Font ölçüsü:");
var ddlBodySize = rowBody.add("dropdownlist", undefined, ["8","9","10","11","12","14"]);
ddlBodySize.selection = 2;
ddlBodySize.preferredSize = [80,22];

rowBody.add("statictext", undefined, "  Hizalama:");
var ddlBodyAlign = rowBody.add("dropdownlist", undefined, ["Sol","İki tərəfə","Mərkəz"]);
ddlBodyAlign.selection = 1;
ddlBodyAlign.preferredSize = [120,22];

var chkHyphenation = grpBody.add("checkbox", undefined, "Hecanlaşdırma (Hyphenation)");
chkHyphenation.value = true;

// ─────────────────────────────────────────────────────────────
// TAB 3: ŞƏKİLLƏR
// ─────────────────────────────────────────────────────────────

var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column"; 
tab3.alignChildren = ["fill","top"]; 
tab3.spacing = 8;

var grpImgSet = tab3.add("panel", undefined, "Parametrlər");
grpImgSet.margins = 10;

var rowFit = grpImgSet.add("group");
rowFit.add("statictext", undefined, "Yerləşdirmə:");
var ddlFit = rowFit.add("dropdownlist", undefined, ["Proporsional doldur","Çərçivəyə sığdır"]);
ddlFit.selection = 0;
ddlFit.preferredSize = [180,22];

var chkImgBorder = grpImgSet.add("checkbox", undefined, "Şəkil sərhədi");
chkImgBorder.value = true;

var rowBW = grpImgSet.add("group");
rowBW.add("statictext", undefined, "Sərhəd qalınlığı (pt):");
var ddlBW = rowBW.add("dropdownlist", undefined, ["0.5","1","2","3"]); 
ddlBW.selection = 1; 
ddlBW.preferredSize = [80,22];

// ─────────────────────────────────────────────────────────────
// TAB 4: ƏLAVƏ
// ─────────────────────────────────────────────────────────────

var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column"; 
tab4.alignChildren = ["fill","top"]; 
tab4.spacing = 8;

var grpExtra = tab4.add("panel", undefined, "Seçimlər");
grpExtra.margins = 10;

var chkClear = grpExtra.add("checkbox", undefined, "Mövcud elementləri sil");
chkClear.value = true;

var chkLayers = grpExtra.add("checkbox", undefined, "Hər səhifə üçün layer yarat");
chkLayers.value = false;

var chkCreateStyles = grpExtra.add("checkbox", undefined, "Üslubları avtomatik yarat/yenilə");
chkCreateStyles.value = true;

// ─────────────────────────────────────────────────────────────
// BOTTOM BUTTONS
// ─────────────────────────────────────────────────────────────

var btnGroup = win.add("group");
btnGroup.alignment = "right";

var btnTest = btnGroup.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [110,36];

var btnRun = btnGroup.add("button", undefined, "✅ Yerləşdir");
btnRun.preferredSize = [140,36];

var btnClose = btnGroup.add("button", undefined, "❌ Bağla", {name:"cancel"});
btnClose.preferredSize = [100,36];

var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [600,22];

// ═══════════════════════════════════════════════════════════════
// EVENT HANDLERS
// ═══════════════════════════════════════════════════════════════

btnBrowse.onClick = function() {
    var f = Folder.selectDialog("Ana qovluğu seçin");
    if (f) {
        etFolder.text = f.fsName;
        txtProgress.text = "Qovluq seçildi: " + f.name;
    }
};

btnTest.onClick = function() {
    debugLog = [];
    log("═══════════════════════════════════════");
    log("TEST BAŞLADI");
    log("═══════════════════════════════════════");
    
    var root = new Folder(etFolder.text);
    if (!root || !root.exists) {
        alert("Qovluq mövcud deyil: " + etFolder.text);
        return;
    }
    
    log("Ana qovluq: " + root.fsName);
    var totalTxt = 0, totalImg = 0;
    
    for (var p = 2; p <= 8; p++) {
        var fld = new Folder(root + "/page" + p);
        if (!fld.exists) {
            log("⚠️ page" + p + " yoxdur");
            continue;
        }
        
        var txtArr = getNumberedFiles(fld, /\.txt$/i);
        var imgArr = getNumberedFiles(fld, /\.(jpe?g|png|tiff?|gif|bmp)$/i);
        
        log("✓ page" + p + ": " + txtArr.length + " txt, " + imgArr.length + " img");
        totalTxt += txtArr.length;
        totalImg += imgArr.length;
    }
    
    log("═══════════════════════════════════════");
    log("CƏMI: " + totalTxt + " mətn, " + totalImg + " şəkil");
    log("═══════════════════════════════════════");
    
    alert("Test tamamlandı!\n\n" + 
          totalTxt + " mətn faylı\n" + 
          totalImg + " şəkil faylı\n\n" +
          "Konsola baxın.");
};

// ═══════════════════════════════════════════════════════════════
// ƏSAS YERLƏŞDIRMƏ LOGİKASI
// ═══════════════════════════════════════════════════════════════

btnRun.onClick = function() {
    debugLog = [];
    totalPlaced = 0;
    totalErrors = 0;
    
    try {
        log("═══════════════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI — " + new Date().toString());
        log("═══════════════════════════════════════");

        // ÜSLUBLARI YARAT
        if (chkCreateStyles.value) {
            if (!ensureStyles(doc)) {
                if (!confirm("Üslublar yaradıla bilmədi!\n\nDavam edək?")) {
                    return;
                }
            }
        }

        var root = new Folder(etFolder.text);
        if (!root || !root.exists) {
            alert("❌ Ana qovluq seçin");
            return;
        }

        var cols = parseInt(ddlColumns.selection.text) || 2;
        var padding = parseFloat(ddlPadding.selection.text) || 5;
        var titleSize = parseInt(ddlTitleSize.selection.text) || CONFIG.defaults.titleSize;
        var bodySize = parseInt(ddlBodySize.selection.text) || CONFIG.defaults.bodySize;
        
        var titleAlign = [
            Justification.LEFT_ALIGN, 
            Justification.CENTER_ALIGN, 
            Justification.RIGHT_ALIGN
        ][ddlTitleAlign.selection.index];
        
        var bodyAlign = [
            Justification.LEFT_ALIGN, 
            Justification.FULLY_JUSTIFIED, 
            Justification.CENTER_ALIGN
        ][ddlBodyAlign.selection.index];
        
        var fitOption = ddlFit.selection.index === 0 ? 
            FitOptions.FILL_PROPORTIONALLY : 
            FitOptions.CONTENT_TO_FRAME;
        
        var imgRatio = Math.round(sliderImg.value) / 100;
        var shouldClear = chkClear.value;
        var shouldLayers = chkLayers.value;
        var useHyphenation = chkHyphenation.value;

        log("Konfiguratsiya:");
        log("  Sütun: " + cols + " | Padding: " + padding);
        log("  Başlıq: " + titleSize + "pt | Mətn: " + bodySize + "pt");
        log("  Şəkil nisbəti: " + Math.round(imgRatio * 100) + "%");
        log("  Üslublar: " + (chkCreateStyles.value ? "AKTİV" : "DEAKTİV"));
        log("  Hecanlaşdırma: " + (useHyphenation ? "AÇIQ" : "QAPALI"));

        var processedPages = 0;

        // SƏHIFƏ DÖNGÜSÜ
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            if (!chkPages[pageIndex - 1].value) continue;
            
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(root + "/page" + pageNum);
            
            log("\n╔════════════════════════════════════╗");
            log("║ SƏHİFƏ " + pageNum);
            log("╚════════════════════════════════════╝");
            
            if (!pageFolder.exists) {
                log("❌ Qovluq yoxdur: " + pageFolder.fsName);
                continue;
            }

            var page = doc.pages[pageIndex];
            if (!page || !page.isValid) {
                log("❌ Səhifə keçərli deyil (index: " + pageIndex + ")");
                continue;
            }

            // SƏHIFƏ TEMİZLƏMƏSİ
            if (shouldClear) {
                log("🧹 Səhifə təmizlənir...");
                clearPageContent(page);
                $.sleep(200);
            }

            // LAYER YARATMAQ
            if (shouldLayers) {
                try {
                    var lname = "Səh. " + pageNum;
                    var layer = doc.layers.itemByName(lname);
                    if (!layer || !layer.isValid) {
                        layer = doc.layers.add({name: lname});
                    }
                    doc.activeLayer = layer;
                    log("✓ Layer: " + lname);
                } catch(e) {
                    log("⚠️ Layer xətası: " + e.message);
                }
            }

            // MƏTN FAYLLARININ TAPİLMASI
            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            if (!txtFiles || txtFiles.length === 0) {
                log("❌ Heç bir .txt fayl yoxdur");
                continue;
            }

            log("📄 Mətn faylları: " + txtFiles.length);

            // SƏHIFƏ ÖLÇÜLƏRİ
            var bounds = page.bounds;
            var margin = page.marginPreferences;
            
            if (!margin) {
                margin = {top: 12.7, left: 12.7, bottom: 12.7, right: 12.7};
            }

            var usableW = (bounds[3] - bounds[1]) - margin.left - margin.right;
            var usableH = (bounds[2] - bounds[0]) - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            log("Səhifə: " + usableW.toFixed(1) + " × " + usableH.toFixed(1));

            // GRID HESABLAMASI
            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            log("Grid: " + cols + " sütun × " + rows + " sətir");
            log("Hüceyrə: " + cellW.toFixed(1) + " × " + cellH.toFixed(1));

            txtProgress.text = "Səhifə " + pageNum + ": " + txtFiles.length + " element işlənir...";
            win.update();

            // MƏZMUN DÖNGÜSÜ
            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + (col * cellW);
                var y = startY + (row * cellH);

                log("\n  ➤ " + (i + 1) + "/" + txtFiles.length + ": " + txtFiles[i].name);
                log("    Grid: [" + row + "," + col + "] @ (" + x.toFixed(1) + "," + y.toFixed(1) + ")");

                // MƏTN OXUMA
                var content = readTextFile(txtFiles[i]);
                if (!content || content.length === 0) {
                    log("    ⚠️ Mətn boşdur");
                    continue;
                }

                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed) cleanLines.push(trimmed);
                }

                if (cleanLines.length === 0) {
                    log("    ⚠️ Təmiz sətirlər yoxdur");
                    continue;
                }

                var title = cleanLines[0] || "";
                var bodyLines = cleanLines.slice(1);
                var body = bodyLines.join("\r");

                log("    📌 Başlıq: " + title.substring(0, 50));
                log("    📝 Mətn: " + body.length + " simvol");

                // ŞƏKİLLƏR
                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);

                log("    🖼️ Şəkillər: " + imgFiles.length);

                var currentY = y;

                // ŞƏKIL YERLƏŞDIRMƏ
                if (imgFiles && imgFiles.length > 0) {
                    var imgH = cellH * imgRatio;
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgW = (cellW - padding * 2) / imgCols;

                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        var imgX = x + padding + (imgCol * imgW);
                        var imgY = currentY + padding + (imgRow * (imgH / 2));

                        try {
                            var rect = page.rectangles.add();
                            var imgFrameH = (imgH / 2) - padding;
                            var imgFrameW = imgW - padding;

                            rect.geometricBounds = [
                                imgY, 
                                imgX, 
                                imgY + imgFrameH, 
                                imgX + imgFrameW
                            ];

                            rect.place(imgFiles[j]);
                            try { rect.fit(fitOption); } catch(e){}

                            if (chkImgBorder.value) {
                                try {
                                    rect.strokeWeight = parseFloat(ddlBW.selection.text);
                                    var blackSwatch = doc.swatches.itemByName("Black");
                                    if (blackSwatch) rect.strokeColor = blackSwatch;
                                } catch(e){}
                            } else {
                                rect.strokeWeight = 0;
                            }

                            log("      ✓ Şəkil: " + imgFiles[j].name);
                            totalPlaced++;
                        } catch(e) {
                            log("      ✗ Şəkil xətası: " + e.message);
                            totalErrors++;
                        }
                    }
                    currentY += (imgH + padding);
                }

                // BAŞLIQ YERLƏŞDIRMƏ (STYLES İLƏ)
                if (title && title.length > 0) {
                    try {
                        var titleH = titleSize + 8;
                        var tFrame = page.textFrames.add();

                        tFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            currentY + titleH, 
                            x + cellW - padding
                        ];
                        
                        tFrame.contents = title;

                        // ÜSLUB TƏTBIQ ET
                        if (chkCreateStyles.value) {
                            var applied = applyParagraphStyle(tFrame, CONFIG.styles.title);
                            if (applied) {
                                // Üslub tətbiq edildi, əlavə parametrlər yenilə
                                try {
                                    var style = doc.paragraphStyles.itemByName(CONFIG.styles.title);
                                    style.pointSize = titleSize;
                                    style.justification = titleAlign;
                                } catch(e) {}
                            }
                        } else {
                            // Manual formatlama (köhnə metod)
                            try {
                                var boldFont = findArialFont("Bold");
                                tFrame.parentStory.characters.everyItem().appliedFont = boldFont;
                                tFrame.parentStory.characters.everyItem().pointSize = titleSize;
                                tFrame.parentStory.paragraphs.everyItem().justification = titleAlign;
                            } catch(e) {
                                log("      ⚠️ Başlıq format xətası: " + e.message);
                            }
                        }

                        currentY += (titleH + padding);
                        log("    ✓ Başlıq yerləşdi");
                        totalPlaced++;
                    } catch(e) {
                        log("    ✗ Başlıq xətası: " + e.message);
                        totalErrors++;
                    }
                }

                // MƏTN YERLƏŞDIRMƏ (STYLES İLƏ)
                if (body && body.length > 0) {
                    try {
                        var bottom = y + cellH - padding;
                        var availHeight = bottom - currentY;

                        if (availHeight > 10) {
                            var bFrame = page.textFrames.add();

                            bFrame.geometricBounds = [
                                currentY, 
                                x + padding, 
                                bottom, 
                                x + cellW - padding
                            ];
                            
                            bFrame.contents = body;

                            // ÜSLUB TƏTBIQ ET
                            if (chkCreateStyles.value) {
                                var applied = applyParagraphStyle(bFrame, CONFIG.styles.body);
                                if (applied) {
                                    // Üslub tətbiq edildi, əlavə parametrlər yenilə
                                    try {
                                        var style = doc.paragraphStyles.itemByName(CONFIG.styles.body);
                                        style.pointSize = bodySize;
                                        style.justification = bodyAlign;
                                        style.hyphenation = useHyphenation;
                                    } catch(e) {}
                                }
                            } else {
                                // Manual formatlama
                                try {
                                    var regularFont = findArialFont("Regular");
                                    bFrame.parentStory.characters.everyItem().appliedFont = regularFont;
                                    bFrame.parentStory.characters.everyItem().pointSize = bodySize;
                                    bFrame.parentStory.paragraphs.everyItem().justification = bodyAlign;
                                } catch(e) {}
                            }

                            log("    ✓ Mətn yerləşdi");
                            totalPlaced++;
                        } else {
                            log("    ⚠️ Mətn üçün sahə yoxdur");
                        }
                    } catch(e) {
                        log("    ✗ Mətn xətası: " + e.message);
                        totalErrors++;
                    }
                }
            } // txtFiles loop

            processedPages++;
        } // pages loop

        log("\n═══════════════════════════════════════");
        log("✅ YERLƏŞDİRMƏ TAMAMLANDI");
        log("═══════════════════════════════════════");
        log("İşlənmiş səhifə: " + processedPages);
        log("Yerləşdirilən element: " + totalPlaced);
        log("Xətalar: " + totalErrors);
        log("═══════════════════════════════════════");

        txtProgress.text = "✅ " + totalPlaced + " element | " + totalErrors + " xəta";

        var resultMsg = "✅ TAMAMLANDI!\n\n" +
              "Səhifə: " + processedPages + "\n" +
              "Element: " + totalPlaced + "\n" +
              "Xəta: " + totalErrors;
        
        if (chkCreateStyles.value) {
            resultMsg += "\n\n📚 Üslublar yaradıldı:\n" +
                        "• " + CONFIG.styles.title + "\n" +
                        "• " + CONFIG.styles.body + "\n" +
                        "• " + CONFIG.styles.caption;
        }
        
        resultMsg += "\n\nDetallar üçün konsola baxın.";
        
        alert(resultMsg);

    } catch (e) {
        log("❌ CİDDİ XƏTA");
        log("Mesaj: " + e.message);
        log("Sətir: " + (e.line || "bilinmir"));

        alert("❌ XƏTA!\n\n" + e.message + "\n\nKonsola baxın.");
        txtProgress.text = "❌ Xəta!";
    }
};

// ═══════════════════════════════════════════════════════════════
// SHOW WINDOW
// ═══════════════════════════════════════════════════════════════

win.center();
win.show();
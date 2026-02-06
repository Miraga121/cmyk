#targetengine "session"

/*
 * ClaudeA3.jsx
 * Məqsəd: Qəzet və jurnal üçün məzmunları (mətn, şəkil) avtomatik olaraq 
 * InDesign səhifələrinə strukturlu şəkildə yerləşdirmək
 * Versiya: 3.1 (Uyğunluq Yenilənməsi)
 * Tarix: 2025
 */

// DEBUG: ensure dialogs are allowed and give quick startup feedback
try {
    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
} catch (e) {}

try {
    $.writeln("ClaudeA3: script starting...");
    try { alert("ClaudeA3: script started (debug)"); } catch(e) { /* ignore */ }
} catch (e) {}

// ============================================================================
// 1. BAŞLANĞIC SƏNƏD YOXLAMASI
// ============================================================================

if (!app.documents.length) {
    alert("❌ XƏTA: Heç bir InDesign sənədi açıq deyil!\n\nZəhmət olmasa əvvəlcə sənəd açın.");
    exit();
}

var doc = app.activeDocument;

// Qəzet/jurnal formatı üçün ən azı 8 səhifə tələb olunur (2-8 aralığı işləmək üçün)
if (doc.pages.length < 8) {
    alert("❗ XƏBƏRDARLIQ\n\nSənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə\n\nScript dayandırılır.");
    exit();
}

// ============================================================================
// 2. QLOBAL DƏYİŞƏNLƏR VƏ KONFİQURASİYA
// ============================================================================

var CONFIG = {
    lastFolder: "",
    columns: 2,
    titleFontSize: 14,
    bodyFontSize: 10,
    imageRatio: 40,
    padding: 5,
    clearExisting: true,
    autoFitImages: true,
    createLayers: false
};

var STATS = {
    totalPlaced: 0,
    totalErrors: 0,
    pageProcessed: 0
};

var LOG = [];

function log(msg) {
    LOG.push(msg);
    $.writeln(msg);
}

function clearLog() {
    LOG = [];
}

// ============================================================================
// 3. GUI İNTERFEYS
// ============================================================================

var win = new Window("dialog", "ClaudeA3 - Qəzet Məzmun Yerləşdirici v3.1");
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;
win.preferredSize = [550, 500];

// TAB PANEL
var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [530, 380];

// ═══════════════════════════════════════════════════════════════════════════
// TAB 1: ƏSAS PARAMETRLƏR
// ═══════════════════════════════════════════════════════════════════════════

var tab1 = tabPanel.add("tab", undefined, "⚙️ Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 15;
tab1.margins = 15;

// --- Qovluq Seçimi ---
var grpFolder = tab1.add("panel", undefined, "📁 Ana Qovluq");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 15;
grpFolder.spacing = 10;

grpFolder.add("statictext", undefined, "Qovluq (page2, page3, ... olan):");
var etFolder = grpFolder.add("edittext", undefined, CONFIG.lastFolder);
etFolder.preferredSize = [480, 25];
etFolder.active = true;

var btnBrowse = grpFolder.add("button", undefined, "🗂️ Qovluq Seç");
btnBrowse.preferredSize = [150, 30];

// --- Layout Parametrləri ---
var grpLayout = tab1.add("panel", undefined, "📐 Layout");
grpLayout.orientation = "column";
grpLayout.alignChildren = ["fill", "top"];
grpLayout.margins = 15;
grpLayout.spacing = 10;

var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Sütun sayı:");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = CONFIG.columns - 1;
ddlColumns.preferredSize = [80, 25];

var grpImgRatio = grpLayout.add("group");
grpImgRatio.add("statictext", undefined, "Şəkil sahəsi (%):");
var sliderImgRatio = grpImgRatio.add("slider", undefined, CONFIG.imageRatio, 20, 70);
sliderImgRatio.preferredSize = [250, 25];
var txtImgRatio = grpImgRatio.add("statictext", undefined, CONFIG.imageRatio + "%");
txtImgRatio.preferredSize = [50, 25];

sliderImgRatio.onChanging = function() {
    txtImgRatio.text = Math.round(this.value) + "%";
};

var grpPadding = grpLayout.add("group");
grpPadding.add("statictext", undefined, "Aralıq (pt):");
var ddlPadding = grpPadding.add("dropdownlist", undefined, ["0", "3", "5", "8", "10"]);
ddlPadding.selection = 2; // Default 5pt
ddlPadding.preferredSize = [80, 25];

// --- Səhifə Seçimi ---
var grpPages = tab1.add("panel", undefined, "📄 Səhifə Seçimi");
grpPages.orientation = "column";
grpPages.alignChildren = ["fill", "top"];
grpPages.margins = 15;
grpPages.spacing = 10;

var grpPageChecks = grpPages.add("group");
grpPageChecks.orientation = "row";
grpPageChecks.spacing = 10;

// Yalnız Səhifə 2-8 seçimlərini yaradır (doc.pages[1] - doc.pages[7])
var chkPages = [];
for (var p = 2; p <= 8; p++) {
    var chk = grpPageChecks.add("checkbox", undefined, "Səh." + p);
    chk.value = true;
    chkPages.push(chk);
}

var grpPageButtons = grpPages.add("group");
grpPageButtons.orientation = "row";
grpPageButtons.spacing = 10;

var btnSelectAll = grpPageButtons.add("button", undefined, "✓ Hamısı");
var btnDeselectAll = grpPageButtons.add("button", undefined, "✗ Heç biri");

btnSelectAll.onClick = function() {
    for (var i = 0; i < chkPages.length; i++) chkPages[i].value = true;
};

btnDeselectAll.onClick = function() {
    for (var i = 0; i < chkPages.length; i++) chkPages[i].value = false;
};

// ═══════════════════════════════════════════════════════════════════════════
// TAB 2: QABAQCIL PARAMETRLƏR
// ═══════════════════════════════════════════════════════════════════════════

var tab2 = tabPanel.add("tab", undefined, "🎨 Qabaqcıl");
tab2.orientation = "column";
tab2.alignChildren = ["fill", "top"];
tab2.spacing = 15;
tab2.margins = 15;

// --- Tipoqrafiya ---
var grpTypo = tab2.add("panel", undefined, "✍️ Tipoqrafiya");
grpTypo.orientation = "column";
grpTypo.alignChildren = ["fill", "top"];
grpTypo.margins = 15;
grpTypo.spacing = 10;

var grpTitle = grpTypo.add("group");
grpTitle.add("statictext", undefined, "Başlıq ölçüsü:");
var ddlTitleSize = grpTitle.add("dropdownlist", undefined, ["12", "14", "16", "18", "20"]);
ddlTitleSize.selection = 1; // Default 14pt
ddlTitleSize.preferredSize = [70, 25];

var grpBody = grpTypo.add("group");
grpBody.add("statictext", undefined, "Mətn ölçüsü:");
var ddlBodySize = grpBody.add("dropdownlist", undefined, ["8", "9", "10", "11", "12"]);
ddlBodySize.selection = 2; // Default 10pt
ddlBodySize.preferredSize = [70, 25];

var chkTitleBold = grpTypo.add("checkbox", undefined, "Başlığı qalın yaz");
chkTitleBold.value = true;

var chkTitleUppercase = grpTypo.add("checkbox", undefined, "Başlığı böyük hərflərlə yaz");

// --- Şəkil Parametrləri ---
var grpImage = tab2.add("panel", undefined, "🖼️ Şəkil");
grpImage.orientation = "column";
grpImage.alignChildren = ["fill", "top"];
grpImage.margins = 15;
grpImage.spacing = 10;

var grpFit = grpImage.add("group");
grpFit.add("statictext", undefined, "Yerləşdirmə:");
var ddlFitOptions = grpFit.add("dropdownlist", undefined, [
    "Proporsional doldur", // FILL_PROPORTIONALLY
    "Çərçivəyə sığdır", // CONTENT_TO_FRAME
    "Məzmunu sığdır" // FRAME_TO_CONTENT
]);
ddlFitOptions.selection = 0;
ddlFitOptions.preferredSize = [200, 25];

var chkAutoFit = grpImage.add("checkbox", undefined, "✨ Auto-Fit Images (ağıllı sığdırma)");
chkAutoFit.value = true;

var chkImageBorder = grpImage.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et");
chkImageBorder.value = true;

// --- Əlavə Seçimlər ---
var grpExtra = tab2.add("panel", undefined, "⚡ Əlavə");
grpExtra.orientation = "column";
grpExtra.alignChildren = ["fill", "top"];
grpExtra.margins = 15;
grpExtra.spacing = 10;

var chkClearExisting = grpExtra.add("checkbox", undefined, "🗑️ Mövcud elementləri əvvəlcə təmizlə");
chkClearExisting.value = true;

var chkCreateLayers = grpExtra.add("checkbox", undefined, "📚 Hər səhifə üçün layer yarat");

var chkBackgroundColor = grpExtra.add("checkbox", undefined, "🎨 Alternativ arxa fon rəngi");

// ═══════════════════════════════════════════════════════════════════════════
// TAB 3: LOG
// ═══════════════════════════════════════════════════════════════════════════

var tab3 = tabPanel.add("tab", undefined, "📋 Log");
tab3.orientation = "column";
tab3.alignChildren = ["fill", "fill"];
tab3.margins = 15;

var txtLog = tab3.add("edittext", undefined, "", {multiline: true, scrolling: true});
txtLog.preferredSize = [500, 320];
txtLog.enabled = false;

var btnClearLog = tab3.add("button", undefined, "🗑️ Log-u Təmizlə");
btnClearLog.onClick = function() {
    clearLog();
    txtLog.text = "Log təmizləndi...";
};

// ═══════════════════════════════════════════════════════════════════════════
// ƏSAS DÜYMƏLƏR
// ═══════════════════════════════════════════════════════════════════════════

var grpButtons = win.add("group");
grpButtons.orientation = "row";
grpButtons.alignment = ["center", "bottom"];
grpButtons.spacing = 15;

var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [120, 40];

var btnRun = grpButtons.add("button", undefined, "▶️ İcra Et");
btnRun.preferredSize = [150, 40];

var btnCancel = grpButtons.add("button", undefined, "✖️ Bağla", {name: "cancel"});
btnCancel.preferredSize = [120, 40];

// Progress
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [530, 25];
txtProgress.graphics.font = "dialog:12";

// ============================================================================
// 4. ƏSAS FUNKSİYALAR
// ============================================================================

// --- Qovluq Seçimi ---
btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3, ... olan)");
    if (folder) {
        etFolder.text = folder.fsName;
        CONFIG.lastFolder = folder.fsName;
        txtProgress.text = "✓ Qovluq seçildi: " + folder.name;
        
        // Avtomatik qovluq strukturunu yoxla
        var subFolders = findPageFolders(folder);
        if (subFolders.length > 0) {
            txtProgress.text = "✓ " + subFolders.length + " səhifə qovluğu tapıldı";
        }
    }
};

// --- Avtomatik Page Qovluqlarını Tap ---
function findPageFolders(rootFolder) {
    var result = [];
    var allFiles = rootFolder.getFiles();
    
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof Folder) {
            var folderName = allFiles[i].name.toLowerCase();
            // page2, page3, ... adlarını yoxlayır
            if (/^page\d+$/.test(folderName)) {
                result.push(allFiles[i]);
            }
        }
    }
    
    return result;
}

// --- Mətn Faylını Oxu ---
function readTextFile(file) {
    if (!file.exists) return "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        var content = file.read();
        file.close();
        
        // BOM (Byte Order Mark) silmək
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        
        return content;
    } catch (e) {
        log("⚠️ Fayl oxuma xətası: " + file.name + " - " + e);
        return "";
    }
}

// --- Nömrələnmiş Faylları Tap ---
function getNumberedFiles(folder, filterRegex) {
    var allFiles = folder.getFiles();
    var filtered = [];
    
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && filterRegex.test(allFiles[i].name)) {
            filtered.push(allFiles[i]);
        }
    }
    
    // Nömrəyə görə sırala (məsələn: 1.txt, 2.txt)
    filtered.sort(function(a, b) {
        var numA = parseInt(a.name.match(/^\d+/)) || 0;
        var numB = parseInt(b.name.match(/^\d+/)) || 0;
        return numA - numB;
    });
    
    return filtered;
}

// --- Şəkil Fayllarını Tap (Məsələn: 1-1.jpg, 1-2.jpg) ---
function findImageFiles(folder, groupNum) {
    // groupNum ilə başlayan və sonra -rəqəm- olan şəkilləri tapır
    var pattern = new RegExp("^" + groupNum + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    var allFiles = folder.getFiles();
    var result = [];
    
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && pattern.test(allFiles[i].name)) {
            result.push(allFiles[i]);
        }
    }
    
    // Alt nömrəyə görə sırala (məsələn: 1-1 gəlsin 1-2-dən əvvəl)
    result.sort(function(a, b) {
        var matchA = a.name.match(/-(\d+)\./);
        var matchB = b.name.match(/-(\d+)\./);
        var numA = matchA ? parseInt(matchA[1]) : 0;
        var numB = matchB ? parseInt(matchB[1]) : 0;
        return numA - numB;
    });
    
    return result;
}

// --- Test Funksiyası ---
btnTest.onClick = function() {
    clearLog();
    log("═══════════════════════════════════════");
    log("TEST BAŞLADI - " + new Date().toString());
    log("═══════════════════════════════════════");
    
    var rootPath = etFolder.text;
    if (!rootPath || rootPath === "") {
        alert("⚠️ Zəhmət olmasa qovluq seçin!");
        return;
    }

    var rootFolder = new Folder(rootPath);
    log("📁 Ana qovluq: " + rootFolder.fsName);
    log("    Mövcuddur: " + (rootFolder.exists ? "✓" : "✗"));
    
    if (!rootFolder.exists) {
        alert("❌ Qovluq mövcud deyil!");
        txtLog.text = LOG.join("\n");
        return;
    }

    var totalTxt = 0;
    var totalImg = 0;
    
    // Yalnız 2-dən 8-ə qədər səhifə qovluqlarını yoxlayır
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        log("\n━━━ SƏHİFƏ " + pageNum + " ━━━");
        var pageFolder = new Folder(rootFolder + "/page" + pageNum);
        
        if (!pageFolder.exists) {
            log("⚠️ Qovluq tapılmadı");
            continue;
        }

        // 1.txt, 2.txt, ...
        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        // Bütün şəkilləri sayır (1-1.jpg, 2-1.jpg, 2-2.jpg, ...)
        var imgFiles = pageFolder.getFiles(/\.(jpe?g|png|tiff?|gif|bmp)$/i).filter(function(f) { return f instanceof File; });
        
        log("  📄 Mətn faylları: " + txtFiles.length);
        log("  🖼️ Şəkil faylları: " + imgFiles.length);
        
        if (txtFiles.length > 0) {
            log("  İlk 3 mətn faylı:");
            for (var t = 0; t < Math.min(txtFiles.length, 3); t++) {
                log("    • " + txtFiles[t].name);
            }
            if (txtFiles.length > 3) {
                log("    ... və " + (txtFiles.length - 3) + " daha çox");
            }
        }
        
        totalTxt += txtFiles.length;
        totalImg += imgFiles.length;
    }

    log("\n═══════════════════════════════════════");
    log("CƏMİ: " + totalTxt + " mətn, " + totalImg + " şəkil");
    log("═══════════════════════════════════════");
    
    txtLog.text = LOG.join("\n");
    txtProgress.text = "✓ Test tamamlandı: " + totalTxt + " mətn, " + totalImg + " şəkil";
    
    alert("✅ TEST TAMAMLANDI\n\n" + 
          "📄 Mətn faylları: " + totalTxt + "\n" +
          "🖼️ Şəkil faylları: " + totalImg + "\n\n" +
          "Log tabına baxın.");
};

// ═══════════════════════════════════════════════════════════════════════════
// İCRA FUNKSİYASI
// ═══════════════════════════════════════════════════════════════════════════

btnRun.onClick = function() {
    clearLog();
    STATS.totalPlaced = 0;
    STATS.totalErrors = 0;
    STATS.pageProcessed = 0;
    
    app.scriptPreferences.userInteractionLevel = UserInteractionLevels.NEVER_INTERACT; // Hata zamanı dialoq pəncərələrini gizlət

    try {
        log("═══════════════════════════════════════");
        log("İCRA BAŞLADI - " + new Date().toString());
        log("═══════════════════════════════════════");
        
        var rootPath = etFolder.text;
        if (!rootPath || rootPath === "") {
            alert("⚠️ Zəhmət olmasa qovluq seçin!");
            app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
            return;
        }

        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) {
            alert("❌ Seçilmiş qovluq mövcud deyil!");
            app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
            return;
        }

        // Parametrləri oxu
        var cols = parseInt(ddlColumns.selection.text) || 2;
        var imgRatio = Math.round(sliderImgRatio.value) / 100;
        var padding = parseInt(ddlPadding.selection.text) || 5;
        var titleSize = parseInt(ddlTitleSize.selection.text) || 14;
        var bodySize = parseInt(ddlBodySize.selection.text) || 10;
        
        log("\n⚙️ PARAMETRLƏR:");
        log("  Sütun: " + cols);
        log("  Şəkil sahəsi: " + Math.round(imgRatio * 100) + "%");
        log("  Aralıq: " + padding + "pt");
        log("  Başlıq: " + titleSize + "pt");
        log("  Mətn: " + bodySize + "pt");

        // FitOptions enum təyin et
        var fitOption;
        var fitIndex = ddlFitOptions.selection ? ddlFitOptions.selection.index : 0;
        if (fitIndex === 0) {
            fitOption = FitOptions.FILL_PROPORTIONALLY;
        } else if (fitIndex === 1) {
            fitOption = FitOptions.CONTENT_TO_FRAME;
        } else {
            fitOption = FitOptions.FRAME_TO_CONTENT;
        }

        // Seçilmiş səhifələri işlə (InDesign index-i 0-dan başlayır, amma biz 2-ci səhifədən başlayırıq (index 1))
        // chkPages[0] -> Səh. 2 (doc.pages[1])
        // chkPages[6] -> Səh. 8 (doc.pages[7])
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            // Əgər GUI-də seçili deyilsə, keç
            if (!chkPages[pageIndex - 1].value) continue;
            
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            
            log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            log("📄 SƏHİFƏ " + pageNum + " İŞLƏNİR (Index: " + pageIndex + ")");
            log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
            
            if (!pageFolder.exists) {
                log("⚠️ Qovluq tapılmadı: " + pageFolder.fsName);
                continue;
            }

            var page = doc.pages[pageIndex];

            // Layer yarat və aktiv et
            var activeLayer;
            if (chkCreateLayers.value) {
                try {
                    var layerName = "Səhifə " + pageNum + " Məzmun";
                    var layer = doc.layers.item(layerName);
                    if (!layer.isValid) {
                        layer = doc.layers.add({name: layerName});
                        log("📚 Layer yaradıldı: " + layerName);
                    }
                    activeLayer = layer;
                    // doc.activeLayer = layer; // Bu səhifə elementlərini avtomatik yerləşdirir
                } catch(e) {
                    log("⚠️ Layer xətası: " + e);
                }
            }

            // Mövcud elementləri təmizlə
            if (chkClearExisting.value) {
                var items = page.allPageItems;
                var removed = 0;
                for (var it = items.length - 1; it >= 0; it--) {
                    // Yalnız Master səhifədən gəlməyən elementləri sil
                    if (!items[it].isMasterPageItem) {
                         try { 
                            items[it].remove(); 
                            removed++;
                        } catch(e) {}
                    }
                }
                log("🗑️ " + removed + " element silindi (Master səhifə elementləri saxlanıldı)");
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            log("📝 " + txtFiles.length + " mətn faylı tapıldı");
            
            if (txtFiles.length === 0) {
                log("⚠️ Mətn faylı yoxdur, keçilir...");
                continue;
            }

            // Səhifə ölçüləri və Marginlər
            var bounds = page.bounds; // [y1, x1, y2, x2]
            var margin = page.marginPreferences;
            
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            txtProgress.text = "⏳ Səhifə " + pageNum + " işlənir (" + txtFiles.length + " element)...";
            win.update();

            // Hər element üçün
            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                log("\n  ➤ ELEMENT " + (i + 1) + ": " + txtFiles[i].name);
                
                var content = readTextFile(txtFiles[i]);
                if (!content || content === "") {
                    log("    ✗ Mətn oxuna bilmədi və ya boşdur");
                    STATS.totalErrors++;
                    continue;
                }

                // Mətn sətirləri (Başlıq + Mətn)
                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed !== "") {
                        cleanLines.push(lines[ln]);
                    }
                }
                
                if (cleanLines.length === 0) {
                    log("    ✗ Boş fayl");
                    STATS.totalErrors++;
                    continue;
                }
                
                var title = cleanLines[0] || "";
                var bodyLines = [];
                for (var b = 1; b < cleanLines.length; b++) {
                    bodyLines.push(cleanLines[b]);
                }
                var body = bodyLines.join("\r"); // InDesign-da yeni paraqraf üçün \r istifadə olunur

                if (chkTitleUppercase.value) {
                    title = title.toUpperCase();
                }

                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);

                var currentY = y;

                // Alternativ arxa fon
                if (chkBackgroundColor.value && i % 2 === 1) {
                    try {
                        var bgRect = page.rectangles.add();
                        bgRect.geometricBounds = [y, x, y + cellH, x + cellW];
                        bgRect.fillColor = doc.swatches.item("Paper");
                        bgRect.fillTint = 5;
                        bgRect.strokeWeight = 0;
                        bgRect.sendToBack();
                        if (activeLayer) bgRect.itemLayer = activeLayer;
                    } catch(e) { log("    ⚠️ Fon rəngi xətası: " + e); }
                }

                // ŞƏKİLLƏR
                if (imgFiles.length > 0) {
                    log("    🖼️ " + imgFiles.length + " şəkil tapıldı");
                    
                    var imgAreaW = cellW - padding * 2;
                    var imgAreaH = cellH * imgRatio;
                    
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgRows = Math.ceil(Math.min(imgFiles.length, 4) / imgCols); // Max 4 şəkil yerləşdirilir
                    
                    var singleImgW = (imgAreaW - (imgCols > 1 ? padding * (imgCols - 1) : 0)) / imgCols;
                    var singleImgH = (imgAreaH - (imgRows > 1 ? padding * (imgRows - 1) : 0)) / imgRows;
                    
                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        
                        var imgX1 = x + padding + (imgCol * (singleImgW + padding));
                        var imgY1 = currentY + padding + (imgRow * (singleImgH + padding));
                        
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [
                                imgY1, 
                                imgX1, 
                                imgY1 + singleImgH, 
                                imgX1 + singleImgW
                            ];
                            
                            if (activeLayer) rect.itemLayer = activeLayer;
                            
                            rect.place(imgFiles[j]);
                            
                            // Məzmunu sığdırma və mərkəzləşdirmə
                            if (chkAutoFit.value) {
                                // Yeni və daha etibarlı Auto-Fit / Mərkəzləşdirmə
                                rect.frameFittingOptions.autoFit = true;
                                rect.frameFittingOptions.fittingOption = FrameFittingOption.FILL_PROPORTIONALLY;
                                rect.frameFittingOptions.centerContent = true; 
                                log("      ✓ " + imgFiles[j].name + " (Auto-Fit)");
                            } else {
                                // İstifadəçinin seçiminə əsasən əl ilə sığdırma
                                rect.fit(fitOption);
                                log("      ✓ " + imgFiles[j].name + " (Əl ilə Fit)");
                            }
                            
                            // Şəkil Sərhədi
                            if (chkImageBorder.value) {
                                rect.strokeWeight = 1;
                                try {
                                    rect.strokeColor = doc.colors.item("Black");
                                } catch(ce) {
                                    // Bəzi InDesign versiyalarında "Black" rəngi swatches-də tapılmaya bilər, buna görə swatch-a bax
                                    rect.strokeColor = doc.swatches.item("Black");
                                }
                            } else {
                                rect.strokeWeight = 0;
                            }
                            
                            STATS.totalPlaced++;
                        } catch (e) {
                            log("      ✗ Şəkil yerləşdirmə xətası: " + e.toString());
                            STATS.totalErrors++;
                        }
                    }
                    currentY += imgAreaH + padding;
                }

                // BAŞLIQ
                var titleTrimmed = title.replace(/^\s+|\s+$/g, '');
                if (titleTrimmed !== "") {
                    try {
                        var titleFrame = page.textFrames.add();
                        if (activeLayer) titleFrame.itemLayer = activeLayer;
                        
                        var titleHeight = titleSize * 1.5; // Təxmini başlığın hündürlüyü
                        
                        titleFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            currentY + titleHeight, 
                            x + cellW - padding
                        ];
                        titleFrame.contents = title;
                        
                        titleFrame.parentStory.characters.everyItem().pointSize = titleSize;
                        
                        // Başlığı qalın yaz (Fontun Bold stilinin adı fərqli ola bilər!)
                        if (chkTitleBold.value) {
                            try {
                                titleFrame.parentStory.characters.everyItem().fontStyle = "Bold";
                            } catch(fe) {
                                log("    ⚠️ Başlıq qalın (Bold) font stili tapılmadı.");
                            }
                        }
                        
                        titleFrame.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
                        
                        currentY += titleFrame.parentStory.paragraphs[0].lines.length * titleSize * 1.5; // Hündürlüyü dinamik hesabla
                        currentY += padding;
                        log("    ✓ Başlıq yerləşdirildi: " + title);
                        STATS.totalPlaced++;
                    } catch (e) {
                        log("    ✗ Başlıq xətası: " + e);
                        STATS.totalErrors++;
                    }
                }

                // MƏTN
                var bodyTrimmed = body.replace(/^\s+|\s+$/g, '');
                if (bodyTrimmed !== "") {
                    try {
                        var textFrame = page.textFrames.add();
                        if (activeLayer) textFrame.itemLayer = activeLayer;
                        
                        textFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            y + cellH - padding, // Hücrənin alt xəttinə qədər
                            x + cellW - padding
                        ];
                        textFrame.contents = body;
                        
                        textFrame.parentStory.characters.everyItem().pointSize = bodySize;
                        textFrame.parentStory.paragraphs.everyItem().justification = Justification.FULLY_JUSTIFIED;
                        
                        // Mətnin daşmasını yoxla
                        if (textFrame.overflows) {
                            log("    ❗ Mətn daşdı! (Text Frame Overflow)");
                            STATS.totalErrors++;
                        }

                        log("    ✓ Mətn yerləşdirildi");
                        STATS.totalPlaced++;
                    } catch (e) {
                        log("    ✗ Mətn xətası: " + e);
                        STATS.totalErrors++;
                    }
                }
            }
            
            STATS.pageProcessed++;
        }

        log("\n═══════════════════════════════════════");
        log("✅ TAMAMLANDI");
        log("═══════════════════════════════════════");
        log("📊 STATİSTİKA:");
        log("  • Səhifə işlənib: " + STATS.pageProcessed);
        log("  • Element yerləşdirilib: " + STATS.totalPlaced);
        log("  • Xəta sayı: " + STATS.totalErrors);
        log("═══════════════════════════════════════");
        
        txtLog.text = LOG.join("\n");
        txtProgress.text = "✅ Tamamlandı: " + STATS.totalPlaced + " element, " + STATS.totalErrors + " xəta";
        
        alert("✅ İCRA TAMAMLANDI!\n\n" + 
              "📄 Səhifə: " + STATS.pageProcessed + "\n" +
              "✓ Element: " + STATS.totalPlaced + "\n" +
              "✗ Xəta: " + STATS.totalErrors + "\n\n" +
              "Log tabına baxın.");
        
        win.close();
        
    } catch (e) {
        log("\n❌ KRİTİK XƏTA: " + e.toString());
        log("    Sətir: " + e.line);
        txtLog.text = LOG.join("\n");
        alert("❌ KRİTİK XƏTA BAŞ VERDİ!\n\n" + e.toString() + "\n\nSətir: " + e.line + "\n\nLog tabına baxın.");
        txtProgress.text = "❌ Xəta baş verdi!";
    } finally {
        app.scriptPreferences.userInteractionLevel = UserInteractionLevels.INTERACT_WITH_ALL;
    }
};

// ============================================================================
// 6. PƏNCƏRƏ GÖSTƏR
// ============================================================================

win.center();
win.show();

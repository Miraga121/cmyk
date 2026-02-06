#targetengine "session"

// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v2.2 - XƏTA DÜZƏLİŞİ (ExtendScript Uyğunluğu)
// ═══════════════════════════════════════════════════════════

// Sənəd yoxlaması
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;

// Global dəyişənlər
var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;

// Texniki optimallaşdırma: Points ilə işləmə
var originalUnit = app.scriptPreferences.measurementUnit;
var UNIT = MeasurementUnits.POINTS; 

function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// Konfiqurasiya saxlama (Original koddan götürülüb)
var savedConfig = {
    lastFolder: "",
    columns: 2,
    titleFontSize: 14,
    bodyFontSize: 10,
    imageRatio: 40,
    padding: 5
};

// ═══════════════════════════════════════════════════════════
//  GUI YARATMA (Hissə 1)
// ═══════════════════════════════════════════════════════════

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.2", undefined, {resizeable: true});
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

// TAB PANEL
var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [500, 400];

// TAB 1: ƏSAS PARAMETRLƏR
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 15;

// Qovluq seçimi
var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 15;
grpFolder.spacing = 10;

grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olan):");
var etFolder = grpFolder.add("edittext", undefined, savedConfig.lastFolder);
etFolder.preferredSize = [450, 30];
etFolder.active = true;

var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 35;

// Grid və Layout
var grpLayout = tab1.add("panel", undefined, "Layout Parametrləri");
grpLayout.orientation = "column";
grpLayout.alignChildren = ["fill", "top"];
grpLayout.margins = 15;
grpLayout.spacing = 10;

var grpCols = grpLayout.add("group");
grpCols.orientation = "row";
grpCols.add("statictext", undefined, "Grid Sütun Sayı:");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = savedConfig.columns - 1;
ddlColumns.preferredSize = [80, 25];

var grpImgRatio = grpLayout.add("group");
grpImgRatio.orientation = "row";
grpImgRatio.add("statictext", undefined, "Şəkil sahəsi (%):");
var sliderImgRatio = grpImgRatio.add("slider", undefined, savedConfig.imageRatio, 20, 60);
sliderImgRatio.preferredSize = [200, 25];
var txtImgRatio = grpImgRatio.add("statictext", undefined, savedConfig.imageRatio + "%");
txtImgRatio.preferredSize = [50, 25];

sliderImgRatio.onChanging = function() {
    txtImgRatio.text = Math.round(this.value) + "%";
};

var grpPadding = grpLayout.add("group");
grpPadding.orientation = "row";
grpPadding.add("statictext", undefined, "Çərçivə aralığı (pt):");
var ddlPadding = grpPadding.add("dropdownlist", undefined, ["0", "3", "5", "8", "10"]);
ddlPadding.selection = 2;
ddlPadding.preferredSize = [80, 25];

// Səhifə seçimi
var grpPages = tab1.add("panel", undefined, "Səhifə Seçimi");
grpPages.orientation = "column";
grpPages.alignChildren = ["fill", "top"];
grpPages.margins = 15;
grpPages.spacing = 10;

var chkPages = [];
var grpPageChecks = grpPages.add("group");
grpPageChecks.orientation = "row";
grpPageChecks.spacing = 15;
for (var p = 2; p <= 8; p++) {
    var chk = grpPageChecks.add("checkbox", undefined, "Səh. " + p);
    chk.value = true;
    chkPages.push(chk);
}

var grpPageButtons = grpPages.add("group");
grpPageButtons.orientation = "row";
var btnSelectAll = grpPageButtons.add("button", undefined, "Hamısını seç");
var btnDeselectAll = grpPageButtons.add("button", undefined, "Heç birini seçmə");

btnSelectAll.onClick = function() {
    for (var i = 0; i < chkPages.length; i++) chkPages[i].value = true;
};
btnDeselectAll.onClick = function() {
    for (var i = 0; i < chkPages.length; i++) chkPages[i].value = false;
};

// TAB 2: TİPOQRAFİYA
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column";
tab2.alignChildren = ["fill", "top"];
tab2.spacing = 15;

// Başlıq parametrləri
var grpTitle = tab2.add("panel", undefined, "Başlıq");
grpTitle.orientation = "column";
grpTitle.alignChildren = ["fill", "top"];
grpTitle.margins = 15;
grpTitle.spacing = 10;

var grpTitleFont = grpTitle.add("group");
grpTitleFont.add("statictext", undefined, "Font ölçüsü:");
var ddlTitleSize = grpTitleFont.add("dropdownlist", undefined, ["12", "14", "16", "18", "20", "24"]);
ddlTitleSize.selection = 2;
ddlTitleSize.preferredSize = [80, 25];

var grpTitleAlign = grpTitle.add("group");
grpTitleAlign.add("statictext", undefined, "Hizalama:");
var ddlTitleAlign = grpTitleAlign.add("dropdownlist", undefined, ["Sol", "Mərkəz", "Sağ"]);
ddlTitleAlign.selection = 0;
ddlTitleAlign.preferredSize = [120, 25];

var chkTitleUppercase = grpTitle.add("checkbox", undefined, "Böyük hərflərlə");
var chkTitleBold = grpTitle.add("checkbox", undefined, "Qalın (Bold)");
chkTitleBold.value = true;

// Mətn parametrləri
var grpBody = tab2.add("panel", undefined, "Mətn");
grpBody.orientation = "column";
grpBody.alignChildren = ["fill", "top"];
grpBody.margins = 15;
grpBody.spacing = 10;

var grpBodyFont = grpBody.add("group");
grpBodyFont.add("statictext", undefined, "Font ölçüsü:");
var ddlBodySize = grpBodyFont.add("dropdownlist", undefined, ["8", "9", "10", "11", "12", "14"]);
ddlBodySize.selection = 2;
ddlBodySize.preferredSize = [80, 25];

var grpBodyAlign = grpBody.add("group");
grpBodyAlign.add("statictext", undefined, "Hizalama:");
var ddlBodyAlign = grpBody.add("dropdownlist", undefined, ["Sol", "İki tərəfə", "Mərkəz"]);
ddlBodyAlign.selection = 1;
ddlBodyAlign.preferredSize = [120, 25];

var grpLeading = grpBody.add("group");
grpLeading.add("statictext", undefined, "Sətir aralığı:");
var ddlLeading = grpLeading.add("dropdownlist", undefined, ["Auto", "110%", "120%", "130%", "140%", "150%"]);
ddlLeading.selection = 0;
ddlLeading.preferredSize = [120, 25];

// TAB 3: ŞƏKİL AYARLARI
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column";
tab3.alignChildren = ["fill", "top"];
tab3.spacing = 15;

var grpImageSettings = tab3.add("panel", undefined, "Şəkil Parametrləri");
grpImageSettings.orientation = "column";
grpImageSettings.alignChildren = ["fill", "top"];
grpImageSettings.margins = 15;
grpImageSettings.spacing = 10;

var grpFitOptions = grpImageSettings.add("group");
grpFitOptions.add("statictext", undefined, "Yerləşdirmə:");
var ddlFitOptions = grpFitOptions.add("dropdownlist", undefined, ["Proporsional doldur", "Çərçivəyə sığdır", "Məzmunu sığdır"]);
ddlFitOptions.selection = 0;
ddlFitOptions.preferredSize = [200, 25];

var chkImageBorder = grpImageSettings.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et");
chkImageBorder.value = true;

var grpBorderWidth = grpImageSettings.add("group");
grpBorderWidth.add("statictext", undefined, "Sərhəd qalınlığı (pt):");
var ddlBorderWidth = grpBorderWidth.add("dropdownlist", undefined, ["0.5", "1", "2", "3"]);
ddlBorderWidth.selection = 1;
ddlBorderWidth.preferredSize = [80, 25];

var chkImageCaption = grpImageSettings.add("checkbox", undefined, "Şəkil altına fayl adı əlavə et");

// TAB 4: ƏLAVƏ SEÇIMLƏR
var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column";
tab4.alignChildren = ["fill", "top"];
tab4.spacing = 15;

var grpExtra = tab4.add("panel", undefined, "Əlavə Seçimlər");
grpExtra.orientation = "column";
grpExtra.alignChildren = ["fill", "top"];
grpExtra.margins = 15;
grpExtra.spacing = 10;

var chkClearExisting = grpExtra.add("checkbox", undefined, "Mövcud çərçivələri sil");
var chkCreateLayers = grpExtra.add("checkbox", undefined, "Hər səhifə üçün layer yarat");
var chkBackgroundColor = grpExtra.add("checkbox", undefined, "Alternativ arxa fon");

grpExtra.add("statictext", undefined, "─────────────────────────────");

var grpExport = grpExtra.add("group");
grpExport.add("statictext", undefined, "Bitdikdən sonra:");
var ddlExport = grpExport.add("dropdownlist", undefined, ["Heç nə", "PDF Export", "JPEG Export"]);
ddlExport.selection = 0;
ddlExport.preferredSize = [150, 25];

// ƏSAS DÜYMƏLƏR
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

// Progress
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [480, 25];
txtProgress.graphics.font = "dialog:12";

// ═══════════════════════════════════════════════════════════
//  HELPER FUNKSIYALAR
// ═══════════════════════════════════════════════════════════

function readTextFile(file) {
    if (!file.exists) return "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        var content = file.read();
        file.close();
        if (content.charCodeAt(0) === 0xFEFF) { // BOM silinməsi
            content = content.slice(1);
        }
        return content;
    } catch (e) {
        log("Fayl oxuma xətası: " + e);
        return "";
    }
}

function getNumberedFiles(folder, filterRegex) {
    var allFiles = folder.getFiles();
    var filtered = [];
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && filterRegex.test(allFiles[i].name)) {
            filtered.push(allFiles[i]);
        }
    }
    filtered.sort(function(a, b) {
        var numA = parseInt(a.name.match(/^\d+/)) || 0;
        var numB = parseInt(b.name.match(/^\d+/)) || 0;
        return numA - numB;
    });
    return filtered;
}

function findImageFiles(folder, groupNum) {
    var pattern = new RegExp("^" + groupNum + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    var allFiles = folder.getFiles();
    var result = [];
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && pattern.test(allFiles[i].name)) {
            result.push(allFiles[i]);
        }
    }
    result.sort(function(a, b) {
        var matchA = a.name.match(/-(\d+)\./);
        var matchB = b.name.match(/-(\d+)\./);
        var numA = matchA ? parseInt(matchA[1]) : 0;
        var numB = matchB ? parseInt(matchB[1]) : 0;
        return numA - numB;
    });
    return result;
}

// ═══════════════════════════════════════════════════════════
//  EVENT HANDLERS (GUI DÜYMƏLƏRİ)
// ═══════════════════════════════════════════════════════════

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olan)");
    if (folder) {
        etFolder.text = folder.fsName;
        savedConfig.lastFolder = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

btnTest.onClick = function() {
    // Test hissəsi əsasən fayl sistemini yoxlayır və buraya müdaxilə etməyə ehtiyac yoxdur.
    // ... (Orijinal Test kodu olduğu kimi qalır)
    debugLog = [];
    log("═══════════════════════════════");
    log("TEST BAŞLADI");
    log("═══════════════════════════════");
    
    var rootPath = etFolder.text;
    if (!rootPath || rootPath === "") {
        alert("⚠️ Zəhmət olmasa qovluq seçin!");
        return;
    }

    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) {
        alert("❌ Qovluq mövcud deyil!");
        return;
    }

    var totalTxt = 0;
    var totalImg = 0;
    
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        log("\n--- SƏHİFƏ " + pageNum + " ---");
        var pageFolder = new Folder(rootFolder + "/page" + pageNum);
        
        if (!pageFolder.exists) {
            log("⚠️ Qovluq yoxdur");
            continue;
        }

        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        var imgFiles = getNumberedFiles(pageFolder, /\.(jpe?g|png|tiff?|gif|bmp)$/i);
        
        log("📄 .txt: " + txtFiles.length);
        log("🖼️ şəkil: " + imgFiles.length);
        
        totalTxt += txtFiles.length;
        totalImg += imgFiles.length;
    }

    log("\n═══════════════════════════════");
    log("CƏMİ: " + totalTxt + " mətn, " + totalImg + " şəkil");
    log("═══════════════════════════════");
    
    alert("✅ Test tamamlandı!\n\n" + totalTxt + " mətn fayl\n" + totalImg + " şəkil fayl\n\nKonsola baxın.");
};


// ═══════════════════════════════════════════════════════════
//  İNNOVATİV VƏ OPTİMALLAŞDIRILMIŞ BAŞLAMA FUNKSIYASI (btnRun.onClick)
// ═══════════════════════════════════════════════════════════

btnRun.onClick = function() {
    debugLog = [];
    totalPlaced = 0;
    totalErrors = 0;
    
    // Vahidin optimallaşdırılması: Skriptin POINTS ilə işləməyə başlaması
    app.scriptPreferences.measurementUnit = UNIT; 

    try {
        log("═══════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI");
        log("═══════════════════════════════");
        
        var rootPath = etFolder.text;
        if (!rootPath || rootPath === "") {
            alert("⚠️ Zəhmət olmasa qovluq seçin!");
            return;
        }

        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) {
            alert("❌ Seçilmiş qovluq mövcud deyil!");
            return;
        }

        // Parametrləri oxu
        var cols = parseInt(ddlColumns.selection.text) || 2;
        var imgRatio = Math.round(sliderImgRatio.value) / 100;
        var padding = parseInt(ddlPadding.selection.text) || 5;
        var titleSize = parseInt(ddlTitleSize.selection.text) || 14;
        var bodySize = parseInt(ddlBodySize.selection.text) || 10;

        var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
        var bodyAlign = [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];

        var fitOptionIndex = ddlFitOptions.selection.index;
        var fitOption = (fitOptionIndex === 0) ? FitOptions.FILL_PROPORTIONALLY : (fitOptionIndex === 1) ? FitOptions.CONTENT_TO_FRAME : FitOptions.FRAME_TO_CONTENT;
        
        // Seçilmiş səhifələr üzrə döngü
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            if (!chkPages[pageIndex - 1].value) continue;
            
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            
            log("\n═══ SƏHİFƏ " + pageNum + " ═══");
            
            if (!pageFolder.exists) {
                log("⚠️ Qovluq yoxdur: " + pageFolder.fsName);
                continue;
            }

            var page = doc.pages[pageIndex];

            // Mövcud çərçivələri sil
            if (chkClearExisting.value) {
                var items = page.allPageItems;
                for (var it = items.length - 1; it >= 0; it--) {
                    try { 
                        items[it].remove(); 
                    } catch(e) {
                        log("Element silmə xətası: " + e);
                    }
                }
                log("Mövcud elementlər silindi");
            }

            // Layer yarat
            if (chkCreateLayers.value) {
                try {
                    var layerName = "Səhifə " + pageNum + " Məzmunu";
                    var layer = doc.layers.item(layerName);
                    if (!layer.isValid) {
                        layer = doc.layers.add({name: layerName});
                    }
                    doc.activeLayer = layer;
                    log("Layer yaradıldı: " + layerName);
                } catch(e) {
                    log("Layer xətası: " + e);
                }
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            log("📄 Fayl sayı: " + txtFiles.length);
            
            if (txtFiles.length === 0) continue;

            var bounds = page.bounds;
            var margin = page.marginPreferences;
            
            // Margin yoxlaması
            var marginProps = ['left', 'right', 'top', 'bottom'];
            for(var m = 0; m < marginProps.length; m++) {
                if (margin[marginProps[m]] < 1) margin[marginProps[m]] = 12.7;
            }
            
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            txtProgress.text = "Səhifə " + pageNum + " (" + txtFiles.length + " element)...";
            win.update();

            // ----------------------------------------------------
            // İNNOVASİYA: Məzmun Yerləşdirmə (Story Threading)
            // ----------------------------------------------------
            
            var lastTextFrame = null;
            var frameCount = 0;

            for (var i = 0; i < txtFiles.length; i++) {
                
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                var content = readTextFile(txtFiles[i]);
                if (!content) continue;
                
                // ❌ XƏTA DÜZƏLİŞİ BURADA: filter() əvəzinə ənənəvi dövrə
                var rawLines = content.split(/\r?\n/);
                var cleanLines = [];

                for (var ln = 0; ln < rawLines.length; ln++) {
                    var line = rawLines[ln];
                    if (line.replace(/^\s+|\s+$/g, '') !== "") {
                        cleanLines.push(line);
                    }
                }
                // ❌ DÜZƏLİŞİN SONU

                if (cleanLines.length === 0) continue;
                
                var title = cleanLines[0].replace(/^\s+|\s+$/g, '') || "";
                var body = cleanLines.slice(1).join("\r");
                
                if (chkTitleUppercase.value) { title = title.toUpperCase(); }

                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);

                var currentY = y;
                var contentFrames = [];

                // Alternativ arxa fon
                if (chkBackgroundColor.value && i % 2 === 1) {
                    try {
                        var bgRect = page.rectangles.add();
                        bgRect.geometricBounds = [y, x, y + cellH, x + cellW];
                        bgRect.fillColor = doc.swatches.item("Paper");
                        bgRect.fillTint = 5;
                        bgRect.strokeWeight = 0;
                        bgRect.sendToBack();
                        contentFrames.push(bgRect);
                    } catch(e) { log("Arxa fon xətası: " + e); }
                }

                // ŞƏKİLLƏR
                var imgHeight = 0;
                if (imgFiles.length > 0) {
                    imgHeight = cellH * imgRatio;
                    
                    var imgColCount = Math.min(imgFiles.length, 2);
                    var totalPaddingW = padding * (imgColCount + 1);
                    var singleImgWidth = (cellW - totalPaddingW) / imgColCount;
                    
                    // Əgər iki sətirdirsə, hündürlüyü bölürük
                    var imgRows = (imgFiles.length > 2) ? 2 : 1;
                    var singleImgHeight = (imgHeight / imgRows) - (padding * (imgRows + 1) / imgRows); 

                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgColCount;
                        var imgRow = Math.floor(j / imgColCount);
                        var imgX = x + padding + (imgCol * (singleImgWidth + padding));
                        var imgY = currentY + padding + (imgRow * (singleImgHeight + padding));
                        
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [imgY, imgX, imgY + singleImgHeight, imgX + singleImgWidth];
                            
                            rect.place(imgFiles[j]);
                            rect.fit(fitOption);
                            rect.fit(FitOptions.CENTER_CONTENT);
                            
                            if (chkImageBorder.value) {
                                rect.strokeWeight = parseFloat(ddlBorderWidth.selection.text);
                                rect.strokeColor = doc.swatches.item("Black");
                            } else {
                                rect.strokeWeight = 0;
                            }
                            contentFrames.push(rect);
                            log("      ✓ Şəkil yerləşdirildi: " + imgFiles[j].name);
                            totalPlaced++;
                        } catch (e) {
                            log("      ✗ Şəkil xətası: " + e.toString());
                            totalErrors++;
                        }
                    }
                    currentY += imgHeight;
                }

                // BAŞLIQ
                var titleFrame = null;
                var titleHeight = 0;
                if (title.length > 0) {
                    try {
                        titleFrame = page.textFrames.add();
                        titleFrame.geometricBounds = [currentY, x + padding, y + cellH, x + cellW - padding];
                        titleFrame.contents = title;
                        
                        var titlePara = titleFrame.paragraphs.item(0);
                        titlePara.pointSize = titleSize;
                        titlePara.justification = titleAlign;
                        if (chkTitleBold.value) {
                            try { titlePara.fontStyle = "Bold"; } catch(fe) { log("      ! Bold font tapılmadı"); }
                        }
                        
                        titleFrame.fit(FitOptions.FRAME_TO_CONTENT);
                        titleHeight = titleFrame.geometricBounds[2] - titleFrame.geometricBounds[0];
                        currentY += titleHeight + padding;
                        contentFrames.push(titleFrame);
                        log("      ✓ Başlıq yerləşdirildi.");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Başlıq xətası: " + e);
                        totalErrors++;
                        currentY += titleSize * 1.5 + padding; 
                    }
                }
                
                // MƏTN
                if (body.length > 0) {
                    try {
                        var textFrame = page.textFrames.add();
                        textFrame.geometricBounds = [currentY, x + padding, y + cellH - padding, x + cellW - padding];
                        
                        textFrame.contents = body;
                        
                        var bodyPara = textFrame.parentStory.paragraphs.everyItem();
                        bodyPara.pointSize = bodySize;
                        bodyPara.justification = bodyAlign;
                        
                        if (ddlLeading.selection.index > 0) {
                            var leadingMultiplier = [1, 1.1, 1.2, 1.3, 1.4, 1.5][ddlLeading.selection.index];
                            bodyPara.leading = bodySize * leadingMultiplier;
                        }
                        
                        // STORY THREADING
                        if (lastTextFrame !== null) {
                            lastTextFrame.nextTextFrame = textFrame;
                        }
                        lastTextFrame = textFrame;
                        contentFrames.push(textFrame);
                        log("      ✓ Mətn çərçivəsi yaradıldı və bağlandı (Frame #" + (++frameCount) + ")");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Mətn xətası: " + e);
                        totalErrors++;
                    }
                }
                
                // Qruplaşdır
                if (contentFrames.length > 0) {
                     page.groups.add(contentFrames);
                }
                
                // Sütun sonu = yeni story başla
                if (col === cols - 1) {
                     lastTextFrame = null;
                }
            }
        }

        // Export (Original kod olduğu kimi qalır)
        if (ddlExport.selection.index === 1) {
            try {
                var pdfFile = new File(doc.filePath + "/export.pdf");
                doc.exportFile(ExportFormat.PDF_TYPE, pdfFile);
                log("\n✓ PDF export: " + pdfFile.fsName);
            } catch(e) { log("\n✗ PDF export xətası: " + e); }
        } else if (ddlExport.selection.index === 2) {
            try {
                var jpgFolder = new Folder(doc.filePath + "/jpg_export");
                if (!jpgFolder.exists) jpgFolder.create();
                doc.exportFile(ExportFormat.JPG, jpgFolder);
                log("\n✓ JPEG export: " + jpgFolder.fsName);
            } catch(e) { log("\n✗ JPEG export xətası: " + e); }
        }

        log("\n═══════════════════════════════");
        log("TAMAMLANDI: " + totalPlaced + " element");
        log("XƏTALAR: " + totalErrors);
        log("═══════════════════════════════");
        
        txtProgress.text = "✅ " + totalPlaced + " element yerləşdi, " + totalErrors + " xəta";
        alert("✅ Tamamlandı!\n\n" + totalPlaced + " element yerləşdirildi\n" + totalErrors + " xəta\n\nKonsola baxın.");
        win.close();
        
    } catch (e) {
        log("❌ KRİTİK XƏTA: " + e.toString());
        log("Sətir: " + e.line);
        alert("❌ KRİTİK XƏTA:\n" + e.toString() + "\n\nSətir: " + e.line + "\n\nKonsola baxın.");
        txtProgress.text = "Xəta!";
    } finally {
        // Orijinal vahidi bərpa etmə
        app.scriptPreferences.measurementUnit = originalUnit;
    }
};

// Pəncərəni göstər
win.center();
win.show();
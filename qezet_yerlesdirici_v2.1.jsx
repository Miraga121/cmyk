// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v2.2 - TAM VERSİYA
// ═══════════════════════════════════════════════════════════

// Sənəd yoxlaması
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// Global dəyişənlər
var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;

function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// Konfiqurasiya
var savedConfig = {
    lastFolder: "",
    columns: 2,
    imageRatio: 40,
    padding: 5
};

// ═══════════════════════════════════════════════════════════
//  GUI (DƏYİŞİKLİK YOXDUR, olduğu kimi saxlanılıb)
// ═══════════════════════════════════════════════════════════

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.2", undefined, {resizeable: true});
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [500, 400];

// TAB 1: Əsas
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 15;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.orientation = "column"; grpFolder.alignChildren = ["fill", "top"]; grpFolder.margins = 15; grpFolder.spacing = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olan):");
var etFolder = grpFolder.add("edittext", undefined, savedConfig.lastFolder, {multiline:false});
etFolder.preferredSize = [450, 30]; etFolder.active = true;
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 35;

var grpLayout = tab1.add("panel", undefined, "Layout Parametrləri");
grpLayout.orientation = "column"; grpLayout.alignChildren = ["fill", "top"]; grpLayout.margins = 15; grpLayout.spacing = 10;
var grpCols = grpLayout.add("group"); grpCols.orientation = "row";
grpCols.add("statictext", undefined, "Grid Sütun Sayı:");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = savedConfig.columns - 1; ddlColumns.preferredSize = [80, 25];
var grpImgRatio = grpLayout.add("group"); grpImgRatio.orientation = "row";
grpImgRatio.add("statictext", undefined, "Şəkil sahəsi (%):");
var sliderImgRatio = grpImgRatio.add("slider", undefined, savedConfig.imageRatio, 20, 60);
sliderImgRatio.preferredSize = [200, 25];
var txtImgRatio = grpImgRatio.add("statictext", undefined, savedConfig.imageRatio + "%");
txtImgRatio.preferredSize = [50, 25];
sliderImgRatio.onChanging = function() { txtImgRatio.text = Math.round(this.value) + "%"; };
var grpPadding = grpLayout.add("group"); grpPadding.orientation = "row";
grpPadding.add("statictext", undefined, "Çərçivə aralığı (pt):");
var ddlPadding = grpPadding.add("dropdownlist", undefined, ["0", "3", "5", "8", "10"]);
ddlPadding.selection = 2; ddlPadding.preferredSize = [80, 25];

var grpPages = tab1.add("panel", undefined, "Səhifə Seçimi");
grpPages.orientation = "column"; grpPages.alignChildren = ["fill", "top"]; grpPages.margins = 15; grpPages.spacing = 10;
var chkPages = []; var grpPageChecks = grpPages.add("group");
grpPageChecks.orientation = "row"; grpPageChecks.spacing = 15;
for (var p = 2; p <= 8; p++) {
    var chk = grpPageChecks.add("checkbox", undefined, "Səh. " + p);
    chk.value = true; chkPages.push(chk);
}
var grpPageButtons = grpPages.add("group"); grpPageButtons.orientation = "row";
var btnSelectAll = grpPageButtons.add("button", undefined, "Hamısını seç");
var btnDeselectAll = grpPageButtons.add("button", undefined, "Heç birini seçmə");
btnSelectAll.onClick = function() { for (var i = 0; i < chkPages.length; i++) chkPages[i].value = true; };
btnDeselectAll.onClick = function() { for (var i = 0; i < chkPages.length; i++) chkPages[i].value = false; };

// TAB 2: Tipoqrafiya
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column"; tab2.alignChildren = ["fill", "top"]; tab2.spacing = 15;
var grpTitle = tab2.add("panel", undefined, "Başlıq");
grpTitle.orientation = "column"; grpTitle.alignChildren = ["fill", "top"]; grpTitle.margins = 15; grpTitle.spacing = 10;
var grpTitleFont = grpTitle.add("group");
grpTitleFont.add("statictext", undefined, "Font ölçüsü:");
var ddlTitleSize = grpTitleFont.add("dropdownlist", undefined, ["12", "14", "16", "18", "20", "24"]);
ddlTitleSize.selection = 1; ddlTitleSize.preferredSize = [80, 25];
var grpTitleAlign = grpTitle.add("group");
grpTitleAlign.add("statictext", undefined, "Hizalama:");
var ddlTitleAlign = grpTitleAlign.add("dropdownlist", undefined, ["Sol", "Mərkəz", "Sağ"]);
ddlTitleAlign.selection = 0; ddlTitleAlign.preferredSize = [120, 25];
var chkTitleUppercase = grpTitle.add("checkbox", undefined, "Böyük hərflərlə");
var chkTitleBold = grpTitle.add("checkbox", undefined, "Qalın (Bold)");
chkTitleBold.value = true;

var grpBody = tab2.add("panel", undefined, "Mətn");
grpBody.orientation = "column"; grpBody.alignChildren = ["fill", "top"]; grpBody.margins = 15; grpBody.spacing = 10;
var grpBodyFont = grpBody.add("group");
grpBodyFont.add("statictext", undefined, "Font ölçüsü:");
var ddlBodySize = grpBodyFont.add("dropdownlist", undefined, ["8", "9", "10", "11", "12", "14"]);
ddlBodySize.selection = 2; ddlBodySize.preferredSize = [80, 25];
var grpBodyAlign = grpBody.add("group");
grpBodyAlign.add("statictext", undefined, "Hizalama:");
var ddlBodyAlign = grpBodyAlign.add("dropdownlist", undefined, ["Sol", "İki tərəfə", "Mərkəz"]);
ddlBodyAlign.selection = 1; ddlBodyAlign.preferredSize = [120, 25];
var grpLeading = grpBody.add("group");
grpLeading.add("statictext", undefined, "Sətir aralığı:");
var ddlLeading = grpLeading.add("dropdownlist", undefined, ["Auto", "110%", "120%", "130%", "140%", "150%"]);
ddlLeading.selection = 2; ddlLeading.preferredSize = [120, 25];

// TAB 3: Şəkillər
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column"; tab3.alignChildren = ["fill", "top"]; tab3.spacing = 15;
var grpImageSettings = tab3.add("panel", undefined, "Şəkil Parametrləri");
grpImageSettings.orientation = "column"; grpImageSettings.alignChildren = ["fill", "top"]; grpImageSettings.margins = 15; grpImageSettings.spacing = 10;
var grpFitOptions = grpImageSettings.add("group");
grpFitOptions.add("statictext", undefined, "Yerləşdirmə:");
var ddlFitOptions = grpFitOptions.add("dropdownlist", undefined, ["Proporsional doldur", "Məzmunu çərçivəyə sığdır", "Çərçivəni məzmuna sığdır"]);
ddlFitOptions.selection = 0; ddlFitOptions.preferredSize = [200, 25];
var chkImageBorder = grpImageSettings.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et");
chkImageBorder.value = true;
var grpBorderWidth = grpImageSettings.add("group");
grpBorderWidth.add("statictext", undefined, "Sərhəd qalınlığı (pt):");
var ddlBorderWidth = grpBorderWidth.add("dropdownlist", undefined, ["0.5", "1", "2", "3"]);
ddlBorderWidth.selection = 1; ddlBorderWidth.preferredSize = [80, 25];
var chkImageCaption = grpImageSettings.add("checkbox", undefined, "Şəkil altına fayl adı əlavə et");

// TAB 4: Əlavə
var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column"; tab4.alignChildren = ["fill", "top"]; tab4.spacing = 15;
var grpExtra = tab4.add("panel", undefined, "Əlavə Seçimlər");
grpExtra.orientation = "column"; grpExtra.alignChildren = ["fill", "top"]; grpExtra.margins = 15; grpExtra.spacing = 10;
var chkClearExisting = grpExtra.add("checkbox", undefined, "Mövcud çərçivələri sil");
chkClearExisting.value = true;
var chkCreateLayers = grpExtra.add("checkbox", undefined, "Hər səhifə üçün layer yarat");
var chkBackgroundColor = grpExtra.add("checkbox", undefined, "Alternativ arxa fon");
grpExtra.add("statictext", undefined, "─────────────────────────────");
var grpExport = grpExtra.add("group");
grpExport.add("statictext", undefined, "Bitdikdən sonra:");
var ddlExport = grpExport.add("dropdownlist", undefined, ["Heç nə", "PDF Export", "JPEG Export"]);
ddlExport.selection = 0; ddlExport.preferredSize = [150, 25];

// ƏSAS DÜYMƏLƏR
var grpButtons = win.add("group");
grpButtons.orientation = "row"; grpButtons.alignment = ["fill", "bottom"]; grpButtons.spacing = 10;
var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [120, 40];
var btnRun = grpButtons.add("button", undefined, "✅ Yerləşdir");
btnRun.preferredSize = [150, 40];
var btnCancel = grpButtons.add("button", undefined, "❌ Bağla", {name: "cancel"});
btnCancel.preferredSize = [120, 40];
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [480, 25];

// ═══════════════════════════════════════════════════════════
//  HELPER FUNKSIYALAR
// ═══════════════════════════════════════════════════════════

function readTextFile(file) {
    if (!file.exists) return "";
    var content = "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        content = file.read();
        file.close();
        if (content.charCodeAt(0) === 0xFEFF) { content = content.slice(1); }
    } catch (e) {
        log("Fayl oxuma xətası: " + file.name + " - " + e);
    }
    return content;
}

function getNumberedFiles(folder, filterRegex) {
    var allFiles = folder.getFiles();
    var filtered = [];
    for (var i = 0; i < allFiles.length; i++) {
        var currentFile = allFiles[i];
        if (currentFile instanceof File && filterRegex.test(currentFile.name)) {
            filtered.push(currentFile);
        }
    }
    filtered.sort(function(a, b) {
        var numA = parseInt(a.name, 10) || 0;
        var numB = parseInt(b.name, 10) || 0;
        return numA - numB;
    });
    return filtered;
}

function findImageFiles(folder, groupNum) {
    var pattern = new RegExp("^" + groupNum + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    return getNumberedFiles(folder, pattern);
}

// ═══════════════════════════════════════════════════════════
//  EVENT HANDLERS
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
    debugLog = [];
    log("═══════════════════════════════\nTEST BAŞLADI\n═══════════════════════════════");
    var rootPath = etFolder.text;
    if (!rootPath) { alert("⚠️ Zəhmət olmasa qovluq seçin!"); return; }
    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) { alert("❌ Qovluq mövcud deyil!"); return; }
    
    log("Ana qovluq: " + rootFolder.fsName + " (Mövcuddur: " + rootFolder.exists + ")");
    var totalTxt = 0, totalImg = 0;
    
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        log("\n--- SƏHİFƏ " + pageNum + " YOXLANILIR ---");
        var pageFolder = new Folder(rootFolder.fsName + "/page" + pageNum);
        if (!pageFolder.exists) {
            log("⚠️ Qovluq yoxdur");
            continue;
        }
        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        var imgFiles = getNumberedFiles(pageFolder, /\.(jpe?g|png|tiff?|gif|bmp)$/i);
        log("📄 .txt faylları: " + txtFiles.length);
        log("🖼️ Şəkil faylları: " + imgFiles.length);
        totalTxt += txtFiles.length;
        totalImg += imgFiles.length;
    }
    log("\n═══════════════════════════════\nCƏMİ: " + totalTxt + " mətn, " + totalImg + " şəkil tapıldı.\n═══════════════════════════════");
    alert("✅ Test tamamlandı!\n\n" + totalTxt + " mətn faylı\n" + totalImg + " şəkil faylı tapıldı.\n\nƏtraflı məlumat üçün konsola baxın.");
};

// ƏSAS İCRA FUNKSİYASI
btnRun.onClick = function() {
    
    // DÜZƏLİŞ: `main` funksiyası `app.doScript` çağırışından ƏVVƏL təyin edilməlidir.
    function main() {
        debugLog = [];
        totalPlaced = 0;
        totalErrors = 0;
        
        log("═══════════════════════════════\nYERLƏŞDİRMƏ BAŞLADI\n═══════════════════════════════");

        var rootPath = etFolder.text;
        if (!rootPath) { alert("⚠️ Zəhmət olmasa qovluq seçin!"); return; }
        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) { alert("❌ Seçilmiş qovluq mövcud deyil!"); return; }

        // Parametrləri oxu
        var cols = parseInt(ddlColumns.selection.text, 10);
        var imgRatio = Math.round(sliderImgRatio.value) / 100;
        var padding = parseInt(ddlPadding.selection.text, 10);
        var titleSize = parseInt(ddlTitleSize.selection.text, 10);
        var bodySize = parseInt(ddlBodySize.selection.text, 10);
        var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
        var bodyAlign = [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];
        var fitOption = [FitOptions.FILL_PROPORTIONALLY, FitOptions.CONTENT_TO_FRAME, FitOptions.FRAME_TO_CONTENT][ddlFitOptions.selection.index];
        
        for (var pageIndex = 0; pageIndex < chkPages.length; pageIndex++) {
            if (!chkPages[pageIndex].value) continue;

            var actualPageIndex = pageIndex + 1; 
            var pageNum = pageIndex + 2; 
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            
            log("\n═══ SƏHİFƏ " + pageNum + " ═══");
            
            if (!pageFolder.exists) { log("⚠️ Qovluq yoxdur, ötürülür."); continue; }

            var page = doc.pages.item(actualPageIndex);
            if(!page.isValid) { log("❌ Səhifə " + pageNum + " sənəddə mövcud deyil."); continue; }

            if (chkClearExisting.value) {
                page.pageItems.everyItem().remove();
                log("Mövcud elementlər silindi");
            }

            var layer;
            if (chkCreateLayers.value) {
                var layerName = "Səhifə " + pageNum;
                layer = doc.layers.itemByName(layerName);
                if (!layer.isValid) {
                    layer = doc.layers.add({name: layerName});
                }
            } else {
                layer = doc.activeLayer;
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            if (txtFiles.length === 0) { log("📄 Mətn faylı tapılmadı."); continue; }
            log("📄 " + txtFiles.length + " mətn faylı işlənilir...");
            
            var pageBounds = page.bounds;
            var marginPrefs = page.marginPreferences;
            var usableW = pageBounds[3] - pageBounds[1] - marginPrefs.left - marginPrefs.right;
            var usableH = pageBounds[2] - pageBounds[0] - marginPrefs.top - marginPrefs.bottom;
            var startX = pageBounds[1] + marginPrefs.left;
            var startY = pageBounds[0] + marginPrefs.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            txtProgress.text = "Səhifə " + pageNum + " işlənilir (" + txtFiles.length + " element)...";
            win.update();

            for (var i = 0; i < txtFiles.length; i++) {
                var txtFile = txtFiles[i];
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                log("\n  ➤ " + txtFile.name);
                
                var content = readTextFile(txtFile);
                if (!content) { log("      ✗ Mətn faylı boşdur."); totalErrors++; continue; }

                var lines = content.split(/\r?\n/);
                var cleanLines = lines.filter(function(line) { return line.trim() !== ''; });
                if (cleanLines.length === 0) { log("      ✗ Mətn faylı boş sətirlərdən ibarətdir."); totalErrors++; continue; }
                
                var title = cleanLines.shift();
                var body = cleanLines.join("\r");

                if (chkTitleUppercase.value) title = title.toUpperCase();

                var groupNum = parseInt(txtFile.name, 10);
                var imgFiles = findImageFiles(pageFolder, groupNum);
                var currentY = y;

                if (chkBackgroundColor.value && i % 2 !== 0) {
                    try {
                        var bgRect = page.rectangles.add(layer, LocationOptions.AT_BEGINNING);
                        bgRect.geometricBounds = [y, x, y + cellH, x + cellW];
                        var paperSwatch = doc.swatches.itemByName("Paper");
                        if(paperSwatch.isValid) bgRect.fillColor = paperSwatch;
                        bgRect.fillTint = 10;
                        bgRect.strokeWeight = 0;
                        bgRect.sendToBack();
                    } catch(e) { log("      ✗ Arxa fon xətası: " + e); }
                }
                
                if (imgFiles.length > 0) {
                    var imgContainerHeight = cellH * imgRatio;
                    var singleImgHeight = (imgContainerHeight / Math.ceil(imgFiles.length / 2)) - padding;
                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % 2;
                        var imgRow = Math.floor(j / 2);
                        var imgX = x + padding + (imgCol * (cellW / 2));
                        var imgY = currentY + padding + (imgRow * (singleImgHeight + padding));
                        var imgWidth = (cellW / 2) - (padding * 1.5);
                        try {
                            var rect = page.rectangles.add(layer);
                            rect.geometricBounds = [imgY, imgX, imgY + singleImgHeight, imgX + imgWidth];
                            rect.place(imgFiles[j]);
                            rect.fit(fitOption);
                            if (chkImageBorder.value) {
                                rect.strokeWeight = parseFloat(ddlBorderWidth.selection.text);
                                rect.strokeColor = doc.swatches.itemByName("Black");
                            }
                            log("      ✓ Şəkil: " + imgFiles[j].name);
                            totalPlaced++;
                        } catch (e) {
                            log("      ✗ Şəkil xətası (" + imgFiles[j].name + "): " + e);
                            totalErrors++;
                        }
                    }
                    currentY += imgContainerHeight + padding;
                }

                if (title) {
                    try {
                        var titleFrame = page.textFrames.add(layer);
                        titleFrame.geometricBounds = [currentY, x + padding, currentY + (titleSize * 3), x + cellW - padding];
                        titleFrame.contents = title;
                        var pStyle = titleFrame.parentStory.paragraphs[0];
                        pStyle.pointSize = titleSize;
                        pStyle.justification = titleAlign;
                        if (chkTitleBold.value) pStyle.fontStyle = "Bold";
                        titleFrame.fit(FitOptions.FRAME_TO_CONTENT);
                        currentY = titleFrame.geometricBounds[2] + (padding / 2);
                        log("      ✓ Başlıq");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Başlıq xətası: " + e);
                        totalErrors++;
                    }
                }
                
                if (body) {
                    try {
                        var textFrame = page.textFrames.add(layer);
                        if(currentY < (y + cellH - padding)) {
                           textFrame.geometricBounds = [currentY, x + padding, y + cellH - padding, x + cellW - padding];
                           textFrame.contents = body;
                           var pStyleBody = textFrame.parentStory.paragraphs.everyItem();
                           pStyleBody.pointSize = bodySize;
                           pStyleBody.justification = bodyAlign;
                           if (ddlLeading.selection.index > 0) {
                               var leadingVal = [Leading.AUTO, bodySize * 1.1, bodySize * 1.2, bodySize * 1.3, bodySize * 1.4, bodySize * 1.5][ddlLeading.selection.index];
                               pStyleBody.leading = leadingVal;
                           } else { pStyleBody.leading = Leading.AUTO; }
                           log("      ✓ Mətn");
                           totalPlaced++;
                        } else {
                           log("      ! Mətn üçün yer qalmadı.");
                           totalErrors++;
                        }
                    } catch (e) {
                        log("      ✗ Mətn xətası: " + e);
                        totalErrors++;
                    }
                }
            }
        }
        
        log("\n═══════════════════════════════\nTAMAMLANDI: " + totalPlaced + " element yerləşdirildi.\nXƏTALAR: " + totalErrors + "\n═══════════════════════════════");
        txtProgress.text = "✅ " + totalPlaced + " element yerləşdi, " + totalErrors + " xəta";
        alert("✅ Proses tamamlandı!\n\n" + totalPlaced + " element yerləşdirildi\n" + totalErrors + " xəta\n\nƏtraflı məlumat üçün konsola baxın.");
    }
    
    // İndi `main` funksiyası təyin edildiyi üçün onu `app.doScript` ilə təhlükəsiz şəkildə çağırmaq olar.
    app.doScript(main, ScriptLanguage.JAVASCRIPT, [], UndoModes.ENTIRE_SCRIPT, "Qəzet Yerləşdiricisi Skripti");
};

win.center();
win.show();
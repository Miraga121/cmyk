// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v3.1 - InDesign CC 2024 (19.0)
// ═══════════════════════════════════════════════════════════
// Sadələşdirilmiş və optimallaşdırılmış versiya

// Sənəd yoxlaması
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;

// ═══════════════════════════════════════════════════════════
//  GLOBAL DEYİŞƏNLƏR
// ═══════════════════════════════════════════════════════════

var totalPlaced = 0;
var totalErrors = 0;

function logMessage(msg) {
    $.writeln(msg);
}

// ═══════════════════════════════════════════════════════════
//  HELPER FUNKSIYALAR
// ═══════════════════════════════════════════════════════════

function readTextFile(file) {
    if (!file || !file.exists) return "";
    var content = "";
    try {
        file.encoding = "UTF-8";
        if (file.open("r")) {
            content = file.read();
            file.close();
            if (content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
            }
        }
    } catch (e) {
        logMessage("Fayl oxuma xətası: " + file.name);
    }
    return content;
}

function getNumberedFiles(folder, filterRegex) {
    if (!folder || !folder.exists) return [];
    var allFiles = folder.getFiles();
    var filtered = [];
    for (var i = 0; i < allFiles.length; i++) {
        var f = allFiles[i];
        if (f instanceof File && filterRegex.test(f.name)) {
            filtered.push(f);
        }
    }
    filtered.sort(function(a, b) {
        var numA = parseInt(a.name.match(/\d+/), 10) || 0;
        var numB = parseInt(b.name.match(/\d+/), 10) || 0;
        return numA - numB;
    });
    return filtered;
}

function findImageFiles(folder, groupNum) {
    var pattern = new RegExp("^" + groupNum + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp|psd)$", "i");
    return getNumberedFiles(folder, pattern);
}

// ═══════════════════════════════════════════════════════════
//  GUI
// ═══════════════════════════════════════════════════════════

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v3.1");
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 16;

// Qovluq
var grpFolder = win.add("panel", undefined, "Qovluq Seçimi");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 10;
var txtFolder = grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/ olan):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [450, 25];
var btnBrowse = grpFolder.add("button", undefined, "Qovluq Seç...");

// Layout
var grpLayout = win.add("panel", undefined, "Layout");
grpLayout.orientation = "column";
grpLayout.alignChildren = ["fill", "top"];
grpLayout.margins = 10;

var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Sütun:").preferredSize.width = 100;
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1;

var grpImg = grpLayout.add("group");
grpImg.add("statictext", undefined, "Şəkil % (20-60):").preferredSize.width = 100;
var etImgRatio = grpImg.add("edittext", undefined, "40");
etImgRatio.preferredSize = [60, 25];

var grpPad = grpLayout.add("group");
grpPad.add("statictext", undefined, "Aralıq (pt):").preferredSize.width = 100;
var etPadding = grpPad.add("edittext", undefined, "5");
etPadding.preferredSize = [60, 25];

// Tipoqrafiya
var grpTypo = win.add("panel", undefined, "Tipoqrafiya");
grpTypo.orientation = "column";
grpTypo.alignChildren = ["fill", "top"];
grpTypo.margins = 10;

var grpTitle = grpTypo.add("group");
grpTitle.add("statictext", undefined, "Başlıq (pt):").preferredSize.width = 100;
var etTitleSize = grpTitle.add("edittext", undefined, "14");
etTitleSize.preferredSize = [60, 25];
var chkTitleBold = grpTitle.add("checkbox", undefined, "Bold");
chkTitleBold.value = true;

var grpBody = grpTypo.add("group");
grpBody.add("statictext", undefined, "Mətn (pt):").preferredSize.width = 100;
var etBodySize = grpBody.add("edittext", undefined, "10");
etBodySize.preferredSize = [60, 25];

// Səhifələr
var grpPages = win.add("panel", undefined, "Səhifələr");
grpPages.orientation = "row";
grpPages.alignChildren = ["left", "center"];
grpPages.margins = 10;

var chkPages = [];
for (var p = 2; p <= 8; p++) {
    var chk = grpPages.add("checkbox", undefined, p);
    chk.value = true;
    chkPages.push(chk);
}

// Seçimlər
var grpOpts = win.add("panel", undefined, "Seçimlər");
grpOpts.orientation = "column";
grpOpts.alignChildren = ["left", "top"];
grpOpts.margins = 10;
var chkClear = grpOpts.add("checkbox", undefined, "Mövcud çərçivələri sil");
chkClear.value = true;
var chkBorder = grpOpts.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et");
chkBorder.value = true;

// Düymələr
var grpButtons = win.add("group");
grpButtons.orientation = "row";
grpButtons.alignment = ["fill", "bottom"];
var btnTest = grpButtons.add("button", undefined, "Test Et");
var btnRun = grpButtons.add("button", undefined, "Yerləşdir");
var btnCancel = grpButtons.add("button", undefined, "Bağla", {name: "cancel"});

var txtStatus = win.add("statictext", undefined, "Hazır...");
txtStatus.preferredSize = [450, 25];

// ═══════════════════════════════════════════════════════════
//  EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin");
    if (folder && folder.exists) {
        etFolder.text = folder.fsName;
        txtStatus.text = "Qovluq seçildi: " + folder.name;
    }
};

btnTest.onClick = function() {
    var rootPath = etFolder.text;
    if (!rootPath) {
        alert("Qovluq seçin!");
        return;
    }
    
    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) {
        alert("Qovluq mövcud deyil!");
        return;
    }
    
    var totalTxt = 0, totalImg = 0;
    for (var p = 2; p <= 8; p++) {
        var pageFolder = new Folder(rootFolder.fsName + "/page" + p);
        if (pageFolder.exists) {
            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            var imgFiles = getNumberedFiles(pageFolder, /\.(jpe?g|png|tiff?|gif|bmp|psd)$/i);
            totalTxt += txtFiles.length;
            totalImg += imgFiles.length;
        }
    }
    
    alert("Test:\n\n" + totalTxt + " mətn faylı\n" + totalImg + " şəkil faylı tapıldı");
};

btnRun.onClick = function() {
    totalPlaced = 0;
    totalErrors = 0;
    
    // Parametrləri oxu
    var rootPath = etFolder.text;
    if (!rootPath) {
        alert("Qovluq seçin!");
        return;
    }
    
    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) {
        alert("Qovluq mövcud deyil!");
        return;
    }
    
    var cols = parseInt(ddlColumns.selection.text, 10);
    var imgRatio = parseInt(etImgRatio.text, 10) / 100;
    var padding = parseFloat(etPadding.text);
    var titleSize = parseFloat(etTitleSize.text);
    var bodySize = parseFloat(etBodySize.text);
    
    if (imgRatio < 0.2 || imgRatio > 0.6) {
        alert("Şəkil nisbəti 20-60 arasında olmalıdır!");
        return;
    }
    
    var selectedPages = [];
    for (var i = 0; i < chkPages.length; i++) {
        if (chkPages[i].value) {
            selectedPages.push(i + 2);
        }
    }
    
    if (selectedPages.length === 0) {
        alert("Ən azı bir səhifə seçin!");
        return;
    }
    
    if (!confirm("Yerləşdirmə başlasın?\n\nSəhifələr: " + selectedPages.join(", "))) {
        return;
    }
    
    // İşə başla
    win.hide();
    
    try {
        logMessage("═══════════════════════════════");
        logMessage("BAŞLADI");
        logMessage("═══════════════════════════════");
        
        for (var pi = 0; pi < selectedPages.length; pi++) {
            var pageNum = selectedPages[pi];
            var pageIndex = pageNum - 1;
            
            logMessage("\n=== SƏHIFƏ " + pageNum + " ===");
            
            if (pageIndex >= doc.pages.length) {
                logMessage("Səhifə mövcud deyil!");
                continue;
            }
            
            var page = doc.pages.item(pageIndex);
            var pageFolder = new Folder(rootFolder.fsName + "/page" + pageNum);
            
            if (!pageFolder.exists) {
                logMessage("Qovluq yoxdur!");
                continue;
            }
            
            // Köhnə elementləri sil
            if (chkClear.value) {
                try {
                    var items = page.pageItems;
                    for (var k = items.length - 1; k >= 0; k--) {
                        items[k].remove();
                    }
                    logMessage("Köhnə elementlər silindi");
                } catch (e) {
                    logMessage("Silinmə xətası: " + e);
                }
            }
            
            // Mətn fayllarını tap
            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            if (txtFiles.length === 0) {
                logMessage("Mətn faylı yoxdur!");
                continue;
            }
            
            logMessage(txtFiles.length + " mətn faylı tapıldı");
            
            // Grid hesabla
            var bounds = page.bounds;
            var margins = page.marginPreferences;
            var usableW = bounds[3] - bounds[1] - margins.left - margins.right;
            var usableH = bounds[2] - bounds[0] - margins.top - margins.bottom;
            var startX = bounds[1] + margins.left;
            var startY = bounds[0] + margins.top;
            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;
            
            // Hər mətn faylını işlə
            for (var t = 0; t < txtFiles.length; t++) {
                var txtFile = txtFiles[t];
                var row = Math.floor(t / cols);
                var col = t % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;
                
                logMessage("\n  [" + (t + 1) + "] " + txtFile.name);
                
                // Mətn oxu
                var content = readTextFile(txtFile);
                if (!content) {
                    logMessage("    Mətn boşdur");
                    totalErrors++;
                    continue;
                }
                
                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    if (lines[ln].trim()) {
                        cleanLines.push(lines[ln].trim());
                    }
                }
                
                if (cleanLines.length === 0) {
                    totalErrors++;
                    continue;
                }
                
                var title = cleanLines.shift();
                var body = cleanLines.join("\n");
                
                var currentY = y;
                
                // Şəkilləri tap və yerləşdir
                var groupNum = parseInt(txtFile.name.match(/\d+/), 10) || 0;
                var imgFiles = findImageFiles(pageFolder, groupNum);
                
                if (imgFiles.length > 0) {
                    logMessage("    Şəkillər: " + imgFiles.length);
                    
                    var imgHeight = cellH * imgRatio;
                    var maxImgs = Math.min(imgFiles.length, 4);
                    var singleImgH = (imgHeight / Math.ceil(maxImgs / 2)) - padding;
                    
                    for (var im = 0; im < maxImgs; im++) {
                        var imgCol = im % 2;
                        var imgRow = Math.floor(im / 2);
                        var imgX = x + padding + (imgCol * (cellW / 2));
                        var imgY = currentY + padding + (imgRow * (singleImgH + padding));
                        var imgW = (cellW / 2) - (padding * 1.5);
                        
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [imgY, imgX, imgY + singleImgH, imgX + imgW];
                            rect.place(imgFiles[im]);
                            rect.fit(FitOptions.FILL_PROPORTIONALLY);
                            
                            if (chkBorder.value) {
                                rect.strokeWeight = 1;
                                var blackSwatch = doc.swatches.itemByName("Black");
                                if (blackSwatch.isValid) {
                                    rect.strokeColor = blackSwatch;
                                }
                            }
                            
                            totalPlaced++;
                            logMessage("      ✓ " + imgFiles[im].name);
                        } catch (e) {
                            logMessage("      ✗ Şəkil xətası: " + e);
                            totalErrors++;
                        }
                    }
                    
                    currentY += imgHeight + padding;
                }
                
                // Başlıq
                if (title) {
                    try {
                        var titleFrame = page.textFrames.add();
                        var titleH = titleSize * 2.5;
                        titleFrame.geometricBounds = [
                            currentY,
                            x + padding,
                            currentY + titleH,
                            x + cellW - padding
                        ];
                        titleFrame.contents = title;
                        
                        var titlePara = titleFrame.parentStory.paragraphs[0];
                        titlePara.pointSize = titleSize;
                        titlePara.justification = Justification.LEFT_ALIGN;
                        
                        if (chkTitleBold.value) {
                            try {
                                titlePara.fontStyle = "Bold";
                            } catch (e) {}
                        }
                        
                        titleFrame.fit(FitOptions.FRAME_TO_CONTENT);
                        currentY = titleFrame.geometricBounds[2] + padding;
                        
                        totalPlaced++;
                        logMessage("    ✓ Başlıq");
                    } catch (e) {
                        logMessage("    ✗ Başlıq xətası: " + e);
                        totalErrors++;
                    }
                }
                
                // Mətn
                if (body) {
                    try {
                        var remainingH = (y + cellH - padding) - currentY;
                        
                        if (remainingH > bodySize * 2) {
                            var textFrame = page.textFrames.add();
                            textFrame.geometricBounds = [
                                currentY,
                                x + padding,
                                y + cellH - padding,
                                x + cellW - padding
                            ];
                            textFrame.contents = body;
                            
                            var bodyParas = textFrame.parentStory.paragraphs.everyItem();
                            bodyParas.pointSize = bodySize;
                            bodyParas.justification = Justification.LEFT_ALIGN;
                            bodyParas.leading = bodySize * 1.2;
                            
                            totalPlaced++;
                            logMessage("    ✓ Mətn");
                        } else {
                            logMessage("    ! Yer yoxdur");
                        }
                    } catch (e) {
                        logMessage("    ✗ Mətn xətası: " + e);
                        totalErrors++;
                    }
                }
            }
        }
        
        logMessage("\n═══════════════════════════════");
        logMessage("TAMAMLANDI");
        logMessage("Yerləşdirildi: " + totalPlaced);
        logMessage("Xətalar: " + totalErrors);
        logMessage("═══════════════════════════════");
        
        win.show();
        alert("✅ Tamamlandı!\n\n" + totalPlaced + " element yerləşdi\n" + totalErrors + " xəta");
        
    } catch (e) {
        win.show();
        alert("❌ Xəta:\n\n" + e.message + "\n\nSətir: " + e.line);
    }
};

// ═══════════════════════════════════════════════════════════
//  GÖSTƏR
// ═══════════════════════════════════════════════════════════

win.center();
win.show();
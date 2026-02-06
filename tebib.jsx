#targetengine "session"

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

// Debug log funksiyası
var debugLog = [];
function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// GUI yaradın
var win = new Window("palette", "Qəzet Məzmun Yerləşdiricisi", undefined, {resizeable: true});
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 15;
win.margins = 20;

// Qovluq seçimi
var grpFolder = win.add("group");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olan):");
var etFolder = grpFolder.add("edittext", undefined, "");
etFolder.preferredSize = [400, 30];

var btnBrowse = win.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 35;

// Grid seçimi
var grpGrid = win.add("group");
grpGrid.orientation = "row";
grpGrid.spacing = 10;
grpGrid.add("statictext", undefined, "Grid Sütun Sayı:");
var ddlColumns = grpGrid.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1; // 2 sütun default
ddlColumns.preferredSize = [80, 30];

// Test düyməsi
var btnTest = win.add("button", undefined, "🔍 Test Et (Debug)");
btnTest.preferredSize.height = 35;

// İşləmə düyməsi
var btnRun = win.add("button", undefined, "✅ Məzmunu Yerləşdir");
btnRun.preferredSize.height = 45;

// Progress məlumatı
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [400, 25];

// Qovluq seçmə
btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olan)");
    if (folder) {
        etFolder.text = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

// Test funksiyası - qovluq və faylları yoxlayır
btnTest.onClick = function() {
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
    log("Ana qovluq: " + rootFolder.fsName);
    log("Mövcuddur: " + rootFolder.exists);
    
    if (!rootFolder.exists) {
        alert("❌ Qovluq mövcud deyil!");
        return;
    }

    // Ana qovluqdakı bütün alt qovluqları göstər
    var subFolders = rootFolder.getFiles();
    log("\nAna qovluqdakı elementlər:");
    for (var i = 0; i < subFolders.length; i++) {
        if (subFolders[i] instanceof Folder) {
            log("  📁 " + subFolders[i].name);
        }
    }

    // Hər səhifə qovluğunu yoxla
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        log("\n--- SƏHİFƏ " + pageNum + " YOXLANIR ---");
        var pageFolderName = "page" + pageNum;
        var pageFolder = new Folder(rootFolder + "/" + pageFolderName);
        
        log("Qovluq yolu: " + pageFolder.fsName);
        log("Mövcuddur: " + pageFolder.exists);
        
        if (!pageFolder.exists) {
            log("⚠️ Bu qovluq tapılmadı!");
            continue;
        }

        // Qovluqdaki bütün faylları göstər
        var allFiles = pageFolder.getFiles();
        log("Ümumi fayl sayı: " + allFiles.length);
        
        for (var f = 0; f < allFiles.length; f++) {
            if (allFiles[f] instanceof File) {
                log("  📄 " + allFiles[f].name);
            }
        }

        // .txt faylları
        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        log("Tapılan .txt faylları: " + txtFiles.length);
        for (var t = 0; t < txtFiles.length; t++) {
            log("  ✓ " + txtFiles[t].name);
            
            // Mətn oxu
            var content = readTextFile(txtFiles[t]);
            log("    Mətn uzunluğu: " + content.length + " simvol");
            if (content.length > 0) {
                var preview = content.substring(0, 50);
                log("    Önizləmə: " + preview + "...");
            }
        }

        // Şəkil faylları
        var imgPattern = /\.(jpe?g|png|tiff?|gif|bmp)$/i;
        var imgFiles = getNumberedFiles(pageFolder, imgPattern);
        log("Tapılan şəkil faylları: " + imgFiles.length);
        for (var im = 0; im < imgFiles.length; im++) {
            log("  🖼️ " + imgFiles[im].name);
        }
    }

    log("\n═══════════════════════════════");
    log("TEST TAMAMLANDI");
    log("═══════════════════════════════");
    
    var logText = debugLog.join("\n");
    alert("Test tamamlandı!\n\nExtendScript Toolkit Console-da ətraflı məlumat var.\n\nİlk 500 simvol:\n" + logText.substring(0, 500));
};

// Əsas işləmə funksiyası
btnRun.onClick = function() {
    debugLog = [];
    
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

        var cols = parseInt(ddlColumns.selection.text) || 2;
        log("Grid sütun sayı: " + cols);
        
        txtProgress.text = "İşləyir...";
        win.update();

        var totalPlaced = 0;
        
        // Səhifə 2-dən 8-ə qədər (doc.pages[1] - doc.pages[7])
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            var pageNum = pageIndex + 1;
            var pageFolderName = "page" + pageNum;
            var pageFolder = new Folder(rootFolder + "/" + pageFolderName);
            
            log("\n═══ SƏHİFƏ " + pageNum + " (index: " + pageIndex + ") ═══");
            log("Qovluq: " + pageFolder.fsName);
            
            if (!pageFolder.exists) {
                log("⚠️ Qovluq tapılmadı");
                continue;
            }

            // Txt faylları tap
            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            log("📄 .txt fayl sayı: " + txtFiles.length);
            
            if (txtFiles.length === 0) {
                log("⚠️ Heç bir .txt fayl yoxdur");
                continue;
            }

            // Səhifə obyekti
            var page = doc.pages[pageIndex];
            log("Səhifə obyekti: " + page.name);
            
            // Səhifə ölçüləri
            var bounds = page.bounds;
            var margin = page.marginPreferences;
            
            log("Səhifə bounds: [" + bounds[0] + ", " + bounds[1] + ", " + bounds[2] + ", " + bounds[3] + "]");
            log("Margins: top=" + margin.top + ", left=" + margin.left + ", bottom=" + margin.bottom + ", right=" + margin.right);
            
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;
            
            log("İstifadə edilə bilən sahə: " + usableW + " × " + usableH);
            log("Başlanğıc nöqtəsi: (" + startX + ", " + startY + ")");

            // Grid
            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;
            
            log("Grid: " + cols + " sütun × " + rows + " sətir");
            log("Hüceyrə: " + cellW + " × " + cellH);

            txtProgress.text = "Səhifə " + pageNum + " işlənir... (" + txtFiles.length + " element)";
            win.update();

            // Hər txt fayl üçün
            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                log("\n  ➤ Element " + (i+1) + "/" + txtFiles.length + ": " + txtFiles[i].name);
                log("    Grid pozisiya: sətir " + row + ", sütun " + col);
                log("    Koordinatlar: (" + x + ", " + y + ")");
                
                // Mətn oxu
                var content = readTextFile(txtFiles[i]);
                if (!content || content.length === 0) {
                    log("    ⚠️ Mətn boşdur");
                    continue;
                }
                
                log("    Mətn uzunluğu: " + content.length);

                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed !== "") {
                        cleanLines.push(lines[ln]);
                    }
                }
                
                if (cleanLines.length === 0) {
                    log("    ⚠️ Təmiz sətirlər yoxdur");
                    continue;
                }
                
                var title = cleanLines[0] || "Başlıqsız";
                var bodyLines = [];
                for (var b = 1; b < cleanLines.length; b++) {
                    bodyLines.push(cleanLines[b]);
                }
                var body = bodyLines.join("\r");

                log("    📌 Başlıq: " + title.substring(0, 50));
                log("    📝 Mətn: " + body.length + " simvol");

                // Şəkil faylları
                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);
                log("    🖼️ Şəkil: " + imgFiles.length + " ədəd (qrup " + groupNum + ")");

                var currentY = y;
                var padding = 5;

                // ŞƏKİLLƏR
                if (imgFiles.length > 0) {
                    var imgHeight = cellH * 0.4;
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgWidth = (cellW - padding * 2) / imgCols;
                    
                    log("    Şəkil zonası: " + imgHeight + " hündürlük, " + imgCols + " sütun");
                    
                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        var imgX = x + padding + (imgCol * imgWidth);
                        var imgY = currentY + padding + (imgRow * (imgHeight / 2));
                        
                        try {
                            var rect = page.rectangles.add();
                            rect.geometricBounds = [
                                imgY, 
                                imgX, 
                                imgY + (imgHeight / 2) - padding, 
                                imgX + imgWidth - padding
                            ];
                            
                            log("      Şəkil çərçivə: [" + rect.geometricBounds + "]");
                            
                            rect.place(imgFiles[j]);
                            rect.fit(FitOptions.FILL_PROPORTIONALLY);
                            
                            log("      ✓ Şəkil yerləşdi: " + imgFiles[j].name);
                            totalPlaced++;
                        } catch (e) {
                            log("      ✗ Şəkil xətası: " + e.toString());
                        }
                    }
                    currentY += imgHeight + padding;
                }

                // BAŞLIQ
                if (title && title.trim() !== "") {
                    try {
                        var titleFrame = page.textFrames.add();
                        var titleHeight = 30;
                        titleFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            currentY + titleHeight, 
                            x + cellW - padding
                        ];
                        
                        log("      Başlıq çərçivə: [" + titleFrame.geometricBounds + "]");
                        
                        titleFrame.contents = title;
                        
                        try {
                            titleFrame.parentStory.characters.everyItem().appliedFont = app.fonts.item("Arial\tBold");
                        } catch(fontErr) {
                            log("      Font xətası, default istifadə olunur");
                        }
                        titleFrame.parentStory.characters.everyItem().pointSize = 14;
                        titleFrame.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
                        
                        currentY += titleHeight + padding;
                        log("      ✓ Başlıq yerləşdi");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Başlıq xətası: " + e.toString());
                    }
                }

                // MƏTN
                if (body && body.trim() !== "") {
                    try {
                        var textFrame = page.textFrames.add();
                        textFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            y + cellH - padding, 
                            x + cellW - padding
                        ];
                        
                        log("      Mətn çərçivə: [" + textFrame.geometricBounds + "]");
                        
                        textFrame.contents = body;
                        
                        try {
                            textFrame.parentStory.characters.everyItem().appliedFont = app.fonts.item("Arial\tRegular");
                        } catch(fontErr) {
                            log("      Font xətası, default istifadə olunur");
                        }
                        textFrame.parentStory.characters.everyItem().pointSize = 10;
                        textFrame.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
                        
                        log("      ✓ Mətn yerləşdi");
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Mətn xətası: " + e.toString());
                    }
                }
            }
        }

        log("\n═══════════════════════════════");
        log("YERLƏŞDİRMƏ TAMAMLANDI");
        log("Cəmi yerləşdirilən element: " + totalPlaced);
        log("═══════════════════════════════");
        
        txtProgress.text = "✅ Tamamlandı! " + totalPlaced + " element yerləşdirildi";
        alert("✅ Tamamlandı!\n\n" + totalPlaced + " element yerləşdirildi.\n\nKonsola baxın (Window → Utilities → ExtendScript Toolkit)");
        
    } catch (e) {
        log("❌ XƏTA: " + e.toString());
        log("Sətir: " + e.line);
        alert("❌ Xəta: " + e.toString() + "\n\nSətir: " + e.line + "\n\nKonsola baxın");
        txtProgress.text = "Xəta baş verdi!";
    }
};

// Mətn oxuma
function readTextFile(file) {
    if (!file.exists) return "";
    try {
        file.encoding = "UTF-8";
        file.open("r");
        var content = file.read();
        file.close();
        
        // UTF-8 BOM sil
        if (content.charCodeAt(0) === 0xFEFF) {
            content = content.slice(1);
        }
        return content;
    } catch (e) {
        $.writeln("Fayl oxuma xətası: " + e.toString());
        return "";
    }
}

// Nömrələnmiş fayllar
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

// Şəkil faylları
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

win.center();
win.show();
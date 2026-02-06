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
var win = new Window("palette", "Qəzet Məzmun Yerləşdiricisi v2.0", undefined, {resizeable: true});
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
ddlColumns.selection = 1;
ddlColumns.preferredSize = [80, 30];

// Təmizləmə seçimi
var chkClearPage = win.add("checkbox", undefined, "✓ Səhifəni təmizlə (köhnə məzmun silin)");
chkClearPage.value = true;

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

// SƏHIFƏ TEMİZLƏMƏ FUNKSIYASI
function clearPageContent(page) {
    try {
        // Tüm page items'ları sil
        for (var i = page.pageItems.length - 1; i >= 0; i--) {
            page.pageItems[i].remove();
        }
        
        // Tüm text frames'ları sil
        for (var j = page.textFrames.length - 1; j >= 0; j--) {
            page.textFrames[j].remove();
        }
        
        // Tüm graphics'i sil
        for (var k = page.graphics.length - 1; k >= 0; k--) {
            page.graphics[k].remove();
        }
        
        // Tüm rectangles'ı sil
        for (var l = page.rectangles.length - 1; l >= 0; l--) {
            page.rectangles[l].remove();
        }
        
        return true;
    } catch (e) {
        log("⚠️ Səhifə təmizlənmə xətası: " + e.toString());
        return false;
    }
}

// Test funksiyası
btnTest.onClick = function() {
    debugLog = [];
    log("═══════════════════════════════");
    log("TEST BAŞLADI - " + new Date().toString());
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

    var subFolders = rootFolder.getFiles();
    log("\nAna qovluqdakı elementlər:");
    for (var i = 0; i < subFolders.length; i++) {
        if (subFolders[i] instanceof Folder) {
            log("  📁 " + subFolders[i].name);
        }
    }

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

        var allFiles = pageFolder.getFiles();
        log("Ümumi fayl sayı: " + allFiles.length);
        
        for (var f = 0; f < allFiles.length; f++) {
            if (allFiles[f] instanceof File) {
                log("  📄 " + allFiles[f].name);
            }
        }

        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        log("Tapılan .txt faylları: " + txtFiles.length);
        for (var t = 0; t < txtFiles.length; t++) {
            log("  ✓ " + txtFiles[t].name);
            
            var content = readTextFile(txtFiles[t]);
            log("    Mətn uzunluğu: " + content.length + " simvol");
            if (content.length > 0) {
                var preview = content.substring(0, 50).replace(/\r?\n/g, " ");
                log("    Önizləmə: " + preview + "...");
            }
        }

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
    var displayLog = logText.substring(0, 1000);
    alert("Test tamamlandı!\n\nKonsola baxın: Window → Utilities → ExtendScript Toolkit\n\nÖnizləmə:\n" + displayLog + "\n...");
};

// ƏSAS İŞLƏMƏ FUNKSIYASI
btnRun.onClick = function() {
    debugLog = [];
    
    try {
        log("═══════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI - " + new Date().toString());
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
        var shouldClear = chkClearPage.value;
        
        log("Grid sütun sayı: " + cols);
        log("Səhifə təmizlənməsi: " + (shouldClear ? "AÇIQ" : "KAPAL"));
        
        txtProgress.text = "İşləyir...";
        win.update();

        var totalPlaced = 0;
        var totalPages = 0;
        
        // Səhifə 2-dən 8-ə qədər (doc.pages[1] - doc.pages[7])
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            var pageNum = pageIndex + 1;
            var pageFolderName = "page" + pageNum;
            var pageFolder = new Folder(rootFolder + "/" + pageFolderName);
            
            log("\n╔════════════════════════════════════╗");
            log("║  SƏHİFƏ " + pageNum + " (indeks: " + pageIndex + ")");
            log("╚════════════════════════════════════╝");
            log("Qovluq: " + pageFolder.fsName);
            
            if (!pageFolder.exists) {
                log("⚠️ Qovluq tapılmadı, atlanır");
                continue;
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            log("📄 .txt fayl sayı: " + txtFiles.length);
            
            if (txtFiles.length === 0) {
                log("⚠️ Heç bir .txt fayl yoxdur");
                continue;
            }

            var page = doc.pages[pageIndex];
            if (!page) {
                log("❌ Səhifə objekti yoxdur!");
                continue;
            }
            
            log("Səhifə adı: " + page.name);
            
            // SƏHİFƏ TEMİZLƏMƏSİ
            if (shouldClear) {
                log("\n🧹 Səhifə təmizlənir...");
                if (clearPageContent(page)) {
                    log("✓ Səhifə uğurlu təmizləndi");
                } else {
                    log("⚠️ Səhifə təmizlənməsində problem var");
                }
                // Kiçik gecikmə ver
                $.sleep(300);
            }
            
            // Səhifə ölçüləri
            var bounds = page.bounds;
            var margin = page.marginPreferences;
            
            log("\nSəhifə bounds: [" + bounds.join(", ") + "]");
            log("Margins - top: " + margin.top + ", left: " + margin.left + 
                ", bottom: " + margin.bottom + ", right: " + margin.right);
            
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;
            
            log("İstifadə edilə bilən sahə: " + usableW.toFixed(2) + " × " + usableH.toFixed(2));
            log("Başlanğıc nöqtəsi: (" + startX.toFixed(2) + ", " + startY.toFixed(2) + ")");

            // Grid hesablaması
            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;
            
            log("\n📊 Grid hesablaması:");
            log("   Sütunlar: " + cols + " | Sətir: " + rows);
            log("   Hüceyrə ölçüsü: " + cellW.toFixed(2) + " × " + cellH.toFixed(2));

            txtProgress.text = "Səhifə " + pageNum + ": " + txtFiles.length + " element işlənir...";
            win.update();

            // Hər txt fayl üçün
            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                log("\n  ➤ Məzcum " + (i+1) + "/" + txtFiles.length);
                log("    Fayl: " + txtFiles[i].name);
                log("    Grid: sətir " + row + ", sütun " + col);
                log("    Koordinatlar: (" + x.toFixed(2) + ", " + y.toFixed(2) + ")");
                
                // Mətn oxu
                var content = readTextFile(txtFiles[i]);
                if (!content || content.length === 0) {
                    log("    ⚠️ Mətn boşdur");
                    continue;
                }
                
                log("    Mətn uzunluğu: " + content.length + " simvol");

                // Sətirləri ayır
                var lines = content.split(/\r?\n/);
                var cleanLines = [];
                for (var ln = 0; ln < lines.length; ln++) {
                    var trimmed = lines[ln].replace(/^\s+|\s+$/g, '');
                    if (trimmed !== "") {
                        cleanLines.push(lines[ln]);
                    }
                }
                
                if (cleanLines.length === 0) {
                    log("    ⚠️ Təmiz məzmun yoxdur");
                    continue;
                }
                
                var title = cleanLines[0] || "Başlıqsız";
                var bodyLines = [];
                for (var b = 1; b < cleanLines.length; b++) {
                    bodyLines.push(cleanLines[b]);
                }
                var body = bodyLines.join("\r");

                log("    📌 Başlıq: " + title.substring(0, 60));
                log("    📝 Mətn ölçüsü: " + body.length + " simvol");

                // Şəkil faylları
                var groupNum = parseInt(txtFiles[i].name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);
                log("    🖼️ Şəkil sayı: " + imgFiles.length + " (qrup " + groupNum + ")");

                var currentY = y;
                var padding = 5;
                var elementsAdded = 0;

                // ŞƏKİLLƏR
                if (imgFiles.length > 0) {
                    var imgHeight = cellH * 0.35;
                    var imgCols = Math.min(imgFiles.length, 2);
                    var imgWidth = (cellW - padding * 4) / imgCols;
                    
                    log("    Şəkil bölgəsi: " + imgHeight.toFixed(2) + "h, " + imgCols + " sütun");
                    
                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgCol = j % imgCols;
                        var imgRow = Math.floor(j / imgCols);
                        var imgX = x + padding + (imgCol * (imgWidth + padding));
                        var imgY = currentY + padding + (imgRow * ((imgHeight / 2) + padding));
                        
                        try {
                            var rect = page.rectangles.add();
                            var imgFrameH = (imgHeight / 2) - padding;
                            var imgFrameW = imgWidth;
                            
                            rect.geometricBounds = [imgY, imgX, imgY + imgFrameH, imgX + imgFrameW];
                            
                            log("      📦 Çərçivə " + (j+1) + ": [" + 
                                imgY.toFixed(1) + ", " + imgX.toFixed(1) + ", " +
                                (imgY + imgFrameH).toFixed(1) + ", " + (imgX + imgFrameW).toFixed(1) + "]");
                            
                            rect.place(imgFiles[j]);
                            rect.fit(FitOptions.FILL_PROPORTIONALLY);
                            
                            log("      ✓ Şəkil: " + imgFiles[j].name);
                            elementsAdded++;
                            totalPlaced++;
                        } catch (e) {
                            log("      ✗ Xəta: " + e.message);
                        }
                    }
                    currentY += imgHeight + padding;
                }

                // BAŞLIQ
                var titleTrimmed = title.replace(/^\s+|\s+$/g, '');
                if (titleTrimmed !== "") {
                    try {
                        var titleFrame = page.textFrames.add();
                        var titleHeight = Math.max(25, cellH * 0.15);
                        
                        titleFrame.geometricBounds = [
                            currentY, 
                            x + padding, 
                            currentY + titleHeight, 
                            x + cellW - padding
                        ];
                        
                        titleFrame.contents = title;
                        
                        // Font tətbiqi (xəta işləməsi ilə)
                        try {
                            var boldFont = app.fonts.item("Arial\tBold");
                            titleFrame.parentStory.characters.everyItem().appliedFont = boldFont;
                        } catch(fontErr) {
                            try {
                                titleFrame.parentStory.characters.everyItem().appliedFont = app.fonts.item(0);
                            } catch(e2) {
                                log("      ⚠️ Font tətbiq edilə bilinmədi");
                            }
                        }
                        
                        titleFrame.parentStory.characters.everyItem().pointSize = 13;
                        titleFrame.parentStory.characters.everyItem().fillColor = app.activeDocument.colors.item("Black");
                        titleFrame.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
                        titleFrame.parentStory.paragraphs.everyItem().spaceBefore = 2;
                        titleFrame.parentStory.paragraphs.everyItem().spaceAfter = 2;
                        
                        currentY += titleHeight + padding;
                        log("      ✓ Başlıq yerləşdi");
                        elementsAdded++;
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Başlıq xətası: " + e.message);
                    }
                }

                // MƏTN
                var bodyTrimmed = body.replace(/^\s+|\s+$/g, '');
                if (bodyTrimmed !== "") {
                    try {
                        var textFrame = page.textFrames.add();
                        var bodyHeight = (y + cellH - padding) - currentY;
                        
                        if (bodyHeight > 20) {
                            textFrame.geometricBounds = [
                                currentY, 
                                x + padding, 
                                y + cellH - padding, 
                                x + cellW - padding
                            ];
                            
                            textFrame.contents = body;
                            
                            try {
                                var regularFont = app.fonts.item("Arial\tRegular");
                                textFrame.parentStory.characters.everyItem().appliedFont = regularFont;
                            } catch(fontErr) {
                                try {
                                    textFrame.parentStory.characters.everyItem().appliedFont = app.fonts.item(0);
                                } catch(e2) {
                                    log("      ⚠️ Font tətbiq edilə bilinmədi");
                                }
                            }
                            
                            textFrame.parentStory.characters.everyItem().pointSize = 9;
                            textFrame.parentStory.characters.everyItem().fillColor = app.activeDocument.colors.item("Black");
                            textFrame.parentStory.paragraphs.everyItem().justification = Justification.LEFT_ALIGN;
                            textFrame.parentStory.paragraphs.everyItem().spaceBefore = 1;
                            textFrame.parentStory.paragraphs.everyItem().spaceAfter = 1;
                            
                            log("      ✓ Mətn yerləşdi");
                            elementsAdded++;
                            totalPlaced++;
                        } else {
                            log("      ⚠️ Mətn üçün yer yoxdur");
                        }
                    } catch (e) {
                        log("      ✗ Mətn xətası: " + e.message);
                    }
                }
                
                log("    ✓ Cəmi yerləşdirilən: " + elementsAdded);
            }
            
            totalPages++;
        }

        log("\n" + "═".repeat(35));
        log("✅ YERLƏŞDİRMƏ TAMAMLANDI");
        log("═".repeat(35));
        log("Cəmi səhifə: " + totalPages);
        log("Cəmi yerləşdirilən element: " + totalPlaced);
        log("═".repeat(35));
        
        txtProgress.text = "✅ Tamamlandı! " + totalPlaced + " element → " + totalPages + " səhifə";
        
        alert("✅ TAMAMLANDI!\n\n" +
              "Səhifə sayı: " + totalPages + "\n" +
              "Yerləşdirilən element: " + totalPlaced + "\n\n" +
              "Təfərruatlar üçün Console-a baxın:\n" +
              "Window → Utilities → ExtendScript Toolkit");
        
    } catch (e) {
        log("❌ CIDDI XƏTA");
        log("Mesaj: " + e.message);
        log("Sətir: " + e.line);
        log("Yığın: " + e.stack);
        
        alert("❌ XƏTA BAŞVERDI!\n\n" +
              "Mesaj: " + e.message + "\n" +
              "Sətir: " + e.line + "\n\n" +
              "Çözüm:\n" +
              "1. Console-u açın (Window → Utilities → ExtendScript Toolkit)\n" +
              "2. Tam xəta mesajını oxuyun\n" +
              "3. Qovluq yolunun doğru olduğunu yoxlayın");
        
        txtProgress.text = "❌ Xəta baş verdi!";
    }
};

// MƏTN OXUMA FUNKSİYASI
function readTextFile(file) {
    if (!file.exists) {
        log("    ❌ Fayl mövcud deyil: " + file.name);
        return "";
    }
    
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
        log("    ❌ Fayl oxuma xətası: " + e.message);
        return "";
    }
}

// NÖMRƏLƏNMIŞ FAYLLAR
function getNumberedFiles(folder, filterRegex) {
    if (!folder.exists) return [];
    
    var allFiles = folder.getFiles();
    var filtered = [];
    
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && filterRegex.test(allFiles[i].name)) {
            filtered.push(allFiles[i]);
        }
    }
    
    // Nömrəyə görə sıraala
    filtered.sort(function(a, b) {
        var numA = parseInt(a.name.match(/^\d+/)) || 0;
        var numB = parseInt(b.name.match(/^\d+/)) || 0;
        return numA - numB;
    });
    
    return filtered;
}

// ŞƏKİL FAYLLARINI TAP
function findImageFiles(folder, groupNum) {
    if (!folder.exists) return [];
    
    var pattern = new RegExp("^" + groupNum + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp)$", "i");
    var allFiles = folder.getFiles();
    var result = [];
    
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && pattern.test(allFiles[i].name)) {
            result.push(allFiles[i]);
        }
    }
    
    // Nömrəyə görə sıraala
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
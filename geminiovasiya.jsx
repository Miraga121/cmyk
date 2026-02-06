#target "InDesign"

// =================================================================
// 1. GLOBAL KONFİQURASİYA VƏ VAHİDİN BAŞLANGICI
// =================================================================

// Skriptin bütün ölçüləri Points (Nöqtə) ilə işləməsini təmin edir
var UNIT = MeasurementUnits.POINTS;
var PADDING_MM = 3; // Çərçivə ətrafında 3 mm boşluq
var MM_TO_PT = 2.83465; // 1 mm = 2.83465 pt

// Global Log pəncərəsi (F11)
function log(msg) {
    $.writeln(msg);
}

// =================================================================
// 2. GUI PƏNCƏRƏSİNİN QURULMASI
// =================================================================

var dialog = new Window("dialog", "Qəzet Yerləşdirmə Robotu");
dialog.alignChildren = "fill";

// Qəzet Hücrə Ölçüləri
var sizeGroup = dialog.add("panel", undefined, "Hücrə Ölçüləri (MM)");
sizeGroup.orientation = "row";
sizeGroup.add("statictext", undefined, "En:");
var cellW_ui = sizeGroup.add("edittext", [0, 0, 50, 20], "80");
sizeGroup.add("statictext", undefined, "Hünd.:");
var cellH_ui = sizeGroup.add("edittext", [0, 0, 50, 20], "120");

// Yerləşdirmə Koordinatları
var posGroup = dialog.add("panel", undefined, "Başlanğıc Koordinatları (MM)");
posGroup.orientation = "row";
posGroup.add("statictext", undefined, "X:");
var posX_ui = posGroup.add("edittext", [0, 0, 50, 20], "15");
posGroup.add("statictext", undefined, "Y:");
var posY_ui = posGroup.add("edittext", [0, 0, 50, 20], "15");

// Parametrlər
var settingsGroup = dialog.add("panel", undefined, "Məzmun Parametrləri");
settingsGroup.orientation = "column";

var imgHeightGroup = settingsGroup.add("group");
imgHeightGroup.add("statictext", undefined, "Şəkil Hünd. (MM):");
var imgHeight_ui = imgHeightGroup.add("edittext", [0, 0, 50, 20], "45");

var titleSizeGroup = settingsGroup.add("group");
titleSizeGroup.add("statictext", undefined, "Başlıq Şrift Ölçüsü (PT):");
var titleSize_ui = titleSizeGroup.add("edittext", [0, 0, 50, 20], "18");

var optionsGroup = settingsGroup.add("group");
var clearExisting_ui = optionsGroup.add("checkbox", undefined, "Mövcud Elementləri Sil");
clearExisting_ui.value = true;

// Məzmun Yolları
var fileGroup = dialog.add("panel", undefined, "Məzmun Yolları");
fileGroup.orientation = "column";
fileGroup.alignChildren = "fill";

var textFile_ui = fileGroup.add("edittext", undefined, "Mətn faylını seçin (.txt)");
var browseTextBtn = fileGroup.add("button", undefined, "Mətn Faylı...");
browseTextBtn.onClick = function() {
    var file = File.openDialog("Mətn faylını seçin", "*.txt");
    if (file) textFile_ui.text = file.fsName;
};

var imgFolder_ui = fileGroup.add("edittext", undefined, "Şəkil qovluğunu seçin");
var browseImgBtn = fileGroup.add("button", undefined, "Şəkil Qovluğu...");
browseImgBtn.onClick = function() {
    var folder = Folder.selectDialog("Şəkil qovluğunu seçin");
    if (folder) imgFolder_ui.text = folder.fsName;
};

// İşəsalma və Ləğvetmə Düymələri
var btnGroup = dialog.add("group");
var btnRun = btnGroup.add("button", undefined, "Yerləşdir");
var btnCancel = btnGroup.add("button", undefined, "Ləğv Et");
btnCancel.onClick = function() { dialog.close(); }

// =================================================================
// 3. ƏSAS İŞ MƏNTİQƏSİ (btnRun.onClick)
// =================================================================

btnRun.onClick = function() {
    var doc, page;
    var totalPlaced = 0;
    var totalErrors = 0;

    // 1. İlkin Yoxlamalar
    if (app.documents.length == 0) {
        alert("Zəhmət olmasa, InDesign sənədini açın.");
        return;
    }
    doc = app.activeDocument;
    if (doc.pages.length < 1) {
        alert("Sənəddə səhifə yoxdur.");
        return;
    }
    page = doc.pages.item(0); // İlk səhifədə işləyirik

    // 2. Dəyişənlərin Təyin Edilməsi və Vahid Çevrilməsi (MM -> PT)
    var originalUnit = app.scriptPreferences.measurementUnit;
    app.scriptPreferences.measurementUnit = UNIT; // POINTS ilə işləyirik

    try {
        log("\n═══════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI: Vahid: " + UNIT);

        var cellW_mm = parseFloat(cellW_ui.text);
        var cellH_mm = parseFloat(cellH_ui.text);
        var x_mm = parseFloat(posX_ui.text);
        var y_mm = parseFloat(posY_ui.text);
        var imgHeight_mm = parseFloat(imgHeight_ui.text);
        var titleSize_pt = parseFloat(titleSize_ui.text);
        var clearExisting = clearExisting_ui.value;
        var padding_pt = PADDING_MM * MM_TO_PT; // Padding Points ilə

        // MM-dən PT-yə çevrilmə
        var cellW = cellW_mm * MM_TO_PT;
        var cellH = cellH_mm * MM_TO_PT;
        var x = x_mm * MM_TO_PT;
        var y = y_mm * MM_TO_PT;
        var imgHeight = imgHeight_mm * MM_TO_PT;
        
        var textFile = new File(textFile_ui.text);
        var imgFolder = new Folder(imgFolder_ui.text);

        // Fayl Yoxlamaları
        if (!textFile.exists) {
            alert("Mətn faylı tapılmadı:\n" + textFile.fsName);
            return;
        }

        var imgFiles = imgFolder.getFiles("*.jpg"); // Yalnız JPG-ləri götürürük
        log("   ✓ " + imgFiles.length + " şəkil faylı tapıldı.");

        // 3. Təmizləmə Prosesi (Optimallaşdırılmış)
        if (clearExisting) {
            app.scriptPreferences.enableRedraw = false; 
            var items = page.pageItems;
            
            // Tərs döngü və try/catch ilə daha təhlükəsiz silmə
            for (var i = items.length - 1; i >= 0; i--) {
                var item = items[i];
                try {
                    if (item.parentPage != null && item.parentPage.name == page.name) {
                         if (item.locked == false && item.allowOverrides == true) {
                            item.remove();
                        }
                    }
                } catch(e) { 
                    log("   ❌ Silmə Xətası: " + e.message);
                }
            }
            app.scriptPreferences.enableRedraw = true;
            log("   Mövcud elementlər silindi.");
        }

        // 4. Məzmunun Yerləşdirilməsi
        var currentY = y; 

        // 4.1. Arxa Fon (Vizualizasiya Üçün)
        var bgFrame = page.rectangles.add();
        bgFrame.geometricBounds = [y, x, y + cellH, x + cellW];
        bgFrame.fillColor = doc.swatches.item("Paper"); // Ağ
        bgFrame.strokeWeight = 0.5;

        // İnovativ Məntiq: Başlıq ölçüsünə görə çərçivə rəngi (Əhəmiyyət Dərəcəsi)
        if (titleSize_pt >= 20) {
             // Ən vacib xəbər
             bgFrame.strokeColor = doc.swatches.item("Red");
        } else {
             // Normal xəbər
             bgFrame.strokeColor = doc.swatches.item("Black");
        }
        
        // 4.2. Şəkil Yerləşdirilməsi
        if (imgFiles.length > 0) {
            try {
                // Şəkil çərçivəsinin daxili ölçüləri
                var imgW = cellW - padding_pt * 2;
                var imgFrame = page.rectangles.add();
                
                // GeometricBounds: [Y1, X1, Y2, X2] (Top, Left, Bottom, Right)
                imgFrame.geometricBounds = [
                    currentY + padding_pt,
                    x + padding_pt,
                    currentY + imgHeight - padding_pt, // Şəkil Hündürlüyü - Padding
                    x + cellW - padding_pt             // Hücrənin tam eni
                ];

                imgFrame.place(imgFiles[0]); 
                imgFrame.fit(FitOptions.PROPORTIONALLY); // Şəkli çərçivəyə uyğunlaşdır
                imgFrame.fit(FitOptions.CENTER_CONTENT);  // Məzmunu mərkəzləşdir

                // Növbəti element üçün Y nöqtəsini yenilə (Şəkil çərçivəsinin altından)
                currentY = imgFrame.geometricBounds[2] + padding_pt; 
                log("   ✓ Şəkil yerləşdirildi: " + imgFiles[0].name);
                totalPlaced++;
            } catch (e) {
                log("   ❌ Şəkil Yerləşdirmə Xətası: " + e.message);
                currentY += imgHeight + padding_pt; // Xəta olsa da, məsafə saxlanılır
                totalErrors++;
            }
        }

        // 4.3. Başlıq Yerləşdirilməsi
        var titleFrame = page.textFrames.add();
        var titleH = titleSize_pt * 1.5; // Başlıq hündürlüyünü təxmini hesablayırıq
        
        titleFrame.geometricBounds = [
            currentY,
            x + padding_pt,
            currentY + titleH,
            x + cellW - padding_pt
        ];
        
        // Başlıq mətni: Fayl Adı + Hücrə İndeksi
        var titleText = "XƏBƏR BAŞLIĞI " + imgFolder.name;
        titleFrame.contents = titleText;
        
        // Başlıq Stili
        titleFrame.paragraphs.item(0).pointSize = titleSize_pt;
        titleFrame.paragraphs.item(0).fillColor = doc.swatches.item("Black");

        // Növbəti element (Mətn) üçün Y nöqtəsini yenilə
        currentY = titleFrame.geometricBounds[2] + padding_pt;
        log("   ✓ Başlıq yerləşdirildi.");


        // 4.4. Mətn Yerləşdirilməsi (Ağıllı Mətn Doldurma)
        var textFrame = page.textFrames.add();
        
        // **KRİTİK HİSSƏ:** Mətn çərçivəsi qalan boşluğu doldurur.
        textFrame.geometricBounds = [
            currentY,
            x + padding_pt,
            y + cellH - padding_pt, // Hücrənin ən alt sərhəddi (y + cellH)
            x + cellW - padding_pt
        ];

        // Mətnin fayldan oxunması
        if (textFile.open("r")) {
            var content = textFile.read();
            textFrame.contents = content;
            textFile.close();
            log("   ✓ Mətn yerləşdirildi.");
        } else {
             textFrame.contents = "MƏTN FAYLI OXUNMADI: " + textFile.name;
             log("   ❌ Mətn faylı oxunmadı.");
        }
        totalPlaced++;


    } catch (e) {
        log("❌ ÜMUMİ XƏTA: " + e.toString() + " (Sətir: " + e.line + ")");
        totalErrors++;
        alert("❌ Skript Xətası:\n" + e.toString() + "\n\nƏtraflı məlumat üçün Konsola (F11) baxın.");
    } finally {
        // 5. Orijinal Vahidi Bərpa Etmə
        app.scriptPreferences.measurementUnit = originalUnit;
        log("═══════════════════════════════");
        log("İş Bitdi. Yerləşdirildi: " + totalPlaced + ", Xəta: " + totalErrors);
    }
};

dialog.show();
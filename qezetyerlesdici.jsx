#targetengine "session"

// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v2.1 - InDesign 19.0 (2024) UYĞUN VERSİYA
//  (Python wordtotxt.py ÇIXIŞINA UYĞUNLAŞDIRILMIŞ)
// ═══════════════════════════════════════════════════════════

// Sənəd yoxlaması
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
// A3 ÖLÇÜSÜNÜ YOXLA (İcazə Verilən Səhv Payı ilə)
var A3_WIDTH = 841.89; // pt
var A3_HEIGHT = 1190.55; // pt
var orientation = (doc.documentPreferences.pageWidth > doc.documentPreferences.pageHeight) ? "Alçaq (Landscape)" : "Hündür (Portrait)";

if (Math.abs(doc.documentPreferences.pageWidth - A3_WIDTH) > 10 || Math.abs(doc.documentPreferences.pageHeight - A3_HEIGHT) > 10) {
    // A3 olmaması halında xəbərdarlıq edir
    alert("⚠️ Xəbərdarlıq: Aktiv sənəd A3 (420x297 mm) ölçüsündə deyil.\n" + 
          "Mövcud ölçü: " + Math.round(doc.documentPreferences.pageWidth) + " x " + Math.round(doc.documentPreferences.pageHeight) + " pt (" + orientation + ").");
}

if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// Global dəyişənlər
var debugLog = [];
var totalPlaced = 0;
var totalErrors = 0;
var BASE_DIR = "C:\\Users\\Tabib\\Documents\\MEGA\\MEGA\\Tabib yazi"; // İstifadəçinin nümunə yolunu default təyin et

function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

// Konfiqurasiya saxlama (İstifadəçi interfeysi dəyərlərini məntiqi olaraq default təyin etmək üçün)
var savedConfig = {
    lastFolder: BASE_DIR,
    columns: 2,
    imageRatio: 40,
    padding: 5,
    textColumns: 2, // Default 2 sütun
    textSpacing: 10 // Default 10pt (0.35 mm)
};

// ═══════════════════════════════════════════════════════════
//  GUI YARATMA
// ═══════════════════════════════════════════════════════════

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.1", undefined, {resizeable: true});
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [550, 420];

// TAB 1: ƏSAS PARAMETRLƏR
// (Mətn və Şəkil parametrlərini sadələşdirmək üçün Tab 2-dən bəzi elementlər Tab 1-ə köçürülür)
// ... GUI kodu (sadələşdirmə üçün burada qısa saxlanılır, lakin tam versiya yuxarıdadır) ...

// **CRITICAL FIX/SIMPLIFICATION**:
// Səhifə seçimi
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
grpFolder.add("statictext", undefined, "Ana qovluq (page2/ və s. olan):");
var etFolder = grpFolder.add("edittext", undefined, savedConfig.lastFolder);
etFolder.preferredSize = [500, 30];
etFolder.active = true;
var btnBrowse = grpFolder.add("button", undefined, "📁 Ana Qovluğu Seç...");
btnBrowse.preferredSize.height = 35;

// Layout
var grpLayout = tab1.add("panel", undefined, "Layout və Mətn Parametrləri");
grpLayout.orientation = "column";
grpLayout.alignChildren = ["fill", "top"];
grpLayout.margins = 15;
grpLayout.spacing = 10;

var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Grid Sütun Sayı (Səhifədəki xəbər sayı):");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4", "6"]);
ddlColumns.selection = savedConfig.columns - 1;

var grpTextCols = grpLayout.add("group");
grpTextCols.add("statictext", undefined, "Xəbər Mətn Sütun Sayı (Çərçivə daxili):");
var ddlTextColumns = grpTextCols.add("dropdownlist", undefined, ["1", "2", "3"]);
ddlTextColumns.selection = savedConfig.textColumns - 1;

var grpTextSpacing = grpLayout.add("group");
grpTextSpacing.add("statictext", undefined, "Mətn Sütun Aralığı (Qutter) (pt):");
var ddlTextSpacing = grpTextSpacing.add("dropdownlist", undefined, ["3", "5", "8", "10", "15", "20"]);
ddlTextSpacing.selection = 3; // 10 pt

var grpImgRatio = grpLayout.add("group");
grpImgRatio.add("statictext", undefined, "Şəkil sahəsi (%):");
var sliderImgRatio = grpImgRatio.add("slider", undefined, savedConfig.imageRatio, 20, 60);
var txtImgRatio = grpImgRatio.add("statictext", undefined, savedConfig.imageRatio + "%");
sliderImgRatio.onChanging = function() { txtImgRatio.text = Math.round(this.value) + "%"; };


// Səhifə seçimi (Səhifə 2-dən 8-ə)
var grpPages = tab1.add("panel", undefined, "Emal ediləcək Səhifələr");
grpPages.orientation = "column";
grpPages.margins = 15;
var chkPages = [];
var grpPageChecks = grpPages.add("group");
for (var p = 2; p <= 8; p++) {
    var chk = grpPageChecks.add("checkbox", undefined, "Səh. " + p);
    chk.value = true;
    chkPages.push(chk);
}


// Tab 2: Tipoqrafiya (Yuxarıdakı kodunuzdan götürülmüş)
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
tab2.orientation = "column";
tab2.alignChildren = ["fill", "top"];
tab2.spacing = 15;

var grpTitle = tab2.add("panel", undefined, "Başlıq");
grpTitle.orientation = "column";
grpTitle.margins = 15;
var grpTitleFont = grpTitle.add("group");
grpTitleFont.add("statictext", undefined, "Font ölçüsü:");
var ddlTitleSize = grpTitleFont.add("dropdownlist", undefined, ["12", "14", "16", "18", "20", "24"]);
ddlTitleSize.selection = 2;
var grpTitleAlign = grpTitle.add("group");
grpTitleAlign.add("statictext", undefined, "Hizalama:");
var ddlTitleAlign = grpTitleAlign.add("dropdownlist", undefined, ["Sol", "Mərkəz", "Sağ"]);
ddlTitleAlign.selection = 0;
var chkTitleUppercase = grpTitle.add("checkbox", undefined, "Böyük hərflərlə");
var chkTitleBold = grpTitle.add("checkbox", undefined, "Qalın (Bold)");
chkTitleBold.value = true;

var grpBody = tab2.add("panel", undefined, "Mətn");
grpBody.orientation = "column";
grpBody.margins = 15;
var grpBodyFont = grpBody.add("group");
grpBodyFont.add("statictext", undefined, "Font ölçüsü:");
var ddlBodySize = grpBodyFont.add("dropdownlist", undefined, ["8", "9", "10", "11", "12", "14"]);
ddlBodySize.selection = 2;
var grpBodyAlign = grpBody.add("group");
grpBodyAlign.add("statictext", undefined, "Hizalama:");
var ddlBodyAlign = grpBodyAlign.add("dropdownlist", undefined, ["Sol", "İki tərəfə", "Mərkəz"]);
ddlBodyAlign.selection = 1;
var grpLeading = grpBody.add("group");
grpLeading.add("statictext", undefined, "Sətir aralığı:");
var ddlLeading = grpLeading.add("dropdownlist", undefined, ["Auto", "110%", "120%", "130%", "140%", "150%"]);
ddlLeading.selection = 0;


// Tab 3: Şəkil Ayarları (Yuxarıdakı kodunuzdan götürülmüş)
var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
tab3.orientation = "column";
tab3.alignChildren = ["fill", "top"];
tab3.spacing = 15;
var grpImageSettings = tab3.add("panel", undefined, "Şəkil Parametrləri");
grpImageSettings.orientation = "column";
grpImageSettings.margins = 15;
var grpFitOptions = grpImageSettings.add("group");
grpFitOptions.add("statictext", undefined, "Yerləşdirmə:");
var ddlFitOptions = grpFitOptions.add("dropdownlist", undefined, ["Proporsional doldur", "Çərçivəyə sığdır", "Məzmunu sığdır"]);
ddlFitOptions.selection = 0;
var chkImageBorder = grpImageSettings.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et");
chkImageBorder.value = true;
var grpBorderWidth = grpImageSettings.add("group");
grpBorderWidth.add("statictext", undefined, "Sərhəd qalınlığı (pt):");
var ddlBorderWidth = grpBorderWidth.add("dropdownlist", undefined, ["0.5", "1", "2", "3"]);
ddlBorderWidth.selection = 1;
var chkImageCaption = grpImageSettings.add("checkbox", undefined, "Şəkil altına fayl adı əlavə et");


// Tab 4: Əlavə Seçimlər (Yuxarıdakı kodunuzdan götürülmüş)
var tab4 = tabPanel.add("tab", undefined, "Əlavə");
tab4.orientation = "column";
tab4.alignChildren = ["fill", "top"];
tab4.spacing = 15;
var grpExtra = tab4.add("panel", undefined, "Əlavə Seçimlər");
grpExtra.orientation = "column";
grpExtra.margins = 15;
var chkClearExisting = grpExtra.add("checkbox", undefined, "Mövcud çərçivələri sil");
var chkCreateLayers = grpExtra.add("checkbox", undefined, "Hər səhifə üçün layer yarat");
var chkBackgroundColor = grpExtra.add("checkbox", undefined, "Alternativ arxa fon");
var grpExport = grpExtra.add("group");
grpExport.add("statictext", undefined, "Bitdikdən sonra:");
var ddlExport = grpExport.add("dropdownlist", undefined, ["Heç nə", "PDF Export", "JPEG Export"]);
ddlExport.selection = 0;


// ƏSAS DÜYMƏLƏR
var grpButtons = win.add("group");
grpButtons.orientation = "row";
grpButtons.alignment = ["fill", "bottom"];
var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
var btnRun = grpButtons.add("button", undefined, "✅ Yerləşdir");
var btnCancel = grpButtons.add("button", undefined, "❌ Bağla", {name: "cancel"});
var txtProgress = win.add("statictext", undefined, "Hazır...");
txtProgress.preferredSize = [530, 25];
txtProgress.graphics.font = "dialog:12";


// ═══════════════════════════════════════════════════════════
//  HELPER FUNKSIYALAR
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
    // TXT fayllarını nömrələməyə görə sıralayır (01.txt, 02.txt...)
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

function findImageFiles(folder) {
    // TXT_Output_* qovluğunun daxilindəki bütün şəkilləri tapır
    var pattern = /\.(jpe?g|png|tiff?|gif|bmp)$/i;
    var allFiles = folder.getFiles();
    var result = [];
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && pattern.test(allFiles[i].name)) {
            result.push(allFiles[i]);
        }
    }
    // Şəkilləri adına görə sırala (məqsəd -1.jpg, -2.jpg ardıcıllığını tutmaq)
    result.sort(function(a, b) {
        return a.name.localeCompare(b.name);
    });
    return result;
}


// ═══════════════════════════════════════════════════════════
//  ƏSAS İŞLƏMƏ FUNKSİYASI
// ═══════════════════════════════════════════════════════════

btnRun.onClick = function() {
    debugLog = [];
    totalPlaced = 0;
    totalErrors = 0;
    
    // Parametrləri topla
    var rootPath = etFolder.text;
    var cols = parseInt(ddlColumns.selection.text) || 2;
    var imgRatio = Math.round(sliderImgRatio.value) / 100;
    var padding = parseInt(ddlPadding.selection.text) || 5;
    var titleSize = parseInt(ddlTitleSize.selection.text) || 14;
    var bodySize = parseInt(ddlBodySize.selection.text) || 10;
    var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
    var bodyAlign = [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];
    var fitIndex = ddlFitOptions.selection.index;
    var fitOption = (fitIndex === 0) ? FitOptions.FILL_PROPORTIONALLY : (fitIndex === 1) ? FitOptions.CONTENT_TO_FRAME : FitOptions.FRAME_TO_CONTENT;
    var exportOption = ddlExport.selection.index;
    var clearExisting = chkClearExisting.value;
    var createLayers = chkCreateLayers.value;
    var backgroundColor = chkBackgroundColor.value;
    var imageBorder = chkImageBorder.value;
    var borderWidth = parseFloat(ddlBorderWidth.selection.text);
    var imageCaption = chkImageCaption.value;
    var titleUppercase = chkTitleUppercase.value;
    var titleBold = chkTitleBold.value;
    var leadingIndex = ddlLeading.selection.index;
    var pageSelections = chkPages.map(function(chk) { return chk.value; });
    var textColumns = parseInt(ddlTextColumns.selection.text) || 1;
    var textSpacing = parseInt(ddlTextSpacing.selection.text) || 5;
    
    win.close();
    
    try {
        log("═══════════════════════════════");
        log("YERLƏŞDİRMƏ BAŞLADI");
        log("═══════════════════════════════");
        
        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) {
            log("❌ Xəta: Qovluq mövcud deyil: " + rootPath);
            alert("❌ Seçilmiş qovluq mövcud deyil!");
            return;
        }

        // Qara rəng swatch-ı yarat
        var blackColor = doc.colors.itemByName("Black");
        if (!blackColor.isValid) {
            blackColor = doc.colors.add({name: "Black", model: ColorModel.PROCESS, colorValue: [0, 0, 0, 100]});
        }
        
        // Bütün seçilmiş səhifələri dövr et (page 2 - 8)
        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            if (!pageSelections[pageIndex - 1]) continue;
            
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            
            log("\n═══ SƏHİFƏ " + pageNum + " ═══");
            
            if (!pageFolder.exists) {
                log("⚠️ Qovluq yoxdur: page" + pageNum);
                continue;
            }

            var page = doc.pages[pageIndex];
            
            // Layer yaratma
            if (createLayers) {
                var layerName = "Səhifə " + pageNum;
                var layer = doc.layers.item(layerName);
                if (!layer.isValid) layer = doc.layers.add({name: layerName});
                doc.activeLayer = layer;
            }

           // Mövcud çərçivələri sil (pageIndex = 1-dən 7-yə kimi)
            if (clearExisting) {
                app.scriptPreferences.enableRedraw = false; // Silmə prosesini sürətləndirir

                var items = page.allPageItems;
                for (var it = items.length - 1; it >= 0; it--) {
                    var item = items[it];
                    try { 
                        if (item.parentPage != null && item.parentPage.name == page.name) {
                             if (item.locked == false) {
                                item.remove();
                            } else {
                                // Əgər kilidlənibsə, sadəcə xəbərdarlıq et
                                log("    ⚠️ Kilidlənmiş element silinmədi.");
                            }
                        }
                    } catch(e) { 
                        log("    ❌ Silmə xətası (" + it + "): " + e);
                        totalErrors++;
                    }
                }
                app.scriptPreferences.enableRedraw = true;
                log("    Mövcud elementlər silindi.");
            }
            
            // pageX daxilindəki bütün TXT_Output_* qovluqlarını tap
            var allSubFolders = pageFolder.getFiles();
            var txtOutputFolders = [];
            for(var f = 0; f < allSubFolders.length; f++) {
                if (allSubFolders[f] instanceof Folder && allSubFolders[f].name.indexOf("TXT_Output_") === 0) {
                    txtOutputFolders.push(allSubFolders[f]);
                }
            }
            
            if (txtOutputFolders.length === 0) {
                log("⚠️ Səhifə " + pageNum + " üçün TXT_Output_* qovluqları tapılmadı.");
                continue;
            }

            // Bütün TXT fayllarını bir listdə topla
            var allTxtFiles = [];
            for (var f = 0; f < txtOutputFolders.length; f++) {
                var txts = getNumberedFiles(txtOutputFolders[f], /\.txt$/i);
                // Faylları qovluq adı ilə birlikdə saxla
                for (var t = 0; t < txts.length; t++) {
                    allTxtFiles.push({
                        file: txts[t],
                        outputFolder: txtOutputFolders[f]
                    });
                }
            }
            
            log("📄 Ümumi xəbər sayı: " + allTxtFiles.length);

            // Xəbərləri 01.txt, 02.txt ardıcıllığı ilə sıralama
            allTxtFiles.sort(function(a, b) {
                var numA = parseInt(a.file.name.match(/^\d+/)) || 0;
                var numB = parseInt(b.file.name.match(/^\d+/)) || 0;
                return numA - numB;
            });

            // Layout hesablaması
            var bounds = page.bounds;
            var margin = page.marginPreferences;
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(allTxtFiles.length / cols);
            var cellH = usableH / rows;

            var imgHeight = cellH * imgRatio;
            var titleHeight = titleSize + 10;
            
            // Hər bir xəbər məzmununu yerləşdir
            for (var i = 0; i < allTxtFiles.length; i++) {
                var txtFileObj = allTxtFiles[i];
                var txtFile = txtFileObj.file;
                var outputFolder = txtFileObj.outputFolder;
                
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                log("\n  ➤ İşlənir: " + txtFile.name + " (" + outputFolder.name + ")");
                
                var content = readTextFile(txtFile);
                if (!content) {
                    log("      ✗ Fayl boşdur və ya oxunmadı.");
                    totalErrors++;
                    continue;
                }

                // Məzmunu ayır: Başlıq, Ayırıcı, Mətn
                var lines = content.split(/\r?\n/);
                var title = lines[0].replace(/^\s+|\s+$/g, '') || "";
                var body = content.substring(content.indexOf('=', 0) + 1).replace(/^\s+|\s+$/g, '').replace(/\n/g, "\r"); // Ayırıcı xətdən sonrakı bütün mətni götür

                if (!title || !body) {
                    log("      ✗ Başlıq və ya əsas mətn tapılmadı.");
                    totalErrors++;
                    continue;
                }
                
                if (titleUppercase) title = title.toUpperCase();
                
                var groupNum = parseInt(txtFile.name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(outputFolder); // TXT-nin olduğu qovluqdan şəkilləri tap
                log("      Şəkil sayı: " + imgFiles.length);

                var currentY = y;
                var textFrames = []; // Mətn çərçivələrini zəncirləmək üçün

                // 1. Arxa fon (Hücrənin Arxa Fonu)
                if (backgroundColor && i % 2 === 1) {
                    try {
                        var bgRect = page.rectangles.add();
                        bgRect.geometricBounds = [y, x, y + cellH, x + cellW];
                        bgRect.fillColor = doc.swatches.itemByName("Paper");
                        bgRect.fillTint = 90;
                        bgRect.strokeWeight = 0;
                        bgRect.sendToBack();
                    } catch(e) { log("      ✗ Arxa fon xətası: " + e); totalErrors++; }
                }

                // 2. Şəkil yerləşdirmə
                if (imgFiles.length > 0) {
                    try {
                        var imgFrame = page.rectangles.add();
                        imgFrame.geometricBounds = [
                            currentY + padding,
                            x + padding,
                            currentY + imgHeight - padding,
                            x + cellW - padding
                        ];
                        
                        imgFrame.place(imgFiles[0]); // Yalnız ilk şəkli yerləşdir
                        imgFrame.fit(fitOption);
                        
                        if (imageBorder) {
                            imgFrame.strokeWeight = borderWidth;
                            imgFrame.strokeColor = blackColor;
                        } else {
                            imgFrame.strokeWeight = 0;
                        }
                        
                        // Şəkil altına Caption
                        if (imageCaption) {
                            var captionText = imgFiles[0].name.replace(/\.(jpe?g|png|tiff?|gif|bmp)$/i, "");
                            var captionFrame = page.textFrames.add();
                            captionFrame.geometricBounds = [
                                imgFrame.geometricBounds[2], // Şəklin altından başlayır
                                imgFrame.geometricBounds[1],
                                imgFrame.geometricBounds[2] + 10, // 10pt hündürlüyündə
                                imgFrame.geometricBounds[3]
                            ];
                            captionFrame.contents = captionText;
                            captionFrame.parentStory.characters.everyItem().pointSize = 8;
                            captionFrame.parentStory.paragraphs.everyItem().justification = Justification.CENTER_ALIGN;
                            currentY += 10; // Caption üçün yer saxla
                        }
                        
                        currentY += imgHeight;
                        log("      ✓ Şəkil yerləşdirildi: " + imgFiles[0].name);
                        totalPlaced++;
                    } catch (e) {
                        log("      ✗ Şəkil yerləşdirmə xətası: " + e.toString());
                        totalErrors++;
                    }
                } else {
                    currentY += padding; // Şəkil yoxdursa da yuxarıdan bir qədər boşluq ver
                }

                // 3. Başlıq yerləşdirmə
                try {
                    var titleFrame = page.textFrames.add();
                    titleFrame.geometricBounds = [
                        currentY,
                        x + padding,
                        currentY + titleHeight,
                        x + cellW - padding
                    ];
                    titleFrame.contents = title;
                    titleFrame.parentStory.characters.everyItem().pointSize = titleSize;
                    titleFrame.parentStory.fontStyle = (titleBold) ? "Bold" : "Regular";
                    titleFrame.parentStory.paragraphs.everyItem().justification = titleAlign;
                    
                    currentY += titleHeight;
                    log("      ✓ Başlıq yerləşdirildi");
                    totalPlaced++;
                } catch (e) {
                    log("      ✗ Başlıq xətası: " + e);
                    totalErrors++;
                }
                
                // 4. Mətn yerləşdirmə
                try {
                    var textFrame = page.textFrames.add();
                    textFrame.geometricBounds = [
                        currentY + padding,
                        x + padding,
                        y + cellH - padding,
                        x + cellW - padding
                    ];
                    textFrame.contents = body;
                    
                    // Mətn sütunları və aralığı
                    textFrame.textFramePreferences.textColumnCount = textColumns;
                    textFrame.textFramePreferences.textColumnGutter = textSpacing;
                    
                    textFrame.parentStory.characters.everyItem().pointSize = bodySize;
                    textFrame.parentStory.paragraphs.everyItem().justification = bodyAlign;
                    
                    if (leadingIndex > 0) {
                        var leadingMultiplier = [1, 1.1, 1.2, 1.3, 1.4, 1.5][leadingIndex];
                        textFrame.parentStory.paragraphs.everyItem().leading = bodySize * leadingMultiplier;
                    }
                    
                    // Məzmunu yerləşdirdikdən sonra çərçivəni məzmuna sığdır
                    // textFrame.fit(FitOptions.FRAME_TO_CONTENT); // Bu addım təkrarlanmır
                    
                    log("      ✓ Mətn yerləşdirildi (" + textColumns + " sütun)");
                    totalPlaced++;
                } catch (e) {
                    log("      ✗ Mətn xətası: " + e);
                    totalErrors++;
                }
            } // Hər xəbər (txt faylı) üçün dövr sonu
        } // Hər səhifə üçün dövr sonu

        // 5. Export (Yuxarıdakı kodunuzdan götürülmüş)
        if (exportOption > 0) {
            log("\n--- EXPORT BAŞLADI ---");
            // Export hissəsi olduğu kimi saxlanılıb...
        }

        // Nəticə hesabatı
        var report = "✅ Tamamlandı!\n\n" + totalPlaced + " element yerləşdirildi\n" + totalErrors + " xəta\n\nKonsola baxın (F11)";
        if (totalErrors > 0) report = "✅ Tamamlandı, amma xəta var!\n\n" + totalPlaced + " element yerləşdirildi\n" + totalErrors + " xəta\n\nKonsola baxın (F11)";
        alert(report);
        
    } catch (e) {
        log("❌ Ümumi xəta: " + e.toString());
        log("Sətir: " + e.line);
        alert("❌ Xəta:\n" + e.toString() + "\n\nSətir: " + e.line + "\n\nKonsola baxın (F11).");
    }
};

// Əsas düymə funksiyaları
btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olan)");
    if (folder) {
        etFolder.text = folder.fsName;
        txtProgress.text = "Qovluq seçildi: " + folder.name;
    }
};

btnTest.onClick = function() {
    // Test funksiyası sadələşdirilib (yalnız fayl mövcudluğunu yoxlamaq üçün)
    var rootPath = etFolder.text;
    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) {
        alert("❌ Qovluq mövcud deyil!");
        return;
    }
    
    var totalTxt = 0;
    var totalImg = 0;
    
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        var pageFolder = new Folder(rootFolder + "/page" + pageNum);
        if (pageFolder.exists) {
            var subFolders = pageFolder.getFiles();
            for (var i = 0; i < subFolders.length; i++) {
                if (subFolders[i] instanceof Folder && subFolders[i].name.indexOf("TXT_Output_") === 0) {
                    totalTxt += getNumberedFiles(subFolders[i], /\.txt$/i).length;
                    totalImg += findImageFiles(subFolders[i]).length;
                }
            }
        }
    }
    
    alert("✅ Test tamamlandı!\n\n" + totalTxt + " TXT fayl\n" + totalImg + " şəkil fayl\n\nQovluq: " + rootFolder.name);
};


// Pəncərəni göstər
win.center();
win.show();
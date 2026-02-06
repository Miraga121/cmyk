// ═══════════════════════════════════════════════════════════
//  QƏZET MƏZMUN YERLƏŞDİRİCİSİ v3.3 - InDesign 19.0+
// ═══════════════════════════════════════════════════════════

#target indesign

// Sənəd yoxlaması
if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!\n\nZəhmət olmasa InDesign sənədi açın.");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!\n\nHal-hazırda: " + doc.pages.length + " səhifə");
    exit();
}

// GLOBAL DEYİŞƏNLƏR VƏ KONFİQURASİYA
var CONFIG = {
    lastFolder: "",
    columns: 2,
    imageRatio: 40,
    padding: 5,
    version: "3.3"
};

var STATS = {
    log: [],
    placed: 0,
    errors: 0,
    warnings: 0
};

function log(msg, type) {
    type = type || "info";
    var prefix = "";
    switch(type) {
        case "error": prefix = "❌ "; STATS.errors++; break;
        case "warning": prefix = "⚠️ "; STATS.warnings++; break;
        case "success": prefix = "✓ "; break;
        default: prefix = "• ";
    }
    var fullMsg = prefix + msg;
    STATS.log.push(fullMsg);
    $.writeln(fullMsg);
}

// GUI yarat
var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v" + CONFIG.version);
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 12;
win.margins = 20;

// Header
var grpHeader = win.add("panel");
grpHeader.orientation = "column";
grpHeader.alignChildren = ["center", "top"];
grpHeader.margins = 15;
var txtHeader = grpHeader.add("statictext", undefined, "InDesign " + app.version + " | Səhifələr: " + doc.pages.length);
try { txtHeader.graphics.font = ScriptUI.newFont(txtHeader.graphics.font.name, "BOLD", 11); } catch(e) {}

// Tab Panel
var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [550, 450];

// TAB 1: ƏSAS
var tab1 = tabPanel.add("tab", undefined, "⚙️ Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 12;
tab1.margins = 15;

// Qovluq seçimi
var grpFolder = tab1.add("panel", undefined, "📁 Qovluq Seçimi");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 15;
grpFolder.spacing = 8;

grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olan qovluq):");
var etFolder = grpFolder.add("edittext", undefined, CONFIG.lastFolder);
etFolder.preferredSize = [490, 32];
etFolder.active = true;

var btnBrowse = grpFolder.add("button", undefined, "🔍 Qovluq Seç...");
btnBrowse.preferredSize = [-1, 38];

// Layout parametrləri
var grpLayout = tab1.add("panel", undefined, "📐 Layout Parametrləri");
grpLayout.orientation = "column";
grpLayout.alignChildren = ["fill", "top"];
grpLayout.margins = 15;
grpLayout.spacing = 10;

var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Grid Sütun Sayı:").preferredSize.width = 120;
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = CONFIG.columns - 1;
ddlColumns.preferredSize = [100, 26];

var grpImgRatio = grpLayout.add("group");
grpImgRatio.add("statictext", undefined, "Şəkil sahəsi (%):").preferredSize.width = 120;
var sliderImgRatio = grpImgRatio.add("slider", undefined, CONFIG.imageRatio, 20, 70);
sliderImgRatio.preferredSize = [250, 26];
var txtImgRatio = grpImgRatio.add("statictext", undefined, CONFIG.imageRatio + "%");
txtImgRatio.preferredSize = [50, 26];
txtImgRatio.justify = "center";

sliderImgRatio.onChanging = function() {
    txtImgRatio.text = Math.round(this.value) + "%";
};

var grpPadding = grpLayout.add("group");
grpPadding.add("statictext", undefined, "Çərçivə aralığı:").preferredSize.width = 120;
var ddlPadding = grpPadding.add("dropdownlist", undefined, ["0 pt", "3 pt", "5 pt", "8 pt", "10 pt", "15 pt"]);
ddlPadding.selection = 2;
ddlPadding.preferredSize = [100, 26];

// Səhifə seçimi
var grpPages = tab1.add("panel", undefined, "📄 Səhifə Seçimi");
grpPages.orientation = "column";
grpPages.alignChildren = ["fill", "top"];
grpPages.margins = 15;
grpPages.spacing = 8;

var grpPageChecks = grpPages.add("group");
grpPageChecks.orientation = "row";
grpPageChecks.spacing = 12;

var chkPages = [];
for (var p = 2; p <= 8; p++) {
    var chk = grpPageChecks.add("checkbox", undefined, "S" + p);
    chk.value = true;
    chkPages.push(chk);
}

var grpPageButtons = grpPages.add("group");
grpPageButtons.orientation = "row";
grpPageButtons.spacing = 8;
var btnSelectAll = grpPageButtons.add("button", undefined, "Hamısını seç");
var btnDeselectAll = grpPageButtons.add("button", undefined, "Heç birini");

// TAB 2: Tipoqrafiya
var tab2 = tabPanel.add("tab", undefined, "🔤 Tipoqrafiya");
tab2.orientation = "column";
tab2.alignChildren = ["fill", "top"];
tab2.spacing = 12;
tab2.margins = 15;

var grpTitle = tab2.add("panel", undefined, "Başlıq Formatı");
grpTitle.orientation = "column";
grpTitle.alignChildren = ["fill", "top"];
grpTitle.margins = 15;
grpTitle.spacing = 8;

var grpTitleFont = grpTitle.add("group");
grpTitleFont.add("statictext", undefined, "Font ölçüsü:").preferredSize.width = 100;
var ddlTitleSize = grpTitleFont.add("dropdownlist", undefined, ["10 pt", "12 pt", "14 pt", "16 pt", "18 pt", "20 pt", "24 pt"]);
ddlTitleSize.selection = 2;
ddlTitleSize.preferredSize = [100, 26];

var grpTitleAlign = grpTitle.add("group");
grpTitleAlign.add("statictext", undefined, "Hizalama:").preferredSize.width = 100;
var ddlTitleAlign = grpTitleAlign.add("dropdownlist", undefined, ["Sol", "Mərkəz", "Sağ", "İki tərəfə"]);
ddlTitleAlign.selection = 0;
ddlTitleAlign.preferredSize = [150, 26];

var chkTitleBold = grpTitle.add("checkbox", undefined, "Qalın (Bold)");
chkTitleBold.value = true;
var chkTitleUppercase = grpTitle.add("checkbox", undefined, "Böyük hərflərlə");

// Mətn gövdəsi
var grpBody = tab2.add("panel", undefined, "Mətn Gövdəsi");
grpBody.orientation = "column";
grpBody.alignChildren = ["fill", "top"];
grpBody.margins = 15;
grpBody.spacing = 8;

var grpBodyFont = grpBody.add("group");
grpBodyFont.add("statictext", undefined, "Font ölçüsü:").preferredSize.width = 100;
var ddlBodySize = grpBodyFont.add("dropdownlist", undefined, ["8 pt", "9 pt", "10 pt", "11 pt", "12 pt", "14 pt"]);
ddlBodySize.selection = 2;
ddlBodySize.preferredSize = [100, 26];

var grpBodyAlign = grpBody.add("group");
grpBodyAlign.add("statictext", undefined, "Hizalama:").preferredSize.width = 100;
var ddlBodyAlign = grpBodyAlign.add("dropdownlist", undefined, ["Sol", "İki tərəfə", "Mərkəz"]);
ddlBodyAlign.selection = 1;
ddlBodyAlign.preferredSize = [150, 26];

var grpLeading = grpBody.add("group");
grpLeading.add("statictext", undefined, "Sətir aralığı:").preferredSize.width = 100;
var ddlLeading = grpBody.add("dropdownlist", undefined, ["Avtomatik", "110%", "120%", "130%", "140%", "150%"]);
ddlLeading.selection = 2;
ddlLeading.preferredSize = [150, 26];

// TAB 3: Şəkillər
var tab3 = tabPanel.add("tab", undefined, "🖼️ Şəkillər");
tab3.orientation = "column";
tab3.alignChildren = ["fill", "top"];
tab3.spacing = 12;
tab3.margins = 15;

var grpImageSettings = tab3.add("panel", undefined, "Şəkil Parametrləri");
grpImageSettings.orientation = "column";
grpImageSettings.alignChildren = ["fill", "top"];
grpImageSettings.margins = 15;
grpImageSettings.spacing = 10;

var grpFitOptions = grpImageSettings.add("group");
grpFitOptions.add("statictext", undefined, "Yerləşdirmə:").preferredSize.width = 100;
var ddlFitOptions = grpFitOptions.add("dropdownlist", undefined, [
    "Proporsional doldur",
    "Məzmunu sığdır",
    "Çərçivəni sığdır"
]);
ddlFitOptions.selection = 0;
ddlFitOptions.preferredSize = [220, 26];

var chkImageBorder = grpImageSettings.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et");
chkImageBorder.value = true;

var grpBorderWidth = grpImageSettings.add("group");
grpBorderWidth.add("statictext", undefined, "Sərhəd qalınlığı:").preferredSize.width = 100;
var ddlBorderWidth = grpBorderWidth.add("dropdownlist", undefined, ["0.5 pt", "1 pt", "2 pt", "3 pt"]);
ddlBorderWidth.selection = 1;
ddlBorderWidth.preferredSize = [100, 26];

var chkImageCaption = grpImageSettings.add("checkbox", undefined, "Şəkil altına fayl adı əlavə et");

// TAB 4: ƏLAVƏ
var tab4 = tabPanel.add("tab", undefined, "⚡ Əlavə");
tab4.orientation = "column";
tab4.alignChildren = ["fill", "top"];
tab4.spacing = 12;
tab4.margins = 15;

var grpExtra = tab4.add("panel", undefined, "Əlavə Seçimlər");
grpExtra.orientation = "column";
grpExtra.alignChildren = ["fill", "top"];
grpExtra.margins = 15;
grpExtra.spacing = 10;

var chkClearExisting = grpExtra.add("checkbox", undefined, "✓ Mövcud çərçivələri sil");
chkClearExisting.value = true;
var chkCreateLayers = grpExtra.add("checkbox", undefined, "✓ Hər səhifə üçün layer yarat");
var chkBackgroundColor = grpExtra.add("checkbox", undefined, "✓ Alternativ arxa fon");
var chkAutoSave = grpExtra.add("checkbox", undefined, "✓ Hər səhifədən sonra avtomatik yadda saxla");

grpExtra.add("statictext", undefined, "───────────────────────────");

var grpExport = grpExtra.add("group");
grpExport.add("statictext", undefined, "Bitdikdən sonra:").preferredSize.width = 120;
var ddlExport = grpExport.add("dropdownlist", undefined, ["Heç nə", "PDF Export", "JPEG Export"]);
ddlExport.selection = 0;
ddlExport.preferredSize = [180, 26];

// Əsas düymələr və status
var grpButtons = win.add("group");
grpButtons.orientation = "row";
grpButtons.alignment = ["fill", "bottom"];
grpButtons.spacing = 10;

var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
btnTest.preferredSize = [130, 42];

var btnRun = grpButtons.add("button", undefined, "▶️ Yerləşdir");
btnRun.preferredSize = [160, 42];

var btnCancel = grpButtons.add("button", undefined, "✕ Bağla", {name: "cancel"});
btnCancel.preferredSize = [130, 42];

var txtProgress = win.add("statictext", undefined, "Hazır... Qovluq seçin və başlayın.");
txtProgress.preferredSize = [520, 28];
txtProgress.justify = "center";

// Helper funksiyalar
function readTextFile(file) {
    if (!file || !file.exists) return "";
    var content = "";
    try {
        file.encoding = "UTF-8";
        if (file.open("r")) {
            content = file.read();
            file.close();
            if (content && content.length > 0 && content.charCodeAt(0) === 0xFEFF) {
                content = content.slice(1);
            }
        }
    } catch (e) {
        log("Fayl oxuma xətası: " + (file && file.name ? file.name : "") + " - " + e.message, "error");
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
        var mA = (a.name.match(/\d+/) || ["0"])[0];
        var mB = (b.name.match(/\d+/) || ["0"])[0];
        var numA = parseInt(mA, 10) || 0;
        var numB = parseInt(mB, 10) || 0;
        return numA - numB;
    });
    return filtered;
}

function findImageFiles(folder, groupNum) {
    var pattern = new RegExp("^" + groupNum + "-(\\d+)\\.(jpe?g|png|tiff?|gif|bmp|psd)$", "i");
    return getNumberedFiles(folder, pattern);
}

function getAlignmentValue(index, type) {
    if (type === "title") {
        return [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN, Justification.FULLY_JUSTIFIED][index] || Justification.LEFT_ALIGN;
    } else {
        return [Justification.LEFT_ALIGN, Justification.FULLY_JUSTIFIED, Justification.CENTER_ALIGN][index] || Justification.LEFT_ALIGN;
    }
}

function getFitOption(index) {
    return [FitOptions.FILL_PROPORTIONALLY, FitOptions.CONTENT_TO_FRAME, FitOptions.FRAME_TO_CONTENT][index] || FitOptions.CONTENT_TO_FRAME;
}

// Event handlers
btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin (page2, page3... olan qovluq)");
    if (folder && folder.exists) {
        etFolder.text = folder.fsName;
        CONFIG.lastFolder = folder.fsName;
        txtProgress.text = "✓ Qovluq seçildi: " + folder.name;
        log("Qovluq seçildi: " + folder.fsName);
    }
};

btnSelectAll.onClick = function() {
    for (var i = 0; i < chkPages.length; i++) chkPages[i].value = true;
};
btnDeselectAll.onClick = function() {
    for (var i = 0; i < chkPages.length; i++) chkPages[i].value = false;
};

// Test funksiyası
btnTest.onClick = function() {
    STATS.log = [];
    STATS.placed = 0;
    STATS.errors = 0;
    STATS.warnings = 0;

    log("TEST REJIMİ BAŞLADI");
    var rootPath = etFolder.text;
    if (!rootPath) { alert("⚠️ Zəhmət olmasa qovluq seçin!"); return; }
    var rootFolder = new Folder(rootPath);
    if (!rootFolder.exists) { alert("❌ Qovluq mövcud deyil:\n" + rootPath); return; }

    var totalTxt = 0, totalImg = 0;
    for (var pageNum = 2; pageNum <= 8; pageNum++) {
        var pageFolder = new Folder(rootFolder.fsName + "/page" + pageNum);
        if (!pageFolder.exists) { log("Qovluq yoxdur: page" + pageNum, "warning"); continue; }
        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        var imgFiles = getNumberedFiles(pageFolder, /\.(jpe?g|png|tiff?|gif|bmp|psd)$/i);
        totalTxt += txtFiles.length; totalImg += imgFiles.length;
        if (txtFiles.length > 0) log("Səhifə " + pageNum + " - nümunə: " + txtFiles[0].name);
    }
    alert("✅ Test tamamlandı!\n\n📄 " + totalTxt + " mətn faylı\n🖼️ " + totalImg + " şəkil faylı tapıldı");
    txtProgress.text = "Test: " + totalTxt + " mətn, " + totalImg + " şəkil tapıldı";
};

// Əsas yerləşdirmə
btnRun.onClick = function() {
    var params = {
        rootPath: etFolder.text,
        columns: parseInt((ddlColumns.selection && ddlColumns.selection.text) || CONFIG.columns, 10),
        imageRatio: Math.round(sliderImgRatio.value) / 100,
        padding: parseInt((ddlPadding.selection && ddlPadding.selection.text) || "5", 10),
        titleSize: parseInt((ddlTitleSize.selection && ddlTitleSize.selection.text) || "14", 10),
        bodySize: parseInt((ddlBodySize.selection && ddlBodySize.selection.text) || "10", 10),
        titleAlign: getAlignmentValue(ddlTitleAlign.selection.index, "title"),
        bodyAlign: getAlignmentValue(ddlBodyAlign.selection.index, "body"),
        fitOption: getFitOption(ddlFitOptions.selection.index),
        borderWidth: parseFloat((ddlBorderWidth.selection && ddlBorderWidth.selection.text) || "1"),
        leadingIndex: ddlLeading.selection.index,
        clearExisting: chkClearExisting.value,
        createLayers: chkCreateLayers.value,
        alternateBg: chkBackgroundColor.value,
        imageBorder: chkImageBorder.value,
        imageCaption: chkImageCaption.value,
        titleBold: chkTitleBold.value,
        titleUppercase: chkTitleUppercase.value,
        autoSave: chkAutoSave.value,
        selectedPages: []
    };

    for (var i = 0; i < chkPages.length; i++) {
        if (chkPages[i].value) params.selectedPages.push(i + 2);
    }
    if (params.selectedPages.length === 0) { alert("⚠️ Zəhmət olmasa ən azı bir səhifə seçin!"); return; }
    if (!params.rootPath) { alert("⚠️ Zəhmət olmasa qovluq seçin!"); return; }
    var rootFolder = new Folder(params.rootPath);
    if (!rootFolder.exists) { alert("❌ Seçilmiş qovluq mövcud deyil!"); return; }

    var confirmMsg = "Yerləşdirməyə başlanılsın?\n\n" +
                     "• Səhifələr: " + params.selectedPages.join(", ") + "\n" +
                     "• Sütunlar: " + params.columns + "\n" +
                     "• Şəkil nisbəti: " + Math.round(params.imageRatio * 100) + "%";
    if (!confirm(confirmMsg)) return;

    var progressWin = new Window("palette", "Yerləşdirilir...");
    progressWin.preferredSize = [400, 100];
    var progressText = progressWin.add("statictext", undefined, "Başlanır...");
    progressText.preferredSize = [380, 60];
    progressWin.center();
    progressWin.show();

    try {
        app.activeDocument.undoName = "Qəzet Məzmun Yerləşdiricisi";
        processLayout(params, progressText);
    } catch (e) {
        alert("❌ Xəta baş verdi:\n\n" + e.message + "\n\nSətir: " + (e.line || "-"));
        log("KRITIK XƏTA: " + e.message, "error");
    } finally {
        try { progressWin.close(); } catch(e){}
    }

    var resultMsg = "✅ Proses tamamlandı!\n\n" +
                    "✓ Yerləşdirildi: " + STATS.placed + " element\n" +
                    "❌ Xətalar: " + STATS.errors + "\n" +
                    "⚠️ Xəbərdarlıqlar: " + STATS.warnings;
    alert(resultMsg);
    txtProgress.text = "Tamamlandı: " + STATS.placed + " element, " + STATS.errors + " xəta";
};

function processLayout(params, progressText) {
    STATS.log = [];
    STATS.placed = 0;
    STATS.errors = 0;
    STATS.warnings = 0;

    var rootFolder = new Folder(params.rootPath);

    for (var i = 0; i < params.selectedPages.length; i++) {
        var pageNum = params.selectedPages[i];
        var pageIndex = pageNum - 1;

        if (progressText && progressText.window) {
            try {
                progressText.text = "Səhifə " + pageNum + " işlənilir...\n(" + (i + 1) + "/" + params.selectedPages.length + ")";
                progressText.window.update();
            } catch (e) {}
        }

        var pageFolder = new Folder(rootFolder.fsName + "/page" + pageNum);
        if (!pageFolder.exists) {
            log("Qovluq tapılmadı: page" + pageNum, "warning");
            continue;
        }

        var page = doc.pages.item(pageIndex);
        if (!page.isValid) { log("Səhifə " + pageNum + " sənəddə yoxdur", "error"); continue; }

        if (params.clearExisting) {
            try {
                var items = page.pageItems;
                for (var j = items.length - 1; j >= 0; j--) items[j].remove();
                log("Mövcud elementlər silindi", "success");
            } catch (e) { log("Elementləri silməkdə xəta: " + e.message, "warning"); }
        }

        var layer = doc.activeLayer;
        if (params.createLayers) {
            var layerName = "Səhifə " + pageNum;
            try {
                layer = doc.layers.itemByName(layerName);
                if (!layer.isValid) layer = doc.layers.add({name: layerName});
                log("Layer istifadə olundu/yaradıldı: " + layerName, "success");
            } catch (e) {
                log("Layer yaratma xətası: " + e.message, "warning");
                layer = doc.activeLayer;
            }
        }

        var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
        if (txtFiles.length === 0) { log("Mətn faylı tapılmadı", "warning"); continue; }

        var pageBounds = page.bounds;
        var margins = page.marginPreferences;

        var usableW = pageBounds[3] - pageBounds[1] - (margins.left || 0) - (margins.right || 0);
        var usableH = pageBounds[2] - pageBounds[0] - (margins.top || 0) - (margins.bottom || 0);
        var startX = pageBounds[1] + (margins.left || 0);
        var startY = pageBounds[0] + (margins.top || 0);

        var cellW = usableW / params.columns;
        var rows = Math.ceil(txtFiles.length / params.columns);
        var cellH = usableH / rows;

        for (var t = 0; t < txtFiles.length; t++) {
            var txtFile = txtFiles[t];
            var row = Math.floor(t / params.columns);
            var col = t % params.columns;
            var x = startX + col * cellW;
            var y = startY + row * cellH;

            var content = readTextFile(txtFile);
            if (!content || content.trim() === "") { log("Mətn boşdur: " + txtFile.name, "warning"); continue; }

            var lines = content.split(/\r?\n/);
            var cleanLines = [];
            for (var ln = 0; ln < lines.length; ln++) if (lines[ln].trim() !== "") cleanLines.push(lines[ln].trim());
            if (cleanLines.length === 0) { log("Mətn təmiz sətir yoxdur: " + txtFile.name, "warning"); continue; }

            var title = cleanLines.shift();
            var body = cleanLines.join("\n");
            if (params.titleUppercase) title = title.toUpperCase();

            var groupNum = parseInt((txtFile.name.match(/\d+/) || ["0"])[0], 10) || 0;
            var imgFiles = findImageFiles(pageFolder, groupNum);

            var currentY = y;

            if (params.alternateBg && t % 2 !== 0) {
                try {
                    var bgRect = page.rectangles.add({ itemLayer: layer });
                    bgRect.geometricBounds = [y, x, y + cellH, x + cellW];
                    var paperSwatch = doc.swatches.itemByName("Paper");
                    if (paperSwatch.isValid) {
                        bgRect.fillColor = paperSwatch;
                        try { bgRect.fillTint = 5; } catch(e){}
                    }
                    bgRect.strokeWeight = 0;
                    bgRect.sendToBack();
                } catch (e) { log("Arxa fon xətası: " + e.message, "warning"); }
            }

            // Şəkillər
            if (imgFiles.length > 0) {
                var imgContainerHeight = cellH * params.imageRatio;
                var maxImgs = Math.min(imgFiles.length, 4);
                var captionSpace = params.imageCaption ? 12 : 0;
                var singleImgHeight = (imgContainerHeight / Math.ceil(maxImgs / 2)) - params.padding - captionSpace;

                for (var im = 0; im < maxImgs; im++) {
                    var imgCol = im % 2;
                    var imgRow = Math.floor(im / 2);
                    var imgX = x + params.padding + (imgCol * (cellW / 2));
                    var imgY = currentY + params.padding + (imgRow * (singleImgHeight + params.padding + captionSpace));
                    var imgWidth = (cellW / 2) - (params.padding * 1.5);

                    try {
                        var rect = page.rectangles.add({ itemLayer: layer });
                        rect.geometricBounds = [imgY, imgX, imgY + singleImgHeight, imgX + imgWidth];
                        try { rect.place(imgFiles[im]); } catch(e){ log("Şəkili yerləşdirmək: " + e.message, "warning"); }
                        try { rect.fit(params.fitOption); } catch(e){}
                        if (params.imageBorder) {
                            rect.strokeWeight = params.borderWidth;
                            var blackSwatch = doc.swatches.itemByName("Black");
                            if (blackSwatch.isValid) rect.strokeColor = blackSwatch;
                        }
                        STATS.placed++;
                        log("Şəkil əlavə olundu: " + imgFiles[im].name, "success");

                        // Caption
                        if (params.imageCaption) {
                            try {
                                var captionFrame = page.textFrames.add({ itemLayer: layer });
                                var captionY = rect.geometricBounds[2] + 1;
                                captionFrame.geometricBounds = [captionY, rect.geometricBounds[1], captionY + (captionSpace - 1), rect.geometricBounds[3]];
                                captionFrame.contents = imgFiles[im].name;
                                try {
                                    var captionPara = captionFrame.parentStory.paragraphs[0];
                                    captionPara.pointSize = 7;
                                    captionPara.justification = Justification.CENTER_ALIGN;
                                    try { captionPara.fontStyle = "Italic"; } catch(e){}
                                } catch(e){}
                                try { captionFrame.fit(FitOptions.FRAME_TO_CONTENT); } catch(e){}
                                STATS.placed++;
                                log("Başlıq əlavə olundu: " + imgFiles[im].name, "success");
                            } catch (e) {
                                log("Şəkil başlığı xətası: " + e.message, "warning");
                            }
                        }

                    } catch (e) {
                        log("Şəkil xətası: " + e.message, "error");
                    }
                }
                currentY += imgContainerHeight + params.padding;
            }

            // Başlıq
            if (title && title !== "") {
                try {
                    var titleFrame = page.textFrames.add({ itemLayer: layer });
                    var titleHeight = params.titleSize * 2.5;
                    titleFrame.geometricBounds = [currentY, x + params.padding, currentY + titleHeight, x + cellW - params.padding];
                    titleFrame.contents = title;
                    try {
                        var titlePara = titleFrame.parentStory.paragraphs[0];
                        titlePara.pointSize = params.titleSize;
                        titlePara.justification = params.titleAlign;
                        if (params.titleBold) {
                            try { titlePara.fontStyle = "Bold"; } catch(e){}
                        }
                    } catch(e){}
                    try { titleFrame.fit(FitOptions.FRAME_TO_CONTENT); } catch(e){}
                    currentY = titleFrame.geometricBounds[2] + (params.padding * 0.5);
                    STATS.placed++;
                    log("Başlıq yerləşdirildi", "success");
                } catch (e) {
                    log("Başlıq xətası: " + e.message, "error");
                }
            }

            // Mətn gövdəsi
            if (body && body !== "") {
                try {
                    var remainingHeight = (y + cellH - params.padding) - currentY;
                    if (remainingHeight > params.bodySize * 2) {
                        var textFrame = page.textFrames.add({ itemLayer: layer });
                        textFrame.geometricBounds = [currentY, x + params.padding, y + cellH - params.padding, x + cellW - params.padding];
                        textFrame.contents = body;
                        try {
                            var bodyParas = textFrame.parentStory.paragraphs;
                            // pointSize və justification üçün bütün paragraphlara tətbiq et
                            for (var bp = 0; bp < bodyParas.length; bp++) {
                                try {
                                    bodyParas[bp].pointSize = params.bodySize;
                                    bodyParas[bp].justification = params.bodyAlign;
                                } catch(e){}
                            }
                            if (params.leadingIndex > 0) {
                                var factors = [1.1, 1.2, 1.3, 1.4, 1.5];
                                var val = params.bodySize * (factors[params.leadingIndex - 1] || 1.2);
                                for (var bp2 = 0; bp2 < bodyParas.length; bp2++) {
                                    try { bodyParas[bp2].leading = val; } catch(e){}
                                }
                            }
                        } catch (e){}
                        STATS.placed++;
                        log("Mətn yerləşdirildi", "success");
                    } else {
                        log("Mətn üçün yer yoxdur (qalan: " + Math.round(remainingHeight) + "pt)", "warning");
                    }
                } catch (e) {
                    log("Mətn xətası: " + e.message, "error");
                }
            }
        }

        if (params.autoSave) {
            try { doc.save(); log("Sənəd yadda saxlanıldı", "success"); } catch (e) { log("Yadda saxlama xətası: " + e.message, "warning"); }
        }
    }

    log("TAMAMLANDI");
    log("Yerləşdirildi: " + STATS.placed + " element");
    log("Xətalar: " + STATS.errors);
    log("Xəbərdarlıqlar: " + STATS.warnings);
}

// GUI göstər
win.center();
win.show();
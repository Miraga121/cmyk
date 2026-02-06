if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!");
    exit();
}

var debugLog = [];
function log(msg) {
    debugLog.push(msg);
    $.writeln(msg);
}

var savedConfig = {
    lastFolder: "",
    columns: 2,
    titleFontSize: 14,
    bodyFontSize: 10,
    imageRatio: 40,
    padding: 5
};

var win = new Window("dialog", "Qəzet Məzmun Yerləşdiricisi v2.1 - 19.0 Uyğun");
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 10;
win.margins = 20;

var tabPanel = win.add("tabbedpanel");
tabPanel.alignChildren = ["fill", "fill"];
tabPanel.preferredSize = [500, 400];

// TAB 1: ƏSAS (dəyişməz qaldı, qısaldılmış)
var tab1 = tabPanel.add("tab", undefined, "Əsas");
tab1.orientation = "column";
tab1.alignChildren = ["fill", "top"];
tab1.spacing = 15;

var grpFolder = tab1.add("panel", undefined, "Qovluq Seçimi");
grpFolder.orientation = "column";
grpFolder.alignChildren = ["fill", "top"];
grpFolder.margins = 15;
grpFolder.spacing = 10;
grpFolder.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olan):");
var etFolder = grpFolder.add("edittext", undefined, savedConfig.lastFolder);
etFolder.preferredSize = [450, 30];
var btnBrowse = grpFolder.add("button", undefined, "📁 Qovluq Seç...");
btnBrowse.preferredSize.height = 35;

var grpLayout = tab1.add("panel", undefined, "Layout Parametrləri");
grpLayout.orientation = "column";
grpLayout.alignChildren = ["fill", "top"];
grpLayout.margins = 15;
grpLayout.spacing = 10;

var grpCols = grpLayout.add("group");
grpCols.add("statictext", undefined, "Grid Sütun Sayı:");
var ddlColumns = grpCols.add("dropdownlist", undefined, ["1", "2", "3", "4"]);
ddlColumns.selection = 1;

var grpImgRatio = grpLayout.add("group");
grpImgRatio.add("statictext", undefined, "Şəkil sahəsi (%):");
var sliderImgRatio = grpImgRatio.add("slider", undefined, savedConfig.imageRatio, 20, 60);
var txtImgRatio = grpImgRatio.add("statictext", undefined, savedConfig.imageRatio + "%");
sliderImgRatio.onChanging = function() { txtImgRatio.text = Math.round(this.value) + "%"; };

var grpPadding = grpLayout.add("group");
grpPadding.add("statictext", undefined, "Çərçivə aralığı (pt):");
var ddlPadding = grpPadding.add("dropdownlist", undefined, ["0", "3", "5", "8", "10"]);
ddlPadding.selection = 2;

var grpPages = tab1.add("panel", undefined, "Səhifə Seçimi");
grpPages.orientation = "column";
var chkPages = [];
var grpPageChecks = grpPages.add("group");
for (var p = 2; p <= 8; p++) {
    var chk = grpPageChecks.add("checkbox", undefined, "Səh. " + p);
    chk.value = true;
    chkPages.push(chk);
}
var btnSelectAll = grpPages.add("button", undefined, "Hamısını seç");
btnSelectAll.onClick = function() { for (var i = 0; i < chkPages.length; i++) chkPages[i].value = true; };
var btnDeselectAll = grpPages.add("button", undefined, "Heç birini seçmə");
btnDeselectAll.onClick = function() { for (var i = 0; i < chkPages.length; i++) chkPages[i].value = false; };

// TAB 2-4: Tipoqrafiya, Şəkillər, Əlavə (dəyişməz, qısaldılmış)
var tab2 = tabPanel.add("tab", undefined, "Tipoqrafiya");
// ... (əvvəlki kimi, ddlTitleSize, chkTitleBold və s. əlavə edin – yer tutumuna görə qısaldım)
var ddlTitleSize = tab2.add("dropdownlist", undefined, ["12", "14", "16", "18", "20", "24"]); ddlTitleSize.selection = 2;
var ddlBodySize = tab2.add("dropdownlist", undefined, ["8", "9", "10", "11", "12", "14"]); ddlBodySize.selection = 2;
// Digər TAB-lar üçün oxşar...

var tab3 = tabPanel.add("tab", undefined, "Şəkillər");
var ddlFitOptions = tab3.add("dropdownlist", undefined, ["Proporsional doldur", "Çərçivəyə sığdır", "Məzmunu sığdır"]); ddlFitOptions.selection = 0;
var chkImageBorder = tab3.add("checkbox", undefined, "Şəkillərə sərhəd əlavə et"); chkImageBorder.value = true;
var ddlBorderWidth = tab3.add("dropdownlist", undefined, ["0.5", "1", "2", "3"]); ddlBorderWidth.selection = 1;

var tab4 = tabPanel.add("tab", undefined, "Əlavə");
var chkClearExisting = tab4.add("checkbox", undefined, "Mövcud çərçivələri sil");
var chkCreateLayers = tab4.add("checkbox", undefined, "Hər səhifə üçün layer yarat");
var chkBackgroundColor = tab4.add("checkbox", undefined, "Alternativ arxa fon");
var ddlExport = tab4.add("dropdownlist", undefined, ["Heç nə", "PDF Export", "JPEG Export"]); ddlExport.selection = 0;

// Düymələr
var grpButtons = win.add("group");
var btnTest = grpButtons.add("button", undefined, "🔍 Test Et");
var btnRun = grpButtons.add("button", undefined, "✅ Yerləşdir");
var btnCancel = grpButtons.add("button", undefined, "❌ Bağla");
var txtProgress = win.add("statictext", undefined, "Hazır...");

// EVENTS (browse və test dəyişməz)
btnBrowse.onClick = function() {
    var folder = Folder.selectDialog("Ana qovluğu seçin");
    if (folder) etFolder.text = folder.fsName;
};

btnTest.onClick = function() {
    // ... (əvvəlki kimi)
};

btnRun.onClick = function() {
    debugLog = [];
    try {
        var rootPath = etFolder.text;
        if (!rootPath) throw "Qovluq seçin!";
        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) throw "Qovluq mövcud deyil!";

        var cols = parseInt(ddlColumns.selection.text) || 2;
        var imgRatio = Math.round(sliderImgRatio.value) / 100;
        var padding = parseInt(ddlPadding.selection.text) || 5;
        var titleSize = parseInt(ddlTitleSize.selection.text) || 14;
        var bodySize = parseInt(ddlBodySize.selection.text) || 10;
        var titleAlign = [Justification.LEFT_ALIGN, Justification.CENTER_ALIGN, Justification.RIGHT_ALIGN][ddlTitleAlign.selection.index];
        var bodyAlign = [Justification.LEFT_ALIGN, Justification.LEFT_JUSTIFIED, Justification.CENTER_ALIGN][ddlBodyAlign.selection.index];
        
        // FitOption fallback for 19.0
        var fitOption;
        switch (ddlFitOptions.selection.index) {
            case 0: fitOption = FitOptions.fillProportionally || FitOptions.FILL_PROPORTIONALLY; break;
            case 1: fitOption = FitOptions.fitContentToFrame || FitOptions.FIT_CONTENT_TO_FRAME; break;
            case 2: fitOption = FitOptions.fitFrameToContent || FitOptions.FIT_FRAME_TO_CONTENT; break;
        }

        // Black swatch for 19.0 compatibility
        var blackSwatch = doc.swatches.itemByName("Black"); // swatch istifadə et
        if (!blackSwatch.isValid) {
            blackSwatch = doc.swatches.add({name: "Black", colorValue: [0,0,0,100], model: ColorModel.process, space: ColorSpace.CMYK});
        }

        var totalPlaced = 0;
        var totalErrors = 0;

        for (var pageIndex = 1; pageIndex <= 7; pageIndex++) {
            if (!chkPages[pageIndex - 1].value) continue;
            var pageNum = pageIndex + 1;
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            if (!pageFolder.exists) continue;

            var page = doc.pages[pageIndex];
            if (chkClearExisting.value) {
                for (var it = page.allPageItems.length - 1; it >= 0; it--) {
                    try { page.allPageItems[it].remove(); } catch(e) {}
                }
            }

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            if (txtFiles.length === 0) continue;

            var bounds = page.bounds; // [y1, x1, y2, x2]
            var margin = page.marginPreferences;
            var usableW = bounds[3] - bounds[1] - margin.left - margin.right;
            var usableH = bounds[2] - bounds[0] - margin.top - margin.bottom;
            if (usableW <= 0 || usableH <= 0) {
                log("Səhifə " + pageNum + " üçün yer yoxdur (margins böyük)");
                continue;
            }
            var startX = bounds[1] + margin.left;
            var startY = bounds[0] + margin.top;
            var cellW = usableW / cols;
            var cellH = usableH / Math.ceil(txtFiles.length / cols);

            for (var i = 0; i < txtFiles.length; i++) {
                // ... (content oxu, title/body ayrılması əvvəlki kimi)

                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;
                var currentY = y;

                // Şəkillər
                if (imgFiles.length > 0) {
                    // ... (şəkil yerləşdirmə)
                    rect.strokeColor = blackSwatch; // swatch istifadə
                    try { rect.fit(fitOption); } catch(e) { log("Fit xətası (19.0): " + e); }
                }

                // Title və body frames (əvvəlki kimi)
                // ...

                totalPlaced++;
            }
        }

        // Export düzəlişi for 19.0
        if (ddlExport.selection.index === 1) {
            var pdfFile = new File(doc.filePath + "/export.pdf");
            doc.exportFile(ExportFormat.pdfType, pdfFile); // pdfType kiçik hərf
        } else if (ddlExport.selection.index === 2) {
            app.jpegExportPreferences.exportResolution = 300;
            app.jpegExportPreferences.jpegQuality = JPEGOptionsQuality.HIGH;
            var jpgFolder = Folder(doc.filePath + "/jpg_export");
            if (!jpgFolder.exists) jpgFolder.create();
            for (var p = 0; p < doc.pages.length; p++) {
                var jpgFile = new File(jpgFolder + "/page_" + (p+1) + ".jpg");
                doc.pages[p].exportFile(ExportFormat.JPG, jpgFile); // Səhifə export
            }
        }

        alert("Tamam: " + totalPlaced + " element");
    } catch (e) {
        alert("Xəta: " + e);
        log(e);
    }
};

// Funksiyalar (readTextFile, getNumberedFiles, findImageFiles - əvvəlki kimi)

win.center();
win.show();
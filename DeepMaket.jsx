#targetengine "session"

if (!app.documents.length) {
    alert("❌ Heç bir sənəd açıq deyil!");
    exit();
}

var doc = app.activeDocument;
if (doc.pages.length < 8) {
    alert("❗ Sənəd ən azı 8 səhifəli olmalıdır!");
    exit();
}

var win = new Window("palette", "Qəzet Məzmun Yerləşdiricisi", undefined, {resizeable: true});
win.orientation = "column";
win.alignChildren = ["fill", "top"];
win.spacing = 15;
win.margins = 20;

win.add("statictext", undefined, "Ana qovluq (page2/, page3/, ... olan):");
var etFolder = win.add("edittext", undefined, "");
etFolder.preferredSize.height = 25;

var btnBrowse = win.add("button", undefined, "📁 Seç...");
btnBrowse.preferredSize.height = 30;

var grpGrid = win.add("group");
grpGrid.orientation = "row";
grpGrid.add("statictext", undefined, "Sütun:");
var ddlColumns = grpGrid.add("dropdownlist", undefined, ["1", "2", "3"]);
ddlColumns.selection = 1;

var btnRun = win.add("button", undefined, "✅ Yerləşdir");
btnRun.preferredSize.height = 40;

btnBrowse.onClick = function () {
    var folder = Folder.selectDialog("Ana qovluğunu seçin");
    if (folder) etFolder.text = folder.fsName;
};

btnRun.onClick = function () {
    try {
        var rootPath = etFolder.text;
        if (!rootPath) { alert("Qovluq seçin!"); return; }

        var rootFolder = new Folder(rootPath);
        if (!rootFolder.exists) { alert("Qovluq mövcud deyil!"); return; }

        var cols = parseInt(ddlColumns.selection.text) || 2;

        for (var p = 1; p <= 7; p++) { // səhifə 2-8
            var pageNum = p + 1;
            var pageFolder = new Folder(rootFolder + "/page" + pageNum);
            
            $.writeln("\n--- SƏHİFƏ " + pageNum + " ---");
            $.writeln("Qovluq: " + pageFolder.fsName);
            $.writeln("Mövcuddur? " + pageFolder.exists);

            if (!pageFolder.exists) continue;

            var txtFiles = getNumberedFiles(pageFolder, /\.txt$/i);
            $.writeln("Tapılan .txt faylları: " + txtFiles.length);
            for (var f = 0; f < txtFiles.length; f++) {
                $.writeln("  → " + txtFiles[f].name);
            }

            if (txtFiles.length === 0) continue;

            var page = doc.pages[p];
            var margin = page.marginPreferences;
            var usableW = page.bounds[3] - page.bounds[1] - margin.left - margin.right;
            var usableH = page.bounds[2] - page.bounds[0] - margin.top - margin.bottom;
            var startX = page.bounds[1] + margin.left;
            var startY = page.bounds[0] + margin.top;

            var cellW = usableW / cols;
            var rows = Math.ceil(txtFiles.length / cols);
            var cellH = usableH / rows;

            for (var i = 0; i < txtFiles.length; i++) {
                var row = Math.floor(i / cols);
                var col = i % cols;
                var x = startX + col * cellW;
                var y = startY + row * cellH;

                var txtFile = txtFiles[i];
                var content = File.readTextClean(txtFile);
                var lines = content ? content.split(/\r?\n/) : [""];
                // Boş sətirləri sil
                lines = lines.filter(line => line.trim() !== "");
                var title = lines[0] || "";
                var body = lines.slice(1).join("\r");

                $.writeln("  Fayl: " + txtFile.name + " | Başlıq: " + title);

                var groupNum = parseInt(txtFile.name.match(/^\d+/)) || (i + 1);
                var imgFiles = findImageFiles(pageFolder, groupNum);
                $.writeln("    Şəkillər: " + imgFiles.length);

                // Şəkillər (yuxarıda)
                var currentY = y;
                if (imgFiles.length > 0) {
                    var imgH = cellH * 0.5;
                    var imgCols = Math.min(imgFiles.length, 2); // maks 2 şəkil yan-yana
                    var wPerImg = cellW / imgCols;
                    for (var j = 0; j < imgFiles.length && j < 4; j++) {
                        var imgX = x + (j % imgCols) * wPerImg;
                        var imgY = currentY;
                        var rect = page.rectangles.add();
                        rect.geometricBounds = [imgY, imgX, imgY + imgH, imgX + wPerImg];
                        try { rect.place(imgFiles[j]); rect.fit(FitOptions.FILL_PROPORTIONALLY); }
                        catch (e) { $.writeln("Şəkil xətası: " + e); }
                    }
                    currentY += imgH + 5;
                }

                // Başlıq
                if (title) {
                    var tf = page.textFrames.add();
                    tf.geometricBounds = [currentY, x, currentY + 20, x + cellW];
                    tf.contents = title;
                    tf.parentStory.appliedFont = "Arial Bold";
                    tf.parentStory.pointSize = 16;
                    currentY += 22;
                }

                // Mətn
                if (body) {
                    var tf2 = page.textFrames.add();
                    tf2.geometricBounds = [currentY, x, y + cellH, x + cellW];
                    tf2.contents = body;
                    tf2.parentStory.appliedFont = "Arial";
                    tf2.parentStory.pointSize = 11;
                }
            }
        }

        alert("✅ Tamamlandı! Konsola baxın (ExtendScript Toolkit → Console).");
        win.close();

    } catch (e) {
        alert("Xəta: " + e.toString());
        $.writeln("XƏTA: " + e.toString());
    }
};

// UTF-8 BOM silən oxuma
File.prototype.readTextClean = function () {
    if (!this.exists) return "";
    this.open("r", "TEXT", "UTF-8");
    var content = this.read();
    this.close();
    // BOM sil (UTF-8 üçün)
    if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
    }
    return content;
};

function getNumberedFiles(folder, filterRegex) {
    var files = folder.getFiles(filterRegex);
    files.sort(function (a, b) {
        var numA = parseInt(a.name.match(/^\d+/)) || 0;
        var numB = parseInt(b.name.match(/^\d+/)) || 0;
        return numA - numB;
    });
    return files;
}

function findImageFiles(folder, groupNum) {
    var pattern = new RegExp("^" + groupNum + "-\\d+\\.(jpe?g|png|tiff?)$", "i");
    var allFiles = folder.getFiles();
    var result = [];
    for (var i = 0; i < allFiles.length; i++) {
        if (allFiles[i] instanceof File && pattern.test(allFiles[i].name)) {
            result.push(allFiles[i]);
        }
    }
    return result.sort(function (a, b) {
        var numA = parseInt(a.name.match(/-(\d+)\./)[1]) || 0;
        var numB = parseInt(b.name.match(/-(\d+)\./)[1]) || 0;
        return numA - numB;
    });
}

win.show();
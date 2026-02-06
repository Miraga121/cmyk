/*  Illustrator Image Placer + Page Cleaner
    ✅ 8 səhifə üçün ayrı Yerləşdir + Təmizlə
    ✅ Dinamik grid
    ✅ Arial Font məcburi
*/

#target illustrator

function getArialFont() {
    var font;
    try {
        font = app.textFonts.getByName("Arial");
    } catch (e) {
        font = app.textFonts[0];
    }
    return font;
}

function clearPage(pageNum) {
    var doc = app.activeDocument;
    for (var i = doc.pageItems.length - 1; i >= 0; i--) {
        if (doc.pageItems[i].layer.name == "Page" + pageNum) {
            doc.pageItems[i].remove();
        }
    }
}

function placeImages(pageNum, files) {
    if (!files || files.length === 0) return;

    var doc = app.activeDocument;
    var pageLayer;

    try {
        pageLayer = doc.layers.getByName("Page" + pageNum);
    } catch (e) {
        pageLayer = doc.layers.add();
        pageLayer.name = "Page" + pageNum;
    }

    var artW = doc.width;
    var artH = doc.height;

    var count = files.length;
    var cols = Math.ceil(Math.sqrt(count));
    var rows = Math.ceil(count / cols);

    var gap = 10;
    var cellW = (artW - (cols + 1) * gap) / cols;
    var cellH = (artH - (rows + 1) * gap) / rows;

    var arial = getArialFont();

    for (var i = 0; i < count; i++) {
        var img = doc.placedItems.add();
        img.file = files[i];
        img.layer = pageLayer;

        var col = i % cols;
        var row = Math.floor(i / cols);

        img.width = cellW;
        img.height = cellH;

        img.left = gap + col * (cellW + gap);
        img.top = -(gap + row * (cellH + gap));

        // text label under image
        var text = doc.textFrames.add();
        text.contents = decodeURI(files[i].name);
        text.textRange.characterAttributes.textFont = arial;
        text.textRange.size = 10;
        text.left = img.left;
        text.top = img.top - img.height - 5;
        text.layer = pageLayer;
    }
}

// ===== UI =====

var win = new Window("dialog", "Placer & Cleaner");
win.alignChildren = "left";

var group = win.add("group");
group.orientation = "row";

// Columns
var colLabels = ["Səhifə", "Yerləşdir", "Təmizlə"];
for (var k = 0; k < colLabels.length; k++) {
    group.add("statictext", undefined, colLabels[k], { alignment: "left" }).preferredSize.width = 80;
}

var pageGrp = win.add("group");
pageGrp.orientation = "column";

var chkPlace = [];
var chkClear = [];

for (var p = 1; p <= 8; p++) {
    var line = pageGrp.add("group");
    line.orientation = "row";

    line.add("statictext", undefined, " " + p);

    chkPlace[p] = line.add("checkbox", undefined, "");
    chkClear[p] = line.add("checkbox", undefined, "");
}

var chooseBtn = win.add("button", undefined, "Şəkilləri Seç");
var runBtn = win.add("button", undefined, "Başlat");
var closeBtn = win.add("button", undefined, "Bağla");

var selectedFiles = [];

chooseBtn.onClick = function () {
    selectedFiles = File.openDialog("Şəkilləri seç", "*.png;*.jpg;*.jpeg;*.tif;*.svg;*.eps", true);
    if (!selectedFiles) selectedFiles = [];
    alert(selectedFiles.length + " şəkil seçildi ✅");
};

runBtn.onClick = function () {
    if (selectedFiles.length === 0) {
        if (!confirm("Şəkil seçilməyib. Yalnız təmizləmə edilsin?")) return;
    }

    for (var i = 1; i <= 8; i++) {
        if (chkClear[i].value === true)
            clearPage(i);

        if (chkPlace[i].value === true)
            placeImages(i, selectedFiles);
    }

    alert("✅ İş bitdi!");
    win.close();
};

closeBtn.onClick = function () {
    win.close();
};

win.center();
win.show();

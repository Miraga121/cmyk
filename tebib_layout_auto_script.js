// TebibLayout Simple Grid Generator with GUI Integration
var doc = app.activeDocument;

// == PAGE CONFIG == 
var PAGE_WIDTH = 595; // A4 width in points
var PAGE_HEIGHT = 842; // A4 height in points

// == FRAME CONFIG STORAGE ==
var FRAME_CONFIG = [];

// == FUNCTIONS ==
function createFrame(doc, config) {
    try {
        var layer;
        try {
            layer = doc.layers.item(config.layer || "Layout_Layer");
            if (!layer.isValid) throw new Error();
        } catch (e) {
            layer = doc.layers.add({ name: config.layer || "Layout_Layer" });
        }

        var frame = doc.textFrames.add({ itemLayer: layer });
        frame.geometricBounds = [
            config.y,
            config.x,
            config.y + config.height,
            config.x + config.width
        ];
        frame.contents = config.name;

        if (config.name.indexOf("Başlıq") !== -1) {
            frame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
            frame.strokeWeight = 2;
        } else if (config.name.indexOf("Xəbər") !== -1) {
            frame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
            frame.fillColor = doc.swatches.itemByName("Paper");
            frame.strokeWeight = 1;
        }

        return frame;
    } catch (e) {
        alert("Xəta (createFrame): " + e.message);
        return null;
    }
}

function generateLayoutFromConfig() {
    try {
        var framesCreated = 0;
        for (var i = 0; i < FRAME_CONFIG.length; i++) {
            if (createFrame(doc, FRAME_CONFIG[i])) {
                framesCreated++;
            }
        }

        var page = doc.pages[0];
        page.guides.add(doc.layers.item(0), {
            orientation: HorizontalOrVertical.VERTICAL,
            location: PAGE_WIDTH / 2
        });

        alert("Uğurla yaradıldı: " + framesCreated + " frame\nSəhifə hazırdır!");
    } catch (e) {
        alert("Xəta (generateLayout): " + e.message);
    }
}

function addFrameToConfig(x, y, w, h, name, layer) {
    FRAME_CONFIG.push({
        x: parseFloat(x),
        y: parseFloat(y),
        width: parseFloat(w),
        height: parseFloat(h),
        name: name,
        layer: layer || "Layout_Layer"
    });
}

// == GUI ==
var win = new Window("dialog", "TƏBİB Layout Dizayn GUI");
win.orientation = "column";
win.alignChildren = "fill";

var inputPanel = win.add("panel", undefined, "Yeni Frame Parametrləri");
inputPanel.orientation = "column";
inputPanel.alignChildren = "left";

var g1 = inputPanel.add("group");
g1.add("statictext", undefined, "Ad:");
var nameField = g1.add("edittext", undefined, "Başlıq");
nameField.characters = 20;

var g2 = inputPanel.add("group");
g2.add("statictext", undefined, "X:");
var xField = g2.add("edittext", undefined, "40");
xField.characters = 5;
g2.add("statictext", undefined, "Y:");
var yField = g2.add("edittext", undefined, "40");
yField.characters = 5;

var g3 = inputPanel.add("group");
g3.add("statictext", undefined, "En:");
var wField = g3.add("edittext", undefined, "200");
wField.characters = 5;
g3.add("statictext", undefined, "Uzun:");
var hField = g3.add("edittext", undefined, "100");
hField.characters = 5;

var g4 = inputPanel.add("group");
g4.add("statictext", undefined, "Layer:");
var layerField = g4.add("edittext", undefined, "Layout_Layer");
layerField.characters = 20;

var btnGroup = win.add("group");
var addBtn = btnGroup.add("button", undefined, "Frame əlavə et");
var previewBtn = btnGroup.add("button", undefined, "Hazır Maket Yüklə");
var generateBtn = btnGroup.add("button", undefined, "Yerləşdir");
var cancelBtn = btnGroup.add("button", undefined, "Ləğv et");

addBtn.onClick = function () {
    addFrameToConfig(xField.text, yField.text, wField.text, hField.text, nameField.text, layerField.text);
    alert("Əlavə olundu: " + nameField.text);
};

previewBtn.onClick = function () {
    FRAME_CONFIG = [];
    addFrameToConfig(40, 40, PAGE_WIDTH - 80, 100, "Başlıq", "Layout_Layer");
    addFrameToConfig(40, 160, (PAGE_WIDTH / 2) - 50, 120, "Sol Üst Məqalə", "Layout_Layer");
    addFrameToConfig(40, 300, (PAGE_WIDTH / 2) - 50, 150, "Sol Alt Məqalə", "Layout_Layer");
    addFrameToConfig((PAGE_WIDTH / 2) + 10, 160, (PAGE_WIDTH / 2) - 50, 40, "1. Xəbər", "Layout_Layer");
    addFrameToConfig((PAGE_WIDTH / 2) + 10, 220, (PAGE_WIDTH / 2) - 50, 40, "2. Xəbər", "Layout_Layer");
    addFrameToConfig((PAGE_WIDTH / 2) + 10, 280, (PAGE_WIDTH / 2) - 50, 40, "3. Xəbər", "Layout_Layer");
    addFrameToConfig((PAGE_WIDTH / 2) + 10, 340, (PAGE_WIDTH / 2) - 50, 40, "4. Xəbər", "Layout_Layer");
    alert("Standart Maket Yükləndi – 7 frame");
};

generateBtn.onClick = function () {
    generateLayoutFromConfig();
};

cancelBtn.onClick = function () {
    win.close();
};

win.center();
win.show();

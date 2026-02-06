// == Sənədin açıq olmasını yoxla ==
if (app.documents.length === 0) {
    alert("Zəhmət olmasa, açıq bir sənəd açın.");
    exit();
}

var doc = app.activeDocument;

// == Səhifələrin mövcudluğunu yoxla ==
if (doc.pages.length < 2) {
    alert("Sənəddə ən azı 2 səhifə olmalıdır.");
    exit();
}

// == FUNKSİYA: TextFrame Yaratmaq ==
function createTextFrameOnPage(pageIndex, x, y, width, height, content, layerName) {
    try {
        // Layer yoxlanışı və yaradılması
        var layer;
        try {
            layer = doc.layers.itemByName(layerName);
            if (!layer.isValid) throw new Error("Layer tapılmadı.");
        } catch (e) {
            layer = doc.layers.add({ name: layerName });
        }

        // Koordinat və ölçülərin yoxlanışı
        if (isNaN(x) || isNaN(y) || isNaN(width) || isNaN(height)) {
            throw new Error("Koordinat və ölçülər yalnız rəqəm olmalıdır.");
        }

        // Səhifəni seç
        var page = doc.pages[pageIndex];
        if (!page) throw new Error("Səhifə tapılmadı.");

        // TextFrame yaradılması
        var frame = page.textFrames.add({ itemLayer: layer });
        frame.geometricBounds = [y, x, y + height, x + width]; // [Y1, X1, Y2, X2]
        frame.contents = content;

        // Frame stilinin tənzimlənməsi
        frame.textFramePreferences.verticalJustification = VerticalJustification.CENTER_ALIGN;
        frame.strokeWeight = 1; // Çərçivənin xətt qalınlığı

        return frame;
    } catch (e) {
        alert("Xəta (createTextFrameOnPage): " + e.message);
        return null;
    }
}

// == Parametrlər ==
var frameContent = "Bu, avtomatik yaradılmış textFrame-dir.";
var frameX = 50; // Sol kənarından məsafə (pt)
var frameY = 50; // Yuxarı kənarından məsafə (pt)
var frameWidth = 378.425; // En (pt)
var frameHeight = 522.643; // Uzunluq (pt)
var frameLayer = "Custom_Frame_Layer";

// == TextFrame yarat ==
createTextFrameOnPage(1, frameX, frameY, frameWidth, frameHeight, frameContent, frameLayer);

alert("2-ci səhifədə textFrame uğurla yaradıldı!");
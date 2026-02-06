// === CONFIG MODULE ===
var Config = {
    baseFolder: Folder.selectDialog("Əsas qovluğu seçin (page1, page2 və s.)"),
    pageSize: PageSize.A3,
    pageMargins: [40, 40, 40, 40],
    imageExtensions: /\.(jpg|jpeg|png|psd)$/i,
    textExtensions: /\.txt$/i
};

// === UTILS MODULE ===
var Utils = {
    getFilesByExtension: function(folder, regex) {
        return folder.getFiles(function(f) {
            return f instanceof File && f.name.match(regex);
        });
    },
    createPage: function(doc) {
        var page = doc.pages.add();
        return page;
    }
};

// === CONTENT MODULE ===
var ContentManager = {
    placeText: function(page, file) {
        var bounds = [Config.pageMargins[0], Config.pageMargins[1],
                      page.bounds[2] - Config.pageMargins[2],
                      page.bounds[3] - Config.pageMargins[3]];
        var frame = page.textFrames.add({geometricBounds: bounds});
        if (file.open("r")) {
            frame.contents = file.read();
            file.close();
        }
    },
    placeImages: function(page, files) {
        var yOffset = 50;
        for (var i = 0; i < files.length; i++) {
            var imgBounds = [yOffset, 50, yOffset + 150, 250];
            try {
                page.rectangles.add({geometricBounds: imgBounds, contentType: ContentType.graphicType}).place(files[i]);
                yOffset += 160;
            } catch (e) {
                $.writeln("Şəkil yerləşdirilə bilmədi: " + files[i].name);
            }
        }
    }
};

// === MAIN MODULE ===
var Main = {
    run: function() {
        if (!Config.baseFolder) return;

        var doc = app.documents.add();
        doc.documentPreferences.pageSize = Config.pageSize;
        doc.documentPreferences.facingPages = false;

        for (var i = 1; i <= 32; i++) {
            var pageFolder = new Folder(Config.baseFolder + "/page" + i);
            if (!pageFolder.exists) continue;

            var page = Utils.createPage(doc);
            var textFiles = Utils.getFilesByExtension(pageFolder, Config.textExtensions);
            var imageFiles = Utils.getFilesByExtension(pageFolder, Config.imageExtensions);

            if (textFiles.length > 0) ContentManager.placeText(page, textFiles[0]);
            if (imageFiles.length > 0) ContentManager.placeImages(page, imageFiles);
        }

        alert("Optimallaşdırılmış sənəd yaradıldı!");
    }
};

// === EXECUTE ===
Main.run();
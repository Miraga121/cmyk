#target indesign

//---------------------------------------
// AZ Auto Hyphenation (Non-destructive)
//---------------------------------------

if(app.selection.length == 0 ||
   !(app.selection[0] instanceof Text ||
     app.selection[0] instanceof TextFrame ||
     app.selection[0] instanceof Paragraph))
{
    alert("Zəhmət olmasa əvvəlcə mətni seçin.");
    exit();
}

var vowels = "uüeöoaıəiUÜEÖOAIƏİ";
var punct = " \t\r\n-–—,.!?;:“”\"'()[]{}<>«»/\\|";
var H = SpecialCharacters.DISCRETIONARY_HYPHEN;

//---------------------------------------
function isVowel(c){
    return vowels.indexOf(c) != -1;
}

//---------------------------------------
function shouldHyphen(prev, cur, next){
    return isVowel(prev) && !isVowel(cur) && isVowel(next);
}

//---------------------------------------
var story = app.selection[0].parentStory;
var chars = story.characters;

// IMPORTANT: loop backwards
for(var i = chars.length-2; i>1; i--){

    var c0 = chars[i-1].contents;
    var c1 = chars[i].contents;
    var c2 = chars[i+1].contents;

    if(punct.indexOf(c0)!=-1 ||
       punct.indexOf(c1)!=-1 ||
       punct.indexOf(c2)!=-1)
       continue;

    if(shouldHyphen(c0,c1,c2)){
        chars[i].insertionPoints[0].contents = H;
    }
}

alert("Hecalanma formatı pozmadan tamamlandı ✔");


//	Hecalanma - Automatic hyphenation for Adobe Indesign
//	An InDesign CS3 JavaScript
//
// 	Vafadar Aliyev (Azerbaijan) 
// 	February  2012
// 	E-mail: 	vafa09@gmail.com
// 			 	vafadara@mail.ru
//

var sait="uüeöoaıəiUÜEÖOAIƏİйуеыаоэяию"; // saitler
var durgu=" -,.!“”[{}]()|/\/\"#$%^&*?<>@*'~\r"; // durgu ishareleri
// var durgu=" -“”"; // durgu ishareleri
var kod="­"; // hyphenation kod

String.prototype.replaceAll = function(search, replace){
  return this.split(search).join(replace);
}

function hecala(s)  //  funksiyanin bashlangici
	{
			var n=s.length;		
if (n>=4) 
{
		soz1=s[0]+s[1];		
			so=soz1;
			for(var j=2; j<n-1; j++) {
				
			 if (sait.indexOf(s[j]) !=-1) { soz1=soz1+s[j]; }
			   if ( (sait.indexOf(s[j]) ==-1) && (sait.indexOf(s[j-1]) !=-1)  && (sait.indexOf(s[j-2]) !=-1)  )  { soz1=soz1+s[j]; }
				  if ( (sait.indexOf(s[j]) ==-1) && (sait.indexOf(s[j-1]) !=-1)  && (sait.indexOf(s[j-2]) ==-1) && (sait.indexOf(s[j+1]) !=-1)  )  { soz1=soz1+kod+s[j]; }
					 if ( (sait.indexOf(s[j]) ==-1) && (sait.indexOf(s[j-1]) !=-1)  && (sait.indexOf(s[j-2]) ==-1) && (sait.indexOf(s[j+1]) ==-1)  )  { soz1=soz1+s[j]; }
						if ( (sait.indexOf(s[j]) ==-1) && (sait.indexOf(s[j-1]) ==-1)  && (sait.indexOf(s[j-2]) !=-1) && (sait.indexOf(s[j+1]) !=-1)  )  { soz1=soz1+kod+s[j]; }
							if ( (sait.indexOf(s[j]) ==-1) && (sait.indexOf(s[j-1]) ==-1)  && (sait.indexOf(s[j-2]) !=-1) && (sait.indexOf(s[j+1]) ==-1)  )  { soz1=soz1+s[j]; }
							if ( (sait.indexOf(s[j]) ==-1) && (sait.indexOf(s[j-1]) ==-1)  && (sait.indexOf(s[j-2]) ==-1) && (sait.indexOf(s[j+1]) ==-1)  )  { soz1=soz1+s[j]; }
							if ( (sait.indexOf(s[j]) ==-1) && (sait.indexOf(s[j-1]) ==-1)  && (sait.indexOf(s[j-2]) ==-1) && (sait.indexOf(s[j+1]) !=-1)  )  { soz1=soz1+kod+s[j]; }
			}

soz1=soz1+s[n-1];
}	else {soz1=s;}	
		return soz1;

}  // funksiya sonu

	
					    aD = app.activeDocument;
						myStory = aD.selection[0];
						var metn=myStory.contents;
						// var metn=mySelection.parentStory;
						var  nn=app.documents.length;	
		//				alert (metn);
	
	aa=metn.length;

		var setr="";
		var st="";
		var k=0;
		for(var i=0; i<metn.length; i++) {
					
				if (durgu.indexOf(metn[i]) !=-1) 
									
									{
									k=1;		
									setr=setr+hecala(st)+metn[i];
									st="";
									}
									else { st=st+metn[i];   k=0; }
			
		}
setr=setr+hecala(st);

// alert(setr); 
myStory.contents = setr;



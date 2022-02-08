var indexedDB= window.indexedDB|| window.mozIndexedDB|| window.webkitIndexedDB||window.msIndexedDB|| window.shimIndexedDB;

var tabjson;
var mongoID;
var request;

function getRequestObject() {
   if ( window.ActiveXObject)  {
      return ( new ActiveXObject("Microsoft.XMLHTTP")) ;
   } else if (window.XMLHttpRequest)  {
      return (new XMLHttpRequest())  ;
   } else {
      return (null) ;
   }
}

window.onload = function() {
   if(sessionStorage.log && sessionStorage.log === "true") {
      displayButtons(true);
   }
   else {
      displayButtons(false);
   }
}

function displayButtons(logged) {
   
   if(logged) {
      var yes= "inline";
      var no = "none";
   } else {
      var yes= "none";
      var no = "inline";
   }

   document.getElementById("logOutB").style.display = yes;
   document.getElementById("insOnB").style.display = yes;
   document.getElementById("selOnB").style.display = yes;
   document.getElementById("analizeB").style.display = yes;

   document.getElementById("regB").style.display = no;
   document.getElementById("logB").style.display = no;
   document.getElementById("insOffB").style.display = no;
   document.getElementById("selOffB").style.display = no;
}

function _list() {
   document.getElementById("result").style.backgroundColor = "#7d9cb1";
   document.getElementById('result').innerHTML = ''; 
   document.getElementById('data').innerHTML = '';  
   request = getRequestObject() ;
   request.onreadystatechange = function() {
      if (request.readyState == 4)    {
         tabjson = JSON.parse(request.response);
         var txt = "<div class='table'><table><tr><th>Nr</th><th>Data</th><th>Miejsce</th><th>Skala AQI[ug/m3]</th><th>Rodzaj cząstek</th></tr>";
         for ( var id in tabjson )  {
             txt +=  "<tr><td>" + id + "</td>" ;
             for ( var prop in tabjson[id] ) {             
                 if ( prop !== '_id' && prop !== 'id')
                   { txt += "<td>" + tabjson[id][prop] + "</td>";  }
             }
             txt +="</tr>";
         }
         txt += "</table></div>";
         document.getElementById('result').innerHTML = txt;
      }
   }
   request.open("GET", "rest/list", true); 
   request.send(null);
}
 
function _ins_form(online) {
   var form1 = `<form name='add'>
               Miejsce <select name="miejsce" size="1">
               <option value="Warszawa">Warszawa</option>
               <option value="Krakow">Kraków</option>
               <option value="Kilece">Kilece</option>
               <option value="Rzeszow">Rzeszów</option>
               <option value="Szczecin">Szczecin</option>
               </select></br></br>
               Data <input type='date' name='data'></input></br></br>
               Wartość AQI <input type='number' name='temp' min="0" max="500"></input>_[ug/m3]</br></br>
               Rodzaj cząstek <select name="poerwiastek" size="1">
               <option value="pm25">PM2.5</option>
               <option value="pm10">PM10</option>
               <option value="o3">O3</option>
               <option value="no2">NO2</option>
               <option value="so2">SO2</option>
               <option value="co">CO</option>
               </select></br></br>
               <input type='button' value='Wyślij' style="width: auto; height: 30px; font-weight: bold; background-color: #7f7aa8; border: 6px solid #433e68; border-radius: 8px;" onclick=`;
               form1 += online ? "'_insert(this.form)'" : "'_insertOffline(this.form)'";
               form1 += " ></input></form>";
   document.getElementById('data').innerHTML = form1;
   document.getElementById('result').innerHTML = ''; 
}
 
function _insert(form)  {
   if(_validate(form)) {
   document.getElementById("result").style.backgroundColor = "#7d9cb1";
   _validate(form);
   var data = {};
    data.id = form.miejsce.value + form.data.value + form.poerwiastek.value;
    data.place = form.miejsce.value;
    data.date = form.data.value;
    data.temp = form.temp.value;
    data.weather = form.poerwiastek.value;
    txt = JSON.stringify(data);
    
    document.getElementById('result').innerHTML = ''; 
    document.getElementById('data').innerHTML = '';  
    request = getRequestObject() ;
    request.onreadystatechange = function() {
       if (request.readyState == 4 && request.status == 200 ) {
         $array = JSON.parse(request.response);
         document.getElementById('result').innerHTML += "<p>" + $array["return"] + "</p>";
       }
    }
    request.open("POST", "rest/save", true);
    request.send(txt);
   }
}

function _insertOffline(form) {
   if(_validate(form)) {
   var data = {};
   data.id = form.miejsce.value + form.data.value + form.poerwiastek.value;
    data.place = form.miejsce.value;
    data.date = form.data.value;
    data.temp = form.temp.value;
    data.weather = form.poerwiastek.value;

   var open = indexedDB.open("localDB", 2);
   open.onupgradeneeded = function() {
      var db = open.result;
      if (!db.objectStoreNames.contains("weather")) { 
        db.createObjectStore("weather", {keyPath: "id"}); 
      }
    };
    open.onsuccess = function() {
       var db= open.result;
       var tx= db.transaction("weather", "readwrite");
       var store= tx.objectStore("weather");
       store.put({id: data.id, place: data.place, date: data.date, temp: data.temp, weather: data.weather}); 

      tx.oncomplete = function() {
          db.close();    
      };
    }
   }
}

function _validate(form) {
         
   if(form.data.value=="" || form.temp.value=="") {
      alert("Wypełnij wszystkie pola wymagane.");
      return false;
   }
   else {
      if(parseInt(form.temp.value) > 500 || parseInt(form.temp.value) < 0) {
         alert("Podaj wartość AQI z przedziału [0, 500].");
         return false;
      }
      var date = form.data.value;
      var parts = date.split("-");
      if(parts[0] != "2022" || (parts[1] != "01" && parts[1] != "02")) {
         alert("Podaj datę w zakresie stycznia i lutego 2022.");
         return false;
      }
      else {
         var today = new Date();
         var d = String(today.getDate());
         var m = String(today.getMonth() + 1).padStart(2, '0'); 
         if(parts[1] == m && parseInt(parts[2]) > parseInt(d) || parseInt(parts[1]) > parseInt(m)) {
            alert("Nie podawaj daty z przyszłości.");
            return false;
         }
      }
      return true;
   }
}

function _listOffline() {
   var open = indexedDB.open("localDB", 2);
   open.onupgradeneeded = function() {
      var db = openRequest.result;
      if (!db.objectStoreNames.contains('weather')) { 
        db.createObjectStore('weather', {keyPath: 'id'}); 
      }
    };
    var txt = "<div class='table'><table><tr><th>Nr</th><th>Miejsce</th><th>Data</th><th>Skala AQI[ug/m3]</th><th>Rodzaj cząstek</th></tr>";
    open.onsuccess = function() {
      var db= open.result;
      var tx= db.transaction("weather", "readwrite");
      var store= tx.objectStore("weather");
      var g = store.getAll();
      g.onsuccess = function() {
         var res = g.result;
         var i = 0;
        for(const item of res) {
           txt += "<tr><td>" + i + "</td>";
           for(const field in item) {
               if(field !== "id")
                  txt += "<td>" + item[field] + "</td>";
           }
           txt += "</tr>";
           i++;
        }
        txt += "</table></div>";
        document.getElementById('data').innerHTML = '';
        document.getElementById('result').innerHTML = txt;
    };

      tx.oncomplete = function() {
          db.close();    
      };
    }
}

function _reg_form() {
   var form2 = `<form name='reg'>
               Email <input type='text' name='email'></input></br></br>
               Hasło <input type='password' name='haslo'></input></br></br>
               <input type='button' value='Zarejestruj się' style="width: auto; height: 30px; font-weight: bold; background-color: #7f7aa8; border: 6px solid #433e68; border-radius: 8px;" onclick='_reg(this.form)' ></input></form>`;
   document.getElementById('data').innerHTML = form2;
   document.getElementById('result').innerHTML = ''; 
}

function _reg(form) {
   if(_validateReg(form)) {
   var user = {};
    user.email = form.email.value;
    user.pass = md5(form.haslo.value);
    txt = JSON.stringify(user);

    document.getElementById('result').innerHTML = ''; 
    document.getElementById('data').innerHTML = '';  
    request = getRequestObject() ;
    request.onreadystatechange = function() {
       if (request.readyState == 4 && request.status == 200 ) {
          $array = JSON.parse(request.response);
          document.getElementById('result').innerHTML = "<p>" + $array["return"] + "</p>";
       }
    }
    request.open("POST", "rest/reg", true);
    request.send(txt);
   }
}

function _validateReg(form) {
   if(form.email.value=="" || form.haslo.value=="") {
      alert("Wypełnij wszystkie pola wymagane.");
      return false;
   }
   else
      return true;
}

function _log_form() {
   var form3 = `<form name='log'>
               Email <input type='text' name='email'></input></br></br>
               Hasło <input type='password' name='haslo'></input></br></br>
               <input type='button' value='Zaloguj się' style="width: auto; height: 30px; font-weight: bold; background-color: #7f7aa8; border: 6px solid #433e68; border-radius: 8px;" onclick='_log(this.form)' ></input></form>`;
   document.getElementById('data').innerHTML = form3;
   document.getElementById('result').innerHTML = '';
}

function _log(form) {
   var user = {};
    user.email = form.email.value;
    user.pass = md5(form.haslo.value);
    txt = JSON.stringify(user);

    document.getElementById('result').innerHTML = ''; 
    document.getElementById('data').innerHTML = '';  
    request = getRequestObject() ;
    request.onreadystatechange = function() {
       if (request.readyState == 4 && request.status == 200 )    {
         $array = JSON.parse(request.response);
          document.getElementById('result').innerHTML = "<p>" + $array["return"] + "</p>";
          if($array["return"] === "Uzytkownik zalogowany.") {
            if (typeof(Storage) !== "undefined") {
               sessionStorage.log = true;
               displayButtons(true);
             } else {
               document.getElementById("result").innerHTML = "Sorry, your browser does not support web storage...";
             }
             _moveOnline();
          }
       }
    }
    request.open("POST", "rest/log", true);
    request.send(txt);
}

function _moveOnline() {
   var open = indexedDB.open("localDB", 2);
   open.onupgradeneeded = function() {
      var db = openRequest.result;
      if (!db.objectStoreNames.contains('weather')) { 
        db.createObjectStore('weather', {keyPath: 'id'}); 
      }
    };

    var data = {};
    var txt;
    open.onsuccess = function() {
      var db= open.result;
      var tx= db.transaction("weather", "readwrite");
      var store= tx.objectStore("weather");
      var g = store.getAll();
      g.onsuccess = function() {
         var res = g.result;
        for(const item of res) {
               data.id = item["id"];
               data.place = item["place"];
               data.date = item["date"];
               data.temp = item["temp"];
               data.weather = item["weather"];
               txt = JSON.stringify(data);
               sendOne(txt);
        }
      };
      store.clear();
      tx.oncomplete = function() {
         db.close();
      };
    }
}

function sendOne(txt) {
    request = getRequestObject() ;
    request.onreadystatechange = function() {
       if (request.readyState == 4 && request.status == 200 )    {
          $array = JSON.parse(request.response);
          document.getElementById('result').innerHTML += "<p>" + $array["return"] + "</p>";
          }
       }
    request.open("POST", "rest/saveUpdate", true);
    request.send(txt);
}

function _log_out() {
   document.getElementById("result").style.backgroundColor = "#7d9cb1";
    document.getElementById('result').innerHTML = ''; 
    document.getElementById('data').innerHTML = '';  
    request = getRequestObject() ;
    request.onreadystatechange = function() {
       if (request.readyState == 4 && request.status == 200 )    {
         $array = JSON.parse(request.response);
         document.getElementById('result').innerHTML = "<p>" + $array["return"] + "</p>";
         sessionStorage.log = false;
         displayButtons(false);
       }
    }
    request.open("POST", "rest/logOut", true);
    request.send(null);
}

function _analize() {

   var form4 = `<form name='chart'>
               <select name="miejsce" size="1">
               <option value="Warszawa">Warszawa</option>
               <option value="Krakow">Kraków</option>
               <option value="Kilece">Kilece</option>
               <option value="Rzeszow">Rzeszów</option>
               <option value="Szczecin">Szczecin</option>
               </select></br></br>
               <input type='button' value='Wybierz' style="width: auto; height: 30px; font-weight: bold; background-color: #7f7aa8; border: 6px solid #433e68; border-radius: 8px;" onclick='_draw(this.form)' ></input></form>`;
   document.getElementById('data').innerHTML = form4;
   document.getElementById('result').innerHTML = '';
}

function _draw(form) {
   document.getElementById("result").style.backgroundColor = "transparent";

   var city = form.miejsce.value;

   document.getElementById('result').innerHTML = `<canvas id='canvas' width='1200' height='600' style="background-color: #4da087;">
   Canvas not supported
   </canvas>`;
   var canv = document.getElementById("canvas");
   var ctx = canv.getContext("2d");
   
   ctx.strokeStyle = "Black";
   ctx.beginPath();
   ctx.moveTo(30, 570);
   ctx.lineTo(1180, 570);
   ctx.stroke(); 

   ctx.beginPath();
   ctx.moveTo(30, 10);
   ctx.lineTo(30, 570);
   ctx.stroke();

   var tempLabel = [500, 400, 300, 200, 100, 0];
   for(var i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(25, 10 + i*112);
      ctx.lineTo(35, 10 + i*112);
      ctx.stroke();
      ctx.fillText(tempLabel[i], 1, 10 + i*112 + 3);
   }

   var today = new Date();
   var d = String(today.getDate());
   var m = String(today.getMonth() + 1).padStart(2, '0');
   var days = 0;
   if(m === "01")
      days = parseInt(d);
   else
      days = parseInt(d) + 31;

   var step = 1150 / (days-1);
   for(var i = 0; i < days; i++) {
      ctx.beginPath();
      ctx.moveTo(30 + i*step, 565);
      ctx.lineTo(30 + i*step, 575);
      ctx.stroke();
      if((i + 1) % 5 == 0) {
         var x = i + 1;
         var str;
         if(i < 31)
            str = x.toString() + ".01";
         else {
            x -= 31;
            str = x.toString() + ".02";
         }
         ctx.fillText(str, 20 + i*step, 590);
      }
   }

   _getData(step, city);
}

function _getData(step, city) {
   request = getRequestObject() ;
   request.onreadystatechange = function() {
      if (request.readyState == 4)    {
         tabjson = JSON.parse(request.response);
         var canv = document.getElementById("canvas");
         var ctx = canv.getContext("2d");

         var colors = ["Red", "Yellow", "Pink", "Orange", "White", "Black"]

         for ( var id in tabjson )  {
            for ( var prop in tabjson[id] ) {             
                if ( prop === 'place' && tabjson[id][prop] === city) {
                  var date = tabjson[id]['date'].split("-");
                  d = date[2];
                  m = date[1];
                  if(m === "02")
                     d += 31;
                  var temp = parseInt(tabjson[id]['temp']);
      
                  ctx.beginPath();
                  switch(tabjson[id]['weather']) {
                     case "pm25":
                        ctx.fillStyle = colors[0];
                        break;
                     case "pm10":
                        ctx.fillStyle = colors[1];
                        break;
                     case "o3":
                        ctx.fillStyle = colors[2];
                        break;
                     case "no2":
                        ctx.fillStyle = colors[3];
                        break;
                     case "so2":
                        ctx.fillStyle = colors[4];
                        break;
                     case "co":
                        ctx.fillStyle = colors[5];
                        break;
                  }
                  i = 570-(temp*1.12)
                  ctx.arc(30 + (d-1)*step, i, 5, 0, 2 * Math.PI); 
                  ctx.fill();
                }
            }
        }
        var label = "PM2.5        PM10        O3              NO2          SO2           CO";
        ctx.fillStyle = "Black";
        ctx.fillText(label, 500, 45);

         for(var i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.fillStyle = colors[i];
            ctx.rect(500 + i*50, 25, 24, 10); 
            ctx.fill();
         }
      }
   }
   request.open("GET", "rest/list", true);
   request.send(null);
}

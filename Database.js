/*
	Głowne funkcje
	1. Ładowanie bazy danych
	2. Dekoduje dane pobrane z bazy
	3. Zapisywanie BD
	4. Preparowanie danych do zapisu
	5. Tworzenie Tabeli  <-- Funkcja zewnętrzna
	6. Dodawanie wartości do tabeli <-- Funkcja zewnętrzna
	7. Sprawdzenie czy tabela istnieje 
	8. Tworzenie pustej bazydanych 
	9. Pobranie listy tabel <-- Funkcja zewnętrzna
	10. Pobieranie listy kluczy tabeli <-- Funkcja zewnętrzna
	11. Pobieranie danych z tabeli <-- Funkcja zewnętrzna
	12. Usówanie tabeli
	13. Wykrycie zmiany wartości tableList <-- event element.onTableListChange
	14. Usówanie klucza tablicy
	15. Usównanie wartości tabeli
	16. Wykrycie zmiany indeksu wartości tabeli <-- event element.onTableValuesIndexChange

	
	funkcje Tabeli
	100. Tworzenie tabeli
	101. Sprawdzenie poprawności danych
	102. Przygotowanie tabeli do zapisu
	103. Pobieranie listy kluczy tablicy
	104. Tworzenie tabeli
	105. Dodawanie wartości do tabeli
	106. Pobieranie wartości z tabeli
	107. Usówanie klucza tabeli
	108. Usówanie wartości z tabeli

	Funkcje pomocnicze
	200. Raport błędów
	201. Usówanie elementu tabeli
	202. Rozszerzanie obiektu JSON

*/

(function(window, undefined){

	window.Database = function(name,loadedFn){

		if(!(this instanceof window.Database))
		{
			return new Database(name);
		}

		this.supported = Storage === undefined ? false : true;
		this.dbName=name;

		if(this.supported)
			this.LoadLocalStorage(name);
		else
			this.createDataBase();

		// this.createTable("tablename2",["imie","nazwisko","hej"]);
		// this.addTableValues("tablename2",["Mateusz","Wit","hej"]);
		// this.addTableValues("tablename2",["Mateusz","Wit","hej"]);
		// this.addTableValues("tablename2",["Mateusz","Wit","hej"]);
		// this.addTableValues("tablename2",["Mateusz","Wit","hej"]);
		// this.addTableValues("tablename2",["Mateusz","Wit","hej"]);
		// this.removeTableKey("tablename2","hej");
	}


	// 16. Wykrycie zmiany indeksu wartości tabeli

	Database.prototype.changeValuesIndex = function(tablename){

		if(typeof this.onTableValuesIndexChange === "function"){
			this.onTableValuesIndexChange(tablename);
			return true;
		}

	}


	// 15. Usównanie wartości tabeli

	Database.prototype.removeTableValue = function(tablename,id){
		if(typeof id !== "number" || id<0){

			this.reportError("removeTableValue","Identyfikator jest nieprawidłowy");
			return false;
		}


		var tableExistence = this.isTableExist(tablename);

		if(tableExistence === true)
		{
			if(this.data[tablename].removeValue(id)){
				this.changeValuesIndex(tablename);
				return true;
			}
			return false;
		}
		else if (tableExistence === false){
			this.reportError("removeTableValue","Tabela nie istnieje : "+tablename);
			return false;
		}
		this.reportError("removeTableKey","Wystąpił nieoczekiwany błąd");
		return false;
	}

	// 14. Usówanie klucza tabeli

	Database.prototype.removeTableKey = function(tablename,key){

		if(typeof key !== "string"){
			this.reportError("removeTableKey","Klucz nie jest poprawnym typem danych")
			return false;
		}

		var tableExistence = this.isTableExist(tablename);

		if(tableExistence === true){

			try{
				if(this.data[tablename].removeKey(key))
				{
					this.changeValuesIndex(tablename);
					this.SaveLocalStorage(this.dbName);
					return true;
				}
			}catch(e){
				this.reportError("removeTableKey catch block",e.message);
			}
			return false;
		}
		else if (tableExistence === false){
			this.reportError("removeTableKey","Tabela nie istnieje : "+tablename);
			return false;
		}
		this.reportError("removeTableKey","Wystąpił nieoczekiwany błąd");
		return false;

	}


	// 13. Wykrycie zmiany wartości tableList

	Database.prototype.TableListChange = function(){
		if(typeof this.onTableListChange ==="function")
		{
			var list = this.getTableList();
			if(list)
				this.onTableListChange(list);
		}

	}

	// 12. Usówanie tabeli

	Database.prototype.removeTable = function(tablename){

		var tableExistence = this.isTableExist(tablename);

		if(tableExistence === true)
		{
			this.data.tableList = this.deleteTableElemen(this.data.tableList,tablename);
			delete this.data[tablename];

			if(this.isTableExist(tablename)===false){
				this.SaveLocalStorage(this.dbName);
			}

			this.TableListChange();
			return true;
		}
		else if(tableExistence === false){

			this.reportError("removeTable","Podana tabela nie istnieje : "+tablename);
			return false;
		}

		this.reportError("removeTable","Wystąpił nieoczekiwany błąd");
		return false;

	}


	// 9. Pobranie listy tabel

	Database.prototype.getTableList = function(){
		if(!(this.data.tableList instanceof Array))
			return false;

		return this.data.tableList;

	}


	// 10. Pobieranie listy kluczy tabeli

	Database.prototype.getTableKeys = function(tablename){

		var tableExistence = this.isTableExist(tablename);

		if(tableExistence === true)
		{	

			var keys = this.data[tablename].getKeyList();
			if(!keys)
			{
				this.reportError("getTableKeys", "W tabeli nie ma obiektu kluczy");
				return keys;
			}
			else if(keys.length==0){
				this.reportError("getTableKeys", "W tabeli nie ma jeszcze kluczy")
				return false;
			}

			return keys;

			
		}else if(tableExistence === false)
		{
			this.reportError("getTableKeys", "Wybrana tabela nie istnieje : "+tablename);
			return false;
		}
		this.reportError("getTableKeys", "Wystąpił nieoczekiwany błąd");
		return false;
	}

	// 11. Pobieranie danych z tabeli

	Database.prototype.getTableValues = function(tablename,config){

		var tableExistence =  this.isTableExist(tablename),
			defconf = {
				select : "all",
				id: 1,
				limit: "all"
			};

		if(tableExistence === true)
		{	
			this.jsonExtend(defconf, config);

			var data = this.data[tablename].getValues(defconf);

			if(!data)
				return false;
			
			return data;
		}
		else if(tableExistence === false)
		{
			this.reportError("getTableValues", "Wybrana tabela nie istnieje : "+tablename);
			return false;
		}
		this.reportError("getTableValues", "Wystąpił nieoczekiwany błąd");
		return false;
	}

	// 8. Tworzenie pustej bazydanych

	Database.prototype.createDataBase =  function(){
		this.data={
			tableList:[]
		}	
		this.SaveLocalStorage(this.dbName);
	}


	// 7. Sprawdzenie czy tabela istnieje

	Database.prototype.isTableExist = function(tablename){

		if(this.data === undefined)	{
			this.reportError("isTableExist","Brak kontenera danych");
			return -1;
		}
		if(typeof tablename !== "string")
		{
			this.reportError("isTableExist","Nazwa tabeli nie jest wymaganym typem danych[String]");
			return -1;
		}
		if(this.data.tableList.indexOf(tablename)>=0)
		{
			if(this.data[tablename]===undefined)
			{
				this.data.tableList = this.deleteTableElemen(this.data.tableList,tablename);
				this.TableListChange();
				return false;
			}
			return true;
		}
		else {
			return false;
		}

	}

	// 6. Dodawanie wartości do tabeli

	Database.prototype.addTableValues = function(tablename,values){


		var tableExistence = this.isTableExist(tablename);

		if( tableExistence === true ){

			if(typeof values !== "string" && !(values instanceof Array))
			{
				this.reportError("addTableValues","Podano błędne dane");
				return false;
			}
			if(!this.data[tablename].addValues(values))
				return false;
			else
			{	
				this.SaveLocalStorage(this.dbName);
				this.changeValuesIndex(tablename);
				return true;
			}

		} else if( tableExistence === false ) {
			this.reportError("addTableValues", "Tabela o takiej nazwie nie istnieje");
		} else{
			this.reportError("addTableValues", "Wystąpił nieoczekiwany błąd");
		}

		return false;
	
	}



	// 5. Tworzenie Tabeli

	Database.prototype.createTable = function(tablename,keys){

		// if(typeof tablename !== "string")
		// {
		// 	this.reportError("createTable", "Nazwa tabeli jest nie jest wymaganym typem danych[String]");
		// 	return;
		// }

		// if(this.data.tableList.indexOf(tablename)>=0){
		// 	this.reportError("createTable", "Tabela o nazwie "+tablename+" już istnieje");
		// 	return;
		// }

		if(this.isTableExist(tablename)){

			this.reportError("createTable", "Tabela o nazwie "+tablename+" już istnieje");
		 	return false;		 	
		}
		if(keys === undefined){
			this.reportError("createTable","Nie podano kluczy");
			return false;
		}

		try{
			this.data[tablename] = new Table(keys,this.reportError);
			this.data.tableList.push(tablename);
			this.TableListChange();
			this.SaveLocalStorage(this.dbName);
			return true;
		}catch(e){
			this.reportError("createTable catch block", e);
			return false;
		}
	
	}

	// 3. Zapisywanie BD

	Database.prototype.SaveLocalStorage = function(key){

		if(!this.supported){
			this.reportError("SaveLocalStorage", "Nie można zapisać danych z powodu braku wsparcia");
			return;
		}

		if(this.data === undefined){
			this.reportError("SaveLocalStorage", "Brak danych");
			return;
		}

		if(typeof this.data !== "object"){
			this.reportError("SaveLocalStorage", "Niepoprawny typ danych");
			return;
		}

		var data=this.prepareData();

		if(!data)
		{
			this.reportError("SaveLocalStorage", "Nieudało sie spreparować danych do zapisu");
			return;
		}

		localStorage.setItem(key,JSON.stringify(data));

	}

	// 4. Preparowanie danych do zapisu
	
	Database.prototype.prepareData = function(){
		var data= Object.create(this.data);
		data.tableList = this.data.tableList;

		if(!(data.tableList instanceof Array))
		{
			this.reportError("prepareData","tableList nie jest tablicą");
			return false;
		}

		if(data.tableList.length==0)
		{
			return {tableList:[]};
		}
		
		data.tableList.forEach(function(element){

			if(data[element] === undefined)
			{
				this.reportError("prepareData","Nie znaleziono obiektu "+element +" zostanie on usunięty z listy");
				data.tableList=this.deleteTableElemen(data.tableList,element);
				return;
			}
			if(!(data[element] instanceof Table))
			{
				this.reportError("prepareData","Nie znany typ elementu "+element+" nastąpi jego usunięcie");
				data.tableList=this.deleteTableElemen(data.tableList,element);
				return;
			}
			try{
				data[element] = data[element].forSave();
			}catch(e){
				this.reportError("prepareData catch block",e.message);
				data.tableList=this.deleteTableElemen(data.tableList,element);
			}

		}.bind(this));


		return data;
	}

	// 1. Ładowanie bazy danych

	Database.prototype.LoadLocalStorage = function(key){

		if(localStorage[key] !== undefined)
		{
			this.decodeDatas(localStorage[key]);
			return ;
		}
		this.createDataBase();
	}

	// 2. Dekoduje dane pobrane z bazy

	Database.prototype.decodeDatas = function(dataString){
		var data = JSON.parse(dataString);

		// decodeDatas Sprawdzenie czy lista jest tabelą

		if(!(data.tableList instanceof Array))
		{
			this.reportError("decodeDatas","tableList nie jest tablicą :"+ typeof data.tableList);
			return;
		}

		// Iteracja Listy 

		data.tableList.forEach(function(element){

			if( data[element] === undefined )	{

				this.reportError("decodeDatas","Zdefiniowano tabelę jednak brak jej obiektu :"+ element);
				
				data.tableList=this.deleteTableElemen(data.tableList,element);

				return;
			}


			try{

				data[element] = new Table(data[element],this.reportError);

			}catch(event){
				data.tableList=this.deleteTableElemen(data.tableList,element);
				this.reportError(element+" decodeDatas blok Catch",event.message);
			}


		}.bind(this));

		// Końcowe przypisanie 
		this.data=data;
	}




	// 200. Raport błędów

	Database.prototype.reportError = function(module,message){
		console.log("["+module+"]",message);
	}

	// 201. Usówanie elementu tabeli
	Database.prototype.deleteTableElemen = function (table,elem){
			return table.filter(function(value){
					return value !== elem;
			});
	}

	// 202. Rozszerzanie obiektu JSON

	Database.prototype.jsonExtend = function(obj){

		var extendedObj = obj;

		[].forEach.call(arguments,function(e){

			if(e==obj)
				return;

			if(typeof e !== "object")
				return
			
			for(var key in extendedObj){
				extendedObj[key]=e[key]||extendedObj[key];
			}

		});

		return extendedObj;
	}









	////////////////////
	// Tabele
	// 100. Tworzenie tabeli

	function Table(tableobiect,reportErrorHandler){

		this.report=reportErrorHandler;
		this.data=tableobiect;
 			
 		if(tableobiect instanceof Array)
 		{
 			if(tableobiect.length==0)
 				throw new Error("Tablica nie posiada kluczy");
 			this.createTable();
 		}
 		else{
 			this.verifydata();
 		}
		

 		this.report("Table","Utworzono tabele " + this.data);

	}

	// 108. Usówanie wartości z tabeli

	Table.prototype.removeValue = function(id){

		if(!(this.values instanceof Array))
			return false;

		if(this.values.length <= id){
			this.report("Table removeValue","Podany identyfikator wykracza poza ilość wartości tablicy");
			return false;
		}

		this.values.splice(id);

		return true;

	}


	// 107. Usówanie klucza tabeli

	Table.prototype.removeKey = function(key){

		if(key.trim()==""){
			this.report("Table removeKey","Nie podano wartości klucza");
			return false;
		}
		if(this.data.tableKeys.length === 1){
			this.report("Table removeKey","Nie można usunąć jedynego klucza tablicy");
			return false;
		}

		var index = this.data.tableKeys.indexOf(key),
			del = Database.prototype.deleteTableElemen;


		if(index <0)
		{
			this.report("Table removeKey","Tabela nie posiada takiego klucza");
			return false;
		}

		this.data.tableKeys = del(this.data.tableKeys,key);

		this.data.values.forEach(function(e){
			e.splice(index,1);
		});

		this.verifydata();

		return true;
	}

	// 104. Tworzenie tabeli

	Table.prototype.createTable = function(){
		if(!(this.data instanceof Array))
		{
			throw new Error("Dane nie są tablicą");  // zabezpieczenie przed zewnętrznym wywołaniem
		}

		var data = this.data.filter(function(e){
			if(typeof e === "string")
				return e ;
			else
				this.report("Table createTable","Podano nieprawidłowe klucze, niektóre z nich mogą być obcięte","WARING");
		}.bind(this));

		this.data = {
			tableKeys:data,
			values:[]
		};

	}

	// 101. Sprawdzenie poprawności danych

	Table.prototype.verifydata = function(){

		var data=this.data;

		if(data.tableKeys === undefined)
			throw new Error("Brak zdefiniowanych kluczy tablicy");

		if(!(data.tableKeys instanceof Array ))
			throw new Error("tableKeys nie są tabelą");

		if(!(data.values instanceof Array ))
			throw new Error("tablica wartości nie istnieje");

		if(data.tableKeys.length == 0 && data.values.length > 0)
			throw new Error("Wykryto dane mimo braku kluczy");

		var temporaryArray = new Array();

		data.values.forEach(function(e){
			if(e.length != data.tableKeys.length)
			{
				this.report("Table.verifydata","Znaleziono błędny log w tablicy zostanie on usunięty");
				return;
			}
			temporaryArray.push(e);
		}.bind(this));

		data.values=temporaryArray;

		this.data = data;

	}

	// 106. Pobieranie wartości z tabeli

	Table.prototype.getValues = function(conf){

		if( typeof conf !== "object" ){
			this.report("Table getValues","Podano niewłaściwy config");
			return false;
		}
		if( this.data.values.length == 0 )
		{
			this.report("Table getValues","W tabeli nie ma żadnych danych");
			return false;
		}
		if( conf.limit === 0 )
		{
			this.report("Table getValues","Podany limit to 0");
			return false;
		}
		if( conf.id > this.data.values.length )
		{	
			this.report("Table getValues","Identyfikator początkowy jest większy niż liczba dostępnych logów");
			return false;
		}

		var indexes = new Array(),
			id= conf.id,
			limit = conf.limit ==="all" ? this.data.values.length : conf.limit,
			returnObj = new Array();

		if( (id-1) + limit > this.data.values.length){
			limit = this.data.values.length - (id-1);
		}

		if(typeof conf.select === "string"){

			if(conf.select === "all")
				indexes = false;

		}
		else if(conf.select instanceof Array){

			if(conf.select.length==0){
				this.report("Table getValues","Brak wybranych kluczy w tabeli");
				return false;
			}

			conf.select.forEach(function(e){

				var index = this.data.tableKeys.indexOf(e);

				if(index<0){
					this.report("Table getValues","Podany klucz nie istnieje : "+e);
					return;
				}

				indexes.push(index);

			}.bind(this));

			if(indexes.length == 0){
				this.report("Table getValues","Żaden z podanych kluczy nie został znaleziony");
				return false;
			}
		}

		for(var i=id-1;i<(id-1+limit);i++)
		{

			if(indexes===false)
			{
				returnObj.push([i].concat(this.data.values[i]));
				continue;
			}

			var temporaryArray = new Array();
			temporaryArray.push(i);
			indexes.forEach(function(e){

				temporaryArray.push(this.data.values[i][e]);

			}.bind(this));

			returnObj.push(temporaryArray);

		}

		return returnObj;

	}


	// 105. Dodawanie wartości do tabeli

	Table.prototype.addValues = function(values){

		var len = (typeof values === "string")? 1:values.length;

		if(len != this.data.tableKeys.length)
		{
			this.report("Table addValues","Ilość podanych wartości nie zgadza się z ilością kluczy");
			return false;
		}

		if(typeof values === "string")
			this.data.values.push([values]);
		else 
			this.data.values.push(values);

		return true;
	}

	// 103.Pobieranie listy kluczy tablicy

	Table.prototype.getKeyList = function(){
		return this.data.tableKeys || false;
	}

	// 102. Przygotowanie tabeli do zapisu
	Table.prototype.forSave = function(){
		this.verifydata();
		return this.data;
	}




})(window);


// var db = new Database("databasetest");

// console.log(db.getTableValues(db.getTableList()[0],{
// 	id:1,
// 	limit:5
// }));
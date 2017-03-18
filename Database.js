/*
	Głowne funkcje
	1. Ładowanie bazy danych
	2. Dekoduje dane pobrane z bazy
	3. Zapisywanie BD
	4. Preparowanie danych do zapisu
	5. Tworzenie Tabeli
	
	funkcje Tabeli
	100. Tworzenie tabeli
	101. Sprawdzenie poprawności danych
	102. Przygotowanie tabeli do zapisu
	103. Pobieranie listy kluczy tablicy
	104. Tworzenie tabeli

	Funkcje pomocnicze
	200. Raport błędów


*/

(function(window){

	window.Database = function(name){

		if(!(this instanceof window.Database))
		{
			return new Database(name);
		}

		this.supported = Storage === undefined ? false : true;
		this.dbName=name;

		if(this.supported)
			this.LoadLocalStorage(name);

		this.createTable("tablename2",["imie","nazwisko","hej"]);
	}	

	// 5. Tworzenie Tabeli

	Database.prototype.createTable = function(tablename,keys){

		if(this.data.tableList.indexOf(tablename)>=0){
			this.reportError("createTable", "Tabela o nazwie "+tablename+" już istnieje");
			return;
		}

		if(typeof tablename !== "string")
		{
			this.reportError("createTable", "Nazwa tabeli jest nie jest wymaganym typem danych[String]");
			return;
		}

		try{
			this.data[tablename] = new Table(keys,this.reportError);
			this.data.tableList.push(tablename);
			this.SaveLocalStorage(this.dbName);
		}catch(e){
			this.reportError("createTable catch block", e);
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

		localStorage.setItem(key+"1",JSON.stringify(data));

	}

	// 4. Preparowanie danych do zapisu
	
	Database.prototype.prepareData = function(){

		var data= this.data;

		if(!(data.tableList instanceof Array))
		{
			this.reportError("prepareData","tableList nie jest tablicą");
			return false;
		}

		if(data.tableList.length==0)
		{
			return JSON.stringify({tableList:[]});
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

		this.data={
			tableList:[]
		}	
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

		if(data.tableKeys===undefined)
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



	// 103.Pobieranie listy kluczy tablicy

	Table.prototype.getKeyList = function(){
		return this.data.tableKeys;
	}

	// 102. Przygotowanie tabeli do zapisu
	Table.prototype.forSave = function(){
		this.verifydata();
		return this.data;
	}




})(window);
new Database("databasetest");
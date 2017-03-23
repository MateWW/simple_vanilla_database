(function($){
	var dbName = false,
		dbList = [],
		dbObj,
		alertboxclass;

	function showAlert(status,text,delay){
		
		var delay=delay||5000,
			elem=alertboxclass;


		if(status==="error")
		{
			toremove="error";
		}
		else if(status==="complete")
		{
			toremove="complete";
		}
		else if(status==="info")
		{
			toremove="info";
		}

		elem.text(text);

		elem.addClass(toremove);
		setTimeout(function(){
			elem.removeClass(toremove);
		},delay);

	}

	function spawnDbList(){
		if(Storage !== undefined)
		{
			for(var key in localStorage){
				dbList.push(key);
			}
		}
	}

	function RenderLeftMenu(elem,list){
		elem=elem.find("ul");
		elem.empty();
		if(list instanceof Array && list.length>0)
		{	
			
			list.forEach(function(e){
				elem.append(`<a href="#${e}"><li>${e}<i class="fa fa-ban" aria-hidden="true"></i></li></a>`);
			});
		}

	}

	function AddDbEvents(leftBar,dataContent,dataIntroduceSettings){		

		dbObj.onTableListChange = function(list){
			RenderLeftMenu(leftBar,list);
		}
		dbObj.onTableValuesIndexChange = function(){
			dataIntroduceSettings.find("input[name=logcount]").trigger("change");
		}

	}

	function loadDb(choseDBelem,nameButton,leftBar,dataContent,dataIntroduceSettings,name=dbName){


		function loadDbcd(name){

			if(typeof dbObj === "object")
				delete dbObj;

			dbObj = new Database(name);


			AddDbEvents(leftBar,dataContent,dataIntroduceSettings);
			RenderLeftMenu(leftBar,dbObj.getTableList());

			nameButton.text(name);
		}

		if(!name){
			chooseDb(choseDBelem).done(loadDbcd);
			return;
		}
	}

	function chooseDb(elem){
		
		var def= new $.Deferred();

		var list=elem.find("ul");
		list.empty();

		dbList.forEach(function(e){
			$("<li>"+e+"</li>").appendTo(list);
		});

		var element = $("<li><input type='text'/><button>Add New</button></li>").appendTo(list);
			
			element.find("button").on("click",function(){
				var name = $.trim(element.find("input").val());
				if(!/[^a-zA-Z0-9]/g.test(name)){
					dbList.push(name);
					def.resolve(name);
					elem.hide();
				}
				else{
					element.find("input").val("");
				}
			});



		list.on("click","li",function(){
			var text = $(this).text();
			if(dbList.indexOf($.trim(text))>=0)
			{
				dbName=$.trim(text);
				elem.hide();
				def.resolve(dbName);
			}
		});

		elem.show();

		return def.promise();
	}

	function RenderAddNav(elem,tablename,len){


		let th = elem.find(".tbl-add tr").eq(0),
			button = elem.find(".tbl-add button");
			

		th.empty();

		for(let i=0;i<len;i++){

			$("<td><input type='text'></td>").appendTo(th);

		}

		button.off("click");
		button.on("click",function(){
			var inputs = th.parent().find("input"),
				values =  new Array();

			inputs.each(function(k,e){
				let val=$.trim(e.value);
				console.log(e.value,k);
				if(val===""){
					values.push(" ");
					return true;
				}
				values.push(val);
			});

			if(dbObj instanceof Database){
				if(dbObj.addTableValues(tablename,values)){
					showAlert("complete","Udało dodać wartości do tabeli");
					inputs.val("");
					return;
				}
			}
			showAlert("error","Nie udało sie dodać wartości do tabeli");
			return;

		});

	}

	function renderDataTable(dataElem,tablename,key,values){

		dataElem.find("h3").text(tablename);

		let tblHeader = dataElem.find(".tbl-header tr"),
			tblContent = dataElem.find(".tbl-content tbody");

		tblHeader.empty();
		tblContent.empty();

		tblHeader.off("click");
		tblHeader.on("click","i",function(){

			let keyname=$(this).parent().attr("class").split("_")[1];

			if(dbObj instanceof Database){
				if(dbObj.removeTableKey(tablename,keyname)){
					showAlert("complete","Udało się usunąć klucz "+keyname);
					return;
				}
			}
			showAlert("error","Nie udało się usunąć klucza "+keyname);

		});


		RenderAddNav(dataElem,tablename,key.length);

		$.each(key,function(k,e){
			$(`<th class="key_${e}">${e}<i class="fa fa-ban" aria-hidden="true"></i></th>`).appendTo(tblHeader);
		});

		if(!values)
			return;

		$.each(values,function(k,e){

			let [id,...et]=e,
				container= $("<tr>");

			container.data("id",id);

			$.each(et,function(k,e){

				container.append(`<td>${e}</td>`);

			});
			container.appendTo(tblContent);
		});

	}

	function loadTable(dataElem,tablename,startid=1,limit){


		var key = dbObj.getTableKeys(tablename),
			settings = dataElem.find("#data_settings input"),
			limit = limit||+settings.filter("[name=loglist]").val(),
			values = dbObj.getTableValues(tablename,{
				select:"all",
				id:startid,
				limit:limit
			});

		if(!key){
			showAlert('error',`Nie udało się załadować tabeli ${tablename}`);
			return false;
		}
		renderDataTable(dataElem,tablename,key,values);

	}

	function addCreateTableEvents(elem,dataIntroduce){
		let button = elem.find("#addNew"),
			buttonrm = elem.find("#removeNew"),
			buttonTable = elem.find("button"),
			lastitem;

		button.off("click");
		buttonrm.off("click");
		buttonTable.off("click");

		buttonTable.on("click submit",(e)=>{
			e.preventDefault();

			if(dbObj instanceof Database){
				let tablename = elem.find("input:first").val(),
					keys = new Array();
					elem.find("input").not(":first").each(function(){
						keys.push($.trim(this.value));
					});

				if(dbObj.createTable(tablename,keys)){

					showAlert("complete","Udało się utworzyć tabele "+tablename);
					elem.find("input").val("");
				}
				else{
					showAlert("error","Nie udało sie utworzyć tabeli");
				}
			}
		});

		button.on("click",function(){
			lastitem=$("<tr><td colspan='2'><input type='text'></td></tr>").insertBefore($(this).parents("tr"));
		});
		buttonrm.on("click",()=>{
			if(lastitem){
				if(lastitem.index()>1)
				{
					lastitem.remove();
					lastitem= elem.find("input:last").parents("tr");
				}
				
			}
		});
	}


	$(document).ready(function(){

		

		var topBar = $('.bar'),
			leftBar = $("#table_select"),
			dataContent = $(".data_container"),
			dbLightBox =  $("#Chose_DB"),
			dbNameButton = $(".head-hb>p"),
			dataIntroduce = $("#data_introduce"),
			dataCreateTable = $("#data_createDB"),
			dataIntroduceSettings = $("#data_settings"),
			currentTableName = false;
		
		alertboxclass = $(".alert");



		spawnDbList();		
		loadDb(dbLightBox,dbNameButton,leftBar,dataContent,dataIntroduceSettings);

		leftBar.on("click","li",function(e){

			e.preventDefault();

			var tablename= currentTableName = $(this).parent().attr("href").slice(1);

			if(e.target.nodeName == "I")
			{
				if(confirm("Czy napewno chcesz usunąć tabele : "+tablename))
				{
					if(dbObj instanceof Database)
					{
						if(dbObj.removeTable(tablename)){
							showAlert("complete","Udało się usunąć tabele "+tablename);
							return;
						}
					}
					showAlert("error","Nie udało się usunąć tabeli "+tablename);
				}
				return;
			}
			
			dataContent.hide( function(){
				
				loadTable(dataIntroduce,tablename);
				dataIntroduce.show();
			}.bind(this) );

		});

		// dataIntroduceSettings.find("button").on("click",function(){

		// 	let key = $(this).parent().find("input").val() || "";

		// 	if(key.length==0){
		// 		return;
		// 	}

		// 	if(dbObj instanceof Database){

		// 		if(dbObj.removeTableKey(currentTableName,key)){
		// 			showAlert("complete","Dodano klucz "+key+" do tablicy "+currentTableName);
		// 			return ;
		// 		}

		// 	}
		// 	showAlert("error",`Nie udało się dodać klucza ${key} do tablicy ${currentTableName}`) ;
		// 	return;
		// });

		dataIntroduceSettings.find("input[name=logcount]").on("change",function(){

			if(!currentTableName)
				return;

			loadTable(dataContent,currentTableName,1,(this.value==""?0:+this.value));

		});


		dbNameButton.on("click",function(){
			loadDb(dbLightBox,dbNameButton,leftBar,dataContent,dataIntroduceSettings,false);
		});



		leftBar.find("button").on("click",function(){

			dataContent.hide(function(){
				addCreateTableEvents(dataCreateTable,dataIntroduce);
				dataCreateTable.show();
			});

		});



		$('.hamburger-menu').on('click', function() {
			topBar.toggleClass('animate');
			leftBar.toggleClass('hidden');
			dataContent.toggleClass('short');
		});

	});

	$(window).on("load resize ", function() {
	  var scrollWidth = $('.tbl-content').width() - $('.tbl-content table').width();
	  $('.tbl-header').css({'padding-right':scrollWidth});
	}).resize();

})(jQuery);
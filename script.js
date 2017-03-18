(function(){

	function showAlert(alertboxclass,status,text,delay){
		
		var delay=delay||5000,
			elem=document.querySelector(alertboxclass);
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
		elem.innerText=text;
		elem.classList.add(toremove);
		setTimeout(function(){
			elem.classList.remove(toremove);
		},delay);

	}

	function Database(msgbox){
		this.msgbox = msgbox;
		this.supported = typeof(Storage) === "undefined" ? false : true;
		if(!this.supported)
			showAlert(msgbox,"error","Twoja przeglądarka nie wspiera LocalStorage");
		this.loadDb();
	}

	Database.prototype.loadDb = function(){
		if(this.supported)
		{
			this.tableList = new Array();
			this.datas = new Array();
			for(var key in localStorage)
			{
				this.tableList.push(key);
				this.datas.push(JSON.parse(localStorage[key]));			
				
			}
			showAlert(this.msgbox,"info","Udało się załadować baze danych");
		}
	}



	Database.prototype.saveDb = function(key){
		var index=this.tableList.indexOf(key);
		if(this.tableList.indexOf(key)>=0)
		{	
			localStorage.setItem(key,JSON.stringify(this.datas[index]));
		}
	}




	Database.prototype.showDataList = function(element){
		var elem= document.querySelector(element);
		elem.innerHTML="";
		this.tableList.forEach(function(k){
			elem.innerHTML+="<a href='#"+k+"'><li>"+k+"</li></a>";
		});
		if(this.tableList.length==0)
			this.showDbCreator("#data_createDB");
	}





	Database.prototype.addNewLane = function(element,before){
		var	elem=element.querySelector("tbody"),
			beforeIndex=Array.prototype.indexOf.call(elem.querySelectorAll("tr"), before.parentNode),
			newItem=elem.querySelectorAll("tr")[beforeIndex-1].cloneNode(true);

			newItem.children[0].children[0].value="";

		elem.insertBefore(newItem,before.parentNode);
	}


	Database.prototype.createDb = function(elements){

		this.tableList.push(elements[0].value);
		var inputDatas = {};

		[].forEach.call(elements,function(v,k){
			if(k>0 && v.value.trim()!="")
			{
				inputDatas[v.value]=new Array();
			}
		});

		this.datas.push(inputDatas);

		this.showDataList("#table_select>ul");
		this.saveDb(elements[0].value);
	}

	Database.prototype._createDBformevent = function(element){

		element.addEventListener("click",function(e){
			if(e.target.id==="addNew")
			{
				this.addNewLane(element,e.target);
			}
		}.bind(this));

		element.parentNode.addEventListener("submit",function(e){

			e.preventDefault();
			this.createDb(element.querySelectorAll("input"));

		}.bind(this));

		this.DBcreator=true;

	}

	Database.prototype.showSection = function(elem){
		var sections=document.querySelectorAll("section.data_container");
		[].forEach.call(sections,function(e){
			e.style.display="none";
		});
		elem.style.display="block";
	}

	Database.prototype.showDbCreator = function(element){

		var elem=document.querySelector(element);

		this.showSection(elem);

		if(!this.DBcreator)
			this._createDBformevent(elem);
	}



	Database.prototype.dataScreenAddNav = function(elem,keys,index){
		var len=keys.length,
			inputs="<tr>",
			button="<tr><td colspan='"+len+"'><button type='submit' class='btn btn-primary'>Add New..</button></td></tr>";

		while(len>0)
		{
			inputs+="<td><input class='form-control' type='text' required></td>"
			--len;
		}

		inputs+="</tr>";
		elem.innerHTML+="<form>"+inputs+button+"</form>";



		elem.addEventListener("click",function clickbtn(e){
			e.preventDefault();
			if(e.target.nodeName==="BUTTON")
			{
				
				var inputs=elem.querySelectorAll("input");
				[].forEach.call(inputs,function(e,k){

					
					this.datas[index][keys[k]].push(e.value);

				}.bind(this));
				this.saveDb(this.tableList[index]);
				elem.removeEventListener("click",clickbtn);
				this.screenLoadData(this.tableList[index],elem.parentNode);
			}
		}.bind(this));

	}




	Database.prototype.screenLoadData = function(key,elem){
		var index= this.tableList.indexOf(key),
			thead="<tr>",
			tbody="",
			items=new Array();
			keys=new Array();


		for(var key in this.datas[index])
		{
			thead+="<th>"+key+"</th>";
			this.datas[index][key].forEach(function(v,k){
				items[k]=items[k]||"";
				items[k]+="<td>"+v+"</td>";
			});	
			keys.push(key);
		}

		items.forEach(function(v){
			tbody+="<tr>"+v+"</tr>";
		});	

		thead+="\n</tr>";
		elem.querySelector("thead").innerHTML=thead;

		var tbodySelector = elem.querySelector("tbody");

		tbodySelector.innerHTML=tbody;

		this.dataScreenAddNav(tbodySelector,keys,index);
	}

	Database.prototype.showDataScreen = function(key,dataSection){

		var elem=document.querySelector(dataSection);

		this.screenLoadData(key,elem);

		this.showSection(elem);

	}

	Database.prototype.dataListAddEvents = function(e,dataSection){
		var element= document.querySelector(e);

		element.addEventListener("click",function(e){
			var targetParent=e.target.parentNode;
			if(targetParent.nodeName==="A")
			{
				e.preventDefault();
				[].forEach.call(element.querySelectorAll("li"),function(e){
					e.classList.remove("selected");
				});
				e.target.classList.add("selected");
				var key = targetParent.getAttribute("href").slice(1);
				this.showDataScreen(key,dataSection);
			}
		}.bind(this));

	}


	// User Interface


	window.addEventListener("load",function(){
		var buttonAddNewDB = document.querySelector("#table_select>button");

		var DB = new Database(".alert");
		DB.showDataList("#table_select>ul");
		DB.dataListAddEvents("#table_select>ul","#data_show");

		buttonAddNewDB.addEventListener("click",function(){
			DB.showDbCreator("#data_createDB");
		});
		


	});
})();
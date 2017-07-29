var Display = {}
Display.attrTemplate1 = `
    <div class="form-group">
        <label class="mylabel col-md-3 col-sm-3 control-label">type</label>
        <div class="myFormDiv col-md-9 col-sm-9">
        <p class="form-control-static" id="pointType">{0}</p>
        </div>
    </div>
`;

Display.attrTemplate2 = `
<div class="form-group">
    <label class="mylabel col-md-3 col-sm-3 control-label">{0}</label>
        <div class="myFormDiv col-md-9 col-sm-9">
            <input type="text" class="myInput form-control" name="{1}" onchange="dataChange(this.name, this.value)" value="{2}">
        </div>
</div>
`;

Display.imTemplate = `
<img src="images/img/themes/{0}/map/{1}" onclick="modeChange({2})" class="myImage img-thumbnail">
`;

Display.optionTemplate = `
<option>{0}</option>
`

Display.attrTemplate3 = `
<div class="row">
    <p class="form-control-static col-md-4">{0}</p>
	<div class="col-md-6">
        <input type="text" class="form-control">
    </div>
</div>
`

//展示point的信息
//point有两个只读属性picture、type,以及若干个可编辑属性
//可编辑属性更改后直接保存在point中就好
function showMessage(point){
    var pointType = NameMap[point.type];
    $("#attrPanel").append(Display.attrTemplate1.format(point.typeName));

    var attrSet = pointType["attr"]; 
    for (var i=0; i<attrSet.length; i++){
        $("#attrPanel").append(Display.attrTemplate2.format(attrSet[i], attrSet[i], point[attrSet[i]]));
    }
}

function clearMessage(){
    $("#attrPanel").empty();
}

//更换地图; fileName: data文件下的csv文件
function importFile(){
    //console.log(MapEditor.mapData);
    loadMap(MapEditor.mapData);
}

//导出文件
function exportFile(){
    var filename = $("#fileOutput").val();
    var fileData = convertMap();
	var blob = new Blob([fileData], {type: "text/plain;charset=utf-8"});
	saveAs(blob, filename);
}

/*
    根据配置文件，载入相应图片
*/
function loadItem(){
    for (var k in NameMap){
        //console.log(NameMap[k].picture);
        $("#pointer").after(Display.imTemplate.format(theme, NameMap[k].picture, k));
        $("select").append(Display.optionTemplate.format(NameMap[k].name));
    }
}

function newButtonClick(){
    var row = $("#mapsizeInputX").val(), col = $("#mapsizeInputY").val();
    newMap(row, col);
}

function extendMapClick(){
    extendMap(1);
}

function contractMapClick(){
    contractMap(1);
}

function selectChange(value){
    var type;
    $("#customAttr").empty();
    var htmlStr = `
        <hr />
        <div class='row'>
            <p class="form-control-static col-md-4">属性设置</p>
        </div>
    `
    $("#customAttr").append(htmlStr);
    for (var k in NameMap){
        if (NameMap[k].name == value){
            type = k;
            break;
        }
    }
    var pointType = NameMap[type];
    var attrSet = pointType["attr"];
    for (var i=0; i<attrSet.length; i++){
        $("#customAttr").append(Display.attrTemplate3.format(attrSet[i]));
    }
}

function addClick(){
    console.log($("#customAttr"));
}
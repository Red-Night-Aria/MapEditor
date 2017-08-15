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
<img src="images/img/themes/{0}/map/{1}" title="{4}" onclick="modeChange({2}, {3})" class="myImage img-thumbnail">
`;

Display.optionTemplate = `
<option value="{1}">{0}</option>
`

Display.attrTemplate3 = `
<div class="row">
    <p class="form-control-static col-md-4">{0}</p>
	<div class="col-md-6 attrInput">
        <input type="text" name="{0}" class="form-control">
    </div>
</div>
`

//展示point的信息
//point有两个只读属性picture、type,以及若干个可编辑属性
function showMessage(point){
    // var pointType = NameMap[point.type];
    // $("#attrPanel").append(Display.attrTemplate1.format(point.typeName));

    // var attrSet = pointType["attr"]; 
    // for (var i=0; i<attrSet.length; i++){
    //     $("#attrPanel").append(Display.attrTemplate2.format(attrSet[i], attrSet[i], point[attrSet[i]]));
    // }
    $("#attrPanel").append(Display.attrTemplate1.format(point.typeName));
    for (var attr in point)
        if (attr != "type" && attr != "typeName" && attr != "picture"){
            $("#attrPanel").append(Display.attrTemplate2.format(attr, attr, point[attr]));
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
        $("#pointer").after(Display.imTemplate.format(theme, NameMap[k].picture, k, 0, NameMap[k].name));
        $("select").append(Display.optionTemplate.format(NameMap[k].name, k));
    }
}

function newButtonClick(){
    var row = $("#mapsizeInputX").val(), col = $("#mapsizeInputY").val();
    newMap(row, col);
}

function extendMapClick(){
    extendMap(1);
}

function cutMapClick(){
    if (!stateTable.hasMulitSelected){
        alert("请先选择欲保留区域");
    }
    else {
        if (confirm("确定要裁剪下该区域？")){
            var coord = adjustCoord();
            cutMap(coord.TLx, coord.TLy, coord.BRx, coord.BRy);
        }
    }
}

function selectChange(value){
    var type = value;
    $("#customAttr").empty();
    var htmlStr = `
        <hr />
        <div class='row'>
            <p class="form-control-static col-md-4">属性设置</p>
        </div>
    `
    $("#customAttr").append(htmlStr);
    var pointType = NameMap[type];
    var attrSet = pointType["attr"];
    for (var i=0; i<attrSet.length; i++){
        if (attrSet[i]=="cost"){
            $("#customAttr").append(Display.attrTemplate3.format("LTcost"));
            $("#customAttr").append(Display.attrTemplate3.format("Tcost"));
            $("#customAttr").append(Display.attrTemplate3.format("RTcost"));
            $("#customAttr").append(Display.attrTemplate3.format("Rcost"));
            $("#customAttr").append(Display.attrTemplate3.format("RBcost"));
            $("#customAttr").append(Display.attrTemplate3.format("Bcost"));
            $("#customAttr").append(Display.attrTemplate3.format("LBcost"));
            $("#customAttr").append(Display.attrTemplate3.format("Lcost"));
        }
        else {
            $("#customAttr").append(Display.attrTemplate3.format(attrSet[i]));
        }       
    }
}

Display.customPoint = [];

function addClick(){
    var type = $("select").val();
    var pointType = NameMap[type];
    var attrSet = pointType["attr"];
    var inputs = $("div.attrInput > input");
    var point = new MapPoint(type);
    $("#customPanel").append(Display.imTemplate.format(theme, NameMap[type].picture, 
        "-2", Display.customPoint.length, NameMap[type].name));
    // $("img:last").oncontextmenu = function(){
    //     //$("img:last").remove();
    //     return false;
    // }
    for (var i=0; i<inputs.length; i++){
        point[inputs[i].name] = inputs[i].value;
        $("img:last").attr("title", $("img:last").attr("title")+"\n"+inputs[i].name+": "+inputs[i].value);
    }
    Display.customPoint.push(point);

}
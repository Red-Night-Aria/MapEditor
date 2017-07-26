var Display = {}
Display.attrTemplate = `
<div class="form-group">
    <label class="mylabel col-md-3 col-sm-3 control-label">{0}</label>
        <div class="myFormDiv col-md-9 col-sm-9">
            <input type="text" class="myInput form-control" placeholder="{1}">
        </div>
</div>
`
//展示point的信息
//point有两个只读属性picture、type,以及若干个可编辑属性
//可编辑属性更改后直接保存在point中就好
function showMessage(point){
    var pointType = NameMap[point.type];
    $("#pointType").text(point.typeName);

    var attrSet = pointType["attr"]; 
    for (var i=0; i<attrSet.length; i++){
        var attrText = Display.attrTemplate.format(attrSet[i], point[attrSet[i]]);
        console.log(attrText);
        $("#attrPanel").append(attrText);
    }
}

//更换地图; fileName: data文件下的csv文件
function importFile(){
    //TODO
    loadMap(fileName);
}

//fileData是一个字符串。请想个办法让用户可以将其保存到本地（文件后缀名为.csv的）
function exportFile(){
    var fileData = convertMap();
    //TODO
}


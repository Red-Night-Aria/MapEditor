/*
    pixiJS Aliases
*/
var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite,
    stage,
    renderer;

/*
    pixiJS图层
*/
var Grids,  //地图点层
    Masks;  //选中框层

var NameMap;    //名称映射表

/*
    地图数据相关
*/
var QT_Map, //地图数据数组 
    R, C,   //地图长宽
    len,    //方格边长 
    maxR=200, maxC=200, //地图最大长宽
    theme = "blue_gray_114",    //地图主题
    selectIm, listSelectIm, //选择框图片
    texturesFile;   //材质文件

/*
    初始化二维数组= =
*/
Grids = new Array(maxR);
for (var i=0; i<maxR; i++) Grids[i] = new Array(maxC);
QT_Map = new Array(maxR);
for (var i=0; i<maxR; i++) QT_Map[i] = new Array(maxC);
Masks = new Array(maxR);
for (var i=0; i<maxR; i++) Masks[i] = new Array(maxC);   

/*
    文件分隔符
*/
var importSep, exportSep;

/*
    多选功能键
*/
var funcKey = 81; //Q键

/*
    地图状态表
*/
var stateTable={
    "state": 0,
    "TLC": {"x": -1, "y": -1},    //左上角Top-Left-Corner :)
    "BRC": {"x": 0, "y": 0},    //右下角
    "lastSelected": {"x": undefined, "y": undefined},
    "isFuncKeyPress": false,
    "hasSingleSelected" : false,
    "hasMulitSelected": false 
}

/*
    其他文件中会用到的全局变量
*/
var MapEditor = {
    "mode": "-1",
    "pointIndex": "",
    "mapData": ""
}

/*
    地图点类
*/
function MapPoint(type){
    var pointType = NameMap[type];
    this.type = type;
    this.typeName = pointType["name"];
    this.picture = pointType["picture"];
    var attrSet = pointType["attr"];    //读取属性集
    for (var i=0; i<attrSet.length; i++) {
        if (attrSet[i] != "cost")
            this[attrSet[i]] = ""; //动态添加属性 
        else {
            this["LTcost"] = "";
            this["Tcost"] = "";
            this["RTcost"] = "";
            this["Rcost"] = "";
            this["RBcost"] = "";
            this["Bcost"] = "";
            this["LBcost"] = "";
            this["Lcost"] = "";
        }
    }
}

function main(){
    var divWidth = $("#mainBody").width();  //获取画布容器的宽度
    var divHeight = $(document).height();
    stage = new Container();
    renderer = autoDetectRenderer(divWidth, divHeight);
    $("#mainBody").append(renderer.view);
    $("canvas").css("margin-top", "-30px");
    
    /*
        加载配置文件
    */
    $.getJSON("config.json", function(data){
        NameMap = data["NameMap"];
        importSep = data["importSep"];
        exportSep = data["exportSep"];
        selectIm = data["select"];
        listSelectIm = data["listSelect"];
        texturesFile = data["texturesFile"];

        /*
            加载材质文件
        */
        loader
            .add(texturesFile)
            .load(function(){
                Pics = resources[texturesFile].textures;        
                newMap(50, 50);   //新建地图
                loadItem();   //载入工具框
            });
    });

    //监听鼠标滚轮
    $('#mainBody').on('mousewheel', zoom);
    //监听鼠标拖拽
    $('#mainBody').mousedown(startDrag);
    $('#mainBody').mousemove(dragStage);
    $('#mainBody').mouseup(endDrag);
    //监听键盘
    $(document).keydown(function(e){
        if (e.which == funcKey){
            stateTable.isFuncKeyPress = true;
        }
    });
    $(document).keyup(function(e){
        if (e.which == funcKey){
            stateTable.isFuncKeyPress = false;
            if (stateTable.state == 1){
                stateTable.state = 0;
            }
        }
    });
}

//清理Stage
function clearStage(){
    stage.removeChildren();
    stateTable.state=0;
    stateTable.hasSingleSelected=false; stateTable.hasMulitSelected=false;
}

//载入地图文件
function loadMap(data){
    clearMessage();
    clearStage(); 
    var Rows = data.split("\n");
    R = Rows.length-1;  //地图文件末尾有空行
    C = Rows[0].split(importSep[0]).length;  

    for (var i=0; i<R; i++){
        var row = Rows[i];
        var fields = row.split(importSep[0]);
        for (var j=0; j<C; j++) QT_Map[i][j] = processData(fields[j]);
    }

    createMap();
}

/*
    根据地图元数据，绘制画布
*/
function createMap(){
    len = Math.min(renderer.view.height/R, renderer.view.width/C); 
    clearStage();
    for (var i=0; i<R; i++){
        for (var j=0; j<C; j++){
            createSprite(i, j);
        }
    }
    stage.scale.x = stage.scale.y = 1;  
    renderer.render(stage);
}
/*
    解析一条地图数据文件字段
*/
function processData(str){
    var parts = str.split(importSep[1]);    //分隔属性字段
    if (parts[0]==undefined) console.log(parts);
    var point = new MapPoint(parts[0]);
    var attrSet = NameMap[parts[0]]["attr"];
    for (var i=1; i<parts.length; i++){
        if (attrSet[i-1] == "cost"){
            costSet = parts[i].split(importSep[2]);
            point["LTcost"] = costSet[0] + ";" + costSet[8];
            point["Tcost"] = costSet[1] + ";" + costSet[9];
            point["RTcost"] = costSet[2] + ";" + costSet[10];
            point["Rcost"] = costSet[3] + ";" + costSet[11];
            point["RBcost"] = costSet[4] + ";" + costSet[12];
            point["Bcost"] = costSet[5] + ";" + costSet[13];
            point["LBcost"] = costSet[6] + ";" + costSet[14];
            point["Lcost"] = costSet[7] + ";" + costSet[15];
        }
        else if (parts[i].indexOf("lane") != -1){
            point["lane"] = parts[i];
        }
        else
        {
            point[attrSet[i-1]] = parts[i];
        }     
    } 
    return point;
}


/*
    处理cost字段的导出；
    假定若填了一个cost字段，则所有cost字段均已填写；
    完整性检查应当在exportFile()处完成
*/
function awful(point){
    if (point["LTcost"] == "") return ""; 
    var result = "";
    result += point["LTcost"].split(";")[0] + exportSep[2];
    result += point["Tcost"].split(";")[0] + exportSep[2];
    result += point["RTcost"].split(";")[0] + exportSep[2];
    result += point["Rcost"].split(";")[0] + exportSep[2];
    result += point["RBcost"].split(";")[0] + exportSep[2];
    result += point["Bcost"].split(";")[0] + exportSep[2];
    result += point["LBcost"].split(";")[0] + exportSep[2];
    result += point["Lcost"].split(";")[0] + exportSep[2];
    result += point["LTcost"].split(";")[1] + exportSep[2];
    result += point["Tcost"].split(";")[1] + exportSep[2];
    result += point["RTcost"].split(";")[1] + exportSep[2];
    result += point["Rcost"].split(";")[1] + exportSep[2];
    result += point["RBcost"].split(";")[1] + exportSep[2];
    result += point["Bcost"].split(";")[1] + exportSep[2];
    result += point["LBcost"].split(";")[1] + exportSep[2];
    result += point["Lcost"].split(";")[1];
    return result;
}

/*
    将地图数据导出为文件
*/
function convertMap(){
    var text = "";
    for (var i=0; i<R; i++){
        for (var j=0; j<C; j++){
            var point = QT_Map[i][j];
            var pointType = NameMap[point.type];
            var field = point.type;
            var attrSet = pointType["attr"];
            for (var k=0; k<attrSet.length; k++){
                if (attrSet[k] == "cost"){
                    var result = awful(point);
                    if (result != "")
                        field += exportSep[1] + result;
                }
                else if (point[attrSet[k]] != ""){
                    field += exportSep[1] + point[attrSet[k]];
                }
            }

            if (j!=0) text += exportSep[0];
            text += field; 
        }
        text += "\n";
    }
    return text;
}

//根据QT_map新建相应坐标点的sprites
function createSprite(i, j){
    if (QT_Map[i][j]==undefined) console.log(i, " ", j);
    Grids[i][j] = new Sprite(Pics[QT_Map[i][j].picture]);
    Grids[i][j].y = i*len;  Grids[i][j].x = j*len;  //WARN!
    Grids[i][j].width = Grids[i][j].height = len;
    Grids[i][j].index_x = i; Grids[i][j].index_y = j;
    Grids[i][j].interactive = true;
    Grids[i][j].on('pointerdown', onSpriteClick);
    Grids[i][j].on('pointerover', onSpriteOver);  
    stage.addChild(Grids[i][j]);
}

function onSpriteOver(){
    var coordstr = " ({0}, {1}) ";
    $("h4.juxingkuang>span:first").text(coordstr.format(R-this.index_x-1, this.index_y));
}

function onSpriteClick(){
    /*
        如果是指示模式
    */
    if (MapEditor.mode=="-1"){
        pointerClick(this);
    }
    /*
        如果是自定义修改
    */
    else if (MapEditor.mode=="-2"){
        var point = {};
        for (var k in Display.customPoint[MapEditor.pointIndex]){
            point[k] = Display.customPoint[MapEditor.pointIndex][k];
        }
        QT_Map[this.index_x][this.index_y] = point;
        createSprite(this.index_x, this.index_y);
        renderer.render(stage);       
    }
    /*
        如果是常规修改
    */
    else {
        QT_Map[this.index_x][this.index_y] = new MapPoint(MapEditor.mode);
        createSprite(this.index_x, this.index_y);
        renderer.render(stage);
    }
}

//清理上一阶段留下的东西
function clearPreTrace(){
    if (stateTable.hasSingleSelected){
        clearMessage();
        stage.removeChild(Masks[stateTable.lastSelected.x][stateTable.lastSelected.y]);
    }
    if (stateTable.hasMulitSelected){
        rangeRemove();
    }
}

//var processing = false;
//处理点击事件
function pointerClick(beClick){
    // while (processing) {}
    // processing = true;
    switch (stateTable.state){
        case 0: //单选的状态
            clearPreTrace();
            if (stateTable.isFuncKeyPress){
                createMask(beClick, listSelectIm);
                stateTable.TLC.x = beClick.index_x;  stateTable.TLC.y = beClick.index_y;
                stateTable.BRC.x = beClick.index_x;  stateTable.BRC.y = beClick.index_y;
                stateTable.hasMulitSelected = true;    stateTable.hasSingleSelected = false;
                stateTable.state = 1;
            }
            else {
                createMask(beClick, selectIm);
                stateTable.lastSelected.x = beClick.index_x; stateTable.lastSelected.y = beClick.index_y;
                stateTable.hasMulitSelected = false;   stateTable.hasSingleSelected = true;
                //console.log(beClick.index_x, beClick.index_y);
                showMessage(QT_Map[beClick.index_x][beClick.index_y]);
            }
            renderer.render(stage);
            break;
        case 1: //多选的状态
            rangeRemove();
            stateTable.BRC.x = beClick.index_x;    stateTable.BRC.y = beClick.index_y;
            rangeCreate();
            renderer.render(stage);
            break;
    }
    processing = false;
}

//计算真实左上角和右下角坐标
function adjustCoord(){
    var coord = {}
    coord.TLx = Math.min(stateTable.TLC.x, stateTable.BRC.x);
    coord.TLy = Math.min(stateTable.TLC.y, stateTable.BRC.y);
    coord.BRx = Math.max(stateTable.TLC.x, stateTable.BRC.x);
    coord.BRy = Math.max(stateTable.TLC.y, stateTable.BRC.y);
    return coord;
}

//新建mask, 设置位置及形状, 添加至舞台
function createMask(beMasked, im){
    var mask = new Sprite(Pics[im]);
    mask.x = beMasked.x;    mask.y = beMasked.y;
    mask.height = beMasked.height;  mask.width = beMasked.width;
    Masks[beMasked.index_x][beMasked.index_y] = mask;
    
    stage.addChild(mask);
}

//根据stateTable中TLC和BRC的值，批量添加mask
function rangeCreate(){
    var coord = adjustCoord();
    for (var i=coord.TLx; i<=coord.BRx; i++)
        for (var j=coord.TLy; j<=coord.BRy; j++){
            createMask(Grids[i][j], listSelectIm);
        }
}

//根据stateTable中TLC和BRC的值，批量移除mask
function rangeRemove(){
    if (stateTable.TLC.x == -1) return;
    var coord = adjustCoord();
    for (var i=coord.TLx; i<=coord.BRx; i++)
        for (var j=coord.TLy; j<=coord.BRy; j++){
            stage.removeChild(Masks[i][j]);
        }
}

//缩放
function zoom(event){
    var rate = event.deltaY/20;
    stage.scale.x += rate;
    stage.scale.y += rate;
    renderer.render(stage);
}

//拖拽
var mouseX, mouseY, isDrag=0;
function startDrag(e){
    //console.log(e.screenX, " ", e.screenY);
    mouseX = e.screenX; mouseY = e.screenY;
    isDrag = 1;
}

function dragStage(e){
    if (isDrag){
        var deltaX = e.screenX-mouseX, deltaY = e.screenY-mouseY;
        stage.x += deltaX;  stage.y += deltaY;
        mouseX = e.screenX; mouseY = e.screenY;
        renderer.render(stage);
    }
}

function endDrag(e){
    isDrag = 0;
}

// function emptyPoint(){
//     this.typeName = "不可通行点",
//     this.picture = "charger_pole.png"
// }
var emptyPoint = "9";

//沿X轴和Y轴扩容QT_Map
function extendMap(margin){
    if (margin+R>maxR || margin+C>maxC){
        alert("too big");
    } 
    
    clearPreTrace();
    clearStage();

    //为现有行添加尾元素
    for (var i=0; i<R; i++){
        for (var j=0; j<margin; j++){
            QT_Map[i][C+j] = new MapPoint(emptyPoint);
        }    
    }

    //逐行下移
    for (var i=R-1; i>=0; i--){
        QT_Map[i+margin] = QT_Map[i]; 
    }

    //添加新行
    for (var i=0; i<margin; i++){
        QT_Map[i] = new Array(maxC);
        for (var j=0; j<C+margin; j++){
            QT_Map[i][j] = new MapPoint(emptyPoint);
        }
    }

    R = R+margin; C = C+margin;
    console.log(R, " ", C);
    console.log(QT_Map);
    createMap();
}

function clone(obj){
    var newobj = {};
    for (var i in obj){
        newobj[i] = obj[i];
    }
    return newobj;
}

function cutMap(TLx, TLy, BRx, BRy){
    clearPreTrace();
    clearStage();

    var tmpMap = {};
    for (var i=0; i<BRx-TLx+1; i++){
        tmpMap[i] = {};
        for (var j=0; j<BRy-TLy+1; j++){
            tmpMap[i][j] = clone(QT_Map[TLx+i][TLy+j]);
        }
    }
    QT_Map = tmpMap;
    R = BRx-TLx+1;  C = BRy-TLy+1;
    createMap();
}

function dataChange(attr, value){
    var XY = stateTable.lastSelected;
    //console.log(attr, value, XY);
    QT_Map[XY.x][XY.y][attr] = value; 
}

function modeChange(mode, index=-1){
    clearPreTrace();
    if (stateTable.hasMulitSelected && mode != "-1"){
        var coord = adjustCoord();
        for (var i=coord.TLx; i<=coord.BRx; i++)
            for (var j=coord.TLy; j<=coord.BRy; j++){
                if (mode != "-2"){
                    QT_Map[i][j] = new MapPoint(mode);
                }
                else {
                    var point = {};
                    for (var k in Display.customPoint[index]){
                        point[k] = Display.customPoint[index][k];
                    }
                    console.log(point);
                    QT_Map[i][j] = point;
                }
                createSprite(i, j);
            }
        renderer.render(stage);
    }
    else {
        MapEditor.mode = mode;
        MapEditor.pointIndex = index;
        stateTable.hasSingleSelected = false;
        stateTable.hasMulitSelected = false;
        stateTable.state = 0;
        if (mode==-1){
            $("h4.juxingkuang>span:last").text("选择模式")
        }
        else {
            $("h4.juxingkuang>span:last").text("修改模式")
        }
    }
}

//新建一张地图
function newMap(row, col){
    //var row = $("#mapsizeInputX").val(), col = $("#mapsizeInputY").val();
    if (row=="" || col=="") return;
    clearPreTrace();
    clearStage();
    R = row; C = col;
    len = Math.min(renderer.view.height/R, renderer.view.width/C); 
    for (var i=0; i<row; i++){
        for (var j=0; j<col; j++){
            QT_Map[i][j] = new MapPoint(emptyPoint);
            createSprite(i, j);
        }
    }
    renderer.render(stage);
}

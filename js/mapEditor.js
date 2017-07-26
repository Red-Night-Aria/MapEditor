var divWidth, divHeight; 

//Aliases
var Container = PIXI.Container,
    autoDetectRenderer = PIXI.autoDetectRenderer,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Texture = PIXI.Texture,
    Sprite = PIXI.Sprite;

//pixiJS场景对象
var stage, renderer;

//名称映射
var NameMap;

//地图数组
var QT_Map, R, C;

//Sprite集合
var Grids;

//分隔符
var importSep, exportSep;

var funcKey = 81; //Q键

//状态表
var stateTable={
    "state": 0,
    "TLC": {"x": -1, "y": -1},    //左上角Top-Left-Corner :)
    "BRC": {"x": 0, "y": 0},    //右下角
    "lastSelected": {"x": undefined, "y": undefined},
    "isFuncKeyPress": false,
    "hasSingleSelected" : false,
    "hasMulitSelected": false 
}

var Masks;  //选中框数组

var texturesFile;   //材质文件

var selectIm, listSelectIm; //选择框图片

function main(){
    divWidth = $("#mainBody").width();
    divHeight = $(document).height();
    stage = new Container();
    renderer = autoDetectRenderer(divHeight, divWidth);
    $("#mainBody").append(renderer.view);
    loadConfig();
}

//加载配置文件
function loadConfig(){
    $.getJSON("config.json", function(data){
        NameMap = data["NameMap"];
        importSep = data["importSep"];
        exportSep = data["exportSep"];
        selectIm = data["select"];
        listSelectIm = data["listSelect"];
        texturesFile = data["texturesFile"];

        //加载地图
        loader
            .add(texturesFile)
            .load(function(){
                Pics = resources[texturesFile].textures;        
                loadMap();   
            });
    });
    //监听鼠标滚轮
    $('div').on('mousewheel', zoom);
    //监听鼠标拖拽
    $('div').mousedown(startDrag);
    $('div').mousemove(dragStage);
    $('div').mouseup(endDrag);
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

//读取地图文件并绘制
function loadMap(filename="vip_map.csv"){ 
       
    $.get("data/"+filename, function(data){
        var Rows = data.split("\n");
        R = Rows.length-1;
        C = Rows[0].split(importSep[0]).length;
        //console.info(R + " " + C);
        //console.info(Rows[R-1]);
        Grids = new Array(R);
        for (var i=0; i<R; i++) Grids[i] = new Array(C);
        QT_Map = new Array(R);
        for (var i=0; i<R; i++) QT_Map[i] = new Array(C);
        Masks = new Array(R);
        for (var i=0; i<R; i++) Masks[i] = new Array(C);        

        for (var i=0; i<R; i++){
            var row = Rows[i];
            var fields = row.split(importSep[0]);
            for (var j=0; j<C; j++) QT_Map[i][j] = processData(fields[j]);
        }
        //extendMap(2);
        //console.info(QT_Map);  
        createSprites();
        renderer.render(stage);
    });
}

//将地图文件解析至内存
function processData(str){
    var parts = str.split(importSep[1]);    //分隔属性字段
    var pointType = NameMap[parts[0]];
    var point = {}; 
    point.type = parts[0];
    point.typeName = pointType["name"]  
    point.picture = pointType["picture"];
    var attrSet = pointType["attr"];    //读取属性集
    //console.log(attrSet.length, " ", parts.length);
    for (var i=0; i<attrSet.length; i++) point[attrSet[i]] = ""; //动态添加属性
    for (var i=1; i<parts.length; i++){
        point[attrSet[i-1]] = parts[i];
    } 
    return point;
}

function convertMap(){
    var text = "";
    for (var i=0; i<R; i++){
        for (var j=0; j<C; j++){
            var point = QT_Map[i][j];
            var pointType = NameMap[point.type];
            var field = point.type;
            var attrSet = pointType["attr"];
            for (var k=0; k<attrSet.length; k++){
                if (point[attrSet[k]] != undefined){
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

//清空Stage, 根据QT_map新建sprites
function createSprites(){
    len = Math.min(renderer.view.height/R, renderer.view.width/C); 
    clearStage();

    for (var i=0; i<R; i++){
        for (var j=0; j<C; j++){
            //console.info(QT_Map[i][j].type);
            //console.info(NameMap[QT_Map[i][j].type]);
            if (QT_Map[i][j]==undefined){
                console.log(i, " ", j);
            }
            Grids[i][j] = new Sprite(Pics[QT_Map[i][j].picture]);
            Grids[i][j].y = i*len;  Grids[i][j].x = j*len;
            Grids[i][j].width = Grids[i][j].height = len;
            Grids[i][j].index_x = i; Grids[i][j].index_y = j;
            Grids[i][j].interactive = true;
            Grids[i][j].on('pointerdown', onSpriteClick);
            
            stage.addChild(Grids[i][j]);
        }
    }
    stage.scale.x = stage.scale.y = 1;
}

var processing = false;
//处理点击事件
function onSpriteClick(){
    while (processing) {}
    processing = true;
    switch (stateTable.state){
        case 0: //单选的状态
            if (stateTable.hasSingleSelected){
                stage.removeChild(Masks[stateTable.lastSelected.x][stateTable.lastSelected.y]);
            }
            if (stateTable.hasMulitSelected){
                rangeRemove();
            }
            if (stateTable.isFuncKeyPress){
                createMask(this, listSelectIm);
                stateTable.TLC.x = this.index_x;  stateTable.TLC.y = this.index_y;
                stateTable.BRC.x = this.index_x;  stateTable.BRC.y = this.index_y;
                stateTable.hasMulitSelected = true;    stateTable.hasSingleSelected = false;
                stateTable.state = 1;
            }
            else {
                createMask(this, selectIm);
                stateTable.lastSelected.x = this.index_x; stateTable.lastSelected.y = this.index_y;
                stateTable.hasMulitSelected = false;   stateTable.hasSingleSelected = true;
                console.log(this.index_x, this.index_y);
                showMessage(QT_Map[this.index_x][this.index_y]);
            }
            renderer.render(stage);
            break;
        case 1: //多选的状态
            rangeRemove();
            stateTable.BRC.x = this.index_x;    stateTable.BRC.y = this.index_y;
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

//新建mask, 设置位置及形状, 添加至舞台。未渲染。
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

function emptyPoint(){
    this.typeName = "不可通行点",
    this.picture = "charger_pole.png"
}

//扩容QT_Map
function extendMap(margin){
    //为现有行添加首尾元素
    for (var i=0; i<R; i++){
        for (var j=0; j<margin; j++){
            QT_Map[i].splice(0, 0, new emptyPoint());
            QT_Map[i].push(new emptyPoint());
        }
    }

    //添加首尾新行
    for (var i=0; i<margin; i++){
        QT_Map.splice(0, 0, new Array(C+margin*2));
        QT_Map.push(new Array(C+margin*2));
        for (var j=0; j<C+margin*2; j++){
            QT_Map[0][j] = new emptyPoint();
            QT_Map[QT_Map.length-1][j] = new emptyPoint();
        }
    }

    for (var i=0; i<margin; i++){
        Grids.splice(0, 0, new Array());
        Grids.push(new Array());
        Masks.splice(0, 0, new Array());
        Masks.push(new Array());
    }
    R = R+margin*2; C = C+margin*2;
}


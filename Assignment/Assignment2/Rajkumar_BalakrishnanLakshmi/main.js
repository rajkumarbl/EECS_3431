

var canvas;
var gl;

var fps = 0;       
var lastTime = 0; 
var tenth=0; 

var program ;

var near = -100;
var far = 100;


var left = -6.0;
var right = 6.0;
var ytop =6.0;
var bottom = -6.0;


var lightPosition2 = vec4(100.0, 100.0, 100.0, 1.0 );
var lightPosition = vec4(0.0, 0.0, 100.0, 1.0 );

var lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
var lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
var lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );

var materialAmbient = vec4( 1.0, 0.0, 1.0, 1.0 );
var materialDiffuse = vec4( 1.0, 0.8, 0.0, 1.0 );
var materialSpecular = vec4( 0.4, 0.4, 0.4, 1.0 );
var materialShininess = 30.0;


var ambientColor, diffuseColor, specularColor;

var modelMatrix, viewMatrix ;
var modelViewMatrix, projectionMatrix, normalMatrix;
var modelViewMatrixLoc, projectionMatrixLoc, normalMatrixLoc;
var eye;
var at = vec3(0.0, 0.0, 0.0);
var up = vec3(0.0, 1.0, 0.0);

var RX = 0 ;
var RY = 0 ;
var RZ = 0 ;

var MS = [] ; // The modeling matrix stack
var TIME = 0.0 ; // Realtime
var TIME = 0.0 ; // Realtime
var resetTimerFlag = true ;
var animFlag = false ;
var prevTime = 0.0 ;
var useTextures = 1 ;

// ------------ Images for textures stuff --------------
var texSize = 64;

var image1 = new Array()
for (var i =0; i<texSize; i++)  image1[i] = new Array();
for (var i =0; i<texSize; i++)
for ( var j = 0; j < texSize; j++)
image1[i][j] = new Float32Array(4);
for (var i =0; i<texSize; i++) for (var j=0; j<texSize; j++) {
    var c = (((i & 0x8) == 0) ^ ((j & 0x8)  == 0));
    image1[i][j] = [c, c, c, 1];
}

// Convert floats to ubytes for texture

var image2 = new Uint8Array(4*texSize*texSize);

for ( var i = 0; i < texSize; i++ )
for ( var j = 0; j < texSize; j++ )
for(var k =0; k<4; k++)
image2[4*texSize*i+4*j+k] = 255*image1[i][j][k];


var textureArray = [] ;



function isLoaded(im) {
    if (im.complete) {
        console.log("loaded") ;
        return true ;
    }
    else {
        console.log("still not loaded!!!!") ;
        return false ;
    }
}

function loadFileTexture(tex, filename)
{
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    tex.image.src = filename ;
    tex.isTextureReady = false ;
    tex.image.onload = function() { handleTextureLoaded(tex); }
    // The image is going to be loaded asyncronously (lazy) which could be
    // after the program continues to the next functions. OUCH!
}

function loadImageTexture(tex, image) {
    tex.textureWebGL  = gl.createTexture();
    tex.image = new Image();
    //tex.image.src = "CheckerBoard-from-Memory" ;
    
    gl.bindTexture( gl.TEXTURE_2D, tex.textureWebGL );
    //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, texSize, texSize, 0,
                  gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap( gl.TEXTURE_2D );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER,
                     gl.NEAREST_MIPMAP_LINEAR );
    gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);

    tex.isTextureReady = true ;

}

function initTextures() {
    
    textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"cube2.png") ;
    
   /* textureArray.push({}) ;
    loadFileTexture(textureArray[textureArray.length-1],"cubetexture.png") ;
    
    textureArray.push({}) ;
    loadImageTexture(textureArray[textureArray.length-1],image2) ;*/
    
    
}


function handleTextureLoaded(textureObj) {
    gl.bindTexture(gl.TEXTURE_2D, textureObj.textureWebGL);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); // otherwise the image would be flipped upsdide down
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureObj.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); //Prevents s-coordinate wrapping (repeating)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); //Prevents t-coordinate wrapping (repeating)
    gl.bindTexture(gl.TEXTURE_2D, null);
    console.log(textureObj.image.src) ;
    
    textureObj.isTextureReady = true ;
}

//----------------------------------------------------------------

function setColor(c)
{
    ambientProduct = mult(lightAmbient, c);
    diffuseProduct = mult(lightDiffuse, c);
    specularProduct = mult(lightSpecular, materialSpecular);
    
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "ambientProduct"),flatten(ambientProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "diffuseProduct"),flatten(diffuseProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "specularProduct"),flatten(specularProduct) );
    gl.uniform4fv( gl.getUniformLocation(program,
                                         "lightPosition"),flatten(lightPosition) );
    gl.uniform1f( gl.getUniformLocation(program, 
                                        "shininess"),materialShininess );
}

function toggleTextures() {
    useTextures = 1 - useTextures ;
    gl.uniform1i( gl.getUniformLocation(program,
                                         "useTextures"), useTextures );
}

function waitForTextures1(tex) {
    setTimeout( function() {
    console.log("Waiting for: "+ tex.image.src) ;
    wtime = (new Date()).getTime() ;
    if( !tex.isTextureReady )
    {
        console.log(wtime + " not ready yet") ;
        waitForTextures1(tex) ;
    }
    else
    {
        console.log("ready to render") ;
        window.requestAnimFrame(render);
    }
               },5) ;
    
}

// Takes an array of textures and calls render if the textures are created
function waitForTextures(texs) {
    setTimeout( function() {
               var n = 0 ;
               for ( var i = 0 ; i < texs.length ; i++ )
               {
                    console.log("boo"+texs[i].image.src) ;
                    n = n+texs[i].isTextureReady ;
               }
               wtime = (new Date()).getTime() ;
               if( n != texs.length )
               {
               console.log(wtime + " not ready yet") ;
               waitForTextures(texs) ;
               }
               else
               {
               console.log("ready to render") ;
               window.requestAnimFrame(render);
               }
               },5) ;
    
}

window.onload = function init() {

    canvas = document.getElementById( "gl-canvas" );
    
    gl = WebGLUtils.setupWebGL( canvas );
    if ( !gl ) { alert( "WebGL isn't available" ); }

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.clearColor( 0, 0, 0, 1.0 );
    
    gl.enable(gl.DEPTH_TEST);

    //
    //  Load shaders and initialize attribute buffers
    //
    program = initShaders( gl, "vertex-shader", "fragment-shader" );
    gl.useProgram( program );
    
 
    // Load canonical objects and their attributes
    Cube.init(program);
    Cylinder.init(9,program);
    Cone.init(9,program) ;
    Sphere.init(36,program) ;

    gl.uniform1i( gl.getUniformLocation(program, "useTextures"), useTextures );

    // record the locations of the matrices that are used in the shaders
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix" );
    normalMatrixLoc = gl.getUniformLocation( program, "normalMatrix" );
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix" );
    
    // set a default material
    setColor(materialDiffuse) ;
    
  
    
    // set the callbacks for the UI elements
    document.getElementById("sliderXi").onchange = function() {
        RX = this.value ;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderYi").onchange = function() {
        RY = this.value;
        window.requestAnimFrame(render);
    };
    document.getElementById("sliderZi").onchange = function() {
        RZ =  this.value;
        window.requestAnimFrame(render);
    };
    
    document.getElementById("animToggleButton").onclick = function() {
        if( animFlag ) {
            animFlag = false;
        }
        else {
            animFlag = true  ;
            resetTimerFlag = true ;
            window.requestAnimFrame(render);
        }
    };
    
    document.getElementById("textureToggleButton").onclick = function() {
        toggleTextures() ;
        window.requestAnimFrame(render);
    };

    var controller = new CameraController(canvas);
    controller.onchange = function(xRot,yRot) {
        RX = xRot ;
        RY = yRot ;
        window.requestAnimFrame(render); };
    
    // load and initialize the textures
    initTextures() ;
    
    // Recursive wait for the textures to load
    waitForTextures(textureArray) ;
    //setTimeout (render, 100) ;
    
}

// Sets the modelview and normal matrix in the shaders
function setMV() {
    modelViewMatrix = mult(viewMatrix,modelMatrix) ;
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix) );
    normalMatrix = inverseTranspose(modelViewMatrix) ;
    gl.uniformMatrix4fv(normalMatrixLoc, false, flatten(normalMatrix) );
}

// Sets the projection, modelview and normal matrix in the shaders
function setAllMatrices() {
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix) );
    setMV() ;
    
}

// Draws a 2x2x2 cube center at the origin
// Sets the modelview matrix and the normal matrix of the global program
function drawCube() {
    setMV() ;
    Cube.draw() ;
}

// Draws a sphere centered at the origin of radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawSphere() {
    setMV() ;
    Sphere.draw() ;
}
// Draws a cylinder along z of height 1 centered at the origin
// and radius 0.5.
// Sets the modelview matrix and the normal matrix of the global program
function drawCylinder() {
    setMV() ;
    Cylinder.draw() ;
}

// Draws a cone along z of height 1 centered at the origin
// and base radius 1.0.
// Sets the modelview matrix and the normal matrix of the global program
function drawCone() {
    setMV() ;
    Cone.draw() ;
}

// Post multiples the modelview matrix with a translation matrix
// and replaces the modelview matrix with the result
function gTranslate(x,y,z) {
    modelMatrix = mult(modelMatrix,translate([x,y,z])) ;
}

// Post multiples the modelview matrix with a rotation matrix
// and replaces the modelview matrix with the result
function gRotate(theta,x,y,z) {
    modelMatrix = mult(modelMatrix,rotate(theta,[x,y,z])) ;
}

// Post multiples the modelview matrix with a scaling matrix
// and replaces the modelview matrix with the result
function gScale(sx,sy,sz) {
    modelMatrix = mult(modelMatrix,scale(sx,sy,sz)) ;
}

// Pops MS and stores the result as the current modelMatrix
function gPop() {
    modelMatrix = MS.pop() ;
}

// pushes the current modelMatrix in the stack MS
function gPush() {
    MS.push(modelMatrix) ;
}

function render() {

    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    var x;
    //Camera Motion----------------------------------------------------------------------------
    if(TIME>=0 && TIME <=10)
    { 
      eye = vec3(-1,1,TIME/1.5);
    }
    else if(TIME>=10 && TIME <=19.5)
    { 
      eye = vec3(TIME,25-TIME,-TIME);ytop=9-TIME/6;bottom=-1-TIME/6;left=-10;right=0;
      //ytop=25-TIME/6;bottom=10-TIME/6;left=-10+TIME/6;right=0+TIME/6;
    }
    else //if(TIME>=19.5 && TIME <=40)
    { 
      if(TIME>=19.5 && TIME <=45){eye = vec3(-3+TIME/40,1,TIME/10);ytop=3+TIME/10;bottom=-4-TIME/10;left=-7.5+TIME/100;right=3.5+TIME/7;}//ytop=4+TIME/6;bottom=-4-TIME/6;left=-4-TIME/6;right=4+TIME/6;
    }
    //else{eye = vec3(0,1,5);ytop=6;bottom=-6;left=-6;right=6;}
    eye[1] = eye[1] + 0 ;
   
    // set the projection matrix
    projectionMatrix = ortho(left, right, bottom, ytop, near, far);
    
    // set the camera matrix
    viewMatrix = lookAt(eye, at , up);

    
    // initialize the modeling matrix stack
    MS= [] ;
    modelMatrix = mat4() ;
    
    // apply the slider rotations
    gRotate(RZ,0,0,1) ;
    gRotate(RY,0,1,0) ;
    gRotate(RX,1,0,0) ;
    
    // send all the matrices to the shaders
    setAllMatrices() ;
    
    // get real time
    var curTime ;
    if( animFlag )
    {
        curTime = (new Date()).getTime() /1000 ;
        if( resetTimerFlag ) {
            prevTime = curTime ;
            resetTimerFlag = false ;
        }
        TIME = TIME + curTime - prevTime ;
        prevTime = curTime ;
    }
    
      
    var currentTime = (new Date()).getTime() /1000;    
    ++fps;
    if( currentTime - lastTime > 1.0 )
    { 
        if(Math.floor(TIME)==tenth){console.log("Frames Per Second in " + TIME + " seconds is " + fps);tenth=tenth+10;}
        lastTime = currentTime;
        fps = 0;
    }
    
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[0].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture1"), 0);
    
   /* gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[1].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture2"), 1);
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, textureArray[2].textureWebGL);
    gl.uniform1i(gl.getUniformLocation(program, "texture3"), 2);*/
    

    //Bowling Platform ==============================================================================
     //Plot1
    gPush() ;
    {
        gTranslate(-2.3,-2.8,-2.8) ;
        gScale(1.7,0.02,-4.7);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCube() ;
    }
    gPop() ;
    
     //Plot2
    gPush() ;
    {
        gTranslate(2.3,-2.8,-2.8) ;
        gScale(1.8,0.02,-4.7);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCube() ;
    }
    gPop() ;
   useTextures = 1 - useTextures ;
   gl.uniform1i( gl.getUniformLocation(program,"useTextures"), useTextures ); 

   drawRoom();
   drawPipes();
   drawBench();
   drawBallStorage();
   
   animation();   
   
   useTextures = 1 + useTextures ;
   gl.uniform1i( gl.getUniformLocation(program,"useTextures"), useTextures ); 
  
    if( animFlag )
        window.requestAnimFrame(render);
}

function animation()
{ 

	drawRollingBall();
	if(TIME<=3.6){
	gTranslate(0,-1.4,0);gTranslate(0,0.4*TIME,0);drawLeftBowlingPinRow1();drawLeftBowlingPinRow2();
        drawLeftBowlingPinRow3(); gTranslate(0,1.4,0);}  
	else{drawLeftBowlingPinRow1();drawLeftBowlingPinRow2(); drawLeftBowlingPinRow3();}
	
	if(TIME>=4 && TIME<=8.6){
	gTranslate(0,-2.2,0);
	gTranslate(0,TIME/4,0);drawRightBowlingPinRow1();drawRightBowlingPinRow2(); drawRightBowlingPinRow3(); gTranslate(0,2.1,0);}
	if(TIME>=8.6&& TIME<=25.7){drawRightBowlingPinRow1();drawRightBowlingPinRow2(); drawRightBowlingPinRow3();}

	if(TIME<=20){
  	 gTranslate(0,20,0);
  	 gTranslate(0,-TIME,0);
  	 drawHumanBody();
   	 drawParashute();}
  	 else{
		if(TIME<=25.7)
		{drawHumanBody();}
		else{ gPush();{gTranslate(0,0.25*(Math.sin(4*TIME)),0);gTranslate(0,0.25,0);drawHumanBody();}gPop();}
         	if(TIME>=25.7){gPush();{gTranslate(0,0,-1);drawHitRightBowlingPinRow3();drawHitRightBowlingPinRow2();drawHitRightBowlingPinRow1();}gPop();}
  	     }
             // if(TIME>=25.7 && TIME<=35){ gTranslate(0,0.5,0);drawHumanBody();}
   	     //if(TIME>=20 && TIME<=35){gTranslate(0,-2,0);gTranslate(0,TIME/9,0);drawParashute();}  ;
}

function drawParashute()
{
 gPush() ;
    {
        gTranslate(0.73,0.87,4.8) ;
	gRotate(30,0,0,1);
        gScale(0.1,0.8,0.07,1);
        setColor(vec4(0.827,0.827,0.827,1.0)) ;
	gTranslate(2.3,-1,5) ;
        drawCube() ;
    }
    gPop();
    gPush() ;
    {
        gTranslate(3.43,1.15,4.8) ;
	gRotate(-30,0,0,1);
        gScale(0.1,0.8,0.07,1);
        setColor(vec4(0.827,0.827,0.827,1.0)) ;
	gTranslate(2.3,-1,5) ;
        drawCube() ;
    }
    gPop(); 

    gPush() ;
    {
        gTranslate(0,2,0) ;
	gRotate(90,90,0,0);
        gScale(1.8,1.8,-1.8,1);
        setColor(vec4(0.0,0.0,1.0,1.0)) ;
	gTranslate(1.25,2.8,-0.10) ;
        drawCone() ;
    }
    gPop(); 
}


function drawHumanBody()
{  gTranslate(0,-0.40,0) ; {
    // Body--------------------------------------
    gPush() ;
    {
        gTranslate(2.3,-1,5) ;
        gScale(0.5,0.6,0.25,1);
        setColor(vec4(1.0,0.0,0.0,1.0)) ;
        drawCube() ;
    }
    gPop() ;
     // Head--------------------------------------
     gPush() ;
    {
        gTranslate(1.6,0,4.3) ;
        gScale(0.3,0.3,0.15,1);
        setColor(vec4(0.0,1.0,0.0,1.0)) ;
	gTranslate(2.3,-1,5) ;
        drawCube() ;
    }
    gPop() ;
    
    // Right Hand--------------------------------------
    gPush() ;
    {   if(TIME <=26.2){
        gTranslate(2.65,-0.7,4.3) ;
        gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(2.3,-1,5) ;
        drawCube() ;}else{gTranslate(3.07,-0.2,4.3) ;gRotate(150,0,0,1) ; gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(0,0.4,4.4) ;drawCube() ;}
    }
    gPop() ;
     // Left Hand--------------------------------------
    gPush() ;
    {
        if(TIME <=26.20){
        gTranslate(1.45,-0.7,4.3) ;
        gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(2.3,-1,5) ;
        drawCube() ;}else{gTranslate(1.53,-0.2,4.3) ;gRotate(-150,0,0,1) ; gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(0,0.4,4.4) ;drawCube() ;}
    }
    gPop() ;
     // Right Leg--------------------------------------
     gPush() ;
    {   if(TIME <=20.2){
        gTranslate(2.45,-1.6,4.3) ;
        gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(0,-1.0,5) ;
        drawCube() ;}else if(TIME >=20.2 && TIME <=21.2 ){ gTranslate(2.45,-1.6,4.2) ;gRotate(30,30,0,1) ; gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(0,0.4,4.4) ;drawCube() ;}else{gTranslate(2.45,-1.6,4.3) ;
        gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(0,-1.0,5) ;
        drawCube() ;}
    }
    gPop() ;
    // Left Leg--------------------------------------
     gPush() ;
    {
        gTranslate(2.05,-1.6,4.3) ;
        gScale(0.1,0.4,0.15,1);
        setColor(vec4(1.0,1.0,0.0,1.0)) ;
	gTranslate(0,-1.0,5) ;
        drawCube() ;
    }
    gPop() ;}

}


function drawRollingBall()
{    
      var x;
      gPush();
      { if(TIME>=0 && TIME <= 20.4){
        gTranslate(2.3,-2.35,4.5) ;
        gScale(0.5,0.5,0.5);
        setColor(vec4(0.35,0.35,0.35,1.0)) ;
        drawSphere();}
	else if(TIME>=20.4 && TIME <= 25.7){
        gTranslate(0,-2.35,38.5) ;
        gTranslate(2.3,0,5*-TIME/3) ;gScale(0.5,0.5,0.5);
        setColor(vec4(0.35,0.35,0.35,1.0)) ;
        drawSphere();}
       if(TIME >= 25.7){gTranslate(2.3,-2.35,-4.4) ;gScale(0.5,0.5,0.5);
        setColor(vec4(0.35,0.35,0.35,1.0)) ;
        drawSphere();
      }  
      }
      gPop();
}

function drawRoom()
{
     //floor
    gPush() ;
    {
        gTranslate(0,-3.5,-1) ;
        gScale(5,0.7,-6.5);
        setColor(vec4(0.63,0.28,0.10,1.0)) ;
        drawCube() ;
    }
    gPop() ;

    //wall1
    gPush() ;
    {
        gTranslate(0,-0.2,-7.7) ;
        gScale(5,3.0,0.2);
        setColor(vec4(0.3,0.8,1.0,1.0)) ;
        drawCube() ;
    }
    gPop() ;

    //Board wall2
    gPush() ;
    {
        gTranslate(0,0.8,-6.8) ;
        gScale(5,2.0,0.7);
        setColor(vec4(0.827,0.827,0.827,1.0)) ;
        drawCube() ;
    }
    gPop() ;
}

function drawPipes()
{
   //Pipe1
   gPush() ;
    {
        gTranslate(-4.5,-2.8,-2.1) ;
        gScale(0.92,-0.7,-8);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

   //Connecting - Pipe1
   gPush() ;
    {
        gTranslate(-4.5,-2.32,-6.8) ;
        gRotate(30,90,0,0.8);
        gScale(0.92,-0.7,-2);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    //Pipe2
    gPush() ;
    {
        gTranslate(-0.05,-2.8,-2.1) ;
        gScale(1.1,-0.7,-8);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    //Connecting - Pipe2
   gPush() ;
    {
        gTranslate(-0.05,-2.32,-6.8) ;
        gRotate(30,90,0,0.8);
        gScale(1.1,-0.7,-2);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    //Pipe3
   gPush() ;
    {
        gTranslate(4.5,-2.8,-2.1) ;
        gScale(0.85,-0.7,-8);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    //Connecting - Pipe3
   gPush() ;
    {
        gTranslate(4.5,-2.32,-6.8) ;
        gRotate(30,90,0,0.8);
        gScale(0.85,-0.7,-2);
        setColor(vec4(0.68,0.68,0.68,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;
}

function drawBench()
{
    //Bench =========================================================================================

    //BenchUP
    gPush() ;
    {
        gTranslate(-4.5,-1.2,4.5) ;
        gScale(0.2,0.5,1);
        setColor(vec4(1.0,0,0,1.0)) ;
        drawCube() ;
    }
    gPop() ;

    //BenchUpLeg
    gPush() ;
    {
        gTranslate(-4,-2.2,4) ;
	gRotate(90,90,0,1);
        gScale(0.5,0.5,1.25);
        setColor(vec4(0.0,0.0,0.0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;
    
    //BenchDown
    gPush() ;
    {
        gTranslate(-3.9,-1.7,4.5) ;
        gScale(0.8,0.2,1);
        setColor(vec4(1.0,0,0,1.0)) ;
        drawCube() ;
    }
    gPop() ;

    //BenchDownLeg
    gPush() ;
    {
        gTranslate(-4,-2.2,5) ;
	gRotate(90,90,0,1);
        gScale(0.5,0.5,1.25);
        setColor(vec4(0.0,0.0,0.0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;
}


function drawBallStorage()
{
    //Ball-Storage==============================================================================

   //BallStoringUp
    gPush() ;
    {
        gTranslate(4.4,-2.2,3) ;
        gScale(0.5,0.7,0.2);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
        drawCube() ;
    }
    gPop() ;
    
    //BallStoringUpBar
    gPush() ;
    {
        gTranslate(4.1,-2.2,4) ;
        gScale(0.2,0.2,-2.0);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    //BallStoringDown
    gPush() ;
    {
        gTranslate(4.4,-2.2,5) ;
        gScale(0.5,0.7,0.2);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
        drawCube() ;
    }
    gPop() ;
   
    //BallStoringDownBar
    gPush() ;
    {
        gTranslate(4.7,-2.2,4) ;
        gScale(0.2,0.2,-2.0);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    //Stored - Balls ==============================================================================

    //Stored - Ball 1
    gPush() ;
    {
        gTranslate(4.4,-1.85,3.65) ;
        gScale(0.4,0.4,0.4);
        setColor(vec4(1.0,0.0,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

   //Stored - Ball 2
    gPush() ;
    {
        gTranslate(4.4,-1.85,4.35) ;
        gScale(0.4,0.4,0.4);
        setColor(vec4(0.0,1.0,0.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
}


function drawLeftBowlingPinRow1()
{
    //Pin Row L.1 ===========================================================================================
    gPush() ;
    {
        gTranslate(-2.4,-2.3,-4.7) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.45,-3.05,-3.67) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-2.4,-2.3,-4.7) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.88,-1.12,-3.65) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-2.4,-2.3,-4.7) ;
        drawSphere() ;
    }
    gPop() ;
}

function drawRightBowlingPinRow1()
{
    //Pin Row R.1 ===========================================================================================
    //if(TIME<=7.6 && TIME<=25){
    gPush() ;
    {
        gTranslate(2.4,-2.3,-4.7) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.45,-3.05,-3.67) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(2.4,-2.3,-4.7) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.88,-1.12,-3.65) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(2.4,-2.3,-4.7) ;
        drawSphere() ; 
    }
    gPop() ;/*}else{ gPush() ;
    {
        gTranslate(2.4,-2.3,-4.7) ;
        gRotate(90,90,90,1);
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ; gPush() ;
    {
        gTranslate(-2.4,-2.3,-4.7) ;
    }
    gPop() ;
    }*/
}

//=======================================================================

function drawHitRightBowlingPinRow1()
{
    //Pin Row R.1 ===========================================================================================
    //if(TIME<=7.6 && TIME<=25){
    gTranslate(1.3,-6,-8.5);gRotate(-150,-300,-50,1);{
    gPush() ;
    {
        gTranslate(2.4,-2.3,-4.7) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.45,-3.05,-3.67) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(2.4,-2.3,-4.7) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.88,-1.12,-3.65) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(2.4,-2.3,-4.7) ;
        drawSphere() ; 
    }
    gPop() ;}/*}else{ gPush() ;
    {
        gTranslate(2.4,-2.3,-4.7) ;
        gRotate(90,90,90,1);
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ; gPush() ;
    {
        gTranslate(-2.4,-2.3,-4.7) ;
    }
    gPop() ;
    }*/
}

function drawLeftBowlingPinRow2()
{
    //Pin Row L.2.1 ===========================================================================================
    gPush() ;
    {
        gTranslate(-3,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.8,-3.10,-4.35) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-3,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.88-0.45,-1.12,-4.17) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-3,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row L.2.2---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(-2.4,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.45,-3.05,-4.35) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-2.4,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.88,-1.12,-4.17) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-2.4,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row L.2.3---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(-1.8,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(-1.08,-3.1,-4.3) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-1.8,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.4,-1.12,-4.1) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-1.8,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;
}

function drawRightBowlingPinRow2()
{
    //Pin Row R.2.1 ===========================================================================================
    gPush() ;
    {
        gTranslate(3,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.8,-3.13,-4.35) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(3,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(2.8-0.45,-1.12,-4.17) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(3,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.2.2---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(2.4,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.45,-3.05,-4.35) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(2.4,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.88,-1.12,-4.17) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(2.4,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.2.3---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(1.8,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(1.08,-3.1,-4.3) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(1.8,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.4,-1.12,-4.1) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(1.8,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;
}

//==========================================================================================================

function drawHitRightBowlingPinRow2()
{
    //Pin Row R.2.1 ===========================================================================================
     gTranslate(0,-2,-11.4);gRotate(-150,90,0,1);{
    gPush() ;
    {
        gTranslate(3,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.8,-3.13,-4.35) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(3,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(2.8-0.45,-1.12,-4.17) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(3,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.2.2---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(2.4,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.45,-3.05,-4.35) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(2.4,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.88,-1.12,-4.17) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(2.4,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.2.3---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(1.8,-2.3,-5.3) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(1.08,-3.1,-4.3) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(1.8,-2.3,-5.3) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.4,-1.12,-4.1) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(1.8,-2.3,-5.3) ;
        drawSphere() ;
    }
    gPop() ;}
}

function drawLeftBowlingPinRow3()
{
     //Pin Row 3 ===========================================================================================

    //Pin Row L.3.1---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(-3.6,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-2.18,-3.26,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-3.6,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-2.38-0.45,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-3.6,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row L.3.2---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(-3,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.8,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-3,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.88-0.45,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-3,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row L.3.3---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(-2.4,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.45,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-2.4,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.88,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-2.4,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row L.3.4---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(-1.8,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(-1.08,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-1.8,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-1.4,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-1.8,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;
    
    //Pin Row L.3.5---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(-1.2,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(-0.72,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(-1.2,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(-0.93,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(-1.2,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;
    
}

function drawRightBowlingPinRow3()
{
     //Pin Row 3 ===========================================================================================

    //Pin Row R.3.1---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(3.6,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(2.18,-3.26,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(3.6,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(3.28-0.45,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(3.6,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.3.2---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(3,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.8,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(3,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(2.8-0.45,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(3,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.3.3---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(2.4,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.45,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(2.4,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.88,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(2.4,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.3.4---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(1.8,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(1.08,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(1.8,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.4,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(1.8,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;
    
    //Pin Row R.3.5---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(1.2,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(0.72,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(1.2,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(0.93,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(1.2,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;
    
}




//========================================================================================


function drawHitRightBowlingPinRow3()
{
     //Pin Row 3 ===========================================================================================
    gTranslate(0,+3.35,-8.2);gRotate(-90,90,0,1);{
    //Pin Row R.3.1---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(3.6,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(2.18,-3.26,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(3.6,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(3.28-0.45,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(3.6,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.3.2---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(3,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.8,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(3,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(2.8-0.45,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(3,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.3.3---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(2.4,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.45,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(2.4,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.88,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(2.4,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;

    //Pin Row R.3.4---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(1.8,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(1.08,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(1.8,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(1.4,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(1.8,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;
    
    //Pin Row R.3.5---------------------------------------------------------------------------------
    gPush() ;
    {
        gTranslate(1.2,-2.3,-5.9) ;
        gScale(0.25,0.5,0.25);
        setColor(vec4(1,1,1.0,1.0)) ;
        drawSphere() ;
    }
    gPop() ;
     
    gPush() ;
    {
        gTranslate(0.72,-3.25,-4.9) ;
        gRotate(90,90,0,1);
        gScale(0.4,0.43,0.25);
        gTranslate(1.2,-2.3,-5.9) ;
        setColor(vec4(1,0,0,1.0)) ;
        drawCylinder() ;
    }
    gPop() ;

    gPush() ;
    {
        gTranslate(0.93,-1.12,-4.6) ;
        gScale(0.22,0.22,0.22);
        setColor(vec4(1.0,1.0,1.0,1.0)) ;
	gTranslate(1.2,-2.3,-5.9) ;
        drawSphere() ;
    }
    gPop() ;}
    
}



// A simple camera controller which uses an HTML element as the event
// source for constructing a view matrix. Assign an "onchange"
// function to the controller as follows to receive the updated X and
// Y angles for the camera:
//
//   var controller = new CameraController(canvas);
//   controller.onchange = function(xRot, yRot) { ... };
//
// The view matrix is computed elsewhere.
function CameraController(element) {
    var controller = this;
    this.onchange = null;
    this.xRot = 0;
    this.yRot = 0;
    this.scaleFactor = 3.0;
    this.dragging = false;
    this.curX = 0;
    this.curY = 0;
    
    // Assign a mouse down handler to the HTML element.
    element.onmousedown = function(ev) {
        controller.dragging = true;
        controller.curX = ev.clientX;
        controller.curY = ev.clientY;
    };
    
    // Assign a mouse up handler to the HTML element.
    element.onmouseup = function(ev) {
        controller.dragging = false;
    };
    
    // Assign a mouse move handler to the HTML element.
    element.onmousemove = function(ev) {
        if (controller.dragging) {
            // Determine how far we have moved since the last mouse move
            // event.
            var curX = ev.clientX;
            var curY = ev.clientY;
            var deltaX = (controller.curX - curX) / controller.scaleFactor;
            var deltaY = (controller.curY - curY) / controller.scaleFactor;
            controller.curX = curX;
            controller.curY = curY;
            // Update the X and Y rotation angles based on the mouse motion.
            controller.yRot = (controller.yRot + deltaX) % 360;
            controller.xRot = (controller.xRot + deltaY);
            // Clamp the X rotation to prevent the camera from going upside
            // down.
            if (controller.xRot < -90) {
                controller.xRot = -90;
            } else if (controller.xRot > 90) {
                controller.xRot = 90;
            }
            // Send the onchange event to any listener.
            if (controller.onchange != null) {
                controller.onchange(controller.xRot, controller.yRot);
            }
        }
    };
}

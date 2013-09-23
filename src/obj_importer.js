var objImporter = function () {
  this.groups = {};
  this.activeGroups = { "default":this.getGroup("default") }
  this.vertexData = {
    positions:[],
    txtcoords:[],
    normals:[]
  }
}
objImporter.prototype = {
  streamData: function(stream) {
    var completed = stream.completed();
    var lines = (this.unprocessedStream + stream.getData() ).split('/n');
    if (!completed)
      this.unprocessedStream = lines.pop();
    for (var i = 0; i < lines.lenght; i++)
      processLine(lines[i]);
    if (completed)
      this.EOF();
  }
  ,
  getGroup: function(groupName) {
    var Group = function(parserObj) {
        this.positionsStride = 3;
        this.txtcoordsStride = 3;
        this.normalsStride = 3;
        this.positionsArray=[];
        this.texcoordsArray=[];
        this.normalsArray=[];
        this.indicesArray=[];
        this.map = [];
        this.parsedVertexData = parserObj.vertexData;
        this.usingTextureCoordinates = false;
        this.usingNormals = false;
    }
    Group.prototype  = {
      addFace:function(v1,v2,v3){
        this.indicesArray.push(
          this.getVertex.apply(this,v1),
          this.getVertex.apply(this,v2),
          this.getVertex.apply(this,v3));
      }
      getVertex:function(v,vt,vn){
        v = v | 0;
        vt = vt | 0;
        vn = vn | 0;

        if ( !this.map[v]) this.map[v] = {}; 
        if ( !this.map[v][vt]) this.map[v][vt] = {}; 
        if ( !this.map[v][vt][vn]) {
          var positions = this.vertexData.positions;
          var texcoords = this.vertexData.texcoords;
          var normals = this.vertexData.normals;
          var idx = ( (positionsArray.length() + this.positionsStride - 1) / this.positionsStride ) | 0  + 1;
          var posIdx = idx;
          var txtIdx = idx;
          var nrmIdx = idx;
          //var posIdx = ( (positionsArray.length() + this.positionsStride - 1) / this.positionsStride ) | 0  + 1;
          //var txtIdx = ( (txtcoordsArray.length() + this.txtcoordsStride - 1) / this.txtcoordsStride ) | 0  + 1;
          //var nrmIdx = ( (normalsArray.length() + this.normalsStride - 1) / this.normalsStride ) | 0  + 1;
          if ((v * 3 + 2) < positions.length) {
            this.positionsArray[posIdx * this.positionsStride + 0] = positions[v*3+0];
            this.positionsArray[posIdx * this.positionsStride + 1] = positions[v*3+1];
            this.positionsArray[posIdx * this.positionsStride + 2] = positions[v*3+2];
          } else throw "no!";

          if (vt >=0 && (vt * 3 + 2) < texcoords.length) {
            this.txtcoordsArray[txtIdx * this.txtcoordsStride + 0] = txtcoords[v*3+0];
            this.txtcoordsArray[txtIdx * this.txtcoordsStride + 1] = txtcoords[v*3+1];
            this.txtcoordsArray[txtIdx * this.txtcoordsStride + 2] = txtcoords[v*3+2];
            this.usingTextureCoordinates = true;
          } else txtIdx = 0;

          if (vn >=0 && (vn * 3 + 2) < normals.length) {
            this.normalsArray[nrmIdx * this.normalsStride + 0] = normals[v*3+0];
            this.normalsArray[nrmIdx * this.normalsStride + 1] = normals[v*3+1];
            this.normalsArray[nrmIdx * this.normalsStride + 2] = normals[v*3+2];
            this.usingTextureCoordinates = true;
          } else nrmIdx = 0;

          this.map[v][vt][vn] = idx;
        }
        return this.map[v][vt][vn] | 0;
      }
    }
    var g = this.groups[groupName];
    if (!g)
      g = new Group(this);
    this.groups[groupName] = g;
    return g;
  }
  ,
  processLine: function(line) {
    var tokens =
      line
      .replace(/\s+/g," ")
      .trim()
      .split(" ");
    var parseVertex = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      this.vertexData.positions.push(x,y,z);
    }
    var parseTxtCoords = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      if (isNan z) z = 0.0;
      this.vertexData.txtcoords.push(x,y,z);
      this.vertexData.usesTxtCoords = true;
    }
    var parseNormals = function(_x,_y,_z) {
      var x = parseFloat(_x);
      var y = parseFloat(_y);
      var z = parseFloat(_z);
      this.vertexData.positions.push(x,y,z);
      this.vertexData.usesNormals = true;
    }
    var parseFace = function(_v1,_v2,_v3) {
      var v1 = parseFloat(_v1);
      var v2 = parseFloat(_v2);
      var v3 = parseFloat(_v3);
      for(currentGroup in activeGroups) {
        currentGroup.addFace(v1,v2,v3);
      }
      if (arguments.length > 3)
      {
        // from [0,1,2,3,...] to [0,2,3,...]
        arguments[0] = array.prototype.shift.call(arguments);       
        parseFace.apply(this,arguments);
      }
    }
    var parseGroup = function(groupName) {
        if(arguments.length >0) {
          parseGroup.apply(this,array.prototype.slice(arguments,1));
          this.activeGroups[groupName] = this.getGroup(groupName);
        } else {
          this.activeGroups = {};
        }
    }
    switch(tokens.shift()) {
      case "v": // vertex data
        parseVertex.apply(this,tokens);
        break;
      case "vt": // texture coordinate data
        parseTxtCoords.apply(this,tokens);
        break;
      case "vn": // normal data
        parseNormals.apply(this,tokens);
        break;
      case "f": // face data (indexes)
        parseFace.apply(this,tokens);
        break;
      case "o": // defines object name
        this.objectName = tokens[0];
        break;
      case "g": // change current group in the current object
        parseGroup.apply(this,tokens); 
        break;
      case "mtllib": // name of material library file
      case "usemtl":
      case "s":
    }
  }
